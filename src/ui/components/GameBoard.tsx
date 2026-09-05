import {
  EMPTY_BITBOARD,
  FILES,
  getPieceAt,
  hasSquare,
  rankOf,
  squareFromFileRank,
  squareToCoordinate,
  type Bitboard81,
  type GamePosition,
  type Move,
  type Square,
} from "../../engine";

export interface BoardOverlays {
  occupancy: boolean;
  legal: boolean;
  captures: boolean;
  targets: boolean;
  indices: boolean;
}

interface GameBoardProps {
  position: Readonly<GamePosition>;
  selected?: Square;
  legalMask?: Bitboard81;
  captureMask?: Bitboard81;
  lastMove?: Move;
  illegalSquare?: Square;
  flipped: boolean;
  disabled?: boolean;
  overlays?: BoardOverlays;
  onSquarePress: (square: Square) => void;
}

const PIECE_SYMBOL = { rock: "R", paper: "P", scissors: "S" } as const;

export function GameBoard({
  position,
  selected,
  legalMask = EMPTY_BITBOARD,
  captureMask = EMPTY_BITBOARD,
  lastMove,
  illegalSquare,
  flipped,
  disabled,
  overlays = {
    occupancy: false,
    legal: true,
    captures: true,
    targets: true,
    indices: false,
  },
  onSquarePress,
}: GameBoardProps) {
  const ranks = flipped ? [...Array(9).keys()] : [...Array(9).keys()].reverse();
  const files = flipped ? [...Array(9).keys()].reverse() : [...Array(9).keys()];
  return (
    <div className="board-shell">
      <div className="board-route" aria-hidden="true" />
      <div className="game-board" role="grid" aria-label="Rock Paper Scissors 2 board">
        {ranks.flatMap((rank) =>
          files.map((file) => {
            const square = squareFromFileRank(file, rank);
            const coordinate = squareToCoordinate(square);
            const occupant = getPieceAt(position, square);
            const isSelected = selected === square;
            const isLegal = hasSquare(legalMask, square);
            const isCapture = hasSquare(captureMask, square);
            const isLast = lastMove?.from === square || lastMove?.to === square;
            const targetPlayer =
              position.rules.targetCorners.blue === square
                ? "blue"
                : position.rules.targetCorners.red === square
                  ? "red"
                  : undefined;
            const classes = [
              "board-square",
              (file + rank) % 2 === 0 ? "board-square--light" : "board-square--dark",
              isSelected && "is-selected",
              isLast && "is-last",
              illegalSquare === square && "is-illegal",
              overlays.occupancy && occupant && "has-occupancy-overlay",
              overlays.legal && isLegal && "is-legal",
              overlays.captures && isCapture && "is-capture",
              overlays.targets && targetPlayer && `is-target is-target--${targetPlayer}`,
            ]
              .filter(Boolean)
              .join(" ");
            const label = `${coordinate}, ${
              occupant ? `${occupant.player} ${occupant.piece}` : "empty"
            }${isLegal ? (isCapture ? ", legal capture" : ", legal move") : ""}`;
            return (
              <button
                type="button"
                role="gridcell"
                key={square}
                className={classes}
                aria-label={label}
                aria-selected={isSelected}
                disabled={disabled}
                onClick={() => onSquarePress(square)}
                data-square={coordinate}
              >
                {targetPlayer && (
                  <span className="target-mark" aria-hidden="true">
                    {targetPlayer === "blue" ? "B" : "R"}
                  </span>
                )}
                {occupant && (
                  <span className={`piece piece--${occupant.player} piece--${occupant.piece}`}>
                    <span aria-hidden="true">{PIECE_SYMBOL[occupant.piece]}</span>
                    <span className="sr-only">
                      {occupant.player} {occupant.piece}
                    </span>
                  </span>
                )}
                {isLegal && !isCapture && <span className="move-dot" aria-hidden="true" />}
                {isCapture && <span className="capture-ring" aria-hidden="true" />}
                {overlays.indices && <span className="square-index">{square}</span>}
                {rankOf(square) === (flipped ? 8 : 0) && (
                  <span className="coordinate coordinate--file" aria-hidden="true">
                    {FILES[file]}
                  </span>
                )}
                {file === (flipped ? 8 : 0) && (
                  <span className="coordinate coordinate--rank" aria-hidden="true">
                    {rank + 1}
                  </span>
                )}
              </button>
            );
          }),
        )}
      </div>
      <div className="target-legend" aria-label="Target corners">
        <span>
          <i className="side-dot side-dot--red" /> Red target · a1
        </span>
        <span>
          <i className="side-dot side-dot--blue" /> Blue target · i9
        </span>
      </div>
    </div>
  );
}
