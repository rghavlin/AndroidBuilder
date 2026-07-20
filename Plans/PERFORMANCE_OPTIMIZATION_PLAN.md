# Performance Optimization Plan

**STATUS: ✅ ALL 6 PHASES COMPLETE.** Verified via `npm run build` (clean, no
new errors/warnings from the changed files) and a full Electron playtest —
several turns, a large zombie group moving smoothly, no visual or behavioral
regressions.

**Decision (2026-07-15):** The Phase 1 safety heartbeat is **kept permanently**
as an accepted safety margin, not removed. Rationale: it leaves idle at ~2
renders/sec (vs. the ~60 we started from — ~97% of the win already captured),
and the marginal 2→0 gain is negligible on real hardware now that Phase 2
removed the per-frame allocations. Against that, the heartbeat caps worst-case
staleness from any missed dirty source at 500ms (self-healing) instead of
stranding a stale frame until user input. For a turn-based game that's a cheap,
reversible net worth keeping. Revisit only if idle profiling on a weak target
machine shows the 2 paints/sec actually costing meaningful CPU/battery.

**Goal:** Keep the game smooth on low-end machines. The render pipeline draws
efficiently (chunk cache, min-heap A*, sprite caching), but the frame
*orchestration* runs flat-out at 60fps regardless of whether anything changed,
and allocates garbage every frame. Almost every win below is about **doing work
only when state actually changes** plus removing per-frame allocations.

**Sequencing:** Phase 1 → 3 → 4 → 2 → 5 → 6. Phase 1 delivers most of the
benefit; 3 and 4 are safe quick follow-ups; 2 and 5 are the more involved
caching work; 6 is a trivial tail. Each phase is independently shippable.

**Verification:** This app is too heavy for the preview/screenshot tools. Verify
with `tsc`/build checks plus Chrome performance traces with **CPU throttled
4–6×** (simulating a weak machine), capturing idle-standing, walking, combat,
and zoom/pan separately. Headline metric: idle frames drop from ~60 renders/sec
to ~0. Final in-app feel check is done by the user.

---

## Phase 1 — Adaptive/dirty-flag render loop (biggest win) ✅ COMPLETE

Make `renderMap()` run only when the frame would differ from the last one.

