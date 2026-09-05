import type { GameResult, Move, Player } from "../engine";

export type GameEvent =
  | { type: "game_started"; timestamp: number }
  | { type: "move_requested"; timestamp: number; player: Player }
  | { type: "move_applied"; timestamp: number; move: Move; durationMs: number }
  | { type: "piece_captured"; timestamp: number; move: Move }
  | { type: "turn_changed"; timestamp: number; player: Player }
  | { type: "game_paused"; timestamp: number }
  | { type: "game_resumed"; timestamp: number }
  | { type: "game_ended"; timestamp: number; result: GameResult }
  | { type: "replay_position_changed"; timestamp: number; ply: number }
  | { type: "position_loaded"; timestamp: number };

export type GameEventListener = (event: GameEvent) => void;

export class GameEventStream {
  private readonly listeners = new Set<GameEventListener>();

  subscribe(listener: GameEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event: GameEvent): void {
    for (const listener of this.listeners) listener(event);
  }
}

