# Inventory Plan (v0.3)

**Project:** Zombie Road  
**Date:** 2025‑10‑22  
**Status:** Phases **0–4 complete**. Phase **5 (Redo)** begins here with a safe, incremental approach.

---

## Purpose
Authoritative plan for wiring the Inventory system into the UI without visual/layout churn and without duplicating managers. This doc supersedes prior Phase 5 notes and folds in recovery actions from the first attempt.

---

## Golden Rules (apply to every task)
- **Single source of truth:** Exactly **one** `InventoryManager` per session. Context **receives** it; context never constructs its own.
- **Seven equipment slots only:** `backpack`, `upper_body`, `lower_body`, `melee`, `handgun`, `long_gun`, `flashlight`.
- **No grid/layout changes:** Do **not** alter grid slot pixel size, CSS, or container dimensions unless explicitly requested.
- **Maximum container width:** No container may exceed **6 grid squares wide**. Containers may be taller to compensate for capacity.
- **Backpacks vs specialty containers:** Backpacks open **only when equipped**. Specialty containers may open inline **even when nested**.
- **Console‑first QA:** Every subphase includes dev‑console checks before merging.
- **Dev‑only globals:** `window.inventoryManager`/`window.inv` exposed **only** in development builds.

---

## Quick recap (Phases 0–4)
- **P0:** Global grid slot pixel size picked once, snapped to allowed values, shared by all grids.
- **P1:** Equipment slots show the canonical seven; no extra/legacy slots.
- **P2:** `InventoryContext` surface exposes: `getContainer`, `getEquippedBackpackContainerId`, `moveItem(...)`, `equipBackpack(...)`, `openableWhenNested(...)`, plus encumbrance accessors.
- **P3:** Backpack grid renders **only** when a backpack is equipped.
- **P4:** Moves between **ground** and **backpack** are supported by calling `moveItem(...)` from the grids.

> Regression from the first Phase 5 attempt: duplicate/isolated managers led to the ground grid disappearing. This redo prevents that class of bug.

---

## Phase 5 (Redo) — Refined Implementation Plan

Each subphase is a **single PR** with a short acceptance checklist and no visual/layout churn.

### 5A — Unify the InventoryManager (foundation)
**Goal:** The **same** `InventoryManager` instance is used by initialization, context, and UI.

**Implementation (tiny and safe):**
1. **Create, don’t duplicate:** Create the `InventoryManager` instance in `GameInitializationManager._executePreloading()` (next to `WorldManager`). Store it in `this.preloadData` for later phases.
2. **Pass to GameContext:** Modify `GameInitializationManager.startInitialization()` to accept an optional callback. After `COMPLETE`, call the callback with `this.gameObjects`, which now includes `inventoryManager`.
3. **Plumb into InventoryProvider with validation:**
   - Change `InventoryProvider` to accept a **required** `manager` prop.
   - **Remove** any internal `new InventoryManager()` construction.
   - **Add validation** at the top of the provider:
   ```jsx
   if (!manager) {
     if (process.env.NODE_ENV === 'development') {
       console.warn('[InventoryProvider] No manager provided - waiting for initialization');
     }
     return <>{children}</>;
   }
   ```
   - Use the provided `manager` for all context operations.
4. **Mount order:** In `GameScreen.tsx`, ensure `InventoryProvider` is mounted **after** `GameContext` initializes, passing the `manager` from `GameContext` state.
5. **Dev‑console bridge:** In a `useEffect` inside `InventoryProvider`, expose:

```ts
if (process.env.NODE_ENV === 'development') {
  (window as any).inventoryManager = manager;
  (window as any).inv = {
    getContainer: (id: string) => manager.getContainer(id),
    equipItem: (item: any, slot: string) => manager.equipItem(item, slot),
    moveItem: (itemId: string, from: string, to: string, x: number, y: number) =>
      manager.moveItem(itemId, from, to, x, y),
  };
}
```

**Acceptance (console‑driven):**
- `window.inventoryManager` exists and `getContainer('ground')` returns a grid snapshot.
- Ground grid UI appears with **6×50** dimensions (no “no ground container available” message).
- Resizing the window does **not** change slot pixel size across any inventory grid.
- Only **one** `InventoryManager` instance exists (verify with console logs).

---

