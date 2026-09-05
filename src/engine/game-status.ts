import { hasSquare } from "./bitboard";
import { hasAnyLegalMove } from "./move-generation";
import type { GamePosition, GameResult } from "./types";

export function calculateGameResult(position: Readonly<GamePosition>): GameResult {
  for (const player of ["blue", "red"] as const) {
    const target = position.rules.targetCorners[player];
    if (hasSquare(position.blueOccupancy, target) && player === "blue") {
      return { type: "win", winner: "blue", reason: "target-corner" };
    }
    if (hasSquare(position.redOccupancy, target) && player === "red") {
      return { type: "win", winner: "red", reason: "target-corner" };
    }
  }
  if (position.noCapturePlyCount >= position.rules.noCapturePlyLimit) {
    return { type: "draw", reason: "no-capture-limit" };
  }
  if (position.rules.noLegalMovesIsDraw && !hasAnyLegalMove(position)) {
    return { type: "draw", reason: "no-legal-moves" };
  }
  return { type: "ongoing" };
}

export function getGameResult(position: Readonly<GamePosition>): GameResult {
  return position.result.type === "ongoing"
    ? calculateGameResult(position)
    : { ...position.result };
}
