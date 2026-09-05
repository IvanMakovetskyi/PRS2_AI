import { squareToCoordinate } from "./coordinates";
import type { Move, PieceType } from "./types";

const PIECE_MARK: Record<PieceType, string> = {
  rock: "R",
  paper: "P",
  scissors: "S",
};

export function moveToNotation(move: Move): string {
  const separator = move.capturedPiece ? "×" : "–";
  return `${PIECE_MARK[move.piece]} ${squareToCoordinate(move.from)}${separator}${squareToCoordinate(move.to)}`;
}
