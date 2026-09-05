import { useMemo, useRef, useState } from "react";
import {
  generateMovesFrom,
  getMoveMasks,
  getPieceAt,
  hashPosition,
  serializePosition,
  type Square,
} from "../../engine";
import { Button } from "../components/Button";
import { Dialog } from "../components/Dialog";
import { GameBoard } from "../components/GameBoard";
import { GameControls } from "../components/GameControls";
import { GameInfo } from "../components/GameInfo";
import { MoveHistory } from "../components/MoveHistory";
import { StatusToast, type StatusMessage } from "../components/StatusToast";
import { useGameClock } from "../hooks/useGameClock";
import { useGameSession } from "../hooks/useGameSession";

export function PlayPage() {
  const { session } = useGameSession();
  const [selected, setSelected] = useState<Square>();
  const [illegalSquare, setIllegalSquare] = useState<Square>();
  const [flipped, setFlipped] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [resetOpen, setResetOpen] = useState(false);
  const [status, setStatus] = useState<StatusMessage>();
  const cancelResetRef = useRef<HTMLButtonElement>(null);
  const clock = useGameClock(session);
  const masks = useMemo(
    () => (selected === undefined ? undefined : getMoveMasks(session.position, selected)),
    [selected, session.position],
  );
  const lastMove = session.history[session.currentPly - 1]?.move;

  const announce = (text: string, tone: StatusMessage["tone"] = "info") => {
    setStatus({ id: Date.now(), text, tone });
  };

  const clearSelection = () => {
    setSelected(undefined);
    setIllegalSquare(undefined);
  };

  const handleSquare = (square: Square) => {
    if (session.position.result.type !== "ongoing" || session.isPaused) return;
    const occupant = getPieceAt(session.position, square);
    if (selected === undefined) {
      if (occupant?.player === session.position.activePlayer) setSelected(square);
      else {
        setIllegalSquare(square);
        window.setTimeout(() => setIllegalSquare(undefined), 260);
      }
      return;
    }
    if (occupant?.player === session.position.activePlayer) {
      setSelected(square);
      return;
    }
    const legal = generateMovesFrom(session.position, selected).some((move) => move.to === square);
    if (!legal) {
      setIllegalSquare(square);
      window.setTimeout(() => setIllegalSquare(undefined), 260);
      return;
    }
    if (session.currentPly !== session.livePly) {
      announce("Return to live or create a branch before moving from history.", "warning");
      return;
    }
    const record = session.play(selected, square);
    announce(
      record.move.capturedPiece ? `${record.notation} · capture` : record.notation,
      "success",
    );
    clearSelection();
  };

  const restart = () => {
    session.restart();
    clearSelection();
    setResetOpen(false);
    announce("New game ready. Blue moves first.", "success");
  };

  const exportGame = () => {
    const blob = new Blob([session.serialize()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rps2-${hashPosition(session.position)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    announce("Game exported.", "success");
  };

  const copyPosition = async () => {
    try {
      await navigator.clipboard.writeText(serializePosition(session.position, 2));
      announce("Position copied to clipboard.", "success");
    } catch {
      announce("Clipboard access failed. Use Export instead.", "error");
    }
  };

  return (
    <>
      <div className="play-layout">
        <section className="board-column" aria-label="Playable board">
          <div className="board-heading">
            <div>
              <p className="eyebrow">Deterministic engine · 9×9</p>
              <h1>Corner race</h1>
            </div>
            <p className="board-heading__status">
              <span className={`turn-beacon turn-beacon--${session.position.activePlayer}`} />
              {session.isPaused ? "Game paused" : `${session.position.activePlayer} to move`}
            </p>
          </div>
          <GameBoard
            position={session.position}
            selected={selected}
            legalMask={masks?.legal}
            captureMask={masks?.captures}
            lastMove={lastMove}
            illegalSquare={illegalSquare}
            flipped={flipped}
            disabled={session.position.result.type !== "ongoing" || session.isPaused}
            onSquarePress={handleSquare}
          />
          <GameControls
            canUndo={session.currentPly > 0}
            canRedo={session.currentPly < session.livePly}
            paused={session.isPaused}
            inHistory={session.currentPly !== session.livePly}
            playbackSpeed={playbackSpeed}
            onNewGame={() => setResetOpen(true)}
            onUndo={() => {
              session.undo();
              clearSelection();
            }}
            onRedo={() => {
              session.redo();
              clearSelection();
            }}
            onRestart={() => setResetOpen(true)}
            onPauseToggle={() => (session.isPaused ? session.resume() : session.pause())}
            onFlip={() => setFlipped((value) => !value)}
            onImport={() => announce("Import panel is available in the next workspace section.")}
            onExport={exportGame}
            onCopy={() => void copyPosition()}
            onEdit={() => announce("Position editor is available in the next workspace section.")}
            onReturnLive={() => {
              session.returnToLive();
              clearSelection();
            }}
            onPlaybackSpeedChange={setPlaybackSpeed}
          />
        </section>
        <aside className="analysis-column" aria-label="Game analysis">
          <GameInfo
            position={session.position}
            initialPosition={session.initialPosition}
            selected={selected}
            lastMove={lastMove}
            clock={clock}
          />
          <MoveHistory
            history={session.history}
            currentPly={session.currentPly}
            onInspect={(ply) => {
              session.goToPly(ply);
              clearSelection();
            }}
            onReturnLive={() => {
              session.returnToLive();
              clearSelection();
            }}
          />
        </aside>
      </div>
      <Dialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Restart this game?"
        description="The current move record will be replaced. Export it first if you want to keep it."
        initialFocusRef={cancelResetRef}
        footer={
          <>
            <Button ref={cancelResetRef} onClick={() => setResetOpen(false)}>
              Keep playing
            </Button>
            <Button intent="warning" emphasis="solid" onClick={restart}>
              Restart game
            </Button>
          </>
        }
      >
        <p>You have {session.history.length} recorded plies in this game.</p>
      </Dialog>
      <StatusToast message={status} />
    </>
  );
}