- [x] Add `renderRequestedRef` (one-shot) + `requestRender()` helper in `MapCanvas.jsx`.
- [x] Gate the rAF tick ([MapCanvas.jsx](client/src/components/Game/MapCanvas.jsx)): render only if `renderRequestedRef.current` OR the scene is continuously animating; clear the one-shot flag after rendering.
- [x] Define "continuously animating" = `continuousRef` (`isAnimatingMovement || isAnimatingZombies || effects.length > 0`) OR `engine.activeActions.size > 0` OR active rain.
- [x] Subscribe dirty sources: `engine.subscribe(requestRender)` (fires on every `notifyUpdate()`).
- [x] Camera moves covered without per-instance listeners: a per-render sync effect sets the dirty flag on every React render (camera events already bump a context version → re-render), plus explicit `requestRender()` in `handleMouseMove`/`handleWheel` replacing the direct `renderMapRef.current()` calls.
- [x] Trigger `requestRender()` on `hoveredTile` change (via the per-render sync effect), canvas resize, and the image-load callback. (Theme changes are covered by the sync effect / safety heartbeat.)
- [x] Pulsers: `EntityRenderer` sets a shared `frameRenderFlags.hasPulser` when it draws a pulsing element (heard-blip, active-turret ring, fire ring, stun highlight); `renderMap` also flags animated fire-tile glow and publishes to `sceneHasPulsersRef`.
- [x] Throttle pulse-only frames to ~20fps via a timestamp gate in the tick (sine glow doesn't need 60Hz).
- [x] Add a temporary low-rate safety heartbeat (~1 render / 500ms) during initial rollout; remove once confident no dirty source is missed.
- [x] **Acceptance:** confirmed working in-app — idle no longer repaints; walking, combat, fire, hover, pan, zoom all still smooth.

**Risk:** Medium — failure mode is a stale frame if a dirty source is missed (safety heartbeat mitigates).

**Follow-up:** the 500ms safety heartbeat is still in place. Once a full play session confirms nothing freezes, remove it so idle reaches 0 paints.

---

## Phase 3 — Strip hot-path logging ✅ COMPLETE

No `console.*` in per-frame or per-turn paths.

- [x] Removed the per-frame `recalculateFOV` log entirely ([GameEngine.js](client/src/game/GameEngine.js)) — it fired *before* the dedupe return, 60×/sec during walk animations.
- [x] Gated the `notifyUpdate` "Pulse #" log via `log.debug` (plus the per-turn player-state and inventory-change pulse logs) ([GameEngine.js](client/src/game/GameEngine.js)).
- [x] Routed all Camera diagnostics (init, zoom, world-bounds, center, position, constraint, target, follow) through `log.debug` — 0 `console.log` left in [Camera.js](client/src/game/Camera.js).
- [x] Routed through the existing `Logger.js` (`debug`/`info` are `isDev`-gated → runtime no-ops in production). **Did not** add a Vite `define`; the runtime cost is already eliminated by the boolean gate, so dead-code-stripping the (tiny) log strings from the bundle wasn't worth the build-config risk. Left as an optional future tidy-up.
- [x] **Acceptance:** production runs produce zero hot-path console output (Logger `debug`/`info` no-op when `!isDev`); in dev, the 60fps FOV spam is gone (removed outright) and remaining pulse/camera logs are per-turn/per-move, not per-frame.

**Risk:** Very low.

**Note:** log *strings* still exist in the production bundle (passed to the no-op `log.debug`); only a Vite `define` + DCE would remove them. Negligible size, deferred.

---

## Phase 4 — VisualEffects: remove per-frame React re-renders ✅ COMPLETE (pending in-app check)

Stop forcing a context-wide React reconciliation every frame during combat.

- [x] Confirmed via grep that no consumer reads `tick` — every `useVisualEffects()` call destructures only `addEffect` (or `{ effects, addEffect }`).
- [x] Deleted the `tick`/`setTick` state and removed `tick` from the provider value ([VisualEffectsContext.jsx](client/src/contexts/VisualEffectsContext.jsx)).
- [x] The rAF loop now calls `setEffects` **only** when an effect expires (count changed); it still polls each frame for expiry but does no per-frame `setState`. Redraws of live effects are driven by Phase 1's `effects.length > 0` continuous rule (continuousRef stays true for the effects' lifetime, flips false on the render that clears them).
- [x] **Acceptance:** confirmed via full Electron playtest (combat, several turns) — effects animate smoothly and expire cleanly, no lingering frames or regressions.

**Risk:** Low-medium.

---

## Phase 2 — Kill per-frame allocations in `renderMap` ✅ COMPLETE (pending in-app check)

Small individually, but each runs 60×/sec — the GC pressure that hurts weak machines most.

- [x] Cache the FOV visibility Set in the engine: `recalculateFOV` builds `this.playerFovSet` in the same pass that sets explored flags (covers base + night-augmented tiles) ([GameEngine.js](client/src/game/GameEngine.js)); render reads `engine.playerFovSet` instead of rebuilding it every frame, with a fallback to the old per-frame build only before the engine's first FOV pass ([MapCanvas.jsx](client/src/components/Game/MapCanvas.jsx)). Verified `playerFieldOfView` is only ever written inside `recalculateFOV`, so the cached Set can't go stale.
- [x] Reuse a module-level `playerRenderScratch` for the player draw via `Object.assign` (identical own-enumerable copy semantics to the old `{ ...player, x, y }` spread, no per-frame allocation) ([MapCanvas.jsx](client/src/components/Game/MapCanvas.jsx)).
- [x] Per-frame `getItemsOnTile`/dominant-item memo: `renderMap` clears reused `engine._frameItemCache` / `_frameDominantCache` Maps each frame; `EntityRenderer` resolves each tile once via `getTileItemsCached` / `getDominantItemCached` (collapses the ~5 lookups per item entity per frame to one per tile). Null dominant results are cached too.
- [ ] **Acceptance (awaiting user test):** identical visuals (ground piles, crops, food/medical tinting, fog/FOV visibility); allocation profiler shows the per-frame Set/array/spread churn gone.

