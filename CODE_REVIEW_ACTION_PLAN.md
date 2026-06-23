# Code review action plan

Consolidated findings from full codebase review (2026-06-22).
Items are ordered so that foundational fixes land first and later items can build on them.

---

## Phase 1 — Constants, enums, and shared utilities

These are prerequisites that many later fixes depend on. Establishing shared constants and fixing enums first means subsequent work can reference them.

- [x] **P1-01** Add missing `ItemCategory` entries in `traits.js`
  - Add `CONTAINER: 'container'` and `FURNITURE: 'furniture'`
  - Tag backpacks and furniture items with the new categories in `ItemDefs.js`
  - Fixes: TradingSystem backpack premium silently failing, undefined entries in category arrays

- [x] **P1-02** Export `TURRET_DEF_ID` from `TurretCombat.js` and use it everywhere
  - Replace all raw `'placeable.auto_turret'` string literals across 17+ files
  - Consider a semantic flag like `item.isTurret` for type checks in `Tile.js`

- [x] **P1-03** Define shared constants for repeated magic numbers
  - `REFERENCE_AREA = 5625` (used in WorldManager, GameInitializationManager, LootGenerator)
  - `DEFAULT_MAX_VISION_RANGE = 15`, `FLASHLIGHT_RANGE = 8` (GameEngine, GameContext, GameSaveSystem)
  - `DEFAULT_DANGER_RADIUS` for NPCAI (currently 5 in one place, 8 in two others)
  - Put in a central config file or extend existing `VisionConfig.js` / `ProgressionConfig.js`

- [x] **P1-04** Remove all dead `'EntityType.ZOMBIE'` string comparisons
  - Search for `=== 'EntityType.ZOMBIE'`, `=== 'EntityType.NPC'`, etc. across the codebase
  - These are always dead branches masked by a preceding `|| e.type === 'zombie'` check
  - Files: NPCSpawner.js, LineOfSight.js, VisionSystem.js, GameMapContext.jsx, PlayerContext.jsx, others

- [x] **P1-05** Consolidate redundant `EntityType` checks in NPCAI
  - Remove duplicate `e.type === EntityType.ZOMBIE || e.type === 'zombie'` checks
  - Verify `EntityType.ZOMBIE === 'zombie'` and use only the constant form throughout

- [x] **P1-06** Extract fuel value table into a single shared utility
  - Currently duplicated in InventoryManager.fuelCampfire, InventoryManager.attachItemToWeapon, and CraftingManager.craft
  - Create `getFuelValue(item)` utility

- [ ] **P1-07** Extract `isInsideCompound(compound, x, y)` utility
  - Currently inlined in 5+ locations across TemplateMapGenerator and LootGenerator

- [ ] **P1-08** Extract `getHourFromTurn(turn)` utility
  - Formula `(6 + (turn - 1)) % 24` is repeated in 5+ locations
  - GameEngine, GameContext (3 occurrences), GameMap

---

## Phase 2 — Bugs with immediate correctness impact

These are real bugs that can cause crashes, wrong behavior, or data corruption right now.

- [ ] **P2-01** Fix turret-kills-turret cleanup gap
  - After turret simulation in SimulationManager, scan for turret items with `hp <= 0`
  - Call `removeDestroyedTurret` or add turret items to `checkAndProcessDeaths`
  - Currently: destroyed turrets persist at hp=0, still blocking tiles

- [ ] **P2-02** Fix `TURRET_SHOT` emitting `ZOMBIE_KILLED` for all target types
  - In TurnManager.js:357, include `targetType` in action data
  - Only emit `ZOMBIE_KILLED` when target is actually a zombie

- [ ] **P2-03** Fix `setTerrain()` async race condition in GameMap
  - Replace dynamic `import('../inventory/Item.js').then(...)` with a static import at file top
  - GameMap.js:499

- [ ] **P2-04** Fix `saveCurrentMap()` async race condition in WorldManager
  - Await the compression or use a lock/flag to prevent loads during compression
  - WorldManager.js:117

- [ ] **P2-05** Fix `isItemEquipped` and `getEquipmentSlot` to compare by `instanceId`
  - InventoryManager.js:877 and :883
  - Currently compares `item.id` (defId), producing wrong matches with duplicate items

