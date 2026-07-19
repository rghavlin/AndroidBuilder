# AGENTS.md

This file is a quick-start guide for AI coding agents working on **Zombie Road**, a turn-based zombie survival game. It is a single-page reference covering the project's stack, structure, build/test commands, architecture, conventions, and security model. Read it before making non-trivial changes.

## 1. Project Overview

- **Name:** `zombie-road` (product name: *Zombie Road*)
- **Version:** 1.0.0
- **License:** MIT
- **Genre:** Turn-based zombie survival / tactical RPG
- **Runtime targets:**
  - **Web** (Vite + React) — intended for itch.io-style subfolder hosting.
  - **Desktop** (Electron) — Windows installer (`nsis`) and portable `.exe`.
- **Project root:** `C:/Games/AndroidBuilder`

The game is split into a **pure JavaScript engine** (math, logic, simulation) and a **React UI** (presentation). The engine is the source of truth; the UI only reads from it and sends player input to it. This separation is the most important architectural rule in the codebase.

## 2. Technology Stack

| Layer | Technology |
|-------|------------|
| Language | TypeScript (React/TSX) + plain ESM JavaScript (engine) |
| Module system | ESM (`"type": "module"` in `package.json`) |
| UI framework | React 18 |
| Build tool | Vite 5 |
| UI component library | shadcn/ui (Radix UI primitives) |
| Styling | Tailwind CSS 3.4 + custom CSS variables |
| Icons | `lucide-react` + `react-icons` |
| State (React) | Context + `useSyncExternalStore` subscribing to the engine singleton |
| State (engine) | Global singleton `GameEngine` in `client/src/game/GameEngine.js` |
| Server | Express 4 (dev only, hosts Vite middleware on `127.0.0.1:5000`) |
| Desktop wrapper | Electron 31 + `electron-builder` 24 |
| Testing | Vitest 2 (Node environment, no browser) |
| Utilities | `zod` (validation), `wouter` (routing), `zustand`-style contexts |

## 3. Directory Layout & Code Organization

```
C:/Games/AndroidBuilder
├── client/
│   ├── public/          # Static assets: images, fonts, sounds, video
│   ├── index.html
│   └── src/
│       ├── components/  # React UI
│       │   ├── ui/      # shadcn/ui primitives
│       │   ├── Game/    # MapCanvas, GameControls, dialogs, dev console
│       │   ├── Inventory/
│       │   └── MapEditor/
│       ├── contexts/    # React providers (GameContext, PlayerContext, etc.)
│       ├── game/        # ENGINE — plain ESM JS, source of truth
│       │   ├── ai/          # targeting, factions, rabbit/turret AI
│       │   ├── components/  # ECS components (Position, Health, AIBehavior, MoveIntent, ...)
│       │   ├── config/      # vision, progression, templates
│       │   ├── entities/    # Entity, Zombie, NPC, Door, Window, Rabbit, types
│       │   ├── inventory/   # InventoryManager, Container, Item, ItemDefs, crafting
│       │   ├── managers/    # TurnManager, SimulationManager, IntentQueue
│       │   ├── map/         # GameMap, MapBuilder, FloorplanRegistry, LootGenerator
│       │   ├── quest/       # EventRunner, quest state
│       │   ├── renderer/    # TileRenderer, EntityRenderer, EffectRenderer, TileChunkCache
│       │   ├── systems/     # AISystem, NPCAISystem, CombatSystem, VisionSystem, MovementSystem, ...
│       │   └── utils/       # Pathfinding, LineOfSight, GameEvents, SeededRandom, Logger
│       ├── hooks/       # Custom hooks
│       ├── lib/         # `utils.ts` (cn/rainbowBackground/theme helpers), queryClient
│       └── pages/       # game.tsx, editor.tsx, not-found.tsx
├── server/              # Express dev server only
│   ├── index.ts         # Entry point (port 5000)
│   ├── routes.ts        # No HTTP API; just creates the http server
│   └── vite.ts          # Vite dev/static setup
├── electron/            # Desktop app
│   ├── main.js          # Main process (window, IPC, protocol handler)
│   └── preload.js       # contextBridge preload script
├── test/                # Vitest tests + fuzz/balance runners
│   ├── harness/         # GameHarness.js headless driver
│   ├── ecs/             # ECS facade tests
│   ├── systems/         # Combat/fire/death/window tests
│   ├── inventory/       # Container/load-swap tests
│   ├── map/             # Floorplan/furniture tests
│   ├── serialization/   # Save/load round-trip tests
│   ├── loot/            # Battery tests
│   ├── fuzz/            # Fuzz runner
│   └── balance/         # AP economy / balance simulations
├── customMaps/            # Map editor save files
│   ├── *.scenario.json    # Runtime scenario data
│   └── *.editor.json      # Editor state/metadata
├── scratch/               # Ad-hoc diagnostic/repro scripts
├── dist/                  # Web/Electron renderer build output
└── dist-electron/         # Packaged Electron apps
```

