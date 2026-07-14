# Quest & Event System — Scoping / Design Doc

> Status: **Phases 0–4 DONE and verified — the campaign-authoring core works
> end-to-end.** Phases 5–6 (journal/quests, freeplay) are **NOT STARTED**. See
> the status summary below, and §9 for full phase-by-phase detail (what was
> built, how it was verified, every bugfix along the way).
> Reference model: RPG Maker MZ events (Pages → Conditions → Command List).

## Current status at a glance

| Phase | What | Status |
|---|---|---|
| 0 | `QuestState` (flags/vars) + `conditions.js` evaluator | ✅ Done |
| 1 | Unified `GameEvent` model + legacy migration/dual-write | ✅ Done |
| 2 | Editor Event Window (unify Event + Speech tools) | ✅ Done, user-confirmed in-app |
| 3 | Runtime step-interpreter (`EventRunner.js`) | ✅ Done, user-confirmed in-app |
| 4 | Preconditions, `endWhen`, `auto`/`parallel`, movement lock | ✅ Done, user-confirmed in-app |
| — | *Add-on:* Switches & Variables registry + initial values | ✅ Done, user-confirmed in-app |
| 5 | Journal + `Quest` type + quest-advance via steps | ⬜ Not started |
| 6 | Freeplay random NPC quest generator | ⬜ Not started |

Everything in Phases 0–4 has been exercised live by the user in the actual map
editor and game (not just verify-script logic): a mixed dialog+speech+give event,
an `auto` event gated on an inventory precondition flipping a flag, a second
event gated on that flag, and a registry variable with a non-default starting
value. Four real bugs were found via that live testing and fixed the same
session (mixed-event data loss, event rename duplicating instead of renaming,
the placeable.help item replaying whole events instead of just their dialog, and
the registry never reaching `gameMap.metadata` at runtime) — see §9 for each.

No live browser testing was available to me directly (this app is too heavy for
the sandboxed preview tools); all "done" verdicts above are backed by targeted
Node verify scripts (`scratch/verify_questsystem_p0-4.mjs`, ~100 checks total),
`npx tsc --noEmit` staying at the same 248 pre-existing errors throughout (diffed
to confirm zero new ones), `esbuild` syntax-checks on the `.jsx` files `tsc`
can't cover, and — critically — the user's own in-app testing after each phase.

---

## 1. Goals

1. **Unify events.** Merge "modal dialog events" + "speech bubble events" into one
   `Event` concept in the editor inspector. One tool, one window, one data shape.
