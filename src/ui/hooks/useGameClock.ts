import { useEffect, useRef, useState } from "react";
import type { Player } from "../../engine";
import type { GameSession } from "../../game";

export interface GameClockState {
  elapsedMs: number;
  playerMs: Record<Player, number>;
}

export function formatDuration(milliseconds: number): string {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(seconds / 60);
  return `${minutes.toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

export function useGameClock(session: GameSession): GameClockState {
  const [state, setState] = useState<GameClockState>({
    elapsedMs: 0,
    playerMs: { blue: 0, red: 0 },
  });
  const startedAt = useRef(Date.now());
  const turnStartedAt = useRef(Date.now());
  const totals = useRef<Record<Player, number>>({ blue: 0, red: 0 });
  const active = useRef<Player>(session.position.activePlayer);
  const pausedAt = useRef<number>();

  useEffect(() => {
    startedAt.current = Date.now();
    turnStartedAt.current = Date.now();
    totals.current = { blue: 0, red: 0 };
    active.current = session.position.activePlayer;
    pausedAt.current = session.isPaused ? Date.now() : undefined;
    const unsubscribe = session.subscribe((event) => {
      const timestamp = Date.now();
      if (event.type === "move_applied") {
        totals.current[event.move.player] += timestamp - turnStartedAt.current;
        active.current = session.position.activePlayer;
        turnStartedAt.current = timestamp;
      } else if (event.type === "game_paused") {
        totals.current[active.current] += timestamp - turnStartedAt.current;
        pausedAt.current = timestamp;
      } else if (event.type === "game_resumed") {
        pausedAt.current = undefined;
        turnStartedAt.current = timestamp;
      } else if (event.type === "game_started" || event.type === "position_loaded") {
        startedAt.current = timestamp;
        turnStartedAt.current = timestamp;
        totals.current = { blue: 0, red: 0 };
        active.current = session.position.activePlayer;
      }
    });
    const interval = window.setInterval(() => {
      const currentTime = pausedAt.current ?? Date.now();
      const running = pausedAt.current === undefined && session.position.result.type === "ongoing";
      setState({
        elapsedMs: currentTime - startedAt.current,
        playerMs: {
          ...totals.current,
          ...(running
            ? {
                [active.current]:
                  totals.current[active.current] + currentTime - turnStartedAt.current,
              }
            : {}),
        },
      });
    }, 500);
    return () => {
      unsubscribe();
      window.clearInterval(interval);
    };
  }, [session]);

  return state;
}
