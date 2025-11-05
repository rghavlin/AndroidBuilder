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

### 5H — Equipment Interaction & Backpack Management
**Goal:** Implement unified left-click selection for equipment with smart backpack swapping mechanics.

**Design Overview:**

**Equipment Selection Model:**
- Left-click equipment slot → Item selected, slot highlights RED
- Player then clicks:
  - **Empty grid cell** → Unequip to that position
  - **Same equipment slot** → Cancel selection
  - **Outside grid** → Cancel selection
- Provides clear visual feedback and prevents accidental unequipping

**Backpack Opening Rules (prevent exploits, enable swapping):**
```javascript
canOpenContainer(item) {
  if (!item.isContainer()) return false;
  
  // Backpacks: special rules
  if (item.equippableSlot === 'backpack') {
    // ✅ Can open when on ground
    if (item._container?.id === 'ground') return true;
    
    // ❌ Cannot open when nested in another backpack
    if (item._container?.type === 'equipped-backpack') return false;
    
    // ❌ Cannot open when equipped (use BackpackGrid instead)
    if (item.isEquipped) return false;
    
    return false;
  }
  
  // Specialty containers: existing logic
  if (item.isOpenableWhenNested()) return true;
  
  return !item._container;
}
```

**Backpack Placement Rules:**
```javascript
validateBackpackPlacement(backpack, targetContainer) {
  // ✅ Can always equip, even with items inside
  if (targetContainer.type === 'equipment-slot') return true;
  
  // ❌ Cannot place in another backpack if this backpack has items
  if (targetContainer.type === 'equipped-backpack') {
    if (backpack.containerGrid?.getItemCount() > 0) {
      return { valid: false, reason: 'Empty backpack before storing' };
    }
  }
  
  // ✅ Can place on ground regardless of contents
  if (targetContainer.id === 'ground') return true;
  
  return { valid: true };
}
```

**Backpack Swapping UI:**
- Ground backpacks that are opened show a **"Quick Move All"** button
- Button transfers all items from **equipped backpack** → **ground backpack** (as much as fits)
- Enables easy backpack upgrades: open new backpack from ground, click Quick Move, equip new backpack

**Updated Backpack Sizes:**
```javascript
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
  width: 4, height: 4,
  containerGrid: { width: 5, height: 7 }
},

'backpack.hiking': {
  name: 'Hiking Backpack',
  imageId: 'hikingBackpack',
  width: 5, height: 5,
  containerGrid: { width: 6, height: 10 }
}
```

**Item Image Naming Scheme:**

**Standard pattern:**
- Landscape items: `{item-name}.png` (e.g., `knife.png`, `sniper rifle.png`)
- Square equipment icons: `{item-name} square.png` (e.g., `sniper rifle square.png`)

**Fallback logic:**
```javascript
// ImageLoader.js
function getItemImageId(item) {
  // Try equipment slot icon first (for square display in slots)
  if (item.isEquipped && item.imageId) {
    const squareIcon = `${item.imageId} square`;
    if (imageExists(squareIcon)) return squareIcon;
  }
  
  // Use standard image or default fallback
  return item.imageId || 'default';
}
```

**Equipment Slot Visual Updates:**
1. **Make slots square**: Ensure all 7 equipment slots are perfect squares (use same dimensions)
2. **Add tooltips**: Show item name on hover (or slot name if empty)
3. **Selection highlight**: Red border/glow when item is selected for unequipping
4. **Layout adjustment**: Main inventory panel shows only 5 slots (backpack, melee, handgun, long_gun, flashlight)
   - Upper/lower body slots remain in InventoryExtensionWindow

**Implementation Steps:**

**1. Update ItemDefs.js:**
```javascript
// Update all three backpack definitions with new sizes
// Add imageId references for all items
```

**2. Update InventoryManager.canOpenContainer:**
```javascript
canOpenContainer(item) {
  if (!item?.isContainer()) return false;
  
  // Backpack-specific rules
  if (item.equippableSlot === 'backpack') {
    // Only allow opening when on ground, not nested, not equipped
    const isOnGround = item._container?.id === 'ground';
    const isNested = item._container?.type === 'equipped-backpack';
    return isOnGround && !isNested && !item.isEquipped;
  }
  
  // Specialty containers
  if (item.isOpenableWhenNested()) return true;
  
  return !item._container;
}
```

**3. Add backpack placement validation:**
```javascript
// In Container.validatePlacement
if (item.equippableSlot === 'backpack' && this.type === 'equipped-backpack') {
  const itemCount = item.containerGrid?.getItemCount() || 0;
  if (itemCount > 0) {
    return { valid: false, reason: 'Empty backpack before storing in another backpack' };
  }
}
```

