import { applyMove, undoMove } from "./apply-move";
import { coordinateToSquare } from "./coordinates";
import { clonePosition, createCustomPosition, createInitialPosition } from "./position";
import { generateLegalMoves } from "./move-generation";
import { hashPosition } from "./hash";
import { serializePosition } from "./serialization";
import type { GamePosition, Move } from "./types";

export interface BenchmarkResult {
  operation: string;
  iterations: number;
  totalMs: number;
  averageMicroseconds: number;
}

function clock(): number {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}

function measure(operation: string, iterations: number, task: () => void): BenchmarkResult {
  const started = clock();
  for (let index = 0; index < iterations; index += 1) task();
  const totalMs = clock() - started;
  return {
    operation,
    iterations,
    totalMs,
    averageMicroseconds: (totalMs * 1000) / iterations,
  };
}

export function benchmarkMoveList(
  initial: Readonly<GamePosition>,
  moves: readonly Move[],
  iterations = 50,
): BenchmarkResult {
  return measure("complete supplied game", iterations, () => {
    const position = clonePosition(initial);
    for (const move of moves) applyMove(position, move);
  });
}

export function runEngineBenchmarks(iterations = 500): BenchmarkResult[] {
  const position = createInitialPosition();
  const move = generateLegalMoves(position)[0];
  if (!move) throw new Error("Initial position unexpectedly has no legal moves.");
  const suppliedGameStart = createCustomPosition({
    activePlayer: "blue",
    pieces: [
      { square: coordinateToSquare("h8"), player: "blue", piece: "paper" },
      { square: coordinateToSquare("a8"), player: "red", piece: "rock" },
    ],
  });
  const suppliedGame = generateLegalMoves(suppliedGameStart).filter(
    (candidate) => candidate.to === coordinateToSquare("i9"),
  );
  if (suppliedGame.length !== 1) throw new Error("Benchmark game is not a unique legal win.");
  return [
    measure("legal move generation", iterations, () => void generateLegalMoves(position)),
    measure("apply + undo", iterations, () => {
      const undo = applyMove(position, move);
      undoMove(position, undo);
    }),
    measure("position clone", iterations, () => void clonePosition(position)),
    measure("position hash", iterations, () => void hashPosition(position)),
    measure("serialization", iterations, () => void serializePosition(position)),
    benchmarkMoveList(suppliedGameStart, suppliedGame, iterations),
  ];
}
