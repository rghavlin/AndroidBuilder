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
- **Item image orientation:** All rectangular item images MUST be landscape/horizontal (width > height). Square items have no orientation constraint. This ensures consistency across all item types and simplifies asset creation.

---

## Item Image Orientation Standard

**CRITICAL RULE: All rectangular item images must be landscape/horizontal (width > height).**

### Image Creation Guidelines

**For Artists/Asset Creators:**
1. **Square items (1×1, 2×2)**: No orientation constraint
2. **Rectangular items**: Create image with width > height
3. **All images**: Use square canvas with transparent padding as needed

**Item Definition Pattern:**
```javascript
// ✅ CORRECT - All rectangular items are landscape
'weapon.pistol': { width: 2, height: 1 }      // Horizontal
'weapon.rifle': { width: 4, height: 1 }       // Horizontal  
'weapon.knife': { width: 2, height: 1 }       // Horizontal
'weapon.baseball_bat': { width: 3, height: 1 } // Horizontal
'tool.flashlight': { width: 2, height: 1 }    // Horizontal
'food.water': { width: 2, height: 1 }         // Horizontal

// ❌ WRONG - These violate the standard
'weapon.knife': { width: 1, height: 2 }       // Vertical - DON'T DO THIS
'weapon.rifle': { width: 1, height: 4 }       // Vertical - DON'T DO THIS
```

### Why This Standard Exists

**Before standardization:**
- Mixed orientations (some 1×2, some 2×1)
- Artists had to check each item's definition before creating images
- No consistent visual pattern
- Asset creation dependent on scattered code

**After standardization:**
- **One simple rule**: Rectangular items = wider than tall
- **Visual consistency**: All items start horizontal, rotate to vertical
- **Asset pipeline**: Artists can create hundreds of images without checking code
- **Intuitive rotation**: Horizontal (default) → Vertical (90° rotation)

### Rotation Behavior

Items can be rotated 90° during placement:
- A 2×1 item (horizontal) becomes 1×2 when rotated (vertical)
- A 4×1 rifle (horizontal) becomes 1×4 when rotated (vertical)
- The image rotates visually but always starts as landscape

This matches player expectations: pick up a rifle horizontally, rotate it to fit vertically in backpack.

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

**Design Decision: Click vs Drag Interaction**
- **Left-click:** Initiates drag for moving container items (uses existing `onDragStart` handler)
- **Right-click:** Opens container panels (uses `onContextMenu` handler, prevents browser context menu)
- **Why:** Resolves the conflict between "click to open" and "drag to move" - standard game inventory pattern

**Implementation:**

**1. Right-click to open containers:**
```ts
// In UniversalGrid.tsx
const handleItemContextMenu = (item: any, x: number, y: number, event: React.MouseEvent) => {
  event.preventDefault(); // Prevent browser context menu

  if (item && canOpenContainer(item)) {
    const containerGrid = await item.getContainerGrid();
    if (containerGrid) {
      openContainer(containerGrid.id);
    }
  }
};

// Wire through GridSlot
<GridSlot
  onContextMenu={(e) => handleItemContextMenu(item, x, y, e)}
  // ... other props
/>
```

**2. Left-click drag (existing behavior):**
- Items remain draggable via the `draggable` attribute
- `onDragStart` handler sets `itemId` and `fromContainerId` in dataTransfer
- No changes needed - already working from Phase 5E

**3. Floating panel drag/drop:**
- The floating panel's `ContainerGrid` participates in the same drag/drop handlers.
- Panel cleanup: listen to `inventoryVersion`; if `getContainer(containerId)` returns falsy, call `onClose()`.

```ts
useEffect(() => {
  const container = getContainer(containerId);
  if (!container) onClose();
}, [inventoryVersion, containerId]);
```

**Acceptance:**
- Right-click on a lunchbox/toolbox item opens its grid in a floating panel.
- Left-click and drag moves the container item itself (same as any other item).
- Drag an item from backpack into an open lunchbox panel and back.
- Closing the panel or removing the lunchbox removes its panel cleanly.
- Moving the lunchbox itself to ground closes its panel.
- Right-click on non-container items does nothing (browser context menu prevented).

