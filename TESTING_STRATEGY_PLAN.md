# Testing Strategy Plan — Headless Verification for Zombie Road

**Status:** Phase 1 in progress · **Created:** 2026-07-15 · **Owner:** rghavlin

## Motivation

This is a large turn-based game and manual playtesting is by far the most
expensive part of the loop. The goal of this plan is to build **headless,
scriptable ways to exercise the game** so that most regressions and balance
questions can be answered without a human playing through the UI.

This direction is a natural fit for the codebase:

- **Deterministic PRNG.** `SeededRandom` (mulberry32) plus the global
  `gameRandom` singleton, with `getState()`/`setState()`. A seed reproduces a
  run exactly — the linchpin for both crash-repro and stable balance numbers.
  (`client/src/game/utils/SeededRandom.js`)
- **DOM-free simulation core.** `CombatSystem`, `CombatResolver`,
  `MovementSystem`, `AISystem`, `VisionSystem`, `FireSystem`,
  `DestructionSystem` contain zero `document`/`window`/`canvas` references. The
  rules engine runs in Node with no shims.
- **One-call turn step.** `SimulationManager.runTurn(gameMap, { player })`
  advances the entire enemy/turret/NPC/AI half of a turn and returns an
  `actionQueue` without any renderer. (`client/src/game/managers/SimulationManager.js`)
- **Intent-based action model.** `IntentQueue` resolves `MoveIntent` /
  `DamageIntent` / `DestroyIntent` / etc. into systems — player actions are data
  objects that a script can synthesize. (`client/src/game/managers/IntentQueue.js`)
- **Node-safe engine.** `GameEngine` guards `typeof window` and
  `requestAnimationFrame`, so the singleton boots outside a browser.
- **Clean init path.** `GameInitializationManager`, `WorldManager`,
  `TemplateMapGenerator`, `EntityFactory`, and `GameMap` have no hard browser
  dependencies.
- **Proven precedent.** ~15 scratch scripts already drive
  `SimulationManager.runTurn` and `EntityFactory.createPlayer` headlessly
  (`scratch/diagnose_*.mjs`, `scratch/reproduce_*.mjs`,
  `scratch/test_zombie_vision_door.mjs`).
- **Language split helps.** All game logic is plain `.js` (JSDoc, not TS
  syntax), so a runner imports it directly. Only `.tsx` UI needs the React
  toolchain, and the bots never touch it.

## The one real complication

The `engine` singleton is imported directly across systems
(`engine.worldManager`, `engine.inventoryManager`, `engine.gameMap`), and there
is **no single `executePlayerAction()` function** — the player's turn is
orchestrated in React contexts (`ActionContext`, `Game.tsx`). So the bots need a
thin **headless player-action adapter** that does what the UI does: build the
intent, resolve it via `IntentQueue`, then call `runTurn`. That adapter is the
main new code; everything else is assembly. Its fidelity to real UI behavior is
the crux of the whole effort and must be pinned with tests.

---

## Foundation: a shared `GameHarness`

Everything below builds on one module (`test/harness/GameHarness.js`):

- **`bootstrap({ seed })`** — seeds `gameRandom`, resets the `engine` singleton,
  and either runs `GameInitializationManager` for a full generated world, or
  builds a minimal map+player (the `scratch/reproduce_*.mjs` pattern) for fast,
  controlled scenarios.
- **`applyPlayerAction(action)`** — the missing adapter. Translates
  `{type:'move',dx,dy}`, `{type:'attack',targetId}`, `{type:'reload'}`,
  `{type:'wait'}` into the same intents/AP deductions the UI produces, resolves
  them, then calls `SimulationManager.runTurn`.
- **`enumerateValidActions(player, map)`** — the currently legal actions
  (walkable neighbors, in-range targets, reloadable weapons, wait). Powers the
  fuzzer and constrains the balance sim.
