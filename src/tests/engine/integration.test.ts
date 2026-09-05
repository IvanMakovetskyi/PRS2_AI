import { coordinateToSquare, createCustomPosition, hashPosition } from "../../engine";
import { GameSession } from "../../game";

describe("human game integration", () => {
  it("supports capture, undo, redo, replay, and a target win", () => {
    const session = new GameSession(
      createCustomPosition({
        pieces: [
          { square: coordinateToSquare("g7"), player: "blue", piece: "paper" },
          { square: coordinateToSquare("h8"), player: "red", piece: "rock" },
          { square: coordinateToSquare("a8"), player: "red", piece: "scissors" },
        ],
      }),
    );
    session.play(coordinateToSquare("g7"), coordinateToSquare("h8"));
    session.play(coordinateToSquare("a8"), coordinateToSquare("a7"));
    const beforeWin = hashPosition(session.position);
    session.play(coordinateToSquare("h8"), coordinateToSquare("i9"));
    expect(session.position.result).toEqual({
      type: "win",
      winner: "blue",
      reason: "target-corner",
    });
    expect(session.undo()).toBe(true);
    expect(hashPosition(session.position)).toBe(beforeWin);
    expect(session.redo()).toBe(true);
    expect(session.position.result.type).toBe("win");
    const inspected = session.inspect(1);
    expect(inspected.totalPlyCount).toBe(1);
    expect(session.livePly).toBe(3);
  });

  it("produces a 100-ply non-capture draw", () => {
    const session = new GameSession(
      createCustomPosition({
        pieces: [
          { square: coordinateToSquare("b2"), player: "blue", piece: "rock" },
          { square: coordinateToSquare("h8"), player: "red", piece: "paper" },
        ],
      }),
    );
    for (let ply = 0; ply < 100; ply += 1) {
      if (ply % 2 === 0) {
        const from = coordinateToSquare(ply % 4 === 0 ? "b2" : "c2");
        const to = coordinateToSquare(ply % 4 === 0 ? "c2" : "b2");
        session.play(from, to);
      } else {
        const from = coordinateToSquare(ply % 4 === 1 ? "h8" : "g8");
        const to = coordinateToSquare(ply % 4 === 1 ? "g8" : "h8");
        session.play(from, to);
      }
    }
    expect(session.position.noCapturePlyCount).toBe(100);
    expect(session.position.result).toEqual({ type: "draw", reason: "no-capture-limit" });
  });
});