---

## Guardrails that prevent the previous failure
- **Provider takes a manager; it never constructs one.** Eliminates the dual‑manager bug class.
- **Foundation‑first QA gates:** 5A (unified manager + ground visible) and 5B (read‑only equipment) must pass **before** interaction code merges.
- **No visual/layout churn:** 5B–5F avoid altering icons, sizes, or CSS; logic changes remain clear.
- **Console‑first testing:** All steps verified via `window.inventoryManager` helpers.
- **Dev‑only exposure:** Wrapped in `process.env.NODE_ENV === 'development'` to avoid shipping debug globals.

---

### 5G — Selection-based drag interactions (REVISED APPROACH)
**Goal:** Implement a selection-highlighting drag system where items are visually highlighted when selected, with placement preview showing where they will go.

**Pattern Overview:**
This uses a simpler, more reliable approach than cursor-following:
1. **Left-click on item** → Item gets bright highlight/border (remains visible at origin)
2. **R key or right-click** → Rotate selected item 90° (updates placement preview)
3. **Mouse over grid** → Shows green (valid) or red (invalid) placement preview at cursor
4. **Left-click empty cell** → Place item at that position; if invalid, item stays selected
5. **Escape key or click same item** → Deselect item

**Why This Approach:**
- **70% less complexity** than cursor-following (no portal, no z-index, no cursor tracking)
- **Reuses existing preview system** that already works perfectly
- **Clearer visual feedback** - player sees both source item AND destination preview
- **More robust** - fewer edge cases, timing issues, and event conflicts
- **Matches professional games** - Diablo, Path of Exile use similar systems

**Implementation:**

**New state management in InventoryContext:**
```jsx
// Simplified state (no cursor tracking needed)
const [selectedItem, setSelectedItem] = useState(null); 
// { item, originContainerId, originX, originY, rotation }
```

**Selection lifecycle handlers:**
- `selectItem(item, containerId, x, y)`: Highlight item at origin position
- `rotateSelected()`: Increment rotation by 90° (updates preview validation)
- `clearSelected()`: Remove selection highlight
- `placeSelected(targetContainer, x, y)`: Move item from origin to target; restore origin on failure

**Visual feedback system:**
- **Selected item**: Bright yellow/gold border at source position (ring-2 ring-yellow-400)
- **Valid placement zone**: Green semi-transparent overlay on target grid cells
- **Invalid placement zone**: Red semi-transparent overlay
- **Placement preview**: Shows exact footprint with rotation at destination

**Grid interaction:**
- `UniversalGrid` calculates mouse position → grid coordinates in real-time
- On mouse move over grid, check `Container.validatePlacement(item, x, y)` for visual feedback
- Left-click empty cell → calls `placeSelected(containerId, x, y)`
- Left-click selected item → calls `clearSelected()`

**Keyboard shortcuts:**
- `R` key: Rotate selected item
- `Escape`: Clear selection (deselect item)

**Acceptance:**
- Left-click item → Item gets bright border/highlight at origin
- R key or right-click → Selected item rotates, placement preview updates
- Mouse over valid cells → Green highlight shows footprint
- Mouse over invalid cells → Red highlight shows blocked placement
- Left-click valid cell → Item moves to new position
- Left-click invalid cell → Nothing happens (item stays selected)
- Escape key → Deselect item
- Click same item again → Deselect item
- Selection clears after successful placement

**Benefits over cursor-following:**
- No DragPreviewLayer component needed
- No portal rendering complexity
- No mouse position tracking overhead
- No z-index management issues
- No event propagation conflicts
- Existing placement preview system handles all visual feedback

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

5H — Equipment Interaction & Backpack Management

Goal: Implement unified left-click selection for equipment with smart backpack swapping mechanics.

Design Overview:

Equipment Selection Model:

Left-click equipment slot → Item selected, slot highlights RED

Player then clicks:

