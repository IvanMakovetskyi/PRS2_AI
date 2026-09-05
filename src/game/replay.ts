import { applyMove, clonePosition, type GamePosition, type Move } from "../engine";

export function replayPosition(
  initialPosition: Readonly<GamePosition>,
  moves: readonly Move[],
  ply = moves.length,
): GamePosition {
  if (!Number.isInteger(ply) || ply < 0 || ply > moves.length) {
    throw new RangeError(`Replay ply ${ply} is outside 0..${moves.length}.`);
  }
  const position = clonePosition(initialPosition);
  for (let index = 0; index < ply; index += 1) {
    const move = moves[index];
    if (!move) throw new Error(`Replay is missing move ${index + 1}.`);
    applyMove(position, move);
  }
  return position;
}