## 4. Build, Run & Deploy

### Available npm scripts

```bash
# Dev
npm run dev              # Express + Vite dev server on http://127.0.0.1:5000

# Web build
npm run build            # vite build (outDir: dist/public) + esbuild server bundle
npm start                # Run production server from dist/

# Type check
npm run check            # tsc --noEmit

# Electron
npm run electron         # Run Electron in production mode
npm run electron-dev     # Run Electron against dev server
npm run build-electron   # vite build --config vite.config.electron.ts
npm run electron-build   # build-electron + electron-builder
npm run electron-pack-win    # Windows nsis + portable
npm run electron-dist-win      # Windows build without publishing

# Tests / balance
npm test                 # vitest run
npm run test:run         # alias for vitest run
npm run test:watch       # vitest watch
npm run fuzz             # node test/fuzz/fuzz.mjs
npm run balance          # node test/balance/balance.mjs
npm run ap-economy       # node test/balance/apEconomy.mjs
```

### Build details

- **Web (`vite.config.ts`)**
  - Root: `client/`
  - Out: `dist/public/`
  - `base: isDev ? "/" : "./"` — relative URLs for itch.io subfolder hosting.
  - Aliases: `@` → `client/src`, `@assets` → `attached_assets`.
  - Dev-only plugins: `@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer` (only inside Replit).

- **Electron (`vite.config.electron.ts`)**
  - Root: `client/`
  - Out: `dist/`
  - `base: "./"` (relative)
  - Copies `client/public` into `dist/`.

- **Electron packaging (`package.json` `build` block)**
  - Output dir: `dist-electron/`
  - `appId`: `com.zombieroad.zombieroad`
  - Windows targets: `nsis` installer + `portable` x64.
  - Icon: `client/public/images/entities/zombie256.png`.
  - Extra files copied into the package: `dist/` → `app/`, `client/public/images` → `resources/images/`.

- **Deployment**
  - Replit: `.replit` runs `npm run dev` locally and deploys via `npm run build` then `npm run start` on port 5000.
  - No GitHub Actions CI/CD is present in this repo.

## 5. Testing Strategy

### Vitest configuration (`vitest.config.ts`)

- **Environment:** `node` (no browser shims).
- **Rationale:** The engine under `client/src/game/` is plain ESM `.js` and runs headless in Node.
- **Parallelism:** `fileParallelism: false` — tests share the global `engine` singleton, so suites must run serially.
- **Timeout:** `testTimeout: 20000` (20s).
- **Includes:** `test/**/*.test.{js,ts}`.
- **Excludes:** `**/*.test.ts` from `tsconfig.json` (tests are JS/TS but not type-checked with the app).

### Test categories

