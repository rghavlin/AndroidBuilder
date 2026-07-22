Review 1 — ECS Component Definitions (client/src/game/components/)
Summary
Overall these are clean, small, consistent data bags. 23 of 25 are pure constructors + toJSON(). The main findings are: no invariant enforcement (negative values accepted everywhere), three inconsistent default-value idioms (one of which is a real falsy-bug risk), one leaky toJSON() that can silently drop save data, and documented-but-real overlap between AIBehavior/AIState and Health/RpgStats/SurvivalStats. Nothing here is a crash-level bug; most issues are consistency and save-integrity risks.

Findings
Correctness
1. No validation — any component can be constructed in an invalid state. new Health({ current: -50, max: 0 }), new ActionPoints({ current: -10 }), new ExplosionIntent({ radius: -3, minDamage: 100, maxDamage: 10 }) all succeed. There is no clamping anywhere. If the invariant "systems own all validation" is deliberate, it's undocumented; if not, current > max and minDamage > maxDamage states are constructible and will serialize into save files. At minimum a one-line comment stating "components are dumb; invariants enforced by systems" would close the gap.

2. Falsy-default idiom in AIState and Burnable is a latent bug. Most components use the safe properties.x !== undefined ? properties.x : default pattern. Three don't:

AIState.js:3-23 uses properties.x || default throughout. For current fields the falsy values that get clobbered (0, false, '') happen to equal the defaults, so it's harmless today — but any future field with a truthy default (e.g. fleeRecoverChance || 0 later changed to a nonzero default) will silently swallow legitimate explicit 0/false values from deserialization. Note AIState already uses the correct ?? null for attackOnSight (AIState.js:28), so the file is internally inconsistent.
Burnable.js:3-4 — same || pattern.
RpgStats.js:13-21 — XP fields use || 0. Same latent issue.
3. DamageIntent vs ExplosionIntent coordinate defaults disagree. DamageIntent.targetX/targetY default to null; ExplosionIntent.targetX/targetY default to 0. 0 is a valid map coordinate, so a default-constructed ExplosionIntent points at a real tile (0,0) while a default DamageIntent is detectably "unset." Pick one sentinel.

4. Shared-object defaults: clean. I checked specifically for the classic mutable-default bug. Every array/object default (Vision.visibleTiles, AIBehavior.currentPath, Inventory.items, AIState.noiseCoords, etc.) is constructed fresh inside the constructor. No shared references.

5. toJSON() returns shallow spreads. { ...this } shares nested arrays/objects (Vision.visibleTiles, Inventory.items, AIBehavior.currentPath) with the live component. Fine if the result is immediately JSON.stringify'd, but if toJSON() is ever used as a clone/checkpoint mechanism, mutations leak through. Worth a comment or a deep-copy where nested data exists.

Architecture
6. Components are (almost) pure data bags — two minor leaks.

PlayerSkills.js:13-25 has two static methods (getNextCraftingTarget, getNextHitMilestone). They're pure, side-effect-free formulas, so this is a mild violation — but it is game-balance logic living in a component. They'd belong in a config/progression.js-style module (the project already has config/progression).
AIBehavior.js:21-27 performs legacy save-migration in the constructor (state → alertnessState.toUpperCase(), lastSeenPlayerAt → lastSeenPlayerCoords). Deserialization migration is logic; it's small and well-documented in the header comment, so this is acceptable, but a dedicated deserializer/migration layer would be cleaner.
7. Save-migration inconsistency: AIBehavior handles legacy keys, but nothing else does. If save format evolves for other components, there's no established pattern — each component will invent its own.

Performance
8. No issues in components themselves. All field lookups are plain own-property reads; no getters, no computed properties, nothing to cache. Vision.visibleTiles/visibleEntities can grow large and are serialized wholesale by toJSON() — that's save-file bloat and serialize cost per save, not per-frame cost, but since Vision is transient (recomputed by VisionSystem each cycle, per _visionDirty), persisting it is arguably wasted save size. Adjacent (out of scope but worth flagging): IntentQueue.processIntent does entityList.find(e => e.id === intent.entityId) — O(n) per intent (IntentQueue.js:81).

Code Quality / Naming
9. Naming conventions are mostly coherent; noted inconsistencies:

The dominant idiom is current/max (Health, ActionPoints) — good. But SurvivalStats uses nutrition/maxNutrition (prefix style), EquippedArmor uses absorption/maxAbsorption — two conventions for the same "pool" concept.
Damage fields: DamageIntent.amount vs MeleeWeapon.damage vs ExplosionIntent.minDamage/maxDamage — three names for damage quantities.
AIBehavior.alertnessState ('IDLE' uppercase) vs AIState.behaviorState ('idle' lowercase) — same concept, different case conventions, acknowledged in AIBehavior's own header comment.
NoiseEvent is resolved through IntentQueue like an intent (IntentQueue.js:99-101) but named "Event" — it sits in the intent family without the Intent suffix.
AIBehavior.currentPath defaults to []; AIState.currentPath defaults to null — same field name, different empty representation. Anything consuming both must handle two shapes.
Potential name collision: components/Item.js (name/weight/description bag) vs the real item model in inventory/ (ItemDefs, createItemFromDef). Two "Item" concepts with very different shapes.
10. AIState.toJSON() is a hand-maintained field list; every other component spreads. AIState.js:32-51 enumerates fields explicitly. If a field is added to the constructor and not to toJSON(), it silently disappears from save files — no error, no warning. This is the single most fragile spot in the directory. Either spread like the others or add a test asserting toJSON() keys match constructor-assigned keys.

11. Inventory vs InventoryContainer redundancy. Two near-identical components: Inventory{items, maxWeight, maxSlots} vs InventoryContainer{slots, maxWeight, currentWeight}. One tracks current weight, one doesn't; one has slot limits, one doesn't. If both are live (not a migration in progress), consolidate into one with a superset of fields.

Testability
12. Trivially testable, and largely tested (test/ecs/ exists). All constructors are synchronous, dependency-free, deterministic. The only gaps worth tests:

AIState toJSON/constructor key parity (finding 10).
AIBehavior legacy-key migration paths (state, lastSeenPlayerAt).
PlayerSkills static formulas (balance-sensitive; a test pins the progression curve).
Specific questions
Q: Does any component act as more than a data container? No component has instance methods with side effects. The only logic present: PlayerSkills' two static pure progression formulas, and AIBehavior's constructor-time legacy key migration. Neither mutates state outside construction; both are mild ECS-purity violations, not functional problems.

Q: Are Intent components cleared between turns, and is that clearing responsibility documented? Intents are never attached to entities — they exist only as transient envelopes inside IntentQueue, which is constructed fresh per simulation pass (SimulationManager.js:49, also :303 for NPC follow-up). resolve() drains the queue to empty; the safeguard limits (maxTotalIntents, maxDepth) call clear() and abort (IntentQueue.js:55-68). So there is nothing to "clear between turns" — the queue is per-turn by construction. The responsibility is implicitly documented (comments at SimulationManager.js:198, :208, :228 describe "resolving to absolute completion"), but IntentQueue itself carries no doc comment stating "intents are transient and never persisted to entities" — a new contributor could reasonably try entity.addComponent(new MoveIntent(...)) and nothing would stop them. One header comment on the intent components or IntentQueue would fix this.

Q: Is there redundancy between Health, RpgStats, and SurvivalStats? Partial, and mostly justified:

Justified separation: Health = hit points + death flag; SurvivalStats = hunger/thirst/energy/wounds; RpgStats = attributes + XP + zombie viral infection. The two infection systems (viral in RpgStats, wound in SurvivalStats.woundInfection) are explicitly documented as separate (SurvivalStats.js:12-15) — good.
Real overlaps: (a) Health.isDead vs SurvivalStats.condition (a string that presumably can represent incapacitation/death states) — two sources of truth for entity liveness; (b) SurvivalStats.isStarving/isDehydrated are derivable from nutrition <= 0/hydration <= 0 — denormalized flags that can desync from the values they mirror; (c) attribute penalties from sickness/wound infection affect RpgStats.current* while the causes live in SurvivalStats — the coupling crosses both components with no single owner. Consolidating isStarving/isDehydrated into derived getters (or system-computed flags with one writer) is the low-risk consolidation; merging the three components wholesale is not warranted.
Recommended priorities
Fix AIState.toJSON() key drift risk (test or spread) — save-integrity issue.
Align default-value idioms to the !== undefined pattern in AIState, Burnable, RpgStats — latent falsy bug.
Unify sentinel defaults for intent coordinates (null vs 0).
Add a one-line "transient, never persisted" comment to intent components.
Move PlayerSkills statics to a progression config module (cosmetic).


Review 2 — Core Utilities: Math & Randomness
Files: utils/SeededRandom.js (134 lines), utils/TimeUtils.js (9 lines), utils/EdgeStructure.js (47 lines)

Summary
SeededRandom is the strongest of the three — correct mulberry32, genuinely deterministic, well-documented, with a thoughtful save/load state design. TimeUtils is trivially correct for valid input. EdgeStructure is correct but narrower than its name suggests. The biggest gap is exactly what you suspected: there is no determinism test for SeededRandom despite it being the foundation of reproducible gameplay, balance sims, and the fuzzer.

SeededRandom.js
Correctness
1. Determinism: confirmed. mulberry32 with a uint32 state. Same seed → same sequence, always. The implementation matches the reference algorithm exactly (SeededRandom.js:66-70). Multiple instances with different seeds are fully independent — state is per-instance (this._state), no module-level mutable state except the intentional gameRandom singleton.

2. No modulo bias. The integer helpers use float-scaling (Math.floor(this.next() * n)) rather than % n, so there's no classic modulo bias. With 2³² output granularity, the residual bias of float-scaling is ~n/2⁵³ — unmeasurable for any game use. Fisher-Yates in shuffle (:108-116) is textbook-correct (iterates i from end, picks j ∈ [0, i]).

3. Minor: unvalidated argument ranges.

nextInt(min, max) with min > max silently returns values in a "negative width" range (max - min + 1 ≤ 0 → results ≤ min, never max). No error, just wrong data.
nextInt with non-integer arguments behaves like float-scaling then floors — nextInt(1.5, 6.5) returns possibly 7? No: 1.5 + floor(next()*6) → max 6.5 floored contribution... it returns fractional-base integers (e.g. 2.5). Callers presumably always pass ints, but nothing enforces it.
nextBool(chance) with chance > 1 is always-true, < 0 always-false. Harmless but unclamped.
pick([]) returns undefined silently. Probably fine, but a one-line guard or documented behavior would help.
seed(0) is valid and works (mulberry32 handles 0 fine). Good.
4. makeSeededRandom closure (:125-128) only exposes next() — a subsystem using it can't reseed or save/restore state. That's documented as a backward-compat shim for RoadNetwork, so acceptable, but it means RoadNetwork's stream position is unsaveable.

Architecture
5. Purity: good. Instances are self-contained; gameRandom is an explicit, documented singleton (:134). The header comment even explains the save-scumming rationale for getState/setState (:39-54) — that's above-average documentation. One architectural smell: getState() returns the working state, not the original seed, and the comment tells callers to save both — meaning every save system consumer must know this two-value contract. A serialize()/deserialize(seed, state) pair would encapsulate it. Minor.

Performance
6. Excellent. mulberry32 is ~5 arithmetic ops per call, zero allocations in next/nextInt/nextBool/pick. shuffle is in-place. makeSeededRandom allocates one closure per call — negligible. Nothing to optimize.

Code Quality
7. API is minimal and well-named. next, nextInt, nextBool, pick, shuffle all name what they return. JSDoc on every method. Two nits: seed() as both noun (concept) and verb (method that reseeds) is slightly odd but idiomatic; the class having both seed(seed) method and constructor seed param is fine.

TimeUtils.js
8. Correct for the documented domain, broken outside it. getHourFromTurn(turn) = (6 + turn - 1) % 24 — for turn ≥ 1 this is correct (turn 1 → 6 AM as documented). But:

getHourFromTurn(0) returns 5 (5 AM) — meaningless input gives a plausible-looking answer instead of an error.
For turn ≤ -19, JS's % returns a negative result (e.g. turn = -20 → -15), violating the documented 0-23 range. The standard fix is ((x % 24) + 24) % 24. Whether negative turns can ever occur is a caller question, but a 9-line utility should be total. Cost of the defensive modulo is nil.
9. Coupling note: the "turn 1 = 6 AM" constant is baked in with no named constant. If game start time ever becomes configurable, this is a hidden hardcode. Fine for now.

EdgeStructure.js
10. Cardinal directions: correct; diagonals: intentionally not handled, and that's right. The NEIGHBORS table (:12-17) covers exactly the four cardinal neighbors with the correct inverted edge mapping (north neighbor's shared side is its south edge, etc.) — I verified each of the four mappings against the documented semantics in the header comment. Diagonals are correctly excluded: an edge-anchored structure sits on a cardinal boundary by definition, so a diagonal neighbor can never share an edge with the clicked tile. The name findEdgeStructure and the docs are accurate here.

11. Behavior notes:

On-tile match takes priority over neighbor matches (:34-35) — sensible (direct click wins).
On-tile match ignores the structure's edge value, neighbor match requires it (:41). Correct: a structure on your tile faces you regardless of edge.
Neighbor search order is N, S, W, E and returns the first match — if two neighboring tiles both have structures facing the clicked tile (e.g. a corner with two windows), the winner depends on table order, not on proximity or anything player-predictable. Edge case, but it's a hidden priority rule worth a comment.
matchesType (:19-23) hardcodes the door/window/either triad; 'either' is the default and any unknown type string silently behaves as 'either' (:22 fallthrough). A typo like type: 'dorr' would silently return windows too. Minor validation gap.
Out-of-bounds neighbors are handled cleanly via getTile(...)?. optional chaining (:40). Good.
GARAGE_DOOR is folded into door — matches the project's door taxonomy; fine.
Testability
12. SeededRandom determinism is NOT tested — confirmed. There is no test/**/SeededRandom*.test.* (glob came back empty). Every hit in test/ is a consumer reseeding gameRandom for its own reproducibility (batteries.test.js:12, balance.js:160, the fuzzer, etc.). Nobody asserts the class's own contract. Given that save/load resume, balance sims, and fuzz reproducibility all rest on this, the missing tests are:

same seed → identical sequence across two instances (the core determinism guarantee);
getState/setState round-trip resumes mid-stream identically (the save/load contract documented at :39-54);
nextInt bounds over many samples (never < min or > max);
shuffle is a permutation (same multiset) and seed-reproducible;
gameRandom re-seeding resets the stream (test isolation — several test files depend on this implicitly).
Each is ~5 lines. This is the cheapest high-value test gap in the review so far.

13. TimeUtils and EdgeStructure are also untested (no test files reference them). EdgeStructure has consumers tested indirectly (the window redirection tests in test/systems/ presumably exercise it), but the neighbor/edge inversion table deserves one direct unit test per direction — an inversion bug there produces exactly the kind of "clicked the window, hit empty air" bug that's miserable to find in playtesting.

Specific questions answered
Deterministic given same seed? Yes — mulberry32, per-instance uint32 state, verified against the reference algorithm.
Modulo bias? None — float-scaling used everywhere, Fisher-Yates is correct.
EdgeStructure cardinals/diagonals? Four cardinals handled with correct edge inversion; diagonals correctly excluded by design (edge structures can only sit on cardinal boundaries).
Pure / multi-instance safe? Yes — no hidden shared state; gameRandom singleton is explicit and intentional.
Efficient / allocations? ~5 ops per next(), zero per-call allocation.
API minimal, well-named? Yes.
Determinism-tested? No — the class has zero direct tests; only consumers reseeding it.
Recommended priorities
Add a test/utils/SeededRandom.test.js covering determinism, getState/setState resume, nextInt bounds, shuffle permutation (highest value, lowest cost).
Add a 4-direction unit test for findEdgeStructure's neighbor edge mapping.
Make getHourFromTurn total: defensive modulo + either clamp/assert turn >= 1.
Optional: guard nextInt(min > max) and unknown type strings in matchesType — both currently fail silently.

