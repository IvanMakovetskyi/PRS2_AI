import {
  ADJACENCY_MASKS,
  andBoards,
  assertValidBitboard,
  bitboard,
  boardsEqual,
  clearSquare,
  EMPTY_BITBOARD,
  fromSquares,
  hasSquare,
  leastSignificantSquare,
  notBoard,
  orBoards,
  populationCount,
  setSquare,
  toSquares,
  toggleSquare,
  translate,
  xorBoards,
} from "../../engine";

describe("Bitboard81", () => {
  it("handles the 63/64 word boundary and square 80", () => {
    let board = EMPTY_BITBOARD;
    board = setSquare(board, 63);
    board = setSquare(board, 64);
    board = setSquare(board, 80);
    expect(board.low).toBe(1n << 63n);
    expect(board.high).toBe((1 << 0) | (1 << 16));
    expect(populationCount(board)).toBe(3);
    expect(toSquares(board)).toEqual([63, 64, 80]);
    expect(leastSignificantSquare(board)).toBe(63);
    board = clearSquare(board, 63);
    expect(leastSignificantSquare(board)).toBe(64);
    expect(hasSquare(toggleSquare(board, 80), 80)).toBe(false);
  });

  it("implements boolean operations limited to 81 valid bits", () => {
    const left = fromSquares([0, 64, 80]);
    const right = fromSquares([1, 64]);
    expect(toSquares(andBoards(left, right))).toEqual([64]);
    expect(toSquares(orBoards(left, right))).toEqual([0, 1, 64, 80]);
    expect(toSquares(xorBoards(left, right))).toEqual([0, 1, 80]);
    expect(populationCount(notBoard(EMPTY_BITBOARD))).toBe(81);
    expect(boardsEqual(bitboard((1n << 70n) - 1n, 1 << 18), notBoard(EMPTY_BITBOARD))).toBe(
      false,
    );
  });

  it("masks constructor input and rejects invalid raw words", () => {
    expect(bitboard((1n << 70n) - 1n, 1 << 19)).toEqual({
      low: (1n << 64n) - 1n,
      high: 0,
    });
    expect(() => assertValidBitboard({ low: 0n, high: 1 << 17 })).toThrow(/outside/);
    expect(() => assertValidBitboard({ low: 1n << 64n, high: 0 })).toThrow(/outside/);
  });

  it("translates without wrapping across rows", () => {
    expect(toSquares(translate(fromSquares([8]), 1, 0))).toEqual([]);
    expect(toSquares(translate(fromSquares([9]), -1, 0))).toEqual([]);
    expect(toSquares(translate(fromSquares([8]), 0, 1))).toEqual([17]);
  });
});

describe("precomputed adjacency", () => {
  it("has exactly the geometrically valid neighbors for every square", () => {
    for (let square = 0; square < 81; square += 1) {
      const file = square % 9;
      const rank = Math.floor(square / 9);
      const edgeCount = Number(file === 0 || file === 8) + Number(rank === 0 || rank === 8);
      const expected = edgeCount === 2 ? 3 : edgeCount === 1 ? 5 : 8;
      expect(populationCount(ADJACENCY_MASKS[square]!)).toBe(expected);
      for (const neighbor of toSquares(ADJACENCY_MASKS[square]!)) {
        expect(Math.abs((neighbor % 9) - file)).toBeLessThanOrEqual(1);
        expect(Math.abs(Math.floor(neighbor / 9) - rank)).toBeLessThanOrEqual(1);
      }
    }
  });
});