- `test/harness/` — `GameHarness.js` bootstraps the engine on a minimal map and mirrors player actions (move, melee, shoot, reload, throw). Used by fuzz and balance runners.
- `test/systems/` — Integration tests for combat, fire, death, window redirection.
- `test/ecs/` — Entity-component-system facade tests.
- `test/inventory/` — Container mechanics, load/swap behavior.
- `test/map/` — Floorplan registry and furniture planner.
- `test/serialization/` — Save/load round-trip correctness.
- `test/loot/` — Battery tests.
- `test/fuzz/` — Long-running fuzzer (`npm run fuzz`).
- `test/balance/` — AP economy and balance sims (`npm run balance`, `npm run ap-economy`).

### Before submitting a change

Run at least:

```bash
npm run check   # TypeScript type check
npm test        # Unit/integration suite
```

## 6. Code Style & Conventions

### TypeScript / JavaScript

- `tsconfig.json` has `strict: true`, `module: "ESNext"`, `moduleResolution: "bundler"`, `allowImportingTsExtensions: true`.
- Path alias: `@/` maps to `client/src/` (also configured in Vite).
- Engine code is **plain ESM `.js`**, not TypeScript, so it can run in Node without a build step.
- React components use `.jsx` / `.tsx`.

### Project-specific rules

- **No Python files.** All scripts, helpers, and migrations must be `.js`, `.mjs`, or `.ts`. This is enforced by `.cursorrules`.
- **No browser subagent / automated browser testing.** Keep work in the editor, CLI, and file edits.
- Engine vs. React separation is sacred. Do not run game logic inside React components, and do not render React from the engine.
- Events are **fire-and-forget**. Never use the event bus to synchronously block the engine.
- Use semantic Tailwind classes (`bg-background`, `border-border`) rather than hardcoded hex colors in new UI. Canvas colors should reference palette objects, not literals.

### Styling

- **shadcn/ui** (style `new-york`, base color `neutral`) in `client/src/components/ui/`.
- **Tailwind CSS 3.4** configured in `tailwind.config.ts`, PostCSS in `postcss.config.js`.
- `client/src/index.css` defines semantic variables and theme classes: `.dark`, `.dark2`, `.metallic`, `.light2`, `.steampunk`.
- The current default aesthetic is dark skeuomorphic with custom classes like `.metal-panel`, `.inset-slot`, `.metal-button`.
- Utility: `client/src/lib/utils.ts` exports `cn()` from `clsx` + `tailwind-merge`, plus `rainbowBackground()` and theme helpers.

### No linting / formatting config present

There are no `.eslintrc`, `.prettierrc`, or `prettier.config` files in the repo. Follow the existing patterns in neighboring files.

## 7. Architecture Deep Dive

### Core rule: Engine is the source of truth

- **Engine:** `client/src/game/` — pure math/logic, no React, no DOM, no async UI waits.
- **UI:** `client/src/components/` and `client/src/contexts/` — reads engine state, renders it, sends input to engine.
- **Communication:** Event bus `client/src/game/utils/GameEvents.js` (`SafeEventEmitter`). Events are fire-and-forget; never block the engine waiting for the UI.

### Turn flow

The game loop is explicit and state-machine-driven:

1. `PLAYER_TURN` — Player spends AP on movement, attacks, items.
2. `SIMULATING` — `SimulationManager.runTurn()` runs all AI math instantly:
   - Tile fires
   - Turret turns
   - Zombie AP refresh
   - Vision → `AISystem` → `IntentQueue` loop (up to 50 cycles)
   - Death check
   - Rabbit AI
   - NPC AP refresh, Vision → `NPCAISystem` → `IntentQueue` loop
   - Final death check
3. `ANIMATING` — `TurnManager.processQueue()` plays the generated `actionQueue` (movement, attacks, effects).
4. `PAUSED_FOR_EVENT` — If an NPC action requires player input (e.g., a demand), the queue pauses and resumes via a UI callback.
5. Post-turn — player upkeep (survival cascade, infection, AP refill, skill progression).