Empty grid cell → Unequip to that position

Same equipment slot → Cancel selection

Outside grid → Cancel selection

Provides clear visual feedback and prevents accidental unequipping

Backpack Opening Rules (prevent exploits, enable swapping):

canOpenContainer(item) {
  if (!item?.isContainer()) return { valid: false, reason: 'Not a container' };

  // Backpacks: special rules
  if (item.equippableSlot === 'backpack') {
    // ❌ Cannot open when nested in another backpack
    if (item._container?.type === 'equipped-backpack') {
      return { valid: false, reason: 'Cannot open nested backpack' };
    }

    // ❌ Cannot place a backpack with items inside another backpack
    if (item.containerGrid?.getItemCount() > 0) {
      return { valid: false, reason: 'Empty backpack before storing' };
    }
  }
  
  // ✅ Can place on ground regardless of contents
  if (targetContainer.id === 'ground') return true;
  
  return { valid: true };
}


Backpack Swapping UI:

Opened backpacks show a "Quick Move All" button

Button transfers all items from equipped backpack → opened backpack (as much as fits)

Enables easy backpack upgrades: open the new backpack, click Quick Move, equip new backpack

Updated Backpack Sizes:

// ItemDefs.js updates
'backpack.school': {
  name: 'Book Bag',
  imageId: 'bookBag',
  width: 3, height: 3,        // Item footprint on ground
  containerGrid: { width: 4, height: 5 }  // Internal storage
},

'backpack.standard': {
  name: 'Standard Backpack',
  imageId: 'standardBackpack',
  width: 3, height: 4,
  containerGrid: { width: 6, height: 6 }
},

'backpack.hiking': {
  name: 'Hiking Pack',
  imageId: 'hikingPack',
  width: 4, height: 5,
  containerGrid: { width: 8, height: 7 }
}


UI Integration Plan:

Left-click to select from equipment:

Add selection state for equipment items (mirrors grid selection)

On selecting an equipment item, show the red highlight on the slot

While an equipment item is selected, clicking a valid grid position tries to unequip there

const handleSlotClick = (slotId: string) => {
  const equippedItem = inventoryRef.current?.equipment[slotId];
  
  if (!equippedItem) return; // Empty slot, nothing to do
  
  // If this item is already selected, deselect it (cancel)
  if (selectedItem?.item?.instanceId === equippedItem.instanceId) {
    clearSelected();
    return;
  }
  
  // Select equipment item for unequipping
  selectItem(equippedItem, `equipment-${slotId}`, 0, 0, true);
};


Red highlight for selected equipment:

<EquipmentSlot
  id={slotId}
  selected={selectedItem?.originId === `equipment-${slotId}`}
  className={clsx(
    'rounded-lg border',
    selectedItem?.originId === `equipment-${slotId}` && 'border-red-500 ring-2 ring-red-500/40 animate-pulse' // Red highlight when selected
  )}
/>


Unequip via grid click:

When an equipment item is selected, clicking a valid target cell attempts to place there

If placement succeeds, clear selection and update both UI panels

If placement fails, keep selection and show a “bump” animation on the invalid cells

useEffect(() => {
  if (!selectedItem) return;

  grid.onCellClick = (x, y) => {
    const { item } = selectedItem;
    const result = inventoryRef.current?.moveItemToGrid(item.instanceId, 'ground', x, y);
    if (result?.success) {
      clearSelected();
      forceRerender(prev => prev + 1);
      return { success: true };
    }

    // Shake invalid cells or show toast
    showInvalidPlacementFeedback(result?.reason ?? 'Cannot place item here');
    return { success: false };
  };

  return () => { grid.onCellClick = undefined; };
}, [selectedItem]);


Prevent nested open backpacks & illegal storage:

Keep open panels for backpacks mutually exclusive as needed

Do not allow opening a backpack that’s currently inside the equipped backpack

Disallow placing a backpack-with-items inside another backpack

