export type Player = "blue" | "red";

export type PieceType = "rock" | "paper" | "scissors";

export type Square = number;

export type GameResult =
  | { type: "ongoing" }
  | { type: "win"; winner: Player; reason: "target-corner" }
  | { type: "draw"; reason: "no-capture-limit" | "no-legal-moves" };

export interface CapturedPiece {
  player: Player;
  piece: PieceType;
}

export interface Move {
  from: Square;
  to: Square;
  player: Player;
  piece: PieceType;
  capturedPiece?: CapturedPiece;
}

export interface PiecePlacement {
  square: Square;
  player: Player;
  piece: PieceType;
}

export interface GameRules {
  readonly boardSize: 9;
  readonly squareCount: 81;
  readonly targetCorners: Readonly<Record<Player, Square>>;
  readonly noCapturePlyLimit: number;
  readonly noLegalMovesIsDraw: boolean;
  readonly startingPlayer: Player;
  readonly initialPieces: readonly PiecePlacement[];
}

/**
 * Squares 0..63 live in `low`; squares 64..80 live in the low 17 bits of `high`.
 * The object is deliberately serializable through the helpers in serialization.ts.
 */
export interface Bitboard81 {
  readonly low: bigint;
  readonly high: number;
}

export type PieceBitboards = Record<Player, Record<PieceType, Bitboard81>>;

export interface GamePosition {
  pieces: PieceBitboards;
  blueOccupancy: Bitboard81;
  redOccupancy: Bitboard81;
  occupancy: Bitboard81;
  activePlayer: Player;
  noCapturePlyCount: number;
  totalPlyCount: number;
  result: GameResult;
  rules: GameRules;
}

export interface UndoData {
  move: Move;
  previousNoCapturePlyCount: number;
  previousTotalPlyCount: number;
  previousResult: GameResult;
}

export interface SerializedBitboard {
  low: string;
  high: string;
}

export interface SerializedPosition {
  version: 1;
  pieces: Record<Player, Record<PieceType, SerializedBitboard>>;
  activePlayer: Player;
  noCapturePlyCount: number;
  totalPlyCount: number;
  result: GameResult;
  rules: {
    noCapturePlyLimit: number;
    noLegalMovesIsDraw: boolean;
    startingPlayer: Player;
    targetCorners: Record<Player, Square>;
  };
}

export interface PositionValidationError {
  code:
    | "invalid-bitboard"
    | "overlapping-pieces"
    | "invalid-player"
    | "invalid-counter"
    | "completed-position";
  message: string;
}

export interface PositionValidationResult {
  valid: boolean;
  errors: PositionValidationError[];
}

export const PLAYERS: readonly Player[] = ["blue", "red"];
export const PIECE_TYPES: readonly PieceType[] = ["rock", "paper", "scissors"];
