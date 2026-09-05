# Engine and platform architecture

## Scope

This repository contains a deterministic rules engine, a human-play session layer, and an
observable UI. The engine has no React or DOM imports and no mutable singleton state. Position
objects own all board and counter state, so they can be cloned, serialized, moved into a Web
Worker, or used from Node-based search and training programs later.

AI algorithms are deliberately absent. The registry fails with `AI engine not installed` when a
missing provider is requested, and the Match Lab keeps execution disabled until an implementation
is connected. Observer charts stay empty until real completed-game events exist.

## Default rules

- The board is 9×9 with Blue and Red players.
- Rock, Paper, and Scissors each move one square horizontally, vertically, or diagonally.
- Friendly pieces block destinations.
- Rock captures Scissors, Scissors captures Paper, and Paper captures Rock. Equal pieces and the
  defeating enemy type cannot be entered.
- Blue wins by reaching `i9`; Red wins by reaching `a1`.
- A capture removes the target and resets the no-capture counter. Other moves increment it.
- 100 consecutive plies without capture is a draw.
- An active player with no legal moves is a draw by default.
- No repetition, check, promotion, or other chess rule is implied.

`DEFAULT_GAME_RULES` owns every rule value. `INITIAL_PIECES` is a separately editable placement
list rather than UI state. A caller may clone or replace the rules when creating a position.

## Square and bitboard mapping

Squares increase by file, then rank:

```text
a1 = 0, b1 = 1, ... i1 = 8
a2 = 9, b2 = 10, ... i2 = 17
...
a9 = 72, ... i9 = 80
```

`Bitboard81` is `{ low: bigint, high: number }`. `low` holds squares 0–63. The low 17 bits of
`high` hold squares 64–80; any higher bit is rejected by deserialization/validation and masked by
constructing operations. This avoids an 81-entry boolean board while keeping word boundaries
explicit and predictable.

The six authoritative piece bitboards are Blue/Red × Rock/Paper/Scissors. Blue, Red, and combined
occupancy boards are incrementally refreshed after moves and editor operations. All 81 king-style
adjacency masks are precomputed once. Legal generation intersects a piece's mask with empty
destinations and exactly the enemy type it defeats, so horizontal and diagonal movement cannot
wrap between ranks.

Bitboard utilities include set, clear, toggle, membership, AND/OR/XOR/NOT, board-safe translation,
population count, least-significant-square lookup, occupied-square iteration, square-array
conversion, validation, and hexadecimal/binary debugging.

## Engine public API

Import supported functions from `src/engine/index.ts`:

```ts
import {
  applyMove,
  createInitialPosition,
  generateLegalMoves,
  hashPosition,
  serializePosition,
  undoMove,
} from "./src/engine";

const position = createInitialPosition();
const move = generateLegalMoves(position)[0];
if (move) {
  const undo = applyMove(position, move);
  undoMove(position, undo);
}

const stableHash = hashPosition(position);
const json = serializePosition(position);
```

Key capabilities are `createInitialPosition`, `createCustomPosition`, `clonePosition`,
`validatePosition`, `generateMovesFrom`, `generateLegalMoves`, `getMoveMasks`, `isLegalMove`,
`createMove`, `applyMove`, `undoMove`, `getGameResult`, `serializePosition`,
`deserializePosition`, `hashPosition`, and `moveToNotation`.

`applyMove` mutates the supplied engine position for throughput and returns complete `UndoData`.
UI components never call it directly; `GameSession` is their authoritative owner. Illegal moves
are rejected before mutation. `undoMove` restores pieces, occupancy, player, counters, result, and
hash-equivalent state.

## Session, history, and events

`GameSession` owns the initial position, live move records, replay cursor, paused state, and current
position. Inspecting a historical ply reconstructs a position without deleting future moves.
Playing there raises `BranchRequiredError`; the UI asks before truncating the current continuation.
Game exports contain the initial serialized position, all moves, and the current replay cursor.

Subscribers can observe these serializable event types:

```text
game_started, move_requested, move_applied, piece_captured, turn_changed,
game_paused, game_resumed, game_ended, replay_position_changed, position_loaded
```

Selection, board overlays, dialog state, timers, and animation state remain UI concerns. No second
piece array is stored in React.

## Registering a future AI controller

An AI implementation must implement `AiController` and return legal `Move` values through the same
asynchronous `PlayerController.chooseMove` contract used by humans. Register a factory at startup:

```ts
import { aiProviderRegistry, type AiController } from "./src/players";

const unregister = aiProviderRegistry.register({
  id: "my-engine",
  name: "My Engine",
  version: "1.0.0",
  create(id, name): AiController {
    return new MyEngineController(id, name);
  },
});
```

The controller receives an immutable position view, the engine-produced legal move list, current
ply, and an `AbortSignal`. A provider should honor cancellation and must never mutate the supplied
position. `GameRunner.step()` requests one move and applies it through `GameSession`. Registration
does not imply any specific search, evaluation, model, or training approach.

## Future batch self-play and observer contract

A future batch coordinator should create isolated `GameSession` and controller pairs per worker,
then publish real session events plus envelope metadata such as run id, game index, total games,
and monotonic sequence number. It should aggregate wins, draw reasons, plies, captures, throughput,
and completion estimates outside React.

The Live Observer should consume immutable snapshots/events from that coordinator. Pausing the
observer changes only its local replay cursor; it must not pause worker sessions. Auto-follow moves
the cursor to the latest received ply. Jumping games swaps the observed event buffer. Rolling and
length charts are derived only from completed-game records, never placeholders.

Recommended layers:

```text
controllers → GameRunner/GameSession → serializable event transport
                                      → batch aggregator
                                      → observer store → React views
```

## Performance and verification

`runEngineBenchmarks` covers legal generation, apply/undo, cloning, hashing, serialization, and a
complete supplied target-corner game. The inspector runs a short sample in development builds.
Use `npm run benchmark -- <iterations>` for a repeatable local report; timings are machine- and
load-dependent and are not stored as product data.

The test suite covers 81 adjacency masks, edge geometry, the full capture matrix, bitboard word
boundaries, counters/results, mutation safety, apply/undo identity, hashing, position and game
serialization, replay, import/editor flows, legal UI overlays, branching, and keyboard/focus
contracts.
