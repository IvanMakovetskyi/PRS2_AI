import {
  coordinateToSquare,
  createCustomPosition,
  deserializePosition,
  hashPosition,
  serializePosition,
} from "../../engine";
import { GameSession } from "../../game";

describe("serialization and hashing", () => {
  it("round trips a position and keeps a stable hash", () => {
    const position = createCustomPosition({
      pieces: [
        { square: 63, player: "blue", piece: "rock" },
        { square: 64, player: "red", piece: "paper" },
        { square: 80, player: "red", piece: "scissors" },
      ],
      noCapturePlyCount: 17,
      totalPlyCount: 44,
    });
    const serialized = serializePosition(position);
    const restored = deserializePosition(serialized);
    expect(serializePosition(restored)).toBe(serialized);
    expect(hashPosition(restored)).toBe(hashPosition(position));
    expect(hashPosition(position)).toMatch(/^[0-9a-f]{16}$/);
  });

  it("rejects malformed and out-of-mask bitboards", () => {
    expect(() => deserializePosition("not json")).toThrow(/valid JSON/);
    const position = JSON.parse(serializePosition(createCustomPosition())) as {
      pieces: { blue: { rock: { low: string; high: string } } };
    };
    position.pieces.blue.rock.high = "0x20000";
    expect(() => deserializePosition(position)).toThrow(/outside/);
  });

  it("exports and imports complete move history and replay cursor", () => {
    const session = new GameSession(
      createCustomPosition({
        pieces: [
          { square: coordinateToSquare("b2"), player: "blue", piece: "rock" },
          { square: coordinateToSquare("h8"), player: "red", piece: "paper" },
        ],
      }),
    );
    session.play(coordinateToSquare("b2"), coordinateToSquare("c2"));
    session.play(coordinateToSquare("h8"), coordinateToSquare("g8"));
    session.goToPly(1);
    const restored = GameSession.deserialize(session.serialize());
    expect(restored.history.map((record) => record.notation)).toEqual(
      session.history.map((record) => record.notation),
    );
    expect(restored.currentPly).toBe(1);
    expect(hashPosition(restored.position)).toBe(hashPosition(session.position));
  });
});