- **`snapshotState()` / `assertInvariants()`** — wraps
  `GameMap.auditEntityComponents()` plus cheap checks (no NaN hp, AP within
  `[0,max]`, no two blockers on one tile, sane entity counts).

---

## Phase 1 — Integration test runner (Vitest) — *lowest effort, do first*

**Goal:** a green/red health check on every change.

- Add Vitest (native ESM `.js`, node environment).
- Add `npm test` / `npm run test:watch` / `npm run test:run`.
- Bridge the existing comprehensive
  `client/src/game/inventory/__tests__/Container.test.js` into the runner.
- Port the highest-value `verify_*.mjs` (saveload round-trip, loot generation,
  combat-coherence phases, battery/charge logic) into `test/**/*.test.js` with
  real `expect` assertions instead of `console.log`.

**Deliverable:** `npm test` runs a real suite and reports pass/fail. Immediately
useful and de-risks Phases 2–3 by exercising the same import graph the harness
will use.

### Phase 1 progress log
- Added `vitest` devDependency + `test` / `test:run` / `test:watch` scripts.
- Added `vitest.config.ts` (node env, `fileParallelism:false` so suites don't
  clobber the shared `engine` singleton, `test/**/*.test.{js,ts}` include).
- `test/inventory/container.test.js` — bridges the existing `runContainerTests()`
  suite (19 cases). Asserts no *unexpected* failures, with a documented
  `KNOWN_FAILURES` xfail list so new regressions still turn the suite red.
- `test/serialization/saveload.test.js` — ported from `verify_saveload.mjs`.
  That script imported a now-deleted `Player.js`; updated to
  `EntityFactory.createPlayer`.
- `test/loot/batteries.test.js` — ported from `verify_batteries.mjs`; the
  probabilistic world-loot check is made non-flaky (validates any battery that
  spawns rather than requiring one).
- Ported a second batch of `verify_*` scripts:
  - `test/ecs/facades.test.js` — from `verify_phase_2.mjs` (AIState facades,
    factory wiring, crafting progression, component serialization).
  - `test/systems/fire.test.js` — from `verify_phase_3.mjs` (Burnable +
    FireSystem ignite/process/tile-ignition).
  - `test/inventory/load_swaps.test.js` — from `verify_load_swaps.mjs`
    (battery-stack swap into a flashlight attachment: split + displacement).
  - `test/serialization/loot_restoration.test.js` — from
    `verify_loot_restoration.mjs` (full `GameSaveSystem.loadGameState` wiring a
    working LootGenerator; dropped its stale `Player.js` import).
  - `test/systems/death_and_explosions.test.js` — from `verify_phase_4.mjs`
    (death processing: zombie loot + target clearance, NPC inventory drops,
    rabbit carcass; ExplosionSystem routing lethal damage through
    DestructionSystem). Mocks `engine.lootGenerator` / `Math.random` /
    `gameRandom.next` and restores them in `afterAll` so the shared process
    isn't corrupted (the battery suite seeds `gameRandom`).
- Skipped `verify_book.mjs` / `verify_reading.mjs`: both reimplement the reading
  logic locally rather than calling product code (and import the deleted
  `Player.js`), so porting them would only test a private copy.
- Result: `npm test` → **8 files / 19 tests green**.

