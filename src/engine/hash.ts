import { serializePositionData } from "./serialization";
import type { GamePosition } from "./types";

const FNV_OFFSET = 0xcbf29ce484222325n;
const FNV_PRIME = 0x100000001b3n;
const HASH_MASK = (1n << 64n) - 1n;

/** Stable 64-bit FNV-1a hash over the canonical serialized position fields. */
export function hashPositionValue(position: Readonly<GamePosition>): bigint {
  const data = serializePositionData(position);
  const canonical = JSON.stringify(data);
  let hash = FNV_OFFSET;
  for (let index = 0; index < canonical.length; index += 1) {
    hash ^= BigInt(canonical.charCodeAt(index));
    hash = (hash * FNV_PRIME) & HASH_MASK;
  }
  return hash;
}

export function hashPosition(position: Readonly<GamePosition>): string {
  return hashPositionValue(position).toString(16).padStart(16, "0");
}
