import {
  applyMove,
  CAPTURES,
  clonePosition,
  coordinateToSquare,
  createCustomPosition,
  createMove,
  generateLegalMoves,
  generateMovesFrom,
  getGameResult,
  getPieceAt,
  hashPosition,
  isLegalMove,
  serializePosition,
  undoMove,
  type PieceType,
} from "../../engine";

const b2 = coordinateToSquare("b2");
const c3 = coordinateToSquare("c3");

describe("move generation and capture rules", () => {
  it("generates empty moves and lets friendly pieces block", () => {
    const open = createCustomPosition({
      pieces: [{ square: b2, player: "blue", piece: "rock" }],
    });
    expect(generateMovesFrom(open, b2)).toHaveLength(8);
    const blocked = createCustomPosition({
      pieces: [
        { square: b2, player: "blue", piece: "rock" },
        { square: c3, player: "blue", piece: "paper" },
      ],
    });
    expect(isLegalMove(blocked, b2, c3)).toBe(false);
  });

  const pieceTypes: PieceType[] = ["rock", "paper", "scissors"];
  for (const attacker of pieceTypes) {
    for (const defender of pieceTypes) {
      const shouldCapture = CAPTURES[attacker] === defender;
      it(`${attacker} ${shouldCapture ? "captures" : "cannot capture"} ${defender}`, () => {
        const position = createCustomPosition({
          pieces: [
            { square: b2, player: "blue", piece: attacker },
            { square: c3, player: "red", piece: defender },
          ],
        });
        expect(isLegalMove(position, b2, c3)).toBe(shouldCapture);
      });
    }
  }

  it("does not wrap from i-file to a-file", () => {
    const position = createCustomPosition({
      pieces: [{ square: coordinateToSquare("i2"), player: "blue", piece: "paper" }],
    });
    expect(isLegalMove(position, coordinateToSquare("i2"), coordinateToSquare("a3"))).toBe(false);
  });
});

describe("state transitions", () => {
  it("removes captures, resets the counter, and changes turn", () => {
    const position = createCustomPosition({
      pieces: [
        { square: b2, player: "blue", piece: "rock" },
        { square: c3, player: "red", piece: "scissors" },
      ],
      noCapturePlyCount: 12,
    });
    applyMove(position, createMove(position, b2, c3));
    expect(getPieceAt(position, b2)).toBeUndefined();
    expect(getPieceAt(position, c3)).toEqual({ player: "blue", piece: "rock" });
    expect(position.noCapturePlyCount).toBe(0);
    expect(position.totalPlyCount).toBe(1);
    expect(position.activePlayer).toBe("red");
  });

  it("increments the no-capture counter and rejects illegal moves without mutation", () => {
    const position = createCustomPosition({
      pieces: [{ square: b2, player: "blue", piece: "rock" }],
      noCapturePlyCount: 4,
    });
    const before = serializePosition(position);
    expect(() => applyMove(position, createMove(position, b2, coordinateToSquare("d4")))).toThrow();
    expect(serializePosition(position)).toBe(before);
    applyMove(position, createMove(position, b2, coordinateToSquare("c2")));
    expect(position.noCapturePlyCount).toBe(5);
  });

  it("apply followed by undo restores identical position and hash", () => {
    const position = createCustomPosition({
      pieces: [
        { square: b2, player: "blue", piece: "paper" },
        { square: c3, player: "red", piece: "rock" },
      ],
    });
    const before = clonePosition(position);
    const beforeHash = hashPosition(position);
    const undo = applyMove(position, createMove(position, b2, c3));
    undoMove(position, undo);
    expect(serializePosition(position)).toBe(serializePosition(before));
    expect(hashPosition(position)).toBe(beforeHash);
  });
});

describe("game results", () => {
  it("wins only on the moving player's target corner", () => {
    const winning = createCustomPosition({
      pieces: [
        { square: coordinateToSquare("h8"), player: "blue", piece: "rock" },
        { square: coordinateToSquare("b2"), player: "red", piece: "paper" },
      ],
    });
    applyMove(winning, createMove(winning, coordinateToSquare("h8"), coordinateToSquare("i9")));
    expect(getGameResult(winning)).toEqual({
      type: "win",
      winner: "blue",
      reason: "target-corner",
    });
    expect(generateLegalMoves(winning)).toEqual([]);
    expect(() =>
      applyMove(winning, createMove(winning, coordinateToSquare("b2"), coordinateToSquare("b3"))),
    ).toThrow(/game is over/i);

    const wrongCorner = createCustomPosition({
      pieces: [
        { square: coordinateToSquare("b1"), player: "blue", piece: "rock" },
        { square: coordinateToSquare("h8"), player: "red", piece: "paper" },
      ],
    });
    applyMove(
      wrongCorner,
      createMove(wrongCorner, coordinateToSquare("b1"), coordinateToSquare("a1")),
    );
    expect(wrongCorner.result).toEqual({ type: "ongoing" });
  });

  it("draws exactly at the configured no-capture limit", () => {
    const position = createCustomPosition({
      pieces: [
        { square: b2, player: "blue", piece: "rock" },
        { square: coordinateToSquare("h8"), player: "red", piece: "paper" },
      ],
      noCapturePlyCount: 99,
    });
    expect(getGameResult(position)).toEqual({ type: "ongoing" });
    applyMove(position, createMove(position, b2, coordinateToSquare("c2")));
    expect(position.result).toEqual({ type: "draw", reason: "no-capture-limit" });
  });

  it("draws when the active player has no legal moves", () => {
    const position = createCustomPosition({
      pieces: [{ square: coordinateToSquare("h8"), player: "red", piece: "paper" }],
      activePlayer: "blue",
    });
    expect(getGameResult(position)).toEqual({ type: "draw", reason: "no-legal-moves" });
  });
});