2. **Steps-as-chain.** An event is an ordered list of **steps** (RPG Maker "command
   list"). Each step has its own type (Dialog / Speech bubble / Other) and its own
   options — including *its own* item-drop, instead of all grants firing at once.
3. **Conditions.** Gate whether/when an event runs (preconditions) and when it ends
   (end-conditions). Start set: `item equipped`, `item in inventory`, `no condition`.
   Plus a movement-lock effect ("player can't move until X").
4. **Foundation for quests.** A global flag/variable store + a player **Journal**
   that tracks quest state. Usable both in the authored campaign (map editor) and in
   freeplay (random NPC-generated quests) later.

Non-goals for the first pass: the freeplay random-quest generator and the full
Journal UI. We build the *data model + editor + runtime* first so those become easy.

---

## 2. The RPG Maker model (our reference), distilled

- **Switches** (global booleans) + **Variables** (global ints): a persistent, named
  state store. Backbone of all conditions and quest progress.
- **Event** = 1+ **Pages**. Each page has **Page Conditions**; engine runs the
  *topmost page whose conditions all pass*. (This is how one NPC gives different
  dialog before vs. after a quest — no branching logic needed.)
- Each page has a **Trigger** (how it fires) + a **Command List** (ordered commands:
  show text, give item, set switch, conditional branch, wait, …).
- **Conditional Branch** = inline if/else *inside* the command list.

Sources: RPG Maker MZ Flow Control / Event Commands docs; HimeWorks custom page
conditions.

**Mapping to your words:**
| You said | RPG Maker term | Our name |
|---|---|---|
| "conditions at top of event window" | Page conditions / trigger | **Preconditions** |
| "each part is its own section w/ its own drop" | Command list | **Steps** |
| "event ends when player equips X" | autorun page + page-condition flip | **End condition** |
| "player can't move IF item not equipped" | autorun/parallel + switch | **Movement lock effect** |
| "talked to NPC / quest accepted" (needed, unstated) | switches/variables | **Flags** |

---

## 3. Current system audit (what we're replacing)

Three overlapping constructs, all in [editor.tsx](client/src/pages/editor.tsx):

- **Modal dialog** — `tile.eventTrigger = {id, steps[{speaker,text,video}], oneShot,
  grants?, next?}`. Fires on player step (`checkDialogTrigger`) or chained by id.
  Runtime: [GameContext.jsx](client/src/contexts/GameContext.jsx) `fireDialogTrigger`
  (~L1093), rendered by [DialogOverlay.tsx](client/src/components/Game/DialogOverlay.tsx).
- **Chain-only dialog** — `DialogEventDef`, same shape, `chainOnly:true`, no tile.
- **Speech bubble** — `BubbleEvent {id, oneShot, trigger:{tile|proximity,x,y,radius},
  lines[{x,y,speaker,text}], grants?, next?}`. Runtime:
  [SpeechBubbleContext.jsx](client/src/contexts/SpeechBubbleContext.jsx).

Shared primitives worth keeping:
- **`grants`** → `applyItemGrants(gameMap, grants, inventoryManager)`
  ([applyItemGrants.js](client/src/game/utils/applyItemGrants.js)) — spawns items on
  tiles. Today all grants fire at once; we want per-step grants.
- **`next` + `EVENT_CHAIN_REQUEST`** GameEvent — whole-event chaining. Steps replace this.
- **`oneShot`** fire-once tracking (`firedRef` / `firedDialogIds`).

Serialization: editor → scenario `eventTriggers[]` (+ `x,y`) and `bubbleEvents[]`.
Also flows through `metadata.eventTriggers` at map load
([TemplateMapGenerator.js:689](client/src/game/map/TemplateMapGenerator.js),
[ScenarioMapGenerator.js:38](client/src/game/map/generators/ScenarioMapGenerator.js)).

There is already a **TollGateSystem** ([TollGateSystem.js](client/src/game/systems/TollGateSystem.js))
— a specialized economic movement-gate. The general condition system should *not*
absorb it, but they're conceptually cousins (both gate progress).

---

## 4. Target data model

### 4.1 Global state store (new)

```ts
// Persisted with the save; namespaced per campaign.
interface QuestState {
  flags: Record<string, boolean>;    // switches:  "met_mayor", "bridge_repaired"
  vars:  Record<string, number>;     // variables: "goblins_killed", "reputation"
}
```
Lives on the engine (e.g. `engine.questState`), saved/loaded with the game, reset on
new game. A tiny API: `getFlag/setFlag/getVar/setVar/addVar`. Everything else reads
through it.

### 4.2 Unified Event

```ts
interface GameEvent {
  id: string;                 // author-given name, unique per map
  label?: string;             // human title for editor lists / journal
  placement:                  // where/how it can fire
    | { kind: 'tile'; x: number; y: number }
    | { kind: 'proximity'; x: number; y: number; radius: number }
    | { kind: 'chainOnly' };  // no location; only fired by another step
  trigger: 'onEnter' | 'onInteract' | 'auto' | 'parallel';  // RPG Maker trigger types
  preconditions: Condition[]; // ALL must pass for the event to run (AND)
  endWhen?: Condition[];      // for persistent/auto events: run until ALL pass
  repeat: 'once' | 'everyTime' | 'whileConditions';
  steps: EventStep[];         // ordered command list
}
```

### 4.3 Steps (the command list)

```ts
type EventStep =
  | { type: 'dialog';  speaker: string; text: string; video?: string }
  | { type: 'speech';  anchorX: number; anchorY: number; speaker?: string; text: string }
  | { type: 'give';    defId: string; count?: number; x: number; y: number }  // per-step drop
  | { type: 'setFlag'; flag: string; value: boolean }
  | { type: 'setVar';  var: string; op: 'set'|'add'; value: number }
  // | { type: 'branch'; cond; then; else }           // DEFERRED — inline if/else, revisit later
  | { type: 'lockMovement';   until: Condition[] }   // player can't move until cond
  | { type: 'unlockMovement' }
  | { type: 'wait';    ms: number }
  | { type: 'chain';   eventId: string };            // explicit hand-off (rarely needed now)
```
The "Other" event type you mentioned = an event whose steps are non-dialog commands
(`give` / `setFlag` / `lockMovement` / …). "Dialog" and "Speech bubble" are just the
first step-type you pick; nothing stops mixing them in one event.

### 4.4 Conditions

```ts
type Condition =
  | { kind: 'none' }
  | { kind: 'itemEquipped';   defId: string }
  | { kind: 'itemInInventory'; defId: string; count?: number }
  | { kind: 'flag'; flag: string; value: boolean }
  | { kind: 'var';  var: string;  op: '=='|'!='|'>='|'<='|'>'|'<'; value: number };
```
Start with the first three (your list); `flag`/`var` unlock quests. A condition
evaluator `evalCondition(cond, ctx)` reads inventory + questState. Preconditions and
end-conditions are `Condition[]` combined with **AND only** (decided). OR-groups are a
later addition — the type stays a flat array so adding OR won't break saved data.

**Multi-page behavior (decided: flat, not RPG-Maker pages).** We are NOT doing
per-event pages. To make one NPC/tile behave differently over time, author *separate*
events on the same tile with different preconditions; the runner runs the
first eligible one (see §6). Priority = author order in the list.

---

## 5. Editor UX flow

1. Inspector shows a single **"Event"** tool (replaces separate Event + Speech tools).
2. Selecting "Event" presents **two paths**:
   - **Open existing** — a list/dropdown of events already on this map (by
     `id`/`label`); picking one opens it in the Event Window for editing.
   - **Create new** — type a **name**, click **Create** → opens the Event Window on a
     fresh event.
   (Backed by the `knownEventIds`/event list already in editor.tsx.)
3. Event Window layout, top → bottom:
   - **Preconditions** section: add rows (`item equipped` / `item in inventory` /
     `flag` / `no condition`), with the sub-options per kind.
   - **Placement + Trigger**: tile / proximity / chain-only; onEnter / onInteract /
     auto / parallel; repeat mode.
   - **End condition** (shown for auto/parallel/persistent): rows of `Condition`.
   - **Steps** list: **[+ Add step]** → pick step type → the step renders as its own
     collapsible **section** containing exactly the fields that type needs, *including
     its own item-drop*. Steps are reorderable (up/down/drag), deletable.
   - Save / Cancel.
4. Placement picking still uses map-click routing (like today's `bubbleClickMode`):
   e.g. "set trigger tile", "pick anchor for this speech step", "pick drop tile for
   this give step".

Implementation note: this collapses the duplicated `dialog*` and `bubble*` draft
state into one `draftEvent` object + a `steps` array editor. Big net reduction in
[editor.tsx](client/src/pages/editor.tsx).

---

## 6. Runtime execution model

- **One event runner** replaces the split dialog/bubble firing. On
  `PLAYER_MOVE_ENDED` (and an interact key for `onInteract`), find events whose
  placement matches and whose **preconditions** pass; run the first eligible one.
- `auto` events run when their preconditions pass (no player position needed);
  `parallel` run without pausing the turn loop; both re-check **endWhen** and stop
  when it passes. This is how "movement locked until equip X" works: an `auto` event
  with a `lockMovement`/`endWhen: itemEquipped` pair.
- A **step interpreter** walks `steps` sequentially: `dialog` → DialogOverlay +
  pause; `speech` → SpeechBubbleContext line; `give` → `applyItemGrants` for that one
  step; `setFlag/setVar` → questState; `lockMovement` → set the movement gate
  described below. (`branch` deferred — see §10.)
- Keep `EVENT_CHAIN_REQUEST` under the hood for the `chain` step and cross-event
  jumps, but authors mostly won't need it now that steps live inside one event.

**Movement lock — chokepoint confirmed.** There is no single `movePlayer()`, but there
IS a single turn-phase gate that all player actions already respect. Click-to-move goes
through `handleTileClick` ([GameMapContext.jsx:70](client/src/contexts/GameMapContext.jsx)),
which returns early at L73 unless `isPlayerTurn` (`turnPhase === 'PLAYER_TURN'`). Dialogs
already block movement today by setting `turnPhase = 'PAUSED_FOR_EVENT'`
([GameContext.jsx:1108](client/src/contexts/GameContext.jsx)). So the movement lock rides
this existing machine — either a dedicated `movementLocked` phase/flag checked alongside
`isPlayerTurn`, or reuse `PAUSED_FOR_EVENT` for auto/parallel lock events. No new plumbing
required — and there is no keyboard movement, so `handleTileClick` is the *only* move
entry point to gate.

---

## 7. Journal & quests (later phase, but shape it now)

A **Quest** is mostly sugar over flags/vars + events:
```ts
interface Quest {
  id: string; title: string; description: string;
  stages: { id: string; text: string; complete: Condition[] }[]; // shown in journal
  onComplete?: EventStep[];  // rewards
}
```
Journal UI reads questState + active quests and lists stages with checkmarks. Events
advance quests via `setFlag`/`setVar` steps; a quest stage "completes" when its
`Condition[]` passes. Freeplay random quests = a generator that emits `Quest` +
`GameEvent` objects from NPC templates — trivial once the model above exists.

---

## 8. Migration

Old maps have `eventTriggers[]` and `bubbleEvents[]`. Write a one-way loader that
maps each to the new `GameEvent`:
- modal `eventTrigger` → `GameEvent` with `placement:tile`, `trigger:onEnter`, steps =
  `[dialog…]` + trailing `give` steps from `grants`, `chain` from `next`.
- `chainOnly` dialog → `placement:chainOnly`.
- `bubbleEvent` → `placement:tile|proximity`, steps = `[speech…]` (+ grants/next).
Keep reading the old shapes for a while; write only the new shape. No hand-migration
of existing `.editor.json` files required.

---

## 9. Phased implementation plan

- **Phase 0 — DONE.** `QuestState` (client/src/game/quest/QuestState.js) on
  `engine.questState`, wired into save/load/reset; `conditions.js` (`evalCondition`/
  `evalAll`, AND-only). Verified: `scratch/verify_questsystem_p0.mjs` (22 checks).
- **Phase 1 — DONE.** `client/src/game/quest/migrateEvents.js`:
  `migrateLegacyEvents` (up-convert), `downconvertEvents` (inverse), `resolveMapEvents`
  (prefer new `metadata.events`, else migrate). Wired into editor.tsx's two loaders
  (`scenarioToEditorState`, `saveGameMapToEditorState`) and `exportScenario` (dual-write
  `events[]` alongside legacy arrays); generators (`ScenarioMapGenerator`,
  `TemplateMapGenerator`) pass `events` through to `gameMap.metadata`. Verified:
  `scratch/verify_questsystem_p1.mjs` (30 checks, incl. exact legacy→unified→legacy
  round trip). Runtime (`GameContext`/`SpeechBubbleContext`) still reads only the
  legacy arrays — unchanged, confirmed via tsc error-count diff (247→248, the +1 being
  the expected new-.js-import warning this codebase already tolerates everywhere else).
- **Phase 2 — DONE (editor side; runtime still legacy).** New
  `client/src/game/quest/eventTypes.ts` (TS `GameEvent`/`EventStep`/`Condition` types)
  and `client/src/components/MapEditor/EventWindow.tsx` (the modal: preconditions,
  placement/trigger/repeat, end-condition for auto/parallel, reorderable steps with
  per-step sections including give's own drop tile, "Pick on map" coordinate picking).
  editor.tsx: one "Event" tool → Open existing / Create new; `allEditorEvents` memo
  (up-converts current tiles/chainDialogEvents/bubbleEvents via `migrateLegacyEvents`
  for the list); `saveEventDraft`/`deleteEventDraft` down-convert the edited
  `GameEvent` via `downconvertEvents` and write it into the *same* legacy storage
  (tiles[].eventTrigger / chainDialogEvents / bubbleEvents) — so canvas rendering,
  hover tooltips, save/load, and the runtime are all completely unchanged. The old
  separate Event/Speech toolbar buttons and their inspector panels were removed.
  **User confirmed working in-app** (built a `Speech bubble → Speech bubble → Give
  item` event, saved and reopened it correctly). Follow-up: all now-dead draft
  state/handlers (`dialogSteps`, `bubbleTrigger`, `commitBubbleEvent`,
  `getEffectiveBubbleEvents`, the `event_trigger`/`speech_bubble` ToolMode variants,
  their canvas-render/click-routing branches, etc.) were deleted in the same session
  once confirmed safe. Verified via `npx tsc --noEmit`: 248 errors throughout (before
  Phase 2, after Phase 2, after cleanup) — identical pre-existing set, zero new errors
  at any step.
  **Known pre-Phase-3 quirk (expected, not a bug):** a `give` step fires immediately
  when the event starts rather than at its actual position in the step sequence —
  e.g. steps `[speech, speech, give]` drops the item right away instead of after the
  second speech line. This is because the *runtime* is still the legacy
  `SpeechBubbleContext`, which applies all `grants` at once
  ([applyItemGrants.js](client/src/game/utils/applyItemGrants.js)) rather than
  walking steps in order — exactly what Phase 3's step interpreter fixes.
- **Phase 3 — DONE.** New `client/src/game/quest/EventRunner.js`: the single
  runtime runner, replacing both `GameContext.fireDialogTrigger`/`checkDialogTrigger`
  and `SpeechBubbleContext`'s own trigger-detection/`fireBubbleEvent`. Reads
  `resolveMapEvents(engine.gameMap.metadata)` and walks `steps` **in authored
  order** — this is what fixes the give-step-fires-too-early bug reported after
  Phase 2 (verified directly: `scratch/verify_questsystem_p3.mjs`, 27 checks,
  including asserting the knife does NOT drop until after both speech steps).
  Handles: `dialog`/`speech` (blocking, wait for `advance()`), `give` (per-step
  grant via `applyItemGrants`), `setFlag`/`setVar`, `wait` (ms delay), `chain`
  (transfers control to another event by id, replacing `EVENT_CHAIN_REQUEST`).
  `lockMovement`/`unlockMovement` set `engine.movementLocked` now but nothing
  enforces it yet — that gate + `auto`/`parallel` support is Phase 4, as planned.
  `branch` still unsupported (deferred, §10) — skipped with a console.warn.
  **Preconditions are not yet evaluated** (events fire whenever trigger/placement
  match, same as before) — wiring `preconditions`/`endWhen` is explicitly Phase 4's
  job per this plan, not deferred by accident.
  GameContext/SpeechBubbleContext were rewired to derive `activeDialog`/
  `activeBubble`/`isBubbleActive`/`advanceBubble`/`dismissBubble` from the runner
  every render (via the existing `engine.subscribe`/`getSnapshot`/`notifyUpdate`
  pulse mechanism already used elsewhere in this codebase) — their *external*
  shapes are unchanged, so `DialogOverlay`, `OverlayManager`, `MapCanvas`, and
  `SpeechBubbleInput` needed no changes. `eventRunner.reset()` added alongside
  both existing `engine.reset()` call sites (new game).
  **Verification note:** `GameContext.jsx`/`SpeechBubbleContext.jsx` are `.jsx`,
  which `tsc` does not check (no `allowJs`) — confirmed via `npx tsc --noEmit`
  error count staying at 248 (unchanged) and syntax-checked both edited files
  with `esbuild` directly (no errors). No live browser test was possible; the
  user should exercise a real onEnter/proximity event with mixed step types
  in-app to confirm end-to-end.
  **Known cosmetic side effect:** each dialog step now shows as its own
  single-page modal ("1 / 1 · Click to close") instead of paging through a
  batched multi-line conversation, since steps execute strictly one at a time.
  This is the intended consequence of true per-step execution, not a bug — flag
  if it reads oddly in practice.

  **Post-Phase-3 bugfix (editor data loss on mixed events):** user reported that
  adding a dialog step to an event that already had speech-bubble steps deleted
  the speech steps outright. Root cause: the editor's "Open existing" list
  (`allEditorEvents`) was a `useMemo` that re-derived itself from the legacy
  storage (`tiles[].eventTrigger` / `chainDialogEvents` / `bubbleEvents`) via
  `migrateLegacyEvents` on every render, but `saveEventDraft` wrote into that
  legacy storage via `downconvertEvents` — which can only keep ONE of
  {dialog, speech} steps per event (documented, tested behavior from Phase 1;
  see the "mixes dialog and speech steps... dropped" warning in
  `migrateEvents.js`). So every save→re-derive cycle silently lost whichever
  step kind lost the down-convert coin flip. The same lossy reconstruction also
  fed `exportScenario`'s `events[]` dual-write and the tile-info popover's
  "Edit" button.
  **Fix:** `allEditorEvents` is now real state (not derived), populated once
  from `resolveMapEvents` on map load (both loader functions now return
  `events: GameEvent[]` alongside their legacy fields) and updated *directly* by
  `saveEventDraft`/`deleteEventDraft` — the authored `GameEvent` is the primary,
  lossless write; the down-converted legacy arrays remain a secondary,
  best-effort projection used only for canvas markers/tile-info/runtime
  back-compat rendering. `exportScenario` now prefers a passed-in
  `scenario.events` over re-deriving from the legacy arrays (both `handleExport`
  and `handleSaveEditor` now pass `events: allEditorEvents`). The tile-info
  popover's `editEvent()` now looks up the event by id in `allEditorEvents`
  first, falling back to the lossy single-tile reconstruction only if not
  found. Verified via `npx tsc --noEmit` (248, unchanged, no new errors) — no
  live browser test; ask the user to re-verify a mixed dialog+speech event
  round-trips through save → close → reopen without loss.
  **Rename bugfix (same session):** the "renaming duplicates instead of
  renaming" issue flagged above was fixed on request. Added
  `eventEditorOriginalId` state (the id the draft was opened under, set by
  `openExistingEvent` and the tile-popover's `editEvent()`, cleared to `null`
  by `createNewEvent`/Cancel). `saveEventDraft` now: (1) blocks saving onto a
  *different* existing event's id ("already exists — choose a different
  name"); (2) if the id changed from `eventEditorOriginalId`, removes the OLD
  id's entries from storage and `allEditorEvents` before writing the new one.
  `deleteEventDraft` deletes by `eventEditorOriginalId` (falling back to
  `draft.id` for a never-saved new event) so deleting mid-rename doesn't miss
  the original entry. Also fixed the same desync in the tile-info popover's
  standalone "Remove" button (`removeEvent()`), which deleted `tile.eventTrigger`
  but left the event lingering in `allEditorEvents` (and therefore in
  `exportScenario`'s output) — it now also strips the id from
  `allEditorEvents`. Verified via `npx tsc --noEmit` (248, unchanged).

  **placeable.help "rewatch video" bugfix:** the question-mark item the
  editor auto-places on event-trigger tiles (see
  [TemplateMapGenerator.js](client/src/game/map/TemplateMapGenerator.js)
  "Place placeable.help items on event trigger tiles") calls
  `GameContext.fireDialogAtPlayerTile()` on click. Post-Phase-3 this replayed
  the *entire* matched event (speech/give/setFlag/chain and all), not just the
  dialog/video the player wanted to rewatch. Fixed: `fireDialogAtPlayerTile`
  now filters `event.steps` down to `type === 'dialog'` and runs a throwaway
  copy of the event with only those steps (`{ ...event, steps: dialogSteps }`,
  `ignoreOnce: true`) — other step types never re-execute on replay. Verified
  in `scratch/verify_questsystem_p3.mjs`: a mixed
  dialog+speech+give event's real playthrough runs all 3 steps once, then a
  simulated help-item replay re-shows only the dialog/video step and does NOT
  re-drop the item or re-show the speech line.
- **Phase 4 — DONE.** `EventRunner.js`:
  - **Preconditions** now gate every trigger type via a shared `_isEligible(ev, ctx)`
    (`ctx = {inventoryManager, questState}`), used by both `_findMatchAt` (onEnter/
    proximity) and the new `checkAutoEvents()` (auto/parallel).
  - **`endWhen`** is a one-way latch, semantically distinct from a step's own
    `until`: the first time an event's `endWhen` conditions evaluate true, that
    event id is added to a permanent `autoResolved` set and never fires again via
    any trigger path, regardless of `repeat` mode. (EventWindow's "End condition"
    label updated to say this explicitly: "once true, this event stops firing for
    good".)
  - **`auto`/`parallel` events** are checked reactively — on `PLAYER_MOVE_ENDED`,
    on `engine.inventoryManager`'s `inventoryChanged`, on `engine.questState`'s
    `questStateChanged` (the runner subscribes to both directly, re-subscribing on
    every `reset()` since `engine.reset()` replaces both with fresh instances),
    once when the map/game becomes ready (`GameContext`'s `isInitialized` effect),
    and immediately after any run ends (so a flag a run just set can make a
    *different* auto event fire the same tick — deliberately excluding the event
    that just finished from that immediate re-check, or an `everyTime`/
    `whileConditions` auto event with no other gate would instantly restart itself
    forever with no reachable gap; it still re-fires normally on the next external
    trigger). `parallel` is treated identically to `auto` for now (both pause
    `turnPhase` like every other trigger) — true non-blocking, turn-loop-concurrent
    execution is a bigger change, explicitly deferred past this phase.
  - **`lockMovement`'s own `until`** (distinct from `event.endWhen`) is tracked in
    `activeLocks: {eventId, until}[]`; `recheckLocks()` runs on the same reactive
    triggers and clears `engine.movementLocked` once all active locks' conditions
    pass. An explicit `unlockMovement` step always force-clears the lock and
    drops all pending `activeLocks` regardless of their conditions.
  - **The actual movement gate**: `GameMapContext.handleTileClick`'s existing
    early-return guard now includes `|| engine.movementLocked` — the exact
    chokepoint identified back in the initial scoping (§6), one added clause, no
    other plumbing needed. `engine.movementLocked` is initialized `false` in
    `GameEngine.reset()` for clarity (was already falsy-by-default via `undefined`).
  Verified: `scratch/verify_questsystem_p4.mjs` (18 checks) — preconditions gating
  onEnter and auto firing, reactive auto-firing with no player movement, the
  endWhen permanent-latch behavior surviving repeated triggers, lockMovement/
  until auto-unlock, explicit unlockMovement force-clear, and the "different
  newly-eligible event fires immediately, same event doesn't self-loop" case
  that was caught and fixed *during* verification (an early version had
  `_endRun()` unconditionally re-checking auto events, which tight-looped any
  still-eligible `everyTime` auto event with no gate — fixed by excluding the
  just-finished event id from that specific re-check).
  `npx tsc --noEmit` unchanged at 248 throughout. `GameContext.jsx`/
  `GameMapContext.jsx` syntax-checked with `esbuild` (clean, same pre-existing
  unrelated warning). No live browser test — ask the user to verify an
  itemEquipped-gated `auto` event and a `lockMovement`/`until` combo in-app.

  **Add-on after Phase 4 (user request): Switches & Variables registry.**
  Flags/vars were purely ad-hoc — free-text names typed into condition rows and
  `setFlag`/`setVar` steps, with no place to see what exists or set values up
  front. Added `QuestRegistry` (`{flags: FlagDef[], vars: VarDef[]}`,
  `FlagDef`/`VarDef = {name, description?}`) to `eventTypes.ts`. New per-map
  editor state `questRegistry`, managed via a "Switches & Variables" button/modal
  (add/remove flag or var definitions with an optional description) — persisted
  the same way `events[]`/`bubbleEvents` already are (both loader functions and
  both save call sites pass it through; `exportScenario` includes it in its
  output when non-empty). Every flag/var field in `EventWindow.tsx` (condition
  rows, `setFlag`/`setVar` steps) was converted from a free-text `<input>` to a
  `<select>` sourced from the registry (`knownFlags`/`knownVars` props threaded
  through `ConditionRow`/`ConditionListEditor`/`StepEditor`), with an inline
  amber hint when the relevant list is empty pointing at the registry button.
  This is purely an authoring aid — flags/vars are still just name-keyed reads/
  writes on `engine.questState` at runtime (`QuestState.js`, unchanged); the
  registry doesn't gate or validate anything at runtime, it only makes the
  *editor* UI enforce picking from a known list instead of free-typing (typo
  protection). Scoped to "registry only" — deliberately did not build
  autocomplete-without-a-registry, non-default initial values, or a live
  debug/dev-console value readout (all were offered as options; user picked
  registry only). Verified via `npx tsc --noEmit` (248, unchanged — diffed
  against the pre-feature baseline to confirm the 3 pre-existing `alwaysDark`
  errors are the only overlap, no new errors) and the existing Phase 0/1/3/4
  verify scripts (unaffected, still passing). No live browser test.

  **Add-on (user request, same day): initial values on flag/var creation.**
  User confirmed the registry works end-to-end in-app (created a flag, an
  `auto` event that sets it from an `itemInInventory` precondition, and a
  second event gated on that flag — all worked), then asked for the
  non-default-initial-value option that had been offered but not built. Added
  `initialValue?: boolean` to `FlagDef` / `initialValue?: number` to `VarDef`
  (eventTypes.ts); the registry modal's Add row now has a starts-true/false
  select for flags and a number input for vars, and each listed entry shows
  "starts &lt;value&gt;". New `QuestState.seedFromRegistry(registry)`: for
  each registry name never before touched (checked via `in`, not the boolean/
  number value — an explicit `false`/`0` still counts as "touched"), sets it
  to `initialValue` (default `false`/`0`); already-touched names are left
  alone, so revisiting a map can't clobber a value the player has since
  changed back toward the registry default. Called from `GameContext.jsx` at
  both points where a map becomes current: the existing `isInitialized` effect
  (new game/first map) and right after a successful `mapTransitionConfirm`
  (every subsequent map change) — both immediately followed by
  `eventRunner.checkAutoEvents()` in case seeding just satisfied an `auto`
  event's precondition. Also fixed a gap this surfaced: `questRegistry` was
  never actually copied onto `gameMap.metadata` by the two map generators
  (`ScenarioMapGenerator.js`, `TemplateMapGenerator.js`) — only `events` was
  wired through back in Phase 1; the registry itself would have been
  `undefined` at runtime despite being correctly saved/loaded in the editor.
  Fixed by mirroring the existing `events` wiring in both generators (also
  corrected their stale "not yet read by the runtime" comment on `events`,
  which Phases 3–4 made false). Verified: `scratch/verify_questsystem_p4.mjs`
  gained 6 checks for `seedFromRegistry` (seeds untouched names to their
  initialValue or to false/0 when omitted; never clobbers a name already
  touched by play, even back toward its own initialValue) — 24 checks total,
  all passing. `npx tsc --noEmit` unchanged at 248; `GameContext.jsx`/
  `QuestState.js` syntax-checked clean via `esbuild`. No live browser test.
- **Phase 5 — NOT STARTED.** Journal + quests. `Quest` type, journal UI,
  quest-advance via steps. See §7 for the shape already sketched
  (`Quest {id, title, description, stages: {id, text, complete: Condition[]}[],
  onComplete?}`) — stages reuse the existing `Condition[]`/`ConditionListEditor`
  machinery from Phases 0/2/4, and progress reuses the existing `setFlag`/`setVar`
  steps, so this is mostly new UI (an author-facing Quest editor + an in-game
  Journal screen) plus a small `Quest[]`/"active quests" data model, not a new
  engine.
- **Phase 6 — NOT STARTED.** Freeplay random quests. NPC-template quest
  generator (uses Phase 5's `Quest`/`GameEvent` shapes).

Each phase is independently shippable and testable. Phases 0–4 (+ the registry
add-on) deliver the campaign authoring you need now and are done; 5–6 are the
freeplay/journal layer and haven't been started.

---

## 10. Decisions (locked)

1. **Global flags/variables store — YES.** Built in Phase 0. Backbone of conditions +
   quests.
2. **Flat preconditions, NOT RPG-Maker pages.** Multiple events per tile,
   first-eligible-wins by author order. (§4.4)
3. **Conditions are AND-only for now.** `Condition[]` stays a flat array so OR-groups
   can be added later without breaking saved data.
4. **Movement lock — RESOLVED.** Rides the existing `turnPhase` machine via the
   `handleTileClick` / `isPlayerTurn` gate; dialogs already use `PAUSED_FOR_EVENT`. No
   new chokepoint. (§6)
5. **Inline conditional branch (`branch` step) — DEFERRED.** Not in v1. The step type
   is reserved (commented out) so we can add it later without a data-model change.

### Still to confirm as we build
- Journal/quest UI look & scope (Phase 5) — design when we get there.

---

## 11. Phase 0–1 implementation spec

Implementation-ready detail for the first two phases. **Guiding constraint: never
break the running game.** Phases 0–1 add the new model *alongside* the current one;
the live runtime (GameContext `fireDialogTrigger`, SpeechBubbleContext) keeps reading
the legacy `eventTriggers`/`bubbleEvents` arrays until Phase 3 replaces it. We achieve
that with **dual-write** (see §11.2.4).

Verified integration points (checked against current code):
- Items carry `item.defId` = template id, e.g. `'gate_key'`, `'tool.battery'`
  ([Item.js:83](client/src/game/inventory/Item.js)); `item.id` is a legacy alias of
  `defId`, and `item.instanceId` is the unique per-instance id.
- `InventoryManager.isItemEquipped(idOrItem)` already matches on `defId`
  ([InventoryManager.js:931](client/src/game/inventory/InventoryManager.js)); equipment
  is `this.equipment` (slot→item), read via `getEquippedItems()` (L919).
- Save assembles `saveData` in `GameSaveSystem.saveGameState` (~L249) and includes
  `version`, `gameMap.toJSON()`, player stats, `metadata`
  ([GameSaveSystem.js:249](client/src/game/GameSaveSystem.js)); load restores and
  returns the game-state object (~L414).
- Legacy events live at `gameMap.metadata.eventTriggers` and
  `gameMap.metadata.bubbleEvents` (set by
  [ScenarioMapGenerator.js:38](client/src/game/map/generators/ScenarioMapGenerator.js)
  / [TemplateMapGenerator.js:689](client/src/game/map/TemplateMapGenerator.js)).

### 11.1 Phase 0 — Foundations (QuestState + Conditions)

**11.1.1 New file `client/src/game/quest/QuestState.js`.** Extends the project's
`SafeEventEmitter` ([utils/SafeEventEmitter.js](client/src/game/utils/SafeEventEmitter.js))
so UI can subscribe to changes.

```js
class QuestState extends SafeEventEmitter {
  constructor() { super(); this.flags = {}; this.vars = {}; }

  getFlag(name)            { return !!this.flags[name]; }
  setFlag(name, value)     { this.flags[name] = !!value; this.emit('questStateChanged', { kind:'flag', name }); }
  getVar(name)             { return this.vars[name] ?? 0; }
  setVar(name, value)      { this.vars[name] = Number(value) || 0; this.emit('questStateChanged', { kind:'var', name }); }
  addVar(name, delta)      { this.setVar(name, this.getVar(name) + (Number(delta) || 0)); }

  reset()                  { this.flags = {}; this.vars = {}; this.emit('questStateChanged', { kind:'reset' }); }
  toJSON()                 { return { flags: { ...this.flags }, vars: { ...this.vars } }; }
  fromJSON(data)           { this.flags = { ...(data?.flags || {}) }; this.vars = { ...(data?.vars || {}) }; }
}
```

**11.1.2 Attach to engine.** In `GameEngine.js`, construct `this.questState = new
QuestState()` in the engine ctor (singleton, same lifetime as `inventoryManager`).
Expose `engine.questState`.

**11.1.3 Save/load wiring** ([GameSaveSystem.js](client/src/game/GameSaveSystem.js)):
- In `saveGameState`, add `questState: engine.questState.toJSON()` to `saveData`.
- In load (after gameMap restore, ~L353–423), add
  `engine.questState.fromJSON(saveData.questState || {})`.
- New game: call `engine.questState.reset()` wherever a fresh run initializes (same
  place `runIdRef` bumps / player is created). Bump `GameSaveSystem.CURRENT_VERSION`;
  old saves simply load with empty questState (back-compatible — no min-version bump).

**11.1.4 New file `client/src/game/quest/conditions.js`** — the evaluator, engine-free
(takes a ctx so it's unit-testable):

```js
export function evalCondition(cond, ctx) {
  const { inventoryManager: inv, questState: qs } = ctx;
  switch (cond?.kind) {
    case 'none':            return true;
    case 'itemEquipped':    return !!inv?.isItemEquipped(cond.defId);
    case 'itemInInventory': return countDef(inv, cond.defId) >= (cond.count ?? 1);
    case 'flag':            return qs.getFlag(cond.flag) === !!cond.value;
    case 'var':             return compare(qs.getVar(cond.var), cond.op, cond.value);
    default:                return false;
  }
}
export function evalAll(conds, ctx) {        // AND-only; empty/[] => true
  if (!conds || conds.length === 0) return true;
  return conds.every(c => evalCondition(c, ctx));
}
```
`compare(a, op, b)` implements `== != >= <= > <`. `countDef(inv, defId)` sums matching
items across the player's containers + equipment (iterate `inv.getEquippedItems()` and
each container's `getAllItems()`, count `item.defId === defId`, respecting stack
`quantity`). Add `countDef` as a small `InventoryManager` method too (reused later by
Give-step "already has" checks) — the evaluator can call `inv.countDef(defId)`.

**11.1.5 Tests** — `scratch/verify_questsystem_p0.mjs`: QuestState round-trip
(`toJSON`→`fromJSON`), each condition kind against a fake ctx, `evalAll` AND semantics
+ empty-array=true. No UI.

### 11.2 Phase 1 — Unified data model + migration + serialization

**11.2.1 Canonical runtime shape.** New events live at `gameMap.metadata.events:
GameEvent[]` (shapes per §4.2–4.4). Author `id` is unique per map.

**11.2.2 New file `client/src/game/quest/migrateEvents.js`.**

```js
// Build unified events for a map, preferring the new shape, else migrating legacy.
export function resolveMapEvents(metadata) {
  if (Array.isArray(metadata?.events)) return metadata.events;   // already new
  return migrateLegacyEvents(metadata);                          // old map → up-convert
}
export function migrateLegacyEvents(metadata) { /* eventTriggers + bubbleEvents → GameEvent[] */ }
```
Mapping rules (one-way, up-convert):
- modal `eventTrigger` (`{id,steps,oneShot,grants,next,x,y}`) → `GameEvent{ placement:
  {kind:'tile',x,y}, trigger:'onEnter', repeat: oneShot?'once':'everyTime',
  preconditions:[], steps: [...dialogSteps, ...grantSteps, ...(next?[{type:'chain',eventId:next}]:[]) ] }`
  where each `steps[]` line → `{type:'dialog',speaker,text,video}` and each `grants[]`
  → `{type:'give',defId,count,x,y}`.
- `chainOnly` dialog → same but `placement:{kind:'chainOnly'}`.
- `bubbleEvent` (`{id,oneShot,trigger:{type,x,y,radius},lines,grants,next}`) →
  `placement:{kind: trigger.type==='proximity'?'proximity':'tile', x, y, radius?}`,
  `trigger:'onEnter'`, steps = `lines[]`→`{type:'speech',anchorX:x,anchorY:y,speaker,text}`
  then grant steps then optional chain.

**11.2.3 Editor model** ([editor.tsx](client/src/pages/editor.tsx)). Replace the two
draft blocks (`dialog*`, `bubble*`) with one `events: GameEvent[]` state + a
`draftEvent` being edited. On map load, run `resolveMapEvents(metadata)` to populate
`events`. (Phase 2 builds the Event Window UI over this state; Phase 1 can ship with a
minimal placeholder list so the round-trip is testable.)

**11.2.4 Serialization — DUAL-WRITE (the back-compat bridge).** On save, the editor's
`events[]` is written two ways so the *current* runtime keeps working until Phase 3:
- write `scenario.events = events` (new canonical), and
- **down-convert** `events[]` → legacy `eventTriggers[]` + `bubbleEvents[]` via a new
  `downconvertEvents(events)` (inverse of the migration), so
  GameContext/SpeechBubbleContext still fire today.
`ScenarioMapGenerator`/`TemplateMapGenerator` pass all three through to
`gameMap.metadata`. **Phase 3** switches the runtime to read `metadata.events`, after
which the down-converter and legacy arrays can be deleted.

Down-convert caveat: step types with no legacy equivalent (`setFlag`, `setVar`,
`lockMovement`, `wait`, `branch`) can't be represented in the old arrays. For Phase 1,
`downconvertEvents` emits only the dialog/speech/give/chain subset and logs a
`console.warn` when it drops a step. That's acceptable because authors won't create the
new step types until the Phase 2 UI exists and Phase 3 runtime consumes them — by then
dual-write is gone. (If we author new-only steps before Phase 3, they simply won't fire
yet, which is expected.)

**11.2.5 Tests** — `scratch/verify_questsystem_p1.mjs`: round-trip a legacy scenario
(`eventTriggers`+`bubbleEvents`) → `migrateLegacyEvents` → `downconvertEvents` and
assert the dialog/speech/give/chain data survives; assert `resolveMapEvents` prefers an
existing `metadata.events`.

### 11.3 Sequencing & file summary

| Step | Files | Breaks runtime? |
|---|---|---|
| P0 QuestState + engine attach | new `quest/QuestState.js`, `GameEngine.js` | no |
| P0 save/load + reset | `GameSaveSystem.js`, new-game init site | no (old saves load) |
| P0 conditions + `countDef` | new `quest/conditions.js`, `InventoryManager.js` | no |
| P1 migration + resolve | new `quest/migrateEvents.js` | no |
| P1 editor unified model | `editor.tsx` | no |
| P1 dual-write serialize | `editor.tsx`, generators pass-through | no (dual-write) |

After Phase 0–1: quest state persists, conditions evaluate, and every map (old or new)
resolves to unified `events[]` while the game still plays exactly as today. Phase 2
(Event Window UI) and Phase 3 (new runner, drop dual-write) build on this with no
further data-model churn.
