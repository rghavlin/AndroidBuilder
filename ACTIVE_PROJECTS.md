# Active Projects, Roadmaps & Testing Protocols

This document is the centralized, live dashboard tracking completed and ongoing feature implementations, structural migrations, and feature backlogs. It also establishes the mandatory testing protocols used to verify stability.

---

## 1. Project: Unified Inventory System

Integrate a single, trait-based inventory into the existing UI in small, low-risk phases. Keep layout stable; wire behavior incrementally.

### Golden Rules (Apply to every task)
* **Single Source of Truth:** Exactly **one** `InventoryManager` per session, created during the preloading phase. Context receives it; context never constructs its own.
* **Seven Equipment Slots Only:** `backpack`, `upper_body`, `lower_body`, `melee`, `handgun`, `long_gun`, `flashlight`.
* **No Layout Churn:** Do not alter grid slot pixel size, CSS, or container dimensions unless explicitly requested.
* **Maximum Container Width:** No container may exceed **6 grid squares wide**. Containers may be taller to compensate for capacity.
* **Backpacks vs. Specialty Containers:** Backpacks open **only when equipped**. Specialty containers may open inline **even when nested**.
* **Console-First QA:** Every subphase includes dev-console checks before merging.
* **Dev-Only Globals:** `window.inventoryManager`/`window.inv` exposed **only** in development builds.

### Current Implementation Roadmap

#### Phase 5 — Interactions, Drags, and Smart Backpack Rules
* **5A — Unify the InventoryManager [COMPLETE]**
* **5B — Equipment Slots (Read-Only) [COMPLETE]**
* **5C — Backpack Panel Visibility [COMPLETE]**
* **5D — Nested Specialty Containers (Read-Only Open) [COMPLETE]**
* **5E — Ground ↔ Backpack Moves [COMPLETE]**
* **5F — Specialty Container Moves (Right-Click Open / Left-Click Drag) [COMPLETE]**
* **5G — Selection-Based Drag Interactions [COMPLETE]**
  * Left-click item → highlight at origin.
  * R key or right-click → rotate selected item 90°.
  * Mouse over grid → shows green (valid) or red (invalid) overlay footprint.
  * Left-click empty cell → place item; Escape or click item again → deselect.
* **5H — Equipment Interaction & Backpack Management [COMPLETE]**
  * Left-click equipment slot → select item (red highlight on slot). Click cell to unequip.
  * Opened backpacks show "Quick Move All" to transfer items from equipped backpack.
  * Disallow placing a backpack-with-items inside another backpack.

#### Phase 6 — Unified Clothing Panel Layout [COMPLETE]
* **6A — Refactor BackpackGrid into ClothingContainerPanel:** Create generic collapsible component.
* **6B — Create UnifiedClothingPanel Component:** Scroll container with three collapsible sections: Upper Body, Lower Body, Backpack.
* **6C — Replace BackpackGrid with UnifiedClothingPanel:** Switch `InventoryPanel.tsx` to use the new collapsible layout.
* **6D — Wire Upper/Lower Body Pocket Display:** Render pocket grids using `ContainerGrid` inside clothing panels when items are equipped.
* **6E — Clean Up InventoryExtensionWindow:** Remove pockets from extension window, leaving only equipment slots + crafting.
* **6F — Equipment Interaction Integration:** Verify selection and drag-and-drop support across all pockets and slots.

---

## 2. Project: State Machine & Context Refactoring

Migrate legacy monolithic orchestration contexts to modular, sub-contexts and establish clean initialization boundaries.

### Current Implementation Roadmap

#### Phase 4 — Complete `useGame()` Deprecation [COMPLETE]
* **Step 1:** Audit all codebase usages of legacy aggregated `useGame()` hooks.
* **Step 2:** Migrate legacy components to direct sub-context hooks (`usePlayer()`, `useGameMap()`, `useCamera()`).
* **Step 3:** Remove sub-context data aggregation from `GameContext.jsx`, simplifying `useGame()` to expose only core initialization and orchestration functions.

#### Phase 5 — Advanced Refactoring Features [COMPLETE]
* **Step 1 (Enhanced Error Boundaries):** Implement context-specific error handling with graceful recovery for `Player`, `GameMap`, and `Camera`.
* **Step 2 (Performance Optimization):** Implement selective re-render patterns and subscription models to minimize re-renders on high-frequency coordinate/stat updates.
* **Step 3 (Feature Expansion Framework):** Establish patterns for integrating upcoming sub-systems (Sound, settings, etc.) without tight context coupling.

---

## 3. Project: Audio & Sound System Backlog

Add sound effects and music using a decoupled, event-driven pattern.

