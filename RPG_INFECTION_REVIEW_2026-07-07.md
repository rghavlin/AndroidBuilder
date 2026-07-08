# Code Review: RPG Attributes, Infection/Brainstems, Character Registry & New UI

Findings from review of the RPG attribute/combat system, character registry, zombie
infection condition, brainstem harvesting/pulping, and the four new UI surfaces
(PlayerSkillsUI attribute panel, CharacterRegistryWindow, CharacterCreator, InfectionHUD),
checked against `ARCHITECTURE.md` and `UI_THEMING_PLAN.md`.

Covers commits `d079218..7bc2175` (attribute system through zombie infection updates).
Items are ordered so foundational fixes (architecture violations) land first.

---

## Phase 1 — Architecture violations

These break the Engine/UI separation rule in `ARCHITECTURE.md` §1 and should be fixed
before more features are layered on top of the affected code paths.

- [x] **IR1-01** Remove React `toast` import from the engine
  - `AttributeProgressionManager.js:3` imports `toast` from `hooks/use-toast.ts`, which pulls
    in React and toast component types
  - This file is reached from deep engine call paths: `Entity.heal()` → `recordAction('HEAL_DAMAGE')`,
    and `CombatResolver.rollActiveDefense()` → `recordAction('DODGE_SUCCESS')` — so `Entity.js`
    and `CombatResolver.js` now transitively depend on React
  - Also breaks any Node-based verification script (`scratch/*.mjs`) that imports these engine
    files directly
  - Fix: replace the two `toast({...})` calls in `applyXP()` and `rollAttribute()` with
    `GameEvents.emit(GAME_EVENT.ATTRIBUTE_ROLL_READY, {...})` / `ATTRIBUTE_UPGRADED`; add a
    listener in the React layer (e.g. alongside `setupPlayerEventListeners` in GameContext) that
    calls `toast()` on those events

- [x] **IR1-02** Move brainstem harvest/pulp logic out of `UniversalGrid.tsx`
  - `UniversalGrid.tsx:349-460` does AP checks, `player.useAP(5)`, earbucks awards, item creation,
    and container add/remove directly inside a click handler
  - Established pattern (`digHole`, `harvestPlant`, `siphonFuel` in `ActionContext.jsx`) routes
    this kind of logic through context action functions that call engine methods
  - Fix: extract `harvestBrainstem(corpseItem, container)` and `pulpBrainstem(stemItem, container)`
    into `ActionContext.jsx` (or an engine-side helper the context calls); `UniversalGrid` should
    only detect the click/tool selection and delegate

---

## Phase 2 — Bugs

- [x] **IR2-01** Fix brainstem stack destruction when pulping
  - Brainstems are stackable (`stackMax: 10`, `ItemDefs.js` zombie.brainstem)
  - `UniversalGrid.tsx:445` calls `container.removeItem(item.instanceId)`, removing the entire
    stack, then creates a single pulp — smashing a stack of 5 costs 5 AP and destroys 4 brainstems
    for 1 pulp
  - Fix: decrement `stackCount` when `> 1` (mirroring `consumeItem` in `InventoryContext.jsx:646`),
    only calling `removeItem` when the stack reaches 0
  - Do this as part of IR1-02's extraction so the fix lives in one place

- [x] **IR2-02** Tick infection/treatment counters during sleep
  - One turn = one hour (`getHourFromTurn`, `TimeUtils.js:8`); infection ticks down once per turn
    in `endTurn` (`GameContext.jsx:604-620`)
  - `SleepContext.jsx`'s per-hour loop ticks sickness but never decrements
    `infectionTicksRemaining` or `treatmentTicksRemaining` — an infected player can sleep for free
    hours, and treatment buffs don't expire while asleep
  - Fix: mirror the sickness-tick block in the sleep hourly loop (`SleepContext.jsx` ~line 157-160)
    with the same infection/treatment logic from `GameContext.jsx:604-620`, including the
    succumb-to-infection death case; consider extracting both into one shared
    `tickInfection(player)` helper so the two loops can't drift again

- [x] **IR2-03** Fix dodge-chance display showing 2× the real value
  - `CombatResolver.rollActiveDefense` rolls against `agility * 0.5` (`CombatResolver.js:152`)
  - `PlayerSkillsUI.tsx:242` and `CharacterCreator.tsx:46` both display raw `agility` as the dodge
    percentage (e.g. "~40%" when the real chance is 20%)
  - Fix: expose the 0.5 multiplier as a named `CombatResolver` constant/static (e.g.
    `CombatResolver.dodgeChanceFromAgility(agility)`) and have both UI sites call it instead of
    displaying raw agility

- [x] **IR2-04** Fix stale crit-chance description on skill cards
  - `PlayerSkillsUI.tsx:200` (melee) and the ranged equivalent display "Crit +5%/level", but under
    `CombatResolver` player crit chance = weapon base crit + Perception's crit bonus; skill level
    only affects accuracy now
  - Fix: either remove the per-level crit line from the skill card (crit no longer scales with
    melee/ranged level) or confirm intended design and correct the copy/formula to match

