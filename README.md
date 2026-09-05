# Rock Paper Scissors 2

A deterministic 9×9 strategy-game engine and inspectable React analysis workspace. This phase
supports local human-vs-human play, replay, import/export, position editing, bitboard inspection,
and future controller registration. It intentionally contains no AI move selection, evaluation,
training, or fabricated match results.

## Run locally

```bash
npm install
npm run dev
```

Useful verification commands:

```bash
npm test
npm run test:ui
npm run test:a11y
npm run typecheck
npm run lint
npm run build
npm run verify:design
npm run verify:premium
npm run benchmark -- 5000
```

The editable default setup and centralized rules live in
[`src/engine/constants.ts`](src/engine/constants.ts). The engine's supported entry point is
[`src/engine/index.ts`](src/engine/index.ts).

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for rules, square and bitboard mappings, API
examples, controller registration, events, replay semantics, and the future batch-observer
contract. Visual and interaction decisions are recorded in [`DESIGN.md`](DESIGN.md) and
[`UX-CONTRACT.md`](UX-CONTRACT.md).
