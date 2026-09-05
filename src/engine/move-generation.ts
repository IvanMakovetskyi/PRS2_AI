import {
  andBoards,
  EMPTY_BITBOARD,
  hasSquare,
  isEmpty,
  notBoard,
  occupiedSquares,
  orBoards,
} from "./bitboard";
import { ADJACENCY_MASKS, CAPTURES } from "./constants";
import { assertSquare } from "./coordinates";
import { getPieceAt, opponentOf } from "./position";
import type { Bitboard81, GamePosition, Move, Square } from "./types";
import { PIECE_TYPES } from "./types";

export interface MoveMasks {
  legal: Bitboard81;
  captures: Bitboard81;
}

export function getMoveMasks(position: Readonly<GamePosition>, square: Square): MoveMasks {
  assertSquare(square);
  const moving = getPieceAt(position, square);
  if (!moving || moving.player !== position.activePlayer || position.result.type !== "ongoing") {
    return { legal: EMPTY_BITBOARD, captures: EMPTY_BITBOARD };
  }
  const adjacent = ADJACENCY_MASKS[square];
  if (!adjacent) throw new Error(`Missing adjacency mask for square ${square}.`);
  const friendly = moving.player === "blue" ? position.blueOccupancy : position.redOccupancy;
  const emptyDestinations = andBoards(adjacent, notBoard(position.occupancy));
  const opponent = opponentOf(moving.player);
  const captures = andBoards(adjacent, position.pieces[opponent][CAPTURES[moving.piece]]);
  return {
    legal: andBoards(orBoards(emptyDestinations, captures), notBoard(friendly)),
    captures,
  };
}

export function generateMovesFrom(position: Readonly<GamePosition>, square: Square): Move[] {
  const moving = getPieceAt(position, square);
  if (!moving) return [];
  const masks = getMoveMasks(position, square);
  const moves: Move[] = [];
  for (const to of occupiedSquares(masks.legal)) {
    const target = getPieceAt(position, to);
    moves.push({
      from: square,
      to,
      player: moving.player,
      piece: moving.piece,
      ...(target ? { capturedPiece: target } : {}),
    });
  }
  return moves;
}

export function generateLegalMoves(position: Readonly<GamePosition>): Move[] {
  if (position.result.type !== "ongoing") return [];
  const moves: Move[] = [];
  for (const piece of PIECE_TYPES) {
    for (const square of occupiedSquares(position.pieces[position.activePlayer][piece])) {
      moves.push(...generateMovesFrom(position, square));
    }
  }
  return moves;
}

export function isLegalMove(position: Readonly<GamePosition>, from: Square, to: Square): boolean {
  if (position.result.type !== "ongoing") return false;
  const moving = getPieceAt(position, from);
  if (!moving || moving.player !== position.activePlayer) return false;
  return hasSquare(getMoveMasks(position, from).legal, to);
}

export function hasAnyLegalMove(position: Readonly<GamePosition>): boolean {
  if (position.result.type !== "ongoing") return false;
  for (const piece of PIECE_TYPES) {
    for (const square of occupiedSquares(position.pieces[position.activePlayer][piece])) {
      if (!isEmpty(getMoveMasks(position, square).legal)) return true;
    }
  }
  return false;
}