canPlaceContainer(containerItem, targetContainer) {
  if (containerItem.equippableSlot === 'backpack' && targetContainer.type === 'equipped-backpack') {
    if (containerItem.containerGrid?.getItemCount() > 0) {
      return { valid: false, reason: 'Cannot store a backpack that has items' };
    }
  }
  return { valid: true };
}


Equipment panel polish:

Clicking outside the inventory window cancels selection (if any)

If the selected item becomes invalid (e.g., was moved by another action), clear selection safely

When selection is active, show a subtle tooltip near the cursor: “Click a cell to unequip here”

Minimal keyboard glue (optional, dev-only):

Esc → cancel selection

E while an equipment slot is hovered → select that slot (power-user affordance)

useEffect(() => {
  const onKeyDown = (e) => {
    if (e.key === 'Escape') clearSelected();
  };
  window.addEventListener('keydown', onKeyDown);
  return () => window.removeEventListener('keydown', onKeyDown);
}, []);


Add FloatingContainer Quick Move button:

// In FloatingContainer.tsx for opened backpack containers
{containerId.includes('backpack') && (
  <Button 
    onClick={handleQuickMove}
    variant="secondary"
    size="sm"
    className="mt-2"
  >
    Quick Move All from Equipped Backpack
  </Button>
)}

const handleQuickMove = () => {
  const equippedBackpack = inventoryRef.current?.getBackpackContainer();
  const openedBackpack = inventoryRef.current?.getContainer(containerId);
  
  if (!equippedBackpack || !openedBackpack) return;
  
  const items = equippedBackpack.getAllItems();
  let moved = 0;
  
  for (const item of items) {
    const result = moveItem(
      item.instanceId, 
      equippedBackpack.id, 
      openedBackpack.id
    );
    if (result.success) moved++;
  }
  
  console.log(`Quick moved ${moved}/${items.length} items`);
};


8. Update ImageLoader for square icon fallback:

async loadItemImage(imageId) {
  const basePaths = [
    '/images/items/',
    './images/items/',
    '../images/items/',
    './client/public/images/items/'
  ];
  
  const extensions = ['.png', '.jpg', '.jpeg', '.webp'];
  
  // Try each base/extension combo
  for (const base of basePaths) {
    for (const ext of extensions) {
      try {
        const src = await tryLoad(`${base}${imageId}${ext}`);
        if (src) return src;
      } catch {}
    }
  }
  
  // Fallback: square icon by type
  return `/images/fallback/${imageId}.png`;
}


Acceptance Criteria (5H):

Equipment Selection

 Left-clicking an equipment slot selects the item and highlights the slot in red

 Clicking grid cell unequips to that position

 Clicking the same slot cancels selection

 Clicking outside grid cancels selection

Backpack Opening:

 Ground backpacks can be opened via right-click

 Nested backpacks (inside equipped backpack) cannot be opened

 Equipped backpack cannot be opened while equipped

Backpack Storage Rules:

 Cannot place backpack with items into another backpack

 Can equip backpack even if it has items

Quick Move:

 Opened backpack panel shows "Quick Move All" button

 Button transfers items from equipped → opened backpack

 Works correctly for upgrade path: open new backpack, quick move, equip

Visual/UX:

 All 7 equipment slots are present and unchanged

 Red highlight uses the same visual language as grid selection (pulse + ring)

 Quick Move button uses secondary styling, small size, and sits under the opened backpack panel

QA / Console Tests (dev-only):

// Test equipment selection
window.inv.equipItem(knife, 'melee');  // Equip knife
// Click melee slot → should highlight red
// Click grid cell → should unequip to that position

// Test backpack opening rules
window.inv.dropItemToGround(backpackWithItems);  // Drop to ground
// Right-click ground backpack → should open
// Move to equipped backpack → right-click → should NOT open

// Test backpack placement
const fullBackpack = createBackpackWithItems();
const emptyBackpack = inventoryManager.getBackpackContainer();
// Try to place fullBackpack in emptyBackpack → should fail
// Try to equip fullBackpack → should succeed

// Test quick move
// Open a backpack → click "Quick Move All" → verify transfer


