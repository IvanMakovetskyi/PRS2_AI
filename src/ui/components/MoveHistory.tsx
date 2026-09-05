import { CircleDot, CornerDownRight } from "lucide-react";
import type { MoveRecord } from "../../game";
import { Button } from "./Button";
import { Panel } from "./Panel";

interface MoveHistoryProps {
  history: readonly MoveRecord[];
  currentPly: number;
  onInspect: (ply: number) => void;
  onReturnLive: () => void;
}

export function MoveHistory({ history, currentPly, onInspect, onReturnLive }: MoveHistoryProps) {
  const inHistory = currentPly !== history.length;
  return (
    <Panel
      title="Move history"
      eyebrow={`${history.length} plies recorded`}
      action={
        inHistory ? (
          <Button size="sm" emphasis="ghost" onClick={onReturnLive}>
            Return to live
          </Button>
        ) : undefined
      }
      className="history-panel"
    >
      {inHistory && (
        <div className="history-banner" role="status">
          <CornerDownRight size={15} aria-hidden="true" /> Viewing ply {currentPly}. Future moves
          are preserved.
        </div>
      )}
      <div className="history-list" aria-label="Recorded moves">
        <button
          type="button"
          className={`history-row ${currentPly === 0 ? "is-current" : ""}`}
          onClick={() => onInspect(0)}
        >
          <span className="history-index">0</span>
          <span>Initial position</span>
        </button>
        {history.map((record, index) => (
          <button
            type="button"
            className={`history-row ${currentPly === index + 1 ? "is-current" : ""}`}
            key={`${index}-${record.notation}`}
            onClick={() => onInspect(index + 1)}
            aria-current={currentPly === index + 1 ? "step" : undefined}
          >
            <span className="history-index">
              {Math.floor(index / 2) + 1}
              {index % 2 === 0 ? "." : "…"}
            </span>
            <span className={`history-side history-side--${record.move.player}`}>
              {record.move.player === "blue" ? "B" : "R"}
            </span>
            <span>{record.notation}</span>
            {record.move.capturedPiece ? (
              <CircleDot size={13} aria-label="Capture" />
            ) : (
              <span className="history-time">{record.applicationTimeMs.toFixed(2)} ms</span>
            )}
          </button>
        ))}
        {history.length === 0 && (
          <p className="empty-state">Select a piece and move it one square to begin the record.</p>
        )}
      </div>
    </Panel>
  );
}
