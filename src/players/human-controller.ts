import type { GamePosition, Move } from "../engine";
import type { MoveRequestContext, PlayerController } from "./player-controller";

interface PendingChoice {
  resolve: (move: Move) => void;
  reject: (reason: Error) => void;
  legalMoves: readonly Move[];
  signal: AbortSignal;
  abort: () => void;
}

export class HumanController implements PlayerController {
  readonly kind = "human" as const;
  private pending?: PendingChoice;

  constructor(
    readonly id: string,
    readonly name: string,
  ) {}

  chooseMove(_position: Readonly<GamePosition>, context: MoveRequestContext): Promise<Move> {
    if (this.pending) return Promise.reject(new Error("A human move request is already pending."));
    return new Promise<Move>((resolve, reject) => {
      const abort = () => {
        this.pending = undefined;
        reject(new DOMException("Move request aborted.", "AbortError"));
      };
      this.pending = {
        resolve,
        reject,
        legalMoves: context.legalMoves,
        signal: context.signal,
        abort,
      };
      context.signal.addEventListener("abort", abort, { once: true });
    });
  }

  submitMove(move: Move): boolean {
    if (!this.pending || this.pending.signal.aborted) return false;
    const legal = this.pending.legalMoves.some(
      (candidate) => candidate.from === move.from && candidate.to === move.to,
    );
    if (!legal) return false;
    this.pending.signal.removeEventListener("abort", this.pending.abort);
    const { resolve } = this.pending;
    this.pending = undefined;
    resolve(move);
    return true;
  }

  cancel(): void {
    if (!this.pending) return;
    this.pending.signal.removeEventListener("abort", this.pending.abort);
    this.pending.reject(new DOMException("Move request cancelled.", "AbortError"));
    this.pending = undefined;
  }
}
