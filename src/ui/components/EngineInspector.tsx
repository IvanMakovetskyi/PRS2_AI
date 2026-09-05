import { ChevronDown, Gauge } from "lucide-react";
import {
  debugBitboard,
  generateLegalMoves,
  hashPosition,
  runEngineBenchmarks,
  serializePosition,
  type Bitboard81,
  type GamePosition,
} from "../../engine";
import type { GameEvent, MoveRecord } from "../../game";
import type { BoardOverlays } from "./GameBoard";

interface EngineInspectorProps {
  position: Readonly<GamePosition>;
  selectedLegal?: Bitboard81;
  selectedCaptures?: Bitboard81;
  lastEvent: GameEvent;
  lastRecord?: MoveRecord;
  moveGenerationMs: number;
  overlays: BoardOverlays;
  onOverlayChange: (name: keyof BoardOverlays, value: boolean) => void;
}

export function EngineInspector({
  position,
  selectedLegal,
  selectedCaptures,
  lastEvent,
  lastRecord,
  moveGenerationMs,
  overlays,
  onOverlayChange,
}: EngineInspectorProps) {
  const entries = [
    ["Blue · Rock", position.pieces.blue.rock],
    ["Blue · Paper", position.pieces.blue.paper],
    ["Blue · Scissors", position.pieces.blue.scissors],
    ["Red · Rock", position.pieces.red.rock],
    ["Red · Paper", position.pieces.red.paper],
    ["Red · Scissors", position.pieces.red.scissors],
    ["Blue occupancy", position.blueOccupancy],
    ["Red occupancy", position.redOccupancy],
    ["All occupancy", position.occupancy],
    ["Selected legal", selectedLegal],
    ["Capture mask", selectedCaptures],
  ] as const;
  const benchmarks = import.meta.env.DEV ? runEngineBenchmarks(100) : [];
  return (
    <details className="inspector">
      <summary>
        <span>
          <Gauge size={17} aria-hidden="true" /> Engine inspector
        </span>
        <span className="mono">{hashPosition(position)}</span>
        <ChevronDown size={17} aria-hidden="true" />
      </summary>
      <div className="inspector__body">
        <div className="overlay-controls" aria-label="Board overlays">
          {(Object.keys(overlays) as (keyof BoardOverlays)[]).map((name) => (
            <label key={name}>
              <input
                type="checkbox"
                checked={overlays[name]}
                onChange={(event) => onOverlayChange(name, event.target.checked)}
              />
              <span>{name}</span>
            </label>
          ))}
        </div>
        <div className="bitboard-grid">
          {entries.map(([label, board]) => {
            const data = debugBitboard(board ?? { low: 0n, high: 0 });
            return (
              <div className="bitboard-card" key={label}>
                <div>
                  <strong>{label}</strong>
                  <span>{data.population} bits</span>
                </div>
                <code>{data.low}</code>
                <code>{data.high}</code>
              </div>
            );
          })}
        </div>
        <div className="inspector-stats">
          <div>
            <span>Active legal moves</span>
            <strong>{generateLegalMoves(position).length}</strong>
          </div>
          <div>
            <span>Move generation</span>
            <strong>{moveGenerationMs.toFixed(3)} ms</strong>
          </div>
          <div>
            <span>Move application</span>
            <strong>{lastRecord ? `${lastRecord.applicationTimeMs.toFixed(3)} ms` : "—"}</strong>
          </div>
          <div>
            <span>Last engine event</span>
            <strong>{lastEvent.type}</strong>
          </div>
        </div>
        {import.meta.env.DEV && (
          <div className="benchmark-table">
            <h3>Development benchmarks</h3>
            {benchmarks.map((result) => (
              <div key={result.operation}>
                <span>{result.operation}</span>
                <code>{result.averageMicroseconds.toFixed(2)} µs/op</code>
              </div>
            ))}
          </div>
        )}
        <details className="serialized-disclosure">
          <summary>Current serialized position</summary>
          <pre>{serializePosition(position, 2)}</pre>
        </details>
      </div>
    </details>
  );
}
