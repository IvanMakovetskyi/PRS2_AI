import type { GamePosition, Move } from "../engine";

export interface MoveRequestContext {
  readonly legalMoves: readonly Move[];
  readonly ply: number;
  readonly signal: AbortSignal;
}

export interface PlayerController {
  readonly id: string;
  readonly name: string;
  readonly kind: "human" | "ai";
  chooseMove(position: Readonly<GamePosition>, context: MoveRequestContext): Promise<Move>;
}
