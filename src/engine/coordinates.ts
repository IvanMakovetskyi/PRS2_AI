import type { Square } from "./types";

export const FILES = ["a", "b", "c", "d", "e", "f", "g", "h", "i"] as const;
export const RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export function isValidSquare(square: number): square is Square {
  return Number.isInteger(square) && square >= 0 && square < 81;
}

export function squareFromFileRank(file: number, rank: number): Square {
  if (file < 0 || file >= 9 || rank < 0 || rank >= 9) {
    throw new RangeError(`Invalid board coordinate (${file}, ${rank}).`);
  }
  return rank * 9 + file;
}

export function fileOf(square: Square): number {
  assertSquare(square);
  return square % 9;
}

export function rankOf(square: Square): number {
  assertSquare(square);
  return Math.floor(square / 9);
}

export function squareToCoordinate(square: Square): string {
  assertSquare(square);
  return `${FILES[fileOf(square)]}${rankOf(square) + 1}`;
}

export function coordinateToSquare(coordinate: string): Square {
  const normalized = coordinate.trim().toLowerCase();
  if (!/^[a-i][1-9]$/.test(normalized)) {
    throw new RangeError(`Invalid square coordinate: ${coordinate}`);
  }
  const file = FILES.indexOf(normalized[0] as (typeof FILES)[number]);
  const rank = Number(normalized[1]) - 1;
  return squareFromFileRank(file, rank);
}

export function assertSquare(square: number): asserts square is Square {
  if (!isValidSquare(square)) {
    throw new RangeError(`Square ${square} is outside the 9×9 board.`);
  }
}

