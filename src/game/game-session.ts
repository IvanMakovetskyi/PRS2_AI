import {
  applyMove,
  clonePosition,
  createInitialPosition,
  createMove,
  deserializePosition,
  hashPosition,
  moveToNotation,
  serializePositionData,
  type GamePosition,
  type Move,
  type SerializedPosition,
  type Square,
  type UndoData,
  undoMove,
} from "../engine";
import { GameEventStream, type GameEvent, type GameEventListener } from "./events";
import { replayPosition } from "./replay";

export interface MoveRecord {
  move: Move;
  notation: string;
  undo: UndoData;
  applicationTimeMs: number;
  positionHash: string;
}

export interface SerializedGame {
  version: 1;
  initialPosition: SerializedPosition;
  moves: Move[];
  currentPly: number;
}

export class BranchRequiredError extends Error {
  constructor() {
    super("A move from history requires creating a new branch first.");
    this.name = "BranchRequiredError";
  }
}

function now(): number {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}

export class GameSession {
  private initial: GamePosition;
  private current: GamePosition;
  private records: MoveRecord[] = [];
  private cursor = 0;
  private paused = false;
  private readonly stream = new GameEventStream();
  private lastEventValue: GameEvent;

  constructor(position: GamePosition = createInitialPosition()) {
    this.initial = clonePosition(position);
    this.current = clonePosition(position);
    this.lastEventValue = { type: "game_started", timestamp: now() };
  }

  get position(): Readonly<GamePosition> {
    return this.current;
  }

  get history(): readonly MoveRecord[] {
    return this.records;
  }

  get currentPly(): number {
    return this.cursor;
  }

  get livePly(): number {
    return this.records.length;
  }

  get isPaused(): boolean {
    return this.paused;
  }

  get lastEvent(): GameEvent {
    return this.lastEventValue;
  }

  subscribe(listener: GameEventListener): () => void {
    return this.stream.subscribe(listener);
  }

  private emit(event: GameEvent): void {
    this.lastEventValue = event;
    this.stream.emit(event);
  }

  requestMove(): void {
    this.emit({ type: "move_requested", timestamp: now(), player: this.current.activePlayer });
  }

  play(from: Square, to: Square): MoveRecord {
    if (this.paused) throw new Error("The game is paused.");
    if (this.cursor !== this.records.length) throw new BranchRequiredError();
    const move = createMove(this.current, from, to);
    const started = now();
    const undo = applyMove(this.current, move);
    const duration = now() - started;
    const record: MoveRecord = {
      move: undo.move,
      notation: moveToNotation(undo.move),
      undo,
      applicationTimeMs: duration,
      positionHash: hashPosition(this.current),
    };
    this.records.push(record);
    this.cursor += 1;
    this.emit({ type: "move_applied", timestamp: now(), move: record.move, durationMs: duration });
    if (record.move.capturedPiece) {
      this.emit({ type: "piece_captured", timestamp: now(), move: record.move });
    }
    if (this.current.result.type === "ongoing") {
      this.emit({ type: "turn_changed", timestamp: now(), player: this.current.activePlayer });
    } else {
      this.emit({ type: "game_ended", timestamp: now(), result: { ...this.current.result } });
    }
    return record;
  }

  undo(): boolean {
    if (this.cursor === 0) return false;
    const record = this.records[this.cursor - 1];
    if (!record) return false;
    undoMove(this.current, record.undo);
    this.cursor -= 1;
    this.emit({ type: "replay_position_changed", timestamp: now(), ply: this.cursor });
    return true;
  }

  redo(): boolean {
    if (this.cursor >= this.records.length) return false;
    const record = this.records[this.cursor];
    if (!record) return false;
    record.undo = applyMove(this.current, record.move);
    record.positionHash = hashPosition(this.current);
    this.cursor += 1;
    this.emit({ type: "replay_position_changed", timestamp: now(), ply: this.cursor });
    return true;
  }

  inspect(ply: number): GamePosition {
    const inspected = replayPosition(
      this.initial,
      this.records.map((record) => record.move),
      ply,
    );
    this.emit({ type: "replay_position_changed", timestamp: now(), ply });
    return inspected;
  }

  goToPly(ply: number): void {
    this.current = this.inspect(ply);
    this.cursor = ply;
  }

  returnToLive(): void {
    this.goToPly(this.records.length);
  }

  branchAt(ply: number): void {
    this.current = this.inspect(ply);
    this.records = this.records.slice(0, ply);
    this.cursor = ply;
  }

  pause(): void {
    if (this.paused) return;
    this.paused = true;
    this.emit({ type: "game_paused", timestamp: now() });
  }

  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    this.emit({ type: "game_resumed", timestamp: now() });
  }

  restart(position: GamePosition = createInitialPosition()): void {
    this.initial = clonePosition(position);
    this.current = clonePosition(position);
    this.records = [];
    this.cursor = 0;
    this.paused = false;
    this.emit({ type: "game_started", timestamp: now() });
  }

  loadPosition(position: GamePosition): void {
    this.restart(position);
    this.emit({ type: "position_loaded", timestamp: now() });
  }

  serialize(spacing = 2): string {
    const data: SerializedGame = {
      version: 1,
      initialPosition: serializePositionData(this.initial),
      moves: this.records.map((record) => ({ ...record.move })),
      currentPly: this.cursor,
    };
    return JSON.stringify(data, null, spacing);
  }

  static deserialize(input: string): GameSession {
    let data: unknown;
    try {
      data = JSON.parse(input) as unknown;
    } catch {
      throw new TypeError("Game data is not valid JSON.");
    }
    if (typeof data !== "object" || data === null) throw new TypeError("Game data is malformed.");
    const candidate = data as Partial<SerializedGame>;
    if (candidate.version !== 1 || !candidate.initialPosition || !Array.isArray(candidate.moves)) {
      throw new TypeError("Game data is missing version, initial position, or moves.");
    }
    const session = new GameSession(deserializePosition(candidate.initialPosition));
    for (const move of candidate.moves) session.play(move.from, move.to);
    const currentPly = candidate.currentPly ?? candidate.moves.length;
    if (!Number.isInteger(currentPly) || currentPly < 0 || currentPly > candidate.moves.length) {
      throw new TypeError("Imported game has an invalid current replay ply.");
    }
    session.goToPly(currentPly);
    return session;
  }
}