- [x] **IR2-05** Fix `StartMenu` TypeScript error passing `customStats`
  - `StartMenu.tsx:127` calls `onStartGame({ customStats: character })`, but `StartMenuProps`
    types `onStartGame` as `(mode?: boolean | string) => void` — a real `tsc` error
    (`TS2345`), not pre-existing noise
  - Fix: widen the prop type to `(mode?: boolean | string | { customStats: any }) => void` in
    `StartMenu.tsx`, matching what `GameScreen.tsx`'s `handleStartGame` already accepts

---

## Phase 3 — Formula & data duplication (drift risk)

- [x] **IR3-01** Extract a shared derived-stats preview helper for `CharacterCreator`
  - `CharacterCreator.tsx:36-41` reimplements the maxHp/maxAp formulas inline (`10 + Math.floor(con * 0.2)`,
    `10 + Math.floor((agi+per)/6)`) instead of using `SurvivalCascade`'s constants (`HP_FLOOR`, `AP_BASE`,
    the `/6` divisor)
  - `PlayerSkillsUI.tsx:249`'s fallback formula already drifted independently (uses `× 0.5` where the
    engine uses `× 0.2`)
  - Fix: export a pure `previewDerivedStats({ strength, agility, perception, constitution })` from
    `SurvivalCascade.js` that both the creator and any UI fallback call, so there is exactly one
    place these constants live

- [x] **IR3-02** Consolidate the treatment-effects table
  - The subtype → multiplier/immunity table exists independently in three places:
    `SurvivalCascade.js:65-97` (actual gameplay multipliers), `PlayerSkillsUI.tsx`'s
    `getInfectionEffects()` (display strings), and implicitly in `ItemDefs.js`/`ZombieCorpseConfig.js`
    (which subtypes exist)
  - Adding or rebalancing a treatment type today requires editing all three in sync
  - Fix: define one `TREATMENT_EFFECTS` config (subtype → `{ multipliers, immunities, label }`) in
    the engine; have `SurvivalCascade.applySurvivalCascade` and `PlayerSkillsUI.getInfectionEffects`
    both read from it instead of hardcoding parallel switch statements

- [x] **IR3-03** Consolidate duplicated zombie-corpse-drop logic
  - Zombie death has two independent code paths that both create a corpse item:
    `DestructionSystem.js:52-57` and `CombatContext.jsx:207-212`
  - They've already diverged in RNG source: `CombatContext` uses `Math.random()`, `DestructionSystem`
    uses the seeded `gameRandom` — breaking reproducibility guarantees from P5-06 in the prior review
  - Fix: extract one shared `dropZombieDeathLoot(target, gameMap, lootGenerator, options)` helper
    (used by both call sites) that always uses `gameRandom`

---

## Phase 4 — UI theming cleanup

Per `ARCHITECTURE.md` §8 / `UI_THEMING_PLAN.md`: new components should use semantic tokens so they
render correctly across `.dark`, default (`.light`), and `.light2` without per-component overrides.
`CharacterCreator.tsx` and `CharacterRegistryWindow.tsx` mostly did this correctly (built on
`bg-card`/`text-foreground`/`border-border`/`metal-panel`); the gaps below are in `PlayerSkillsUI.tsx`
and `InfectionHUD.tsx`.

- [x] **IR4-01** Replace hardcoded `bg-zinc-800` progress-bar tracks
  - `PlayerSkillsUI.tsx:24` and `:143` hardcode `bg-zinc-800` for the skill/attribute XP bar tracks
  - Fix: add a `--track` semantic token (background for progress/meter tracks) to `:root`/`.dark`/`.light2`
    in `index.css`, and use `bg-[hsl(var(--track))]` or an equivalent Tailwind utility in both spots

- [x] **IR4-02** Replace hardcoded `text-white` labels
  - `PlayerSkillsUI.tsx:345` and `:425` ("Attributes"/"Skills" section headers) and the treated-state
    label in `InfectionHUD.tsx:71` use `text-white`, which will wash out on light themes
  - Fix: replace with `text-foreground` (headers) or the appropriate token for text sitting on the
    colored infection/treatment pill background (may need a token specifically for text-on-accent
    surfaces, e.g. reuse `--primary-foreground`)

- [x] **IR4-03** Replace hardcoded `border-white/5` hairlines
  - Used pervasively across `PlayerSkillsUI.tsx` and `CharacterCreator.tsx` for subtle dividers
    (e.g. `border-t border-white/5`)
  - Fix: add a `--hairline` token (a low-contrast divider color tuned per theme) and replace
    `border-white/5` occurrences in these two files

- [x] **IR4-04** Replace ad hoc red-950/red-500 infection styling with `--destructive` token
  - `InfectionHUD.tsx`'s untreated-infection pill and `CharacterRegistryWindow.tsx`'s "Infected" /
    "VIRAL INFECTION" badges use `bg-red-950/80 border-red-500/50 text-red-200`-style literal Tailwind
    danger colors instead of the theme's `--destructive` token
  - Fix: swap to `bg-destructive/20 border-destructive/50 text-destructive` (or similar), so infection
    danger styling repaints consistently if `--destructive` is ever retuned per theme

---

*Generated from review of the RPG attribute/combat, infection/brainstem, character registry, and
new UI systems on 2026-07-07.*