Review 3 · Event Bus

   Files reviewed: client/src/game/utils/EventEmitter.js,
   client/src/game/utils/SafeEventEmitter.js, client/src/game/utils/GameEvents.js

   Summary

   The bus is small and mostly sound: per-listener error containment works, the constant
   catalog is consistently used, and unsubscribe discipline in React contexts is good.
   The main issues are a block of unreachable error-handling code in SafeEventEmitter,
   zero test coverage, a dead event constant with a suspiciously-named listener
   elsewhere, and a few latent API footguns (once()/off() mismatch, no dedupe).

   Correctness

   1. Errors are logged, not silently swallowed — and the chain continues. ✅
   EventEmitter.emit (EventEmitter.js:31-37) wraps each listener in its own try/catch
   inside the forEach, so a throwing listener is logged via console.error and the
   remaining listeners still execute. This is the right behavior for the engine.

   2. SafeEventEmitter.emit's try/catch is effectively dead code. ⚠️
   Because super.emit never throws (it catches per-listener), the outer catch in
   SafeEventEmitter.js:9-21 can only fire on corrupted state (e.g. events[event] not an
   array). Consequences:
   • The NODE_ENV === 'development' re-throw (line 15-17) is unreachable in practice —
     and even if it were reached, process is undefined in the Vite/Electron renderer
     (nodeIntegration: false), and Vitest sets NODE_ENV=test, not development. The "catch
     bugs early in development" comment promises behavior that never happens anywhere.
   • This matters beyond the bus: GameEngine (GameEngine.js:28) and WorldManager also
     extend SafeEventEmitter, so the dead path is inherited engine-wide.
   • Either make the dev re-throw real (move the check into EventEmitter.emit's
     per-listener catch) or delete it — right now it's misleading.

   3. Duplicate registration is possible and silently masked. ⚠️
   on() has no dedupe — the same function reference can be pushed twice and will fire
   twice per emit. Conversely, off() uses filter, which removes all copies, so a single
   cleanup hides a double-registration bug. No warning, no guard.

   4. once() wrappers can't be removed by original reference. ⚠️ (latent)
   once() (EventEmitter.js:41-48) registers a wrapper but doesn't tag it with the
   original listener (Node tags wrapper.listener). off(event, originalListener) will not
   remove a once-registered handler. No current call sites use GameEvents.once(), so it's
   latent — but the API invites the bug.

   5. Removal during dispatch doesn't take effect until the next emit. ℹ️
   off() replaces the array via filter, while emit's forEach iterates the array captured
   at dispatch start. A listener removed by another listener mid-emit still fires once.
   Node's emitter has similar snapshot semantics, so this is defensible — but
   undocumented, and it's exactly the kind of thing that bites during cascades (e.g.
   zombie_died → more deaths).

   Architecture

   6. Genuinely fire-and-forget. ✅
   emit returns a boolean, but I found zero call sites consuming it across 40
   GameEvents.emit calls in 11 files. No synchronous return values propagate back into
   the engine. Note dispatch is still synchronous — a slow listener blocks the engine
   thread; that's convention-enforced only.

   7. GameEvents.js is not a pure catalog, but close. ℹ️
   It contains the GameEventBus class, a console.log with emoji on construction (fires in
   production and in every test run), and HMR global-persistence logic. Minor, but a
   GAME_EVENT.js / gameEventBus.js split would make the catalog truly logic-free.

   8. Dead event + probable miswire. ⚠️
   GAME_EVENT.ZOMBIE_ATTACK_RESULT is emitted exactly once (SleepContext.jsx:289) and has
   no listeners anywhere. Meanwhile AudioContext.jsx:262 registers a handler named
   handleZombieAttackResult against ZOMBIE_ATTACK. Either the AudioContext subscription
   is wired to the wrong event, or the constant is dead. One of the two should go.

   9. Two event systems, only one catalogued. ⚠️
   All GameEvents.* calls use GAME_EVENT constants (no magic strings — verified by grep).
   But GameEngine's own emitter uses raw strings ('update', 'sync', 'inventoryChanged',
   seen in AudioContext/CameraContext/etc.). The catalog's stated purpose ("avoid magic
   string bugs") doesn't cover the engine's own channel.

   10. Naming inconsistency. Minor.
   NPC_ESCAPED: 'npcEscaped' (GameEvents.js:44) is camelCase; every other value is
   snake_case. Harmless while everyone uses the constant, risky the day someone
   hand-types it.

   Performance / Memory

   11. Leak discipline is good where it exists, but it's convention-only. ⚠️
   • React contexts consistently pair on with off in effect cleanups (~73 off call sites)
     — good.
   • WorldManager registers ZOMBIE_DIED in its constructor and removes it in cleanup(),
     which GameEngine does call (GameEngine.js:63, 262) — good.
   • However: no documented unsubscribe pattern, no listenerCount assertions, no
     max-listener warning. A single missed cleanup in a future context double-fires
     silently (and finding #3 means one off() masks it). Growth is unbounded and
     invisible.
   • The HMR window[GLOBAL_KEY] persistence (GameEvents.js:81-85) is correct for dev, but
     any engine module hot-replaced while holding listeners re-registers on the same bus
     — stale-closure accumulation is possible during long dev sessions.

   Testability

   12. Zero test coverage. ❌
   Grep across test/ for EventEmitter|SafeEventEmitter|GameEvents returns nothing.
   Missing tests for the exact behaviors this review cares about:
   • a throwing listener does not block subsequent listeners,
   • errors are logged, not swallowed (and what "logged" means in production),
   • duplicate registration / off()-removes-all semantics,
   • once() auto-removal (including when the listener throws).

   The bus is trivially testable headless in Node — the singleton even works there via
   the typeof window === 'undefined' branch. This is the cheapest test gap in the
   codebase to close.

   Priority recommendations

   1. High — Resolve finding #8: dead ZOMBIE_ATTACK_RESULT vs. AudioContext's
      handleZombieAttackResult on ZOMBIE_ATTACK. One of them is a bug.
   2. High — Add tests for finding #12 (throwing-listener isolation at minimum).
   3. Medium — Fix or delete the unreachable dev re-throw in SafeEventEmitter (#2).
   4. Medium — Dedupe guard in on() or at least a dev-mode warning on duplicate
      registration (#3).
   5. Low — Tag once wrappers for off() compatibility (#4); normalize npcEscaped (#10);
      split catalog from bus instantiation (#7); document snapshot semantics (#5) and the
      unsubscribe convention (#11).
	  
	 Review 4 · Logger

   File reviewed: client/src/game/utils/Logger.js (62 lines)

   Summary

   The Logger itself is a clean, minimal class with a standard API — but it's a façade
   over a codebase that largely ignores it. The engine makes 633 raw console.* calls
   across 61 files, completely bypassing the environment gating the Logger exists to
   provide. Within the Logger itself, the advertised level system is dead code, there's
   no runtime control, and the exported singleton is unused.

   Correctness

   1. Log levels are not really implemented. ⚠️
   LOG_LEVELS (Logger.js:11-16) is defined but never referenced anywhere — dead code.
   There is no level comparison, no setLevel(), no runtime filtering. The actual behavior
   is a binary switch: debug/info gate on isDev, warn/error always fire. The doc comment
   describes a 4-level system the code doesn't have. Either implement the levels or
   delete the constant and fix the comment.

   2. Production gating works, but only for the 13 files that use the logger. ⚠️
   isDev (line 19) reads import.meta.env.DEV, which Vite statically replaces — so in
   production builds debug/info become no-ops. Correct in principle. But see finding #6:
   the vast majority of logging never passes through this gate.

   3. Environment detection has a test-mode quirk. ℹ️
   typeof import.meta !== 'undefined' is dead weight — import.meta always exists in ESM.
   More subtly: Vitest injects import.meta.env with DEV: true, so debug/info fire during
   test runs, while plain node falls through to process.env.NODE_ENV === 'development'
   (false under NODE_ENV=test). Same code, different verbosity depending on the runner,
   and no way to silence it either way.

   Architecture

   4. Singleton story is muddled. ⚠️
   The file exports both the class (default) and a logger instance (line 61). The named
   instance is imported nowhere — dead export. The real pattern is 13 modules each doing
   const log = Logger.scope('Name'), creating per-module instances. That works fine, but
   the file should export one idiom, not three.

   5. Mockable in tests, with caveats. ✅/ℹ️
   Methods live on the prototype, so vi.spyOn(Logger.prototype, 'warn') or vi.mock of the
   module both work — no DI needed. Caveat: isDev is frozen at module-load time, so a
   test can't exercise production gating without vi.resetModules() gymnastics, and no
   test currently does.

   6. Adoption is the real architecture problem. ❌
   633 raw console.* calls across 61 engine files bypass the logger entirely —
   InventoryManager alone has 104 (many with emoji), LootGenerator 37, GameMap 33,
   GameInitializationManager 61. These fire in production, in tests, everywhere. The
   Logger's dev-gating is meaningful only for the 13 adopting modules; the "centralized
   logging utility" claim in the header comment is aspirational. This also means
   production player consoles are full of noise, and there's no single knob to turn it
   off.

   Performance

   7. Log arguments are eagerly evaluated. ⚠️
   The API takes strings, so logger.debug(`...${expr}`) builds the string before the call
   and discards it in production. I found 21 template-literal debug/info calls through
   the logger (WorldManager 9, LineOfSight 6, ZombieReplenishmentSystem 5, GameContext
   1). The LineOfSight ones are inside an explicit debugLineOfSight() diagnostic method,
   so they're fine; the cost elsewhere is small but real. No lazy form (debug(() => ...))
   and no call-site if (isDev) guards exist.

   8. Nothing strips console output in production builds. ❌
   Neither vite.config.ts nor vite.config.electron.ts configures esbuild pure/drop.
   Combined with finding #6, every one of the 633 raw console.* calls — including string
   interpolation and object serialization — executes in the shipped Electron/web builds.
   On hot paths (inventory, map gen) that's measurable work plus a polluted DevTools
   console for end users.

   Code Quality

   9. API surface matches standard loggers. ✅
   debug/info/warn/error with ...args passthrough mirrors console and common loggers;
   Logger.scope(name) for module tagging is a good pattern and consistently applied by
   adopters.

   10. Output lacks level prefixes. Minor.
   _formatMessage prefixes [Module] but not the level, so warn/error lines aren't
   greppable by severity in captured logs. Also no timestamps — acceptable for a game
   console, but worth noting for future log-capture/telemetry.

   11. warn/error can never be silenced. ℹ️
   By design ("All environments" per the header), but with no level system there's no
   escape hatch — e.g. expected-but-noisy warnings (InventoryManager's reject paths)
   print in production forever.

   Priority recommendations

   1. High — Close the adoption gap (#6/#8): either migrate hot/noisy files
      (InventoryManager, GameMap, GameInitializationManager, LootGenerator) to the
      logger, or add esbuild: { pure: [...] } / a strip plugin for production builds.
      Without one of these, the Logger provides almost no real gating.
   2. Medium — Make LOG_LEVELS real or delete it (#1): a setLevel() with runtime
      filtering would also fix #3 (test silencing) and #11.
   3. Medium — Remove the unused named logger export or make it the documented default
      idiom (#4).
   4. Low — Consider lazy messages or documented if (isDev) guarding for expensive
      interpolations (#7); add level prefix to _formatMessage (#10); drop the dead typeof
      import.meta check (#3).

 Review 5 · Tile & Terrain Types

   Files reviewed: client/src/game/map/Tile.js, client/src/game/map/TerrainTypes.js,
   client/src/game/map/BuildingTypes.js, client/src/game/map/MapUtils.js

   Summary

   BuildingTypes.js and MapUtils.js are clean, documented, and do their job. The problems
   concentrate in Tile.js and the terrain-property model around it: "what a terrain
   means" is scattered across at least 5 divergent hardcoded lists, there is no opacity
   concept at all, several terrain types are dead (never placed by any generator or the
   editor), and Tile — which should be a data object — imports the GameEngine singleton
   and turret AI to make gameplay decisions.

   Correctness

   1. The blocking-terrain lists are duplicated and divergent. ❌ (the core finding)

   ┌───────────────────────────┬──────────────────┬─────────────────────────────────────┐
   │ Location                  │ Purpose          │ List                                │
   ├───────────────────────────┼──────────────────┼─────────────────────────────────────┤
   │ Tile.js:86                │ movement         │ wall, fence, tree, water,           │
   │                           │                  │ tent_wall, deep_water, brick,       │
   │                           │                  │ metal_wall, building                │
   ├───────────────────────────┼──────────────────┼─────────────────────────────────────┤
   │ LineOfSight.js:405        │ sight            │ wall, building, tree, tent_wall,    │
   │                           │                  │ fence                               │
   ├───────────────────────────┼──────────────────┼─────────────────────────────────────┤
   │ VisionSystem.js:175       │ sight            │ verbatim copy of LineOfSight        │
   ├───────────────────────────┼──────────────────┼─────────────────────────────────────┤
   │ GameMapContext.jsx:81,147 │ UI click         │ wall, building, fence, tree, water, │
   │                           │ validity         │ tent_wall                           │
   ├───────────────────────────┼──────────────────┼─────────────────────────────────────┤
   │ PlayerContext.jsx:220     │ UI validity      │ wall, building, fence, tree         │
   ├───────────────────────────┼──────────────────┼─────────────────────────────────────┤
   │ ExplosionSystem.js:260    │ destructibility  │ wall, building (its own check)      │
   └───────────────────────────┴──────────────────┴─────────────────────────────────────┘

   Consequences of the drift:
   • deep_water/brick/metal_wall are unwalkable per the engine but absent from both UI
     lists — the UI would validate moves the engine then rejects.
   • brick/metal_wall block movement but are not in either sight-blocking list —
     transparent walls, if they're ever placed.
   • VisionSystem.js:175 being a verbatim copy of LineOfSight.js:405 means any future
     terrain must be added in two places in the same subsystem or vision and FOV
     disagree.

   2. Dead terrain types. ⚠️
   brick, metal_wall, deep_water, tree, foliage, sand are never placed by any generator,
   absent from the editor palette (editor.tsx:16-28), and absent from all
   customMaps/*.json (grep confirmed). Yet tree blocks movement and sight in four lists,
   and foliage gates rabbit spawning (AnimalSpawner.js:41). Conversely dirt — which is in
   the editor and renderer — appears in no engine predicate list, so it's
   walkable/sight-transparent only by accident of omission. The tile.terrain === 'window'
    checks (GameMap.js:199,209) reference a terrain that is never set — dead branch.

   3. No opacity property exists. ❌
   Grep for opaque|blocksVision|blocksLight across client/src/game returns nothing.
   Sight-blocking derives entirely from the string lists above plus per-entity
   blocksSight. So the requested "passable / impassable / destructible / opaque"
   enumeration simply does not exist — terrain is a free-form string with ~15 observed
   values and no exhaustive property table.

   4. waterAmount save/load bug. ⚠️
   Tile.fromJSON (Tile.js:292): data.waterAmount || (data.terrain === 'water' ? 100 : 0)
   — a legitimately drained water tile (0) is falsy, so it reloads as 100. Also
   deep_water gets waterAmount: 0 in the constructor while plain water gets 100 —
   inconsistent for two water terrains.

   5. fromJSON aliases edgeWalls. Minor.
   tile.edgeWalls = data.edgeWalls (Tile.js:293) shares the reference with the caller's
   object instead of cloning. Usually harmless (input is fresh JSON), but it's an
   aliasing trap.

   Architecture

   6. Tile is not a plain data object — and it's wired into a circular dependency. ❌
   • Tile.js:6 imports the GameEngine singleton so isWalkable can check engine.riding for
     the golf-cart rule (line 68). That makes Tile → GameEngine → GameMap → Tile a
     circular import, and means the same tile answers "walkable?" differently depending
     on hidden global state — exactly the engine-purity rule AGENTS.md calls sacred.
   • Tile.js:5 imports isTurretPassableBy/TURRET_DEF_ID from ai/TurretCombat.js — an AI
     module baked into a map data object.
   • Both rules belong in MovementSystem/pathfinding options, not on the tile.

   7. Dead UI-flavored API on Tile. ⚠️
   handleClick (with an always-on console.log — a Review-4 leak), handleHover,
   getAvailableActions, the unwalkable getter, and the no-op addEventListener have zero
   call sites outside Tile.js. That's ~80 lines of dead surface, including an
   event-emitter-shaped API that does nothing.

   8. TerrainTypes.js is the right pattern — applied to only 2 of ~6 predicates. ℹ️
   isFloor/isIndoorFloor are centralized, documented, and used correctly (NPCSpawner,
   GameMap, renderer). The file's own header says "route every floor-parity check through
   these helpers" — but walkability, opacity, and destructibility have no equivalent
   home, which is precisely why finding #1 happened.

   9. BuildingTypes.js / MapUtils.js are fine. ✅
   O(1) object lookup, documented footprints, pure geometry helpers. Only nit:
   isInStartArea (MapUtils.js:75-83) hardcodes magic bounds x 80–140, y ≥ 154 tied to one
   template — should live with the map config.

   Performance

   10. Per-call array allocation + O(n) string includes on hot paths. ⚠️
   Tile.isWalkable allocates unwalkableTerrains (9 strings) on every call; it's invoked
   from pathfinding (Pathfinding.js:418), every AI cycle (up to 50/turn), audio
   propagation, and UI hover. Same pattern in LineOfSight.isTerrainBlocking (allocated
   per tile along every ray) and VisionSystem.js:175. These should be module-level frozen
   Sets at minimum; an integer terrain enum with a property table would eliminate string
   comparison entirely. Tile storage lookups (getTile) are fine — the cost is purely in
   these predicate lists.

   Code Quality

   11. Stale terrain documentation. ⚠️
   Tile.js:13 documents 7 terrains; the actual census across generators, renderer
   palettes, and editor is ~15 (grass, road, sidewalk, floor, garagefloor, dirt, water,
   deep_water, fence, tree, wall, building, tent_wall, tent_floor, transition, …). The
   renderer maintains five parallel color maps plus a sprite atlas keyed by the same
   strings (TileRenderer.js:13-87) — more places a new terrain must be manually added,
   with no exhaustiveness check anywhere.

   Testability

   12. No property tests for any terrain type. ❌
   Tests use terrain strings only as map setup (terrain: 'grass' etc.). Nothing tests
   isWalkable or isTerrainBlocking across the terrain census — so the five divergent
   lists in finding #1 have never been reconciled by a test. A single property-matrix
   test (for each known terrain × {walkable, sight-blocking, destructible}) would make
   the drift visible immediately. Testing isWalkable is also obstructed by finding #6:
   the golf-cart branch requires the global engine singleton to be in a specific state.

   Specific questions

   Is there a canonical source for "what terrain is walkable"?
   Engine-side: mostly — Pathfinding.js:418 delegates to Tile.isWalkable, and
   AISystem/MovementSystem/GameMap.moveEntity all route through it. But the UI layer does
   not: GameMapContext and PlayerContext each keep their own divergent lists for
   click/hover validity. So end-to-end, no — there's a canonical runtime check plus two
   UI copies that can disagree with it.

   Can a Tile be in an inconsistent state (e.g., opaque but open-door)?
   Not literally — there is no opacity flag to contradict. But the same class of
   inconsistency exists across the movement/sight split: terrain wall with an open door
   in contents is walkable via the hasEntry path (Tile.js:74-95) while
   isTerrainBlocking('wall') still reports sight-blocked. The edge-wall system mitigates
   this for real doors (flags cleared at load, per LineOfSight.js:427), but the invariant
   "open passage ⇒ sight passes" is maintained by convention across two subsystems, not
   enforced by shared data.

   Priority recommendations

   1. High — Create a single terrain property table (e.g. TERRAIN_PROPS = { wall: {
      walkable: false, blocksSight: true, destructible: true }, … }) and make
      Tile.isWalkable, LineOfSight, VisionSystem, both UI contexts, and ExplosionSystem
      read from it. This fixes #1, #3, and the specific-question inconsistencies in one
      move.
   2. High — Reconcile the terrain census: either place
      tree/brick/metal_wall/deep_water/foliage or delete them from the lists; add dirt
      deliberately (#2); remove the dead terrain === 'window' branch.
   3. Medium — Move the golf-cart and turret rules out of Tile into movement options;
      drop the engine import and break the cycle (#6).
   4. Medium — Fix the waterAmount || … reload bug (#4).
   5. Low — Replace per-call arrays with module-level Sets or an enum (#10); delete dead
      Tile methods (#7); fix the stale comment (#11); clone edgeWalls in fromJSON (#5).
   6. Low — Add the terrain property-matrix test (#12) once the table from recommendation
      1 exists — it becomes a one-line exhaustiveness assertion.

  Review 6 · Line of Sight

   File reviewed: client/src/game/utils/LineOfSight.js (616 lines), with comparison
   against client/src/game/systems/VisionSystem.js

   Summary

   The headline finding answers the first specific question directly: there are two LOS
   implementations, and they disagree with each other. LineOfSight.js (used by entity AI,
   player FOV, projectiles) and VisionSystem.js (used by ECS Vision components) are
   parallel Bresenham implementations with three different door-blocking semantics and
   different blocksSight handling — so the same sight line can resolve differently
   depending on which subsystem asks. Within LineOfSight.js itself the algorithm is solid
   in the common cases, but there is zero caching, heavy per-call allocation on hot
   paths, and no unit tests.

   Correctness

   1. Two implementations, divergent door semantics. ❌

   ┌───────────────────────────────────────────┬────────────────────────────────┐
   │ Code site                                 │ Closed door blocks sight when… │
   ├───────────────────────────────────────────┼────────────────────────────────┤
   │ LineOfSight.getBlockingEntity (line 470)  │ !isOpen (damage ignored)       │
   ├───────────────────────────────────────────┼────────────────────────────────┤
   │ LineOfSight.isEdgeSightBlocked (line 440) │ !isOpen && !isBroken           │
   ├───────────────────────────────────────────┼────────────────────────────────┤
   │ VisionSystem.isTileBlocking (line 187)    │ !isOpen && !isDamaged          │
   ├───────────────────────────────────────────┼────────────────────────────────┤
   │ VisionSystem.isEdgeBlocked (line 235)     │ !isOpen && !isDamaged          │
   └───────────────────────────────────────────┴────────────────────────────────┘

   isBroken and isDamaged are different properties. A damaged-but-intact door:
   VisionSystem sees through it, LineOfSight doesn't. A broken door on an edge:
   LineOfSight's tile-contents check still treats it as blocking if !isOpen, while its
   own edge check doesn't.

   2. blocksSight override honored differently. ⚠️
   LineOfSight.getBlockingEntity (line 465) treats blocksSight: false as an explicit
   opt-out that short-circuits before the type check. VisionSystem.isTileBlocking (line
   195) only honors blocksSight === true — an entity typed building with blocksSight:
   false still blocks in VisionSystem. VisionSystem also has no
   ignoreTerrain/ignoreEntities options at all.

   3. Boundary handling is otherwise correct. ✅
   Same-tile returns true with distance 0 before any other check (line 39). The origin
   tile is never blocking-checked (correct — standing in a doorway shouldn't blind you).
   The target tile is exempted via the break at line 139 before the blocking checks
   (intended: walls themselves are visible). Out-of-bounds intermediate tiles and null
   corners block conservatively. One crack: if the maxIterations safety limit is ever
   hit, hasLineOfSight falls out of the loop and silently returns hasLineOfSight: true
   (line 173) — getLinePath at least logs a warning (line 387), this one doesn't.
   Unreachable with integer inputs, but it's a "visible" default on failure, which is the
   dangerous direction.

   4. Octant symmetry is not guaranteed. ⚠️
   Bresenham A→B does not trace the same cells as B→A, and the corner rule ("both
   cardinal detours must block", line 103) is path-dependent. Nothing enforces symmetry,
   so A-can-see-B ≠ B-can-see-A is possible along diagonal wall seams — a zombie can spot
   a player who can't spot it back. Both implementations share this; it's a known
   Bresenham LOS property, but it's undocumented and untested here.

   5. Dead option and coordinate inconsistency. Minor.
   debug is destructured from options (line 30) and never used. calculateFieldOfView
   reads entity.x/y (line 528) while canSeeEntity prefers logicalX/logicalY (line 332) —
   during movement animation these diverge, so FOV and targeting can be computed from
   different positions.

   Architecture

   6. Genuinely pure. ✅
   All static methods; gameMap is an explicit parameter; no global state touched (only
   the Logger). Throws on an invalid map rather than failing silently. This is the model
   the rest of the engine should follow — which makes finding #1 worse: the duplication
   lives in VisionSystem, not here.

   7. Usage split (answers specific question 1).
   • Impl 1 (LineOfSight): zombie AI (AISystem.js:654 → Entity.canSeeEntity →
     Entity.js:866), NPCAISystem, RabbitAI, PlayerZombieTracker, player FOV/lighting
     (GameEngine.js:513-592), projectiles (ProjectileManager.js:21).
   • Impl 2 (VisionSystem): ECS Vision components — which EntityFactory attaches to every
      entity (EntityFactory.js:42,141,175) — refreshed by SimulationManager every AI
     cycle (SimulationManager.js:188,249,274,314).
   • So AISystem consumes impl 1 while VisionSystem maintains impl 2, and per findings
     #1/#2 they can disagree. AISystem makes decisions from entity.canSeeEntity (impl 1),
     not from the Vision component data it just paid to recompute (impl 2) — the impl-2
     results appear to be largely unused by the legacy AI path, meaning much of the
     impl-2 work may be computed for nothing.

   Performance

   8. Caching: partial in impl 2, none in impl 1. ⚠️
   VisionSystem has dirty flags (vision._visionDirty, gameMap._visionDirty) plus a forced
   global dirty at turn start (SimulationManager.js:177). LineOfSight has no memoization
   at all — every canSeeEntity re-walks the Bresenham line, and zombie→player LOS is
   re-checked every AI cycle even when neither party moved.

   9. Allocations in the hot path. ⚠️
   • Every hasLineOfSight allocates a path array of {x,y} objects even when the caller
     only reads the boolean (Entity.canSeePosition, Entity.js:866-878, discards it).
   • getBlockingEntity allocates the blockingSightTypes array inside the find callback
     (line 480) — once per entity per tile checked.
   • isTerrainBlocking allocates its 5-string array per call (line 405) — per tile per
     step.
   • isEdgeSightBlocked allocates two filter results plus a spread per edge check, twice
     per diagonal step.
   • getVisibleTiles is nominally O(R²) shadowcasting, but isEnteringWallBlocked (line
     246) runs a full inner hasLineOfSight per candidate tile — making FOV O(R³) with a
     large constant, re-visiting tiles across all 4 quadrants, and using string Map keys
     (${x},${y}).
   • VisionSystem.calculateVisibility is also O(R³): brute-force bounding-box scan (~707
     tiles at R=15) × a full Bresenham walk each, with Math.sqrt per tile.

   10. Worst-case per SimulationManager.runTurn() (specific question 2).
   Every entity carries a Vision component (R=15–18). The zombie loop runs up to
   maxAICycles = 50 cycles (SimulationManager.js:181); each cycle runs
   VisionSystem.process (recomputing every dirty entity — and any entity that moves
   re-dirties itself, Entity.js:702) plus AISystem.process (≥1 impl-1 LOS walk per active
   zombie). Then the NPC loop does up to 50 more cycles, and NPCAISystem.js:226,410 adds
   an NPC×zombie canSeeEntity cross-product per NPC decision. Arithmetic at E=100 active
   zombies, R=15:

   • One calculateVisibility ≈ 707 candidate tiles × ~10–15 LOS steps ≈ ~10k tile checks
     → per-LOS-call terms, that's 707 hasLineOfSight invocations per entity refresh.
   • Zombie loop alone, worst case (all zombies moving every cycle): 50 cycles × 100
     zombies × ~708 invocations ≈ 3.5M LOS invocations per runTurn(); the NPC loop
     roughly doubles it, before the NPC×zombie cross-product.

   Typical turns are far cheaper (early break at zero intents, dirty flags), but a full
   horde turn is exactly the worst case, and it lands in the middle of ANIMATING
   playback. This is the single largest computational cost identified in these reviews so
   far.

   Code Quality

   11. Algorithms are named but not sourced. ℹ️
   getVisibleTiles is identified as "Recursive Shadowcasting" (line 182) and the line
   walk as Bresenham (lines 61, 341) — good. But there's no reference link (e.g. the
   classic roguebasin/Björn Bergström shadowcasting article), and the corner-blocking
   variant is custom ("PHASE 30 FIX") with no explanation of the intended diagonal-wall
   semantics beyond one comment. The next maintainer modifying the corner rule has no
   spec to check against.

   Testability

   12. No unit tests for LOS. ❌
   The only test references are integration-level (npcAttackOnSight.test.js,
   spitterRanged.test.js) that exercise LOS indirectly through the harness. Nothing tests
   known sight lines, known occlusions, diagonal corner cases, wall-at-origin,
   target-at-map-edge, octant symmetry (A→B vs B→A), or the door-state matrix from
   finding #1. The class is pure and static — it's the most testable module reviewed so
   far, and a snapshot-style test over a small ASCII map would pin down all of findings
   #1–#4. The VisionSystem duplicate has no tests either.

   Priority recommendations

   1. High — Collapse to one implementation. Make VisionSystem.hasLineOfSight delegate to
      LineOfSight (adding the isDamaged/isBroken semantics in one agreed place), or vice
      versa. Then fix the door-state matrix once (#1, #2).
   2. High — Stop computing impl-2 Vision data that the AI doesn't consume, or make
      AISystem read from it — currently the engine pays for both and trusts one (#7).
   3. High — Add LOS unit tests on a fixed ASCII map: symmetry, diagonal corners, door
      states, boundary tiles (#12). This is cheap and pins the semantics before any
      refactor of #1.
   4. Medium — Cache zombie→player LOS per cycle keyed on (mover-set) dirtiness, or
      short-circuit on distance/unchanged positions (#8); return early without building
      path when only a boolean is needed (#9).
   5. Medium — Hoist the per-call array literals (blockingTerrain, blockingSightTypes) to
      module-level frozen constants (#9).
   6. Low — Make the safety-limit fallthrough return false or throw with a log (#3);
      remove the dead debug option and align calculateFieldOfView on logicalX/Y (#5); add
      algorithm reference links (#11).

Review 7 · Pathfinding

   File reviewed: client/src/game/utils/Pathfinding.js (558 lines), plus callers in
   AISystem, NPCAISystem, MovementHelper, EventRunner

   Summary

   This is a genuinely engineered module: a real binary min-heap (the header documents it
   as the "Phase 32 performance fix"), an admissible and consistent heuristic,
   termination guarantees, and thoughtful diagonal-corner rules that agree with the LOS
   corner rule from Review 6. The serious findings are: a broken decrease-key that voids
   the optimality guarantee, hunting zombies re-run A* from scratch every AI cycle (up to
   50× per turn per zombie), a hidden LOS call inside the cost function for NPCs that
   compounds the Review 6 hot path, and an O(n²) pseudo-Dijkstra in getReachableTiles.

   Correctness

   1. Decrease-key doesn't restore the heap property. ❌ (real bug)
   When a better g is found for a node already in the open set (lines 203-207), the code
   mutates existingNode.f in place but never bubbles it up. The heap order is now
   violated, so pop() can return a higher-f node first; combined with the closed set
   preventing re-expansion, A* can settle on a suboptimal path. With a consistent
   heuristic this is rare (the better-g case mostly fires before first pop), and the
   variable terrain penalties actually make it more likely. Standard fix: sift the node
   up after mutation, or push a duplicate node and skip stale pops.

   2. Heuristic is admissible and consistent — optimality holds if #1 is fixed. ✅
   allowDiagonal uses Chebyshev max(dx,dy) (line 286) against a diagonal cost of 1.4 and
   cardinal 1. True optimal cost for (dx≥dy) is dx + 0.4·dy ≥ max(dx,dy), and per-step
   heuristic drop ≤ 1 ≤ min edge cost 1 — so the heuristic never overestimates and is
   consistent, meaning the closed set is safe. Manhattan for cardinal-only mode is exact.
   Appropriate choices for the grid.

   3. Blocked/missing destinations: consistent return convention, but two different
   retargeting policies. ⚠️
   Failure always returns [] (never null, never partial) and every caller checks
   path.length > 1 — consistent. But out-of-bounds targets get a clamp + radius-5 spiral
   search for a nearby walkable tile (lines 82-113), while an in-bounds unwalkable target
   gets no retargeting at all — the isTarget exception (line 179) lets A* path onto the
   wall tile (intended for breaching, but it means "no path" and "path onto an unwalkable
   tile" are indistinguishable to callers except by inspecting the last step). Also,
   maxDistance prunes by Manhattan distance from start (line 185), so "no path exists"
   and "path exists but requires a detour beyond the radius" both return [] — callers
   can't tell a true dead-end from a search-radius bailout.

   4. No infinite loops; degenerate cases handled. ✅
   Closed set + finite grid + maxDistance cap guarantee termination; surrounded entity
   exhausts the open set → []; start === end returns [{x,y}] before the search (line
   120). The unwalkable-start early return (line 119) is softened by isTileWalkable's
   own-position exemption (lines 407-411) — a deliberate anti-stuck measure, correctly
   placed.

   5. Diagonal moves are consistent with LOS. ✅
   canMoveDiagonally requires both corner tiles walkable plus all four edge boundaries
   clear (lines 425-442) — strict no-corner-cutting, matching the LOS "both corners must
   block" rule. Movement and sight agree; this is exactly the cross-system consistency
   Review 6 found missing for doors.

   6. isTileWalkable mutates its caller's options. ⚠️
   Lines 414-416: options.allowBreaching = true — written into the shared pathOptions
   object mid-search for zombies/NPCs. It happens to be idempotent here, and
   canMoveDiagonally explicitly overrides it back to false, but a predicate that mutates
   its input is a landmine (and it makes movementCostOptions built at line 147
   order-dependent on line 119 having already run).

   7. getReachableTiles is an incorrect Dijkstra. ⚠️
   queue.shift() (line 256) is O(n) per pop → O(n²) overall, and there's no priority
   ordering or decrease-key: with variable costs (diagonal 1.4, door/window penalties)
   the first time a node is popped is not guaranteed to be its cheapest cost, so the
   reachable set within maxCost can be subtly wrong — tiles reported unreachable that
   aren't, and vice versa. Fine on uniform-cost flat ground, wrong exactly where the cost
   function gets interesting.

   Architecture

   8. Stateless per call; the grid is rebuilt from scratch every time (answers specific
   question 2). ✅/⚠️
   No module-level cache, no persisted search grid, no incremental A* — every findPath
   reads live tiles and builds fresh node maps. That's clean and mutation-free (aside
   from #6), but it means the entire cost is paid per call, and the only caching in the
   system is at one call site: the investigate branch stores aiBehavior.currentPath and
   revalidates just the next step before recomputing (AISystem.js:530-556). The hunting
   branch (AISystem.js:390) has no cache at all — see #10.

   9. The NPC threat penalty smuggles a full LOS walk into the cost function. ❌
   getMovementCost lines 367-388: for NPCs with recentThreats, every neighbor expansion
   of every node calls npc.canSeePosition(...) per threat — a complete Bresenham LOS walk
   (the Review 6 hot path, with all its allocations) inside the innermost loop of A*. An
   NPC fleeing with 3 threats and 2,000 expanded nodes runs ~6,000 LOS walks per findPath
   call. It also makes path cost depend on vision state, so the "pure cost function"
   isn't. This should be precomputed once per findPath (a threat-distance field) or
   sampled coarsely.

   Performance

   10. Hunting zombies re-run A* every AI cycle (answers the caching question). ❌
   AISystem.js:390 calls findPath unconditionally for every hunting zombie, every cycle —
   and SimulationManager runs up to 50 cycles per turn (zombie loop) plus 50 for NPCs.
   With the hunt radius max(8, 2·Manhattan+2), each call expands O(radius²) nodes with
   per-node neighbor allocation, string keys, and the edge/structure checks. N hunting
   zombies → up to 50·N full A* searches per turn, on top of the Review 6 vision costs.
   The fix is the same pattern the investigate branch already uses: cache the path,
   revalidate the next step, recompute only on invalidation or target drift.

   11. Data structures are right; micro-allocations aren't. ℹ️
   Open set: proper binary min-heap with h tie-break ✅. Closed set: Set with O(1) lookup
   ✅. But keys are template strings built per node per visit, neighbors allocate 8 {x,y}
    objects per expansion, and isEdgeBlocked allocates two filtered arrays + a spread per
   structure-bearing edge (its fast path at lines 463-467 using .some is good — the
   comment shows the author knew). Acceptable once #10 stops calling it 50×/turn.

   Code Quality

   12. Magic numbers partially named. ⚠️
   1.4 is documented as √2 (line 294) ✅. Unnamed: zombie-clustering 0.2, door/window
   breach penalties +1/+2 (and the locked variants), threat multiplier 5.0, spiral
   maxRadius 5, default maxDistance 1000, and the path-length rebate in
   calculateMovementCost (floor(n/5)·0.5, line 230) — which also means the reported path
   cost (used for AP) is discounted relative to the cost A* actually optimized, a small
   but real economy/search divergence that nobody can tune from one place.

   13. Overloaded entityFilter parameter. ⚠️
   entityFilter is documented as a filter but used as an entity throughout
   (entityFilter.type === 'npc' line 176), while isTileWalkable accepts
   entity-or-function-or-null. Three semantics in one parameter makes every call site
   guess.

   Testability

   14. No dedicated pathfinding tests. ❌
   Only indirect usage (window_combat_redirection.test.js, balance harness). Missing:
   optimal-path-on-known-map, no-path-exists vs radius-bailout (they're conflated — #3),
   start == end, fully surrounded entity, diagonal corner-cutting rejection, the
   decrease-key scenario from #1 (constructible: force a better g to an already-open
   node), and getReachableTiles under variable costs (#7). Like LineOfSight, the class is
   static and takes gameMap as a parameter — trivially testable with the harness's
   minimal map.

   Specific questions

   Maximum path length in a single turn, and is there a cap?
   There's no cap on returned path length — only a search radius. maxDistance defaults to
   1000 (Manhattan from start), the hunting branch sizes it to max(8, 2·Manhattan+2), and
   the investigate branch (AISystem.js:555) passes nothing — so it searches effectively
   the whole map. Only the first step is consumed per cycle, but the full search is paid
   each time. Combined with 50 AI cycles, one zombie can request 50 uncapped searches per
   turn.

   Is the grid rebuilt from scratch each call?
   Yes — completely. No cached grid, no incremental repair (no D* Lite / LPA*), no
   sharing between calls. The sole reuse is the investigate branch's currentPath with
   next-step revalidation; the hunting path — the hottest one — recomputes from zero
   every cycle.

   Priority recommendations

   1. High — Cache the hunting path like the investigate path does: revalidate next step
      + target drift, recompute on failure (#10). This is the single biggest win; it
      divides the worst-case A* count per turn by up to 50.
   2. High — Fix decrease-key: sift up after in-place f reduction, or push-and-skip-stale
      (#1). Without it the heap is decorative.
   3. High — Remove canSeePosition from getMovementCost (#9): precompute a threat-cost
      field once per findPath.
   4. Medium — Give getReachableTiles a real priority queue and settled-on-pop semantics
      (#7).
   5. Medium — Add the test matrix (#14), especially #1 and #3 scenarios.
   6. Low — Stop mutating options in isTileWalkable (#6); split entityFilter/entity
      (#13); name the penalty constants in one place (#12); distinguish "no path" from
      "radius exceeded" in the return value (#3).
	  
  Review 8 · GameMap

   File reviewed: client/src/game/map/GameMap.js (1,647 lines)

   Summary

   GameMap is three classes wearing one name: a tile/entity data store (good —
   bounds-checked accessor, O(1) ID index, O(matches) type index), a turn-processing
   simulation system (snares, spoilage, power, turret drain, zombie replenishment), and a
   serialization/migration layer. The data-store core is solid, but the file violates the
   project's own "systems hold the logic" rule at scale, and there are two real data-loss
   inconsistencies between fromJSON and fromJSONSelective, plus a duplicate-ID path that
   logs an error and then corrupts state anyway.

   Correctness

   1. Bounds checking is centralized and correct. ✅
   All tile access flows through getTile (line 303), which floors fractional coordinates
   (with a comment explaining exactly why — animation positions) and bounds-checks,
   returning null for OOB including (-1,-1) and NaN. Mutations (setTerrain,
   setItemsOnTile, addEntity, moveEntity) all go through it. Direct this.tiles[y][x]
   writes happen only inside the class itself (initializeMap, restore). No unguarded
   write path found.

   2. fromJSONSelective loses data that fromJSON keeps. ❌
   Comparing the two restore paths:
   • fromJSON restores buildings and specialBuildings (lines 1531-1541);
     fromJSONSelective (lines 1508-1526) never restores buildings — and it's the path
     WorldManager.js:223 uses for map transitions. Building-dependent logic (loot,
     sheltered checks, floorplan metadata) silently runs on an empty array after a
     transition.
   • fromJSON recomputes crop metadata for every tile (lines 1547-1551);
     fromJSONSelective doesn't, so cropInfo is stale/missing after selective restore.

   3. Duplicate entity ID: logs, then proceeds. ❌
   addEntity (lines 563-576) detects a duplicate ID, prints a five-line alarm ("🚨
   DUPLICATE ENTITY ID DETECTED") — and then executes entityMap.set anyway, overwriting
   the existing entry. The old entity is never removed from its tile or the type index,
   producing exactly the "ghost entity" state the surrounding code works so hard to
   prevent (the Phase 28 removal fix, the desync check in Tile.addEntity). If duplicates
   are fatal, throw; if recoverable, evict the old one. Logging and continuing is the
   worst option.

   4. Restore path skips entity.gameMap assignment. ⚠️
   _restoreTilesAndEntities (lines 1453-1457) inserts via tile.addEntity + entityMap.set
   directly, bypassing GameMap.addEntity — so restored entities never get entity.gameMap
   = gameMap. Door.js:36/Window.js:31 fall back to the engine singleton when this.gameMap
    is null, which works only because the restored map usually is the engine's current
   map. With WorldManager holding multiple maps, a door on an inactive map resolves to
   the wrong map. Latent, but the fix is one line in the restore path.

   5. Dead/buggy wall check in isSameBuildingShell. ⚠️
   Line 266: const isWall = tile && tile.blocksMovement && !entity — Tile has no
   blocksMovement property (entities do; Review 5). The condition is always falsy, so
   this check never fires. The BFS is still bounded by the isIndoors test, so behavior is
   probably right by accident, but the line is either dead code or a bug wearing a
   plausible face.

   6. Fog-of-war split is coherent but two-owned. ℹ️
   "Seen" is tile.flags.explored (set at GameEngine.js:610, persisted via Tile.toJSON
   ✅). "Visible" is engine.playerFieldOfView, a transient engine-side array. The
   seen/visible distinction exists and survives save/load; the cost is that FOW state has
   two owners (map flags vs. engine field), and getExplorationPercentage (line 654)
   full-scans the map on every call.

   7. Sheltered cache invalidation gap. Minor.
   _shelteredCache is cleared per processTurn and on setTerrain, but not when a door
   opens/closes or a wall is breached — and door state changes enclosure (the BFS at
   lines 190-201 treats closed doors as blocking). Worst case is one turn of stale
   shelter data, since processTurn clears it; acceptable, but worth a comment.

   Architecture

   8. GameMap is not a data store — it orchestrates behavior. ❌ (architectural)
   Per the project's own layering rules, these don't belong here:
   • Simulation: processTurn (line 838) runs snare catching with RNG and
     distance-to-player rules, item spoilage/transform recursion (_processItemDataTurn,
     ~160 lines), power generation, hotplate/turret drain, crop growth, and calls
     ZombieReplenishmentSystem — a system — from the map.
   • AI: emitNoise (line 102) directly pokes zombie.setNoiseHeard / npc.setNoiseHeard —
     AI stimulation from the map layer (and four console.logs per call in production).
   • Rendering: _getGroundProxyInfo (line 385) decides icon subtypes and renderFullTile —
     presentation policy.
   • The saving grace: power/decay logic is delegated to TurnProcessingUtils, shared with
     InventoryManager — that extraction pattern is right; it just didn't go far enough.

   9. Door/window state lives in entities, consistently. ✅
   Open/closed/broken/damaged is on the Door/Window/GarageDoor entities in tile.contents;
   tiles only carry edgeWalls flags (with the documented load-time handoff where doors
   clear their edge flag). Tile vs. entity responsibility is consistent with what Reviews
   5–7 observed — the inconsistency is in how many places interpret that state (LOS ×2,
   pathfinding, movement, sheltered BFS — five readers, slightly different predicates),
   not in where it lives.

   Performance

   10. Lookups: good where indexed. ✅
   entityMap gives O(1) by ID; entitiesByType (line 40, documented as a deliberate
   secondary index) makes getEntitiesByType O(matches); activeScents/activeFires are
   sparse Sets so scent/fire processing scales with active tiles, not map area; tile
   access is O(1) row-major. This file shows the most performance maturity of any
   reviewed so far.

   11. Remaining full-map passes and O(n) shifts. ⚠️
   • No dirty-rect tracking: getExplorationPercentage and verifyTileStates full-scan
     every call; auditEntityComponents full-scans tiles + entityMap on every save (line
     1306).
   • isSameBuildingShell uses queue.shift() (line 246) — same O(n²) BFS pattern flagged
     in Pathfinding.getReachableTiles (Review 7); bounded at dist 30 here, so minor.
   • isSheltered BFS caps at 2,000 tiles per query with a per-tile cache — reasonable.
   • FOV storage: flags.explored lives on tiles (dense, fine); playerFieldOfView is a
     per-frame array of {x,y,distance} objects — allocation-heavy but engine-side.

   Code Quality

   12. Coordinates are consistent. ✅
   Row-major tiles[y][x], (x, y) parameter order everywhere, width/height only — no
   col/row duality found. The class docstring still says "20x20 map container" (line 26)
   though maps are far larger — stale comment.

   13. Production console noise. ⚠️ (Review 4 theme continues)
   console.log on every addEntity (line 596), every noise emit (×4), item expiry, snare
   catches, restore progress — dozens of log lines per turn in production builds, mixed
   with log.debug/log.warn from the scoped logger in the same file. Pick one.

   14. Serialization defensiveness is a code smell done well. ℹ️
   auditEntityComponents self-heals malformed entities before save, _transformItemInPlace
    has a long comment explaining the bug it replaced, Tile.toJSON's _ref mechanism
   prevents double-serialization. These are good fixes — and also evidence of how many
   entity-integrity bugs this file has absorbed. The root cause (multiple entity
   representations: ECS entity, legacy Item, POJO) is still alive in
   convertLegacyItemToECS.

   Testability

   15. No direct GameMap unit tests. ❌
   All 12 test-file references use GameMap through GameHarness or scenario builders.
   Nothing tests: out-of-bounds getTile/setTerrain (the flooring behavior at line 309 is
   untested — pass 2.5 and you silently get tile 2), entity add/remove/move invariants
   (tile-contents ↔ entityMap ↔ type-index agreement), the duplicate-ID path (#3),
   fog-of-war persistence, or the fromJSON/fromJSONSelective divergence (#2 — a
   round-trip test through both paths would catch it immediately).

   Specific questions

   Who keeps entities-at-tile synchronized with entity positions? Is there a single write
   point?
   Yes, effectively: GameMap.moveEntity (line 674) is the one write point for movement —
   every mover goes through it (MovementSystem.js:24, PlayerContext.jsx:347, RabbitAI,
   EventRunner.js:529, TollGateSystem.js:88, MapInterface.tsx:1119), and tile membership
   is only mutated by Tile.addEntity/removeEntity under GameMap's control. It even
   verifies the move landed (lines 759-764) and Tile.addEntity independently alarms on
   coordinate desync. The two gaps: the restore path bypasses addEntity (#4), and the
   duplicate-ID path overwrites without cleanup (#3).

   Can GameMap hold stale entity references after destruction?
   The removal path is thorough — removeEntity clears tile contents (via logical coords,
   the Phase 28 fix), entityMap, the type index, and nulls entity.gameMap. Residual
   risks: (a) #3 — an overwritten duplicate leaves the old instance on its tile and in
   the type Set while entityMap points at the new one; (b) toJSON only rescues detached
   entities of type item (line 1323) — a non-item entity in entityMap but not on any tile
   is silently dropped from saves; (c) detachedEntities restored into entityMap (line
   1392) never get gameMap or a tile — intentional for inventory items, but it's an
   invariant maintained by convention, not assertion.

   Priority recommendations

   1. High — Align fromJSONSelective with fromJSON: restore buildings/specialBuildings,
      recompute crop metadata (#2). Add a both-paths round-trip test (#15).
   2. High — Resolve the duplicate-ID path: throw, or evict-then-add (#3).
      Error-and-continue manufactures ghosts.
   3. Medium — Extract processTurn's simulation logic (snares, spoilage, replenishment)
      into a MapSimulationSystem; move _getGroundProxyInfo to the renderer (#8).
   4. Medium — Set entity.gameMap in the restore path (#4); fix or delete the
      tile.blocksMovement check (#5).
   5. Low — Route the file's console.logs through the scoped logger at debug level (#13);
      replace queue.shift() BFS with an index-pointer queue (#11); update the stale
      "20x20" docstring (#12).
	  
	Review 9 · Map Generators

   Files reviewed: all 9 generators in client/src/game/map/generators/, plus
   RoadNetwork.js, RoomGraph.js, MapConnectivityValidator.js, and the validation gate in
   TemplateMapGenerator.generateValidatedMap

   Summary

   The architecture is genuinely good: a clean Strategy pattern, a topology layer
   (RoadNetwork) with injected randomness, a pure room-analysis module (RoomGraph), and —
   the big one — a production connectivity gate that regenerates failed maps. The
   problems are in determinism (the seeded-RNG story is half-built and bypassed in
   practice), heavy copy-paste between the S-curve generators, one hardcoded-geometry
   generator that breaks if its template size changes, and a validation gate that has
   zero test coverage and doesn't apply to scenario maps.

   Correctness

   1. Invalid maps are guarded in production — but the guard is untested and partial. ⚠️
   generateValidatedMap (TemplateMapGenerator.js:710) runs up to 6 attempts through
   validateConnectivity, keeps the least-bad on total failure, and both WorldManager call
   sites use it. The validator (MapConnectivityValidator.js) checks exit-to-exit
   connectivity and per-building door reachability using the actual movement rules — well
   designed. Gaps:
   • Player spawn is never validated. The flood fill sources from transition points, not
     getStartPosition(). A spawn-in-wall regression would pass the gate.
   • Scenario maps bypass the gate entirely — GameInitializationManager.js:165 calls
     generateFromTemplate directly, so editor-authored maps get no connectivity check.
   • The validator itself has no tests (see #8), so a broken validator silently ships
     broken maps.

   2. Determinism: the infrastructure exists but isn't used. ❌ (the big finding)
   • BranchingRoadGenerator.js:42 creates a per-map seeded stream from config.seed — but
     no caller ever passes seed (WorldManager.js:311 passes only {randomWalls,
     extraFloors, mapNumber}), so it falls back to Math.random. The one properly-seeded
     generator is unseeded in production.
   • Every other generator uses the global gameRandom, seeded once per game
     (GameInitializationManager.js:70) and restored on load (GameSaveSystem.js:484). That
     makes map N's layout depend on total RNG consumption before it — sequence-dependent,
     not f(seed, mapNumber). Notably, SeededRandom.js:18 documents exactly the right
     pattern (new SeededRandom(baseSeed + mapNumber)) and nothing uses it.
   • Retry attempts cascade non-determinism: each failed validation attempt consumes a
     different amount of the global stream, so downstream maps diverge based on how many
     retries earlier maps needed. Same game seed can yield different map 5s.
   • Conversely, if someone does pass config.seed later, the retry loop degrades to 6
     identical attempts — reproducibility and retry are currently coupled by accident.

   3. Spawn/exit geometry assumptions. ⚠️
   LabMapGenerator hardcodes a 70-column layout (ENTRY.CENTER_X: 35, ROAD.RIGHT_X: 53,
   getStartPosition returns {x: 35, …} ignoring width) while tent placement scales with
   width. Mixed fixed/scalable geometry: change the template's registered size and the
   entry road, transitions, and spawn all drift off-center or off-map, with no assertion.
   BranchingRoadGenerator fails soft when no bottom-center POI candidate exists
   (console.warn, line 156) — the map ships without its guaranteed grocer.

   4. Biased shuffle override. ⚠️
   WindingRoadGenerator.getRandomSubarray (line 246) overrides the base class's correct
   Fisher-Yates partial shuffle with sort(() => 0.5 - gameRandom.next()) — a non-uniform,
   engine-dependent shuffle. And MirroredWindingRoadGenerator — its near-twin — doesn't
   override it, so the two S-curve maps sample differently for no stated reason.

   Architecture

   5. Strategy pattern is clean. ✅
   All 9 generators extend BaseMapGenerator, implement generate(config, builder), and are
   swapped via TemplateMapGenerator.generators with a legacy fixed-layout fallback. The
   4-pass structure (topology/zoning/specialization/details) is consistent.
   LabMapGenerator.passSpecialization is an empty method kept for the contract —
   harmless, could be deleted since the base provides no abstract requirement.

   6. Massive duplication between the twins. ⚠️
   MirroredWindingRoadGenerator is ~90% of WindingRoadGenerator with x-coordinates
   swapped (passZoning, passSpecialization, passDetails are near-verbatim). The army-tent
   placement block is copy-pasted three times (Winding:173-185, Mirrored:158-170,
   Road:92-101). RoadGenerator/StartingRoadGenerator are also near-twins. A parameterized
   SCurveRoadGenerator with a mirrored flag and a shared _placeArmyTent helper would
   delete ~300 lines — and would have prevented finding #4.

   7. Template-specific rules live in the base class. Minor.
   BaseMapGenerator.getSpecialBuildingTypes (line 91) hardcodes "map 1 always grocer" and
   "mirrored_winding_road always hardware_store" — subclass knowledge in the Strategy
   base. Everything else in the base (size-aware pairing, frontage checks, zoning along
   segments) is legitimately shared.

   8. RoadNetwork and RoomGraph are the best files in this review. ✅
   RoadNetwork is topology-as-data with painting separated (rasterize), injected RNG,
   axis-alignment enforced with a thrown error, and bounded branch growth. RoomGraph is
   pure analysis — grid adapters for both MapBuilder and GameMap, no mutation, clear role
   heuristics with honest comments about their limits. Neither orchestrates; both are
   exactly what their headers claim.

   Performance

   9. All O(area) or better; every retry loop has an escape. ✅
   Road painting, fencing, and zoning are linear passes. RoadNetwork.growBranches caps at
   count·40+50 attempts (line 109). placeBuildingsFromAnchor is bounded by maxBuildings.
   _spawnArmyTents scans at stride 4 then greedily filters — O(area + placed²). The only
   super-linear spot is trivial: passDetails' fence loop does a buildings.find per tile
   (O(width·buildings)). No unbounded placement loop exists anywhere.

   Code Quality

   10. Responsibilities are clear and well-documented. ✅/⚠️
   Every generator has an accurate header (BranchingRoad's 20-line layout description is
   exemplary), constants are mostly named (ROAD_INSET, SPINE_THICKNESS, LAYOUT in Lab).
   Exceptions: LabMapGenerator has a resolved question left in the comments ("11 is tent
   width? Let's check MapBuilder", line 129), and ScenarioMapGenerator.js:22 assigns
   t.inventoryItems by reference into the builder — the live map aliases the loaded
   scenario JSON, so in-game mutations can leak back into a reused scenario object.

   Testability

   11. MapConnectivityValidator is used in production but never in tests. ❌
   Grep across test/: zero references. No test generates each template and asserts
   validateConnectivity(...).ok. Existing map tests only use
   generateFromTemplate('starting_road') as furniture-test scaffolding. This is the
   cheapest high-value test gap in the codebase: a parametrized "every template × N seeds
   produces a connectivity-valid map" test, plus direct unit tests for the validator's
   scoring (unreachable exit → score ≥ 100, unreachable building → +1 each). RoadNetwork
   (injected RNG) and RoomGraph (pure functions) are also untested despite being designed
   for testability.

   Priority recommendations

   1. High — Add the generator test suite: every template × several seeds through
      generateValidatedMap, assert validation.ok; unit-test validateConnectivity on
      hand-broken maps (#1, #11).
   2. High — Fix determinism deliberately: derive per-map streams as
      makeSeededRandom(gameSeed + mapNumber) (the pattern SeededRandom.js already
      documents), pass an attempt-varying seed inside generateValidatedMap, and stop
      using the global gameRandom in generators (#2).
   3. Medium — Include the player spawn in the validator's reachability check; route
      scenario maps through the gate too (#1, #3).
   4. Medium — Merge Winding/Mirrored into one parameterized generator; extract the
      triplicated army-tent block (#6); delete Winding's biased shuffle override (#4).
   5. Low — Assert or parameterize LabMapGenerator's hardcoded geometry (#3); move
      template-specific POI rules out of the base class (#7); clone inventoryItems in
      ScenarioMapGenerator (#10); fail or fallback-place a POI when BranchingRoad finds
      no bottom-center candidate (#3).

 Review 10 · MapBuilder & FloorplanRegistry

   Files reviewed: client/src/game/map/MapBuilder.js (1,176 lines),
   client/src/game/map/FloorplanRegistry.js (1,217 lines), plus
   test/map/floorplanRegistry.test.js (339 lines)

   Summary

   These are two of the best-engineered files reviewed so far. FloorplanRegistry has real
   schema validation that runs at module load, correct-by-construction rotation
   transforms, a size-indexed catalog built once, and — unusually for this codebase — a
   genuinely good test file. MapBuilder is a disciplined pure builder with bounds-checked
   writes and bounded placement loops. The gaps: out-of-bounds behavior is inconsistent
   (silent clip vs. crash vs. unchecked metadata, depending on the path), the registry's
   schema documentation doesn't match where exterior doors actually live, and the
   furniture footprint table is duplicated against FurniturePlanner with only a comment
   keeping them in sync.

   Correctness

   1. OOB behavior is inconsistent across write paths. ⚠️ (core finding)
   • setTerrain/setEdgeWall (MapBuilder.js:72-95): bounds-checked, silently drop OOB
     writes. A building overflowing the map edge is quietly clipped.
   • placeWindows (line 648) and the special-building window filter (line 551) access
     this.layout[t.y][t.x] directly — an OOB building footprint throws a TypeError
     instead.
   • metadata.doors/windows/placeIcons are pushed with no bounds check at all (e.g.
     gas-station pump icon at entranceX ± 2, line 515) — OOB coordinates can enter
     metadata and flow into applyToGameMap.
   • In practice placeBuildingsFromAnchor enforces MAP_GEN_CONFIG.buildingBorderMargin
     before drawing (line 1120), so overflow needs a direct
     drawBuilding/drawSpecialBuilding call with bad geometry (hardcoded generator layouts
     — the LabMapGenerator class of risk from Review 9). The guard rails work, but three
     different failure modes for the same mistake is a trap.
   • On the upside: floorplan stamping can't overflow its lot — pickFloorplan tests fit
     using oriented dimensions (FloorplanRegistry.js:1204-1215, with a comment
     documenting the portrait/landscape overflow bug this prevents). That one is done
     right.

   2. Rotation transforms are correct. ✅
   rotateFloorplanCW implements (x,y) → (H-1-y, x) with W/H swap, consistent edge mapping
   (EDGE_CW), and a footprint-aware furniture transform whose comment (lines 44-48)
   correctly identifies that the new top-left is the image of the old bottom-left. The
   tests prove it: 4 turns = identity, door/edge consistency, furniture tile-set
   preservation and bounds across a full turn cycle. No reflection support exists —
   rotation only — which limits layout variety (no mirror-image houses) but isn't a
   defect.

   3. Determinism: consistent with the Review 9 caveat. ⚠️
   Furniture and room layout are baked into the plans — stamping is fully deterministic.
   Selection randomness (pickFloorplan, procedural entrances, window counts, subdivision
   layout rolls) all flows through the global gameRandom stream — deterministic within a
   playthrough, sequence-dependent across maps, same as the generators. One new wrinkle:
   MapBuilder.metadata.generated = new Date().toISOString() (line 20) makes the output
   non-reproducible byte-for-byte even when the layout is identical. Trivial, but it
   poisons any future "same seed ⇒ same map hash" check.

   4. Load-time validation only logs. ⚠️
   validateFloorplan checks grid dimensions, legend coverage, room contiguity, door
   adjacency (off-grid / not-on-wall), sealed rooms, hall width, and exterior-door
   placement — thorough. It runs for all 20 plans at import (lines 1179-1182) but the
   "fail fast in dev" comment is aspirational: there's no environment check, it
   console.errors and ships the broken plan everywhere. In tests it's covered; in
   production a bad plan would render garbage with one console line.

   Architecture

   5. MapBuilder is a pure builder. ✅
   Touches only this.layout and this.metadata; no engine, no GameMap, no UI. Its only
   external couplings are gameRandom, MAP_GEN_CONFIG, RoomGraph (room tagging), and
   FloorplanRegistry (plan selection) — all appropriate. getFinalMapData returns a fresh
   structure (though edgeWalls objects are shared by reference with the builder layout —
   harmless since the builder is discarded, but an aliasing trap if that ever changes).

   6. FloorplanRegistry: data + the right logic, in the right place. ✅
   Selection (pickFloorplan), transforms (rotate/orient), footprints, and validation live
   with the catalog; actual stamping (stampFloorplan) lives in MapBuilder. That's the
   correct split — the registry never touches a map. One nit: relocateExteriorDoor
   (MapBuilder.js:238) and _doorOffPrivateRoom (line 272) are two overlapping
   door-relocation helpers (one for procedural, one for plans) with slightly different
   slide semantics — a candidate for unification, low priority.

   7. Schema doc vs. reality drift. ⚠️
   The header (lines 10-19) documents entrance/back as part of the floorplan object, but
   they're actually stored in a separate EXTERIOR_DOORS table (line 1140) and attached in
   a loop afterward. Functionally fine, but the documented schema isn't the authored
   schema, and a plan missing from the table silently gets no exterior doors (validation
   catches it — but only via the generic "missing entrance" error, not "you forgot to add
   an EXTERIOR_DOORS entry").

   Performance

   8. Parsed once, indexed once. ✅
   Module-level FLOORPLANS, BY_SIZE, and SIZES are built at import; selection is a
   pre-sorted linear scan over ~10 size tiers. No re-parsing per map load (ES module
   cache). One avoidable churn: orientFloorplan re-rotates from scratch on every
   drawBuilding call — up to 3 rotations, each allocating a new grid + joined strings,
   per building, hundreds of buildings per map. Caching the 4 oriented variants per plan
   (80 total) would eliminate it. Generation-time only, so minor.

   Code Quality

   9. Consistent schema, readable data. ✅
   All 20 plans follow the same {id, width, height, grid, legend, doors, furniture}
   shape, with ASCII grids annotated by coordinate rulers and design-rationale comments
   (e.g. RANCH_2BED_1BATH's closet explanation). This is hand-authored data at a high
   standard.

   10. Duplicated footprint table. ⚠️
   FLOORPLAN_FOOTPRINTS (FloorplanRegistry.js:79) must match
   FurniturePlanner.FURNITURE_FOOTPRINTS — enforced by a comment ("must match", line 78)
   and nothing else. The editor imports from FurniturePlanner, the stamper from the
   registry. A one-line test asserting deep equality would convert this from a drift-bomb
   into a non-issue.

   Testability

   11. The existing suite is good — with one hole exactly where the review asks. ⚠️
   test/map/floorplanRegistry.test.js covers: rotation correctness (5 tests),
   authored-plan validity (contiguity, sealed rooms, hall width, closet-door placement),
   negative validation tests (1-wide hall, sealed room are flagged), oriented dims, an
   end-to-end stamp with connectivity check, pickFloorplan snap-down + seed stability,
   and furniture-vs-walls in all orientations. What's missing: stamping at map-edge
   positions — no test places a building flush against or past the boundary and asserts
   no OOB writes and no OOB metadata, which is precisely the inconsistent behavior in
   finding #1. Also missing: the footprint-table equality check (#10).

   Specific question

   Is FloorplanRegistry generated, data, or hand-authored? Should it be JSON?
   Hand-authored — unambiguously. The grids carry coordinate rulers, design commentary,
   and iterated size tiers (SMALL_*, CENTER_HALL_*, L_HALL_*) that show manual evolution.
   It is a data file (~850 lines of plans) with a logic layer (~350 lines of
   transforms/validation/selection). Should it be JSON? No — JSON can't hold the per-plan
   comments and coordinate-ruler annotations that make the grids editable, and
   co-locating validateFloorplan lets it run at import. If anything, split it as
   floorplans.data.js (plans only) + FloorplanRegistry.js (logic) — but the current form
   is defensible and the tooling around it (validation + tests) is already in place.

   Priority recommendations

   1. High — Add the edge-stamping test: every floorplan stamped at all four map
      edges/corners; assert no throw, no OOB metadata (#1, #11).
   2. Medium — Normalize OOB behavior: make placeWindows/special-building window code use
      getTerrain-style guards, and bounds-check metadata pushes (or assert at
      getFinalMapData) (#1).
   3. Medium — Add a test asserting FLOORPLAN_FOOTPRINTS deep-equals
      FurniturePlanner.FURNITURE_FOOTPRINTS; better, import one from the other (#10).
   4. Low — Make load-time validation actually fail in dev/test (throw when
      import.meta.env.DEV), keep log-only in production (#4).
   5. Low — Fold EXTERIOR_DOORS into the plan literals to match the documented schema
      (#7); cache oriented plan variants (#8); drop or fix the generated timestamp for
      reproducibility (#3); unify the two door-relocation helpers (#6).  
	  
	   Review 11 · LootGenerator & LootTables

   Files reviewed: client/src/game/map/LootGenerator.js (1,992 lines),
   client/src/game/map/LootTables.js (133 lines), verify_loot.js,
   verify_loot_constraints.js

   Summary

   The split is conceptually right — LootTables.js is a genuinely pure, well-documented
   data file, and all selection logic lives in LootGenerator. I verified empirically that
   every defId referenced anywhere resolves against ItemDefs (all LootTables keys plus
   all 59 hardcoded IDs in the generator — zero missing). The problems are: ~200 lines of
   confirmed dead code, a 370-line per-building megamethod, hot-path array filtering on
   every zombie kill, verify scripts that aren't wired into anything, and no test that
   would catch a future typo'd defId silently vanishing from the loot pool.

   Correctness

   1. defId validity: clean today, unprotected tomorrow. ⚠️
   I ran a runtime check: every key in SPECIAL_BUILDING_LOOT, ZOMBIE_LOOT,
   MAP_WIDE_REQUIREMENTS, and every string literal in LootGenerator.js resolves in
   ItemDefs. But the safety mechanism is createItemFromDef returning falsy → silent skip
   (every call site does if (item)). A typo introduced tomorrow means an item — including
   a "guaranteed" one like guaranteedTech or a map-wide requirement — simply never
   spawns, with no error. This needs a test or load-time validation, not vigilance.

   2. Capacity limits: respected for containers, unbounded on ground. ✅/ℹ️
   Safes use grid.addItem with a rotate-and-retry fallback and skip what doesn't fit
   (LootGenerator.js:655-667) — the tetris capacity is honored. Ground tiles have no
   capacity concept: items are appended via setItemsOnTile([...current, item]) without
   limit — presumably by design (a tile is a pile), but worth stating since the review
   asked.

   3. Deterministic via the global stream. ✅ (with the standing caveat)
   All rolls go through gameRandom — no Math.random anywhere in the file. Loot is
   deterministic given stream state, subject to the Review 9 caveat: sequence-dependent
   across maps, since nobody passes per-map seeds.

   4. The guaranteed-drop index bug is fixed and documented. ✅
   Lines 969-975 roll guaranteed-drop indices against selectedTiles.length, not the
   requested dropCount, with a comment explaining the silent-loss bug this prevents. This
   is how fixes should look.

   5. spawnGenerator is frontage-blind. ⚠️
   "Behind a building" is hardcoded as building.y - 3 (north side, line 453) regardless
   of the building's frontage. For a north-facing building that's the front — a generator
   can spawn blocking the entrance path. It only checks walkable/empty/outdoor, not door
   proximity (unlike every other pass, which uses isNearDoor).

   6. Fragile ordering in battery attachment. Minor.
   applySpawnDefaults attaches tool.battery to any BATTERY_POWERED item (line 1544), then
   the mower/scooter/hotplate block (line 1558) overwrites it with tool.large_battery.
   Correct outcome for those three defIds, but any future battery-powered item silently
   gets tool.battery whether or not its slot allows it — the slot's allowedItems is never
   consulted.

   Architecture

   7. Relationship (specific question 1): one-way, correctly owned. ✅
   LootTables.js is pure data — no functions, no selection logic — with an unusually
   honest header (the P7-12 note explaining the deliberate two-shape schema:
   weighted-pool arrays for grocer/gas_station, categorized objects with rules for the
   bespoke buildings). LootGenerator imports it; nothing imports back. Data owns nothing;
   logic owns all selection. The cost of the two shapes is the bespoke consumer — see #9.

   8. Not a pure function — a mutating orchestrator. ℹ️
   spawnLoot(gameMap, mapNumber) mutates the map directly across 7 passes (special
   buildings, residential, outdoor, furniture, vehicles, uniques, room-specific, grass).
   That's a defensible design for a spawner, but it means loot generation can't be tested
   as seed + zone → loot list without a full GameMap, and it emits ~20 console.log lines
   per map in production (Review 4 theme, again).

   Performance

   9. Dead code: ~200 lines confirmed. ⚠️
   • applyEasyStartLoot (lines 1863-1991, ~130 lines): zero callers — the class comment
     itself says "the starting house no longer exists" (line 142).
   • getBuildings (lines 758-776): self-declared deprecated, zero callers.
   • MAP_WIDE_UNIQUES = [] (LootTables.js:123): the entire unique-spawn block (lines
     1685-1726, including the map≥5 reduction logic) is live code that can never fire;
     only MAP_WIDE_REQUIREMENTS actually runs.

   10. Per-pick full-catalog scans (generation-time). ℹ️
   getWeightedRandomItemKey filters the whole item catalog, sums weights, and
   linear-scans on every pick — 1-3 picks per pile, hundreds of piles per map. Fine at
   generation time, but the filtered+weighted table depends only on (location, mapNumber)
    and could be built once per map.

   11. Hot-path filtering on every zombie kill. ⚠️
   generateZombieLoot runs during gameplay, per kill. The basic-zombie common and rare
   tiers re-filter this.itemKeys (clothing filter, ammo/knife/lighter filter — lines
   1409-1426) on every call, allocating fresh arrays per dead zombie per item slot. These
   two filtered lists are constant — hoist them to lazy-init alongside initItemKeys.

   Code Quality

   12. Probability styles are mixed but safe. ℹ️
   Three idioms coexist: weighted pools ({key, weight} — normalization means no
   sum-correctness risk), rules probability objects, and inline magic rolls (< 0.5, <
   0.7, < 0.25…) scattered through the switch. The header comment's rule list ("Water
   Bottle: Max 1 per loot pile" etc.) is prose that can drift from the code — and already
   has ("Starting-home loot removed" is only noted inline). addItemsFromTable recomputes
   totalWeight inside its per-item loop — trivial waste, same line count to fix.

   13. Decomposition candidate (specific question 2): yes, clearly.
   The file is really six modules: (a) spawnSpecialLoot — a 370-line method with an
   8-field buildingState, a 6-way switch, and a lab special case with its own early
   return; (b) safe spawning/population; (c) vehicle/furniture spawning (beds, wagons,
   mowers, scooters, golf carts, generators); (d) zombie loot; (e) static item
   initialization (applySpawnDefaults/initializeWeaponAmmo); (f) room-specific loot.
   Splitting along those lines would leave each file under ~400 lines and make the
   per-building logic table-drivable later. Deleting the dead code in #9 is the free
   first step.

   Testability

   14. The verify scripts are orphans. ❌
   verify_loot.js (MockGameMap, console PASS/FAIL over 100 iterations of pile validation)
   and verify_loot_constraints.js are not in package.json scripts, not vitest tests, and
   there's no CI to run them. test/loot/ contains only battery tests. So: no distribution
   testing, no "0%-probability item never appears" check, no capacity test, and no
   defId-resolution test (the gap in #1). The irony is verify_loot.js is 80% of a real
   test already — it imports the actual generator and would port to vitest in an hour.

   Priority recommendations

   1. High — Add a vitest that asserts every defId in LootTables (and the generator's
      literal IDs, via a small exported list or a static check) resolves in ItemDefs
      (#1). Today's clean state should be pinned by a test, not by this review.
   2. High — Delete applyEasyStartLoot, getBuildings, and either populate or delete
      MAP_WIDE_UNIQUES (#9). ~200 lines of the 91 KB vanish for free.
   3. Medium — Port verify_loot.js to a real vitest suite: pile limits (≤1 food, ≤1
      pileLimitOne), backpack map limits, food-scarcity rejection rates over N iterations
      (#14).
   4. Medium — Hoist the zombie-tier filtered lists to lazy-init (#11); build the
      weighted catalog once per (location, mapNumber) (#10).
   5. Low — Make spawnGenerator frontage-aware and door-buffered (#5); consult
      allowedItems in the battery attach (#6); decompose per #13 starting with
      spawnSpecialLoot.
	  
	   Review 12 · TemplateMapGenerator

   File reviewed: client/src/game/map/TemplateMapGenerator.js (1,092 lines), plus all
   scenario load call sites

   Summary

   The core obligations are met: every runtime scenario path correctly skips
   spawnLoot/planFurniture exactly as AGENTS.md §9 requires, and all scenario loads
   funnel through one class. The weaknesses are: zero validation of scenario JSON
   (malformed input crashes with a raw TypeError deep in the pipeline, despite zod being
   a project dependency), a misplaced JSDoc block that documents the wrong method, ~120
   lines of unreachable legacy template data, and no scenario round-trip test.

   Correctness

   1. Scenario loads skip procedural spawning on all paths. ✅
   Verified all three runtime paths:
   • GameInitializationManager.js:388-397 — explicit isScenario guard: skips zombies,
     loot, animals; only instantiates a LootGenerator for later zombie drops.
   • WorldManager.js:787-823 (scenario transition) — generateFromScenario +
     applyToGameMap, no spawnLoot call; the procedural transition path right below it
     (line 852) does call it — correct split.
   • applyToGameMap stamps furniture verbatim from furniturePlan + loose editor furniture
     (lines 1010-1018, with an accurate comment explaining why there's no procedural
     fallback), and planFurniture is only reachable via LootGenerator.spawnLoot
     (LootGenerator.js:258).
   • editor.tsx:2629 runs spawnLoot after a scenario load — but that's the editor's
     explicit "Generate Loot" authoring tool, not a gameplay path. Intentional.

   2. Scenario JSON is not validated. ❌ (core finding)
   generateFromScenario (line 683) trusts scenarioData blindly: no check that
   width/height exist, that tiles is a rectangular array matching them, that terrain
   strings are known, or that metadata blocks are well-formed. Failure modes are all raw
   and late: tiles[y] undefined throws inside ScenarioMapGenerator.generate (line 14);
   new MapBuilder(undefined, undefined) produces NaN geometry; a row shorter than width
   throws on tiles[y][x].terrain. applyToGameMap guards only missing tiles array.
   Meanwhile the entity level is well-defended (per-entity try/catch at line 1079,
   per-item try/catch in applyNpcLoadout at 761) — the structural JSON is the unguarded
   layer. zod is already a project dependency; a ScenarioSchema.safeParse at the top of
   generateFromScenario would convert crashes into one clean error.

   3. Misplaced JSDoc. ⚠️
   The comment block at lines 670-682 ("Generate a map and apply it to a fresh GameMap,
   regenerating until it passes the connectivity gate…", with @param
   templateName/config/GameMapClass) sits directly above generateFromScenario — but it
   describes generateValidatedMap (line 710), which has no documentation.
   generateFromScenario — the public scenario entry point — carries docs for the wrong
   method with parameters it doesn't take.

   4. Door/window instantiation is careful. ✅
   Edge-qualified entity IDs prevent corner-tile ID collisions (with a comment explaining
   why), isKeylocked propagates, registry tags are matched from entityRegistry, and
   door/window tiles are force-set to floor after entity placement. isOpening doorways
   correctly clear their edge wall instead of spawning an entity (lines 908-914).

   Architecture

   5. Single path — no bypasses found. ✅
   Every scenario load (new game, map transition, editor tooling) goes through
   generateFromScenario + applyToGameMap. In-progress savegames use GameMap.fromJSON
   instead — a different format, correctly separate. ScenarioStorage only does I/O. No
   alternate application path exists.

   6. Metadata aliasing. Minor.
   gameMap.metadata = templateMapData.metadata (line 999) assigns the builder's metadata
   object by reference, and gameMap.buildings aliases metadata.buildings. Consistent
   since they share one owner, but it's another uncloned-reference assumption in a
   codebase already bitten by them (Reviews 5, 8).

   Performance

   7. Scenario JSON is parsed once per first visit. ✅
   WorldManager.js:817 saves the generated map into its map cache (saveCurrentMap), so
   revisiting a scenario map reloads the cached GameMap, not the JSON. New games parse
   once at boot. The editor re-parses per tool invocation — appropriate.

   8. O(area × metadata) scans in the wall-conversion pass. ℹ️
   applyToGameMap's PHASE 0 calls hasDoorOrWindow (three linear scans over
   doors/windows/garageDoors) plus a buildings.some(...) perimeter test for every
   wall/building tile. Generation-time only, so acceptable — but both are
   Set-lookup-shaped, and the fix is mechanical.

   Code Quality

   9. Legacy template data is unreachable. ⚠️
   small_building, mall_section, outdoor_area (~120 lines of ASCII layouts) are only
   generatable via the !generator legacy branch — and getTemplateForMapNumber
   (TemplateConfig.js:65) never selects them. They're also the sole consumers of
   parseTemplateLayout, addRandomWalls, and addRandomFloors. If the editor's template
   picker doesn't expose them, that's ~180 lines of dead weight; if it does, they bypass
   the connectivity gate.

   10. placeIndoorDecorations is commented out at its only call site. ℹ️
   Line 299: // this.placeIndoorDecorations(mapData); — the 25-line method ships but
   never runs. Either intentional (then delete or mark it) or a disabled feature nobody
   tracked.

   Testability

   11. No scenario round-trip test. ❌
   test/serialization/saveload.test.js contains exactly one test (player maxAp through
   map toJSON/fromJSON). scenarioFurniture.test.js and npcLoadout.test.js exercise
   generateFromScenario/applyToGameMap for furniture stamping and NPC loadouts — good
   partial coverage — but nothing verifies a scenario can be exported and reloaded
   identically (tiles, edgeWalls, doors, entities, metadata), and nothing tests
   malformed-input handling (#2). A round-trip test would also pin the furniture-stamping
   behavior AGENTS.md documents.

   Priority recommendations

   1. High — Validate scenario JSON at generateFromScenario entry (zod schema:
      dimensions, rectangular tiles, known terrain strings, metadata shapes); return one
      descriptive error instead of deep TypeErrors (#2).
   2. High — Add the scenario round-trip test: editor-format scenario →
      generateFromScenario → applyToGameMap → toJSON → compare against expectations,
      including furniture and entities (#11).
   3. Medium — Move the JSDoc from line 670 to generateValidatedMap and write real docs
      for generateFromScenario (#3).
   4. Low — Delete or formally legacy-mark the three ASCII templates and their helper
      methods (#9); resolve placeIndoorDecorations (#10); convert the PHASE 0 scans to
      Sets (#8); clone metadata on assignment (#6).
	  
	   Review 13 · Entity Base Class

   Files reviewed: client/src/game/entities/Entity.js (1,257 lines),
   client/src/game/Entity.js (root stub, 1 line)

   Summary

   Entity is not a component container — it's a ~1,250-line god-object facade that
   happens to have a components Map. The ECS mechanics themselves are solid: O(1) Map
   access, a minification-safe component registry (with a comment documenting the
   production bug that motivated it), defensive serialization, and a working facade test.
   The real issues: game logic from at least five subsystems lives directly on the class,
   it imports the engine singleton (the same circular-dependency pattern flagged for Tile
    in Review 5), there's a shared mutable default array in the facade machinery, and
   entity destruction has no lifecycle — cleanup is whatever GameMap.removeEntity happens
   to do. The root stub is confirmed dead weight.

   Correctness

   1. ID generation is collision-safe. ✅
   crypto.randomUUID() where available; the fallback is a UUID-v4-shaped draw from
   gameRandom (122 bits — fine). Save/load preserves IDs from data, and duplicate
   detection exists in GameMap.addEntity (though Review 8 found it logs-and-overwrites).
   One nit: the fallback consumes the shared RNG stream, so entity creation order
   perturbs gameplay RNG — another strand of the Review 9 determinism coupling.

   2. No destruction lifecycle. ⚠️
   There is no destroy()/dispose(). die() only drops inventory via an engine event.
   Actual cleanup is GameMap.removeEntity (clears map indices and entity.gameMap) — after
   that the entity is left to the GC with its listeners intact. removeAllListeners() is
   never called on removal; any system that subscribed to a specific entity
   (entity.on(...)) keeps the entity alive. Components themselves are dropped with the
   entity, which is fine, but "entity teardown = GameMap.removeEntity + hope" is a
   convention, not a mechanism — and it's untested.

   3. Shared mutable default in defineAccessors. ❌ (loaded gun)
   The accessor defaults (noiseBlacklist: [], recentThreats: [], noiseCoords: {x:0,y:0} —
   Entity.js:1159-1177) are single object/array instances shared by every component-less
   entity. The constructor comment (lines 177-183) documents the rule — "only ever read,
   never mutated" — but nothing enforces it: one entity.recentThreats.push(...) on a door
   or item corrupts the default for all entities. Today's readers are disciplined
   (Pathfinding.js:367 reads only), but this is exactly the class of bug that survives
   until it doesn't. Return a frozen value or a fresh copy.

   4. The hp-setter clamp trap is documented but still a trap. ⚠️
   set hp clamps to health.max, and the setter auto-creates Health with max: 0 — so
   entity.hp = 50 on a fresh entity silently yields hp: 0. The fromJSON comment (lines
   1100-1104) explains why restore order makes it safe there, with an explicit "do not
   'fix' this" warning. Any other code path that sets hp before maxHp hits the same
   silent zeroing. Also: modifyStat/setStat silently no-op on an undefined stat name
   (lines 505, 519) — a typo'd stat fails with no signal.

   5. Serialization revival is inconsistent. ⚠️
   fromJSON revives inventory via Container.fromJSON but assigns
   containerGrid/pocketGrids as raw POJOs (lines 1137-1142). Attachments revive as
   Entity-or-POJO depending on whether they have components. Downstream code
   (GameMap._processItemDataTurn, Review 8) defensively handles both shapes — the duality
   is absorbed, not resolved. Also toJSON writes x/y from renderX/renderY: a
   mid-animation save persists visual coordinates.

   6. The (0,0) LKP guard conflates sentinel with real data. ℹ️
   setTargetSighted rejects (0,0) when the entity is far from the origin (line 841) —
   (0,0) is a legal map tile; the guard treats it as "unset." Works because the map's
   playable area starts well inside, but it's a documented hack guarding an undocumented
   invariant.

   Architecture

   7. Entity is a god object containing logic from ≥5 subsystems. ❌ (the big finding)
   Living directly on the class: combat (takeDamage/heal → AttributeProgressionManager),
   AP economy (useAP/restoreAP), skill progression (recordHit/recordDefense/onItemCrafted
    → PlayerSkills milestones), sickness/infection (inflictSickness → CombatResolver,
   MAX_SICKNESS_DURATION from SurvivalCascade), AI stimulation
   (setNoiseHeard/setTargetSighted writing AIBehavior), vision (canSeePosition →
   LineOfSight), faction resolution (FactionRegistry), animation playback (playAction →
   SequencerAction, engine.registerAction), and item-flag derivation (precomputeItemFlags
    → ItemDefs). Per the project's own layering rule, all of this belongs in systems
   operating on components.

   8. It imports the engine singleton. ❌
   Line 5 — used by die(), playAction (camera visibility, registerAction). Same
   circular-dependency shape as Tile → GameEngine (Review 5): GameEngine → GameMap →
   Entity → GameEngine. It also means Entity behavior depends on global runtime state,
   undermining the testability the ECS split was supposed to buy.

   9. The root stub is a confirmed leftover. ⚠️
   client/src/game/Entity.js is export * from './entities/Entity.js' and is imported
   nowhere (grep-verified across client/src, both with and without extension). It's
   harmless (same module identity) but it's a second import path for the same class —
   delete it.

   10. The facade duality is the tax on everything else. ℹ️
   Every stat exists twice — backing field + component (_gridX/Position,
   _condition/SurvivalStats, plus full defineAccessors families for
   AIState/Burnable/PlayerSkills/RpgStats/EquippedArmor) — in two different accessor
   styles (hand-written getters vs. defineAccessors). It preserves backward compatibility
   and the tests prove the delegation works, but the result is that "where does entity.hp
    live?" has a different answer depending on entity age and provenance.
   SERIALIZED_FIELDS + component serialization also double-writes some state (hp is in
   both, reconciled by the ordering comment in #4).

   Performance

   11. Component access is O(1). ✅
   Map.get(name) with string keys throughout; the minification-safe
   COMPONENT_NAME_BY_CTOR reverse map is built once. Facade getters cost one Map lookup
   per access — fine even in hot loops. addComponent/getComponent/hasComponent all
   defensively handle a missing Map without allocation. No array scans anywhere in
   component access.

   Code Quality

   12. Inconsistent component-addition API. ⚠️
   addComponent accepts either (string, rawData) or (classInstance) — meaning the Map
   heterogeneously holds class instances and raw POJOs, with _serializeComponents and
   fromJSON absorbing the difference. One method, two contracts.
   (hasComponent/getComponent helpers exist and are used consistently — good.)

   13. Accessor sprawl. Minor.
   ap/currentAP and maxAp/maxAP are duplicate names for the same property (lines
   288-328). And EntityType constants coexist with raw string literals elsewhere ('door'
   in RoomGraph, LOS, LootGenerator) — the same magic-string pattern Review 3's catalog
   solved for events.

   Testability

   14. Facade tests exist; lifecycle tests don't. ⚠️
   test/ecs/facades.test.js covers AIState delegation, factory wiring, crafting
   progression, and AIState serialization round-trip — meaningful, passing coverage of
   the facade mechanism. Missing: entity destruction/cleanup (#2), the shared-default
   mutation hazard (#3 — a test that pushes into a default and asserts isolation would
   pin it), the hp-before-maxHp ordering trap (#4), ID uniqueness across create/restore
   cycles (#1), and fromJSON revival of containerGrid/attachments (#5).

   Priority recommendations

   1. High — Fix the shared mutable defaults: freeze the default values in
      defineAccessors or return fresh copies from the getter (#3). Cheapest real
      bug-prevention in this review.
   2. High — Add an explicit destroy() lifecycle: removeAllListeners(), clear gameMap,
      drop intents — and call it from GameMap.removeEntity (#2). Test it.
   3. Medium — Evict the game logic to systems over time: playAction/die
      (engine-coupled), skill progression, and sickness are the cleanest extractions (#7,
      #8). At minimum, stop adding new logic to the class.
   4. Medium — Delete the root stub (#9); make modifyStat/setStat warn on unknown stats
      (#4).
   5. Low — Unify addComponent on instance-only (#12); collapse ap/currentAP/maxAp/maxAP
      (#13); revive containerGrid/pocketGrids through Container.fromJSON (#5); add the
      lifecycle tests from #14.
	  
	    Review 14 · Specialized Entities

   Files reviewed: Door.js (272), GarageDoor.js (168), Window.js (295), Rabbit.js (200),
   ZombieTypes.js (196), ZombieCorpseConfig.js (103), NPCTypes.js (107), PlaceIcon.js
   (41), TestEntity.js (73)

   Summary

   The door/window state machines are the best-designed part of the entity layer:
   deliberate visual-vs-logical state splitting (visualIsOpen, silent breaks for
   animation delay), correct serialization ordering, and documented edge cases. The data
   catalogs are mostly clean — but I found two dead defIds in the NPC loot pools
   (tool.flashlight, tool.matches don't exist), a reinforcement bypass where zombies walk
   through reinforced-but-open windows undamaged, and GarageDoor's peer-sync has a
   fragile guard and resolves peers on the wrong map in multi-map scenarios.

   Correctness

   1. Door state transitions are correct and well-ordered. ✅
   All transitions mutate state → dirtyVision() → blocking recompute → event, in that
   order. The break path (takeDamage, lines 233-244) forces isOpen = true on destruction,
   supports silent breaks for animation delay, and documents that a repeat hit on a
   broken door returns isBroken: true without meaning "freshly broken" (no spurious
   doorBroken event). Keylocked doors are indestructible. close() refuses on occupants
   and loot. repair() grows maxHp up to 40, and fromJSON restores maxHp before hp with a
   comment citing the exact clamp trap from Review 13 — done right. One inconsistency:
   lock() calls updateBlocking() but unlock() doesn't (harmless — blocking doesn't depend
   on lock state — but asymmetric).

   2. Window: reinforced-open windows are freely passable to zombies. ❌ (live bug)
   reinforce() doesn't require the window to be closed, and nothing later closes it. The
   movement predicates checked by zombies — Tile.isWalkable (Review 5: window passage on
   isOpen || isBroken && !isPlayer) and Pathfinding.isEdgeBlocked (line 492: e.isOpen →
   passable) — never check isReinforced. Only getBlockingStructure does. Result: a zombie
   paths through a plank-reinforced open window and walks through it; the reinforcement
   is never attacked or damaged. Yet another instance of the Reviews 5–7 theme: five
   readers of the same state with different predicates. The damage cascade itself (glass
   first, overflow into reinforcement — takeDamage lines 211-231) is correct, including
   when the glass is already open/broken.

   3. GarageDoor peer sync: two guard styles, one fragile. ⚠️
   • open/close/lock/takeDamage/syncVisualState set peer._isSyncing with no try/finally —
     an exception mid-propagation leaves a peer permanently _isSyncing = true, silently
     desyncing the group forever. unlock/forceUnlock use this._isSyncing + try/finally —
     the safe pattern, applied inconsistently.
   • getPeers() (line 21) reads engine?.gameMap instead of this.gameMap — the Review 8
     restore-path gap surfacing again: on any map that isn't the engine's active one,
     peers resolve from the wrong map (or not at all).
   • The takeDamage sync (copy hp to peers, then conditionally re-damage) is convoluted
     but converges to correct state.

   4. Rabbit: clamp-trap ordering that survives by luck. ⚠️
   Constructor sets this.hp = 5 before this.maxHp = 5 (lines 17-18) — the Review 13 trap.
   It works only because Health defaults to max: 100, so 5 clamps to 5. If anyone raises
   rabbit hp above 100 or the Health default changes, rabbits spawn dead. Door does it in
   the correct order; Rabbit should match. Also Rabbit.takeDamage re-implements the base
   method and drops notifyChange() and lastAttacker tracking.

   5. NPCTypes: two dead defIds. ❌
   survivor.pools.general references tool.flashlight and tool.matches — neither exists in
   ItemDefs (the real items are tool.smallflashlight and tool.matchbook). Verified at
   runtime. That's 2 of 9 entries (~22%) of the general pool that silently produce
   nothing when rolled — same silent-skip failure mode as Review 11 finding #1, and no
   test catches it. ZombieTypes and ZombieCorpseConfig are fully consistent: all 12
   subtypes match the editor palette, all lootTable references resolve, corpses cover
   every subtype.

   6. Serialization round-trips are careful. ✅
   Window.fromJSON recomputes subtype from physical state (comment documents the
   stale-subtype bug this fixed); Rabbit.fromJSON uses ?? with a comment explaining why
   || would resurrect dead rabbits; GarageDoor.fromJSON preserves groupId. These comments
   show real bugs were fixed here — and pinned only by comments, not tests.

   Architecture

   7. Entities hold state machines, not game logic — mostly right. ✅/ℹ️
   Door/Window/GarageDoor keep transition logic on self, which is appropriate for
   stateful structures. Two leaks: all four entity files import the engine singleton for
   dirtyVision/camera/peers (the established circular pattern — Reviews 5, 8, 13), and
   Rabbit.playAction copy-pastes ~50 lines of Entity.playAction (with one line commented
   out) — animation sequencing belongs in a shared helper, not duplicated per entity
   class.

   8. Data catalogs are pure, with one exception. ✅
   ZombieTypes and NPCTypes are pure data with genuinely good comments (the sickChance
   Spitter-exclusivity note, the defense semantics). ZombieCorpseConfig is data plus
   dropZombieDeathLoot — placement logic in a config file; cohesive enough to defend, but
   it's the thin edge of "config files growing behavior." TestEntity.js also exports a
   shadow Item class (imported as LegacyItem, used only in a GameContext debug spawn
   block) — a second Item type in a file named TestEntity is a naming trap, though
   currently contained.

   Code Quality

   9. No dead type data; minor quirks. ✅
   All 12 zombie subtypes and all 3 NPC types are referenced (editor palette, spawners,
   loot). Quirks: crawler.hp = 7.5 (fractional HP — works, but unusual);
   mutant.attackCost exists only on one archetype (schema-by-drift); runner corpse has a
   color but no imageId.

   Testability

   10. The important transitions are tested; the bugs found here aren't. ⚠️
   test/systems/window_combat_redirection.test.js covers the broken-window zombie
   redirection; keylocked_doors.test.js covers keylocked doors. Missing:
   reinforced-open-window passability (#2 — a test would have caught it), the Window
   glass→reinforcement damage cascade, GarageDoor peer sync (including the
   exception-during-sync case, #3), and Rabbit spawn HP (#4). The careful fromJSON
   restorations (#6) have no round-trip tests either.

   Priority recommendations

   1. High — Fix the dead NPCTypes defIds (tool.flashlight → tool.smallflashlight,
      tool.matches → tool.matchbook) and extend the Review 11 defId test to cover
      NPCTypes pools (#5).
   2. High — Decide the reinforced-open-window rule and enforce it in one place: either
      reinforce() requires/blocks isOpen, or the movement predicates check isReinforced
      (#2). Add the test.
   3. Medium — Unify GarageDoor's guard on the try/finally pattern; use this.gameMap in
      getPeers (#3).
   4. Medium — Reorder Rabbit's constructor (maxHp before hp) and route takeDamage
      through the base implementation (#4).
   5. Low — Extract the duplicated playAction sequencer logic (#7); move LegacyItem out
      of TestEntity.js or mark it dev-only (#8); normalize crawler.hp to an integer (#9).
	  
	  Review 15 · EntityFactory

   File reviewed: client/src/game/EntityFactory.js (256 lines), plus BlueprintRegistry.js
    (27 lines)

   Summary

   The factory is one of the cleaner files in the codebase: pure builders with no world
   side effects, no engine import, thorough component sets for each actor type, and
   well-documented skill-seeding that respects loaded saves. The findings are modest: two
   of its five methods are dead (including an entire blueprint/archetype subsystem that
   was scaffolded and never adopted — which is ironic, because it's exactly the preset
   mechanism the file's boilerplate cries out for), a hardcoded 11-branch color ladder
   that belongs in ZombieTypes, and no component-matrix test.

   Correctness

   1. Component sets are complete per type; missing components degrade instead of
   crashing. ✅
   • Player gets the full 13-component set plus recalcCharacter to derive caps from
     attributes (lines 100-106), with HP/AP filled after the derivation — correct
     ordering relative to the Review 13 clamp trap.
   • Zombie gets the AI-actor set (Position, Health, Movable, Renderable, AIBehavior,
     AIState, Vision, ActionPoints, Burnable). No SurvivalStats/RpgStats — deliberate.
   • NPC gets the same plus RpgStats and a legacy Container inventory. No SurvivalStats —
     explicitly documented as deliberate (lines 100-103).
   • The null-crash question is mostly defused by the facade design (Review 13): reads of
     absent components return defaults, writes auto-create. Systems that could receive a
     component-less entity guard with hasComponent (VisionSystem:16, Entity.js:702).
     die() guards this.inventory &&. No unguarded null-deref path found.

   2. Skill seeding respects saved progress. ✅
   The customStats?.x !== undefined ? x : seed(...) chains (lines 65-77) ensure a loaded
   character is never re-seeded — with a comment explaining the Mythras-style seeding
   model. Verbose but correct.

   3. Three inventory representations, again. ⚠️
   The player gets both InventoryContainer and Inventory components (lines 40-41) — two
   components with overlapping maxWeight fields (50/50 — drift waiting to happen) — while
   NPCs get neither and instead get the legacy entity.inventory = new Container(...)
   field. So player inventory, NPC inventory, and item containerGrid are three different
   shapes. Consistent with the Review 8/13 findings; the factory is where the player/NPC
   split originates.

   4. Zombie colors live in the factory, not the data catalog. ⚠️
   An 11-branch if-else chain (lines 121-132) maps subtype → color, while spriteKey
   correctly comes from ZombieTypes. Add a subtype to ZombieTypes without touching the
   factory and it silently renders as the basic gray-green. This is data (color) stranded
   in code — the catalog already has the per-type doc comment infrastructure to hold it.

   Architecture

   5. Pure builders — the cleanest architecture finding in this review series. ✅
   No engine import, no GameEvents, no world registration (every caller does its own
   gameMap.addEntity), no loot spawning. recalcCharacter and CombatResolver.seedLevel are
   pure computations on the entity under construction; the NPC Container is part of
   construction, not a side effect. Verified no structural bypasses: all
   player/zombie/NPC creation goes through the factory (the only direct new Entity calls
   are fromJSON, the factory itself, and GameMap.convertLegacyItemToECS for items).

   6. Dead code: two methods and an entire subsystem. ❌
   • createFlashlight — zero callers anywhere.
   • assembleFromBlueprint — zero callers, and it can't work: BlueprintRegistry has no
     registrations anywhere in the codebase, so every call throws "not found." The whole
     blueprint system (registry + factory method, ~60 lines across two files) is a
     scaffolded archetype/preset mechanism that was never adopted. Either adopt it (see
     #7) or delete it.

   DRY

   7. The boilerplate has a dead solution sitting next to it. ⚠️
   • The zombie and NPC component blocks are near-identical (8 shared components
     differing only in parameters) — a shared addAIActorComponents(entity, {...}) helper
     would halve both methods.
   • The RpgStats eight-attribute block is written out twice (player with ternaries, NPC
     hardcoded to 20s).
   • The customStats !== undefined ? : default ternary appears ~30 times in createPlayer
     — a small pick(stats, key, fallback) helper would make the precedence rules
     readable.
   • The punchline: assembleFromBlueprint/BlueprintRegistry is the component-preset
     system this file needs — it's just empty. Adopting it for the zombie/NPC archetypes
     would resolve #7 and #6 in one move.

   Code Quality

   8. Comments carry real design intent. ✅
   The skill-seeding rationale, the "NPCs deliberately do NOT run recalc" note, and the
   faction-resolution comment (lines 158-161) are exactly the documentation a factory
   needs. Signature inconsistency: createZombie(x, y, subtype, id) vs. createNPC(x, y,
   factionId, typeId, name, id, iconId) — seven positional params with two nulls at most
   call sites (createNPC(x, y, null, typeId, name, id) in NPCSpawner) is an
   options-object candidate.

   Testability

   9. Partial coverage only. ⚠️
   test/ecs/facades.test.js verifies AIState presence on factory zombie/NPC/Rabbit and
   player crafting progression. Missing: a component-matrix test (one of each type →
   assert required components present: player's 13, zombie's 9, NPC's 10 + RpgStats +
   Container inventory with toll-guard dimensions), a customStats override test (saved
   levels not re-seeded, #2), and an unknown-subtype fallback test (getZombieType →
   basic). The matrix test is cheap and would catch both missing components and
   accidental ones (like the AIState-on-every-entity bloat the Entity.js comment warns
   about).

   Priority recommendations

   1. High — Delete createFlashlight and either adopt or delete assembleFromBlueprint +
      BlueprintRegistry (#6). If adopted, use it to kill the zombie/NPC boilerplate (#7).
   2. Medium — Move the zombie color ladder into ZombieTypes as a color field (#4).
   3. Medium — Add the component-matrix test (#9).
   4. Low — Extract the shared AI-actor component helper and the pick ternary helper
      (#7); convert createNPC to an options object (#8); reconcile or document the dual
      player inventory components (#3).
	  
	     Review 16 · MovementSystem

   Files reviewed: client/src/game/systems/MovementSystem.js (87 lines),
   client/src/game/utils/MovementHelper.js (162 lines)

   Summary

   MovementSystem itself is small and mostly sound: AP is deducted only after a confirmed
   move, validation is delegated to the correct single write point (GameMap.moveEntity),
   and the per-step intent model handles blocked moves gracefully. The findings: no
   AP-sufficiency check at resolution time (it trusts the intent producer), a silent
   non-atomic fallback branch, a known planning-vs-execution cost divergence for
   diagonals, and — the headline — MovementHelper is 162 lines of entirely dead code with
   three latent bugs in it.

   Correctness

   1. AP is consumed only on success — but never validated. ⚠️
   Deduction happens after moved (lines 31, 49-53) — correct ordering, and a blocked move
   costs nothing. However resolve never checks ap >= apCost before moving: it clamps to
   zero (Math.max(0, ap - cost)), so an entity with 0.5 AP and cost 1.0 still moves.
   Today the gate lives in AISystem (currentAP >= moveCost before enqueueing), so the
   invariant holds by producer discipline, not by the system that performs the move. Any
   future intent producer that forgets the check gets free movement. resolve should
   reject unaffordable intents itself.

   2. Validation and occupancy: correctly delegated. ✅
   Walkability, occupancy, edge walls, and diagonal corner rules all flow through
   gameMap.moveEntity (Review 8 verified it's the single write point and does all four
   checks). Position component and map spatial index stay in sync because moveEntity
   drives both.

   3. The fallback branch is a silent desync. ❌
   Lines 25-29: if gameMap.moveEntity isn't a function, resolve teleports the Position
   component directly — no walkability check, no tile-contents update, no map-index
   update. Position and spatial index diverge invisibly. Only mock maps could hit this,
   and it should throw instead of succeeding falsely. This directly violates the
   atomicity the rest of the file works to preserve.

   4. Blocked mid-path: handled by design. ✅
   Intents are single steps (dx, dy). A blocked step: no move, no AP, intent removed
   (line 69), and the next AI cycle re-evaluates from fresh vision — so a zombie whose
   path is blocked mid-route re-paths on the following cycle rather than stalling or
   walking through. Sound.

   5. Dead branch + accidental component creation. ⚠️
   entity.ap !== undefined (line 49) is always true — the facade getter returns 0 for
   component-less entities — so the currentAP fallback (line 51) is unreachable. Worse,
   the ap setter auto-creates an ActionPoints component on anything that lacks one, so
   moving a component-less entity silently bloats it (the save-bloat issue
   Entity.js:177-183 warns about).

   6. Diagonal cost: planning and execution disagree. ⚠️ (known divergence)
   resolve charges a flat movable.apCost per step, diagonal or cardinal.
   Pathfinding.getMovementCost prices diagonals at 1.4. So A* plans routes under a
   1.4-diagonal cost model while execution charges 1.0 — paths chosen as "cheapest"
   aren't, and AP budgets computed by MovementHelper.calculateAPCost don't match what
   resolve deducts. test/balance/apEconomy.js:7 shows the team knows ("mirrors
   MovementSystem's flat 1-AP-per-step AI mover") — it's a documented inconsistency, but
   still an inconsistency two economy models wide.

   7. Player vs. AI: shared write point, divergent pipelines. ℹ️ (architecture question)
   In production the player does not move through MovementSystem — PlayerContext.jsx:347
   calls gameMap.moveEntity directly and deducts AP elsewhere. Zombies/NPCs go
   IntentQueue → MovementSystem.resolve (IntentQueue.js:86). So: GameMap.moveEntity is
   the single write point for all three actor classes ✅, but the AP-accounting and
   validation wrapping differs per class. Notably the test harness does drive the player
   through MovementSystem.resolve (GameHarness.js:145) — the harness tests a player path
   production never uses.

   Architecture

   8. Reasonable hooks, heavy imports. ℹ️
   resolve fires fire-ignition, zombie-move noise (via engine.player), and NPC scent
   drops — legitimate "on move" triggers, though they make a "movement" system depend on
   FireSystem, PlayerHearing, ScentTrail, and the engine singleton (the established
   pattern — Reviews 5, 13, 14). MoveIntent cleanup (line 69) runs on both success and
   failure ✅.

   Performance

   9. Per-move cost is fine. ✅
   One O(1) tile fetch + O(contents) walkability scan inside moveEntity; no allocation in
   resolve beyond the action-queue entry. The 50-cycle AI loop cost was covered in
   Reviews 6-7; nothing new here.

   Code Quality

   10. MovementHelper is entirely dead — and buggy. ❌
   Zero callers in client/src and test/. All five methods are unused, and three carry
   latent bugs for the day someone revives them:
   • validateMovement/getMovementRange pathfind from entity.x/entity.y (render
     coordinates, not logicalX/Y) — wrong tile during animation.
   • getMovementRange: entity.ap || 10 — the falsy trap: an entity with 0 AP gets a
     movement range computed at cost 10.
   • createEntityFilter: Pathfinding.isTileWalkable (Pathfinding.js:402) lets a function
     filter replace the terrain check — this filter only examines contents, so walls
     become walkable.
     Delete the file or fix-and-use it; keeping dead, broken helpers is how they get
     imported by mistake.

   Testability

   11. Thin. ⚠️
   test/harness/harness.test.js:12 covers a valid move and AP spend. assertInvariants
   presumably catches index desync. Missing: blocked-move (no AP deducted, intent
   cleared), diagonal validity/cost, the insufficient-AP-at-resolve case (#1), and
   mid-path blockage re-pathing. Given that the harness drives the player through a path
   production doesn't use (#7), a test that mirrors the actual player path (PlayerContext
   → moveEntity) would close a real coverage blind spot.

   Priority recommendations

   1. High — Delete MovementHelper.js or fix its three bugs and wire it in (#10).
      Dead-and-broken is the worst state for a utility file.
   2. Medium — Add the AP-sufficiency check in resolve (#1); replace the teleport
      fallback with a throw (#3).
   3. Medium — Decide the diagonal cost model in one place: either resolve charges 1.4
      for diagonals, or pathfinding plans flat (#6).
   4. Low — Guard the AP deduction on component presence instead of the always-true
      facade check (#5); add the blocked-move and diagonal tests (#11).
	  
	   Review 17 · VisionSystem

   Files reviewed: client/src/game/systems/VisionSystem.js (243, fully read in Review 6),
   client/src/game/utils/PlayerHearing.js (88), plus the modifier layer in
   GameEngine.recalculateFOV and config/VisionConfig.js

   Summary

   The modifier story splits cleanly in two: the player has a rich, mostly documented
   vision pipeline (hour-of-day curve, rain reduction, flashlight, NVG, scope, perception
   bonus, ground-light illumination); AI entities have none of it — a zombie sees 15
   tiles at midnight in heavy rain while the player sees ~1.2. The hearing system is
   small and thoughtfully designed (frozen per-turn hearing zone, documented
   no-wall-attenuation simplification). The dirty-flag machinery works but is undermined
   by the forced global dirty every turn (necessary, per the Review 6 stale-vision bug).
   There are zero tests for any of it — including the pure, trivially testable
   getSightRangeForHour.

   Correctness

   1. Player modifiers work; smoke doesn't exist. ✅/ℹ️
   Night curve via getSightRangeForHour (VisionConfig.js:14): 19:00→12, 20:00→8, 21:00→4,
   22:00-03:00→1.5, dawn ramp back. Rain: −15%, −20% heavy (intensity > 0.7), correctly
   skipped when the player is indoors or the map is alwaysDark (GameEngine.js:482-490).
   Flashlight raises night range to max(base, 8); NVG grants full day range at night but
   blinds to 0.5 in daylight (a real design touch); scope pushes to 20; perception adds
   +1 per 20 points. No smoke mechanic exists anywhere in the codebase — grep confirms —
   so that part of the review brief is moot.

   2. AI vision ignores every modifier. ⚠️ (design question)
   Zombie/NPC sight is the flat typeDef.sightRange (15–30) at all hours and weather — in
   both AI vision paths (VisionSystem ECS and Entity.canSeePosition). If "zombies hunt by
   smell" is the intent, it's undocumented; if not, night is strictly player-punishing.
   Either way, a peeper's 30-tile sight at midnight against the player's 1.5 deserves a
   design note in VisionConfig.

   3. Seen vs. visible is correctly maintained. ✅
   tile.flags.explored (persistent "seen") is written only from the player's FOV pass
   (GameEngine.js:604-612); playerFovSet (transient "visible") is rebuilt in the same
   pass — one write point for both, consistent with Review 8.

   4. Hearing: correct within its stated model. ✅
   Detects noise outside visual range — that's its purpose — using a per-turn frozen zone
   (computeHearingZone, snapshotted at phase start) so a zombie's path can't
   retroactively become audible; arrival-tile checks are O(1) Map lookups against the
   snapshot. The no-wall-attenuation simplification is explicitly documented (lines
   12-15) as matching emitNoise's existing behavior in the reverse direction. The
   false→true edge guard prevents animation restarts. Chance model (perception + 5·noise
   − 4·distance) is sane and uses the seeded RNG. performance.now() for the reveal
   timestamp is non-deterministic but animation-only — fine.

   Architecture

   5. Three vision pipelines, one modifier layer. ⚠️
   Player FOV lives in GameEngine.recalculateFOV; AI vision is split between VisionSystem
   (impl 2) and Entity.canSeeEntity (impl 1) — the Review 6 duplication — and the
   weather/night modifiers exist only in the player path. Hearing is a deliberately
   separate pass from emitNoise/AudioSystem (the two directions are documented as
   unrelated in the PlayerHearing header — good). Triggering: VisionSystem runs per AI
   cycle but is dirty-gated; player FOV is hash-deduped.

   6. The FOV dedupe hash includes this.turn. Minor.
   optionsHash (GameEngine.js:500) embeds the turn number, so it changes every turn and
   the dedupe only helps within a turn (per-frame during movement — which is what the
   removed console.log comment at 496 was about). Hashing hour + weather instead of turn
   would extend the dedupe across turns where nothing relevant changed.

   Performance

   7. Dirty flags work, with the known caveat. ✅
   Per-entity _visionDirty (set on move) + global _visionDirty forced at turn start — the
   force is the fix for the stationary-zombie stale-vision bug
   (SimulationManager.js:170-177 comment), so "recalculated every entity every turn" is
   currently true by design at turn start, then dirty-gated for the remaining ≤49 cycles.
   The O(R³) per-entity cost was the Review 6 finding; nothing adds to it here.

   8. Night FOV does a full item scan per recalc. ⚠️
   At night, recalculateFOV iterates every item entity on the map (GameEngine.js:530),
   distance²-filters, computes a per-lit-item FOV, then a per-illuminated-tile LOS check.
   With hundreds of ground items this is the most expensive per-frame vision work in the
   game — mitigated by the hash dedupe (#6), but a lit-items-only index (like
   activeScents in Review 8) would be strictly better.

   Code Quality

   9. Modifier documentation is uneven. ⚠️
   VisionConfig exports the constants but the hour table has no per-value rationale. The
   rain/NVG/scope logic is inline in GameEngine with partial comments and bare magic
   numbers (0.5, 20, 25², 20²). PlayerHearing is the counter-example — its header
   documents scope, simplifications, and the snapshot rationale; MAX_NOISE_LEVEL with its
   "loudest action" comment is how magic numbers should be shipped.

   Testability

   10. Nothing. ❌
   No tests for vision (Review 6), no tests for hearing, no tests for the hour curve,
   rain reduction, indoor exemption, NVG day-blindness, explored-flag updates, or
   hearing-through-walls (the last being unimplemented by design — but nothing pins that
   either). getSightRangeForHour and computeHearingZone/markHeardIfInRange are pure or
   near-pure — a table-driven hour test and a hearing-zone boundary test are each under
   20 lines.

   Priority recommendations

   1. High — Table-driven tests for getSightRangeForHour and the rain/indoor/NVG branches
      of the range computation (#1); boundary tests for markHeardIfInRange (#4, #10).
   2. Medium — Decide and document whether AI vision should get night/weather modifiers;
      if not, say so in VisionConfig (#2).
   3. Medium — Index lit ground items instead of scanning all items nightly (#8).
   4. Low — Replace turn with hour in the FOV hash (#6); extract the magic numbers in
      recalculateFOV into VisionConfig (#9).
	  
	   Review 18 · AISystem (Zombie AI)

   Files reviewed: client/src/game/systems/AISystem.js (671 lines),
   client/src/game/systems/AIHelpers.js (102), client/src/game/utils/ScentTrail.js (105)

   Summary

   This is the most battle-scarred file reviewed so far — and it shows in a good way: the
   comments document a series of oscillation bugs (jittering hunters, ping-ponging
   investigators, stuck wanderers) and each fix is deliberate (hold-instead-of-wander,
   anti-backtrack penalty, path fast-forwarding). The decision tree is a clean flat
   priority chain, decision and dispatch are properly separated, and the scent system is
   deterministic and well-indexed. The real issues: two parallel state vocabularies kept
   in sync by hand, no distance/dormancy short-circuit for far-away zombies, a hunting
   branch that re-runs A* every cycle (confirming Review 7's worst case), and no LKP
   expiry — "stop chasing" is arrival-based, not time-based.

   Correctness

   1. Decision tree handles the stimulus hierarchy correctly. ✅
   Priority 1: player in LOS → huntPlayer (refreshes LKP every tick). Priority 2: LKP or
   heard noise → investigate. Priority 3: scent → tryFollowScent (sets LKP to the
   breadcrumb, feeding Priority 2 next tick). Priority 4: wander. LOS vs. heard vs. scent
   are cleanly distinguished, and the transitions terminate: arrival clears memory,
   unreachable-adjacent clears memory, no-path clears memory — each falling through to
   scent/wander. Deaf zombies hold position (wander and scent both bail, LOS-hunt still
   works) — consistent with their scripting.

   2. Dual state vocabularies, manually synchronized. ⚠️
   Every behavior writes two fields: entity.behaviorState (AIState facade:
   'wandering'/'pursuing'/'investigating'/'tracking') and aiBehavior.alertnessState
   ('IDLE'/'HUNTING'/'INVESTIGATING'). The factory attaches both AIBehavior and AIState
   components, and stimulus data is likewise split
   (aiBehavior.lastSeenPlayerCoords/heardNoiseCoords vs. the AIState facade's
   lastSeen/noiseCoords). Entity.setTargetSighted writes both sides, which is the only
   thing keeping them coherent. One missed sync site and the two state machines disagree
   about what the zombie is doing.

   3. Loop safety is genuinely well-engineered — with one timeout gap. ✅/⚠️
   Infinite state loops are close to impossible by construction: holds produce no intent
   (the SimulationManager cycle breaks), the cached path fast-forwards by physical
   position (pushes/teleports force recalc), and every dead-end clears the target. The
   gap: LKP never expires. A zombie that glimpsed the player 40 turns ago still paths to
   the LKP — "stop chasing" happens on arrival, not after N turns. That's a defensible
   design (scent extends the trail further), but it's a design decision that exists
   nowhere except implicitly, and the review's "loses player for N turns" semantics
   simply don't exist to test.

   4. Spitter bypass is contained. ℹ️
   spitAtPlayer rolls hit/damage/sickness inline and pushes a resolved action directly to
   the action queue, using entity.useAP outside the intent pipeline — documented as
   intentional (mirrors NPCAI's performAttack). It correctly counts as cycle activity via
   pushAction.

   Architecture

   5. Decision vs. dispatch: clean. ✅
   AISystem produces intents; IntentQueue/MovementSystem execute them; ctx.enqueue
   abstracts whether intents go to the queue or the component. AIHelpers.js honors its
   own contract ("Pure functions only: no intent emission, no entity mutation") —
   getMeleeReach is the shared adjacency/structure oracle for both hunt and investigate,
   which is why those two branches agree.

   6. Scent ownership is coherent. ✅
   Player drops scent per path tile (PlayerContext.jsx:348), NPCs per step
   (MovementSystem.js:64), zombies deliberately never — matching the "zombies track, they
   don't leave trails" comment. findAttackSlotPath (up to 4 findPath calls per
   invocation) is used only by NPCAISystem — a per-NPC cost to remember for the NPCAI
   review.

   Performance

   7. No dormancy short-circuit. ⚠️
   Every zombie is evaluated every AI cycle: the only gates are hp, components, pending
   intent, and AP > 0.05. A zombie 80 tiles away with no stimulus still runs the vision
   check (cheap — cached vision.visibleEntities.includes, with the full-LOS fallback only
   for component-less zombies), then tryFollowScent (an ~85-tile Manhattan scan at radius
   6), then wander (4-8 tile checks). Individually small; multiplied by N zombies × up to
   50 cycles, it's the constant background hum under the Review 6 worst case. A "no
   stimulus and beyond hearing+scent radius → skip" gate would zero it out.

   8. Pathfinding per zombie per turn (specific question 1).
   Hunting branch: 1 findPath per AI cycle, no cache — up to 50 per turn (currentPath is
   explicitly cleared every hunt tick, line 316). Investigating branch: cached with
   next-step revalidation — typically 0-1 recomputes per turn. Beeline/greedy fallbacks
   do tile checks only, no A*. So the max is 50 pathfinding calls per zombie per turn
   (fully hunting), consistent with the Review 6/7 worst-case math.

   ScentTrail (specific question 2)

   9. Decay is correct and fully deterministic. ✅
   SCENT_INTENSITY = 3 turns, exactly −1 per turn in decayScents (called once per turn
   from GameMap.processTurn), removal at 0, no RNG anywhere — given the same drops, decay
   is perfectly reproducible. The sparse activeScents index keeps cost proportional to
   active trails, persists through save/load (scent/scentSequence in Tile.toJSON, counter
   in GameMap.toJSON), and rebuilds on load (rebuildIndex). The freshest-breadcrumb
   search uses a global sequence counter so "freshest" is unambiguous. One nit:
   findFreshestScent scans the full radius square on every call rather than walking the
   sparse index — fine at radius 6, worth remembering if the radius grows.

   Code Quality

   10. Explicit structure, dual vocabulary. ℹ️
   Named behavior functions with priority comments — about as close to an explicit state
   machine as this codebase gets. The comments are excellent institutional memory (the
   diagonal-adjacency dance, the corridor ping-pong), though their density is also a
   signal of how fragile this area has been. The state-name split in #2 is the main
   readability debt.

   Testability

   11. Behavior is only covered incidentally. ❌
   spitterRanged.test.js and window_combat_redirection.test.js touch zombie behavior;
   nothing tests state transitions (wandering→investigating→hunting→wandering), LKP
   clearing on arrival, scent-follow retargeting, deaf-zombie holding, or
   anti-oscillation (the exact regression class the comments describe). No scent-decay
   determinism test, though ScentTrail is trivially testable: drop, decay N turns, assert
   gone. And since LKP-expiry semantics don't exist (#3), neither does a test for them —
   if the design is arrival-based, a test should pin that.

   Priority recommendations

   1. High — Add the transition test suite: LOS→hunt, lose
      LOS→investigate→arrive→clear→wander, scent retarget, deaf hold (#11). This file's
      comment history proves regressions recur here.
   2. Medium — Unify on one state field (keep alertnessState, derive the other) or make
      one a strict projection of the other (#2).
   3. Medium — Add a dormancy gate: no LKP/noise/scent and player beyond hearing+scent
      radius → skip evaluation (#7).
   4. Medium — Cache the hunting path like the investigate path does (Review 7 rec #1
      applies here directly — line 316's unconditional clear is why) (#8).
   5. Low — Decide whether LKP should expire and pin the decision in a test (#3); walk
      the sparse scent index in findFreshestScent if the radius ever grows (#9).
	  
	  
	  Review 19 · IntentQueue

   Files reviewed: client/src/game/managers/IntentQueue.js (111 lines),
   client/src/game/managers/SequencerAction.js (60 lines)

   Summary

   Two small, focused files. IntentQueue is a correct-by-simplicity FIFO dispatcher whose
   conflict resolution is implicit — there's no reservation system; simultaneous claims
   on one cell are settled by each intent re-validating against live map state at
   resolution time. That works, but it's untested and undocumented. SequencerAction is a
   clean animation-timing wrapper with proper simulation/animation separation. The
   performance concerns are two avoidable O(n²) patterns, both bounded by safeguards.

   Correctness

   1. Dispatch order is deterministic. ✅
   Plain FIFO: push at enqueue, shift at resolve; cascading intents append in resolution
   order (breadth-first). Entity iteration order comes from Map.values() insertion order,
   which is stable per save/load restore sequence. Same inputs → same dispatch order.

   2. Same-cell conflicts: implicit first-come-first-served. ⚠️
   Two zombies intent on the same cell: no claim check anywhere in the queue. The first
   MoveIntent resolves through moveEntity while the tile is empty and succeeds; the
   second resolves moments later, moveEntity re-checks isWalkable, finds the first
   zombie, and rejects — the loser simply wastes its intent and re-paths next cycle
   (Review 18's loop-safety makes this harmless). Correct, but entirely emergent: nothing
   documents "later intents re-validate against state mutated by earlier ones," and no
   test pins it. A reservation/claim model isn't needed at this scale — a comment and a
   test are.

   3. Intent cleanup is split across systems. ⚠️
   MoveIntent is removed by MovementSystem.resolve on both success and failure ✅.
   Intents enqueued through the queue path never touch the entity (ctx.enqueue →
   intentQueue.enqueue, not addComponent), so there's nothing to leak there ✅. But for
   the entity.addComponent fallback path, clearing DamageIntent/DestroyIntent/etc. is
   each resolving system's responsibility — CombatSystem.resolve was not verified in this
   review. If any system forgets, AISystem's "skip entities with unresolved intents" gate
   (AISystem.js:609) freezes that entity for the whole turn. Worth one verification pass.

   4. Safeguards halt everyone, not just the runaway. ℹ️
   maxTotalIntents (2000) and maxDepth (50) both clear() the entire queue on breach — a
   single runaway cascade kills every other entity's pending intents for the tick. That's
   the safe direction (fails closed, prevents hangs), but a depth breach ideally drops
   only the cascade subtree. Acceptable as-is; noted.

   5. Per-intent error isolation. ✅
   try/catch around each processIntent (line 74) — one bad intent can't abort the tick,
   and the error is logged with type and entity. Unknown types warn rather than throw
   (line 108).

   Architecture

   6. Authority over AI intents only — consistently with prior reviews. ℹ️
   All ECS intents (Move/Damage/Destroy/Noise/Explosion) resolve here, but three bypasses
   exist, all previously flagged: player actions go straight to moveEntity (Review 16),
   the spitter pushes a resolved action directly to the action queue (Review 18,
   documented as intentional), and the test harness calls MovementSystem.resolve
   directly. So IntentQueue is the single authority for the intent pipeline, not for
   movement/combat generally. The dispatch switch is explicit, flat, and trivially
   extensible — the intent→system mapping is exactly what the review asks for.

   7. SequencerAction: textbook separation. ✅
   Animation-only concerns: duration, impact point, progress (mutated directly on the
   entity, bypassing React — documented). Simulation concerns: already resolved before
   the action exists; onImpact just applies the pre-computed outcome mid-animation. The
   promise contract for TurnManager's sequential await is clean, and edge cases hold: a
   huge dt (tab-switch) fires impact then completes in one tick; zero duration completes
   immediately with progress 1. Nothing here touches game state except animationProgress.

   Performance

   8. queue.shift() makes resolve O(n²). ⚠️
   Every shift() moves all remaining elements. Bounded by maxTotalIntents (2000 → ~2M
   element moves worst case), and realistic per-cycle queues are small — but the fix (an
   index pointer instead of shifting) is two lines and the same pattern was flagged in
   Reviews 7 and 8.

   9. O(intents × entities) entity lookup. ⚠️
   entityList.find(e => e.id === intent.entityId) runs per intent (line 81). Worst case
   (200 zombies, ~200 intents per cycle, 50 cycles): ~2M id comparisons per turn — on top
   of the Review 6/7 costs. Building an id → entity Map once per resolve() call makes it
   O(intents + entities). This is the cheapest real perf win in this file.

   Code Quality

   10. The mapping is explicit and documented where it counts. ✅
   The five-case switch with a default warning is the right shape; depth tracking via
   parent envelopes is a tidy way to bound cascades; SequencerAction's header states its
   heartbeat contract plainly. Minor: maxDepth/maxTotalIntents are constructor fields
   with no comment explaining the chosen values.

   Testability

   11. Used in tests, not tested. ❌
   death_and_explosions.test.js drives real IntentQueues through explosion cascades, and
   the harness uses one — but nothing tests the queue itself: no same-cell conflict test
   (#2), no FIFO-order determinism test, no depth-limit/total-limit test (#4), no
   unknown-type warning test. The conflict case is the important one: two zombies, one
   target cell, assert exactly one moves.

   Priority recommendations

   1. High — Add the same-cell conflict test (two MoveIntents, one cell, first wins) and
      a cascade depth-limit test (#2, #4, #11).
   2. Medium — Replace shift() with an index pointer (#8); build the id→entity Map once
      per resolve (#9).
   3. Medium — Verify every resolving system clears its intent components on the
      addComponent fallback path (#3) — one missed cleanup freezes an entity for a turn.
   4. Low — Document the implicit re-validation conflict model in the resolve header (#2)
      and the rationale for the two safeguard constants (#10).
	  
	   Review 20 · CombatSystem & CombatResolver

   Files reviewed: client/src/game/systems/CombatSystem.js (205 lines),
   client/src/game/systems/CombatResolver.js (434 lines), plus the damage-timing contract
   in TurnManager and death handling in SimulationManager

   Summary

   CombatResolver is the best-documented file in this review series — every formula
   carries its design rationale (why weapon accuracy was removed, why crit is
   margin-based, why infection is universal). The architecture is a deliberate but
   fragile three-path damage model: structures take damage simulation-first, entity
   combat is playback-first through TurnManager, and a direct path exists for tests —
   cross-referenced with "do NOT re-apply" comments in both files. Real findings: player
   hit chance is unclamped (NPC's is clamped), no faction check at the resolution layer
   (friendly fire is prevented only by intent producers), death is a separate sweep with
   no double-kill test, and one unguarded falloff stat that can produce NaN.

   Correctness

   1. Hit/miss formulas are correct as designed — but player chances are unclamped. ⚠️
   rollPlayerMelee: 0.6 + (skillLvl − drunkenness)·0.01 + attrBonus (line 231) with no
   bounds — high skill pushes hitChance past 1.0 (harmless for hitting, but the crit band
   hitChance/5 then exceeds 0.20, quietly inflating crit), and high drunkenness can drive
   it negative (safe: always misses). rollPlayerRanged likewise unclamped. rollNpc alone
   clamps to [0.2, 0.95] (line 350). Three attacker types, two clamping policies — either
   the clamp is correct (apply everywhere) or it's not (document why players are exempt).

   2. Armor: correct order, applied in all three paths. ✅
   applyArmorAbsorption drains the absorption pool 1:1 before HP, spills the remainder,
   breaks (deletes) the armor at zero, and fires ARMOR_ABSORBED. I verified it's called
   in all three damage paths: CombatSystem's direct path (line 161), TurnManager's
   playback ATTACK case (line 316), and the GameHarness mirror. Fire/starvation/disease
   deliberately bypass it (documented, line 134).

   3. Friendly fire: possible at the resolution layer. ⚠️
   CombatSystem.resolve has no faction or hostility check — it resolves whatever
   DamageIntent it's handed, and resolveDefense even handles zombie defenders (so
   zombie-vs-zombie fully works). Today only intent producers (AISystem hostility gates)
   prevent friendly fire. That's "intentional by omission": the faction model (Review 13)
   stops at the pipeline's edge instead of being enforced at its choke point. One buggy
   or scripted mis-targeted intent hits anything.

   4. All weapon types are handled. ✅
   Melee (drunkenness brawling trade-off, stun rod), ranged with per-attachment falloff
   models (sling/shotgun/scope/laser), NPC melee+ranged, zombie melee + spitter ranged
   (Review 18), turret, explosives via ExplosionSystem. rollTurret uses a separate crit
   roll rather than the margin model — explicitly documented as intentional.

   5. Unguarded falloff in the scope branch. ⚠️ (latent)
   rollPlayerRanged line 282: the hasScope branch reads stats.accuracyFalloff with no
   fallback (sibling branches use || 0.2 / || 0.1). If a scoped weapon's rangedStats
   omits it, hitChance becomes NaN beyond 15 tiles and every shot misses. Same for
   stats.minAccuracy in that branch.

   6. Structure bulk-math is sound. ✅
   The hits-to-destroy/AP-available bulk calculation (lines 44-54) with simulation-first
   takeDamage(total, silent=true) is clever and correctly marked so TurnManager won't
   re-apply. AP is charged only for hits actually delivered.

   Architecture

   7. Thin-ish dispatcher + mostly-pure resolver. ✅/⚠️
   CombatResolver is pure roll math over explicit parameters — except it imports the
   engine singleton for the armor-break inventory fallback (line 157) and GameEvents.
   CombatSystem is dispatch + structure bulk-math + the three timing models. The split is
   documented in TurnManager's header table (which actions are sim-first vs
   playback-first) — this is the rare cross-file invariant that's actually written down.
   It remains fragile: the invariant lives in comments across three files, and a new
   damage path that misses the memo double-applies.

   8. Death is a sweep, not a system (answers specific question 1).
   There is no single apply-damage-and-handle-death function. Damage is applied at three
   sites (CombatSystem structure path, TurnManager ATTACK playback, CombatSystem
   direct/test path), and death is handled by SimulationManager.checkAndProcessDeaths at
   checkpoints — a periodic scan, not a DeathSystem invoked by the killer. Upside:
   playback-timed deaths animate correctly. Downside: an entity is dead-but-present
   between the killing blow and the next sweep, and everything that touches it in that
   window must tolerate hp <= 0 (AISystem's gate does).

   9. Double-kill edge case (specific question 2): probably safe, untested. ❌
   Two killing intents on one entity in a turn: the second finds the target still in the
   entity list (pre-sweep), rolls, and takeDamage clamps at hp 0 with isDead already set
   — a corpse absorbs the hit harmlessly. If the first death already swept the entity,
   entities.find fails and the intent is skipped. Both paths look safe by inspection;
   neither is tested.

   Performance

   10. O(1) per attack, one O(E) scan. ✅/ℹ️
   Roll math is constant-time. The only scan is entities.find(e => e.id === targetId) per
   DamageIntent (CombatSystem.js:14) — same shape as the IntentQueue lookup from Review
   19; a shared id→entity map would fix both at once.

   Code Quality

   11. Documentation sets the standard. ✅
   Named constants with rationale everywhere it matters (ATTR_MOD_STEP "provisional,
   retune", BASE_MELEE_HIT_CHANCE with the removal rationale, ZOMBIE_INFECTION_CHANCE
   explaining universality and its one re-use site). Remaining magic: zombie's flat 0.50
   (inline-commented), the 1.5 crit multiplier repeated four times, skillLvl · 0.01
   repeated five times — candidates for two shared constants.

   Testability

   12. Death is tested; combat math is not. ❌
   death_and_explosions.test.js covers zombie/NPC/rabbit death drops and explosion
   routing. The GameHarness mirrors the roll→armor pipeline. Missing: seeded-RNG unit
   tests for each roll function (hit/miss/crit bands — including the unclamped overflow
   in #1), armor drain-and-break, friendly-fire behavior (#3), the double-kill edge case
   (#9), and the scope-falloff NaN case (#5). The rolls are pure functions of parameters
   + gameRandom — the most testable math in the codebase after LineOfSight.

   Priority recommendations

   1. High — Add seeded unit tests for all five roll functions: bands, crit margins,
      clamping behavior (#1, #12). This pins #1, #4, and #5 simultaneously.
   2. High — Decide and enforce one clamping policy for hitChance across
      player/NPC/turret (#1).
   3. Medium — Add a faction/hostility check (or an explicit documented bypass) in
      CombatSystem.resolve (#3); add the double-kill test (#9).
   4. Medium — Guard accuracyFalloff/minAccuracy in the scope branch (#5).
   5. Low — Hoist the 1.5 crit multiplier and 0.01 skill step to named constants (#11);
      pass an id→entity map into resolve instead of entities.find (#10).
	  
	     Review 21 · DestructionSystem

   File reviewed: client/src/game/systems/DestructionSystem.js (106 lines)

   Summary

   A compact resolver that does one thing: remove an entity, drop its loot, notify the
   world. The design boundaries are correctly drawn — doors/windows/garage doors are
   deliberately excluded from DestroyIntent (their break-state machines handle them,
   which is what redirects zombies), and terrain isn't touched here because walls are
   terrain, not entities. The findings are small: a null-target path that emits a DEATH
   visual at (0,0), a partial-drop edge case in the NPC loot fallback, and two O(E) scans
   per destruction.

   Correctness

   1. Tile/terrain updates are correctly out of scope. ✅
   Nothing here converts "wall → rubble," and that's right: walls are terrain (handled by
   ExplosionSystem's wall destruction, which sets terrain directly), while DestroyIntent
   targets entities. The door/window redirect question is likewise correctly out of scope
   — CombatSystem.js:81 only enqueues DestroyIntent for broken structures that are not
   door/window/garage_door; those remain on their tiles as broken entities, and zombie
   redirection flows through their state machines plus dirtyVision (Review 14) and path
   re-validation (Review 18). This system additionally sets gameMap._visionDirty = true
   on every removal (line 70) ✅.

   2. Null-target path leaks a spurious DEATH action. ⚠️
   If the target is already gone (duplicate DestroyIntent, or killed earlier in the
   cascade), x/y stay 0 and the code still pushes a DEATH visual action at (0,0) with
   entityType: undefined (lines 93-103). The NoiseEvent is guarded by && target (line 83)
   but the action push isn't. Top-left corner of the map gets a phantom death animation.
   One-line fix: early-return when !target.

   3. NPC loot fallback has a partial-drop hole. ⚠️
   The double-drop guard (line 53) checks whether any NPC item is already on the tile —
   npcItems.some(...) — and if so, drops nothing. die() emits npcDied with the full
   inventory, so normally all items arrive together; but if the engine listener ever
   drops a subset (or at a different tile), the fallback suppresses the rest. The guard
   should be per-item, not per-inventory. Also note target.inventory.clear() (line 57)
   runs even when the drop was suppressed — the suppressed items are lost, not retained.

   4. Ordering and idempotence are otherwise right. ✅
   die() before removeEntity (drops computed while the entity still has state), zombie
   targeting references cleared (lines 74-80 — only currentTarget; coordinate-based LKPs
   don't dangle by design), keylocked-style double-destroy is harmless apart from #2.
   dropZombieDeathLoot tolerates a missing engine.lootGenerator (test environments) and
   still drops the corpse.

   Architecture

   5. Events fire — from GameMap, not from here. ✅/ℹ️
   No DESTROYED event exists, but none is needed: gameMap.removeEntity fires
   ENTITY_REMOVED and ZOMBIE_DIED (GameMap.js:617-625), which is the documented
   decoupling channel, and the NoiseEvent cascade goes through the intent queue ✅. The
   direct dropZombieDeathLoot import is a function call rather than an event — acceptable
   for a pure drop helper, consistent with the codebase's style. The engine singleton
   import (line 2) is the usual pattern, used here for lootGenerator.

   Performance

   6. Two O(E) scans per destruction. ⚠️
   entities.find for the target (line 23 — third review in a row with this pattern; the
   shared id→entity map fixes all three) and entities.filter(e => e.type === ZOMBIE)
   (line 74) — the latter materializes every zombie on the map per destruction to clear
   at most a few currentTarget refs; gameMap.getEntitiesByType('zombie') is O(matches)
   and already exists. Everything else is O(1).

   Testability

   7. Covered — this system's tests already exist. ✅
   death_and_explosions.test.js verifies zombie death (removed, targeting cleared, loot
   on tile), NPC death (inventory dropped), rabbit carcass, and explosion→destruction
   routing — that is this system's suite. The window/door redirect behavior the review
   asks about lives in window_combat_redirection.test.js ✅ (correctly testing the
   door/window state machines, since DestructionSystem never touches them). Missing: the
   null-target no-op (#2) and the partial NPC drop (#3).

   Priority recommendations

   1. Medium — Early-return on !target before the DEATH action push (#2).
   2. Medium — Make the NPC drop guard per-item, and only clear the inventory for items
      actually dropped (#3).
   3. Low — Use getEntitiesByType('zombie') instead of filtering all entities (#6); add
      the two tests from #7.
	  
	   Review 22 · ExplosionSystem

   Files reviewed: client/src/game/systems/ExplosionSystem.js (300 lines),
   client/src/game/utils/ProjectileManager.js (58 lines)

   Summary

   ExplosionSystem is a thorough effects resolver — noise, sound, tile flashes,
   ground-item destruction, entity damage with distance tiers, door/window breaching,
   wall demolition, fire ignition — but it has two real correctness gaps: no wall
   occlusion (blast damage passes through intact walls to entities in other rooms) and no
   chain reactions (fuel cans and grenades on the ground are vaporized, not detonated).
   It also routes door/window destruction through DestroyIntent — which removes those
   entities — contradicting the melee-breach convention that leaves broken entities on
   the tile, and creating a player-passability exploit. ProjectileManager is a 58-line
   window-breaking preprocessor whose name oversells it.

   Correctness

   1. Damage falloff exists for grenades; Molotov is flat. ✅/⚠️
   Grenade tiers: <0.5 tiles → 20-30, <1.5 → 15-20, else 10-15 (lines 131-137). But note
   these are hardcoded — the intent's own minDamage/maxDamage fields are only read for
   incendiary blasts (line 124). A grenade variant with different stats is inexpressible
   without editing the tier table.

   2. No wall occlusion. ❌ (the big one)
   Entity damage is a pure Euclidean distance check (lines 105-119) — no LOS or occlusion
   test from blast center to entity. A grenade outside a building damages every zombie
   inside it. The file itself demolishes walls only within 1.45 tiles, so a blast knows
   walls stop it at melee range but damages through them at range 2+. Either an occlusion
   check (blast LOS per affected entity) or an explicit "explosions ignore cover" design
   note is needed; right now it's neither.

   3. No chain explosions — ordnance vaporizes. ❌
   Ground items within the blast are deleted wholesale (setItemsOnTile(tx, ty, []), line
   91): fuel cans, spare grenades, generators, the fuel cover — all gone with no
   detonation, no fire, no secondary blast. So "gas can near a grenade" produces a
   disappearing gas can. If chains are deliberately out of scope, fuel items deserve a
   comment and maybe a fire ignition instead of silent deletion; if not, this is missing
   physics with a ready-made cascade channel (ExplosionIntent is already chainable via
   the intent queue's depth tracking).

   4. Explosion-breached doors/windows vanish — two behavior bugs. ❌
   • Lines 186/222 enqueue DestroyIntent for doors and windows, so DestructionSystem
     removes the entity. Melee-breached doors/windows stay on the tile as broken entities
     (Review 21 documented the deliberate exclusion). Two consequences: (a) inconsistency
     — the renderer and applyToGameMap conventions expect broken-structure entities; (b)
     an exploit: a broken window entity always blocks player movement
     (Window._updateBlockingState — Review 14), but an explosion-removed window leaves
     plain floor, so players can walk through explosion-made breaches but not
     zombie-smashed ones.
   • GarageDoor is filtered out entirely (only EntityType.DOOR/WINDOW at lines 177/213) —
     garage doors are explosion-immune.

   5. Inconsistent death routing. ⚠️
   Entity deaths call DestructionSystem.resolve directly (lines 164-171), while
   door/window deaths are enqueued as DestroyIntents. Same system, two routing styles —
   the direct call also means entity deaths resolve before door breaches regardless of
   blast geometry, and cascade-depth accounting differs between the two paths.

   6. Synchronous resolution; wall breach is correct. ✅
   Resolution is synchronous inside the intent queue (correct for the simulation phase;
   visuals go to the action queue). The wall-breach section (walls → floor, edge walls
   cleared including inward-facing neighbor edges, vision dirtied) is thorough. Stale
   gameMap.buildings footprints after a breach are a minor metadata gap (room/shelter
   data isn't recomputed).

   Architecture

   7. ProjectileManager: honest internals, overselling name. ℹ️
   It traces the Bresenham path and breaks closed windows along it (with WINDOW_SMASH
   event and noise) — that's all. It does not manage projectile travel as an animated
   process and has no handoff to ExplosionSystem (grenades presumably reach
   ExplosionSystem via TurnManager/CombatContext directly). It skips the shooter's own
   tile correctly and relies on the caller's LOS check for wall blocking (there's no wall
   check in the trace — a caller that fires without LOS validation shoots through walls).
   The door comment ("bullets pass through doors… expand later") and the "approved plan"
   reference mark it as half-finished.

   Performance

   8. O(r²) four times, plus O(E) three times. ⚠️
   The blast square is scanned in four separate loops (flash, item destruction, entity
   damage, wall breach) — foldable into one. Entity damage iterates all entities (O(E)),
   then two more entities.filter passes for doors and windows (the by-type index from
   Review 8 would make these O(matches)). Squared-distance comparisons would drop the
   per-entity sqrt. No blast-radius cap exists, but radii come from item stats (2-3
   today) and chains are impossible (#3), so cascade runaway isn't currently reachable —
   the intent queue's depth cap covers the future chain case.

   Testability

   9. One happy-path test. ❌
   death_and_explosions.test.js covers explosion → rabbit death routed through
   DestructionSystem. Missing: falloff tier boundaries (0.4/0.6/1.6 tiles), behind-wall
   protection (would currently fail, pinning #2), chain explosion (would pin #3's
   absence), door/window removal vs. melee-breach consistency (#4), garage-door immunity,
   ground-item destruction, and wall-breach edge clearing. The system is a pure static
   resolver over (intent, entities, map) — fully harness-testable.

   Priority recommendations

   1. High — Decide the occlusion rule: add blast-LOS per affected entity, or document
      "explosions ignore cover" and test that (#2). Add the falloff-boundary and
      behind-wall tests (#9).
   2. High — Align explosion breach with melee breach: leave broken door/window entities
      on the tile instead of enqueuing DestroyIntent (#4) — this also closes the
      player-passability exploit. Include GarageDoor.
   3. Medium — Decide chain reactions: detonate fuel/explosive ground items via enqueued
      ExplosionIntents (depth-capped), or ignite instead of deleting (#3).
   4. Medium — Use the grenade intent's minDamage/maxDamage for the tier table (#1);
      route all deaths one way (#5).
   5. Low — Fold the four blast-square scans into one (#8); rename ProjectileManager to
      match what it does, or finish the door/collision handling it promises (#7).
	  
	  
   Review 23 · FireSystem

   File reviewed: client/src/game/systems/FireSystem.js (67 lines), plus
   GameMap.processTileFires, call sites in
   SimulationManager/MovementSystem/ExplosionSystem, and test/systems/fire.test.js

   Summary

   A small, well-bounded system with clean indexing — and one headline fact the review
   brief didn't expect: fire does not spread. There is no adjacency propagation anywhere
   in the codebase; a Molotov ignites its blast tiles at explosion time, each burns for a
   fixed 2 turns, and everything extinguishes. So "correct spread probability" and
   "infinite spread" are moot — but the feature the questions assume exists is absent,
   and the harness already knows it ("Molotov is not modelled (needs an igniter + fire
   propagation)", GameHarness.js:346). What does exist is correct, indexed, and decently
   tested.

   Correctness

   1. No fire spread — by omission, not by cap. ❌ (feature gap)
   Nowhere does a burning tile ignite its neighbors. Fire sources: Molotov blast tiles
   (ExplosionSystem.js:73) and entity ignition. Burnout is guaranteed: fireTurns (default
   2) decrements once per turn in GameMap.processTileFires and self-cleans from the
   sparse index at zero. So the answer to "can it spread infinitely" is "it can't spread
   at all" — safe, but a design gap for a game with molotovs. Also unhandled: rain
   doesn't extinguish fire, and doors/windows/furniture have no Burnable component —
   wooden structures are fireproof by omission.

   2. Per-turn fire damage is correct. ✅
   processEntityFires burns every entity with Burnable + Health and fireTurns > 0:
   decrement, then 2-5 damage reduced by fireResistance with a floor of 1 (firefighters
   take 1-3 instead of 2-5 — resistance works). The damage source {id: 'fire', type:
   'hazard'} correctly bypasses armor (per Review 20's documented design).
   checkTileIgnition sets entities alight stepping onto burning tiles with immediate
   damage — called from MovementSystem on every successful move, so you can't walk
   through fire unscathed. Entities standing still on an ignited tile are covered because
   the Molotov ignites entities directly.

   3. State ownership is clean and serialized. ✅
   Tile fire lives on tile.fireTurns (persisted in Tile.toJSON), indexed sparsely in
   gameMap.activeFires (persisted in GameMap.toJSON), with FireSystem.ignite as the
   single registrar — the header comment documents exactly this split. Entity fire lives
   in the Burnable component. Two states, two owners, no overlap. The dead-entity ignite
   guard (line 43) and the pre-ECS fallback (line 61) are sensible.

   Architecture

   4. Right shape, split across two homes. ℹ️
   Ticking is deliberately split: tile fires tick in GameMap.processTileFires (because it
   owns the sparse index), entity fires tick in FireSystem.processEntityFires — both
   driven once per turn from SimulationManager.js:46-47. The cross-reference comment at
   the top of FireSystem keeps the split honest. This is the same "system + map-owned
   index" pattern that worked in Review 8.

   Performance

   5. Tile side is sparse; entity side is a full scan. ⚠️
   processTileFires is O(active fires) ✅. processEntityFires is O(all entities) every
   turn even when nothing is burning (line 9 — every entity gets two getComponent calls).
   Hundreds of entities × every turn for a usually-empty result set. An entity-on-fire
   index (or early exit when no entity has ever been ignited this game) would zero it; at
   current entity counts it's minor but unbounded.

   Testability

   6. The existing suite is good for what exists. ✅/⚠️
   fire.test.js covers: Burnable attachment (player/zombie-firefighter/rabbit), tile and
   entity ignition, processEntityFires decrement + damage, and checkTileIgnition — four
   solid tests. Missing: burnout to zero (processTileFires self-cleaning), the
   dead-entity ignite guard, fire-resistance damage magnitude, fire state serialization
   round-trip, and — if spread is ever implemented — spread probability, fireproof-tile
   exclusion, and rain extinguishing (all currently untestable because the features don't
   exist, #1).

   Priority recommendations

   1. Medium — Decide whether fire spread is in scope. If yes: per-turn, per-burning-tile
      adjacency roll with terrain flammability (grass/wood yes, road/stone no), rain
      suppression, and structure ignition — all indexed through activeFires, and all
      testable with the seeded RNG. If no: document "fire does not spread" in
      FireSystem's header so the next reviewer doesn't hunt for it (#1).
   2. Low — Skip processEntityFires when no entity is burning (an on-fire set mirroring
      activeFires) (#5).
   3. Low — Add the burnout/serialization tests from #6.
   
    Review 24 · NPCAISystem

   File reviewed: client/src/game/systems/NPCAISystem.js (880 lines), plus the demand
   flow through SimulationManager, TurnManager, and GameContext

   Summary

   The "legacy imperative wrapped into the intent pipeline" migration is done properly:
   the header documents the porting contract, movement goes through MoveIntent,
   attack/structure resolution uses the documented sim-first/playback-first conventions,
   per-NPC cycle caps prevent the maxAP-20 balance regression, and the priority list
   mirrors the legacy loop. The demand pause/resume is well-engineered — per-turn freeze
   flag, queue-scan trigger, try/finally resume — though it has a dead duplicate trigger
   mechanism (the NPC_DEMAND_TRIGGERED event is listened to but never emitted). The
   performance reality is the Review 6 cross-product made concrete: evaluateZombieThreats
    runs a full LOS check per NPC×zombie pair per cycle.

   Correctness

   1. Demand pause/resume: correct, and can't deadlock. ✅
   Flow: hostilePlayer pushes an uncounted DEMAND action and sets
   simContext.demandPending → the NPC loop breaks mid-iteration and process early-returns
   (line 52) → SimulationManager ends the NPC phase (line 264) → GameContext scans the
   returned actionQueue for the DEMAND (line 667) → dialog opens →
   handleNpcDemandResponse resolves surrender (extortion) or refusal (hostile +
   executeNPCFollowUp retaliation) → finally restores PLAYER_TURN. The freeze flag lives
   in a per-turn context object, so it can't leak across turns; the resume has
   try/finally; a dialog dismissed without choice just means the NPC re-demands next
   turn. No stuck-paused path found.

   2. NPC_DEMAND_TRIGGERED is a dead event — duplicate trigger mechanism. ⚠️
   The constant (GameEvents.js:43) is listened for in GameContext.jsx:1686, but nothing
   emits it (grep-verified). The live trigger is the actionQueue scan. This is the
   reverse of Review 3's dead-event finding (emitted, no listeners) and should be
   resolved the same way: delete the dead listener + constant, or emit it from the scan
   and delete the duplicate path.

   3. target.logicalX || target.x — falsy-zero bug. ⚠️
   npcAttack line 807: an entity at coordinate 0 falls back to its render coordinate.
   Line 830 in the same function correctly uses ??. Map-edge coordinates are usually
   fence, but turret/defense positions could legitimately sit there — one-character fix.

   4. simulatedHp drift is bounded but unmanaged. ℹ️
   Pending-death simulation (npcAttack line 824) lets later decisions this turn see dying
   zombies — good. It's cleared in executeNPCFollowUp but never explicitly reset after a
   normal turn; since zombies don't heal, simulatedHp ≤ hp always holds and playback
   damage closes the gap, so drift is bounded. Worth a comment or a turn-start sweep.

   5. Trading/faction decisions are correctly out of scope. ✅
   No trading logic here — TradingSystem/EarbucksShopSystem own that, and faction
   decisions route through isHostileTo/FactionRegistry. The one misplacement:
   extortPlayer (the surrender consequence — stripping the player's inventory) lives in
   GameContext, a React context, not a system. That's engine logic on the UI side of the
   sacred line.

   Architecture

   6. Six distinct behaviors in one file (specific question 1).
   (1) attack-on-sight hunter, (2) threat evaluator with 3-turn memory, (3)
   repulsion-vector flee-er, (4) last-resort combatant, (5) demand-then-fight
   extortionist, (6) noise investigator with blacklist, (7) south-exit escape traveler.
   Shopkeeper/gatekeeper aren't behaviors here — they're excluded by maxAP: 0 (the AP
   gate at line 75) or aiDisabled. At 880 lines with clean internal boundaries, it's a
   moderate decomposition candidate: ThreatEvaluation, CombatBehavior, DemandBehavior,
   TravelBehavior share only the ctx plumbing. Not urgent — the priorities are flat and
   readable — but it will hit 1,500 lines the day companions arrive.

   7. Intent-queue bypasses: yes, all documented (specific question 2).
   Movement goes through MoveIntent; everything else resolves in place: npcAttack rolls
   and pushes playback-first ATTACK directly (mutating AP, simulatedHp, noise),
   interactWithStructure calls structure.open()/takeDamage(20)/break() directly on
   door/window entities mid-simulation, and helpers deduct AP via useAP. The header
   documents this as the spitter precedent — sim-first for structures, playback-first for
   attacks. It honors the AGENTS.md model ("legacy imperative feeding the intent
   pipeline"), but the structure interactions are the rawest bypass: direct entity
   mutation with a cosmetic action queued after.

   Performance

   8. NPC×zombie×LOS: the cross-product in code. ⚠️ (the big one)
   evaluateZombieThreats (line 226): for each NPC, each zombie within sightRange gets
   canSeeEntity — a full Bresenham walk — per cycle (up to 20 NPC cycles/turn). Add:
   memory-threat LOS re-checks (line 242), travelSouth's per-threat canSeePosition (line
   655), lastResortCombat's find(canSeeEntity) (line 410), and findAttackSlotPath's up to
   4 findPath calls per hostile decision (Review 18). NPC counts are low (~1-5 survivors
   + guards), so it's N×Z×LOS×20 rather than the zombie loop's Z×50 — but a survivor in a
   100-zombie horde turn pays 2,000 LOS walks per turn. The cached Vision component is
   checked for the player (canSeePlayer) but not reused for zombie visibility.

   Code Quality

   9. Porting discipline is excellent. ✅
   Every method cites its legacy origin ("Port of NPCAI.attemptFleeFrom"), the AP-economy
   look-ahead (can't-finish-traversal check, lines 362-369), the anti-oscillation
   visited-tile skip, the cycle cap rationale, and the muzzle-flash presentation notes
   all show a migration done with care. npcAttack's data-shape comment (lines 855-858)
   explains why the fields exist for TurnManager/AudioContext — cross-file contract
   documentation done right.

   Testability

   10. Behavior split is tested; the dialog flow is not. ⚠️
   npcAttackOnSight.test.js pins the key fork: attack-on-sight NPCs attack immediately
   (hasDemanded stays false) while ordinary hostiles demand first; faction tests pin the
   extort disposition. npcLoadout.test.js covers loadout-driven weapon choice. Missing:
   the demandPending freeze (NPC phase stops, other NPCs don't act), the
   dialog→refuse→executeNPCFollowUp retaliation path, and the surrender/extortion path —
   the exact pause/resume machinery from finding #1, which is currently covered only by
   manual play.

   Priority recommendations

   1. High — Delete the dead NPC_DEMAND_TRIGGERED listener + constant, or emit it from
      the scan site and remove the duplicate (#2).
   2. Medium — Reuse cached Vision data (or a per-cycle LOS memo) in
      evaluateZombieThreats instead of per-pair canSeeEntity (#8).
   3. Medium — Add the demand-flow tests: phase freeze, refusal retaliation, surrender
      (#10).
   4. Low — Fix || → ?? at line 807 (#3); move extortPlayer's inventory-stripping into a
      system the UI calls (#5); reset or document simulatedHp per turn (#4).
	  
	    Review 25 · AI Targeting & Faction Registry

   Files reviewed: client/src/game/ai/AITargeting.js (69 lines),
   client/src/game/ai/FactionRegistry.js (275 lines), plus
   test/ai/factionRegistry.test.js and callers

   Summary

   These two files represent the codebase at its best: FactionRegistry is a declarative,
   directional, data-driven stance table with a well-designed delta-persistence model and
   a genuinely comprehensive test file; AITargeting is a clean 69-line filter/sort
   pipeline. The findings are modest: AITargeting's "shared by all AI" claim is
   aspirational (only turrets actually use it — zombies and NPCs have their own inline
   targeting), two small data-validation gaps, and an undocumented stance choice (zombies
   are neutral to wildlife).

   Correctness

   1. Faction lookup: deterministic, safe on unknowns. ✅
   stance() is a pure table read: same-faction → ALLY, unlisted pair → NEUTRAL, null →
   NEUTRAL. An unregistered faction triggers a dev-only warning (warnUnknown, correctly
   gated behind import.meta.env.DEV with a Node fallback) and falls back to NEUTRAL —
   fail-peaceful, never a crash, never accidental hostility. Directionality is real and
   tested (setStance('a','b') doesn't imply b→a), and the turret case that motivated it
   is documented in the header.

   2. Player disposition collapses correctly. ✅
   The three-way neutral/extort/attackOnSight column maps to HOSTILE/NEUTRAL for
   targeting while preserving behavior mode — the design that lets bandits demand-first
   and zombies hunt on sight share one hostility check. getPlayerDisposition's fallback
   (a raw HOSTILE in the player column → EXTORT) is a sensible migration shim.

   3. Targeting prioritization is faction-correct but only used by turrets. ⚠️
   acquireTargets filters dead entities, self, and non-hostiles (via Entity.isHostileTo,
   which correctly layers per-entity overrides over the table), then range-gates and
   sorts nearest-first — deterministic (stable sort preserves candidate order on ties).
   The problem is adoption: the header says "shared by all AI (zombies, NPCs, turrets),"
   but only TurretAI calls it. Zombies use AISystem's inline playerInLoS && isHostileTo
   check, NPCs use evaluateZombieThreats' inline logic. So "who may I attack" is
   centralized for exactly one of three AI families — the Reviews 18/24 paths
   re-implement pieces of it (including their own LOS calls, per the Review 6/24 perf
   findings).

   4. Undocumented stance: zombies ignore wildlife. ⚠️
   BUILTIN_STANCES.zombies lists no wildlife entry → zombies are NEUTRAL to rabbits. The
   turret neutrality is commented as intentional; wildlife isn't. If "zombies don't hunt
   rabbits" is a design choice, it deserves the same one-line comment the turret case got
   — especially since rabbits bolt from the player, creating the odd scene of a rabbit
   fleeing through an indifferent horde.

   5. Two small validation gaps. Minor.
   (a) toStance only normalizes dispositions in the player column — an authored map that
   puts 'extort' in a non-player column gets stance() returning 'extort' verbatim, which
   isHostile reads as false (silent, wrong). (b) loadDefinitions merges authored stances
   with no un-load — travel from a map with authored factions to one without and the
   first map's stances persist. Probably harmless (definitions, not runtime state), but
   undocumented.

   Architecture

   6. Registry is data + semantics; targeting lives elsewhere — correct split. ✅
   FactionRegistry contains no LOS, no movement, no engagement decisions — just the
   table, disposition semantics, and the delta-persistence layer (builtins baseline →
   authored merge → runtime deltas, serialized separately and re-applied in load order).
   That three-layer model is the right answer to "authored maps + runtime escalation +
   saves," and it's tested end-to-end. Per-entity overrides correctly live on Entity (not
   here), as the header states.

   7. Module-level mutable state, responsibly managed. ℹ️
   The registry is a module singleton (let factions/stances/deltaKeys) with reset() for a
   clean baseline — tests use beforeEach(reset) properly. Same singleton shape as the
   rest of the engine; acceptable here because the state genuinely is game-global.

   Code Quality

   8. Declarative, documented, honest. ✅
   Nested table with per-pair comments, STANCE/DISPOSITION/FACTIONS constants,
   builtinStanceValue exposed so the editor shows baselines without touching runtime
   state. This is how the Reviews 5/9/11 data files should feel.

   Testability

   9. The faction suite is a model; AITargeting has none. ✅/❌
   factionRegistry.test.js: 8 tests covering built-in stances (ally-ally = not hostile ✓,
   enemy pairs hostile ✓ — exactly what the review asks), disposition mapping, idempotent
   merge, builtin-override protection, directionality, escalation idempotency, and the
   delta round-trip. entityFaction.test.js covers the Entity-level derivation. Missing:
   any direct test of acquireTargets — dead-candidate filtering, self-exclusion,
   nearest-first ordering, range gating, the origin-based (turret) path, and the LOS
   gate. It's 69 lines of pure-ish logic over injectable candidates — a 30-line test
   would pin it.

   Priority recommendations

   1. Medium — Migrate zombie/NPC candidate filtering to AITargeting.acquireTargets (or
      narrow the header claim) (#3) — this also creates the seam for the cached-Vision
      reuse from Review 24.
   2. Low — Add the acquireTargets unit tests (#9); comment the zombies-wildlife
      neutrality (#4).
   3. Low — Validate authored stance values on loadDefinitions (reject dispositions
      outside the player column) (#5a); document authored-stance persistence across maps
      (#5b).
	  
	    Review 26 · Turret AI

   Files reviewed: client/src/game/ai/TurretAI.js (140 lines),
   client/src/game/ai/TurretCombat.js (223 lines)

   Summary

   Two compact, well-organized files. Turret firing is routed through the shared
   CombatResolver.rollTurret, targeting reuses AITargeting (the only AI family that does,
   per Review 25), and the ammo/battery lifecycle is complete: gates at turn start,
   per-shot consumption, auto power-down with a sound cue, and inert turrets becoming
   walkable/untargetable. The notable findings: player-faction turrets only ever shoot
   zombies (the player stance row has no other hostiles — bandits walk past your
   defenses), "infinite turret" is defined broadly enough to cover any non-player
   faction, and turrets are explosion-immune. Test coverage is nearly absent — one
   faction-derivation test, nothing behavioral.

   Correctness

   1. Faction rules: no friendly fire — but the target set is narrower than expected.
   ✅/⚠️
   Targeting goes through AITargeting.acquireTargets → Entity.isHostileTo, and turret
   items carry factionId (transferred at ECS conversion, GameMap.js:1619) plus
   hostileOverrides. Player turrets: same-faction player is ALLY → never targeted ✅.
   Town turrets: town→player stays neutral until provokeTargetFaction flips the stance
   table and per-entity overrides (dual mechanism, idempotent, persisted as a runtime
   delta — matches the Review 25 model exactly). The gap: BUILTIN_STANCES.player lists
   only zombies: H, so a player-faction turret is neutral to bandits, hostile NPCs, and
   everything else that isn't a zombie. A bandit extorting you walks through your turret
   line untouched. Intended? Undocumented either way.

   2. LOS cease-fire works. ✅
   Targets are re-acquired with requireLineOfSight: true every turn via the origin-based
   LOS path (measuring from the turret's tile — the position-less-attacker case
   AITargeting was built for). A target leaving LOS simply isn't in that turn's list.
   Within a turn, resolution is synchronous, so no mid-volley LOS change is possible.

   3. Ammo/battery handling is complete. ✅
   Turn-start gates: off → no-op; dead battery or empty magazine → auto power-down +
   power_down sound, and inert means walkable-by-all/untargetable (consistent with
   isTurretPassableBy and getExposedTurretTargets). Per-shot: hasAmmo() checked each
   round, consumption clamped at zero, fire stops mid-volley on empty. AP loop stops on
   death, AP exhaustion, or ammo exhaustion — all three, correctly ordered.

   4. "Infinite turret" is too broad. ⚠️
   isInfiniteTurret() else factionId && factionId !== 'player' (line 22) — the fallback
   makes any factioned turret infinite: a bandit or authored-faction turret gets
   unlimited power and ammo. The comment says "Neutral/non-player turrets… are always
   on," which is a town-turret assumption generalized to every non-player faction. Should
   be an explicit faction list or a defId/blueprint flag.

   5. Passability and targeting helpers are correct. ✅
   isTurretPassableBy: inert walkable by all, powered passable only to its own faction
   (player can retrieve their own), unknown mover blocked. getExposedTurretTargets:
   same-faction shield rule works; wagon-nested turrets are a documented TODO.
   removeDestroyedTurret handles all three storage locations (entityMap, _container ref,
   wagon scan) with a warn fallback.

   6. Turrets are explosion-immune. ⚠️ (latent)
   ExplosionSystem damages only player/zombie/rabbit/NPC (Review 22) — turret items
   aren't in the set. A grenade destroys the walls around a turret but not the turret.
   Combined with #4, town turrets are indestructible except by direct attack.

   Architecture

   7. Sensible split, honest naming drift. ℹ️
   TurretAI is decision and execution (targeting, gating, the fire loop, sim-first damage
   — documented as such, consistent with the TurnManager timing models). TurretCombat
   isn't "the attacker" — it's the turret-domain utility belt: passability, target
   surfacing, escalation, removal. The Review 5 oddity resurfaces here: Tile.js imports
   isTurretPassableBy/TURRET_DEF_ID from this AI module (flagged in Review 5 as gameplay
   logic reaching into a data object). Combat routing through CombatResolver.rollTurret +
   applyArmorAbsorption ✅ — no private dice.

   8. Escalation is well-placed. ✅
   provokeTargetFaction/escalateFactionAgainstPlayer implement the "attack the shopkeeper
   → town turns on you" flow with an unprovokable-faction guard
   (player/wildlife/zombies/neutral can't be flipped), a once-only newlyHostile signal
   for the warning message, and both persistence channels (table delta + per-entity
   overrides). This is faction machinery used exactly as designed.

   Performance

   9. Fine at current scale. ✅
   One acquireTargets pass per turret per turn (O(candidates) with per-candidate LOS
   inside range), AP-bounded shots, getEntitiesByType('item') index used in helpers.
   Noise per shot is O(zombies) per shot — a town turret firing 5 shots re-alerts five
   times; negligible.

   Testability

   10. Nearly nothing. ❌
   One faction-derivation test in entityFaction.test.js (turret hostile to rival
   faction). Missing everything the review asks: turret fires on hostile zombie (and does
   sim-first damage exactly once — TurnManager doesn't re-apply), turret does not fire on
   player/ally, cease-fire when target leaves LOS (re-acquire next turn excludes it),
   out-of-ammo → power-down + inert + walkable, dead-battery path, infinite turret
   consumes nothing, passability by faction, escalation flip on shopkeeper attack.
   executeTurretTurn is a pure static function over (item, coords, map, candidates)
   returning actions — trivially harness-testable; there's no excuse for zero behavioral
   tests.

   Priority recommendations

   1. High — Add the behavioral suite: fires-on-enemy, no-friendly-fire, LOS cease-fire,
      ammo/battery power-down, infinite-turret (#10). This file is the easiest test win
      in the AI layer.
   2. Medium — Decide the player-turret target set: add stances (player→bandits H) or
      document zombie-only targeting (#1).
   3. Medium — Restrict infinite-turret to explicit factions or a defId flag (#4); decide
      whether explosions should damage turrets (#6).
   4. Low — Move isTurretPassableBy/TURRET_DEF_ID knowledge out of Tile.js per the Review
      5 recommendation (#7).
	  
	  
	   Review 27 · Rabbit AI

   Files reviewed: client/src/game/ai/RabbitAI.js (227 lines),
   client/src/game/entities/Rabbit.js (200, reviewed in Review 14)

   Summary

   A simple, mostly correct greedy flee implementation with three anti-loop safeguards
   (visited-tile memory, distance-increasing preference, hard break when trapped) and a
   properly guarded AP/commit ordering (the comment at line 147 documents the
   visual-desync bug that motivated it). As AGENTS.md describes, it's a separate
   imperative execution path — no intents, own action list, own per-rabbit synchronous
   loop. Findings are small: a stale/coordinate-inconsistent zombie scan, per-turn-only
   visited memory permitting cross-turn ping-pong, and zero flee-behavior tests.

   Correctness

   1. Flee direction is correct. ✅
   attemptFlee scores all 8 neighbors by Euclidean distance from the threat and prefers
   distance-increasing unvisited tiles, falling back to any distance-increasing move,
   then any unvisited tile. Diagonal corner-cutting is rejected via canMoveDiagonally,
   and moveEntity is the commit gate — AP and animation only happen after the move
   succeeds (correct ordering, learned from a real bug).

   2. Cornered rabbits stop instead of looping. ✅ (with one caveat)
   When no candidate is distance-increasing and everything is visited, best is null →
   return false → the turn loop breaks ("Trapped"). The 30-iteration safetyCounter is a
   second backstop. The caveat: movementPath (the visited memory) resets every turn in
   Rabbit.startTurn, so a rabbit cornered between a threat and a wall can ping-pong A→B
   one turn and B→A the next — bounded oscillation across turns rather than an infinite
   in-place loop. Harmless visually, but a cornered rabbit never truly gives up.
   3. The zombie scan is stale and coordinate-inconsistent. ⚠️
   nearestZombie is computed once before the move loop (lines 40-46) — after the rabbit
   flees 10 tiles, it keeps fleeing toward/away from the zombie's position as measured at
   turn start (re-checked distance per step, but to the same possibly-suboptimal zombie).
   Worse, the initial scan measures Manhattan distance to zombie.x (render coordinate,
   potentially mid-animation) while the per-step check uses zombie.logicalX — the same
   inconsistency flagged in Reviews 16/24. The player scan right above it uses logicalX
   throughout.
   4. Detection hysteresis is sane. ✅
   Vicinity awareness at 10 tiles (no LOS needed) or sight at 15; once triggered, flee
   until 25 tiles — the 10→25 gap prevents flicker between flee and calm at the boundary.
   Priority order (player > zombie > wander, capped at 2 wander steps) is clear and
   correct.

   Architecture

   5. Correctly a separate path. ✅
   Per AGENTS.md's two execution models: executeRabbitTurn runs its own synchronous AP
   loop per rabbit, calls gameMap.moveEntity directly (the shared single write point —
   Review 8/16 ✅), and returns its own action list for playback. No intents, no ECS
   components required beyond what Rabbit carries. AP is deducted manually with correct
   diagonal cost (1.4) — notably more consistent with Pathfinding's cost model than
   MovementSystem's flat rate (Review 16 #6). The function is self-contained: inputs in,
   {success, actions, apUsed} out — the shape a testable AI should have.

   Performance

   6. Trivial. ✅
   Per rabbit per turn: one player LOS check (only within 15), one O(zombies) Manhattan
   scan, then ≤30 steps of 8-neighbor evaluation. Rabbit counts are tiny. Nothing to
   optimize.

   Code Quality

   7. Clean and readable. ✅
   Named phases (A/B/C), comments citing the bugs each guard prevents, seeded RNG for the
   wander shuffle. The only smells are the ones above (#3) and the continued
   Rabbit.playAction duplication from Review 14.

   Testability

   8. No flee tests. ❌
   Rabbits appear in fire.test.js (Burnable) and death_and_explosions.test.js (carcass
   drop), but nothing tests behavior: flee-increases-distance, cornered-trap termination,
   wander cap of 2, diagonal corner rejection, or the detection thresholds (10/15/25).
   executeRabbitTurn takes (rabbit, map, player, zombies) and returns actions — a
   corner-map scenario (rabbit boxed by walls + threat) and an open-field scenario would
   cover the core behaviors in a few lines each.

   Priority recommendations

   1. Medium — Add flee tests: open-field distance increase, cornered termination, wander
      cap, threshold hysteresis (#8).
   2. Low — Re-scan nearestZombie per step (or document the once-per-turn choice) and use
      logicalX/Y consistently in the initial scan (#3).
   3. Low — Consider persisting a 1-2 turn visited memory (or accept and comment the
      cross-turn ping-pong) (#2).
	  
	    Review 28 · Player Zombie Tracker

   File reviewed: client/src/game/ai/PlayerZombieTracker.js (249 lines)

   Summary

   A class whose implementation is better than its documentation: despite the header
   claiming it "tracks zombies visible to the player," it actually tracks zombies that
   can see the player — which is the more useful thing, and matches the review brief. The
   LKP (last-known-position) handling is carefully done, with the critical ordering fix
   documented. The real issues: the playerFieldOfView parameter is accepted and
   completely ignored, killed zombies linger in the tracker until the next update sweep,
   it's an O(zombies × LOS) scan per player step that duplicates data the Vision system
   already computes, and one of its two public entry points is dead code. No tests.

   Correctness

   1. Documentation is inverted relative to behavior. ⚠️ (must fix)
   Header: "Only tracks zombies that are visible to the player." Implementation
   (getVisibleZombies, lines 64-92): iterates all zombies, fast-fails beyond
   zombie.sightRange, then checks zombie.canSeeEntity(gameMap, player) — i.e., zombies
   aware of the player. The inline comment ("zombies with longer sight range than the
   player's FOV were ignored") shows the inversion is deliberate — the docs were never
   updated. Anyone consuming this class believing the header will misread every count it
   produces.

   2. playerFieldOfView is dead weight in the signature. ⚠️
   Accepted by both entry points, null-checked, never read. Every caller
   (GameContext.jsx:883,1221, PlayerContext.jsx:368, GameMapContext.jsx:317) dutifully
   computes and passes a real FOV array that's discarded. Either use it or drop it from
   the signature — right now it costs every caller work for nothing.

   3. Kill desync self-heals, but sloppily. ⚠️
   No ZOMBIE_DIED/ENTITY_REMOVED listener. A zombie killed while spotted stays in
   spottedZombies — getSpottedZombieCount() is wrong until the next updateTracking, when
   the lost-sight sweep evicts it. The eviction also calls zombie.setTargetSighted(...)
   and resets isAlerted on the corpse (harmless — it's off the map — but untidy), and the
   map holds a live entity reference in the meantime (the Review 13 stale-reference
   pattern). Subscribing to ENTITY_REMOVED and deleting there would make the count exact
   at all times.

   4. LKP ordering is correct and well-documented. ✅
   Lost-sight processing runs before tracked-position updates, with a comment explaining
   exactly why (updating first would poison the LKP with the player's new hidden
   coordinates). LKP = last confirmed-visible position — this is the subtle part of the
   class and it's done right. The alert lifecycle (growl on first spot via
   ZOMBIE_ALERTED, reset on loss so it re-growls next time) is also correct.

   5. Dead entry point. ⚠️
   updateCurrentVisibility (25 lines, the no-LKP variant) has zero callers —
   grep-verified. Its doc references "path-based LastSeen tracking" that presumably once
   called it.

   Performance

   6. O(zombies × LOS) per player step — and it duplicates the Vision cache. ⚠️ (main
   perf finding)
   Every player move/FOV change triggers a full zombie scan: distance fast-fail (good),
   then a full Bresenham LOS walk for every zombie within sight range (15-30 tiles). A
   10-tile player move = 10 tracker updates × per-in-range-zombie LOS. This is the third
   system doing zombie→player LOS per turn/step (AISystem per cycle, this per step) — and
   VisionSystem already computes visibleEntities per zombie per turn (Review 6). The
   tracker could read zombie.getComponent('Vision').visibleEntities.includes(player.id)
   and skip the LOS walk entirely, at the cost of turn-granularity staleness rather than
   step-granularity. Not an O(1) counter by any measure.

   Architecture

   7. Fits the event model; one fragile call site. ℹ️
   Emits ZOMBIE_ALERTED through the catalog (fire-and-forget ✅, used by AudioContext).
   PlayerContext.jsx:368 passes a synthetic {x, y, id} player — works only because every
   coordinate read in the chain falls back from logicalX to x. If any code path in
   canSeeEntity/getDistanceTo ever requires the real entity, that call site breaks
   silently.

   Testability

   8. None. ❌
   No tracker tests anywhere: no spot/unspot count accuracy, no kill-eviction, no
   LKP-equals-last-visible-position (the invariant in #4 — the most valuable thing to
   pin), no re-alert on re-spot. The class is a plain Map wrapper around LOS calls — a
   harness map with a wall between player and zombie gives full coverage of spot →
   lose-sight → LKP correctness in a few lines.

   Priority recommendations

   1. High — Fix the docs: the header should say it tracks zombies that can see the
      player (#1); either consume playerFieldOfView or remove it from the signature (#2).
   2. Medium — Subscribe to ENTITY_REMOVED for immediate eviction (#3); add the count/LKP
      test (#8).
   3. Medium — Read the Vision component cache instead of per-step LOS walks, or memoize
      per turn (#6).
   4. Low — Delete updateCurrentVisibility (#5); pass the real player entity at
      PlayerContext.jsx:368 (#7).
	  
	   Review 29 · SimulationManager

   File reviewed: client/src/game/managers/SimulationManager.js (412 lines), full file
   including the executeNPCFollowUp mini-simulation and checkAndProcessDeaths

   Summary

   The phase order matches AGENTS.md exactly, the failure modes are fail-safe
   (try/finally on isSimulating and _uiDirty, per-entity try/catch in the rabbit and
   turret loops), and there are thoughtful touches throughout (frozen hearing zone,
   post-zombie-phase vision invalidation, lazy container resolution for wagon turrets).
   The significant findings: the 50-cycle caps exit silently — no log when a turn is
   truncated mid-AP; runTurn is not idempotent (a second call refills all AP and doubles
   every timed effect); ~110 lines of turret orchestration live inline instead of in a
   system; and there is a coarse activity cull (60 tiles) that Review 18 didn't see from
   inside AISystem — with the side effect that distant zombies freeze completely.

   Correctness

   1. Phase order is exactly as documented. ✅
   Fire (tile + entity) → turrets → zombie AP refresh → death checkpoint 1 → global
   vision dirty → Vision/AISystem/IntentQueue loop (≤50) → death checkpoint 2 → rabbits →
   NPC phase (simulatedHp wipe, AP refresh, vision re-dirty, ≤50 loop, demand break) →
   death checkpoint 3 → final vision refresh. The three death checkpoints are placed
   correctly relative to their damage sources.

   2. The 50-cycle cap fails silently (answers specific question 1). ❌
   while (newIntentsGenerated && aiCycleCounter < 50) — when the cap is hit with intents
   still flowing, the loop simply exits. No log, no warning, no metric. The entities
   involved just stop mid-turn with unspent AP; their remaining actions vanish. Graceful
   in the no-crash sense, but if a pathological turn ever hits this (a 200-zombie conga
   line each generating intents every cycle), the symptom will be "zombies seem sluggish"
   with zero evidence pointing at the cap. Same silence in the NPC loop (50) and
   executeNPCFollowUp (25). Note IntentQueue's own safeguards (maxTotalIntents, maxDepth)
   do warn — the cycle caps are the odd ones out.

   3. runTurn is not idempotent (answers specific question 2). ⚠️
   A second call in the same turn: startTurn refills every zombie's and NPC's AP to max
   (double actions), turrets fire again, processTileFires decrements fire twice (fires
   burn at 2×), and both action queues would play back. Death handling is safe (the
   getEntity guard prevents double loot/removal), and the flag resets work. Nothing
   guards against double-invocation — it's safe only because callers are disciplined. An
   if (GameMap.isSimulating) return early-out or a per-turn token would make it
   structurally safe.

   4. The 60-tile activity cull exists — and freezes distant zombies. ⚠️ (new information
   vs. Review 18)
   activeZombies filters to Chebyshev < 60 (80 sleeping) from the player, or < 30/40 from
   any live NPC. Review 18 noted no dormancy short-circuit inside the AI loop; there is
   one at the phase level — but it's not a perf-only gate, it's a behavior gate: zombies
   beyond 60 tiles don't wander, don't investigate noise (they're not in ecsEntities, so
   emitNoise still reaches them via setNoiseHeard, but they never get a turn to act on
   it), and don't burn AP. The NPC-proximity clause (zombies near NPCs stay active) is a
   nice touch that keeps offscreen NPC-zombie fights alive. This is a defensible design,
   but it's behavior-changing, tunable only by editing two magic numbers, and nowhere
   documented outside one "Performance filter" comment.

   Architecture

   5. Mostly orchestrator, with a turret system living inside it. ⚠️
   ~110 lines are inline turret logic: candidate assembly, the recursive
   fireTurretFromItem (with the lazy-container-resolution comment — good fix, well
   documented), the on-map + ground-container scans, and the mirrored checkAndCleanTurret
    recursion inside checkAndProcessDeaths. That's a TurretSystem in everything but name;
   TurretAI/TurretCombat already exist as its natural home. The rest is appropriately
   thin: sensory cleanup, hearing-zone snapshot, cycle loops, death checkpoints. The
   active-zombie filter is arguably a policy that belongs with the spawner/replenishment
   config.

   6. Death processing is a proper static, with one routing inconsistency. ℹ️
   checkAndProcessDeaths calls DestructionSystem.resolve directly rather than enqueueing
   DestroyIntents — same dual-routing observation as Review 22 (#5). It scans the full
   entityMap per checkpoint (O(E) three times per turn) rather than tracking pending
   deaths — consistent with the "death is a sweep" finding from Review 20.

   Performance

   7. Worst case is the compounding of every prior finding — bounded linearly, with a big
   constant. ⚠️
   Per turn, worst case: O(items) turret scan with per-target LOS + 50 zombie cycles ×
   (VisionSystem per dirty entity O(R³) + per-zombie LOS + uncapped hunting A* (Review
   7/18) + IntentQueue O(I×E) (Review 19)) + 50 NPC cycles × NPC×Z×LOS (Review 24) + 3
   O(E) death sweeps. With ~200 active hunting zombies this is millions of tile
   operations — hundreds of ms to seconds of synchronous main-thread time during which
   the UI is frozen before animation starts. The 50-cycle caps bound it linearly; the
   60-tile cull bounds the entity count; but there is no time budget, no yield, and no
   telemetry — the first sign of trouble will be a multi-second hang on horde maps.
   Options: per-cycle time budget that parks remaining AP to next turn, or at minimum a
   console.warn with cycle/entity counts when a threshold is crossed (which also fixes
   #2).

   Testability

   8. Exercised constantly, asserted never. ⚠️
   GameHarness.endTurn calls the real runTurn, so every harness-based test
   (npcAttackOnSight, spitterRanged, death_and_explosions, balance, fuzz) runs the full
   sequence. But nothing asserts the sequence itself: phase order (fire before turrets
   before zombies), checkpoint placement, the cycle-cap truncation behavior (#2), the
   activity-cull boundary (#4 — a zombie at 59 vs 61 tiles), or double-invocation
   behavior (#3). A phase-order test with instrumented stub systems is cheap; the
   cull-boundary test is the one most likely to catch a real future regression.

   Priority recommendations

   1. High — Log cycle-cap exhaustion (console.warn with entity count and AP remaining)
      in all three loops (#2); add a time/operation threshold warning for the whole turn
      (#7).
   2. Medium — Add a double-invocation guard (#3); extract the inline turret blocks into
      a TurretSystem (#5).
   3. Medium — Test the activity-cull boundary and phase order (#8); document the 60/30
      distances in progression config (#4).
   4. Low — Route checkpoint deaths through the intent queue for consistency (#6).
   
   
      Review 30 · TurnManager

   File reviewed: client/src/game/managers/TurnManager.js (456 lines), plus the turnPhase
    mutation sites across GameContext and EventRunner

   Summary

   TurnManager is a well-hardened playback engine: the damage-timing contract is
   documented in a canonical header block (the same one Reviews 20-22 kept citing),
   per-entity parallel lanes fix a real stop-and-go animation problem while preserving
   per-entity ordering, cancellation properly flushes in-flight animation promises so
   isProcessing can't wedge, and every per-action error is caught with a position
   force-sync for failed moves. The state machine it doesn't own is the weaker story:
   turnPhase is a plain string mutated at 11 sites across two files with no enum and no
   transition validation. And there are no tests — the harness re-implements the ATTACK
   damage path headlessly instead of exercising this class.

   Correctness

   1. Deadlock analysis: well-defended. ✅
   • isProcessing wedge: impossible by construction — finally always clears it (even on
     fatal error), and cancelPlayback flushes pending SequencerAction promises via
     engine.flushActiveActions() so an in-flight await resolves and reaches the finally
     (the comment at lines 64-67 documents exactly the stuck-forever bug this fixed).
   • Hanging lane: Promise.all over lanes means one stuck playAction hangs playback —
     escape is cancelPlayback, which every current caller (defeat/load/new game) uses,
     per the invariant comment at lines 54-59.
   • DEMAND (300ms) and TURRET_SHOT (200ms) delays are plain setTimeouts — always
     resolve.
   • Per-action errors are caught inside each lane; a failed MOVE force-snaps the entity
     to its destination (lines 127-133) — no invisible desync.
   • Queue lifecycle: the actionQueue is created fresh per runTurn (SimulationManager)
     and consumed by GameContext — no clearing bug is possible; nothing retains it.

   2. The cancel-drops-damage invariant is documented — and correctly scary. ✅
   The header at lines 51-59 spells out that cancelling drops playback-first damage the
   simulation already committed to (enemy hits vanish), why that's acceptable today (all
   callers replace game state), and explicitly forbids building a "skip animation"
   feature on it. This is exactly the kind of foot-gun documentation Reviews 20-22's
   dual-timing model needs.

   3. Lane concurrency is damage-safe. ✅
   Lanes partition by entityId (+ a global lane), preserving order within an entity —
   which is all the timing model requires: each attacker's move→attack→death sequence
   plays in order, turret shots stay sequential per turret. Two lanes damaging one target
   apply pre-rolled outcomes whose sum is order-independent; a target killed in lane A
   absorbs lane B's pending hit harmlessly (hp clamps at 0). flashedEntityIds dedupes
   kill flashes across lanes. No interrupt-type actions exist inside this queue (demands
   are handled post-turn in GameContext — Review 24), so lanes can't interleave with a
   pause.

   4. ANIMATING → PAUSED_FOR_EVENT → ANIMATING doesn't live here. ℹ️
   PAUSED_FOR_EVENT is entered and exited only inside EventRunner (lines 326/346) — the
   quest-dialog path. TurnManager never touches it; the NPC demand path doesn't use it at
   all (Review 24). So the transition the review asks about is contained in one file with
   matching set/restore — whether it can deadlock is an EventRunner question, not a
   TurnManager one. Within TurnManager's own scope, ANIMATING ends when processQueue's
   finally runs and GameContext restores PLAYER_TURN.

   Architecture

   5. The phase machine is named strings scattered across files. ⚠️
   turnPhase is a string field (GameEngine.js:106) assigned at 11 sites in
   GameContext.jsx and EventRunner.js. The four phases are named — but as raw literals,
   not a shared enum, and with no transition validation (anything can set any phase from
   anywhere; GameContext even assigns it mid-flow at lines 838/946 with "Phase 28 Fix"
   comments). TurnManager itself adds two implicit boolean flags (isProcessing,
   shouldCancel). So: explicit in vocabulary, implicit in enforcement. A TURN_PHASE
   constant module (like GAME_EVENT for events, Review 3) would at least make typos
   impossible; a tiny transition table would make phase violations detectable.

   6. TurnManager is correctly playback-only — with two small leaks. ✅/ℹ️
   The damage-timing header keeps it honest: playback-first only for entity ATTACK (lines
   311-339), never for structures/turrets. The leaks: DEATH calls gameMap.removeEntity
   even though DestructionSystem already removed the entity during simulation (idempotent
   — returns null — but redundant work with a second targeting-cleanup sweep), and the
   DEMAND case sets entity.isAlerted (visual flag, fine). Both harmless.

   Performance

   7. Asynchronous and lane-parallel — the queue can't hitch the frame. ✅
   Playback drains via SequencerAction promises driven by the engine heartbeat —
   frame-by-frame, never a blocking loop. Lane parallelism makes wall-clock ≈ the longest
   lane, not the total action count (the comment at 96-106 documents the stop-and-go
   problem this solved). Remaining wall-time costs: the per-shot 200ms turret delay and
   300ms demand pause (fixed, deliberate pacing), and — Review 4 again — three
   console.log per action (🎬, >> START, << FINISH) plus lane summary, meaning a
   200-action turn writes ~600 log lines in production.

   Testability

   8. Nothing tests this class. ❌
   No TurnManager tests exist. The harness explicitly re-implements the ATTACK damage
   path headlessly (GameHarness.js:466,484 comments: "TurnManager's ATTACK case (minus
   animations/events)") — so playback-first damage, armor absorption at playback, lane
   ordering, cancel-flush, and the failed-MOVE force-sync are all untested. The cancel
   invariant (#2) and lane damage safety (#3) are the two behaviors most worth pinning;
   both are testable headlessly with stub playAction implementations.

   Priority recommendations

   1. Medium — Add tests: playback-first ATTACK applies damage+afflictions exactly once,
      cancel mid-lane releases isProcessing, failed MOVE force-snaps, lane ordering
      preserved per entity (#8).
   2. Medium — Introduce a TURN_PHASE constants module and route the 11 assignment sites
      through it (#5).
   3. Low — Drop the redundant removeEntity in the DEATH case (#6); route per-action logs
      through the scoped logger at debug level (#7).
	  
	   Review 31 · Item Definitions & Traits

   Files reviewed: client/src/game/inventory/ItemDefs.js (2,914 lines), traits.js (175),
   PocketLayouts.js (88), gridUtils.js (15), plus a runtime audit of all 178 definitions

   Summary

   ItemDefs.js is a hand-authored, well-commented data catalog in surprisingly good shape
   — I ran a full structural audit of all 178 defs (id/key match, name, dims, rarity,
   trait/category/slot membership, weapon damage blocks, attachment slot refs, pocket
   layouts, container grids, disassemble refs, transform chains) and found only 5
   anomalies, of which 2 are real bugs. The systemic findings: item stats for
   grenades/molotovs live entirely outside the catalog (hardcoded in CombatContext and
   ExplosionSystem), createItemFromDef shares def internals by reference across all
   instances, and no schema test exists — the audit I ran for this review is the only
   validation the catalog has ever had.

   Correctness

   1. Audit results: 178 defs, 2 real bugs, 3 observations. ✅/⚠️
   • provision.rain_collector: categories: [null] — a broken category reference
     (undefined constant serialized into the array). Inert today (null fails every
     category check silently), but it's exactly the kind of typo that becomes a
     loot-filter bug later.
   • vehicle.wagon: rarity: Rarity.EPIC — EPIC doesn't exist in Rarity, so the def
     literally carries rarity: undefined. Loot weight falls back to 100 silently;
     harmless because the wagon is noLoot, but it proves nothing validates rarity values.
   • placeable.bed/vehicle.small_sled disassembleData.toolId: {either: [...]} — valid
     (CraftingManager supports the either schema, CraftingManager.js:64) — my audit's
     false positive, noted for the record.
   • weapon.grenade/weapon.molotov have no damage or blast fields at all — see #4.
   • No duplicate keys, no missing names, no bad dims, all
     attachment/pocket/disassemble/transform references resolve.

   2. createItemFromDef shares def internals by reference. ⚠️
   The factory (ItemDefs.js:2890-2895) shallow-spreads the def: traits, categories,
   combat, rangedStats, attachmentSlots, containerGrid are the same object references in
   every instance of a defId. One mutating write to item.combat.damage or
   item.traits.push(...) corrupts every instance of that item, everywhere. Safe today by
   read-only convention; one line away from a heisenbug. A structuredClone of the def (or
   at least the nested objects) is cheap insurance.

   3. Instance IDs are collision-safe but break the determinism convention. ⚠️
   instanceId uses Date.now() + Math.random() — collision-practically-impossible, but
   it's the only significant non-seeded randomness in item creation (everywhere else uses
   gameRandom). IDs don't need to be reproducible, but the convention breach matters if a
   replay/verification feature ever compares runs.

   4. Item stats outside the catalog (answers "single source of truth?"). ⚠️
   Mostly yes — lightRange, turretStats, combat, rangedStats, containerGrid all live in
   defs — with these exceptions:
   • Grenade blast radius: 2 is hardcoded in CombatContext.jsx:737; damage tiers
     hardcoded in ExplosionSystem (Review 22 #1). The items themselves are empty shells.
   • FUEL_VALUES (rag/stick/plank) in traits.js — per-item data in the constants file.
   • SAFE_GUNS gun→ammo mapping in LootGenerator — should be a def field (attachmentSlots
     already models it elsewhere).
   • ZombieCorpseConfig corpse visuals, TURRET_DEF_ID in TurretCombat.
   • EntityFactory hardcodes flashlight LightEmitter radius 5 vs the def's lightRange: 8
     (dead code path, but illustrative).

   5. Pocket layouts resolve, schema inconsistent. ℹ️
   Every pocketLayoutId on clothing resolves to a PocketLayouts entry (audit-verified).
   The layouts themselves are half-migrated:
   work_shirt/paramedic_shirt/police_shirt/military_shirt pockets have id fields;
   pocket_tee/sweatpants/cargo_pants/blue_jeans pockets don't. Pocket capacity is just
   the grid dims — nothing to cross-validate.

   Architecture

   6. Data catalog with two small functions — keep it that way. ✅
   2,875 lines of data + createItemFromDef + getItemName. Hand-authored (per-item
   comments like "4×4 footprint → 5×7 internal storage"), not generated — the comments
   carry design intent (capacity ratios), so the Review 10 verdict applies: don't convert
   to JSON; if anything, split into domain data modules (ItemDefs.weapons.js etc.)
   re-exported from one catalog. Parsed once at module load.

   7. Traits applied at definition time; state applied at instantiation (answers specific
   question 1).
   Traits/categories are static arrays in the def, spread (by reference) into instances;
   spawn-time mutable state (stackCount, condition, ammo, attached batteries) is applied
   by LootGenerator.applySpawnDefaults; derived flags (isFood, isCrop) are computed on
   demand via precomputeItemFlags and Item._def lookups. So: definition time for
   capabilities, instantiation time for condition, runtime re-derivation for flags. It
   works, but the "both" is convention, not mechanism.

   Code Quality

   8. Consistent IDs, serviceable deprecation, sprawling taxonomy. ✅/⚠️
   domain.name IDs are uniform; noLoot: true serves as the de-facto deprecation/unique
   marker and is respected by the loot filter. gridUtils.gridItems cleanly absorbs the
   Map/array/POJO grid duality (Reviews 8/13). The taxonomy is the weak spot:
   ItemCategory has overlapping concepts (WEAPON/GUN/KNIFE/HAMMER, CLOTHING/ARMOR with
   CategoryDisplayName mapping CLOTHING→'armor'), and Rarity.EPIC shows anyone can
   reference a nonexistent constant without consequence.

   Testability

   9. No schema test — the audit in this review is the first. ❌
   batteries.test.js checks one def's fields; other tests use createItemFromDef for
   behavior. Nothing validates the catalog structurally. My audit script found real bugs
   in 30 seconds — it should become test/inventory/itemDefs.schema.test.js: id/key match,
   required fields, enum membership (rarity/trait/category/slot), reference resolution
   (attachments, pockets, disassemble, transformInto/produce), weapon damage presence.
   Cheap, high-value, and it pins #1 and #2-of-#1 permanently.

   Priority recommendations

   1. High — Add the schema-validation test (the audit above, codified) (#9); fix
      rain_collector's [null] category and the Rarity.EPIC reference (#1).
   2. Medium — Move grenade/molotov blast stats (radius, damage tiers) into the defs and
      have CombatContext/ExplosionSystem read them (#4); deep-copy def internals in
      createItemFromDef (#2).
   3. Low — Normalize pocket schemas (ids everywhere or nowhere) (#5); consolidate
      FUEL_VALUES/SAFE_GUNS into def fields (#4); document the ItemCategory overlap or
      prune it (#8); use gameRandom-derived instance IDs if determinism ever matters
      (#3).
	  
	    Review 32 · Item (Instance)

   File reviewed: client/src/game/inventory/Item.js (1,784 lines), plus its test
   situation

   Summary

   Item is not a value object — it's a stateful runtime entity with an event emitter,
   self-destruction capability, and two direct reaches into the global window.gameEngine
   (one of which will throw in Node). The core inventory mechanics are correct and
   carefully built: stacking special-cases are thorough, ammo arithmetic is right,
   container rotation has proper rollback, and serialization handles the ECS/POJO duality
   explicitly. The file's real problems: ~350 lines of vehicle physics and turret combat
   that belong in systems, a def-transform implementation duplicated against
   GameMap._transformItemInPlace, a dead test file that vitest never runs, and almost no
   coverage of the state transitions the review asks about.

   Correctness

   1. window.gameEngine — global reach that crashes headless. ❌
   Two self-destruction paths — consumeCharge (line 800) and degrade (line 1127) — do
   window.gameEngine?.inventoryManager. In the browser this works; in vitest's Node
   environment window is undeclared, so hitting either path throws ReferenceError (not a
   graceful skip). The same file uses globalThis.gameEngine correctly twenty lines later
   (line 1025) — so it's an inconsistency, not a constraint. Beyond the crash: an Item
   deciding to destroy itself via the global inventory manager is exactly the "value
   object reaching into world state" inversion the review asks about. The
   _container.removeItem fallback right below it is the correct local mechanism; the
   global path should go.

   2. Durability, ammo, and stacking: correct. ✅
   • degrade: floors condition at 0, respects DEGRADABLE + null condition, def-driven
     fragility. armorAbsorption is a separate pool (matches Review 20's model).
   • loadAmmo/unloadAmmo: capacity clamp, min-transfer, source decrement,
     empty/full/incompatible reason strings — all correct; magazine vs. loose-ammo
     display handled in getDisplayAmmoCount's priority chain.
   • canStackWith: same-defId required, plus special cases done right — water bottles
     only stack at matching full/empty levels with quality rules, batteries only when
     identically full, charge-based at equal charges, zombieSubtype segregated.
     combineWith handles bidirectional water transfer with quality inheritance on empty
     targets, and battery replacement with stack-splitting.
   • rotate: pre-checks area, and if placeItemAt rejects after the footprint cleared,
     rolls back rotation and re-places — the comment shows the ghost-item bug this
     prevents.

   3. Two def-transform implementations. ⚠️
   Item.updateFromDef (line 630) and GameMap._transformItemInPlace (Review 8) do the same
   job — swap an item to a new defId in place — with different field sets (the GameMap
   version syncs ECS components; this one recomputes flags). Crop growth uses the GameMap
   one; anything using this one gets subtly different results. One should delegate to the
   other.

   4. Serialization handles the duality honestly. ✅
   fromJSON converts ECS entities (Item/Renderable/MeleeWeapon/Consumable components →
   plain fields) before constructing, with the #000000 background-color sentinel handled.
   toJSON uses a registered property list plus a catch-all that mirrors the constructor's
   catch-all — and the constructor's catch-all is now dev-warned once per key (the P7-13
   comment is an exemplary "load-bearing but uncontrolled" note). Minor: splitStack IDs
   use Date.now() with no random suffix — two splits in the same millisecond collide.

   Architecture

   5. ~350 lines belong in systems. ⚠️
   • Vehicle physics (lines 435-628): motor/scooter AP bonuses, per-distance power
     consumption, battery-pair enumeration — a VehicleSystem candidate.
   • Turret combat (lines 829-878): getFaction/isHostileTo/takeDamage/isInfiniteTurret —
     a deliberate mirror of Entity.isHostileTo ("minus the NPC legacy clause," per the
     comment), which means faction targeting logic now lives in two class hierarchies
     that must be kept in sync manually.
   • Book page tracking reads globalThis.gameEngine.bookStats — another global coupling.
     The remaining 1,400 lines (identity, state, containers, pockets, attachments,
     stacking, serialization) are cohesively Item's job.

   6. Stateful entity, not value object — accepted, but stop adding hooks. ℹ️
   Item extends SafeEventEmitter, owns Containers, self-destructs, reads globals. That's
   the established design and works; the review question answers itself — but new global
   couplings (#1, #5) should be rejected on principle.

   Performance

   7. Caching is present where it matters. ✅
   this._def resolved once at construction; lightRange/lightType read it;
   isFood/isMedical/isCrop/isFurnitureOrVehicle precomputed (P6-04); containers and
   pocket grids lazy-init on first access (with the circular-import workaround
   documented). splitStack does a full toJSON/fromJSON round-trip per split — expensive
   but rare. Hot-path noise: canStackWith fires up to 3 console.logs per check — and it's
   called during drag-hover, i.e., per mousemove (Review 4's production-noise theme,
   worst placement yet).

   Code Quality

   8. Large but organized interface. ✅/⚠️
   70+ methods in clear clusters. The constructor is 400 lines with ~60 destructured
   config fields — the migration accretion is visible, but the P7-13 catch-all is at
   least documented and dev-warned. Duplicate lightRange fallback (|| 8 in the getter vs
   def value) and the window/globalThis inconsistency are the untidy bits.

   9. Dead test file. ❌
   client/src/game/inventory/__tests__/Container.test.js exists but vitest only includes
   test/**/*.test.{js,ts} — it never runs. Either move it under test/ or delete it; a
   test that can't run is worse than none.

   Testability

   10. Two assertions for 1,784 lines. ❌
   test/loot/batteries.test.js covers canStackWith full/not-full — that's it. Nothing
   for: degrade to destruction, consumeCharge across all three trait paths
   (battery-powered/charge-based/ignitable), loadAmmo/unloadAmmo arithmetic, water
   combineWith both directions + quality rules, splitStack, rotate rollback, or the
   fromJSON ECS conversion. Item is instantiable headless with plain config objects — the
   test surface is wide open.

   Priority recommendations

   1. High — Replace window.gameEngine with the _container-local removal (or globalThis
      guard) at both self-destruction sites (#1); add tests covering those paths in Node
      (#10).
   2. High — Move or delete the unrunnable __tests__/Container.test.js (#9); add the
      state-transition suite: degrade, consumeCharge, load/unload, combine, split, rotate
      (#10).
   3. Medium — Unify def-transform: make GameMap._transformItemInPlace delegate to
      Item.updateFromDef or vice versa (#3).
   4. Low — Extract vehicle physics to a VehicleSystem and turret hostility to shared
      faction helpers (#5); silence canStackWith logs (#7); add a random suffix to split
      IDs (#4).
	  
	    Review 33 · Container & InventoryManager

   Files reviewed: client/src/game/inventory/Container.js (963 lines, full),
   client/src/game/inventory/InventoryManager.js (3,304 lines — constructor/registry,
   equip/unequip, addItem, moveItem, and structure of the rest)

   Summary

   Container is one of the best files in the codebase: real grid collision, atomic
   stack-merging with the invariant documented, defensive full-grid purges, and
   rollback-aware placement. InventoryManager is indeed a god class — 3,304 lines
   spanning at least seven concerns — but its core transfer engine (moveItem) has the
   most careful rollback logic I've seen in this project, including a documented fix for
   the partial-merge orphan case. The headline correctness finding: weight limits are
   declared everywhere and enforced nowhere — volume (grid) is the only real constraint.
   And manager-level tests are thin: the two inventory test files cover Container and one
   battery swap, not the transfer engine.

   Correctness

   1. Overlap prevention: solid. ✅
   Grid of instanceIds + isAreaFree + validatePlacement/validateNesting on every path;
   placeItemAt rejects occupied cells; the stack-merge is atomic by design with the
   invariant written down (Container.js:509-513 — full merge or nothing, because a
   partial merge would desync stackCount against the caller's rollback). fromJSON
   placement falls back to any free position rather than dropping items. The one soft
   spot: moveItem's absolute-last-resort placeItemAt(itemToMove, oldX, oldY) (line 2203)
   force-places "even if it overlaps (shouldn't happen)" — if it ever fires, it creates
   the silent overlap everything else prevents, with no log beyond the generic warning
   path.

   2. Swap / doesn't-fit handling: safe-by-rollback. ✅/ℹ️
   There's no swap primitive — dropping onto an occupied cell attempts stacking →
   combining → then fails and returns the item to its source (smart re-add, then
   force-place). The partial-merge case is handled explicitly (lines 2182-2195, with the
   comment documenting the orphaned-remainder bug this fixed). load_swaps.test.js
   verifies the one real swap workflow (battery stack → flashlight, splitting +
   displacement). Safe, but "swap A with B" as an atomic operation doesn't exist — it's
   remove-then-place with rollback.

   3. Weight limits: not enforced. ❌ (decisive answer)
   maxWeight exists as component data (InventoryContainer/Inventory components,
   EntityFactory) and items carry weight — but grep confirms the only weight reads in
   InventoryManager are armor's weightRequirement (an agility penalty, not a capacity).
   Nothing checks weight on add/move/equip. Volume (tetris grid) is the only enforced
   limit. Either enforce it or delete the dead fields — right now it's a lie the data
   tells.

   4. Recursion prevention is layered and correct. ✅
   Four independent guards in moveItem (own containerGrid id, self-reference
   pocket/container prefixes, checkRecursion structural id + ownerId) — and the
   checkRecursion v2 comment documents the substring false-positive fix (prefix-colliding
   instanceIds like -1 vs -12). Nesting rules otherwise: loaded containers/pockets can't
   be nested ("Empty container before storing"), GROUND_ONLY, category/item allow-lists,
   accessibility checks on both source and target owners, barter-session transfer guards,
   and hotplate/turret pickup guards. All present.

   5. One risky rescue path. ⚠️
   Container.removeItem's defId fallback (line 706) — fires when instanceId lookup
   already failed (i.e., a desync exists) and removes some item with a matching defId,
   warning "may cause incorrect item removal!" When the state is already corrupt,
   guessing makes it worse; better to fail loudly. It exists for legacy saves, but it's
   still active.

   Architecture

   6. Instantiation (answers specific question 1).
   Neither module singleton nor per-container — it's a per-game, per-player instance
   created by GameInitializationManager and reached via engine.inventoryManager
   (single-player game; equipment is a fixed 9-slot object). Containers are per-item
   (dynamically registered/unregistered as backpacks/pockets are equipped). Fits the
   architecture; the engine global is the usual coupling.

   7. Yes, it's a god class — top 3 separable concerns (answers specific question 2).
   ~75 methods across at least seven concerns. The three biggest, each a clean
   extraction:
   1. Ground/ground-container lifecycle — syncWithMap, refreshGroundItems,
      flushGroundItems, dropItemToGround/dropItemAtLocation, organize/sort/compact,
      quickPickup*, searchGroundItems, getGroundStatistics, getGroundItemsByCategory,
      setGroundItems (~400 lines; GroundManager already exists as its nucleus).
   2. Item query & consumption service — findItem, findMatchingItems, hasItemByDefId,
      consumeItemByDefId, hasItemInPlayerInventory, consumeItemFromPlayerInventory,
      getTotalItemCount plus their five recursive helpers (~600 lines of tree-walking
      that crafting and events call constantly).
   3. Equipment & dynamic-container management — equipItem, unequipItem, armor absorption
      sync, updateDynamicContainers, pocket/backpack container registration (~400 lines).
      Runner-up: turn processing + power (processTurn, _processItemTurnRecursive,
      isTilePowered, isContainerPowered) as an InventoryTurnProcessor. Special-case
      accretion is also visible in the generic paths (placeable.help/placeable.exit
      force-placement in Container; hotplate/turret pickup guards in moveItem) — each is
      small, but they're how 2 KB files become 126 KB files.

   Performance

   8. Lookups O(1); queries O(inventory). ✅/⚠️
   Item-in-slot is O(1) (grid cell → Map). Container registry is O(1). The recursive
   query family (#7 concern 2) walks every item in every container per call, and crafting
   calls those queries repeatedly per craft — that's the real hot path, not grid layout.
   Grid operations themselves (purge-on-remove, findAvailablePosition scans) are O(cells)
   over small grids — fine. updateDynamicContainers re-registers containers on every
   equip change; acceptable at 9 slots.

   Code Quality

   9. Invariants documented where they were hard-won. ✅
   The atomic-merge note, the recursion v2 note, the partial-merge note, the fromJSON
   placement fallback note — this file's comments explain bugs that happened, which is
   the highest-value documentation there is. inventoryChanged pulse with _updateCount
   keeps the useSyncExternalStore model consistent. No formal deprecations; one active
   legacy fallback (#5).

   Testability

   10. Container: decent. Manager: thin. ⚠️
   test/inventory/container.test.js bridges the legacy container assertion suite;
   load_swaps.test.js covers battery load-swap. Missing manager-level coverage: moveItem
   rollback paths (partial merge, return-to-source), equip/unequip with armor absorption
   sync, ground sync/flush, barter guards, recursion guards, and the add/remove/drop
   matrix. "Overweight" is untestable — there's nothing to test (#3).

   Priority recommendations

   1. High — Manager-level tests for moveItem (rollback, partial merge, return-to-source)
      and equip/unequip (#10); decide the weight question: enforce maxWeight or delete it
      (#3).
   2. Medium — Extract concern #2 (item query/consumption service) first — it's the
      most-called and most self-contained (#7).
   3. Medium — Remove or hard-fail the defId fallback in Container.removeItem (#5); log
      loudly if the force-place at moveItem:2203 ever fires (#1).
   4. Low — Extract ground lifecycle and equipment management (#7); consolidate the
      item-specific pickup guards into a rule table (#7 note).
	  
	  
	   Review 34 · Crafting

   Files reviewed: client/src/game/inventory/CraftingManager.js (910 lines),
   client/src/game/inventory/CraftingRecipes.js (483 lines), plus a runtime audit of all
   31 recipes

   Summary

   The crafting system is in good shape: recipes are pure data in a consistent, auditable
   schema (I validated all 31 against ItemDefs — every reference resolves, no duplicate
   ids), requirement checking is thorough (either-lists, categories, properties,
   unit-based consumption, tool usability), the multi-turn crafting queue is a genuinely
   thoughtful feature (workspace trimming to prevent stash exploits, AP forfeiture on
   cancel), and the stack-splitting workaround for Item's awkward splitStack contract is
   documented where it matters. Weaknesses: ingredient consumption re-matches items
   independently of requirement checking, ~250 lines of bespoke special-case recipes
   inline in _finishCraft, two globalThis.gameEngine couplings, and zero crafting tests.

   Correctness

   1. Ingredient consumption is correct — with a re-match gap. ⚠️
   Consumption decrements stacks by exact counts, removes empties, and returns contents
   of consumed containers/pockets to the player (returnedItems, lines 698-720 — nested
   items aren't eaten by the craft). Unit-based consumption (consumeUnits) floors at zero
   but checkRequirements pre-filters to sufficiently-filled items, so the two agree. The
   gap: checkRequirements and _finishCraft match ingredients independently (lines 245-281
   vs 662-673) — for either requirements, the item validated isn't guaranteed to be the
   item consumed (first match wins in both, so they align in practice, but nothing
   enforces it). A player with a prized knife and a junk knife satisfying "either: knife"
   can't control which is consumed.

   2. The split-stack workaround is correct and documented. ✅
   _consumeFromStack handles Item.splitStack's "split-but-don't-decrement" contract
   (comment at line 16 names the bug), with two placement fallbacks, workspace
   compaction, and revert of the decrement on total failure — partial-state-safe.

   3. AP and skill gating are correct. ✅
   calculateAPCost: crafting-skill discount floored at 1, cooking excluded (documented).
   Cooking hard-blocks on insufficient AP (single-turn); crafting-tab recipes enter the
   queue instead. requiredBook unlocks only when the book is fully read (pagesLeft ===
   0). Queue: same-recipe continuation, AP-investment accumulation,
   _trimWorkspaceToRequirements prevents using the locked workspace as free storage (the
   comment explains the exploit), cancelQueue forfeits invested AP and unlocks. All
   correct.
   4. Tool consumption matches validation. ✅
   _finishCraft prefers the same usable tool checkRequirements found
   (candidates.find(_isToolUsable) || candidates[0]), charges consume 1 charge,
   degradables degrade by fragility, cooking pots degrade by 1. Empty/broken tools are
   reported with the specific reason ("Lighter (Empty)") rather than a generic "missing."
   5. Result items get correct stats — with one theoretical hole. ✅/ℹ️
   preservedProperties carries water level/quality through boiling; resultCount applies
   to stacks; campfire lifetime derives from the fuel used via getFuelValue; the stew
   special cases scale nutrition/hydration from actual ingredients consumed. Hole: if
   createItemFromDef returned null (missing def), new Item(null) silently builds a
   default item — unreachable today (audit-clean), unguarded tomorrow.

   6. Special-case recipes: correct but bespoke. ℹ️
   Brainstem stew (water-gated stem pooling, subtype dilution via
   computeBrainstemStewTreatment, rainbow colors), regular stew (meat-priority unit
   scaling), cooked vegetables, clean water ×2 — each is correct, each is ~50 inline
   lines.

   Architecture

   7. Textbook data/logic split — mostly. ✅/⚠️
   CraftingRecipes.js is pure data in a consistent schema (audit-proven validatable).
   CraftingManager receives inventoryManager by injection (no import of the singleton!)
   and processes recipes against inventory state. Two leaks:
   globalThis.gameEngine?.bookStats (recipe locks) and engine.craftingQueue (queue state)
   — the queue also raises a persistence question: mid-craft save/load loses apInvested
   and silently unlocks the trimmed workspace.

   Code Quality

   8. Consistent schema, honest comments. ✅
   Uniform recipe shape across all 31 entries
   (id/name/resultItem/apCost/tab/tools/ingredients + optional
   requiredBook/resultCount/requiresCampfire/consumeUnits/properties). The try/catch
   wrappers return error reasons instead of throwing. Special cases are at least
   consolidated in _finishCraft rather than scattered.

   Testability

   9. Nothing. ❌
   No tests for crafting success, missing-ingredient failure, tool usability (empty vs
   broken), skill-gating (book lock, AP discount), the queue
   (start/continue/complete/cancel), workspace trimming, or autoload. The recipe audit I
   ran should be codified exactly like the Review 31 defId test — one table-driven test
   that resolves every recipe reference, plus behavior tests through the GameHarness
   (which has crafting AP infrastructure already).

   Priority recommendations

   1. High — Add the recipe-schema test (audit above, codified) and the behavior core:
      success, missing-ingredient failure, book-lock, queue start→complete (#9).
   2. Medium — Have checkRequirements return the matched instances and _finishCraft
      consume those, closing the re-match gap (#1).
   3. Medium — Persist craftingQueue (or explicitly reset it on load with the workspace
      unlocked) (#7).
   4. Low — Guard new Item(null) after createItemFromDef (#5); consider a special: 'stew'
      | 'brainstem' | 'boil' recipe field driving the bespoke cases instead of id
      string-matching (#6).
	  
	   Review 35 · GroundManager & ItemPricing

   Files reviewed: client/src/game/inventory/GroundManager.js (569 lines), ItemPricing.js
    (254), index.js (209)

   Summary

   ItemPricing is the best file in this review — a documented, single-source pricing
   module consumed by shop, toll gate, and dev console, with a sensible resolution order.
   GroundManager has a real data-loss bug: organizeByCategory clears the container and
   then silently drops any item that fails re-placement. And index.js is a legacy barrel
   whose template fallback table is dead, outdated, and imported by exactly one file for
   two re-exports.

   Correctness

   1. organizeByCategory can silently delete items. ❌ (the big finding)
   Line 75 clears the ground container, then line 113: if
   (this.groundContainer.placeItemAt(item, rowX, rowY)) { ... } — no else branch. The
   layout loop advances rowY past the container's current height; placeItemAt
   bounds-checks and returns false (it doesn't auto-expand — only
   addItem/findAvailablePosition do). Any item that doesn't fit the computed layout is
   simply gone, after clear() already evicted it. The sibling function sortGroundItems
   does this correctly (explicit isAreaFree scan + addItem fallback, lines 251-266).
   organizeByCategory is reached via optimizeLayout whenever the ground holds ≥10 items —
   i.e., exactly when the ground is busy. Fix is three lines mirroring sortGroundItems'
   fallback.

   2. GroundManager doesn't track tiles — and that's fine, but the brief's premise needs
   correcting. ℹ️
   It manages the ground container (the virtual feet-tile grid), not map-tile item truth
   — that lives in GameMap tiles (Review 8), with
   InventoryManager.syncWithMap/refreshGroundItems owning the tile↔container sync. Within
   its actual job, categoryAreas are recomputed from container state after every mutation
   (updateCategoryAreas), so they're self-healing; no drift possible. Minor: addItemSmart
    passes a third allowStacking arg to placeItemAt, which takes none — ignored,
   harmless, sloppy.

   3. Lazy engine import has a race + unguarded dereference. ⚠️
   import('../GameEngine.js').then(...) (lines 6-11) resolves engine asynchronously —
   cycle-avoidance, but early calls can see engine === null. The sort priorities guard
   with engine?. ✓, but the error-recovery paths in collectItemsByCategory (line 382) and
   quickPickup (line 506) do bare engine.gameMap — a TypeError precisely when you're
   already in an error path. Also, the recovery itself teleports unplaceable items to the
   player's tile — no data loss, wrong location, logged as an error. Acceptable emergency
   behavior; the null deref is not.

   4. Pricing: correct resolution, two nits. ✅/ℹ️
   The five-step resolution order (free → flat → per-unit computed → category → default)
   works as documented, with live-instance values (loaded rounds, water fill, charges)
   preferred over defs. Nits: spoiled food prices at full consumptionEffects (ignores the
   50% spoilage penalty Item.getNutritionValue applies), and DEFAULT_MAX_HP = 100 for
   "heal to full" pricing mismatches the actual default player maxHp (~20 before
   attributes) — inflates first-aid-kit valuation in the no-live-player path.

   Architecture

   5. Pricing is properly centralized. ✅
   getItemPrice is consumed by EarbucksShopSystem (catalog pricing), TollGateSystem (toll
   computation), and DevConsole — ShopConfig.js explicitly defers to it. Nothing
   re-prices items in dialog or trading code. This is the model the rest of the
   codebase's scattered constants (Review 22 grenade damage, Review 31 FUEL_VALUES)
   should follow.

   6. index.js is a dead legacy layer. ⚠️
   One consumer (EquipmentSlots.tsx) imports Item/createItemFromDef — both simple
   re-exports. Everything else is dead: the ITEM_TEMPLATES fallback table (with outdated
   entries — weapon.axe, armor.helmet, medical.pills, slot names like meleeWeapon that
   don't match the current EquipmentSlot vocabulary), the createWeapon/createArmor/...
   factories, createContainer, and the dev-only window.* globals including the dynamic
   import of the unrunnable __tests__/Container.test.js (Review 32). ~150 lines of
   obsolete code that also shadows the real catalog (its fallback shapes don't match
   ItemDefs).

   Testability

   7. None for either. ❌
   No GroundManager tests (add/remove/collect/quick-pickup/sort — all untested, including
   the #1 data-loss path), no pricing tests (free items, flat-vs-category precedence,
   per-unit computation from live instance state, spoiled-food question). Both are
   headless-friendly: GroundManager needs only a Container, and getItemPrice is a pure
   function.

   Priority recommendations

   1. High — Fix organizeByCategory: add the isAreaFree-scan + addItem fallback from
      sortGroundItems (or call addItem on failure) (#1); add a regression test that
      organizes 10+ items with one forced to overflow.
   2. Medium — Guard engine.gameMap in the two error paths, or replace the lazy import
      with the same static-import pattern other systems use if the cycle is actually
      breakable (#3).
   3. Medium — Delete the dead half of index.js (templates, factories, window globals);
      point EquipmentSlots.tsx at the real modules (#6).
   4. Low — Add pricing tests; decide spoiled-food pricing and the DEFAULT_MAX_HP value
      (#4).
	  
	   Review 36 · TradingSystem & EarbucksShopSystem

   Files reviewed: client/src/game/systems/TradingSystem.js (340 lines),
   EarbucksShopSystem.js (164), TollGateSystem.js (143)

   Summary

   Three small, focused systems with clean session lifecycles (register on start,
   unregister + unsubscribe on cleanup — no leaks found). The headline finding: the
   barter system does not use ItemPricing at all — it runs a second, ad-hoc point economy
   (rarity-based + flat bonuses) that diverges wildly from Earbucks prices, so the same
   gun is worth 40-100 Earbucks at the shop but 6-15 "points" in a trade. The shop and
   toll gate, by contrast, are disciplined ItemPricing consumers with correct stock and
   payment handling. Zero tests for any of the three.

   Correctness

   1. TradingSystem has its own hard-coded valuation. ⚠️ (the big finding)
   getItemValue computes barter "points": ammo 1/unit, food by nutrition (+hydration/2),
   everything else rarity-based (1/2/5/10) with +5 for guns/tools/backpacks. Nothing
   references getItemPrice. Consequences: (a) two economies with unrelated exchange rates
   — a battle rifle is 75 Earbucks at the shop but ~15 points in barter, so a player can
   buy low and trade fair at a fraction of the cost (or vice versa); (b) the
   nutrition-based food valuation double-counts water containers against the shop's
   per-unit pricing. If barter-vs-currency divergence is intentional design, it needs a
   comment explaining the exchange model; if not, getItemValue should delegate to
   ItemPricing with a multiplier.

   2. Trade execution is safe but not atomic — and doesn't need to be. ✅
   Removes from offer containers first, then delivers with drop-at-feet fallbacks on both
   sides — no duplication path, no loss path. Single-threaded turn execution makes
   mid-transfer crashes the only risk, and the fallbacks cover even that. canTrade
   requires youPoints ≥ theyPoints (or free items for nothing) — the NPC always accepts a
   "fair" offer; there's no greed/personality model, which is fine but worth noting as a
   design ceiling.
   3. Shop: correct order of operations. ✅
   buyItem checks stock → funds → creates item → adds to inventory first → only then
   deducts Earbucks and increments purchased. "Inventory full" never charges the player.
   Finite stock is tracked per map in mapEntry.metadata.shopCatalog (persisted with map
   metadata), infinite stock via stock: null, and prices are re-synced from ItemPricing
   on every catalog init — including old saves — with the in-place mutation comment
   explaining the useSyncExternalStore identity requirement.
   4. Toll gate: correct and conservative. ✅
   Deposit value computed with getItemPrice per item instance (live state — loaded ammo
   counts, water fill counts). pay() refuses when short, clears the deposit only on
   success, sets tollPaid (which is in SERIALIZED_FIELDS — persists, Review 13), and
   moves the guard aside via gameMap.moveEntity (the single write point, Review 8).
   Faction standing is correctly unaffected by paying — the escalation path is attacking,
   not transacting (Review 26's provokeTargetFaction). Deposit persists on cancel so the
   player can return with more. The re-registration guard against updateDynamicContainers
    wipes (with re-entrancy flag) is a documented workaround for the Review 33 container
   lifecycle.
   5. Session hygiene is clean across all three. ✅
   Trading: cancels any prior trade on start, unregisters containers and unsubscribes
   inventoryChanged on cleanup. Toll: same pattern plus the re-register guard. Shop:
   stateless per call. No subscription leaks found.

   Architecture

   6. No UI logic; correct delegation. ✅
   TradingSystem holds transaction state and exposes getTradeState/validateMove for the
   UI — the barter drag-rules match the moveItem-level guards (Review 33), so there are
   two consistent enforcement layers. All inventory changes go through InventoryManager
   or Container APIs; no direct grid mutation. TradingSystem is a module singleton
   subscribing TRADE_REQUESTED/TRADE_CANCELED at import time (constructor side effect on
   the engine singleton) — legacy-compat per its own comment, flagged for phase-out.
   7. Pricing centralization holds — except finding #1. ✅/⚠️
   Shop and toll never store prices (they re-read from ItemPricing, with the shop's
   comment explaining why). The barter system is the one place that didn't get the memo.

   Testability

   8. Nothing. ❌
   No tests for: successful trade, unfair-trade rejection, cancel-returns-items,
   insufficient funds, out-of-stock, price re-sync on old saves, toll
   payment/sidestep/persistence, or the barter/Earbucks valuation relationship (#1). All
   three systems are instantiable headless with a mock engine/InventoryManager —
   TradingSystem's engine-singleton constructor makes it slightly awkward, but
   EarbucksShopSystem and TollGateSystem take everything by parameter.

   Priority recommendations

   1. High — Resolve the two-economy divergence: either make getItemValue delegate to
      ItemPricing (with a barter-rate multiplier if barter should be cheaper) or document
      the intentional exchange model (#1). Add a test pinning whatever the answer is.
   2. Medium — Add the core test matrix: trade success/cancel/unfair, shop
      insufficient-funds/out-of-stock/inventory-full ordering, toll short-pay refusal and
      successful pay → guard sidesteps + tollPaid persists (#8).
   3. Low — Move the TradingSystem's engine-event subscriptions out of the module-load
      constructor (explicit init()) to make it test-friendly (#6).

 Review 37 · SurvivalCascade

   File reviewed: client/src/game/utils/SurvivalCascade.js (368 lines), plus callers and
   config

   Summary

   A compact, well-documented module implementing a genuinely coherent design: survival
   state affects gameplay entirely through the attribute layer (vitals deficit →
   attribute scaling → derived maxHp/maxAp), with every formula single-homed and
   explained. The "match ProgressionConfig" question has a clean answer — there's nothing
   to match; these constants live only here, with tuning guidance in the comments. The
   concerns: AP_FLOOR is mathematically dead, the player's Vision.range write may
   duplicate the GameEngine's own perception bonus, hp = 0 is set directly at infection
   death (bypassing the damage pipelines), and there are no unit tests for any status
   effect.

   Correctness

   1. The cascade order and rates are internally consistent. ✅
   Deficit average across nutrition/hydration/energy → up to 50% attribute reduction
   (CASCADE_MAX_PENALTY) → per-attribute condition multiplier → treatment
   multiplier/immunity → sickness penalties subtracted last, floored at 0. Sickness and
   wound infection share one channel and take the max rather than stacking (documented as
   deliberate). Untreated infection: flat 10% all-attribute debuff; treated: per-subtype
   or stew effects map. The deriveSecondaryStats reconciliation (cap change applies the
   delta to current hp/ap like damage/healing, clamped) is correct, and HP_FLOOR
   guarantees the cascade itself can never kill — good design, correctly implemented.

   2. AP_FLOOR is dead. ⚠️
   newMaxAp = Math.max(AP_FLOOR=5, AP_BASE=10 + bonus) — bonus is always ≥ 0, so the
   floor can never bind. Either AP_BASE should be lower, or the constant should go.

   3. Bleeding and starvation damage don't live here — correctly, but note the split. ℹ️
   Bleeding (takeDamage(1)/turn) and vital decay (modifyStat(-1)) happen in GameContext's
   per-turn processing; this module is purely the attribute derivation. The split is
   fine, but it means "the cascade" as a gameplay concept is spread across two files —
   the header here should probably say so explicitly (it comes close).

   4. Infection death bypasses the damage pipeline. ⚠️
   tickInfection sets player.hp = 0 directly (line 323) — no takeDamage, so no
   lastAttacker, no damage events, no armor consideration (correct thematically), and
   death detection depends on the next death sweep. It works (Review 20's sweep catches
   it), but a takeDamage(hp, {id:'infection', type:'status'}) would route it through the
   same channel as bleeding.

   5. Possible double perception→vision bonus. ⚠️
   recalcCharacter sets the player Vision component's range = 15 + floor(perception/20) —
   but the player's actual FOV is computed in GameEngine.recalculateFOV, which adds its
   own floor(perception/20) bonus from currentPerception (Review 17) and doesn't read the
   Vision component's range. So either the component write is dead (most likely — nothing
   reads the player's Vision.range for FOV) or something double-counts. Worth one
   verification and a comment either way.

   6. Cure rolls and stew math are correct. ✅
   woundInfectionCureChance: base + Con-step + sleep bonus, clamped [0.02, 0.95], shared
   by awake/asleep paths (the deduplication the comment promises).
   computeBrainstemStewTreatment: per-stem dilution, additive stacking, per-attribute 15%
   cap, immunity propagation, hours = stems × 6 — matches the CraftingManager consumer
   (Review 34) exactly.

   Architecture

   7. Mutates-in-place but otherwise clean. ✅/ℹ️
   Not a pure function — applySurvivalCascade/deriveSecondaryStats write
   current*/max*/hp/ap onto the passed player. But: no engine import, no globals, no UI,
   seeded RNG for the one random roll, and everything is callable headless. The
   player-only guard is documented prominently (NPCs read 0 through facades → full
   deficit → halved stats — the comment at lines 12-15 explains exactly why not to call
   it on NPCs). Three callers share the same path (GameContext per-turn, SleepContext
   per-hour, EntityFactory at creation) — the single-source claim in the header checks
   out.

   8. Constants are single-homed with tuning docs. ✅
   No ProgressionConfig duplication to drift from — the survivability dials (HP_PER_CON,
   AP_ATTR_DIVISOR, caps) live here with comments saying what to bump. TREATMENT_EFFECTS
   is a clean data table with per-subtype shapes matching the stew consumer.

   Performance

   9. O(1). ✅
   A handful of divisions, floors, and one table lookup per call — runs once per turn and
   once per sleep hour.

   Testability

   10. Nothing. ❌
   deriveSecondaryStats is imported by the balance sim (used, not asserted). No tests
   for: deficit scaling at 0%/50%/100%, sickness taper and caps, sick+infected
   max-not-stack, treatment immunity shielding condition penalty, hp/ap reconciliation on
   cap change, infection countdown to death, wound cure odds, or the stew treatment math.
   Every one of these is a pure-ish function of a player-shaped object — the easiest test
   file to write in this whole review series.

   Priority recommendations

   1. High — Add the cascade test suite: deficit scaling, sickness taper, sick+infected
      non-stacking, cap reconciliation, infection death, cure odds, stew math (#10).
   2. Medium — Verify the player Vision.range write is dead or deduplicate it against the
      GameEngine FOV bonus (#5); route infection death through takeDamage (#4).
   3. Low — Remove or repurpose AP_FLOOR (#2); note the GameContext split in the header
      (#3).
	  
	   Review 38 · AttributeProgressionManager

   Files reviewed: client/src/game/systems/AttributeProgressionManager.js (194 lines),
   client/src/game/config/ProgressionConfig.js (121 lines)

   Summary

   A small, well-documented progression manager: value-based XP curve (6·value^1.5) with
   diminishing returns built in, correct accumulate-then-spend bookkeeping, and
   persistence through the RpgStats component. The action catalog's comments record the
   balance history honestly (the CRAFTING_SKILL_UP and TAKE_DAMAGE nerfs). Two
   determinism violations stand out against the project's own seeded-RNG convention: the
   1d3 stat roll uses Math.random(), and getProgressionForMap rolls gameRandom inside a
   config getter, so the same map number yields different zombie counts on different
   calls.

   Correctness

   1. XP accumulation and thresholds are correct. ✅
   Progress is tracked as xpGained − xpSpent per attribute; when it crosses
   getRequiredXP(base), a roll is offered. rollAttribute spends exactly the required
   amount (progress beyond the threshold carries over, so multiple queued rolls work),
   rolls 1d3, caps both base and current at 100, recomputes derived stats via
   recalcCharacter, and emits ATTRIBUTE_UPGRADED. The curve makes high stats
   progressively expensive as documented.
   2. Persistence survives save/load. ✅
   All XP and spent-counters live in the RpgStats component (Review 13 confirmed it's in
   the component registry and serialized), so progress rides the normal component
   serialization. Base-stat increases are written to the component, and current* values
   are recomputed by the cascade anyway — no dual-write drift.
   3. Math.random() for the 1d3 roll. ❌
   Line 174: Math.floor(Math.random() * 3) + 1 — the project's convention is gameRandom
   everywhere (loot, AI, map gen), and Review 31 already flagged createItemFromDef for
   the same breach. Stat rolls are exactly the kind of thing a seeded run should
   reproduce (balance sims, bug reports). One-line fix: gameRandom.nextInt(1, 3).
   4. getProgressionForMap is non-deterministic per call. ⚠️
   For maps beyond 5, runnerCount/peeperCount are rolled with gameRandom.nextInt inside
   the getter (lines 108-109). It's called by WorldManager, the editor, and the spawner
   pipeline — each call returns different counts for the same map, and it consumes the
   shared stream, so how many times it's called shifts downstream RNG (the Review 9
   sequence-coupling again). Roll once per map and cache, or derive deterministically.
   5. ATTRIBUTE_ROLL_READY is level-triggered, not edge-triggered. ⚠️
   applyXP emits the event on every XP gain past the threshold until the player rolls — a
   grinding session re-fires it dozens of times. If the UI shows a prompt per emit,
   that's notification spam; it needs an "already notified" flag or edge detection.

   Architecture

   6. Right side-effect profile. ✅
   Not a pure calculator — it emits GameEvents (fire-and-forget, per the Review 3 model),
   calls notifyChange, and runs recalcCharacter — but all side effects are appropriate to
   a progression manager, player-gated, and RpgStats-gated (recordAction no-ops for
   non-players and component-less entities). The manager itself holds no state.
   7. Action catalog is honest and maintainable. ✅
   Fourteen named actions with per-action magnitude comments and the balance rationale
   where it matters. Unknown actions warn and return. ProgressionConfig's map table +
   fallback formula is clean apart from finding #4, and the "no more double-scaling"
   comment explains the fallback's shape.

   Testability

   8. Nothing. ❌
   No tests for getRequiredXP curve values, threshold crossing, roll spending, the 100
   cap, multi-roll carry-over, recalcCharacter being invoked post-roll, or save/load
   persistence of XP. facades.test.js covers crafting skill progression (a different
   system). All of rollAttribute's logic is testable with an EntityFactory player and a
   seeded RNG — including a determinism test that would have caught finding #3 (same seed
   → same rolls).

   Priority recommendations

   1. High — Replace Math.random() with gameRandom.nextInt(1, 3) (#3); add the level-up
      test: accumulate to threshold, roll, assert spend + cap + persistence round-trip
      (#8).
   2. Medium — Make getProgressionForMap deterministic: cache rolled counts per mapNumber
      or derive without RNG (#4).
   3. Low — Edge-trigger ATTRIBUTE_ROLL_READY (#5).
   
   
   Review 39 · GameSaveSystem

   File reviewed: client/src/game/GameSaveSystem.js (882 lines), plus
   test/serialization/saveload.test.js

   Summary

   A comprehensive, well-defended save system: full state coverage (map, world,
   inventory, RNG stream state, quest/event/faction state, interaction state), a
   three-tier storage fallback (Electron IPC → IndexedDB → localStorage+gzip) applied
   consistently across save/load/delete/list/chunks, and a documented anti-save-scum RNG
   restore. The weak spots: no migration path (a hard version floor, older saves rejected
   outright), corrupt saves fail silently (every error becomes "no save found"), a stale
   DEFAULT_PLAYER_STATS, two dead restore helpers, and exactly one map-level round-trip
   test — nothing tests GameSaveSystem itself.

   Correctness

   1. State coverage and ID stability are good. ✅
   Everything Reviews 13, 25, 29, 34 flagged as stateful is captured: entity/item IDs
   preserved through fromJSON, gameRandomState (RNG stream position, distinct from the
   seed — with the comment explaining why re-seeding would make every load replay
   identically), craftingQueue (closing Review 34's persistence question),
   quest/event-runner state, faction stance deltas (restored in the correct order: reset
   → authored defs → deltas), dragging/riding/sleep/flashlight/weather. Map/Set handling
   is correct throughout: hostileOverrides Set→Array, container items Map→Array,
   activeScents/activeFires Sets→Arrays, stance deltas as plain objects. The
   zombieTracker is not saved — rebuilt on load, acceptable.

   2. Corrupt or missing data: loud in loadGameState, silent in loadFromStorage (answers
   specific question 2). ⚠️
   loadGameState correctly throws on: missing version/gameMap, version below floor, and
   no player in the map. But loadFromStorage wraps everything in one catch → return null
   — so a corrupted save is indistinguishable from an absent one. The user sees "no save"
   (or a silent slot in the list) instead of "this save is corrupted." Individual missing
   fields degrade gracefully (defaults for turn, playerStats, metadata). One line
   separating "not found" from "parse/validation failure" would fix the UX.

   3. Version gate exists; migration does not (answers specific question 1). ⚠️
   CURRENT_VERSION = MIN_SUPPORTED_VERSION = '1.1.0' — saves below the floor are rejected
   with an error, and there are no migration functions. What passes for migration is
   field-level backward compatibility inside the deserializers (legacy re-seed fallback,
   legacy isHostile handling in Entity.fromJSON, legacy item conversion in GameMap).
   That's fine while the floor equals the current version — the day the format changes,
   the choice is "bump MIN and abandon old saves" or "build the migration layer that
   doesn't exist yet." Worth deciding explicitly now.

   4. DEFAULT_PLAYER_STATS is stale. ⚠️
   hp: 100, maxAp: 12 (lines 7-19) contradicts EntityFactory.createPlayer (Health 20/20,
   AP from attributes ~20). It's used when saveData.playerStats is absent — a legacy-save
   path — so a stale default could overwrite correct values if playerStats is ever
   applied to a fresh player. Also the whole playerStats block is redundant with the
   player entity's own serialized components; nothing in loadGameState applies it to the
   entity (it rides along in gameComponents for the caller).

   5. Dead helpers. Minor.
   restorePlayerFromJSON and restoreCameraFromJSON have zero callers — the real paths use
   GameMap.fromJSON and new Camera(...).

   Architecture

   6. Reaches into ~15 engine internals. ⚠️ (accepted trade-off, but name it)
   engine.bookStats, craftingQueue, questState, isSleeping, sleepProgress,
   targetingItemInstanceId, isFlashlightOn, dragging, riding, weatherManager, gameMap,
   gameSeed... GameSaveSystem knows the shape of every subsystem's state. That's how save
   systems usually grow, and it works — but every new piece of engine state must remember
   to add itself here (the craftingQueue/bookStats/questState additions show the pattern
   working). A registry (subsystem.serialize()/deserialize()) is the standard refactor;
   medium priority at most.
   7. Storage abstraction is the file's strength. ✅
   One fallback chain reused identically by save/load/delete/list/chunks; IndexedDB
   wrapper is careful (per-request error handling, cursor-based chunk cleanup);
   compression only where quota matters (localStorage); Electron path stores raw JSON via
   the whitelisted IPC (matches the Review-AGENTS security model). Chunked per-map
   storage for inactive maps avoids re-serializing the world on every save.

   Performance

   8. Synchronous serialization, async storage. ℹ️
   saveGameState stringifies the full map + world on the main thread (size logged — the
   codebase's own telemetry). With the big templates (~85×125 tiles + entities) that's a
   noticeable but one-off hitch per save; storage I/O is async after. Per-chunk
   JSON.stringify runs on every save for every inactive map (line 531) even though
   serializedMap/compressedMap are already cached strings — wrapping cached data in
   another object and re-stringifying adds avoidable work proportional to map count.
   listSaveSlots decompresses every localStorage save to read metadata — slow with many
   saves, rare path.

   Code Quality

   9. Version constants, error taxonomy, and logs. ⚠️
   Semver-lite comparison is correct. Errors are logged with context everywhere (55
   console calls — Review 4's noise theme applies). The failure taxonomy is the weak spot
   (#2): three distinct conditions (absent / unreadable / incompatible) collapse into one
   null.

   Testability

   10. One map-level test; nothing at the system level. ❌
   saveload.test.js verifies player maxAp survives GameMap.toJSON→fromJSON — map layer
   only. loot_restoration.test.js covers loot restore. Missing: full saveGameState →
   loadGameState round-trip (player stats, inventory, RNG state, faction deltas),
   version-floor rejection, corrupt-JSON handling (#2), missing-player rejection, RNG
   stream continuity (same rolls after load), and chunk save/load. The system is static
   and headless-compatible apart from the storage tier (injectable via the same
   idbStore/electronAPI seams it already abstracts).

   Priority recommendations

   1. High — Add the round-trip test: seed → play a few turns → saveGameState →
      loadGameState → assert player/map/inventory/RNG-state/faction equality (#10); add
      version-rejection and corrupt-save tests (#2, #3).
   2. Medium — Distinguish "no save" from "corrupt save" in loadFromStorage's return
      (#2); fix or delete DEFAULT_PLAYER_STATS (#4).
   3. Medium — Decide the migration policy before the next format change: either keep MIN
      == CURRENT deliberately (documented as "saves are version-locked") or add a
      migration hook (#3).
   4. Low — Delete the two dead restore helpers (#5); skip re-stringifying cached chunk
      data (#8); route save/load logs through the scoped logger (#9).
	  
	  
   Review 40 · GameInitializationManager

   File reviewed: client/src/game/GameInitializationManager.js (505 lines), full file

   Summary

   The four-phase sequence is correctly ordered and awaited, with a clean success path
   (phases → engine.sync → complete event → error-tolerant post-init callback) and a
   genuine reset/destroy lifecycle. The failure handling has a real gap: the return false
    path from a failed phase never records an error or transitions to ERROR state —
   callers reading getError() get null. The manager is about 70% orchestrator, with ~130
   lines of inline logic (starting equipment, dev-stat application, start-position
   resolution, transition cleanup) that belong in subsystems. No tests exercise it at all
   — the harness bootstraps around it.

   Correctness

   1. Phase sequencing is correct. ✅
   IDLE guard → seed setup → PRELOADING → CORE_SETUP → WORLD_POPULATION → COMPLETE →
   engine.sync(gameObjects) → initializationComplete → post-init callback (whose failure
   is logged but never fails the init). Each phase awaits the previous; engine.sync runs
   only on full success, so a failed init can't half-sync the engine — the orphaned
   GameMap/WorldManager stay detached. reset()/destroy() restore IDLE with listeners
   cleared, so retry works.

   2. The graceful-failure path drops the error. ⚠️ (the main finding)
   if (!preloadSuccess) return false; (and the same for core/population) returns false
   without setting this.error, transitioning to ERROR, or emitting initializationError —
   those only happen in the catch path. Today the phases either return true or throw, so
   the gap is latent — but the first phase that returns false gracefully (e.g., a future
   "map generation failed" soft-fail) will produce a silent, stateless failure stuck in
   whatever phase it died in, with getError() returning null to the UI. Either remove the
   boolean paths (throw instead) or route them through the same error handling.

   3. Seed handling is right. ✅
   customConfig.seed → scenarioData.seed → Math.random() — the Math.random fallback is
   legitimate here (a fresh game needs entropy), and gameRandom.seed(gameSeed)
   immediately after makes everything downstream deterministic. Consistent with the
   Review 9 model.

   4. addEntity failure is logged and ignored. ⚠️
   "Continue anyway, player position is tracked separately" (line 288) — if
   gameMap.addEntity(player, ...) ever fails, the game boots with a player entity that
   isn't on the map (the Review 8 ghost-player scenario). Start-position validation at
   lines 225-226 makes OOB unlikely, but "log and continue" is how you get invisible
   players. This should fail the phase.

   5. _transitionToState sleeps 10ms per phase. ℹ️
   Four arbitrary setTimeout delays "to allow event listeners to process" — UI pacing,
   not synchronization, so it's not the AGENTS.md anti-pattern in spirit, but it's 40ms
   of迷信 that does nothing structural.

   Architecture

   6. ~70% orchestrator, with pockets of subsystem logic. ⚠️
   The big pieces are properly delegated (map generation, player creation, spawning,
   loot, world management). The inline pockets: starting equipment (~65 lines of item
   creation/equipping — a StartingLoadout module's job), dev-console stat application
   (~20 lines duplicating milestone logic from PlayerSkills), start-position resolution
   (~20 lines), south-transition cleanup (~15), and _spawnInitialZombies's progression
   scaling (~30). None are wrong; all are how this file grows to 1,000 lines. Also note
   player.id is overwritten post-construction (customStats?.id || 'player-1') — harmless
   but a Post-it on the Entity ID model.

   7. Lifecycle and eventing are correct. ✅
   Extends the plain EventEmitter (not the singleton — instance events, right choice),
   mirrors state to engine.initializationState via updateProperty, emits per-phase
   transitions, and the ERROR state is reachable from the catch path. The instanceId
   logging shows the duplicate-init ghost hunt this file survived (matches Review 8's
   duplicate-player alarms).

   Testability

   8. Nothing. ❌
   Zero references in test/ — GameHarness bootstraps its own minimal world instead.
   Untested: full sequence success, scenario vs template branching, phase-failure error
   recording (#2), IDLE-state re-entry rejection, seed propagation, starting-equipment
   contents, and the addEntity-failure path (#4). The class is instantiated per init and
   takes config — mockable with a stub TemplateMapGenerator.

   Priority recommendations

   1. Medium — Unify failure handling: make graceful phase failures set the error and
      transition to ERROR (or throw) (#2); make addEntity failure fail the phase (#4).
   2. Medium — Add a sequence test with a mock map: success path + one failing phase,
      asserting state transitions and getError() (#8).
   3. Low — Extract starting equipment and dev-stat application into a loadout module
      (#6); drop the per-phase setTimeout delays (#5).
	  
	    Review 41 · WorldManager & GameEngine

   Files reviewed: client/src/game/GameEngine.js (711 lines),
   client/src/game/WorldManager.js (1,031 lines, key sections)

   Summary

   GameEngine is a disciplined singleton with an unusually careful reset() (unsubscribes,
   cleans up the old WorldManager, cancels the heartbeat, and — critically — flushes
   in-flight animation promises so TurnManager can't wedge, with the comment explaining
   the bug that taught it). WorldManager is a well-built multi-map store with async
   compression, memory purging of inactive maps, race-safe compression locks, and
   storage-chunk fallback. The honest answers to the review's questions: GameEngine is
   not a thin facade (it owns FOV computation, the animation heartbeat, and React
   snapshot bridging), WorldManager is not the entity authority (correctly — GameMap is),
   and the engine class itself is not exported, making true test isolation impossible.

   Correctness

   1. Singleton: safe in production, unguarded in HMR. ✅/⚠️
   One module-level instance; reset() handles re-initialization without leaking (old
   listeners off, old WorldManager cleaned, heartbeat cancelled, actions flushed). But
   unlike GameEvents (which persists on window across HMR, Review 3), GameEngine has no
   HMR guard — hot-replacing its module creates a second engine whose listeners and
   heartbeat compete with the first's. Dev-only issue; worth the same GLOBAL_KEY pattern
   GameEvents uses.
   2. sync() handoff is leak-free. ✅
   Player/inventory listeners are detached before reattaching, the old WorldManager is
   cleaned up, pending visual actions are resolved-and-dropped (the flushActiveActions
   invariant, cross-referenced in TurnManager — the two files' comments cite each other
   correctly).
   3. WorldManager tracks maps, not entities — correctly. ✅
   The review's "single authority for entity lifecycle" premise is misdirected: GameMap
   owns entities (Review 8 — add/remove/index/death-sweep), WorldManager owns the map
   collection (save/load/compress/transition/catch-up). Within its actual job, cleanup is
   thorough: cleanup() unsubscribes ZOMBIE_DIED, clears maps and compression locks,
   removes listeners. Dead-entity cleanup happens in GameMap's death sweep, as it should.
   4. Catch-up turns run with turn = 1. ⚠️
   _loadMapInternal calls gameMap.processTurn() with no arguments for each missed turn
   (line 235) — but processTurn(player, isSleeping, turn, ...) defaults turn = 1, so
   catch-up decay/daylight calculations always use turn 1's hour, and player = null
   (ZombieReplenishment correctly skips, but survival-side effects that read player would
   too). Pass the real per-missed-turn number.
   5. Compression race is mostly locked. ℹ️
   compressionLocks are awaited before load ✓, failure falls back to keeping raw JSON ✓.
   Residual race: two rapid saveCurrentMap calls for the same map spawn two compressions;
   the older promise can resolve last and write stale compressedMap. Low probability
   (saves are turn-driven), one-line guard (compare promise identity before writing).

   Architecture

   6. GameEngine is a state hub, not a facade. ⚠️
   Beyond references and the pulse system: ~180 lines of FOV computation (Review 17), the
   requestAnimationFrame heartbeat driving all animation, bookStats derivation from
   ItemDefs, weather state, getSnapshot/subscribe React bridging, and
   window.gameEngine/globalThis.gameEngine exposure (the coupling channel Reviews
   32/34/35 found Item, GroundManager, and CraftingManager using). The
   pulse/_uiDirty/snapshot machinery is genuinely good (single dirty-check per frame for
   useSyncExternalStore). The FOV block is the clear extraction candidate — it already
   has a config module (VisionConfig) and a system neighbor (VisionSystem).
   7. WorldManager's memory discipline is excellent. ✅
   Inactive maps hold only compressed data (raw JSON purged), chunk loading falls back to
   storage when a save slot is set, toJSON serializes only metadata (map bodies live in
   chunks — consistent with Review 39's design), transitions exclude the player via
   fromJSONSelective (preventing duplicate players — the same bug class Review 8 found in
   the selective-restore path), and reciprocal transition stamping re-saves through the
   normal pipeline.
   8. Entity queries: indexed at the map level, unindexed by component. ✅/ℹ️
   getEntitiesByType is O(matches) via the type index (Review 8); there is no
   component-level index — VisionSystem/AISystem filter hasComponent per entity per pass
   (O(E) per query, the ECS-lite reality). Entity iteration otherwise avoids repeated
   passes where it counts (single ecsEntities list per cycle, Review 29).

   Testability

   9. The singleton is importable but not isolatable. ⚠️
   Only the instance is exported — the GameEngine class is not. Tests share the one
   global engine (hence fileParallelism: false in vitest.config) and must carefully
   restore state; GameHarness works around it by rebuilding world state on the shared
   instance. Exporting the class (while keeping the default singleton) would let tests
   construct fresh engines with no global pollution — a two-line change with large
   test-hygiene payoff. WorldManager, by contrast, is a proper class and instantiable —
   fromJSON even returns a new instance.

   Priority recommendations

   1. Medium — Export the GameEngine class alongside the singleton (#9); add the HMR
      GLOBAL_KEY guard for parity with GameEvents (#1).
   2. Medium — Pass the actual turn number into catch-up processTurn calls (#4).
   3. Low — Guard the compression-promise write against stale resolution (#5); extract
      the FOV block toward VisionConfig/VisionSystem when it next changes (#6).
	  
	   Review 42 · Quest System

   Files reviewed: EventRunner.js (655 lines), QuestState.js (224), conditions.js (51),
   eventTypes.ts (208), migrateEvents.js (208)

   Summary

   The newest major subsystem — and it shows. The event model is fully data-driven with a
   documented TypeScript schema, conditions are deliberately engine-free for testability,
   the one-run-at-a-time mutex with firedOnce/autoResolved latches is thoughtfully
   designed (including the self-restart exclusion and the cross-map lock cleanup), and
   migration handles both legacy shapes with honest warn-and-drop semantics for
   unrepresentable content. The real defect: no cycle detection in event chaining — a
   chain cycle of non-blocking steps recurses synchronously until stack overflow. There's
   also no runtime schema validation, and test coverage is limited to the two step types
   that already bit someone.

   Correctness

   1. Conditions gate every trigger path. ✅
   _isEligible applies all four gates in order: steps present → repeat:'once' latch →
   autoResolved latch → endWhen passing (which sets the latch, permanently retiring the
   event) → preconditions. conditions.js is pure: explicit ctx, AND-only with documented
   vacuous-truth, six condition kinds plus comparison ops. Unknown condition kinds return
   false (safe direction: event never fires).

   2. Simultaneous events can't conflict — but chains can cycle forever. ⚠️/❌
   The activeRun mutex blocks concurrent runs everywhere (runEvent, checkAutoEvents,
   checkAndFireAt, checkAndFireOnInteract). The chain step correctly releases the slot
   before starting the chained run, and _endRun's excludeId prevents a still-eligible
   auto event from restarting itself with no gap. What's missing: cycle detection. Chain
   A→B→A (or A→A) of non-blocking steps (setFlag/give/chain with no dialog/speech/wait)
   recurses synchronously — _processCurrentStep → runEvent → _processCurrentStep → …
   until the stack blows. With blocking steps it's an infinite player-paced loop instead.
   One visited-set per chain (or a chain-depth cap like IntentQueue's maxDepth) closes
   it.

   3. Locks are soft-lock-proof by design. ✅
   lockMovement/lockActions track their own until conditions, auto-clear reactively on
   move/inventory/quest-state change, onMapTransition clears all locks (the comment
   explains the permanent-stuck scenario this prevents), and explicit unlock* steps clear
   unconditionally. The movement-vs-actions lock distinction is documented (End Turn
   stays available under lockActions — because ap-gated locks expect that escape).
   Someone thought hard about soft-locks here.

   4. Migration covers both legacy shapes honestly. ✅
   migrateLegacyEvents up-converts eventTriggers (including chainOnly) and bubbleEvents
   (tile + proximity) into unified events; resolveMapEvents prefers the canonical
   events[] when present; downconvertEvents drops what legacy can't represent
   (setFlag/setVar/lock/wait steps, proximity+dialog combos, whileConditions repeat) —
   each drop with a specific console.warn naming the event and the reason. Silent data
   loss it is not.

   5. Small holes. ⚠️
   • moveEntity's blocked-tile fallback force-snaps targetEntity.moveTo(next.x, next.y) —
     teleports through whatever blocked it (walls included). A fail-safe that can put an
     NPC inside a wall; better to abort the walk and skip the step.
   • wait uses token-checked setTimeout — cancel-safe ✓, but it's another wall-clock
     dependency in a turn-based engine (acceptable for UI pacing).
   • _resolveEntity matches NPCs by name — two NPCs sharing a name resolve to whichever
     comes first in entityMap order; registryTag is the unambiguous path but nothing
     warns on ambiguous names.

   Architecture

   6. Fully data-driven; engine-coupled but honestly so. ✅/ℹ️
   No per-event hard-coded logic — the runner is a pure interpreter over the
   eventTypes.ts schema (17 step types, all data). It does not decouple from the engine:
   it imports the singleton and mutates engine.turnPhase/movementLocked/actionsLocked
   directly (that's how PAUSED_FOR_EVENT enters/exits — the mechanism Review 30 verified
   is symmetric: set at runEvent, restored at _endRun). Conditions get their ctx
   injected, so the evaluator is engine-free even though the runner isn't — the right
   half of the split to have.
   7. Subscription hygiene is correct. ✅
   Re-subscribes on engine.sync and reset() (managers are replaced per reset),
   unsubscribes first, persists only the durable latches (firedOnce/autoResolved) and
   deliberately not mid-turn UI state — each choice documented.
   QuestState.seedFromRegistry seeds only never-touched names via in (explicit false/0
   still counts as set — revisiting a map can't clobber progress; documented).

   8. applyMapRegistries is the right pattern. ✅
   One function applies a map's quest registry + faction definitions together "so they
   can never drift apart" — called at every map-ready point. This is the cure for the
   multi-place initialization disease other subsystems have.

   Code Quality

   9. Schema documented, not validated. ⚠️
   eventTypes.ts is thorough documentation (every step type's fields, placement kinds,
   repeat modes, the disposition-vs-stance distinction). But nothing validates an
   authored event at load: unknown step types warn-and-skip (graceful), a misspelled
   condition kind silently makes an event never fire, and there's no validateEvent() like
   validateFloorplan (Review 10) or the recommended scenario validator (Review 12). The
   editor constrains authors today; hand-edited scenario JSON has no safety net.

   Testability

   10. Only what already broke is tested. ⚠️
   applyNpcAIMode via npcAttackOnSight.test.js, controlEntity via keylocked_doors.test.js
    — regression tests from real bugs. Missing: evalCondition/evalAll unit tests
   (designed for it — pure ctx), quest progression (task auto-advance, manual-task
   protection at QuestState.js:113, rewards, seed no-clobber), migration round-trip
   (legacy → unified → downconvert), the chain-cycle case (#2), and lock auto-clear.
   conditions.js at 51 lines is the cheapest test file in the codebase to write.

   Priority recommendations

   1. High — Add chain cycle detection: visited event-id set per run chain, or a depth
      cap (#2). Test A→B→A and A→A.
   2. High — Add the conditions + progression test suite (#10).
   3. Medium — Add validateEvent/registry validation at map load: unknown step types,
      unknown condition kinds, dangling chain targets, unresolvable entity tags (#9).
   4. Low — Replace the moveEntity force-snap with step-abort (#5); warn on ambiguous NPC
      name resolution (#5).
	  
	   Review 43 · TileRenderer & TileChunkCache

   Files reviewed: client/src/game/renderer/TileRenderer.js (998 lines),
   client/src/game/renderer/TileChunkCache.js (141 lines), plus invalidation call sites
   in MapCanvas

   Summary

   The chunk cache is a well-designed optimization — 16×16 offscreen chunks, dirty-set
   rebuilds, zoom-gesture deferral with scale-blit, offscreen eviction with a margin
   ring, static/dynamic layer split (terrain baked; FOV/fire/night overlaid by
   MapCanvas). But it has a critical wiring gap: invalidateTile is dead code — nothing
   ever calls it. All invalidation is invalidateAll on theme/zoom/map/image changes, so
   gameplay-driven tile changes (explosion breaches a wall, a door is destroyed, terrain
   is edited) render stale chunks indefinitely. The renderer also carries ~250 lines of
   near-duplicate tile-drawing code across its two paths, which have already drifted
   behaviorally.

   Correctness

   1. Per-tile invalidation doesn't happen. ❌ (the big finding)
   TileChunkCache.invalidateTile exists with correct semantics (dirties the tile's chunk
   plus 8 neighbors, since edge walls read across borders) — and has zero callers.
   MapCanvas only calls invalidateAll, triggered by: theme change, furniture-opacity
   change, zoom settle, image reload, map change. Consequences:
   • ExplosionSystem breaches a wall (wall → floor, Review 22): the wall keeps rendering
     until the next zoom/theme/map change.
   • A door/window entity removed from an edge (explosion-destroyed, Review 22's door
     removal): the edge wall that should reappear stays suppressed (hasDoorOrWindowOnEdge
      is baked into the static chunk).
   • applyToGameMap's load-time changes are safe (chunk cache starts empty), so this only
     bites mid-game mutations.
     The fix is wiring, not design: GameMap.setTerrain and door/window removal paths need
     to signal invalidateTile (via the existing terrainChanged event or a direct call).

   2. Fog-of-war renders correctly. ✅
   The three states are right: unexplored → pitch black, explored-not-visible → 0.45
   black overlay, visible-at-night → blue tint. The static/dynamic split means FOV
   changes never trigger chunk rebuilds — correct and cheap. explored flags persist via
   tiles (Review 8).

   3. The two draw paths have drifted behaviorally. ⚠️
   drawTile (legacy, lines 220-517) and drawTileStatic (chunk path, 528-693) are ~250
   lines of near-identical wall/texture/decoration code with local-vs-world coordinate
   differences. They've already diverged: the light-mode globalAlpha = 0.25 guard checks
   tileSet !== 'b&w' in one path but not consistently in the other (line 303 vs 320 vs
   585), and the road-variant selection is written two different ways (if-chain vs
   ternary). Two paths rendering the same tile differently depending on zoom/state is
   exactly what duplication buys you.

   Architecture

   4. One benign mutation; otherwise pure. ✅/ℹ️
   The renderer writes tile._variantIndex (memoized grass/road sprite variant) onto Tile
   objects — a renderer mutating engine state, though the value is deterministic from
   coordinates and unserialized, so it's stable and harmless. Everything else is
   read-state→draw-pixels. Theme detection (document.documentElement.classList) runs per
   tile per frame in both tile paths; drawFurniture explicitly takes a theme parameter
   with a comment explaining why DOM queries per piece were removed — the fix applied
   there but not to the far hotter tile paths.

   5. Renderer layering is clean. ✅
   Terrain colors come from shared palette maps (not hardcoded hex, per the project's
   styling rule — with five theme variants); decorations, wall shadow/AO, CAD furniture
   are all presentation. No game rules.

   Performance

   6. The caching machinery itself is excellent. ✅
   Rebuild only on dirty or size change; evictOffscreen keeps a 2-chunk margin (the
   comment documents the pan-thrash it prevents); zoom changes scale-blit old chunks and
   rebuild crisp after a 120ms settle; furniture is baked via a spatial index rebuilt
   only when the array identity changes; unexplored tiles cost nothing (masked by
   overlay). This is the most performance-engineered file in the codebase — which makes
   finding #1 worse: the invalidation escape hatch was built and never connected.

   7. Per-tile DOM reads and the legacy path. ⚠️
   classList.contains per tile per chunk-build (fine at build time), but drawTile (the
   per-tile legacy path) still exists alongside the chunk path — if anything calls it per
   frame for many tiles, that's the slow path persisting. Worth checking whether it has
   any remaining per-frame callers and retiring it to a debug fallback.

   Code Quality

   8. Comments are strong. ✅
   The chunk cache header documents the invalidation contract (including the
   neighbor-dirty rationale); Perf Phase notes explain each optimization's motivation;
   the furniture theme parameter comment shows performance awareness; the CAD furniture
   drawing is procedural but readable. If anything, the file over-documents local
   reasoning while under-documenting the drawTile/drawTileStatic relationship (no
   "legacy, use drawTileStatic" marker).

   Testability

   9. Untestable as-is, but the cache isn't. ❌
   Canvas rendering needs a DOM, but TileChunkCache's invalidation logic (dirty set,
   neighbor dirtying, eviction margin, size-change rebuild) is pure Map/Set logic —
   testable headless with a stub canvas factory. Nothing covers it, and a test asserting
   "invalidateTile marks the 3×3 chunk neighborhood" would have kept #1 visible.

   Priority recommendations

   1. High — Wire per-tile invalidation: call invalidateTile (or emit/handle a
      map-mutation event) from setTerrain, edge-wall writes, and door/window removal
      (#1). Add the 3×3-neighborhood test (#9).
   2. Medium — Merge drawTile and drawTileStatic into one parameterized path; retire the
      legacy one (#3, #7).
   3. Low — Hoist theme detection to a per-frame value passed down (as drawFurniture
      already does) (#4); consider making _variantIndex computed-not-stored (#4).
	  
	  
	    Review 44 · EntityRenderer

   File reviewed: client/src/game/renderer/EntityRenderer.js (1,192 lines), plus the
   entity pass structure in MapCanvas.jsx

   Summary

   A dense but well-optimized renderer: per-frame caches for tile-item lookups
   (documented as Perf Phase 2), a clear dominant-item model so multi-item tiles render
   one sensible icon, theme checks throttled to frame rate, inverted-sprite and
   temp-canvas reuse, and careful animation math (movement interpolation, melee bump vs.
   ranged recoil, heard-but-unseen silhouettes anchored to logical tiles). Draw order is
   explicit and correct — but it lives in MapCanvas, not here. The main concerns:
   draw-order authority is split between two files, the player is shallow-copied every
   frame into a scratch object, and ctx.save()/restore() wraps every entity twice per
   frame.

   Correctness

   1. Draw order: correct, explicit, and split across files. ✅/⚠️
   MapCanvas runs five ordered passes: ground items → hover cursor → structures
   (doors/windows/place icons) → living entities → player last (always on top). Corpses
   are zombie.corpse items, so they correctly render in the ground layer beneath the
   living. The layering rule is exactly what the review asks for — but it's enforced in
   MapCanvas.jsx:539-660, not in EntityRenderer, which renders whatever it's handed in
   whatever order. Any future second caller (minimap, editor preview) must re-derive the
   same pass structure or get it wrong. A shared renderEntitiesInLayers(ctx, ...) would
   put the rule in one place.

   2. Visibility logic is carefully correct. ✅
   Transients (zombies/rabbits/NPCs) render only in active LOS; persistents
   (doors/windows/icons/items) stay in fog at 0.8 alpha; edge-aligned structures check
   their open-side neighbor for both exploredness and visibility; and the
   heard-but-unseen silhouette has two documented leak fixes — re-check LOS at the
   logical tile (not the tween position) and suppress during ANIMATING so the ghost
   doesn't appear during the zombies' own turn. This block (lines 298-346) is the file's
   best engineering: the comments explain the exact bugs each gate fixes.

   3. Dominant-item resolution is consistent. ✅
   One icon per ground pile, chosen by category tier (vehicles > backpacks > food > guns
   > medical > containers > firestarters > other) then footprint area, with def fallbacks
   for plain-data items. Non-dominant items return early — no overlapping tokens. The
   resolveItemMeta def-fallback handles the ECS/POJO duality (Reviews 8/13) correctly.

   Architecture

   4. Read-only except one channel. ✅/ℹ️
   No engine-state mutation except frameRenderFlags.hasPulser — a module-level write-only
   flag MapCanvas resets and reads each frame to decide whether to keep rendering (stun
   pulses, fire rings, heard blips). It's a documented, deliberate side channel ("so no
   call-site signature change is needed"). Everything else reads: visibility set,
   explored flags, tile items, entity state, item defs.

   5. Uses the frame cache, not the spatial index directly — and explains why. ✅
   Per-frame _frameItemCache/_frameDominantCache on the engine (set by MapCanvas, cleared
   per frame) collapse up to ~5 tile-item lookups per item entity per frame into one per
   tile. The fallback path (no frame cache) still works outside the render loop. This is
   the Review 8 spatial index used correctly — items-by-tile without re-scanning.

   6. Player scratch copy every frame. ⚠️
   Object.assign(playerRenderScratch, player) (MapCanvas.jsx:655) shallow-copies every
   enumerable property of the player entity — including the components Map reference and
   any large fields — each frame to override render position. It works (one entity), but
   it's fragile: any non-enumerable or getter-only state won't copy (the line-27 comment
   hints this was already a problem), and it's the kind of thing that breaks silently
   when the player entity gains a new field.

   Performance

   7. O(visible entities) with O(1) lookups. ✅
   One full-map entity iteration per frame with cheap bounds culling (logical+visual
   positions, with a malformed-entity guard that warns once rather than blanking the
   frame — another documented bug fix), then per-visible-entity work that's O(1) or
   O(items-on-tile) cached. Theme reads throttled to 16ms. Inverted sprites and the temp
   canvas are memoized. The one per-frame allocation pattern to note:
   ctx.save()/ctx.restore() wraps every entity twice (MapCanvas pass plus renderEntity
   internals) — correct (prevents alpha leaks) but ~2× the canvas state pushes of the
   minimum.

   8. Get-draw-data vs issue-draw-call: partially separated. ℹ️
   Sprite-key resolution (imageId → spriteKey with zombie-type and NPC-icon overrides)
   and geometry (draw size/position per entity class) are computed before the draw call,
   but they interleave with canvas state changes and lazy-load triggers
   (imageLoader.getItemImage fires mid-render — async, so next frame picks it up;
   acceptable). Not a clean two-phase split, but the lazy-load-on-miss pattern is
   consistent with TileRenderer.

   Code Quality

   9. The comments carry the file. ✅
   Frame-cache rationale, hearing-shadow gates, recoil-vs-lunge, malformed-entity
   resilience — each unusual choice has its bug history attached.
   drawDoor/drawWindow/drawGarageDoor/drawPlaceIcon are separate methods with consistent
   signatures. The file's size is mostly per-type drawing detail, which is the right kind
   of bulk.

   Priority recommendations

   1. Medium — Unify draw order in one place: extract the layer-pass structure into an
      EntityRenderer.renderEntitiesInLayers that MapCanvas calls, so future consumers
      inherit the ordering rule (#1).
   2. Medium — Replace the player scratch Object.assign with an explicit render-view
      object (position, type, subtype, animation fields) built per frame (#6).
   3. Low — Deduplicate the double ctx.save() per entity where profiling allows (#7);
      consider moving frameRenderFlags onto the engine for consistency (#4).
 Review 45 · EffectRenderer & SpeechBubbleRenderer

   Files reviewed: client/src/game/renderer/EffectRenderer.js (132 lines),
   client/src/game/renderer/SpeechBubbleRenderer.js (140 lines), plus the lifetime owners
   (VisualEffectsContext.jsx, MapCanvas bubble call site)

   Summary

   Two small, genuinely pure renderers — no state, no engine imports, no logic beyond
   easing math. The lifetime model is correctly layered: renderers read
   startTime/duration and draw; expiry is owned by VisualEffectsContext (a UI-layer React
   context), which filters dead effects out of its list every frame and only pushes React
   state when something actually expired (documented as Perf Phase 4). Speech bubbles are
   anchored to EventRunner's active speech step, so dismissal is structural — when the
   run advances or ends, the bubble is gone. Both are in good shape; the findings are
   nits.

   Correctness

   1. Effects expire and are removed — no accumulation. ✅
   VisualEffectsContext's rAF loop filters now - e.startTime < e.duration each frame;
   expired effects leave the ref list immediately and state updates only on change.
   Listeners unsubscribe on unmount (Review 3's cleanup pattern, honored). The real-time
   vs playback duplicate-flash risk (crimson flash from both ZOMBIE_KILLED and
   ZOMBIE_DIED) is deliberately gated — the real-time handler skips while
   GameMap.isSimulating is set (line 148), so a death flashes exactly once. That check
   reads awkwardly (engine?.gameMap?.constructor?.isSimulating) but works.

   2. Speech bubbles dismiss structurally. ✅
   MapCanvas renders eventRunner.getActiveSpeechStep() — a bubble exists only while a
   speech step is current in the active run. advance()/cancel()/_endRun() (Review 42,
   verified symmetric) remove it; there's no separate bubble lifetime to leak. appearedAt
    is supplied by MapCanvas's ref at activation, so the pop-in animation plays once per
   step. Empty text renders nothing (guard at line 17).

   Architecture

   3. Lifetimes in the UI layer — correct choice. ✅
   Effects are purely visual, so their state lives in a React context, fed by
   fire-and-forget GameEvents (the Review 3 model exactly: engine emits
   PROJECTILE_FIRED/MUZZLE_FLASH/ZOMBIE_KILLED; the context listens). TurnManager's
   context.addEffect path and the event path both converge here. No effect state in the
   engine means saves, simulation, and headless tests never see it. This is the
   architecture the rest of the renderers should be measured against.

   4. Truly pure renderers. ✅
   Neither file imports engine, GameEvents, or any state — EffectRenderer takes (ctx,
   effect, tileSize, currentTime), SpeechBubbleRenderer takes (ctx, bubble, tileSize,
   currentTime). Both are directly headless-testable with a mock 2D context.

   Performance

   5. No leaks, no per-frame React churn. ✅
   The documented Perf Phase 4 behavior (no per-frame setTick; canvas animates from
   startTime/duration; React state only on expiry) means a 20-effect combat burst costs
   zero React re-renders beyond expiry events. Effect objects are tiny; removal is a
   filter over a small list. ctx.save()/restore() per effect is appropriate isolation.

   6. Nits. ℹ️
   • SpeechBubbleRenderer._wrap has no line cap — a very long authored text renders an
     unbounded box that can run off the top of the canvas (bubbles always anchor upward).
     A max-lines clamp or upward-shift would help.
   • renderProjectile sets ctx.shadowBlur = 4 and the trail modifies globalAlpha
     mid-function — both are restored by the caller's ctx.save(), fine, but the pattern
     relies on that outer save (present at line 14).
   • Effect IDs use Math.random — cosmetic, harmless, but it's another tiny convention
     breach (Review 31/38) if determinism ever matters for replay.

   Code Quality

   7. Small, readable, correctly commented. ✅
   Effect easing is simple and labeled (quad ease-out, arc height, blink count);
   SpeechBubbleRenderer's header documents the coordinate contract precisely
   (camera-translated ctx, physical tile size). The muzzle-flash comment (line 110-111 in
   the context) explains the duration choice.

   Priority recommendations

   1. Low — Cap bubble height (max lines or min anchor clamp) for long texts (#6).
   2. Low — A trivial headless test for expiry filtering (VisualEffectsContext's filter
      predicate) and progress clamping in renderEffect — both pure and cheap.
	  
	  
   Review 46 · AudioSystem & AudioManager

   Files reviewed: client/src/game/systems/AudioSystem.js (129),
   client/src/game/utils/AudioManager.js (468), client/src/game/utils/MusicManager.js
   (199), plus AudioContext.jsx sound mapping

   Summary

   First, a naming clarification that matters: AudioSystem.js is not an audio system —
   it's the noise-propagation system (zombie hearing). Actual sound playback lives in
   AudioManager (Web Audio + HTMLAudio pool) and AudioContext (event→sound mapping). The
   gameplay side is well done: noise alerting is decoupled through the intent queue, with
   a documented zombie-only/SIMULATING-only movement gate. The audio-engine side is
   competent but has no spatialization and no simultaneous-sound cap, and MusicManager is
   a fully disabled feature shipping in production.

   Correctness

   1. Sounds are not spatialized. ❌ (relative to the review's expectation)
   Every sound plays at a fixed per-sound default volume × master × sfx — there's no
   distance attenuation, no panning, no falloff anywhere in AudioManager or the
   AudioContext mapping. A zombie smashing a door 2 tiles away and 20 tiles away sounds
   identical (if heard at all — the audibility gate is PlayerHearing's binary in/out,
   Review 17). If "closer = louder" is a design goal, it's unimplemented: AudioManager
   has no position parameters at all, so this is a pipeline-level gap, not a tuning fix.

   2. Pooling works; there's no global cap. ⚠️
   HTMLAudio keeps a lazy pool of 3 instances per sound with round-robin rotation
   (correct — prevents one-shot overlap cutting itself off). Web Audio one-shots create a
   fresh BufferSource per play (cheap and GC'd — the standard pattern). But no maximum
   simultaneous limit exists: a 50-zombie turn firing attack/growl sounds through
   TurnManager's SOUND actions spawns unbounded parallel sources. Browsers tolerate this
   poorly past ~dozens of concurrent nodes — a per-sound or global concurrency cap with
   oldest-eviction is missing.

   3. Noise→AI decoupling is correct. ✅
   AudioSystem.resolve alerts AI entities to NoiseEvents (self-exclusion, hearing
   multipliers from ZombieTypes, deaf check inside setNoiseHeard), and enqueues an
   immediate investigate MoveIntent only for zombies and only during SIMULATING — with
   the comment documenting the turn-phase desync this prevents (player-turn moves caused
   visual ghosts and tile conflicts). NPCs are informed but act in their own phase (the
   comment explains the free-step/AP-refill bug that would otherwise occur). Note it also
    writes entity.behaviorState = 'investigating' directly — the dual-state-machine write
   from Review 18 (#2) appearing again.

   4. Music is disabled but not removed. ⚠️
   playCurrentTrack starts with return; — "Temporarily disabled: the game will have no
   music" (lines 112-113). The manager still constructs, globs /src/music/** at startup,
   and exposes play/stop APIs. Either delete it or keep it genuinely dormant (skip the
   glob when disabled). Right now it's a ship-and-pray feature.

   Architecture

   5. Event-driven, correctly. ✅
   Combat/movement code never calls audio directly: gameplay noise flows
   NoiseEvent→IntentQueue→AudioSystem (AI alerting) and SOUND
   actions→TurnManager→audioManager.playSound; audible feedback flows
   GameEvents→AudioContext (the Review 3 fire-and-forget model). AudioContext's
   unsubscribe list (Review 3 verified ~20 off() calls) is complete.

   6. Resource release: mostly clean, one scene-lifetime question. ⚠️
   stopSound/stopAllSounds pause pools and stop+disconnect loop sources; MusicManager's
   stop() disconnects and invalidates pending loads via a session counter (good async
   race handling). AudioContext resume uses self-cleaning gesture listeners. HMR
   persistence via GLOBAL_KEY mirrors GameEvents ✓. The question: activeLoops (campfire
   crackle? rain?) lives on the globally-persisted AudioManager, which isn't reset by
   engine.reset() — a loop started on one map/game can outlive it into the next unless
   callers stop it explicitly. No scene-unload hook found.

   Performance

   7. Web Audio used efficiently; one-shots unbounded. ⚠️
   Gapless looping via decoded buffers (the right way), exponential volume ramps, lazy
   pool initialization, lazy buffer loading with graceful HTMLAudio fallback at every
   level — the resilience layering is thorough. The per-frame cost is fine; the burst
   cost (finding #2's missing cap) is the real issue. Also ~10 console.log per sound play
   in production (Review 4 theme — 🔊 Playing ... Pool Index per shot).

   Testability

   8. No audio-event assertions. ❌
   Audio is hard to test, but the review's suggested minimum — "are the correct events
   emitted" — is untested: nothing asserts that a door break emits DOOR_BANG/DOOR_BROKEN,
   that turret fire emits TURRET_FIRED (VisualEffectsContext listens but no test fires
   it), or that NoiseEvent resolution alerts the right entities. AudioSystem.resolve
   itself is headless-testable (pure intent resolution over entities+map): a noise at
   (x,y) alerts zombies in radius with multipliers, skips the source, skips NPC movement
   intents, and gates zombie MoveIntents on SIMULATING. That's a real test suite hiding
   in a 129-line file.

   Priority recommendations

   1. Medium — Add a global/per-sound concurrency cap with oldest-eviction (#2); silence
      the per-play logs (#7).
   2. Medium — Test AudioSystem.resolve: radius/multiplier alerting, source exclusion,
      SIMULATING gate, NPC no-move (#8).
   3. Low — Decide MusicManager's fate: remove or formally disable (skip glob) (#4); add
      a scene-unload stopAllSounds or loop-scoping to engine.reset (#6).
   4. Low — If spatialization is wanted, it needs position params through the SOUND
      action path first (#1) — currently a non-starter without pipeline changes.
	  
	  
	   Review 47 · Spawners

   Files reviewed: ZombieSpawner.js (384), NPCSpawner.js (394, key sections),
   AnimalSpawner.js (59), ZombieReplenishmentSystem.js (164)

   Summary

   The spawn layer is functionally solid: every placement validates walkable +
   unoccupied, attempt loops are all bounded, EntityFactory is used consistently for
   zombies/NPCs, and exclusion zones (compound, tollgate, start area) are respected
   throughout. The replenishment system's gating is well-designed (turn gate + population
   cap + explored-but-currently-unseen + sector variety). The findings: replenishment
   scans the entire map every turn, zombie IDs from replenishment can collide on a
   same-millisecond double spawn, the start-area and bomb-disposal rule blocks are
   copy-pasted 5× and 2× respectively, and AnimalSpawner references the dead foliage
   terrain from Review 5.

   Correctness

   1. Replenishment gating is correct and layered. ✅
   Turn gate (24 turns after first entry) → population cap (zombiesInitialCount, falling
   back to zombiesSpawned) → candidate pool: explored + walkable + empty + outside both
   MAX_VISION_RANGE and the live FOV set (belt-and-suspenders off-screen check — spawn
   where the player's been but can't currently see) → sector anti-clumping with two
   graceful fallbacks. Start-area spawns are further 40%-skipped and restricted to
   basic/crawler. This is careful design.

   2. Replenishment zombie IDs can collide. ⚠️
   zombie-${subtype}-${Date.now()}-replenish — no counter suffix (unlike ZombieSpawner's
   -${spawnedCount}). Two replenishment spawns in the same millisecond (two maps
   processing catch-up turns in one runTurn, or a sleep-catch-up processing many turns)
   produce identical IDs, and GameMap.addEntity's duplicate path is log-and-overwrite
   (Review 8 #3): the second zombie silently replaces the first on the entity map while
   both occupy tiles. Rare but real; add a per-map counter or use the factory's UUID.

   3. Spawn position validation is thorough everywhere. ✅
   Random-placement spawns check isWalkable() + contents.length === 0 + min distance +
   exclusion zones; interior spawns check isFloor + empty; radial/entrance spawns
   bounds-clamp and re-validate. No spawn-inside-wall path exists. All retry loops are
   bounded (20–150 attempts).

   4. AnimalSpawner references dead terrain. ⚠️
   Rabbits spawn on grass or foliage — and foliage is never placed by any generator
   (Review 5 #2). Harmless (grass covers it), but it's another vote for cleaning up the
   terrain census.

   Architecture

   5. Correct delegation. ✅
   All zombies go through EntityFactory.createZombie (with the one gap: AnimalSpawner
   uses new Rabbit directly — acceptable since EntityFactory doesn't cover rabbits,
   consistent with Review 15's factory scope). Registration goes through
   gameMap.addEntity (the Review 8 single write point) — not WorldManager, correctly:
   WorldManager owns maps, maps own entities. recordZombieSpawn keeps WorldManager's
   population stats accurate for the cap.

   6. Duplicated rule blocks. ⚠️
   The start-area rule (40% skip + basic/crawler-only) is copy-pasted into five spawn
   blocks in ZombieSpawner; the bomb-disposal chance block is verbatim twice (firestation
   lines 156-186, police 221-251). Both should be helpers (_spawnWithStartAreaRules(...),
   _maybeSpawnBombDisposal(station, ...)). The replenishment system's start-area rule is
   a third variant of the same idea.

   Performance

   7. Replenishment is O(map area) per turn, not O(1). ⚠️ (answers the question)
   Once past the turn gate and below the cap, the candidate search scans every tile every
   turn — ~10,000 tiles × (walkability + contents + FOV-set lookup + exclusion checks).
   It only stops scanning when the cap is hit. Cheap per-tile work, but on the big maps
   it's a measurable per-turn cost that could be cached (candidates change only when
   tiles/FOV change) or sampled (random probes with the same filters instead of a full
   census). NPCSpawner's middle-indoor search is worse in theory (O(area × 169)
   zombie-proximity scan) but runs once per map — fine.

   Code Quality

   8. Readable, seeded, commented where it counts. ✅
   All randomness via gameRandom (except the Date.now ID suffixes — IDs, not gameplay).
   Subtype probability table is explicit with the "no mutants" note. The Lab spawn block
   (hall mutant + additional mutants + soldiers + entrance guards) is long but linear and
   clear.

   Testability

   9. Nothing. ❌
   No spawner tests with mock maps: no "spawn never lands in a wall/occupied
   tile/exclusion zone", no cap enforcement, no off-screen validation, no turn gate, no
   ID-uniqueness check (would catch #2). The spawners take (gameMap, player, options) —
   harness-friendly; a small map with known walls would cover the validation matrix in a
   few tests. ZombieReplenishmentSystem.processTurn needs an engine stub for
   playerFieldOfView, but the harness provides that shape already.

   Priority recommendations

   1. Medium — Fix replenishment ID uniqueness (counter or UUID) (#2); add
      spawn-validation tests (never in wall/occupied/exclusion, cap enforced, off-screen
      respected) (#9).
   2. Medium — Cache or sample the replenishment candidate pool instead of the full
      per-turn census (#7).
   3. Low — Extract the start-area rule and bomb-disposal block into helpers (#6); drop
      or place foliage per the Review 5 recommendation (#4).
	  
	   Review 48 · Weather, Vehicle & Map Connectivity

   Files reviewed: client/src/game/utils/WeatherManager.js,
   client/src/game/utils/VehicleUtils.js,
   client/src/game/map/MapConnectivityValidator.js,
   client/src/game/utils/TurnProcessingUtils.js, client/src/game/utils/applyItemGrants.js

   Answers to the review questions

   Does weather correctly affect vision range, movement speed, and sound propagation?
   Only player vision. Rain reduces player sight range 15%/20% outdoors
   (GameEngine.js:482-490). Nothing else consumes weather: zombie/NPC sight ranges
   (AISystem/NPCAISystem), movement costs, and noise propagation (GameMap.emitNoise,
   PlayerHearing, weapon noiseRadius) never read engine.weather. So rain blinds the
   player but not the zombies — a one-sided penalty. Whether movement/sound effects are
   intended design, the zombie-vision asymmetry looks like an oversight worth a
   deliberate decision.

   Is weather state stored in the engine or a React context?
   State is correctly in the engine (engine.weather + engine.weatherManager, serialized
   via GameSaveSystem). But weather advancement is driven from React: GameContext.jsx:730
    and SleepContext.jsx:218 call weatherManager.update(). The engine's own turn pipeline
   never advances weather, so headless runs (fuzz harness, balance sims) never see rain —
   the entire rain code path is untestable headless as wired.

   Does MapConnectivityValidator correctly detect disconnected regions? Is it tested?
   The flood fill is sound and reuses the real movement rules
   (isTileWalkable/isEdgeBlocked/canMoveDiagonally with allowBreaching, player
   perspective since entity === null → isPlayer === true, so closed windows stay blocked
   and closed doors pass — matching the doc comment). But there are zero tests — no test
   file references validateConnectivity, WeatherManager, VehicleUtils,
   TurnProcessingUtils, or applyItemGrants. For a guard whose entire job is catching
   known-bad maps, the absence of known-connected/known-disconnected fixtures is the
   biggest testability gap in this review.

   Does applyItemGrants handle grants without duplicating?
   It applies what it's given faithfully (count loop, player-tile → ground container
   redirect), but it is not idempotent — no grant/event key, so any double-fire by a
   caller duplicates items. It depends entirely on EventRunner not re-running give steps
   (an everyTime auto event with a give step will grant repeatedly — presumably intended,
   but undocumented).

   Findings

   Correctness

   1. WeatherManager.updateRainCollectors — exposure test contradicts the indoor
      definition. isExposed = tile && !isFloor(tile.terrain) && tile.terrain !==
      'building' (WeatherManager.js:242, :265). isFloor covers only floor/garagefloor, so
      tent_floor — which isIndoorFloor() (TerrainTypes.js:17) explicitly treats as
      sheltered for weather — counts as exposed. Rain collectors inside a tent fill;
      player vision in a tent is not rain-reduced. Use isIndoorFloor for consistency.

   2. updateRainCollectors only covers the player tile and proxy-entity tiles
      (WeatherManager.js:212-226). A rain collector left on any other outdoor ground tile
      never accumulates water. The trailing loop over invManager.containers (lines
      273-279) is a no-op with a comment admitting it. Either intentional (and worth a
      comment saying collectors only fill near the player) or a coverage bug.

   3. updatePuddles comment/code mismatch. Line 133 says "Only spawn if the spot is empty
      or contains no other items" — the code pushes the puddle onto the tile's item list
      unconditionally.

   4. updatePuddles player-tile branch: undefined ammoCount never fills. Guard is
      existingPuddle.ammoCount < 50 (line 96) — undefined < 50 is false, so a puddle
      missing ammoCount (legacy save) is stuck, unlike the map-tile branch which uses
      (existingPuddle.ammoCount || 0).

   5. New puddles ignore rain intensity. Spawned puddles always start at ammoCount = 10
      even in heavy rain where amount = 20 — minor, but inconsistent with the fill logic.

   6. applyItemGrants fallback reintroduces the bug its own doc comment describes. If the
      grant targets the player's tile but inventoryManager.groundManager is falsy, the
      else if (gameMap.addItemsToTile) branch (line 58) drops the item onto the map tile
      — which the header comment says is clobbered on the next move-sync. And if
      addItemsToTile is missing too, items vanish silently with no warning.

   7. applyItemGrants misleading log. Line 57 logs items.length as placed even when
      addItemSmart rejected some items (ground full); placed and the log disagree.

   8. Dead doc claim. applyItemGrants says it's "shared by both event systems" — the only
      caller is EventRunner.js:374. Either the speech-bubble system was migrated or this
      is stale documentation.

   9. Weather is non-deterministic. WeatherManager uses raw Math.random() (next event,
      duration, intensity) in a project that otherwise has SeededRandom. Saves record the
      resulting state so save/load is safe, but replay/fuzz determinism is broken
      whenever rain logic runs.

   VehicleUtils

   10. Static util imports the global engine singleton (VehicleUtils.js:3). It reads
       engine.player.currentStrength and engine.riding internally while taking gameMap as
       a parameter — half its inputs are implicit global state. This makes it untestable
       headless without booting the full engine and creates an ESM cycle risk
       (VehicleUtils → GameEngine → …). Pass player strength and riding state as
       parameters.

   11. strengthBonus recomputed per item per step (line 42) — hoisting out of both loops
       is free clarity, and per-step console.debug/console.log (lines 86, 96-99) fire in
       production builds whenever multiple items are dragged.

   12. Road-discount "once per step" guard is order-dependent. If the first item has its
       own terrainModifiers['road'], appliedGeneralRoadDiscount is never set and a later
       item still gets the general -0.5 — so whether the group discount applies depends
       on item order and individual modifiers, not on a group decision.

   MapConnectivityValidator

   13. Only north/south exits are validated. Both current generators
       (TemplateMapGenerator.js:291, LabMapGenerator.js:154) only define north/south, so
       this is fine today, but the validator will silently ignore east/west
       transitionPoints if a template ever adds them. A one-line iteration over all
       points would future-proof it.

   14. Buildings with no metadata doors are skipped, not flagged (bDoors.length === 0 →
       continue, line 108). A generator bug that forgets to record a building's door in
       metadata.doors produces a false pass for a sealed building — the failure mode this
       validator exists to catch. Consider flagging doorless buildings of types expected
       to have doors.

   15. Least-bad fallback ships broken maps with only a console.error
       (TemplateMapGenerator.js:732-733). After 6 failed attempts the player gets a
       possibly unwinnable map with no in-game signal. Given the scoring exists, consider
       a higher cap on attempts or an explicit "map degraded" flag the UI can surface.

   TurnProcessingUtils (cleanest file of the five)

   16. Duck-typed Item/POJO handling is consistent and the shared
       getMaxCharge/applyPowerGeneration single-source-of-truth pattern is good. Two
       nits: the getMaxCharge defId fallback chain (lines 53-56) is legacy-save debt that
       will silently mask missing capacity on future battery defs (returns 10); and
       processPowerSource/processHotplateDrain/processAutoTurretDrain log via bare
       console.log in production with no DEBUG gate.

   Testability summary

   None of the five files has any test coverage. The two highest-value additions:
   • validateConnectivity on a known-connected fixture and a fixture with a walled-off
     south exit / sealed building (assert ok, score, reasons).
   • WeatherManager.update with an injectable RNG (which also fixes finding 9) to assert
     rain start/stop, puddle caps, and save/load round-trip.

   Architecture summary

   • Weather state: engine ✅. Weather advancement: React contexts ❌ — move the
     weatherManager.update(newTurn) call into the engine's post-turn upkeep so headless
     runs advance weather too.
   • VehicleUtils and EventRunner both import the GameEngine singleton directly;
     MapConnectivityValidator and TurnProcessingUtils are properly parameterized — the
     former pair should follow the latter pattern.

Review 49 · ImageLoader

   File reviewed: client/src/game/utils/ImageLoader.js (853 lines, singleton imageLoader
   exported at :853)
   Consumers: renderers (TileRenderer.js, EntityRenderer.js), MapCanvas.jsx, and ~10
   React components/hooks (useItemImage.ts, UniversalGrid.tsx, etc.). No engine logic
   (systems/managers/ai) imports it.

   Answers to the review questions

   Are images loaded only once and cached?
   Partially. Successful loads are cached, and in-flight deduplication via
   loadingPromises is correct. But failures are handled inconsistently — several image
   categories are re-requested forever (see findings 1–3).

   Is there a fallback for missing images?
   Yes, and no crash on undefined: entity subtype → base entity type; item → default.png;
   everything ultimately resolves null and renderers draw fallback colors/shapes.
   Promises never reject to callers (all wrapped in try/catch), so preloadImages' .catch
   belt-and-suspenders is redundant but harmless.

   Architecture — renderer-only access?
   Access pattern is clean: only canvas renderers and React components consume it; the
   engine's simulation code never touches it. Two caveats: (a) it physically lives inside
   the engine tree (client/src/game/utils/) and imports engine modules (ZombieTypes.js,
   ConfigManager.js), violating the directory-level engine/presentation boundary even
   though the dependency direction is currently safe; (b) EntityRenderer.js:404-410
   duplicates ImageLoader's sprite-key normalization ("PHASE 26 FIX … match ImageLoader
   canonical forms") — two places encode the same naming convention and can drift.

   Web and Electron asset paths?
   Works, but by brute force: every loader tries 3 base paths × up to 5 extensions. Web
   (itch.io subfolder, base: "./") and Electron (custom file:// protocol) are both
   covered by the relative ./images/ path. See finding 4 on the cost.

   Preloaded or on-demand? Blocking sync loads?
   A small startup preload exists (MapCanvas.jsx:1066-1077: base entity types, default
   item, 3 zombie variants); everything else — tiles, items, decorations, UI — is
   on-demand during first render. No synchronous/blocking loads anywhere; all loading is
   async Image + promises. Good.

   Tested in Node?
   No. Zero test references. It's testable in principle (constructor has no DOM calls —
   new Image() only happens inside load methods), but any load call in Node throws Image
   is not defined. With a mock Image global, the cache/dedup/retry logic could be tested
   headless; nothing like that exists.

   Findings

   Correctness

   1. getPlaceImage and getItemImage retry forever. Unlike getImage (:82 checks
      failedImagesCount >= 3) and tiles/decorations (permanentFailures), neither checks
      the failure count before loading. A missing place or item image triggers a full
      path×extension sweep on every render frame, indefinitely — network spam plus
      console spam. If getItemImage's default.png fallback also fails, same infinite
      loop.

   2. Successful fallback is never cached under the requested key (getImage :104-108).
      When zombie_crawler.png is missing but zombie.png loads, the fallback is returned
      but not stored under zombie_crawler, and failedImagesCount is not incremented
      (early return fallback). Every subsequent frame re-runs the full failing load
      attempt before falling back again. The fallback should be cached under imageKey.

   3. Cached null is unreachable. getUIImage caches null on failure (:351), but every
      cache read is a truthiness check (if (this.images[imageKey])) — null is falsy, so
      the "cache" never short-circuits and UI images reload on every call. Either check
      key presence (in) or use permanentFailures like tiles do.

   4. Duplicate base paths double the failure cost. In every loader, basePaths is
      [this.basePath.X, '/images/X/', './images/X/'] — but this.basePath.X is
      './images/X/' (determineBasePath :33-43), so entries 1 and 3 are identical. A
      missing image wastes a full extra extension sweep (e.g. 15 requests instead of 10
      per attempt in loadImage).

   5. hasImage() computes the wrong key for zombies, items, and places (:320-324). It
      builds ${entityType}_${subtype}, but getImage canonicalizes zombie subtypes to
      spriteKey, items to item_<id>, and places to place_<name>.
      hasImage('zombie','crawler') queries a key that is never populated. It also misses
      the subtype !== 'basic' rule. Currently unused outside the file, so it's a latent
      bug for the next caller.

   6. Inconsistent broken-image guard. Only loadImage and loadPlaceImage verify
      naturalWidth > 0 in onload; the UI/item/tile/decoration loaders resolve
      zero-dimension images as successes.

   7. clearTileCache() over-clears (:715-731): it wipes all loadingPromises (including
      in-flight entity/item loads) and all permanentFailures (including decor_* entries),
      not just tile-related state. In-flight tile loads from the old set also still
      resolve and write into this.images after the clear, briefly resurrecting stale
      tiles until the next setTileSet.

   8. getImage place_icon routing skips the retry-count guard: the >= 3 early-return
      (:82) runs before the load wrapper, fine — but note the wrapper caches place images
      under the entity key (place_icon_<subtype>) while getPlaceImage caches under
      place_<name>, so the same PNG is fetched and stored twice. Minor memory/key-hygiene
      issue.

   Performance

   9. Console logging on every success — every loader console.logs each loaded image
      (:215, :281, :412, :530, :688). On first map render this is hundreds of log entries
      in production builds; combined with findings 1–2, missing assets log per frame. No
      DEBUG gate anywhere in the file.

   10. Retry counts are per-render-frame, not per-attempt. The "Attempt N/3" semantics
       only advance when a caller re-invokes the getter, i.e. frame-driven. With the
       fixed duplicated-path sweep, one missing tile = up to 12 requests/frame × 3
       frames. The retry policy would be better expressed as "attempt with backoff, then
       mark permanent" inside the loader itself.

   Architecture

   11. Module-level singleton with import-time side effects (:853): constructing
       ImageLoader at import reads configManager and logs. Harmless in the app, but it's
       why the module is untestable without a full config stack — exporting the class
       (already done) is useless unless tests can avoid the singleton import. Consider
       lazy singleton construction.

   12. onImageLoaded is a single mutable callback (:15) — MapCanvas claims it (:134) and
       clears it on unmount. Any second consumer (e.g. an inventory grid wanting reactive
       updates) would silently overwrite it. An emitter or add/remove listener pair
       matches how the rest of the engine does events.

   Testability summary

   No coverage today. The realistic test plan: stub global.Image with a controllable mock
   (resolve/reject per src), then assert (a) load-once caching, (b) in-flight dedup
   shares one promise, (c) fallback chain zombie→base and item→default, (d) failure
   counting → permanent null after 3, (e) setTileSet cache invalidation. Findings 1–3 and
   5 would all be caught by such a suite — which is a good argument for writing it.
	  
	  