### Phase 1: Basic Sound System [COMPLETE]
* Central `AudioManager` class instantiated during preloading.
* Sound triggers wired to `GameEvents` for movement, item pickup, and combat hits.

### Phase 2: Advanced Audio Backlog [COMPLETE]
* **Background Music:** Looping audio track support.
* **Dynamic State Transitions:** Shift music (e.g., exploration to tense combat music) based on threat levels or entity proximity.
* **Spatial Audio:** Sound effect volume adjustments based on Manhattan distance from the player.
* **Audio Settings UI:** Expose volume sliders in the Game Settings menu.

---

## 4. Project: Combat & Skill Coherence

Full design doc, locked decisions, and phase details: `COMBAT_SKILL_COHERENCE_PLAN.md`.

Unify melee/ranged/dodge into a coherent, Mythras-influenced skill system: percentile skills seeded once from attribute pairs (Melee=Str+Agi, Ranged=Agi+Per, Defense=Agi+Per), a new Defense skill every evading entity has (opposed-roll combat, no AP cost), crit folded into the hit roll as a degree-of-success, and all attribute→bonus formulas unified under one continuous conversion instead of seven ad hoc bucket sizes.

### Implementation Roadmap
* **Phase 1 — Unify attribute-bonus formulas (`attrMod`) [COMPLETE]**
* **Phase 2 — Crit as degree-of-success [COMPLETE]**
* **Phase 3 — Melee/Ranged: kills → hits, milestone → percentage, attribute XP split [COMPLETE]**
* **Phase 4 — Defense skill + opposed-roll unification (RISKY) [COMPLETE]**
* **Phase 5 — Character creation seed integration [COMPLETE]**

**Project complete — all 5 phases implemented and verified.**

---

## 5. Universal Testing Protocol & Dev Console

### Golden Rule: In-Game Console Only
**ALL inventory and game system testing MUST use the in-game Dev Console (activated via the `~` key).**
* ❌ **DO NOT use the browser console** for testing state mutations (triggers HMR, breaks state bindings).
* ❌ **DO NOT write inline JS scripts** in the in-game console.
* 
* ✅ **DO run pre-registered verification commands** (`phase5`, etc.).
* ✅ **DO use the console UI** to spawn items (`spawn knife`) or trigger mock setups.

### Testing Workflow
1. **Implement Feature:** Write code conforming to `ARCHITECTURE.md`.
2. **Add Test Command:** Register a verification command in `DevConsole.jsx` (e.g., `phase6`).
3. **Execute Verification:** Open the in-game console (`~`), run the command, and look for green checkmarks (✅).
4. **No Regressions:** Run preceding verification suites (`phase5`, `phase5b`, etc.) to ensure old behaviors are preserved.

### Predefined Verification Commands

| Command | Targeted Phase / Verification | Expected Output Checklist |
| :--- | :--- | :--- |
| `phase5` | Phase 5A Foundation & Ground grids | ✅ `inventoryManager` exists<br>✅ Ground container is 6x50 size |
| `phase5b` | Phase 5B Equipment Slots | ✅ Combat Knife & Flashlight equip<br>✅ Tooltips render item names |
| `phase5c` | Phase 5C Backpack Grid Visibility | ✅ Grid hidden when unequipped<br>✅ Grid displays when equipped |
| `phase5d` | Phase 5D Specialty Containers | ✅ Lunchbox & toolbox open inline<br>✅ Backpacks do not open inline |
| `phase5e` | Phase 5E Container Item Moves | ✅ Ground ↔ backpack moves succeed<br>✅ Out-of-bounds moves fail |
| `equip backpack` | Manual: Equip a standard backpack | Equipped backpack appears in inventory |
| `spawn <item> [n]` | Manual: Spawn `n` items on ground | Items appear in ground grid |

### Troubleshooting Matrix

| Symptom | Likely Cause | Resolution |
| :--- | :--- | :--- |
| **Ground grid missing** | Duplicate managers; provider initialized too early. | Confirm manager is passed as prop from `GameContext`; check initialization order. |
| **"No manager provided" warning** | `InventoryProvider` mounted before manager exists. | Check `GameScreen.tsx` mounts provider *after* manager is successfully loaded. |
| **Pockets not displaying** | Equipped clothing item definition does not specify container fields. | Check item definitions in `ItemDefs.js`; ensure pocket counts/sizes are defined. |
| **Browser crashes/freezes** | Endless event loops or HMR reload issues. | Close browser tab, ensure you are testing via `~` console instead of browser developer tools. |
| **Item layout/slots misaligned** | Missing or hardcoded slot size references. | Replace hardcoded widths with `GridSizeContext.fixedSlotSize` context reference. |
