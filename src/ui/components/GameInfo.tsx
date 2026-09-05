import {
  generateLegalMoves,
  getPieceAt,
  getPieceCounts,
  hashPosition,
  squareToCoordinate,
  type GamePosition,
  type Move,
  type Square,
} from "../../engine";
import type { GameClockState } from "../hooks/useGameClock";
import { formatDuration } from "../hooks/useGameClock";
import { Panel } from "./Panel";

interface GameInfoProps {
  position: Readonly<GamePosition>;
  initialPosition: Readonly<GamePosition>;
  selected?: Square;
  lastMove?: Move;
  clock: GameClockState;
}

function resultLabel(position: Readonly<GamePosition>): string {
  if (position.result.type === "ongoing") return "Game in progress";
  if (position.result.type === "win") return `${position.result.winner} wins · target corner`;
  return position.result.reason === "no-capture-limit"
    ? "Draw · 100 plies without capture"
    : "Draw · no legal moves";
}

export function GameInfo({ position, initialPosition, selected, lastMove, clock }: GameInfoProps) {
  const counts = getPieceCounts(position);
  const initialCounts = getPieceCounts(initialPosition);
  const selectedPiece = selected === undefined ? undefined : getPieceAt(position, selected);
  const legalCount = generateLegalMoves(position).length;
  return (
    <Panel
      title="Live position"
      eyebrow="Game state"
      action={
        <span className={`turn-chip turn-chip--${position.activePlayer}`}>
          <i className={`side-dot side-dot--${position.activePlayer}`} />
          {position.activePlayer} to move
        </span>
      }
    >
      <p className={`result-line result-line--${position.result.type}`}>{resultLabel(position)}</p>
      <dl className="metric-grid">
        <div>
          <dt>Total ply</dt>
          <dd>{position.totalPlyCount}</dd>
        </div>
        <div>
          <dt>No capture</dt>
          <dd>
            {position.noCapturePlyCount} / {position.rules.noCapturePlyLimit}
          </dd>
        </div>
        <div>
          <dt>Legal moves</dt>
          <dd>{legalCount}</dd>
        </div>
        <div>
          <dt>Elapsed</dt>
          <dd>{formatDuration(clock.elapsedMs)}</dd>
        </div>
        <div>
          <dt>Blue clock</dt>
          <dd>{formatDuration(clock.playerMs.blue)}</dd>
        </div>
        <div>
          <dt>Red clock</dt>
          <dd>{formatDuration(clock.playerMs.red)}</dd>
        </div>
      </dl>
      <div className="piece-ledger">
        {(["blue", "red"] as const).map((player) => (
          <div key={player} className="piece-ledger__side">
            <span className={`side-name side-name--${player}`}>{player}</span>
            <span>R {counts[player].rock}</span>
            <span>P {counts[player].paper}</span>
            <span>S {counts[player].scissors}</span>
            <span className="muted">
              captured R {Math.max(0, initialCounts[player].rock - counts[player].rock)} · P{" "}
              {Math.max(0, initialCounts[player].paper - counts[player].paper)} · S{" "}
              {Math.max(0, initialCounts[player].scissors - counts[player].scissors)}
            </span>
          </div>
        ))}
      </div>
      <dl className="detail-list">
        <div>
          <dt>Last move</dt>
          <dd>
            {lastMove
              ? `${squareToCoordinate(lastMove.from)} → ${squareToCoordinate(lastMove.to)}`
              : "—"}
          </dd>
        </div>
        <div>
          <dt>Selected</dt>
          <dd>{selected === undefined ? "—" : squareToCoordinate(selected)}</dd>
        </div>
        <div>
          <dt>Piece</dt>
          <dd>{selectedPiece ? `${selectedPiece.player} ${selectedPiece.piece}` : "—"}</dd>
        </div>
        <div>
          <dt>Position hash</dt>
          <dd className="mono hash-value">{hashPosition(position)}</dd>
        </div>
      </dl>
    </Panel>
  );
}