- [ ] **P2-06** Fix `searchItems` crash on null subtype
  - GroundManager.js:521 — add null guard: `item.subtype?.toLowerCase()`

- [ ] **P2-07** Fix crafting autoload/unload to handle cooking workspace
  - CraftingManager.js:585 and :637
  - `autoload()` and `unload()` only handle `crafting-tools`/`crafting-ingredients`
  - Add `cooking-tools` and `cooking-ingredients` handling

- [ ] **P2-08** Fix `EarbucksShopWindow` snapshot returning mutable reference
  - Have `getCatalog()` return a shallow copy or replace the array on mutation
  - EarbucksShopWindow.tsx:134

- [ ] **P2-09** Fix `addRandomWalls`/`addRandomFloors` infinite loop potential
  - TemplateMapGenerator.js:581 — add max-attempts guard to `while (added < count)` loops

- [ ] **P2-10** Fix `executeTransition()` reporting wrong `fromMapId`
  - WorldManager.js:880 — save `fromMapId` before overwriting `this.currentMapId`

- [ ] **P2-11** Fix `disassembleItem` emitting wrong event name
  - InventoryManager.js:2921 — emit `'inventoryChanged'` instead of `'update'`

- [ ] **P2-12** Fix mismatched save/load stat defaults
  - GameSaveSystem.js save defaults to `100`, load defaults to `1000`
  - Align to a single set of constants

- [ ] **P2-13** Remove or implement empty fleeing-recovery block in Entity
  - Entity.js:776 — `startTurn()` checks fleeing state but body is empty

- [ ] **P2-14** Fix `spawnTestEntities()` referencing undefined classes
  - GameContext.jsx:1483 — remove or import `TestEntity` and `LegacyItem`

- [ ] **P2-15** Add try/catch around turret firing in SimulationManager
  - SimulationManager.js:115 — matches existing pattern used for NPCs and rabbits

---

## Phase 3 — Hardcoding cleanup

Address remaining hardcoded values to make the codebase data-driven and extensible.

- [ ] **P3-01** Use dynamic map ID for earbucks catalog init
  - GameInitializationManager.js:424 — replace `'map_001'` with actual map ID variable

- [ ] **P3-02** Move NPC combat stats to weapon definitions
  - NPCAI.js:498 — ranged engagement range hardcoded to `8` instead of weapon range
  - NPCAI.js:729 — AP costs `2.0`/`1.0` hardcoded instead of from weapon def

- [ ] **P3-03** Move spawn coordinates and template sizes to template metadata
  - WorldManager.js:439 — spawn X positions per template type (22, 62, 30, 35)
  - WorldManager.js:534 — map-number-to-template assignments
  - TemplateMapGenerator.js:187 — stale spawn zone coordinates

- [ ] **P3-04** Move earbucks shop catalog to a data file
  - EarbucksShopSystem.js:18 — catalog items hardcoded in system class
  - Derive item names from `ItemDefs` instead of duplicating

- [ ] **P3-05** Remove hardcoded turret stats fallback in TurretAI
  - TurretAI.js:62 — fallback stats duplicate ItemDefs values and can drift

- [ ] **P3-06** Move decoration probability, building margins, and other map gen constants to config
  - TemplateMapGenerator.js:452 — 0.08 probability inline
  - MapBuilder.js:882 — 2-tile border margin hardcoded
  - MapBuilder.js:470 — `minInteriorSize = 3` repeated in four layout methods

- [ ] **P3-07** Move weapon direct-load capacities to weapon definitions
  - InventoryManager.js:1203 — per-weapon capacity hardcoded by defId

- [ ] **P3-08** Move book page count fallback to definition data
  - Item.js:827 — magic number `500` for pagesLeft fallback

- [ ] **P3-09** Fix road template size/layout mismatch
  - TemplateMapGenerator.js:142 — `road` template declares 45x125 but layout is 20x39
  - Either remove the stale layout or match the declared size

- [ ] **P3-10** Fix `belt.tool_ring` referencing non-existent `'weapon.pliers'`
  - ItemDefs.js:2186 — should be `'tool.pliers'`
  - Consider using a category instead of an explicit defId list

---

## Phase 4 — Deduplication and code consolidation

Reduce maintenance burden by extracting shared logic from copy-pasted code.

