# Code Quality Action Plan — from Kimi 49-part review

Source: `C:\Games\zombieRoadProject\kimiCodeReview.txt` (49 reviews covering the whole `client/src/game` tree).

This plan is filtered to **code quality only**. Game-design / mechanics questions the
review raised (rain affecting sound, fire spread, explosion occlusion, economy balance,
etc.) are pulled out into a separate "Design backlog — NOT code quality" section at the
bottom so they don't clog the engineering work.

## How to read the review (triage philosophy)

The review is thorough but uneven in severity. Three things to know before you start:

1. **A lot of the scary-looking `❌` findings are design decisions, not defects.** "No wall
   occlusion for explosions," "fire doesn't spread," "zombies ignore rabbits," "barter and
   shop use different prices" — these are *game* questions wearing a bug costume. They need
   a yes/no from you as designer, not a code fix. They're quarantined below.

2. **Roughly 60% of the genuine code findings are the same ~8 root causes repeated.** Fixing
   them by theme (one pattern, swept across all files) is far cheaper than walking the 49
   reviews file-by-file. That's how this plan is organized — themes first.

3. **The single biggest structural gap is test coverage** — nearly every review ends with
   "❌ no tests." You don't need to close all of it. A small number of *pure, cheap* test
   files (SeededRandom, LOS, terrain properties, defId/recipe schema) would pin the exact
   invariants the review keeps worrying about.

Severity legend used below: **[P0]** real bug that corrupts state / crashes / loses data ·
**[P1]** latent bug or high-value cleanup · **[P2]** hygiene / slow-burn refactor.

---

## Wave 1 — Cross-cutting themes (fix the root cause once)

These are the high-leverage items. Each is one pattern that recurs in many files; fixing the
pattern retires many individual findings at once.

