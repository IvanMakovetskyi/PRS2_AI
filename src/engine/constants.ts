import { EMPTY_BITBOARD, setSquare } from "./bitboard";
import { coordinateToSquare, squareFromFileRank } from "./coordinates";
import type { Bitboard81, GameRules, PieceBitboards, PiecePlacement } from "./types";
import { PIECE_TYPES, PLAYERS } from "./types";

export const CAPTURES = {
  rock: "scissors",
  paper: "rock",
  scissors: "paper",
} as const;

export const DEFEATED_BY = {
  rock: "paper",
  paper: "scissors",
  scissors: "rock",
} as const;

/**
 * Editable default setup. a1=0, b1=1 ... i1=8, a2=9 ... i9=80.
 * Each side starts with three of every type; opposing target corners begin defended.
 */
export const INITIAL_PIECES: readonly PiecePlacement[] = [
  { square: coordinateToSquare("a1"), player: "blue", piece: "rock" },
  { square: coordinateToSquare("b1"), player: "blue", piece: "paper" },
  { square: coordinateToSquare("c1"), player: "blue", piece: "scissors" },
  { square: coordinateToSquare("d2"), player: "blue", piece: "rock" },
  { square: coordinateToSquare("e2"), player: "blue", piece: "paper" },
  { square: coordinateToSquare("f2"), player: "blue", piece: "scissors" },
  { square: coordinateToSquare("g1"), player: "blue", piece: "rock" },
  { square: coordinateToSquare("h1"), player: "blue", piece: "paper" },
  { square: coordinateToSquare("i1"), player: "blue", piece: "scissors" },
  { square: coordinateToSquare("a9"), player: "red", piece: "rock" },
  { square: coordinateToSquare("b9"), player: "red", piece: "paper" },
  { square: coordinateToSquare("c9"), player: "red", piece: "scissors" },
  { square: coordinateToSquare("d8"), player: "red", piece: "rock" },
  { square: coordinateToSquare("e8"), player: "red", piece: "paper" },
  { square: coordinateToSquare("f8"), player: "red", piece: "scissors" },
  { square: coordinateToSquare("g9"), player: "red", piece: "rock" },
  { square: coordinateToSquare("h9"), player: "red", piece: "paper" },
  { square: coordinateToSquare("i9"), player: "red", piece: "scissors" },
];

export const DEFAULT_GAME_RULES: GameRules = Object.freeze({
  boardSize: 9,
  squareCount: 81,
  targetCorners: Object.freeze({
    blue: coordinateToSquare("i9"),
    red: coordinateToSquare("a1"),
  }),
  noCapturePlyLimit: 100,
  noLegalMovesIsDraw: true,
  startingPlayer: "blue",
  initialPieces: INITIAL_PIECES,
});

export function createEmptyPieceBitboards(): PieceBitboards {
  return {
    blue: { rock: EMPTY_BITBOARD, paper: EMPTY_BITBOARD, scissors: EMPTY_BITBOARD },
    red: { rock: EMPTY_BITBOARD, paper: EMPTY_BITBOARD, scissors: EMPTY_BITBOARD },
  };
}

function createAdjacencyMasks(): readonly Bitboard81[] {
  const masks: Bitboard81[] = [];
  for (let rank = 0; rank < 9; rank += 1) {
    for (let file = 0; file < 9; file += 1) {
      let mask = EMPTY_BITBOARD;
      for (let rankDelta = -1; rankDelta <= 1; rankDelta += 1) {
        for (let fileDelta = -1; fileDelta <= 1; fileDelta += 1) {
          if (rankDelta === 0 && fileDelta === 0) continue;
          const nextFile = file + fileDelta;
          const nextRank = rank + rankDelta;
          if (nextFile >= 0 && nextFile < 9 && nextRank >= 0 && nextRank < 9) {
            mask = setSquare(mask, squareFromFileRank(nextFile, nextRank));
          }
        }
      }
      masks.push(Object.freeze(mask));
    }
  }
  return Object.freeze(masks);
}

export const ADJACENCY_MASKS = createAdjacencyMasks();

export function cloneRules(rules: GameRules): GameRules {
  return {
    boardSize: 9,
    squareCount: 81,
    targetCorners: { ...rules.targetCorners },
    noCapturePlyLimit: rules.noCapturePlyLimit,
    noLegalMovesIsDraw: rules.noLegalMovesIsDraw,
    startingPlayer: rules.startingPlayer,
    initialPieces: rules.initialPieces.map((placement) => ({ ...placement })),
  };
}

export function allPieceBoardEntries(pieceBoards: PieceBitboards) {
  return PLAYERS.flatMap((player) =>
    PIECE_TYPES.map((piece) => ({ player, piece, board: pieceBoards[player][piece] })),
  );
}