- [ ] **P4-01** Extract shared kill-processing logic from CombatContext
  - Five combat functions duplicate: target finding, LOS, damage calc, kill processing, earbuck awards, loot drops
  - Extract `processKill()`, `awardEarbucks()`, and shared target-resolution helpers
  - Also consolidate the 5 identical earbuck award blocks and remove redundant `|| 0` guards

- [ ] **P4-02** Extract shared map population pipeline from WorldManager
  - `generateNextMap()` and `executeTransition()` duplicate ~200 lines
  - Create a `populateMap()` helper for template selection, spawning, loot, etc.

- [ ] **P4-03** Deduplicate `loadMap()` / `loadMapForTransition()` in WorldManager
  - ~90% identical code, difference is `fromJSON` vs `fromJSONSelective` and event name

- [ ] **P4-04** Deduplicate `fromJSON()` / `fromJSONSelective()` in GameMap
  - ~200 lines of identical tile/entity restoration logic

- [ ] **P4-05** Deduplicate `loadGameFromStateData()` / `loadGameDirect()` in GameContext
  - ~80 lines each with trivially different data sources

- [ ] **P4-06** Have TurretAI delegate to AITargeting for target selection
  - TurretAI reimplements filter-hostile/check-range/check-LOS/sort-by-distance
  - AITargeting.acquireTargets already provides this pipeline

- [ ] **P4-07** Deduplicate `findSouthExitTile` / `findSouthTransitionTile`
  - NPCAI.js and NPCSpawner.js have identical implementations

- [ ] **P4-08** Deduplicate `isInsideAnyBuilding` lambda
  - Defined independently in LootGenerator.spawnFurniture and spawnScooter

- [ ] **P4-09** Deduplicate food scarcity formula
  - `0.4 + (mapNumber - 1) * 0.05` copy-pasted in `generateRandomItems` and `generateZombieLoot`

- [ ] **P4-10** Deduplicate largest-item-in-tile logic in EntityRenderer
  - Same `maxArea` scan runs twice in `renderEntity` (lines 161 and 311)

- [ ] **P4-11** Extract `gridItems` helper from TurretCombat and reuse in SimulationManager

- [ ] **P4-12** Consolidate `escalateTurretsAgainstPlayer` naming
  - TurretCombat.js:143 — also escalates NPCs despite the name
  - Rename to `escalateFactionAgainstPlayer` or split

- [ ] **P4-13** Deduplicate starting equipment blocks in GameInitializationManager
  - Easy/normal mode blocks share shirt+pants creation identically

---

## Phase 5 — Architecture and scalability improvements

Larger structural improvements for long-term maintainability as the game grows.

- [ ] **P5-01** Standardize on one event emitter implementation
  - Three implementations: SafeEventEmitter, EventEmitter, raw Map-of-arrays
  - Migrate GameMap and WorldManager to SafeEventEmitter

- [ ] **P5-02** Document or unify simulation-first vs playback-first damage model
  - Turrets apply damage during simulation; attacks apply during playback
  - At minimum add clear comments; ideally unify to simulation-first for all

- [ ] **P5-03** Reduce Entity class boilerplate
  - ~600 lines of repetitive getter/setter facades for AIState, SurvivalStats, PlayerSkills
  - Use `defineAccessors` helper or Proxy to generate them

- [ ] **P5-04** Make Entity serialization registry-driven
  - `toJSON()`/`fromJSON()` manually list 40+ fields with duplicated `itemFields` array
  - A registration-based approach prevents silent data loss when adding properties

- [ ] **P5-05** Unify `consumptionEffects` format in ItemDefs
  - Array format `[{ type, value }]` vs object format `{ cure: true }`
  - Standardize to one schema

- [ ] **P5-06** Thread seeded PRNG through map generation and combat
  - RoadNetwork already accepts injectable random
  - TemplateMapGenerator, MapBuilder, LootGenerator, TurretAI, NPCAI all use bare `Math.random()`
  - Enables reproducible maps and testable combat

- [ ] **P5-07** Replace biased `sort(() => Math.random() - 0.5)` with Fisher-Yates shuffle
  - Appears 10+ times across TemplateMapGenerator and LootGenerator

- [ ] **P5-08** Add FactionRegistry validation for faction names
  - Currently any string including typos silently returns NEUTRAL
  - Add dev-mode warning for unrecognized faction IDs