### T1. Falsy-default deserialization bugs (`||` where `??`/`!== undefined` is meant) **[P1]** ✅ COMPLETE
`x || default` silently clobbers legitimate `0` / `false` / `''` coming out of a save file.
Confirmed sites: `AIState`, `Burnable`, `RpgStats` XP (R1), `Tile.waterAmount` reload (R5#4),
`NPCAISystem` `target.logicalX || target.x` (R24#3), `WeatherManager` puddle `ammoCount`
(R48#4), `MovementHelper entity.ap || 10` (R16, dead file — delete instead).
- **Action:** grep the deserialization / `fromJSON` paths for `|| 0`, `|| {`, `|| [`, `|| '`
  and the coordinate `|| .x` pattern; convert to `?? ` or the `!== undefined` idiom the rest
  of the codebase already uses. Add one regression test per fixed file that round-trips an
  explicit `0`/`false`.
- **Done (2026-07-22):** all confirmed sites fixed; `??`/`!== undefined` sweep applied to
  every `fromJSON`/deserialization path (`Tile`, `Entity`, `Door`, `GarageDoor`, `Window`,
  `Rabbit`, `PlaceIcon`, `TestEntity`, `GameMap` both paths, `WorldManager`, `GameEngine`
  interaction state, `QuestState`, `EventRunner`, `WeatherManager`). Real bug found & fixed:
  `Tile.fromJSON` refilled a drained water tile (`waterAmount: 0`) to 100. `MovementHelper.js`
  deleted (dead file; Wave 3 item retired early). Regression tests:
  `test/serialization/falsyDefaults.test.js` (19 tests, one per fixed class). `npm test`
  green (135/135); `npm run check` shows only pre-existing TSX errors (untouched files).

### T2. Duplicated & drifted "what blocks movement / sight" predicates **[P0/P1]** ✅ COMPLETE
The review's most-repeated correctness theme. The blocking-terrain list is copy-pasted in
5–6 places and has already diverged (R5#1); there are **two** LOS implementations with
three different door-blocking rules (R6#1); reinforced-open windows are passable because
one predicate forgot to check `isReinforced` (R14#2 — a live bug).
- **Action (staged):**
  1. Create one `TERRAIN_PROPS` table: `{ walkable, blocksSight, destructible }` per terrain
     (R5 rec #1). Route `Tile.isWalkable`, `LineOfSight`, `VisionSystem`, both UI contexts,
     and `ExplosionSystem` through it.
  2. Collapse the two LOS implementations to one (make `VisionSystem` delegate to
     `LineOfSight`), fixing the door-state matrix in a single place (R6 rec #1).
  3. Add the reinforced-window rule to the shared movement predicate (R14#2).
- **Test:** a terrain property-matrix test + an ASCII-map LOS test become one-liners once the
  table exists, and pin the drift permanently.
- **Done (2026-07-22):**
  - `TERRAIN_PROPS` + `getTerrainProps`/`isTerrainWalkable`/`terrainBlocksSight`/
    `isTerrainDestructible` added to `map/TerrainTypes.js` (17 terrains, open-ground fallback).
  - Routed through it: `Tile.isWalkable`, `LineOfSight.isTerrainBlocking`,
    `GameMapContext` click+hover filters, `PlayerContext` cardinal-passable check,
    `ExplosionSystem` wall breaching. Fixed drift by construction: the UI filters were
    missing `deep_water`/`brick`/`metal_wall`, and `PlayerContext` treated water as passable.
  - LOS collapsed: `VisionSystem.hasLineOfSight` now delegates to `LineOfSight`
    (~150 lines of duplicated Bresenham + `isTileBlocking`/`isEdgeBlocked` deleted).
    Door-state sight matrix unified in `LineOfSight.doorBlocksSight` (blocks iff closed
    AND intact) — the old LOS checked `isBroken` (a field doors don't have) so smashed
    doors wrongly blocked sight; `getBlockingEntity`'s `blocksSight`-property path had the
    same flaw. Both now use the matrix.
  - Reinforced-window rule (R14#2): `Pathfinding.isEdgeBlocked` and both `Tile.isWalkable`
    window bypasses now treat `isReinforced` windows as blocked even when open/broken.
  - Note: unused `brick`/`metal_wall` terrains were walkable-through-sight in old LOS
    (drift); table marks them sight-blocking like every other wall. No live maps use them.
  - Tests: `test/map/terrainProps.test.js` (20 — full matrix × consumers) and
    `test/map/lineOfSight.test.js` (17 — ASCII-map LOS, door matrix, VisionSystem parity,
    reinforced-window movement). `npm test` green (172/172); `npm run check` unchanged at
    the 254 pre-existing TSX errors.

### T3. `entities.find(e => e.id === id)` O(E) scans everywhere **[P1]** ✅ COMPLETE
Same per-lookup linear scan in `IntentQueue` (R19#9), `CombatSystem` (R20#10),
`DestructionSystem` (R21#6), `GameMap`. At horde scale this is millions of comparisons/turn.
- **Action:** build one `id → entity` Map once per resolve pass and pass it in. Cheapest real
  perf win in the review. Also swap `entities.filter(type===...)` for the existing
  `getEntitiesByType()` O(matches) index (R21#6, R22#8).
- **Done (2026-07-22):**
  - `IntentQueue.resolve` builds one `entityById` Map per pass and threads it into
    `processIntent` → `CombatSystem.resolve` / `DestructionSystem.resolve` (both take a
    trailing optional `entityById`, falling back to the old `find()` when absent, so all
    existing callers stay compatible). `CombatSystem.process` also builds the Map once.
  - Type filters swapped for the O(matches) index: `DestructionSystem` zombie-targeting
    sweep and `ExplosionSystem` door/window scans now use `gameMap.getEntitiesByType()`
    (with a filter fallback in DestructionSystem for non-indexed map doubles).
  - `GameMap` needed no change — `getEntity` is already O(1) via `entityMap`.
  - Test touch-up: `death_and_explosions.test.js` had zombies planted via bare
    `entityMap.set` (a state impossible in production — the type index is maintained by
    `addEntity`/`rebuildEntityTypeIndex`); switched to `addEntity`.
  - `npm test` green (172/172); `npm run check` unchanged at the 254 pre-existing errors.

### T4. `queue.shift()` making O(n²) loops **[P1]** ✅ COMPLETE
`IntentQueue.resolve` (R19#8), `Pathfinding.getReachableTiles` (R7#7), `GameMap` BFS (R8#11).
- **Action:** replace `shift()` with an index pointer, or a real priority queue for
  `getReachableTiles` (which is additionally *wrong* under variable costs, R7#7).
- **Done (2026-07-22):**
  - `IntentQueue.resolve`: index-pointer dequeue (cascades still append live; FIFO order
    unchanged). No more O(n²) per turn at horde scale.
  - `Pathfinding.getReachableTiles`: rewritten as proper Dijkstra — MinHeap ordered by
    cost + best-cost relaxation + stale-entry skipping. The old FIFO BFS marked tiles
    visited on first pop, which under variable costs (1.4 diagonals, window/structure
    penalties) could record an inflated cost for a tile even when a cheaper route within
    budget existed (this feeds the movement-range/AP preview shown to the player).
  - `GameMap.isSameBuildingShell`: index-pointer BFS (behavior identical).
  - Left alone: `NPCAISystem` `currentPath.shift()` — short per-step paths, not the
    O(n²) pattern.
  - Tests: `test/map/pathfinding.test.js` (7 — exact diagonal/cardinal pricing,
    cheapest-cost selection, wall/budget respect, building-shell BFS incl. the
    ≤1-closed-door rule). `npm test` green (179/179); `npm run check` unchanged (254
    pre-existing).

### T5. Global-engine reach-ins / circular deps **[P0 for the crash, else P2]** ✅ COMPLETE
Data objects and utils import the engine singleton or `window.gameEngine`/`globalThis`:
`Tile` (R5#6), `Entity` (R13#8), `Item` (R32#1), `VehicleUtils` (R48#10), `GroundManager`
(R35#3), `CraftingManager` (R34#7).
- **[P0] `Item.js` `window.gameEngine`** at two self-destruct paths throws `ReferenceError`
  in Node — it crashes headless tests (R32#1). The same file already uses `globalThis`
  correctly 20 lines away. Fix first: use the local `_container.removeItem` path.
- **Action (rest):** pass `player`/`riding`/`gameMap` as parameters instead of importing the
  singleton (VehicleUtils and GroundManager error-paths are the concrete ones). The Tile/
  Entity circular-dep removals are larger — schedule with the god-object work (Wave 4).
- **Done (2026-07-22):**
  - **P0 fixed:** both `Item.js` self-destruct paths (`consumeCharge` lighter/matchbook,
    `degrade` breakage) now use `globalThis.gameEngine?.inventoryManager` — and, because
    `destroyItem` reports whether it actually removed the item, fall back to the local
    `_container.removeItem` when the engine manager doesn't own the item (covers headless
    tests where the singleton exists but the item lives in a foreign container).
  - **VehicleUtils:** `calculateDragCost` takes a `{ playerStrength, riddenItemId }`
    context param; singleton import deleted; both `GameMapContext` call sites updated.
  - **GroundManager:** lazy dynamic `import('../GameEngine.js')` hack deleted; constructor
    takes an injected context provider (`gameMap`, `ridingItemId`, `draggingItemId`,
    `lastSyncedX/Y`, `playerX/Y`). Sort comparator and both force-inject error paths (which
    could crash on `engine.gameMap` if the lazy import hadn't resolved) use it.
    `InventoryManager` wires the provider at both construction sites.
  - **Circular-dep landmine defused:** removing VehicleUtils' engine import exposed a fatal
    `GameEngine ↔ InventoryManager` import cycle ("InventoryManager is not a constructor"
    when InventoryManager loads first). `InventoryManager` no longer statically imports the
    singleton — it reads it lazily via a documented pass-through Proxy over
    `globalThis.gameEngine`.
  - Left for Wave 4 per plan: `Tile`/`Entity` singleton imports (large circular-dep work).
    `CraftingManager` uses the crash-free `globalThis` bridge deliberately; migration to
    injected state noted but not required by T5.
  - Tests: `test/inventory/groundManagerContext.test.js` (6 — both P0 self-destruct paths
    headless, ridden-first sort via provider, map-tile injection, no-provider safety).
    `npm test` green (185/185); `npm run check` unchanged (254 pre-existing).

### T6. Production console noise + no build strip **[P1]** ✅ COMPLETE
633 raw `console.*` across 61 files bypass the Logger; nothing strips them in prod (R4).
Worst offenders run on hot paths: `Item.canStackWith` logs per mouse-move (R32#7),
`ImageLoader` logs per frame (R49#9), `AudioManager` ~10 logs per sound (R46#7), `TurnManager`
~3/action (R30#7).
- **Action:** two moves, either closes most of it:
  1. Add `esbuild: { drop: ['console','debugger'] }` (or a pure-annotation) to
     `vite.config.ts` **and** `vite.config.electron.ts` for production builds (R4#8).
  2. Silence the hot-path logs specifically (canStackWith, ImageLoader, AudioManager).
- Also delete Logger's dead `LOG_LEVELS` constant + unused named export, or make levels real
  (R4#1,#4).
- **Done (2026-07-22):**
  - Build strip: `esbuild: { drop: ['console','debugger'] }` in production for both
    `vite.config.ts` (dev keeps console; typed via `UserConfig['esbuild']` to avoid a
    union-type TS error the first draft introduced) and `vite.config.electron.ts`
    (always — that config is build-only). Verified with a real `npm run build`: the
    dist bundle contains zero console *calls* (only a dependency's `console.log=()=>{}`
    no-op assignments remain).
  - Hot paths silenced behind per-file `const DEBUG = false` + `debugLog(...)` gates
    (flip to true locally when debugging): `TurnManager` (7 routine logs — turn
    start/finish, per-action `>> START`/`<< FINISH`, lane count, cancel, empty-queue;
    genuine warns/errors kept), `AudioManager` (12 success-path play/load/stop logs;
    failure warn/error kept), `ImageLoader` (15 logs — all success logs plus the six
    per-frame retry/0-dimension/not-found warns in the entity/place/item/UI getters;
    tile & decoration warns kept since the tile loader already has a failure-count
    guard), `Item.canStackWith` (per-mouse-move stacking logs removed outright).
  - Logger: dead `LOG_LEVELS` constant and unused `export const logger` named export
    deleted; verified no file imports either.
  - Left alone: ~600 remaining non-hot `console.*` calls — the esbuild drop handles
    them in prod, and they aid dev debugging. Full Logger migration is not required
    by the plan ("two moves, either closes most of it").
  - `npm test` green (185/185); `npm run check` back to the 254 pre-existing errors
    (fixed the one new vite.config.ts error).

### T7. Non-seeded `Math.random()` breaking the determinism convention **[P1]** ✅ COMPLETE
The project uses `gameRandom` everywhere for reproducibility, except:
`AttributeProgressionManager` 1d3 stat roll (R38#3 — this one matters, stat rolls should
replay), `WeatherManager` (R48#9), and instance/effect IDs (R31#3, R32, R45 — IDs don't need
determinism, low priority).
- **Action:** replace the stat roll with `gameRandom.nextInt(1,3)`; make `WeatherManager` take
  an injectable RNG. Leave ID generation unless a replay/verify feature ever needs it.
- *(The larger map-gen determinism gap in R9#2 — seeds not threaded per-map — is partly a
  design/repro decision; note it but don't block Wave 1 on it.)*
- **Done (2026-07-22):**
  - `AttributeProgressionManager.rollAttribute`: 1d3 now `gameRandom.nextInt(1, 3)` —
    stat rolls replay from the game seed like every other gameplay roll.
  - `WeatherManager`: constructor takes an injectable RNG
    (`new WeatherManager(engine, rng = gameRandom)`), all 6 `Math.random()` sites
    (initial/reset/interval scheduling, rain duration, initial intensity, intensity
    variation) routed through it. Production behavior unchanged apart from now being
    seeded; `GameEngine` construction site needs no change.
  - Left per plan: ID generation (`CharacterRegistry`, `ItemDefs` instanceId,
    `MusicManager`/`AudioManager`/`GameEvents` ids), seed generation itself
    (`GameInitializationManager`, `SeededRandom` constructor), and the map-gen
    seed-threading gap (R9#2, design decision).
  - Tests: `test/systems/seededRandomness.test.js` (5 — stat roll matches the seeded
    stream and is reproducible from the same seed; WeatherManager defaults to
    `gameRandom`, replays identical weather from an injected seed, and an injected
    RNG doesn't disturb the global stream). `npm test` green (190/190);
    `npm run check` unchanged (254 pre-existing).

### T8. Shared-reference / mutable-default hazards **[P1 — "loaded guns"]** ✅ COMPLETE
State that looks copied but is shared by reference, one mutation from corrupting every
instance: `Entity.defineAccessors` shared mutable defaults (R13#3, explicitly called a
"loaded gun"), `createItemFromDef` shares def internals across all instances (R31#2),
`fromJSON` aliasing `edgeWalls`/`metadata` (R5#5, R8, R10#5, R12#6), `toJSON` shallow spreads
(R1#5).
- **Action:** freeze or fresh-copy the accessor defaults; `structuredClone` the nested def
  objects in `createItemFromDef`; clone-on-read for the `fromJSON` aliases. Add a test that
  pushes into a default and asserts isolation.
- **Done (2026-07-22):**
  - `defineAccessors` (Entity.js): mutable defaults (`noiseCoords`, `noiseBlacklist`,
    `recentThreats`, `targetSightedCoords`) are now `structuredClone`d per read when
    the component is absent — pushing into a returned default no longer corrupts
    every other component-less entity. Setter path (component creation) unchanged.
  - `createItemFromDef`: `...def` → `...structuredClone(def)` — every instance owns
    its `traits`/`categories`/`consumptionEffects`/`combat`/etc.; ItemDefs entries
    can no longer be mutated through an instance.
  - Clone-on-read (`fromJSON`): `Tile` (`edgeWalls`, `flags`, `inventoryItems`),
    `GameMap.fromJSON`/`fromJSONSelective` (`buildings`, `furniture`, `lowSpots`,
    `specialBuildings`), `TemplateMapGenerator.applyToGameMap` (metadata boundary —
    intra-map sharing like `buildings === metadata.buildings` preserved by deriving
    from the clone), `AIState` constructor (all nested fields).
  - Clone-on-write (`toJSON`): `Tile` (`edgeWalls`, `flags`), `GameMap`
    (`buildings`, `furniture`, `lowSpots`), `WorldManager` (per-map `metadata`),
    `AIState` (nested fields), and `structuredClone({ ...this })` for the four
    spread-style components with nested mutables (`AIBehavior`, `Inventory`,
    `InventoryContainer`, `Vision`). Scalar-only `{ ...this }` components left
    alone — no hazard there.
  - Tests: `test/serialization/sharedReferences.test.js` (7 — push-into-default
    isolation for accessor defaults, setter path intact, createItemFromDef sibling/
    def isolation, Tile alias-free both directions, AIState both directions,
    GameMap header-field clones). `npm test` green (197/197); `npm run check`
    unchanged (254 pre-existing).

---

## Wave 1 complete — all themes T1–T8 done (2026-07-22)

---

## Wave 2 — Discrete high-value bugs (not part of a theme)

Each is a standalone real defect worth fixing directly.

### Wave 2 P0 — ✅ COMPLETE (2026-07-22)
All four P0 bugs fixed and pinned with regression tests. `npm test` green (207/207,
+10 new); `npm run check` unchanged at the 254 pre-existing TSX errors (edited
`MapCanvas.jsx` is untyped/clean — the one MapCanvas hit is the pre-existing
`MapInterface.tsx` `.jsx`-import baseline error).

- **[P0] ✅ `GroundManager.organizeByCategory` silently deletes items** (R35#1). `clear()` then
  `placeItemAt` with no else-branch on failure → items vanish, and it triggers whenever the
  ground holds ≥10 items. Fix = mirror `sortGroundItems`' `isAreaFree`+`addItem` fallback.
  - **Done:** per-item full free-area scan + `addItem(item,null,null,false)` fallback; a
    genuinely unplaceable item is `console.error`-logged and left out of the grid but never
    deleted, then `updateCategoryAreas()` recomputes bands. Test:
    `test/inventory/organizeByCategory.test.js` (2 — conservation across a busy multi-category
    ground; no-throw + no-loss when the grid is full).
- **[P0] ✅ `GameMap.fromJSONSelective` loses buildings + crop metadata** vs `fromJSON` (R8#2).
  This is the path used on *every map transition* — building-dependent logic runs on an empty
  array afterward. Align the two paths; add a both-paths round-trip test.
  - **Done:** extracted shared `_restoreHeaderFields` (buildings + `specialBuildings` alias,
    with `??`/`structuredClone` per T1/T8) and `_restoreAllCropMetadata`; both `fromJSON` and
    `fromJSONSelective` now call them, so they can't drift. Test:
    `test/serialization/mapRestoreParity.test.js` (3 — buildings parity + non-empty on the
    selective path, crop recompute proven via `cropInfo` defined-as-null, no POJO aliasing).
- **[P0] ✅ `GameMap.addEntity` duplicate-ID: logs then overwrites** → ghost entity left on tile
  and type-index while `entityMap` points at the new one (R8#3). Decide: throw, or evict-then-
  add. Error-and-continue is the worst option. (Also see replenishment ID collisions R47#2.)
  - **Done:** evict-then-add — the previous instance is detached from its tile (via logical
    coords), the type index, and `gameMap` before the new one is inserted; a quiet detach (no
    `ENTITY_REMOVED`/`ZOMBIE_DIED` events, which would corrupt counters) with a single warn
    (error for a duplicate *player* instance). Test: `test/map/duplicateEntityId.test.js`
    (2 — different-instance eviction leaves no ghost; same-instance re-add just moves it).
- **[P0] ✅ `TileChunkCache.invalidateTile` is dead-wired** → breached walls / removed doors keep
  rendering until the next zoom/theme/map change (R43#1). The escape hatch was built and
  never connected. Fix = call it from `setTerrain` + edge-wall writes + door/window removal.
  - **Done:** `MapCanvas` now subscribes (keyed on `mapVersion`, so it re-binds across map
    transitions) to the gameMap instance's `terrainChanged` → `invalidateTile`, and to
    `entityRemoved`/`entityAdded` filtered to structure types (door/window/garage_door) →
    `invalidateTile`; creatures/items are ignored to avoid cache thrash on every kill.
    Explosion edge-wall clears are covered because they neighbor the breached tile whose
    `setTerrain('floor')` fires `terrainChanged`, and `invalidateTile` dirties the 3×3 chunk
    neighborhood. Test: `test/renderer/tileChunkCache.test.js` (3 — 3×3 neighborhood dirtying,
    chunk-border straddle, `invalidateAll` clears).
### Wave 2 P1 — ✅ COMPLETE (2026-07-22)
All P1 bugs fixed and pinned. `npm test` green (219/219, +12 new); `npm run check`
unchanged at the 254 pre-existing TSX errors (the edited `.jsx`/`.js` modules are untyped —
every hit is the same `.js`-import baseline). Some items in the original list were already
resolved before this pass (noted inline).

- **[P1] ✅ `Pathfinding` decrease-key doesn't re-heapify** → A* can return suboptimal paths
  (R7#1). Sift-up after the in-place `f` reduction, or push-and-skip-stale.
  - **Done:** lazy-deletion decrease-key — the better-g branch now pushes a *superseding*
    node (lower f) and repoints `openSetMap` at it; on pop, stale entries are skipped
    (`closedSet.has` or `openSetMap.get(key) !== current`). Cheaper than adding index
    tracking to the heap. Test: `test/map/pathfinding.test.js` (+3 — diagonal-shortcut
    optimality, minimal wall detour, no-path returns []).
- **[P1] ✅ Dead defIds silently empty loot pools:** `NPCTypes` `tool.flashlight`/`tool.matches`
  (should be `tool.smallflashlight`/`tool.matchbook`) — 22% of the survivor pool produces
  nothing (R14#5). Plus `rain_collector: categories:[null]` and `Rarity.EPIC` (undefined) in
  ItemDefs (R31#1). Fix the strings; the schema test below prevents recurrence.
  - **Done:** fixed the two NPCTypes defIds; the three `Rarity.EPIC` refs (all `noLoot`
    vehicles) → `Rarity.EXTREMELY_RARE`. (`rain_collector`'s `[null]` category was already a
    valid `PROVISION` — resolved earlier.) Test: `test/inventory/defIdResolution.test.js`
    (3 — every NPC-pool defId resolves; no def carries an unknown rarity; `Rarity.EPIC`
    stays undefined).
- **[P1] ✅ `EventRunner` has no chain-cycle detection** → `A→B→A` of non-blocking steps
  recurses to stack overflow (R42#2). Add a visited-set or depth cap (mirror `IntentQueue`'s
  `maxDepth`).
  - **Done:** per-chain `chainVisited` set threaded through `runEvent(opts)`; the `chain`
    step refuses to re-enter a visited event or exceed `MAX_CHAIN_DEPTH` (50), aborting via
    `_endRun()` (called while `activeRun` is still set, so the running event is excluded from
    the immediate auto-recheck — no instant self-restart). Test:
    `test/quest/eventChainCycle.test.js` (3 — A→B→A and A→A abort without overflow; a long
    acyclic A→B→C still completes).
- **[P1] ✅ `CombatResolver` scope branch can produce `NaN`** hit chance from unguarded
  `accuracyFalloff`/`minAccuracy` (R20#5) → every shot misses past 15 tiles. Add the `|| 0.2`
  fallback the sibling branches have.
  - **Done:** `minAccuracy = stats.minAccuracy ?? 0.1` and `accuracyFalloff = stats.accuracyFalloff ?? 0.2`
    computed once and used by the shotgun/scope/laser/default branches (`??` preserves a
    deliberate 0). Test: `test/systems/combatResolverAccuracy.test.js` (2 — a scoped weapon
    with missing stats lands hits at long range; result object is never NaN-driven).
- **[P1] ✅ `ImageLoader` retries missing images every frame forever** (R49#1–3) — network +
  console spam, and cached fallbacks/nulls never short-circuit. Add the failure-count guard
  the tile loader already has to `getItemImage`/`getPlaceImage`/`getUIImage`.
  - **Done:** added the `failedImagesCount >= 3` early-return to `getPlaceImage` and
    `getItemImage`; `getUIImage` now reads the cache with `in` so the deliberately-cached
    `null` short-circuits (was a truthiness miss → reload every call). (No dedicated test —
    ImageLoader needs a `global.Image` mock in Node; deferred to the Wave 5 plan.)
- **[P1] ✅ `Rabbit` constructor sets `hp` before `maxHp`** (clamp trap, R14#4) — works only by
  luck of the Health default. Reorder to match `Door`.
  - **Done:** `maxHp` set before `hp`. Test: `test/entities/rabbitSpawn.test.js` (1 — hp ===
    maxHp === 5, never spawns dead).
- **[P1] ✅ `SimulationManager` cycle caps exit silently** (R29#2) — a truncated horde turn just
  drops actions with zero telemetry. Add a `console.warn` with entity/AP counts when any of
  the three 50/25-cycle caps is hit; consider a per-turn time-budget warning (R29#7).
  - **Done:** all three loops (zombie 50, NPC 50, follow-up 25) now `console.warn` with
    entity/cycle counts on cap overrun (the NPC loop excludes a legitimate demand-break; the
    per-turn time-budget warning was left as the optional R29#7 extra).
- **[P1] ✅ `MovementSystem` teleport fallback silently desyncs** position vs. spatial index
  when `moveEntity` isn't a function (R36 — R16#3). Make it throw.
  - **Done:** the non-function fallback now throws instead of teleporting the Position
    component past all validation (every real map + the harness provides `moveEntity`).
- **[P1] ✅ Event-bus wiring bugs:** `ZOMBIE_ATTACK_RESULT` emitted with no listeners while
  `AudioContext` listens on `ZOMBIE_ATTACK` (R3#8 — one is a real miswire); dead
  `NPC_DEMAND_TRIGGERED` listener with no emitter (R24#2). Resolve both.
  - **Done:** the AudioContext handler was correctly on `ZOMBIE_ATTACK` (only its name was
    misleading — renamed `handleZombieAttackResult` → `handleZombieAttack`); the genuinely
    dead `ZOMBIE_ATTACK_RESULT` emit (SleepContext, payload matched no consumer; damage/
    afflictions/log all handled inline) and the never-emitted `NPC_DEMAND_TRIGGERED` listener
    (GameContext; live path is the actionQueue scan) were removed, along with both constants.

---

## Wave 3 — Dead code sweep (low risk, shrinks surface area)

Delete-only, or delete-or-adopt. Do these in a batch; they're safe and make everything else
easier to read. ~800+ lines total.

- `MovementHelper.js` — entirely dead + 3 latent bugs (R16#10). Delete.
- `EntityFactory.createFlashlight` + `assembleFromBlueprint` + `BlueprintRegistry` — dead
  archetype system, ~60 lines (R15#6). Delete (or adopt to kill the zombie/NPC boilerplate).
- `LootGenerator`: `applyEasyStartLoot`, `getBuildings`, `MAP_WIDE_UNIQUES` dead block —
  ~200 lines (R11#9).
- `client/src/game/Entity.js` root stub — imported nowhere (R13#9).
- `inventory/index.js` dead legacy half: `ITEM_TEMPLATES`, `createWeapon/createArmor/...`,
  window globals — ~150 lines; repoint `EquipmentSlots.tsx` at the real modules (R35#6).
- `__tests__/Container.test.js` — vitest never runs it; move under `test/` or delete (R32#9).
- `PlayerZombieTracker.updateCurrentVisibility` — no callers (R28#5).
- `TemplateMapGenerator` legacy ASCII templates + `parseTemplateLayout`/`addRandomWalls`/
  `addRandomFloors` — ~180 lines, unreachable (R12#9). Confirm the editor's template picker
  doesn't expose them first.
- `GameSaveSystem.restorePlayerFromJSON` / `restoreCameraFromJSON` — no callers (R39#5).
- `SurvivalCascade.AP_FLOOR` — mathematically dead constant (R37#2).
- Fix docs while you're in there: `PlayerZombieTracker` header is inverted vs behavior
  (R28#1); `GameMap` "20x20" docstring (R8#12).

---

## Wave 4 — Slow-burn architectural refactors (do opportunistically, not in a sprint)

These are the god-objects. Don't stop-the-world for them — extract a slice whenever you're
next in the file. Rule of thumb from the review: **stop adding new logic to these, extract
the cleanest seam, move on.**

- **`InventoryManager` (3,304 lines)** — clearest extraction target. Pull the item
  query/consumption service first (most-called, most self-contained), then ground lifecycle
  (GroundManager already exists as its nucleus), then equipment mgmt (R33#7).
- **`Entity` (1,257-line god facade)** — evict engine-coupled logic to systems: `playAction`/
  `die`, skill progression, sickness (R13#7). Add a real `destroy()` lifecycle
  (`removeAllListeners`, clear gameMap) called from `GameMap.removeEntity` (R13#2).
- **`GameMap` (1,647 lines)** — extract `processTurn` sim logic (snares/spoilage/
  replenishment) into a `MapSimulationSystem`; move `_getGroundProxyInfo` to the renderer
  (R8#8).
- **`Item` (1,784 lines)** — extract vehicle physics (~350 lines) to a `VehicleSystem` and
  turret hostility to shared faction helpers (R32#5).
- **`LootGenerator`** — the 370-line `spawnSpecialLoot` megamethod; split after the dead-code
  deletion (R11#13).
- **`SimulationManager`** — extract the ~110 lines of inline turret orchestration into a
  `TurretSystem` (TurretAI/TurretCombat already exist as its home) (R29#5).
- **Consistency layers worth centralizing:** a `TURN_PHASE` constants module for the 11
  raw-string phase assignments (R30#5); migrate zombie/NPC targeting onto
  `AITargeting.acquireTargets` so "who may I attack" lives in one place (R25#3).
- **`GameEngine`**: export the class alongside the singleton so tests can build isolated
  engines (two-line change, big test-hygiene payoff) (R41#9).

---

## Wave 5 — Test coverage (highest value-per-line first)

The review's most consistent complaint. You don't need all of it; write these **cheap, pure**
suites — each pins invariants the review flagged as fragile:

1. **`SeededRandom`** — determinism, `getState/setState` round-trip, `nextInt` bounds, shuffle
   permutation. ~40 lines, foundational for every seeded system (R2#12).
2. **LOS on a fixed ASCII map** — sight lines, occlusions, diagonal corners, door-state
   matrix, boundary tiles (R6#12). Pins T2 before/after refactor.
3. **Terrain property matrix** — one assertion per terrain × {walkable, blocksSight,
   destructible} once T2's table exists (R5#12).
4. **Schema tests (codify the audits the reviewer ran by hand):**
   - every `defId` in LootTables + NPCTypes + generator literals resolves in ItemDefs (R11#1,
     R14#5) — catches the dead-defId class permanently.
   - ItemDefs structural audit: id/key match, enum membership, reference resolution (R31#9).
   - every CraftingRecipe reference resolves (R34#9).
5. **`GameMap` round-trip** — both `fromJSON` and `fromJSONSelective`, catches T-bug R8#2.
6. **Full save round-trip** — seed → play → save → load → assert player/map/inventory/RNG-
   state/faction equality; version-floor + corrupt-save handling (R39#10).
7. **Combat roll math** — seeded unit tests for the 5 roll functions incl. crit bands and the
   clamping/NaN cases (R20#12).
8. **AI transitions** — LOS→hunt→lose→investigate→arrive→wander; the file's comment history
   proves regressions recur here (R18#11).

Everything above is headless-friendly via the existing `GameHarness`.

---

## Suggested sequencing

1. **First PR — safety + crash:** T5's `Item.js` `window.gameEngine` fix (P0 headless crash),
   the P0 data-loss bugs (GroundManager delete, fromJSONSelective, duplicate-ID), the dead-
   defId string fixes. Small, high-impact, low-risk.
2. **Second PR — dead code sweep (Wave 3).** Purely subtractive; makes the rest cleaner.
3. **Third PR — build strip + hot-path log silence (T6).** One-line vite change + a few
   deletions; immediately improves prod builds and profiling.
4. **Then themes T1, T3, T4, T8** (grep-and-sweep style) interleaved with the **cheap test
   suites (Wave 5.1–5.4)** that pin them.
5. **T2 (terrain/LOS unification)** as a focused piece with its tests — biggest correctness
   win, deserves its own PR.
6. **Wave 4 refactors** — never scheduled as a block; extract a seam each time you touch a
   god-object.

---

## Design backlog — NOT code quality (filtered out per request)

These are game-design / mechanics decisions the review surfaced. They need a designer's
yes/no, not an engineering fix. Route them wherever you track design, and *then* they may
generate code work. Listed so nothing is lost:

- Rain affects only player vision, not zombie vision / movement / sound (R17#2, R48, R46#1).
- Fire does not spread at all (R23#1).
- Explosions have no wall occlusion; ordnance vaporizes instead of chaining (R22#2, #3).
- Explosion-breached vs melee-breached doors/windows behave differently (R22#4) — *this one
  has a code-exploit kernel (players walk through explosion breaches but not smashed ones);
  worth fixing once the design intent is set.*
- Zombies are neutral to wildlife (R25#4); player-faction turrets only target zombies (R26#1);
  turrets are explosion-immune (R26#6).
- Zombie LKP never expires — "stop chasing" is arrival-based (R18#3).
- Barter economy vs Earbucks shop use unrelated valuations (R36#1).
- AI entities get no night/weather vision modifiers (R17#2).
- Weight limits declared but not enforced (R33#3) — *decide: enforce or delete the fields; the
  "dead fields lie" part IS code hygiene even if the mechanic is a design call.*
- Grenade/molotov damage tiers hardcoded outside ItemDefs (R31#4, R22#1) — *code-quality
  kernel (single source of truth) once the numbers are settled.*
- 60-tile activity cull freezes distant zombies (R29#4) — behavior-changing perf gate.

---

*Findings referenced as (R<review#>#<finding#>). Full detail in the source review file.*