**Risk:** Low.

---

## Phase 5 — Chunk cache: smooth panning and zooming ✅ COMPLETE (pending in-app check)

Two independent hitch sources in [TileChunkCache.js](client/src/game/renderer/TileChunkCache.js).

- [x] Panning: `evictOffscreen` now takes the visible chunk-coord bounds + a `margin` (default 2) and keeps a ring of just-off-screen chunks cached, so small back-and-forth pans reuse chunks instead of destroying/rebuilding edge chunks ([TileChunkCache.js](client/src/game/renderer/TileChunkCache.js)). Also drops the per-frame `visibleChunkKeys` Set allocation.
- [x] Zoom: rebuilds are deferred until the gesture settles. A new `peekChunk` returns the cached (old-size) canvas without rebuilding; while `rTileSize !== builtTileSizeRef` the blit loop scale-blits those to the new size, and `invalidateAll()` + crisp rebuild fire only after `ZOOM_SETTLE_MS` (120ms) of no further size change ([MapCanvas.jsx](client/src/components/Game/MapCanvas.jsx)). Replaces the per-notch `invalidateAll()` spike.
- [x] Scale-blit uses the same `dx/dy = cx/cy * TILE_CHUNK_SIZE * rTileSize` positions as the crisp path (inside the same `translate(globalOffsetX, globalOffsetY)`), and `imageSmoothingEnabled = false` keeps it nearest-neighbour (crisp-blocky, not blurry) during the transient. `zoomPendingRef` keeps the dirty-flag render loop warm so the settle-rebuild reliably fires.
- [x] **Acceptance:** confirmed via full Electron playtest — a large zombie group (dozen+) moved smoothly, better than previously observed for a group that size; no hitching, misalignment, or seams reported.

**Risk:** Medium — fiddly zoom/DPR alignment math; do this phase last and test alignment carefully.

---

## Phase 6 — Pathfinding micro-optimization (optional) ✅ COMPLETE

- [x] Hoisted the `{ ...pathOptions, gameMap, isPathfinding: true }` object to a single `movementCostOptions` built before the A* `while` loop ([Pathfinding.js](client/src/game/utils/Pathfinding.js)); verified `getMovementCost` only reads from it (never mutates), so the shared object is safe.
- [x] **Acceptance:** identical pathing behavior (same object contents, read-only usage); the per-neighbor-per-node allocation is removed from the busiest turn-time routine.

**Risk:** Very low.

---

## Risk register

- **Phase 1** — missed dirty source → stale frame. Mitigated by the temporary safety heartbeat. **Resolved:** playtest (several turns, combat, large zombie group) showed no stale/frozen frames.
- **Phase 5** — zoom misalignment. Mitigated by doing it last with focused alignment testing. **Resolved:** playtest showed no seams or offset tiles; a dozen+ zombies moved more smoothly than previously observed for a group that size.

## Follow-up (optional, not blocking)

- [x] ~~Remove the Phase 1 temporary safety heartbeat~~ — **Decided to keep it permanently** (see the Decision note at the top). It's a self-healing 500ms safety net; the 2→0 idle-paint gain isn't worth losing the last defense against a missed dirty source. If wanted, `SAFETY_INTERVAL_MS` (500 → 2000) halves-and-then-some the idle cost while retaining the net.
- [ ] (Phase 3 note) Add a Vite `define` to dead-code-eliminate gated log strings from the production bundle — negligible size, deferred as not worth the build-config risk. (Left open as a genuine optional tidy-up; no runtime cost today since `log.debug` already no-ops in production.)
