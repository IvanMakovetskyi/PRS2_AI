import {
  DEFAULT_GAME_RULES,
  coordinateToSquare,
  createInitialPosition,
  deserializePosition,
  getPieceAt,
  getPieceCounts,
  hashPosition,
  populationCount,
  serializePosition,
  toSquares,
  type PiecePlacement,
} from "../../engine";
import { GameSession } from "../../game";

const expectedPlacements = [
  { coordinate: "b5", player: "blue", piece: "paper" },
  { coordinate: "c5", player: "blue", piece: "scissors" },
  { coordinate: "b4", player: "blue", piece: "rock" },
  { coordinate: "c4", player: "blue", piece: "paper" },
  { coordinate: "d4", player: "blue", piece: "scissors" },
  { coordinate: "c3", player: "blue", piece: "rock" },
  { coordinate: "d3", player: "blue", piece: "paper" },
  { coordinate: "e3", player: "blue", piece: "scissors" },
  { coordinate: "d2", player: "blue", piece: "rock" },
  { coordinate: "e2", player: "blue", piece: "paper" },
  { coordinate: "e8", player: "red", piece: "paper" },
  { coordinate: "f8", player: "red", piece: "rock" },
  { coordinate: "e7", player: "red", piece: "scissors" },
  { coordinate: "f7", player: "red", piece: "paper" },
  { coordinate: "g7", player: "red", piece: "rock" },
  { coordinate: "f6", player: "red", piece: "scissors" },
  { coordinate: "g6", player: "red", piece: "paper" },
  { coordinate: "h6", player: "red", piece: "rock" },
  { coordinate: "g5", player: "red", piece: "scissors" },
  { coordinate: "h5", player: "red", piece: "paper" },
] as const satisfies readonly (Omit<PiecePlacement, "square"> & { coordinate: string })[];

const expectedBySquare = new Map(
  expectedPlacements.map(({ coordinate, player, piece }) => [
    coordinateToSquare(coordinate),
    { player, piece },
  ]),
);

describe("initial position", () => {
  it("uses an 81-square board and the requested target corners", () => {
    expect(DEFAULT_GAME_RULES.boardSize).toBe(9);
    expect(DEFAULT_GAME_RULES.squareCount).toBe(81);
    expect(DEFAULT_GAME_RULES.targetCorners.red).toBe(coordinateToSquare("a1"));
    expect(DEFAULT_GAME_RULES.targetCorners.blue).toBe(coordinateToSquare("i9"));
  });

  it("places every starting piece at the exact requested coordinate", () => {
    const position = createInitialPosition();

    expect(new Set(expectedBySquare.keys()).size).toBe(20);
    expect(populationCount(position.occupancy)).toBe(20);
    expect(populationCount(position.blueOccupancy)).toBe(10);
    expect(populationCount(position.redOccupancy)).toBe(10);
    expect(getPieceCounts(position)).toEqual({
      blue: { rock: 3, paper: 4, scissors: 3 },
      red: { rock: 3, paper: 4, scissors: 3 },
    });

    for (const { coordinate, player, piece } of expectedPlacements) {
      expect(getPieceAt(position, coordinateToSquare(coordinate))).toEqual({ player, piece });
    }
  });

  it("leaves every unspecified square empty with no overlapping pieces", () => {
    const position = createInitialPosition();

    expect(toSquares(position.occupancy)).toHaveLength(expectedPlacements.length);
    for (let square = 0; square < DEFAULT_GAME_RULES.squareCount; square += 1) {
      expect(getPieceAt(position, square)).toEqual(expectedBySquare.get(square));
    }
  });

  it("restores the exact position on reset and preserves it through serialization", () => {
    const initial = createInitialPosition();
    const initialSerialized = serializePosition(initial);
    const session = new GameSession();

    session.play(coordinateToSquare("b5"), coordinateToSquare("b6"));
    session.restart();

    expect(serializePosition(session.position)).toBe(initialSerialized);
    const restored = deserializePosition(initialSerialized);
    expect(serializePosition(restored)).toBe(initialSerialized);
    expect(hashPosition(restored)).toBe(hashPosition(initial));
  });
});
