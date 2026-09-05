import { useMemo, useRef, useState } from "react";
import {
  generateLegalMoves,
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
import { EngineInspector } from "../components/EngineInspector";
import { ImportGameDialog } from "../components/ImportGameDialog";
import { MoveHistory } from "../components/MoveHistory";
import { PositionEditor } from "../components/PositionEditor";
import { StatusToast, type StatusMessage } from "../components/StatusToast";
import { useGameClock } from "../hooks/useGameClock";
import { useGameSession } from "../hooks/useGameSession";

interface PendingBranch {
  from: Square;
  to: Square;
  ply: number;
}

export function PlayPage() {
  const { session, replaceSession } = useGameSession();
  const [selected, setSelected] = useState<Square>();
  const [illegalSquare, setIllegalSquare] = useState<Square>();
  const [flipped, setFlipped] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [resetOpen, setResetOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [pendingBranch, setPendingBranch] = useState<PendingBranch>();
  const [overlays, setOverlays] = useState({
    occupancy: false,
    legal: true,
    captures: true,
    targets: true,
    indices: false,
  });
  const [status, setStatus] = useState<StatusMessage>();
  const cancelResetRef = useRef<HTMLButtonElement>(null);
  const clock = useGameClock(session);
  const masks = useMemo(
    () => (selected === undefined ? undefined : getMoveMasks(session.position, selected)),
    [selected, session.position],
  );
  const moveGenerationMs = useMemo(() => {
    const started = performance.now();
    generateLegalMoves(session.position);
    return performance.now() - started;
  }, [session.position]);
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
      setPendingBranch({ from: selected, to: square, ply: session.currentPly });
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

  const createBranch = () => {
    if (!pendingBranch) return;
    session.branchAt(pendingBranch.ply);
    const record = session.play(pendingBranch.from, pendingBranch.to);
    setPendingBranch(undefined);
    clearSelection();
    announce(`Created branch at ply ${session.currentPly - 1}. ${record.notation}`, "success");
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
            overlays={overlays}
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
            onImport={() => setImportOpen(true)}
            onExport={exportGame}
            onCopy={() => void copyPosition()}
            onEdit={() => setEditorOpen(true)}
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
      <EngineInspector
        position={session.position}
        selectedLegal={masks?.legal}
        selectedCaptures={masks?.captures}
        lastEvent={session.lastEvent}
        lastRecord={session.history[session.currentPly - 1]}
        moveGenerationMs={moveGenerationMs}
        overlays={overlays}
        onOverlayChange={(name, value) => setOverlays((current) => ({ ...current, [name]: value }))}
      />
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
      <Dialog
        open={Boolean(pendingBranch)}
        onOpenChange={(open) => {
          if (!open) setPendingBranch(undefined);
        }}
        title="Create a new branch here?"
        description={`Moves after ply ${pendingBranch?.ply ?? 0} will be removed from this line. The original export is not changed unless you export again.`}
        footer={
          <>
            <Button onClick={() => setPendingBranch(undefined)}>Keep history</Button>
            <Button intent="warning" emphasis="solid" onClick={createBranch}>
              Create branch
            </Button>
          </>
        }
      >
        <p>This move starts a new continuation from the historical position you are viewing.</p>
      </Dialog>
      <ImportGameDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={(nextSession) => {
          replaceSession(nextSession);
          clearSelection();
          announce("Game imported with its complete move history.", "success");
        }}
      />
      <PositionEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        position={session.position}
        onLoad={(position) => {
          session.loadPosition(position);
          setEditorOpen(false);
          clearSelection();
          announce("Custom position loaded as a new game.", "success");
        }}
      />
      <StatusToast message={status} />
    </>
  );
}
