import { assertValidBitboard, boardsEqual, EMPTY_BITBOARD, orBoards } from "./bitboard";
import { allPieceBoardEntries } from "./constants";
import { calculateGameResult } from "./game-status";
import type { GamePosition, PositionValidationError, PositionValidationResult } from "./types";

export interface ValidationOptions {
  allowCompleted?: boolean;
}

export function validatePosition(
  position: Readonly<GamePosition>,
  options: ValidationOptions = {},
): PositionValidationResult {
  const errors: PositionValidationError[] = [];
  const entries = allPieceBoardEntries(position.pieces);
  for (const entry of entries) {
    try {
      assertValidBitboard(entry.board);
    } catch {
      errors.push({
        code: "invalid-bitboard",
        message: `${entry.player} ${entry.piece} contains squares outside the 81-square board.`,
      });
    }
  }

  let seen = EMPTY_BITBOARD;
  for (const entry of entries) {
    const combined = orBoards(seen, entry.board);
    if (
      !boardsEqual(combined, {
        low: seen.low ^ entry.board.low,
        high: seen.high ^ entry.board.high,
      })
    ) {
      errors.push({
        code: "overlapping-pieces",
        message: `At least one square is occupied more than once (found at ${entry.player} ${entry.piece}).`,
      });
      break;
    }
    seen = combined;
  }

  const activePlayer: unknown = position.activePlayer;
  if (activePlayer !== "blue" && activePlayer !== "red") {
    errors.push({ code: "invalid-player", message: "Active player must be blue or red." });
  }
  if (
    !Number.isInteger(position.noCapturePlyCount) ||
    position.noCapturePlyCount < 0 ||
    !Number.isInteger(position.totalPlyCount) ||
    position.totalPlyCount < 0
  ) {
    errors.push({
      code: "invalid-counter",
      message: "Ply counters must be non-negative whole numbers.",
    });
  }
  if (!options.allowCompleted && errors.length === 0) {
    const result = calculateGameResult({ ...position, result: { type: "ongoing" } });
    if (result.type !== "ongoing") {
      errors.push({
        code: "completed-position",
        message:
          "The edited position is already complete. Move a target piece or lower the draw counter.",
      });
    }
  }
  return { valid: errors.length === 0, errors };
}