**4. Update InventoryContext selection logic:**
```javascript
// Extend selectItem to handle equipment slots
const selectItem = useCallback((item, originContainerId, originX, originY, isEquipment = false) => {
  setSelectedItem({
    item,
    originContainerId,
    originX,
    originY,
    rotation: item.rotation || 0,
    originalRotation: item.rotation || 0,
    isEquipment // NEW: flag for equipment slot selection
  });
  setDragVersion(prev => prev + 1);
}, []);
```

**5. Update EquipmentSlots.tsx:**
```jsx
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

// Visual feedback
<EquipmentSlot
  isSelected={selectedItem?.isEquipment && selectedItem?.item?.instanceId === equippedItem.instanceId}
  className={cn(
    isSelected && "ring-2 ring-red-500 animate-pulse" // Red highlight when selected
  )}
/>
```

**6. Update placeSelected to handle equipment:**
```javascript
const placeSelected = useCallback((targetContainerId, targetX, targetY) => {
  if (!selectedItem) return { success: false, reason: 'No item selected' };
  
  const { item, isEquipment, originContainerId } = selectedItem;
  
  // Handle unequipping
  if (isEquipment) {
    const slot = originContainerId.replace('equipment-', '');
    const result = inventoryRef.current.unequipItem(slot);
    
    if (result.success) {
      // Item was unequipped and placed automatically
      setSelectedItem(null);
      setInventoryVersion(prev => prev + 1);
      return { success: true };
    }
    
    return result;
  }
  
  // Standard item movement (existing logic)
  // ...
}, [selectedItem]);
```

**7. Add FloatingContainer Quick Move button:**
```jsx
// In FloatingContainer.tsx for backpack containers opened from ground
{containerId.includes('backpack') && isGroundBackpack && (
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
  const groundBackpack = inventoryRef.current?.getContainer(containerId);
  
  if (!equippedBackpack || !groundBackpack) return;
  
  const items = equippedBackpack.getAllItems();
  let moved = 0;
  
  for (const item of items) {
    const result = moveItem(
      item.instanceId, 
      equippedBackpack.id, 
      groundBackpack.id
    );
    if (result.success) moved++;
  }
  
  console.log(`Quick moved ${moved}/${items.length} items`);
};
```

**8. Update ImageLoader for square icon fallback:**
```javascript
async loadItemImage(imageId) {
  const basePaths = [
    '/images/items/',
    './images/items/',
    '../images/items/',
    './client/public/images/items/'
  ];
  
  const extensions = ['.png', '.jpg', '.jpeg', '.webp'];
  
  // Try all path/extension combinations
  for (const basePath of basePaths) {
    for (const ext of extensions) {
      const fullPath = `${basePath}${imageId}${ext}`;
      const img = await this.tryLoadImage(fullPath);
      if (img) return img;
    }
  }
  
  // Fallback to default.png
  return this.loadItemImage('default');
}
```

**Acceptance Criteria:**

**Equipment Selection:**
- [ ] Left-click equipment slot selects item, highlights slot in red
- [ ] Clicking same slot cancels selection
- [ ] Clicking grid cell unequips to that position
- [ ] Clicking outside grid cancels selection

**Backpack Opening:**
- [ ] Ground backpacks can be opened via right-click
- [ ] Nested backpacks (inside equipped backpack) cannot be opened
- [ ] Equipped backpacks cannot be opened (BackpackGrid shows instead)

**Backpack Placement:**
- [ ] Cannot place backpack with items into another backpack
- [ ] Can equip backpack even with items inside
- [ ] Can place backpack on ground regardless of contents

**Backpack Swapping:**
- [ ] Ground backpack panel shows "Quick Move All" button
- [ ] Button transfers items from equipped → ground backpack
- [ ] Works correctly for upgrade path: open new backpack, quick move, equip

**Visual/UX:**
- [ ] All 7 equipment slots are perfect squares
- [ ] Tooltips show item/slot names on hover
- [ ] Equipment slots have correct spacing without upper/lower body in main panel
- [ ] Square icons load for rectangular items when equipped (fallback to standard icon)

**Console Testing Commands:**
```javascript
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
// Open ground backpack → click "Quick Move All" → verify transfer
```

**Summary:**
Phase 5H unifies the selection model (left-click for everything), implements smart backpack management to prevent exploits while enabling easy upgrades, updates backpack sizes, establishes image naming conventions, and ensures equipment slots are visually consistent with proper tooltips and spacing.

---

**End of plan.**