### 5B — Equipment slots (read‑only, visual unchanged)
**Goal:** Show what’s equipped using the **existing icon UI**; no drag/drop or layout tweaks.

**Implementation:**
- `EquipmentSlots.tsx`: Call `useInventory()`; read `inventoryRef.current.equipment[slot]` for each of the seven canonical slots; pass `equippedItem` to `EquipmentSlot`.
- `EquipmentSlot.tsx`:
  - **Do not** change icons or dimensions.
  - Add a `title` attribute showing `equippedItem?.name` if present.
  - Optional: subtle occupied indicator (e.g., border) when a slot contains an item.
- No click logic yet (or just `console.debug`).

**Acceptance:**
- Equipping via console updates slot visuals (occupied vs empty).
- Tooltip displays item name on hover.
- No changes to fonts, emojis/icons, or layout dimensions.
- All seven slots (`backpack`, `upper_body`, `lower_body`, `melee`, `handgun`, `long_gun`, `flashlight`) display correctly.

**In-game console quick test:**
Use the **in-game Dev Console** (press `~` key):
```
phase5b
```
This will automatically create and equip test items to verify equipment slot display.

---

### 5C — Backpack panel visibility (unchanged visuals)
**Goal:** Toggle visibility of the equipped backpack’s grid. The grid component already exists; this controls **when** it appears.

**Implementation:**
- `BackpackGrid.tsx` already calls `getEquippedBackpackContainer()` and displays either the grid or “No backpack equipped”.
- Optional enhancement: add a collapse/expand toggle in the BackpackGrid header if desired.
- Ensure grids read slot size from `GridSizeContext.fixedSlotSize`.

**Acceptance:**
- Equipping a backpack via console displays the container grid.
- Unequipping shows “No backpack equipped”.
- Grid slot pixel size matches the ground grid exactly.
- No layout shifts or CSS changes.

---

### 5D — Nested specialty containers: read‑only open
**Goal:** Clicking a specialty container item (e.g., lunchbox) **inside any container** opens a small floating inline panel rendering that item’s own container grid. **No drag/drop yet.**

**Implementation:**
- Add/expose `canOpenContainer(item)` from `InventoryContext` (delegates to `InventoryManager`).
- In `UniversalGrid`/`ContainerGrid`, intercept item click:

```ts
const handleItemClick = (item, x, y) => {
  if (canOpenContainer(item)) {
    setOpenContainers(prev => [...new Set([...prev, item.getContainerGrid().id])]);
  } else {
    console.debug('Item cannot be opened inline', item?.name);
  }
};
```

- `FloatingContainer.tsx`:
  - `props: { containerId, onClose }`.
  - Render `<ContainerGrid containerId={containerId} />`.
  - Use `GridSizeContext.fixedSlotSize`.
  - Close button; track open containers to prevent duplicates.
- **Backpack prevention:** `canOpenContainer(item)` returns **false** for backpacks unless equipped.

**Acceptance:**
- Clicking a lunchbox/toolbox item opens its grid in a floating panel.
- Clicking a backpack item does **not** open inline (must be equipped via 5C).
- Multiple distinct specialty containers can be opened simultaneously.
- Each panel’s close button works.

---

### 5E — Minimal interactions (1): move ground ↔ backpack via context
**Goal:** Enable moving items between ground and backpack using existing `moveItem()`; **no** UI redesign.

**Implementation:**
- In `BackpackGrid.tsx`:

```ts
const handleSlotDrop = (x, y, event) => {
  event.preventDefault();
  const itemId = event.dataTransfer.getData('itemId');
  const fromContainerId = event.dataTransfer.getData('fromContainerId');
  const result = moveItem(itemId, fromContainerId, backpackContainer.id, x, y);
  if (!result.success) console.warn('Move failed:', result.reason);
};
```

- In `GroundItemsGrid.tsx`: mirror the same pattern for drops to ground.
- Add drag‑start handlers that set `dataTransfer` fields: `itemId` and `fromContainerId`.

**Acceptance:**
Use the **in-game Dev Console** (press `~` key):
```
phase5e
```
This command will:
- Create test items on ground
- Move items between ground and backpack
- Test invalid placements
- Verify UI updates correctly

---

### 5F — Minimal interactions (2): nested specialty containers
**Goal:** Allow moves into/out of an **open** specialty container panel (same `moveItem` API). Still no visual redesign.

