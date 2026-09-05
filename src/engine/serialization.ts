import { deserializeBitboard, serializeBitboard } from "./bitboard";
import { cloneRules, DEFAULT_GAME_RULES } from "./constants";
import { calculatePlayerOccupancy } from "./position";
import type {
  GamePosition,
  GameResult,
  PieceBitboards,
  PieceType,
  Player,
  SerializedBitboard,
  SerializedPosition,
} from "./types";
import { orBoards } from "./bitboard";
import { PIECE_TYPES, PLAYERS } from "./types";
import { validatePosition } from "./validation";

export function serializePositionData(position: Readonly<GamePosition>): SerializedPosition {
  const pieces = {
    blue: {
      rock: serializeBitboard(position.pieces.blue.rock),
      paper: serializeBitboard(position.pieces.blue.paper),
      scissors: serializeBitboard(position.pieces.blue.scissors),
    },
    red: {
      rock: serializeBitboard(position.pieces.red.rock),
      paper: serializeBitboard(position.pieces.red.paper),
      scissors: serializeBitboard(position.pieces.red.scissors),
    },
  };
  return {
    version: 1,
    pieces,
    activePlayer: position.activePlayer,
    noCapturePlyCount: position.noCapturePlyCount,
    totalPlyCount: position.totalPlyCount,
    result: { ...position.result },
    rules: {
      noCapturePlyLimit: position.rules.noCapturePlyLimit,
      noLegalMovesIsDraw: position.rules.noLegalMovesIsDraw,
      startingPlayer: position.rules.startingPlayer,
      targetCorners: { ...position.rules.targetCorners },
    },
  };
}

export function serializePosition(position: Readonly<GamePosition>, spacing = 0): string {
  return JSON.stringify(serializePositionData(position), null, spacing);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parsePlayer(value: unknown, label: string): Player {
  if (value !== "blue" && value !== "red") throw new TypeError(`${label} must be blue or red.`);
  return value;
}

function parseNonNegativeInteger(value: unknown, label: string): number {
  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new TypeError(`${label} must be a non-negative whole number.`);
  }
  return value as number;
}

function parseBitboard(value: unknown, label: string) {
  if (!isRecord(value) || typeof value.low !== "string" || typeof value.high !== "string") {
    throw new TypeError(`${label} is not a serialized bitboard.`);
  }
  return deserializeBitboard(value as unknown as SerializedBitboard);
}

function parseResult(value: unknown): GameResult {
  if (!isRecord(value) || typeof value.type !== "string") {
    throw new TypeError("Position result is malformed.");
  }
  if (value.type === "ongoing") return { type: "ongoing" };
  if (value.type === "win" && value.reason === "target-corner") {
    return { type: "win", winner: parsePlayer(value.winner, "Winner"), reason: "target-corner" };
  }
  if (
    value.type === "draw" &&
    (value.reason === "no-capture-limit" || value.reason === "no-legal-moves")
  ) {
    return { type: "draw", reason: value.reason };
  }
  throw new TypeError("Position result has an unsupported type or reason.");
}

export function deserializePosition(input: string | unknown): GamePosition {
  let data: unknown = input;
  if (typeof input === "string") {
    try {
      data = JSON.parse(input) as unknown;
    } catch {
      throw new TypeError("Position data is not valid JSON.");
    }
  }
  if (!isRecord(data) || data.version !== 1 || !isRecord(data.pieces) || !isRecord(data.rules)) {
    throw new TypeError("Position data is missing version, pieces, or rules.");
  }
  const pieces = {} as PieceBitboards;
  for (const player of PLAYERS) {
    const playerData = data.pieces[player];
    if (!isRecord(playerData)) throw new TypeError(`Missing ${player} piece boards.`);
    pieces[player] = {} as Record<PieceType, ReturnType<typeof parseBitboard>>;
    for (const piece of PIECE_TYPES) {
      pieces[player][piece] = parseBitboard(playerData[piece], `${player} ${piece}`);
    }
  }
  const rulesData = data.rules;
  if (!isRecord(rulesData.targetCorners)) throw new TypeError("Target corners are malformed.");
  const blueOccupancy = calculatePlayerOccupancy(pieces, "blue");
  const redOccupancy = calculatePlayerOccupancy(pieces, "red");
  const position: GamePosition = {
    pieces,
    blueOccupancy,
    redOccupancy,
    occupancy: orBoards(blueOccupancy, redOccupancy),
    activePlayer: parsePlayer(data.activePlayer, "Active player"),
    noCapturePlyCount: parseNonNegativeInteger(data.noCapturePlyCount, "No-capture counter"),
    totalPlyCount: parseNonNegativeInteger(data.totalPlyCount, "Total ply count"),
    result: parseResult(data.result),
    rules: {
      ...cloneRules(DEFAULT_GAME_RULES),
      noCapturePlyLimit: parseNonNegativeInteger(
        rulesData.noCapturePlyLimit,
        "No-capture ply limit",
      ),
      noLegalMovesIsDraw: Boolean(rulesData.noLegalMovesIsDraw),
      startingPlayer: parsePlayer(rulesData.startingPlayer, "Starting player"),
      targetCorners: {
        blue: parseNonNegativeInteger(rulesData.targetCorners.blue, "Blue target corner"),
        red: parseNonNegativeInteger(rulesData.targetCorners.red, "Red target corner"),
      },
    },
  };
  const validation = validatePosition(position, { allowCompleted: true });
  if (!validation.valid) throw new TypeError(validation.errors.map((error) => error.message).join(" "));
  return position;
}

