import {
  clearSquare,
  EMPTY_BITBOARD,
  hasSquare,
  orBoards,
  populationCount,
  setSquare,
} from "./bitboard";
import { cloneRules, createEmptyPieceBitboards, DEFAULT_GAME_RULES } from "./constants";
import type {
  Bitboard81,
  GamePosition,
  GameRules,
  PieceBitboards,
  PiecePlacement,
  PieceType,
  Player,
  Square,
} from "./types";
import { PIECE_TYPES } from "./types";

export interface CustomPositionOptions {
  pieces?: readonly PiecePlacement[];
  activePlayer?: Player;
  noCapturePlyCount?: number;
  totalPlyCount?: number;
  rules?: GameRules;
}

export function opponentOf(player: Player): Player {
  return player === "blue" ? "red" : "blue";
}

export function calculatePlayerOccupancy(pieces: PieceBitboards, player: Player): Bitboard81 {
  return orBoards(orBoards(pieces[player].rock, pieces[player].paper), pieces[player].scissors);
}

export function refreshOccupancy(position: GamePosition): void {
  position.blueOccupancy = calculatePlayerOccupancy(position.pieces, "blue");
  position.redOccupancy = calculatePlayerOccupancy(position.pieces, "red");
  position.occupancy = orBoards(position.blueOccupancy, position.redOccupancy);
}

export function createCustomPosition(options: CustomPositionOptions = {}): GamePosition {
  const rules = cloneRules(options.rules ?? DEFAULT_GAME_RULES);
  const pieces = createEmptyPieceBitboards();
  for (const placement of options.pieces ?? []) {
    pieces[placement.player][placement.piece] = setSquare(
      pieces[placement.player][placement.piece],
      placement.square,
    );
  }
  const blueOccupancy = calculatePlayerOccupancy(pieces, "blue");
  const redOccupancy = calculatePlayerOccupancy(pieces, "red");
  return {
    pieces,
    blueOccupancy,
    redOccupancy,
    occupancy: orBoards(blueOccupancy, redOccupancy),
    activePlayer: options.activePlayer ?? rules.startingPlayer,
    noCapturePlyCount: options.noCapturePlyCount ?? 0,
    totalPlyCount: options.totalPlyCount ?? 0,
    result: { type: "ongoing" },
    rules,
  };
}

export function createInitialPosition(rules: GameRules = DEFAULT_GAME_RULES): GamePosition {
  return createCustomPosition({
    pieces: rules.initialPieces,
    activePlayer: rules.startingPlayer,
    rules,
  });
}

export function clonePosition(position: Readonly<GamePosition>): GamePosition {
  const pieces = createEmptyPieceBitboards();
  for (const player of ["blue", "red"] as const) {
    for (const piece of PIECE_TYPES) {
      const board = position.pieces[player][piece];
      pieces[player][piece] = { low: board.low, high: board.high };
    }
  }
  return {
    pieces,
    blueOccupancy: { ...position.blueOccupancy },
    redOccupancy: { ...position.redOccupancy },
    occupancy: { ...position.occupancy },
    activePlayer: position.activePlayer,
    noCapturePlyCount: position.noCapturePlyCount,
    totalPlyCount: position.totalPlyCount,
    result: { ...position.result },
    rules: cloneRules(position.rules),
  };
}

export interface PieceAtSquare {
  player: Player;
  piece: PieceType;
}

export function getPieceAt(
  position: Readonly<GamePosition>,
  square: Square,
): PieceAtSquare | undefined {
  if (!hasSquare(position.occupancy, square)) return undefined;
  for (const player of ["blue", "red"] as const) {
    for (const piece of PIECE_TYPES) {
      if (hasSquare(position.pieces[player][piece], square)) return { player, piece };
    }
  }
  return undefined;
}

export function getPieceCounts(position: Readonly<GamePosition>) {
  return {
    blue: {
      rock: populationCount(position.pieces.blue.rock),
      paper: populationCount(position.pieces.blue.paper),
      scissors: populationCount(position.pieces.blue.scissors),
    },
    red: {
      rock: populationCount(position.pieces.red.rock),
      paper: populationCount(position.pieces.red.paper),
      scissors: populationCount(position.pieces.red.scissors),
    },
  };
}

export function positionPlacements(position: Readonly<GamePosition>): PiecePlacement[] {
  const placements: PiecePlacement[] = [];
  for (let square = 0; square < 81; square += 1) {
    const occupant = getPieceAt(position, square);
    if (occupant) placements.push({ square, ...occupant });
  }
  return placements;
}

export function emptyOccupancy(): Bitboard81 {
  return EMPTY_BITBOARD;
}

export function placePiece(
  position: Readonly<GamePosition>,
  square: Square,
  player: Player,
  piece: PieceType,
): GamePosition {
  const next = removePiece(position, square);
  next.pieces[player][piece] = setSquare(next.pieces[player][piece], square);
  refreshOccupancy(next);
  next.result = { type: "ongoing" };
  return next;
}

export function removePiece(position: Readonly<GamePosition>, square: Square): GamePosition {
  const next = clonePosition(position);
  const occupant = getPieceAt(next, square);
  if (occupant) {
    next.pieces[occupant.player][occupant.piece] = clearSquare(
      next.pieces[occupant.player][occupant.piece],
      square,
    );
    refreshOccupancy(next);
  }
  next.result = { type: "ongoing" };
  return next;
}

export function updatePositionMetadata(
  position: Readonly<GamePosition>,
  metadata: Partial<Pick<GamePosition, "activePlayer" | "noCapturePlyCount" | "totalPlyCount">>,
): GamePosition {
  const next = clonePosition(position);
  if (metadata.activePlayer !== undefined) next.activePlayer = metadata.activePlayer;
  if (metadata.noCapturePlyCount !== undefined) next.noCapturePlyCount = metadata.noCapturePlyCount;
  if (metadata.totalPlyCount !== undefined) next.totalPlyCount = metadata.totalPlyCount;
  next.result = { type: "ongoing" };
  return next;
}