#### Behavior clarified during Phase 1 (resolved — intentional)
Equipping a ground backpack that still contains items is **intentional**: it
powers the backpack-swap workflow (open a ground backpack, auto-transfer items,
remove the worn one, put on the loaded one). `InventoryManager.equipItem()`
therefore has no "Items inside" guard by design — that guard lives only in
`moveItem` (~L2012) to block *nesting* a loaded backpack inside another
container. Documented in an `equipItem` code comment (~L464) and in the legacy
suite (renamed test "Loaded ground backpack: equippable, not nestable into
inventory"). `KNOWN_FAILURES` is now empty.

#### Stale expectations corrected during porting
- `verify_load_swaps.mjs` assumed the *attached* half of a split battery stack
  keeps the original instanceId; current behavior gives the attached piece a new
  `…-split-…` id and the *remainder* keeps the original. Which half keeps the id
  is an implementation detail, so the port asserts the meaningful invariants
  instead (attached stackCount 1, remainder stackCount 4, empty battery displaced).
- `verify_phase_4.mjs` expected rabbits to drop `food.raw_meat`; they now drop
  `food.rabbit_carcass` (DestructionSystem.js ~L60). Both rabbit assertions
  updated.

---

## Phase 2 — Fuzz / random-walker bot — *medium effort*

**Loop:** `enumerateValidActions` → pick one with the seeded RNG →
`applyPlayerAction` → `assertInvariants`, for N turns across M seeds.

- On any throw or invariant failure, dump `{ seed, initialState, actionLog }` to
  a crash file.
- Add a **replay runner** that reloads a crash file and steps it
  deterministically — turning any crash into a permanent Phase 1 regression test.

**Deliverable:** `npm run fuzz -- --seeds=1000 --turns=5000`. Most of the effort
is the `applyPlayerAction` adapter, which is shared with Phase 3.

### Phase 2 progress log
- `test/harness/GameHarness.js` — the shared foundation, built against the real
  systems (no reimplementation of game rules):
  - `bootstrap()` seeds `gameRandom`, resets the `engine` singleton, builds a
    minimal floor map, spawns the player via `EntityFactory`, and wires
    `engine.{gameMap,player,worldManager,inventoryManager}`.
  - `applyPlayerAction()` — **move** via `MovementSystem.resolve` (validates &
    deducts AP through the same path the AI uses); **attack** mirrors
    `CombatContext.performMeleeAttack`'s core (`CombatResolver.rollPlayerMelee`
    + `applyArmorAbsorption` + `takeDamage` + `useAP(1)`); **wait**.
  - `endTurn()` — runs `SimulationManager.runTurn` (authoritative enemy/AI turn)
    plus distilled player upkeep + AP refill (with the game's injury penalty).
  - `enumerateValidActions()`, `snapshotState()` (incl. `gameRandom.getState()`
    for replay), `assertInvariants()` (finite hp/ap bounds + `auditEntityComponents`).
  - `spawnZombie()` helper for scenarios.
- `test/harness/harness.test.js` — 5 smoke tests: bootstrap, one-step move, kill
  an adjacent zombie, 25 end-turns with roaming zombies holding invariants, and
  determinism (same seed + script → identical outcome).
- **Constraint discovered:** the harness drives process-global singletons
  (`engine`, `gameRandom`), so only one harness may be live at a time and runs
  must be sequential. Documented in the module header.

- Fuzz CLI + core shipped:
  - `test/fuzz/fuzzer.js` — `fuzzSeed()` (random-walker over `enumerateValidActions`,
    seeded selection RNG separate from the game RNG, records a flat `ops` log,
    checks invariants every step) and `replayLog()` (deterministic replay of a
    recorded run). `test/fuzz/fuzz.mjs` — CLI (`npm run fuzz -- --seeds=N
    --turns=N --zombies=N`, plus `replay <crash.json>`); writes crash dumps to
    `fuzz-crashes/` (gitignored) and exits non-zero on any crash for CI.
  - `test/fuzz/fuzzer.test.js` — smoke: several seeds run clean; a run replays to
    an identical final state.
  - Batch results: 100 seeds × 300 turns → 0 crashes, 0 invariant violations.

#### Fidelity fix surfaced by the fuzzer (important engine gotcha)
The fuzzer immediately exposed that **zombie/NPC attacks dealt zero damage to the
player headlessly**. Root cause: entity-vs-entity combat is **playback-first** —
`CombatSystem.resolve` computes the hit but does NOT apply damage when an
`actionQueue` is present; `TurnManager`'s ATTACK case applies `takeDamage()`
during the swing animation (CombatSystem.js ~L137, TurnManager.js ~L301). The
headless `endTurn()` ran the sim but never played the queue back. Fixed by
`GameHarness._applyPlaybackDamage()`, which mirrors TurnManager's ATTACK effects
(armor absorption, takeDamage, bleeding/sickness/infection) then runs a death
sweep. Verified: 4 adjacent zombies now drop an 18-HP player to 0 in one turn,
and fuzz runs end in realistic player deaths.

- `applyPlayerAction` extended to the full action set, each mirroring real UI code:
  - `shoot` — `CombatContext.performRangedAttack` core (rangedStats, magazine/
    stack ammo consumption, range + `LineOfSight` checks, `rollPlayerRanged`,
    direct damage). Single-shot (no burst/sling/scope in v1).
  - `reload` — `InventoryContext.loadAmmoDirectly` (`attachItemToWeapon` on the
    `ammo` slot + `useAP(1)`), auto-finding compatible ammo in inventory.
  - `throw` — `performGrenadeThrow` (ExplosionSystem blast) and `performStoneThrow`
    (falloff hit roll + 1-4 dmg). Both LOS-checked, `useAP(1)`, consume one.
    Molotov not modelled (needs igniter + fire propagation).
  - Scenario helpers added: `equipItemDef`, `giveItemDef`, `loadWeaponAmmo`,
    `getRangedWeapon`. `enumerateValidActions` now offers `shoot`/`reload` when a
    gun + ammo are present.
  - Smoke-tested: reload loads a `.357` pistol; a full magazine into a stationary
    zombie deals damage + consumes ammo; a grenade throw damages a nearby zombie.

#### Determinism fix in product combat (2026-07-16)
Player stone throws and acid-splash damage rolled on raw `Math.random`, making
them non-reproducible headlessly. A stale `CombatContext.jsx` comment claimed
player combat *deliberately* avoids `gameRandom` for save/load safety — but
`CombatResolver.rollPlayerMelee`/`rollPlayerRanged` already roll on `gameRandom`,
so the premise was moot, and save/load stays safe because gameRandom **state** is
checkpointed (`getState`/`setState`), not re-seeded. Converted the three sites
(acid-splash damage, stone hit, stone damage — CombatContext.jsx ~L141/783/793)
to `gameRandom` and corrected the comment. Molotov didn't actually use
`Math.random` (igniter picked by charge). Stone throws are now supported in the
harness with a determinism smoke test.

**Still TODO for Phase 2:**
- Burst/sling ranged modes; molotov throw (needs igniter + fire propagation).
- Longer-term: extract `GameContext.simulateTurn`'s pure core into a shared
  module so `endTurn()` uses it verbatim instead of a distilled copy.

---

## Phase 3 — Balance simulator — *medium effort, reuses Phase 2 harness*

- Scenario builder: e.g. "Level-5 player, shotgun, vs 10 zombies in an arena"
  (minimal-map bootstrap).
- Run K iterations headless (distinct seed each), aggregate win/loss,
  turns-to-clear, damage dealt/taken, ammo used, drop-rate distributions →
  CSV/JSON.

**Deliverable:** `npm run balance -- --scenario=shotgun_vs_10 --runs=10000`.
Combat is deterministic per seed, so 10k runs is just a loop.

### Phase 3 progress log (DONE)
- `test/balance/balance.js` — `runScenario(scenario, seed)` drops a configured
  player into an arena of zombies and runs a fixed greedy policy (reload → shoot
  in-LOS → melee adjacent → step toward nearest), returning outcome + metrics
  (turns, kills, HP left, damage dealt/taken, shots, swings). `runBalance()`
  aggregates over K seeds into win/loss/timeout rates and averages.
- `test/balance/scenarios.js` — built-in `shotgun_vs_10`, `pistol_vs_6`,
  `melee_vs_4` (data-driven knobs: weapon, ammo, skill, HP, zombie count/spread).
- `test/balance/balance.mjs` — CLI: `npm run balance -- --scenario=NAME
  [--runs=N] [--zombies=N] [--maxhp=N] [--json=out] [--csv=out]`, `--list`.
- `test/balance/balance.test.js` — smoke: terminal outcome + sane metrics,
  determinism (same scenario+seed → identical), well-formed rates, shotgun winnable.
- First numbers (300 runs each): `shotgun_vs_10` 100% win (~22 shots, ~11 dmg
  taken); `pistol_vs_6` 100% win; `melee_vs_4` **41.7% win / 58.3% loss** — the
  interesting tuning case. Ranged dominates when enemies spawn at range; melee is
  a real coin-flip. Player AP bounds actions/turn correctly (deterministic).
- Note: per-turn action count is bounded by the factory player's `maxAp`; scenarios
  can override `maxHp`/`maxAp` to model different character builds.

**HP/AP tuning knobs (added 2026-07-16):** the balance player's `maxHp`/`maxAp`
now derive from attributes exactly like gameplay — `maxHp = 10 + ⌊Con·0.4⌋`,
`maxAp = 10 + ⌊(Agi+Per)/5⌋` via `deriveSecondaryStats` (attributes also feed the
combat rolls). Scenarios no longer hard-set HP; the baseline is the real factory
character. Knobs: scenario `attributes` block or direct `maxHp`/`maxAp`; CLI
`--con/--agi/--per/--str/--maxhp/--maxap`; and a **sweep**:
`--sweep=constitution --from=15 --to=35 --step=5` prints a win-rate/survivability
curve (CSV via `--csv`). First finding: on `melee_vs_4`, **AP is the dominant
lever** — sweeping maxAp 10→22 moves win rate 0%→42.5%, while Constitution 15→35
(maxHp 16→24) only moves it 16%→30%. AP (actions/turn) matters far more than HP.

**Phase 3 follow-ups (optional):** drop-rate distribution capture, richer policies
(kiting, target priority), and two-knob sweeps (HP×AP grid).

### HP/AP tuning investigation (2026-07-16) — findings, no code changed
Prompted by playtesting feedback that HP/AP (boosted via attributes) feel too
high, even at character creation. Investigated with the balance sim + a new
AP-economy harness; **no production code was changed** — this is a design
reference for whenever the change is greenlit.

**Root cause of "feels high even at creation, barely grows by turn 500":** the
character-creation screen's typical build (20/30/30/40, all 80 points spent)
already lands at 26 HP / 22 AP under the current formula. ~500 turns of XP
growth + a common buff (brainstem stew) only adds +1 HP / +4 AP on top (27/26) —
almost the entire floor-to-ceiling range is consumed on day one, not earned over
play. Also: that Agi/Per-heavy build isn't a fluke — it's close to the
mathematically optimal build per our own `melee_vs_4` finding that AP is the
dominant combat lever, so players are incentivized into exactly this shape.

**Candidate formula sized and combat-checked:**
`HP_FLOOR 10→16, HP_PER_CON 0.4→0.22, AP_BASE 10→14, AP_ATTR_DIVISOR 5→8, AP_FLOOR 5→8`
(raises the floor, compresses the ceiling). Checked via `balance.mjs --maxhp/--maxap`
against `melee_vs_4` and `pistol_vs_6`:
  - Ranged combat is unaffected (100% win across the whole HP/AP range either way —
    consistent with the ammo/reload ceiling effect found earlier).
  - **Melee combat drops meaningfully**: creation build 71.4%→60.8% win, turn-500
    build 88.4%→76.4% win. The floor build barely improves (1.8%→11%, still a
    near-certain loss vs 4 zombies either way). This candidate is a real
    difficulty increase for melee, not a free lunch — flagged to owner before
    any implementation.

**Second investigation — AP-economy / scavenging (separate from combat):**
built `test/balance/apEconomy.js` (+ `apEconomy.mjs` CLI: `npm run ap-economy --
--ap=14,18,21,22,24,26`, + `apEconomy.test.js`) to check the "most AP goes to
moving around" half of the complaint, which the balance sim doesn't model.
Deliberately uses the REAL `Pathfinding.calculateMovementCost` (diagonal =
1.4 AP/tile, every-5-tiles -0.5 bulk discount) rather than the harness's flat
per-step AI mover, since that's what `PlayerContext.startAnimatedMovement`
actually charges the player.
  - Confirmed a hard game rule: `GameMapContext.jsx:110`
    (`if (movementCost > player.ap) return;`) rejects a walk outright if its
    full path cost exceeds current AP — no partial moves, so "AP left after one
    leg" is the operative metric, not "does a round trip fit in one bar."
  - **Finding: the HP/AP formula is NOT the scavenging bottleneck — movement
    cost is.** An 8-tile one-way leg costs ~10.7 AP, i.e. roughly HALF of a
    typical 21-22 AP bar; a round trip (21.4 AP) consumes nearly the entire bar
    regardless of which formula (current vs. candidate) is used. Current vs.
    candidate only differ by ~1 AP of leftover at every distance tested — a
    small, proportional effect, dwarfed by the 10+ point combat swing above.
  - Sharpest case: a floor-attribute character (14 AP, current formula) cannot
    even complete a 12-tile one-way leg (walk is rejected, cost 15.8 > 14 AP);
    the candidate's raised floor (18 AP) fixes that specific case but still
    can't reach 16 tiles.
  - **Conclusion:** the combat-tuning candidate above and the scavenging
    complaint are two separate levers. Fixing scavenging-AP-starvation likely
    requires touching movement cost (`Pathfinding.getMovementCost`'s per-tile/
    diagonal cost) or `AP_BASE` specifically, not `HP_PER_CON`/`AP_ATTR_DIVISOR`
    (which are combat-facing). Conflating the two risks under-fixing scavenging
    while over-nerfing melee.

**Status:** data-gathering only, awaiting a design decision. No changes to
`SurvivalCascade.js` or `Pathfinding.js` were made.

---

## Additional ideas to fold in

1. **Save/load round-trip fuzzing** — after N random turns, `toJSON` →
   `fromJSON` → assert deep-equal. Guards the malformed-entity-serialization
   bug class already seen in this project. Nearly free once the fuzzer exists.
2. **Map-gen golden/snapshot tests** — `seed → hash(map + loot)`. Catches
   unintended world-gen / loot-budget regressions.
3. **Performance-regression harness** — time `runTurn` over a fixed seeded
   scenario; fail on >X% regression. Complements `PERFORMANCE_OPTIMIZATION_PLAN.md`.
4. **Shared trace/replay format** — one JSON action-log schema used by fuzz
   (record), balance (optional record), and the replay runner. Makes
   "reproduce the bug" a one-liner and feeds crashes back into the suite.
5. **CI wiring** — a GitHub Action (or pre-commit) running Phase 1 plus a short
   fuzz smoke (50 seeds × 200 turns) on every push.
6. **Balance sweep mode** — parameterize a stat range (e.g. shotgun damage
   6→14) and emit a win-rate curve; tuning becomes reading a table.

---

## Risks / caveats

- **`applyPlayerAction` fidelity** is the crux — if it diverges from UI
  behavior, bot results won't reflect the real game. Build it in Phase 1/2 and
  pin it against known-good `verify_*` outcomes before trusting Phases 2–3.
- **Singleton global state** — tests must fully `reset()` the engine between
  runs to avoid state bleed (`beforeEach`).
- **Adapter drift** — keeping the UI's per-action logic in shared helpers the
  adapter also calls (rather than duplicated) prevents divergence over time; a
  small refactor worth considering.

## Rough effort

~1 week for all three, with Phase 1 delivering value on day one.