Summary:
Phase 5H unifies the selection model (left-click for everything), implements smart backpack management to prevent exploits while enabling easy upgrades, updates image loading with a robust fallback, and introduces a one-click Quick Move to streamline swapping backpacks during gameplay.

---

## Phase 6 — Unified Clothing Panel Layout

**Goal:** Restructure inventory layout to show upper body, lower body, and backpack grids in a unified, collapsible area within the main inventory panel.

### Current State Analysis

**Current Structure:**
- `BackpackGrid.tsx` - Shows equipped backpack container with collapse functionality
- `InventoryExtensionWindow.tsx` - Shows upper/lower body equipment slots and their pocket grids
- Equipment slots are separate from the container grids

**Phase 6 Goals:**
1. Move upper/lower body pocket grids from extension window to main inventory panel
2. Create unified scrollable area with 3 sections: Upper Body → Lower Body → Backpack
3. Each section independently collapsible
4. When no backpack equipped, show "Backpack (none)" instead of message
5. Each clothing item's pockets appear separately but collapse together

---

### 6A — Refactor BackpackGrid into ClothingContainerPanel (Foundation)

**Goal:** Create a reusable component for displaying clothing/backpack containers with collapse functionality.

**Implementation:**
1. Create `ClothingContainerPanel.tsx` - Generic collapsible container display component
2. Props: `title`, `equippedItem`, `pocketContainers`, `isCollapsed`, `onToggle`, `emptyMessage`
3. Move collapse logic from `BackpackGrid.tsx` into this component
4. Keep existing `BackpackGrid.tsx` for now, just refactor internals to use new component

**Acceptance:**
- Backpack still works exactly as before
- Code is cleaner and reusable
- No visual changes yet

---

### 6B — Create UnifiedClothingPanel Component (Layout Structure)

**Goal:** Build the 3-section layout container that will replace `BackpackGrid.tsx`.

**Implementation:**
1. Create `UnifiedClothingPanel.tsx` with three sections:
   - UpperBodySection (collapsible)
   - LowerBodySection (collapsible) 
   - BackpackSection (collapsible)
2. Each section uses `ClothingContainerPanel` from 6A
3. Implement scroll container wrapping all three sections
4. Add independent collapse state for each section
5. Wire to `useInventory()` to get equipped items

**File Structure:**
```tsx
<div className="w-1/2 flex flex-col overflow-hidden">
  {/* Upper Body Section */}
  <ClothingContainerPanel 
    title="Upper Body"
    equippedItem={equipment.upper_body}
    pocketContainers={upperBodyPockets}
    isCollapsed={upperCollapsed}
    onToggle={() => setUpperCollapsed(!upperCollapsed)}
  />
  
  {/* Lower Body Section */}
  <ClothingContainerPanel 
    title="Lower Body"
    equippedItem={equipment.lower_body}
    pocketContainers={lowerBodyPockets}
    isCollapsed={lowerCollapsed}
    onToggle={() => setLowerCollapsed(!lowerCollapsed)}
  />
  
  {/* Backpack Section */}
  <ClothingContainerPanel 
    title={backpack ? "Backpack" : "Backpack (none)"}
    containerId="backpack-container"
    isCollapsed={backpackCollapsed}
    onToggle={() => setBackpackCollapsed(!backpackCollapsed)}
  />
</div>
```

**Acceptance:**
- Three-section layout renders correctly
- Each section collapses independently
- Scroll works across all sections
- No functional changes yet (just layout)

---

### 6C — Replace BackpackGrid with UnifiedClothingPanel

**Goal:** Switch the main inventory panel to use the new unified layout.

**Implementation:**
1. In `InventoryPanel.tsx`, replace `<BackpackGrid />` with `<UnifiedClothingPanel />`
2. Remove old `BackpackGrid.tsx` import
3. Update any tests or references

**Acceptance:**
- Backpack still works in new location
- Upper/Lower body sections appear (empty for now)
- All collapse toggles work
- Scrolling works correctly

---

### 6D — Wire Upper/Lower Body Pocket Display (Read-Only)

