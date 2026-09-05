import { clearSquare, setSquare } from "./bitboard";
import { calculateGameResult } from "./game-status";
import { isLegalMove } from "./move-generation";
import { getPieceAt, opponentOf, refreshOccupancy } from "./position";
import type { GamePosition, Move, Square, UndoData } from "./types";

export class IllegalMoveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IllegalMoveError";
  }
}

function resolveLegalMove(position: Readonly<GamePosition>, from: Square, to: Square): Move {
  if (position.result.type !== "ongoing") {
    throw new IllegalMoveError("The game is over; no further moves can be applied.");
  }
  if (!isLegalMove(position, from, to)) {
    throw new IllegalMoveError(`Move ${from} → ${to} is not legal in this position.`);
  }
  const moving = getPieceAt(position, from);
  if (!moving) throw new IllegalMoveError("The source square is empty.");
  const capturedPiece = getPieceAt(position, to);
  return {
    from,
    to,
    player: moving.player,
    piece: moving.piece,
    ...(capturedPiece ? { capturedPiece } : {}),
  };
}

/** Applies a legal move in place and returns the exact data required to undo it. */
export function applyMove(position: GamePosition, move: Move): UndoData {
  const resolved = resolveLegalMove(position, move.from, move.to);
  if (move.player !== resolved.player || move.piece !== resolved.piece) {
    throw new IllegalMoveError("Move metadata does not match the piece on the source square.");
  }
  const undo: UndoData = {
    move: resolved,
    previousNoCapturePlyCount: position.noCapturePlyCount,
    previousTotalPlyCount: position.totalPlyCount,
    previousResult: { ...position.result },
  };

  const movingBoard = position.pieces[resolved.player][resolved.piece];
  position.pieces[resolved.player][resolved.piece] = setSquare(
    clearSquare(movingBoard, resolved.from),
    resolved.to,
  );
  if (resolved.capturedPiece) {
    const capturedBoard =
      position.pieces[resolved.capturedPiece.player][resolved.capturedPiece.piece];
    position.pieces[resolved.capturedPiece.player][resolved.capturedPiece.piece] = clearSquare(
      capturedBoard,
      resolved.to,
    );
  }
  refreshOccupancy(position);
  position.noCapturePlyCount = resolved.capturedPiece ? 0 : position.noCapturePlyCount + 1;
  position.totalPlyCount += 1;
  position.activePlayer = opponentOf(resolved.player);
  position.result = calculateGameResult(position);
  return undo;
}

/** Restores a position previously changed by applyMove without regenerating legal moves. */
export function undoMove(position: GamePosition, undo: UndoData): void {
  const { move } = undo;
  const movedBoard = position.pieces[move.player][move.piece];
  position.pieces[move.player][move.piece] = setSquare(clearSquare(movedBoard, move.to), move.from);
  if (move.capturedPiece) {
    const capturedBoard = position.pieces[move.capturedPiece.player][move.capturedPiece.piece];
    position.pieces[move.capturedPiece.player][move.capturedPiece.piece] = setSquare(
      capturedBoard,
      move.to,
    );
  }
  refreshOccupancy(position);
  position.activePlayer = move.player;
  position.noCapturePlyCount = undo.previousNoCapturePlyCount;
  position.totalPlyCount = undo.previousTotalPlyCount;
  position.result = { ...undo.previousResult };
}
