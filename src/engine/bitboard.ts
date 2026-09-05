import { assertSquare, fileOf, rankOf, squareFromFileRank } from "./coordinates";
import type { Bitboard81, SerializedBitboard, Square } from "./types";

export const LOW_MASK = (1n << 64n) - 1n;
export const HIGH_MASK = (1 << 17) - 1;

export const EMPTY_BITBOARD: Bitboard81 = Object.freeze({ low: 0n, high: 0 });
export const FULL_BITBOARD: Bitboard81 = Object.freeze({ low: LOW_MASK, high: HIGH_MASK });

export function bitboard(low = 0n, high = 0): Bitboard81 {
  return { low: low & LOW_MASK, high: high & HIGH_MASK };
}

export function assertValidBitboard(board: Bitboard81): void {
  if (board.low < 0n || (board.low & ~LOW_MASK) !== 0n) {
    throw new RangeError("Bitboard low word contains bits outside squares 0..63.");
  }
  if (!Number.isInteger(board.high) || board.high < 0 || (board.high & ~HIGH_MASK) !== 0) {
    throw new RangeError("Bitboard high word contains bits outside squares 64..80.");
  }
}

export function bitForSquare(square: Square): Bitboard81 {
  assertSquare(square);
  return square < 64
    ? { low: 1n << BigInt(square), high: 0 }
    : { low: 0n, high: 1 << (square - 64) };
}

export function setSquare(board: Bitboard81, square: Square): Bitboard81 {
  assertSquare(square);
  return square < 64
    ? { low: (board.low | (1n << BigInt(square))) & LOW_MASK, high: board.high & HIGH_MASK }
    : { low: board.low & LOW_MASK, high: (board.high | (1 << (square - 64))) & HIGH_MASK };
}

export function clearSquare(board: Bitboard81, square: Square): Bitboard81 {
  assertSquare(square);
  return square < 64
    ? { low: board.low & ~(1n << BigInt(square)) & LOW_MASK, high: board.high & HIGH_MASK }
    : { low: board.low & LOW_MASK, high: board.high & ~(1 << (square - 64)) & HIGH_MASK };
}

export function toggleSquare(board: Bitboard81, square: Square): Bitboard81 {
  assertSquare(square);
  return square < 64
    ? { low: (board.low ^ (1n << BigInt(square))) & LOW_MASK, high: board.high & HIGH_MASK }
    : { low: board.low & LOW_MASK, high: (board.high ^ (1 << (square - 64))) & HIGH_MASK };
}

export function hasSquare(board: Bitboard81, square: Square): boolean {
  assertSquare(square);
  return square < 64
    ? (board.low & (1n << BigInt(square))) !== 0n
    : (board.high & (1 << (square - 64))) !== 0;
}

export function andBoards(left: Bitboard81, right: Bitboard81): Bitboard81 {
  return { low: left.low & right.low, high: (left.high & right.high) & HIGH_MASK };
}

export function orBoards(left: Bitboard81, right: Bitboard81): Bitboard81 {
  return { low: (left.low | right.low) & LOW_MASK, high: (left.high | right.high) & HIGH_MASK };
}

export function xorBoards(left: Bitboard81, right: Bitboard81): Bitboard81 {
  return { low: (left.low ^ right.low) & LOW_MASK, high: (left.high ^ right.high) & HIGH_MASK };
}

export function notBoard(board: Bitboard81): Bitboard81 {
  return { low: ~board.low & LOW_MASK, high: ~board.high & HIGH_MASK };
}

export function boardsEqual(left: Bitboard81, right: Bitboard81): boolean {
  return left.low === right.low && left.high === right.high;
}

export function isEmpty(board: Bitboard81): boolean {
  return board.low === 0n && board.high === 0;
}

function popcount32(value: number): number {
  let word = value >>> 0;
  word -= (word >>> 1) & 0x55555555;
  word = (word & 0x33333333) + ((word >>> 2) & 0x33333333);
  return (((word + (word >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
}

export function populationCount(board: Bitboard81): number {
  const low32 = Number(board.low & 0xffffffffn);
  const high32 = Number((board.low >> 32n) & 0xffffffffn);
  return popcount32(low32) + popcount32(high32) + popcount32(board.high);
}

function leastBit32(value: number): number {
  const unsigned = value >>> 0;
  const isolated = (unsigned & -unsigned) >>> 0;
  return 31 - Math.clz32(isolated);
}

export function leastSignificantSquare(board: Bitboard81): Square | undefined {
  const low32 = Number(board.low & 0xffffffffn) >>> 0;
  if (low32 !== 0) return leastBit32(low32);
  const upperLow32 = Number((board.low >> 32n) & 0xffffffffn) >>> 0;
  if (upperLow32 !== 0) return 32 + leastBit32(upperLow32);
  if (board.high !== 0) return 64 + leastBit32(board.high);
  return undefined;
}

export function* occupiedSquares(board: Bitboard81): Generator<Square> {
  let remaining = bitboard(board.low, board.high);
  while (!isEmpty(remaining)) {
    const square = leastSignificantSquare(remaining);
    if (square === undefined) return;
    yield square;
    remaining = clearSquare(remaining, square);
  }
}

export function fromSquares(squares: Iterable<Square>): Bitboard81 {
  let result = EMPTY_BITBOARD;
  for (const square of squares) result = setSquare(result, square);
  return result;
}

export function toSquares(board: Bitboard81): Square[] {
  return [...occupiedSquares(board)];
}

/** Board-safe translation. Squares that cross an edge are discarded. */
export function translate(board: Bitboard81, fileDelta: number, rankDelta: number): Bitboard81 {
  let result = EMPTY_BITBOARD;
  for (const square of occupiedSquares(board)) {
    const file = fileOf(square) + fileDelta;
    const rank = rankOf(square) + rankDelta;
    if (file >= 0 && file < 9 && rank >= 0 && rank < 9) {
      result = setSquare(result, squareFromFileRank(file, rank));
    }
  }
  return result;
}

export function serializeBitboard(board: Bitboard81): SerializedBitboard {
  assertValidBitboard(board);
  return {
    low: `0x${board.low.toString(16).padStart(16, "0")}`,
    high: `0x${board.high.toString(16).padStart(5, "0")}`,
  };
}

export function deserializeBitboard(data: SerializedBitboard): Bitboard81 {
  if (!/^0x[0-9a-f]{1,16}$/i.test(data.low) || !/^0x[0-9a-f]{1,5}$/i.test(data.high)) {
    throw new TypeError("Malformed bitboard words. Expected hexadecimal low/high strings.");
  }
  const low = BigInt(data.low);
  const high = Number.parseInt(data.high.slice(2), 16);
  const result = { low, high };
  assertValidBitboard(result);
  return result;
}

export interface BitboardDebugData extends SerializedBitboard {
  lowBinary: string;
  highBinary: string;
  population: number;
  squares: Square[];
}

export function debugBitboard(board: Bitboard81): BitboardDebugData {
  const serialized = serializeBitboard(board);
  return {
    ...serialized,
    lowBinary: board.low.toString(2).padStart(64, "0"),
    highBinary: board.high.toString(2).padStart(17, "0"),
    population: populationCount(board),
    squares: toSquares(board),
  };
}