**Goal:** Display pocket grids when upper/lower body items are equipped (no interaction yet).

**Implementation:**
1. In `ClothingContainerPanel`, detect if equipped item has pockets:
```tsx
const pocketContainers = item?.isContainer() 
  ? item.getPocketContainers() 
  : [];
```

2. Render each pocket grid using `ContainerGrid`:
```tsx
{pocketContainers.map((pocket, idx) => (
  <ContainerGrid
    key={pocket.id}
    containerId={pocket.id}
    width={pocket.width}
    height={pocket.height}
    enableScroll={false}
  />
))}
```

3. Show "(none)" suffix when no item equipped

**Acceptance:**
- Equipping upper body item via console shows its pocket grids
- Equipping lower body item via console shows its pocket grids
- Unequipping hides the grids
- Each pocket appears as separate grid
- No drag/drop yet (Phase 5G handles that)

**In-game console test commands:**
```
equip pocket-t     - Equip pocket t-shirt (1 pocket: 1x1)
equip workshirt    - Equip work shirt (2 pockets: 1x2 each)
equip sweatpants   - Equip sweatpants (2 pockets: 1x2 each)
equip cargopants   - Equip cargo pants (4 pockets: 2x2 each)
```

---

### 6E — Clean Up InventoryExtensionWindow

**Goal:** Remove pocket displays from extension window since they're now in main panel.

**Implementation:**
1. Keep equipment slots in `InventoryExtensionWindow.tsx`
2. Remove the pocket grid sections (body-pocket-1 through legs-pocket-4)
3. Keep only crafting panel in extension window
4. Simplify layout to just show equipment slots + crafting

**Acceptance:**
- Extension window shows only equipment slots and crafting
- No duplicate pocket grids
- Cleaner, more focused extension panel
- Main inventory panel is the authoritative view for all containers

---

### 6F — Equipment Interaction Integration

**Goal:** Ensure Phase 5H equipment selection works with new layout.

**Implementation:**
1. Verify left-click selection on equipment slots still works
2. Ensure clicking grid cells with selected equipment item unequips correctly
3. Test that pocket grids participate in drag/drop from Phase 5G
4. Verify all container grids use same slot size from `GridSizeContext`

**Acceptance:**
- Can select equipped upper/lower body items
- Can unequip by clicking grid cell
- Can drag items between pockets, backpack, and ground
- All grids use consistent slot sizing

---

### Summary of Phase 6 Changes

**New Files:**
- `ClothingContainerPanel.tsx` - Reusable collapsible container component
- `UnifiedClothingPanel.tsx` - New 3-section layout (replaces BackpackGrid functionality)

**Modified Files:**
- `InventoryPanel.tsx` - Uses UnifiedClothingPanel instead of BackpackGrid
- `InventoryExtensionWindow.tsx` - Simplified to equipment slots + crafting only

**Removed Files:**
- `BackpackGrid.tsx` - Replaced by UnifiedClothingPanel

**Visual Result:**
```
┌─────────────────────────────────┐
│ UPPER BODY          [▼]         │  ← Collapsible
│ ┌───┬───┐ ┌───┬───┐            │
│ │   │   │ │   │   │  (pockets) │
│ └───┴───┘ └───┴───┘            │
├─────────────────────────────────┤
│ LOWER BODY          [▼]         │  ← Collapsible
│ ┌───┬───┐ ┌───┬───┐            │
│ │   │   │ │   │   │  (pockets) │
│ └───┴───┘ └───┴───┘            │
├─────────────────────────────────┤
│ BACKPACK            [▼]         │  ← Collapsible
│ ┌─────────────────┐            │
│ │                 │            │
│ │   (6x10 grid)   │            │
│ │                 │            │
│ └─────────────────┘            │
└─────────────────────────────────┘
     ↕ Scroll when needed
```

This plan maintains existing Phase 5 work (equipment selection, drag/drop) while reorganizing the layout to be more cohesive and user-friendly. Each phase is small, testable, and builds on the previous one.