**Implementation:**
- The floating panel’s `ContainerGrid` participates in the same drag/drop handlers.
- Panel cleanup: listen to `inventoryVersion`; if `getContainer(containerId)` returns falsy, call `onClose()`.

```ts
useEffect(() => {
  const container = getContainer(containerId);
  if (!container) onClose();
}, [inventoryVersion, containerId]);
```

**Acceptance:**
- Drag an item from backpack into an open lunchbox panel and back.
- Closing the panel or removing the lunchbox removes its panel cleanly.
- Moving the lunchbox itself to ground closes its panel.

---

## Guardrails that prevent the previous failure
- **Provider takes a manager; it never constructs one.** Eliminates the dual‑manager bug class.
- **Foundation‑first QA gates:** 5A (unified manager + ground visible) and 5B (read‑only equipment) must pass **before** interaction code merges.
- **No visual/layout churn:** 5B–5F avoid altering icons, sizes, or CSS; logic changes remain clear.
- **Console‑first testing:** All steps verified via `window.inventoryManager` helpers.
- **Dev‑only exposure:** Wrapped in `process.env.NODE_ENV === 'development'` to avoid shipping debug globals.

---

### 5G — Advanced drag interactions (cursor-following with rotation)
**Goal:** Implement a cursor-following drag system where items stick to the cursor, can be rotated mid-drag, and provide visual feedback for valid/invalid placement.

