import { clonePosition, generateLegalMoves } from "../engine";
import type { PlayerController } from "../players";
import type { GameSession } from "./game-session";

export interface GameRunnerControllers {
  blue: PlayerController;
  red: PlayerController;
}

export class GameRunner {
  private abortController?: AbortController;

  constructor(
    readonly session: GameSession,
    readonly controllers: GameRunnerControllers,
  ) {}

  async step(): Promise<void> {
    const position = this.session.position;
    if (position.result.type !== "ongoing") return;
    this.abortController = new AbortController();
    const legalMoves = generateLegalMoves(position);
    this.session.requestMove();
    const controller = this.controllers[position.activePlayer];
    const move = await controller.chooseMove(clonePosition(position), {
      legalMoves,
      ply: position.totalPlyCount,
      signal: this.abortController.signal,
    });
    if (!this.abortController.signal.aborted) this.session.play(move.from, move.to);
  }

  stop(): void {
    this.abortController?.abort();
  }
}
