import type { GamePosition, Move, Square } from "./types";
import { getPieceAt } from "./position";

export function createMove(position: Readonly<GamePosition>, from: Square, to: Square): Move {
  const moving = getPieceAt(position, from);
  if (!moving) throw new Error(`No piece occupies source square ${from}.`);
  const target = getPieceAt(position, to);
  return {
    from,
    to,
    player: moving.player,
    piece: moving.piece,
    ...(target ? { capturedPiece: target } : {}),
  };
}

export function movesEqual(left: Move, right: Move): boolean {
  return (
    left.from === right.from &&
    left.to === right.to &&
    left.player === right.player &&
    left.piece === right.piece
  );
}