**Pattern Overview:**
This replaces standard HTML5 drag/drop with a custom system inspired by games like Escape from Tarkov:
1. **Left-click on item** → Item "attaches" to cursor (rendered at cursor position)
2. **Right-click while dragging** → Rotate item preview 90° (visual only, doesn't commit)
3. **Move mouse** → Item follows cursor; grid shows valid/invalid placement zones
4. **Left-click to place** → Attempt placement at cursor position; if invalid, return to origin
5. **Escape/cancel** → Return item to original position without placement attempt

**Implementation:**

**New state management in InventoryContext:**
```jsx
// Add to InventoryProvider
const [draggedItem, setDraggedItem] = useState(null);
const [dragRotation, setDragRotation] = useState(0);
const [dragOrigin, setDragOrigin] = useState(null); // { containerId, x, y }
```

**Drag lifecycle handlers:**
- `startDrag(item, originContainer, x, y)`: Remove item from origin, store origin info, attach to cursor
- `rotateDraggedItem()`: Increment rotation by 90° (visual only, doesn't affect original item)
- `updateDragPosition(mouseX, mouseY)`: Track cursor position for rendering
- `commitDragPlacement(targetContainer, x, y)`: Attempt placement; if fails, return to origin
- `cancelDrag()`: Return item to origin without attempting placement

**Visual feedback system:**
- **Valid placement zone**: Green semi-transparent overlay on target grid cells
- **Invalid placement zone**: Red semi-transparent overlay (out of bounds or occupied)
- **Item preview**: Render at cursor position with current rotation, semi-transparent
- **Origin ghost**: Optional faded outline at original position to show where item came from

**Grid slot validation:**
- `UniversalGrid` calculates mouse position → grid coordinates in real-time
- On mouse move over grid, check `Container.validatePlacement(item, x, y)` for visual feedback
- Only commit placement on left-click if validation passes

**Right-click rotation:**
- Attach `onContextMenu` handler to document while dragging
- Call `event.preventDefault()` to suppress browser context menu
- Rotate preview item by 90° without affecting original item or grid
- Validation re-runs with new rotation to update visual feedback

**Keyboard shortcuts:**
- `R` key: Rotate item (alternative to right-click)
- `Escape`: Cancel drag and return to origin
- `Space`: Attempt auto-place in nearest valid position

**Touch support (optional):**
- Long-press to pick up item
- Two-finger tap to rotate
- Tap empty area to place

**Acceptance:**
- Left-click item in any container → Item follows cursor with semi-transparent preview
- Right-click while dragging → Item rotates 90°, visual feedback updates
- Mouse over valid grid cells → Green highlight appears
- Mouse over invalid cells → Red highlight appears
- Left-click on valid cell → Item places at cursor position
- Left-click on invalid cell → Item returns to origin, brief error flash
- Escape key → Item returns to origin, no placement attempt
- Rotation state resets between drag operations

**Edge cases to handle:**
- Dragging off-screen: Item preview clamps to viewport edges or cancels drag
- Container closes during drag: Auto-cancel and return to origin
- Item stacking during drag: If target cell has stackable item, show stack preview
- Multi-monitor: Cursor position calculations account for window bounds

---

## Suggested commit slices
- `feat(inventory): create InventoryManager in GameInitializationManager preload phase`
- `feat(inventory): provider accepts external manager prop; remove internal construction`
- `feat(inventory): mount provider with manager from GameContext initialization`
- `feat(inventory-ui): read-only equipment slots display (no visual changes)`
- `feat(inventory-ui): backpack grid visibility based on equipped state`
- `feat(inventory-ui): open nested specialty containers read-only`
- `feat(inventory): grid moveItem wiring (ground↔backpack)`
- `feat(inventory): moves for open specialty containers`
- `feat(inventory-ui): cursor-following drag system foundation`
- `feat(inventory-ui): drag rotation and visual feedback`
- `feat(inventory-ui): drag placement validation and commit logic`

Each change is deliberately small, easy to review, and easy to revert.

---

## Troubleshooting matrix

| Symptom | Likely Cause | Fix |
|---|---|---|
| Ground grid missing | `window.inventoryManager` undefined; provider still constructs its own manager; provider mounted before GameContext initializes | Unify creation in preload; pass via callback; mount provider after init with provided instance |
| "No manager provided" warning in console | InventoryProvider mounted before manager created; GameContext not passing manager prop | Check GameContext passes `manager` prop; ensure provider is child of GameProvider; verify initialization order |
| Multiple managers detected | Duplicate initialization paths | Audit init path; ensure **one** creation; log address/identity in dev |
| Inventory UI completely missing | Provider validation failing and returning children only | Check dev console for warning; verify manager created in GameInitializationManager; confirm provider receives manager prop |
| Backpack grid not showing | No equipped backpack; `getEquippedBackpackContainer()` returns `null` | Equip via console; verify equipment state; check slot mapping |
| Nested panel opens for backpacks | `canOpenContainer` not enforcing rule | Ensure it returns **false** for backpacks unless equipped |
| Drag drops do nothing | Drop handler not calling `moveItem`; missing `dataTransfer` payload | Wire handlers in both grids; set `itemId`/`fromContainerId` on drag start |
| Slot size inconsistent | Component not using `GridSizeContext.fixedSlotSize` | Replace local calc with context value across all grids |
| Testing in browser console shows undefined | Wrong testing scope - browser console vs in-game console | **Always use in-game console (`~` key)** for testing; browser console lacks game context access |
| Item doesn't follow cursor during drag | Mouse position not tracked or render layer missing | Verify drag state updates on mouse move; check z-index of preview layer |
| Rotation doesn't work during drag | Context menu not prevented or rotation handler not attached | Add `event.preventDefault()` on `onContextMenu`; verify right-click listener active |
| Item placement shows wrong position | Grid coordinate calculation incorrect | Debug mouse-to-grid conversion; account for scroll offset and container position |
| Drag persists after placement | Drag state not cleared on successful placement | Ensure `setDraggedItem(null)` called after commit |

---

## In-game console test commands (reference)

**CRITICAL**: All testing MUST use the **in-game Dev Console** (press `~` key).

**Never use the browser console** - it triggers hot reloads and breaks the test environment.

### Available test commands:
```
help           - Show all available commands
phase5         - Verify Phase 5A (foundation & manager initialization)
phase5b        - Verify Phase 5B (equipment display)
phase5c        - Verify Phase 5C (backpack visibility)
phase5d        - Verify Phase 5D (specialty container opening)
phase5e        - Verify Phase 5E (move items between containers)

equip backpack     - Equip a test backpack
unequip backpack   - Unequip backpack
create toolbox     - Create toolbox on ground
create lunchbox    - Create lunchbox on ground

spawn <type> [count] - Spawn items on ground (knife, pistol, backpack, etc.)
```

### Quick verification pattern:
1. Press `~` to open in-game console
2. Type `phase5` to verify foundation
3. Type specific phase commands to test features
4. Never type JavaScript code directly - use the predefined commands

---

**End of plan.**