### Two AI execution models

- **ECS Intent System (Zombies, swarms, physics-driven entities):**
  - `AISystem.process` inspects entities and queues `MoveIntent`, `DamageIntent`, etc.
  - `IntentQueue.resolve` dispatches to `MovementSystem`, `CombatSystem`, `DestructionSystem`, `ExplosionSystem`, etc.
  - Handles collisions and breaches deterministically in one loop.

- **Legacy Imperative / Dialog-driven (NPCs, rabbits, companions):**
  - `NPCAISystem` still wraps old imperative logic but feeds the same intent pipeline.
  - Dialog interruptions that pause playback are allowed here via `PAUSED_FOR_EVENT`.

### State management in React

- `GameEngine` is a global singleton.
- `GameContext.jsx` subscribes to it via `useSyncExternalStore` and exposes orchestration functions.
- The monolithic `GameContext` has been partially split into focused contexts (`PlayerContext`, `GameMapContext`, `CameraContext`, `InventoryContext`, etc.). Prefer the focused contexts; avoid the legacy `useGame()` aggregation hook where possible.

### Initialization phases

`GameInitializationManager` drives new game / scenario load / map transitions in ordered phases:

1. `PRELOADING` — grid calculations, asset/config loading.
2. `CORE_SETUP` — `WorldManager`, map generation, player creation, camera setup.
3. `WORLD_POPULATION` — entity spawning, FOV calculation, event listeners.
4. `COMPLETE` — ready for player interaction.

## 8. Security Considerations

### Electron hardening

- `nodeIntegration: false`
- `contextIsolation: true`
- `enableRemoteModule: false`
- Preload script: `electron/preload.js` exposes only a whitelisted `window.electronAPI` via `contextBridge`.
- Blocked permissions: `geolocation`, `notifications`, `midi`, `clipboard-read`, `media`.
- Geolocation disabled at the Blink level via `app.commandLine.appendSwitch('disable-blink-features', 'Geolocation')`.
- Production asset serving uses a custom `file://` protocol handler with path validation and HTTP range support.

### IPC surface (`window.electronAPI`)

- Save/load/list/delete game slots (`userData/saves/`).
- Save/load/list/delete scenario/editor files (`customMaps/`).
- Open editor/game windows.
- List entity images for the map editor NPC picker.

### Environment / secrets

- No `.env` files or API keys are present in the repository.
- The server uses `process.env.PORT || '5000'`.
- Game persistence is entirely client-side (IndexedDB/localStorage on web, Electron IPC → filesystem on desktop). The Express server has no game-related HTTP API.

## 9. Map Editor & Custom Content

- Map editor saves live in `customMaps/`.
- Two file formats:
  - `*.scenario.json` — runtime scenario data (tiles, terrain, entities).
  - `*.editor.json` — editor state / metadata.
- The editor can launch a game window and uses the Electron IPC `list-entity-images` handler to populate the NPC icon picker from `client/public/images/entities/`.

## 10. Useful Commands Quick Reference

```bash
# Start development
npm run dev

# Type check
npm run check

# Run tests
npm test

# Run web production build
npm run build
npm start

# Run Electron dev
npm run electron-dev

# Build Electron distributables
npm run electron-pack-win

# Diagnostics / balance
npm run fuzz
npm run balance
npm run ap-economy
```

## 11. When Changing Code

Ask yourself the regression-prevention checklist from `ARCHITECTURE.md`:

1. Am I blurring the line between math/logic and UI?
2. Am I creating a race condition (e.g., relying on `setTimeout` for sync)?
3. Is my source of truth correct (engine, not React state)?
4. Does this break if the player clicks rapidly?
5. If player input is needed during a turn, did I push an interrupt action to the playback queue instead of halting mid-simulation?

For any architectural change that conflicts with the rules above, read `ARCHITECTURE.md` first and propose a refactor rather than bypassing the rules.