- [ ] **P5-09** Add `removeDestroyedTurret` silent-failure logging
  - TurretCombat.js:162 — returns silently if neither removal path matches

- [ ] **P5-10** Separate earbucks from PlayerSkills component
  - Currency stored alongside skill stats conflates two concerns
  - Consider a `PlayerCurrency` or `PlayerWallet` component

- [ ] **P5-11** Consider long-term AI execution model unification
  - Zombies use intent/component system; NPCs use direct imperative mutation
  - Document the split explicitly and route new entity types consistently
  - Full unification is a larger effort but should be planned

---

## Phase 6 — Performance and rendering

Address hot-path issues that will matter as maps get larger.

- [ ] **P6-01** Hoist `terrainColors` object out of `drawTile`
  - TileRenderer.js:29 — allocated inside per-tile render function, thousands of times per frame
  - Move to module scope as a `const`

- [ ] **P6-02** Pass `currentTime` to TileRenderer instead of calling `Date.now()` per tile
  - TileRenderer.js:208 — called for every tile with fire overlay

- [ ] **P6-03** Cache grass/road sprite variant indices
  - TileRenderer.js:63 — deterministic hash recomputed every frame for every tile

- [ ] **P6-04** Pre-compute item category flags on entities instead of per-frame lookups
  - EntityRenderer.js:241 — scans defId, traits, categories, and falls back to ItemDefs lookup per item per frame

- [ ] **P6-05** Cache `isSheltered()` results per tile per turn
  - GameMap.js:160 — BFS runs per-entity per-turn but buildings don't change between turns

- [ ] **P6-06** Reduce per-tile event listeners on large maps
  - GameMap.js:52 — creates tileClicked/tileHovered listeners on every tile (45,000 on 150x150)
  - Single handler on map with coordinate computation would scale better

- [ ] **P6-07** Fix `recalculateFOV` scalability
  - GameEngine.js:448 — O(area * lights * LOS) with 2601-tile scan
  - Consider caching light sources or limiting scan to known emitter positions

---

## Phase 7 — Cleanup and polish

Low-risk items to address as you touch adjacent code.

- [ ] **P7-01** Set `NPCAI.DEBUG = false`

- [ ] **P7-02** Gate console.log calls behind debug flags or use Logger utility consistently

- [ ] **P7-03** Rename `Container.autoSort()` method to `performAutoSort()` to avoid shadowing the boolean property

- [ ] **P7-04** Fix `Item.js` double-assignment of `dragApPenalty`/`noDrag` (lines 214-215 and 242-248)

- [ ] **P7-05** Remove dead `getDefId` check in `Item.js:999`

- [ ] **P7-06** Remove dead `insideWeight` field in LootGenerator.js:29

- [ ] **P7-07** Remove orphaned JSDoc comment block in LootGenerator.js:389

- [ ] **P7-08** Fix variable shadowing `w` in MapBuilder.js:53 (`clearArea` filter callback)

- [ ] **P7-09** Change `let dist` to `const dist` in TurretAI.js:104

- [ ] **P7-10** Use `instanceId` comparison only in `removeDestroyedTurret` (drop reference-equality check)

- [ ] **P7-11** Replace `Math.random().toString(36).substr()` with `substring()` (deprecated method)
  - NPCSpawner.js:179, ItemDefs.js:2580

- [ ] **P7-12** Standardize `SPECIAL_BUILDING_LOOT` table format in LootTables.js
  - Some entries are flat arrays, others are nested objects

- [ ] **P7-13** Remove catch-all property copy loop in Item constructor
  - Item.js:318 — `for (const [key, value] of Object.entries(config))` copies any unknown property

- [ ] **P7-14** Add price validation in EarbucksShopSystem.addItem
  - Zero/negative prices allow free or earbuck-generating purchases

- [ ] **P7-15** Remove stale `window.gameInitInstances` tracking from GameInitializationManager

- [ ] **P7-16** Log warning for unknown NPC subtype fallback in NPCTypes.js:88

- [ ] **P7-17** Fix Item constructor fireMode conditional clarity (Item.js:264)

- [ ] **P7-18** Fix SimulationManager item position fallback to player position
  - SimulationManager.js:117 — skip items lacking coordinates instead of guessing player position

---

*Total: 81 items across 7 phases.*
*Generated from review of ~45 source files on 2026-06-22.*
