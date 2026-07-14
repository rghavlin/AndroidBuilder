# Inventory System Review

_Read-only architecture review of the Tetris-style container inventory and its power-management interactions._
_Date: 2026-07-09_

## Scope

Files reviewed:

- `client/src/game/inventory/InventoryManager.js` — coordinates all containers, equipment, moves, stacking, turn processing.
- `client/src/game/inventory/gridUtils.js` — 15-line `items` normalizer (Map/array/object → array). Nothing notable.
- `client/src/components/Inventory/ContainerGrid.tsx` — thin React wrapper over `UniversalGrid`.
- `client/src/game/inventory/Container.js` — grid math (placement, collision, rotation, stacking).
- `client/src/components/Inventory/UniversalGrid.tsx` + `client/src/contexts/InventoryContext.jsx` — selection/drag state.
- `client/src/game/utils/TurnProcessingUtils.js` + `client/src/game/map/GameMap.js` — power/charger simulation.

## Fixes already applied (this pass)

These three were fixed directly in `InventoryManager.js`:

1. **Battery-split duplication** (`placeItemAt` on the virtual `item-mod-`/`clothing:` container). `Item.splitStack()` intentionally does not decrement the source; the virtual container split off one battery but re-added the source stack at full count, netting a free battery per pull. Now decrements the source after splitting, matching `attachItemToWeapon`.
2. **`checkRecursion` substring false-positives.** The broad `targetId.includes(itemId)` guard wrongly flagged legal moves whenever one `instanceId` was a textual prefix of another (same-millisecond ids like `...-1` vs `...-12`, or split ids `${itemId}-split-...`). Replaced with exact `${itemId}-container` / `${itemId}-grid` matching; pockets remain handled by the dedicated case below it, and `ownerId` is the robust structural check.
3. **Partial stack merge returned failure after committing state.** A drop that merged part of a stack into an occupant but left a remainder fell through to the failure path: the merge stuck, the remainder was re-added "anywhere," yet `moveItem` returned `{ success: false }` so the React layer skipped `notifyUpdate` and kept a stale selection. Now detects the partial merge, re-homes the remainder to source, and returns `{ success: true, merged: true, partial: true }`.

---

## Remaining findings (not yet changed)

### Rotation edge cases

- **`Item.rotate()` ignores `placeItemAt`'s return value** — `Item.js` ~L1050. After `isAreaFree` passes, it clears the footprint and re-places, but `placeItemAt` re-runs `validateNesting`, which can reject (e.g. a non-empty container in a non-ground container). If that fires, grid cells are cleared while the item stays in the `items` Map — a ghost item other items can be dropped onto. Hard to reach today (fillable-while-nested containers mostly carry `OPENABLE_WHEN_NESTED`, which is exempt), but the unchecked return is fragile.
- **Failed moves don't restore rotation** — `moveItem` sets `item.rotation = rotation` before placement and never restores it on failure; the fallback `addItem` can auto-rotate further. `clearSelected` similarly writes `item.rotation = originalRotation` and ignores the `placeItemAt` result — if the origin cell is now occupied, the item's rotation disagrees with its written grid footprint until the next removal's whole-grid scan self-heals it.
- **Two rotation state spaces.** Container auto-rotate can produce `rotation: 270` (`(0 - 90 + 360) % 360` for portrait items), while `Item.rotate()` / `rotateSelected` only toggle 0↔90. Downstream treats 90/270 equivalently, but saves persist 270 and the toggle silently normalizes back to 0. Worth unifying to one canonical set.
- **Planting passes `rotation` as `allowStacking`** — `InventoryContext.jsx` ~L522 calls `targetContainer.addItem(tempPlant, plantX, plantY, rotation)`, but the 4th arg is `allowStacking`. Rotation is never applied and a 90° selection becomes a truthy stack flag. Benign only because plants aren't stackable and the planter slot is square.

### Boundary checks

- **`updateItemFootprint` silently truncates** — `Container.js` L329-337 only writes in-bounds cells. A growing water puddle (`getActualWidth` scales with `ammoCount`) near an edge reports 3×3 but occupies only the in-bounds cells, so other items can overlap it.
- **`ignoreSize` bypasses bounds entirely** — `validatePlacement` skips the bounds check when `ignoreSize`, and `placeItemAt` then writes `this.grid[y][x]` unguarded. A drop coordinate outside a 1×1 tool slot would throw on `undefined[x]`. Currently only reachable via (0,0) drops, but nothing enforces that here.
- **Stacking pre-check reads out-of-bounds by design** — `validatePlacement` uses `?.` to allow stacking into narrow pockets, so it can return `valid: true, stackTarget` for a spot `placeItemAt` would reject if the stack doesn't fully fit. `placeItemAt`'s all-or-nothing merge guard covers the desync — safe only as long as callers treat `false` as a rollback signal.

### State synchronization (React layer)

- **ContainerGrid rejects drops from virtual sources** — `ContainerGrid.tsx` L58 validates via `sourceContainer.items.get(itemId)`, but virtual `equipment-*` / `item-mod-*` containers expose an intentionally empty `items` Map. HTML5-drag drops out of an equipment slot fail the pre-check even though `moveItem` handles equipment sources. The selection-based flow sidesteps this, so it only bites the legacy drag path.
- **Stale live references across `syncWithMap`** — the selection holds a direct `Item` reference while the item stays in its source container. `syncWithMap` / `refreshGroundItems` rebuild the ground container from JSON into new instances. `placeSelected` survives (re-looks-up by `instanceId`) but `clearSelected` re-inserts the old instance via `placeItemAt`, overwriting the Map entry and orphaning the reloaded instance. Low probability (selection is usually modal), but it's the classic mutable-model / React-snapshot tear.
- **Inconsistent change-notification discipline** — `moveItem` emits `inventoryChanged` only in merge/combine branches; plain placements rely on the React caller's `engine.notifyUpdate()`. Any non-React caller of `moveItem` leaves the pulse counter stale. (The partial-merge fix above now emits explicitly.)

### Power management interactions

- **Crank Max burns AP past full** — `InventoryContext.jsx` L841-845 loops `apNeeded` times with no early exit once every battery is full. "Crank Max" with 20 AP and a battery needing 2 charge wastes 18 AP. Add a per-iteration "any battery still needs charge" check.
- **Duplicated, disagreeing capacity fallbacks** — `crankCharger` uses `capacity || (large ? 100 : 10)` while `chargeBatteries` uses `capacity || 100`. If a battery def ever lacks `capacity`, the crank UI declares it full at 10 while every other charger fills to 100.
- **Chargers accept by category but charge by hardcoded defId** — charger grids allow `ItemCategory.BATTERY` / `LARGE_BATTERY`, but `chargeBatteries` only touches `tool.battery` / `tool.large_battery` literally. Any future battery def slots in and silently never charges.
- **Two parallel turn-processing engines kept in sync by hand** — the player's tile runs `InventoryManager._processItemTurnRecursive` over `Item` instances; every other tile runs `GameMap._processItemDataTurn` over serialized POJOs. They agree on rates today, but semantics already diverge: the player-tile solar path adds `!isInPlayerInventory` and uses the player's outdoors flag, while the map path charges a solar charger nested inside a closed wagon/safe as long as tile terrain is road/sidewalk/grass. Powered-ness differs too (`isContainerPowered` owner-chain walk vs. map tile-level `isTilePowered` + sibling `providesInternalPower`). Every new power rule must be written twice — the likeliest source of the next drift bug. Consider consolidating onto one code path.
- **Wagon interplay is otherwise sound** — `GROUND_ONLY` + `isVehicle` in `validateNesting` correctly confines wagons while letting chargers ride inside, and the running-turret move guard's `-container`/`-grid` exemption is backstopped by `GROUND_ONLY` nesting rules (a live turret can enter a wagon but not a backpack).

## Suggested priority for the remaining items

- [x] **1. Crank Max AP waste** (clear player-facing bug, small fix) — **Completed**
- [ ] **2. Consolidate the two turn-processing engines** (structural risk; prevents future drift) — **Pending**
- [ ] **3. Charger category-vs-defId mismatch and capacity-fallback disagreement** (latent, bite on any new battery def) — **Pending**
- [ ] **4. Rotation restore-on-failure and the `Item.rotate()` unchecked return** (hardening) — **Pending**
- [ ] **5. Virtual-source drop rejection and stale-reference tear** (legacy/edge paths) — **Pending**

---

## Action Plan

_Date: 2026-07-14_

Each section below maps to a finding above and specifies exactly what to change, where, and why. Items are ordered by priority (highest first).

---

### ACTION 1 — Fix "Crank Max" AP waste

**Status:** Completed
**Priority:** 1 (player-facing bug, small fix)
**Risk:** Very low — additive early-exit guard, no structural change.
**Files:**

#### `client/src/contexts/InventoryContext.jsx` — `crankCharger` (~L965–1013)

The current loop at L1003–1005 runs `apNeeded` iterations unconditionally:

```js
for (let i = 0; i < apNeeded; i++) {
   TurnProcessingUtils.chargeBatteries(batteries);
}
```

**Change:** Add an early-exit check inside the loop so that if every battery is already at capacity, the loop breaks and only the AP actually spent is deducted.

```js
let cranksPerformed = 0;
for (let i = 0; i < apNeeded; i++) {
  // Check if any battery still needs charge before cranking
  const anyNeedsCharge = batteries.some(b => {
    const max = b.capacity || (b.defId === 'tool.high_capacity_battery' ? 400 : (b.defId === 'tool.large_battery' ? 100 : 10));
    return (b.ammoCount || 0) < max;
  });
  if (!anyNeedsCharge) break;

  TurnProcessingUtils.chargeBatteries(batteries);
  cranksPerformed++;
}

if (cranksPerformed === 0) {
  addLog("All batteries are already full.", 'info');
  playSound('Click');
  return { success: false, reason: 'Full' };
}

player.useAP(cranksPerformed);
addLog(`You crank the charger ${cranksPerformed} time${cranksPerformed > 1 ? 's' : ''}.`, 'item');
```

This replaces the existing `player.useAP(apNeeded)` call at L1007, so only the cranks that actually delivered charge cost AP.

**Validation:** Manual test — load a charger with a nearly-full battery (e.g. 9/10), select "Crank Max" with high AP. Verify only 1 AP is spent and the battery reaches 10/10.

---

### ACTION 2 — Unify the two turn-processing engines

**Status:** Pending
**Priority:** 2 (structural risk — prevents future feature drift)
**Risk:** Medium — touches the hot path for every tile's turn processing. Needs thorough testing.
**Files:**

#### `client/src/game/utils/TurnProcessingUtils.js`

Expand this module to be the single source of truth for per-item turn effects. Move the charger/solar/power-source/expiration/transformation logic into a new unified function:

```js
/**
 * processItemTurn(itemData, context)
 * @param {Object|Item} itemData - works on both POJO and Item instances
 * @param {Object} context - { isPowered, isOutdoors, isDaylight, isInPlayerInventory }
 * @returns {{ expired: boolean, modified: boolean }}
 */
```

The function should use duck-typing to handle both `Item` instances (which have `hasTrait()`) and raw POJOs (which have `traits[]`). A small helper like `hasTrait(itemData, trait)` that checks both shapes keeps call sites clean.

Key semantic decisions to resolve during implementation:
- **Solar charger outdoors detection:** The InventoryManager path uses the player's `isOutdoors` flag and blocks charging when `isInPlayerInventory`. The GameMap path checks tile terrain (`road`/`sidewalk`/`grass`). The InventoryManager behavior is more correct (a solar charger inside a closed building on a road tile shouldn't charge). The unified path should accept an explicit `isOutdoors` boolean and a `isInPlayerInventory` flag, computed by the caller.
- **Powered-ness:** Keep the caller responsible for computing `isPowered` and passing it in. `InventoryManager` uses its `isContainerPowered()` owner-chain walk; `GameMap` uses tile-level `isTilePowered` + sibling `providesInternalPower`. Both approaches are valid for their domains; the divergence is in what "powered" means for nested items, which the caller already resolves before recursing.

#### `client/src/game/inventory/InventoryManager.js` — `_processItemTurnRecursive` (~L3142–3222)

Replace the inline charger/solar/power-source blocks (L3176–3198) with a call to `TurnProcessingUtils.processItemTurn(item, context)`. Keep the recursion structure (attachments → container grid → pockets) and the `processedItemIds` dedup set here, since those are InventoryManager-specific concerns. The expiration/transformation logic (L3147–3173) should also move into `TurnProcessingUtils` so both engines share it.

#### `client/src/game/map/GameMap.js` — `_processItemDataTurn` (~L1029–1175)

Same refactor — replace inline power/charger/solar/hotplate/turret/decay blocks with a call to the unified `TurnProcessingUtils.processItemTurn()`. Keep the POJO-specific recursion logic (filtering expired items out of arrays/objects, mutating `containerGrid.items`) here.

#### `client/src/game/inventory/InventoryManager.js` — `_chargeBatteries` (L3228–3231)

Delete this deprecated wrapper entirely. It already delegates to `TurnProcessingUtils.chargeBatteries` and has no callers outside the class.

**Validation:**
1. Add a temporary `console.log` at the top of the unified function to confirm both paths invoke it.
2. Test: place a battery charger with a small battery on the ground next to a running generator. Walk away so the tile switches to map-side processing. Walk back. Verify the battery charged at 5/turn consistently.
3. Test: place a solar charger with a battery on grass outdoors during daytime. Verify it charges. Place it inside a building — verify it stops.
4. Regression: verify food spoilage, plant growth, generator fuel drain, hotplate drain, and turret drain all still work on both the player tile and remote tiles.

---

### ACTION 3 — Fix charger category-vs-defId mismatch and capacity fallback disagreement

**Status:** Pending
**Priority:** 3 (latent bug — bites on any new battery definition)
**Risk:** Low — logic change in one central function.
**Files:**

#### `client/src/game/utils/TurnProcessingUtils.js` — `chargeBatteries` (L13–26)

Currently hardcodes `tool.battery`, `tool.large_battery`, `tool.high_capacity_battery`:

```js
if (battery.defId === 'tool.battery' || battery.defId === 'tool.large_battery' || battery.defId === 'tool.high_capacity_battery') {
```

**Change:** Replace the `defId` whitelist with a category/trait check. Batteries are already categorized with `ItemCategory.BATTERY` or `ItemCategory.LARGE_BATTERY` when they enter the charger grid. Use the same duck-typed helper:

```js
const isBattery = (b) => {
  if (typeof b.hasCategory === 'function') {
    return b.hasCategory(ItemCategory.BATTERY) || b.hasCategory(ItemCategory.LARGE_BATTERY);
  }
  return b.categories?.includes('battery') || b.categories?.includes('large_battery');
};
```

This way any future battery def that has the right category will charge automatically.

#### Capacity fallback unification

Currently capacity fallback logic is duplicated in:
- `TurnProcessingUtils.chargeBatteries` (L19): `capacity || (hcb ? 400 : (large ? 100 : 10))`
- `InventoryContext.jsx` `crankCharger` (L992): same formula

**Change:** Extract a `getMaxCharge(battery)` helper into `TurnProcessingUtils`:

```js
getMaxCharge(battery) {
  if (battery.capacity) return battery.capacity;
  // Fallback chain based on defId for legacy saves without capacity field
  if (battery.defId === 'tool.high_capacity_battery') return 400;
  if (battery.defId === 'tool.large_battery') return 100;
  return 10;
}
```

Call this from both `chargeBatteries` and `crankCharger` so the two paths can never disagree.

**Validation:** Add a test battery def (or temporarily rename `tool.battery` in a save) that has the `battery` category but a non-standard `defId`. Verify it charges in a charger and responds correctly to "Crank Max."

---

### ACTION 4 — Harden rotation: restore-on-failure, unchecked `Item.rotate()`, state space, planting parameter

**Status:** Pending
**Priority:** 4 (hardening — prevents ghost items and subtle state desyncs)
**Risk:** Low-to-medium — rotation touches placement which is high-traffic, but changes are defensive guards.
**Files:**

#### 4a. `Item.js` — `rotate()` (~L1050): check `placeItemAt` return

After the `isAreaFree` check and grid-clear, `rotate()` calls `placeItemAt`. If `placeItemAt` returns `false` (e.g. `validateNesting` rejects), the item's old grid cells are already cleared, creating a ghost.

**Change:** If `placeItemAt` returns `false`, restore the original rotation and re-place at the old position:

```js
rotate() {
  // ... existing isAreaFree check ...
  this._container.clearItemFootprint(this);
  const newRotation = this.rotation === 0 ? 90 : 0;
  const oldRotation = this.rotation;
  this.rotation = newRotation;

  if (!this._container.placeItemAt(this, this.x, this.y)) {
    // Rollback: restore rotation and re-place
    this.rotation = oldRotation;
    this._container.placeItemAt(this, this.x, this.y);
  }
}
```

#### 4b. `client/src/contexts/InventoryContext.jsx` — `clearSelected` (~L550–565): guard `placeItemAt` result

Currently at L558–559, `clearSelected` sets `item.rotation = originalRotation` and calls `container.placeItemAt(item, originX, originY)` without checking the return. If the origin cell is now occupied (e.g. another item was placed there while this item was selected), the item becomes a ghost.

**Change:** If `placeItemAt` returns `false`, fall back to `container.addItem(item)` (auto-position) so the item goes somewhere valid rather than nowhere:

```js
item.rotation = originalRotation;
if (!container.placeItemAt(item, originX, originY)) {
  // Origin occupied — auto-place anywhere in the same container
  if (!container.addItem(item)) {
    // Last resort — drop on ground
    engine.inventoryManager.groundContainer.addItem(item);
  }
}
```

#### 4c. `client/src/game/inventory/Container.js` — `addItem` (~L589–591): normalize rotation values

The auto-rotate logic at L589–591 produces `rotation: 270` via `(originalRotation - 90 + 360) % 360`. Downstream code and `rotateSelected` only use `0` and `90`.

**Change:** Normalize the computed `altRotation` to the canonical set `{0, 90}` before assigning:

```js
// Normalize to canonical rotation (0 or 90)
const altRotation = isLandscape ? 90 : 0;
```

This is safe because for placement purposes, `90` and `270` produce identical width/height swaps. Saves will no longer persist the non-canonical `270` value.

#### 4d. `client/src/contexts/InventoryContext.jsx` — planting parameter fix (~L618)

L618 calls `targetContainer.addItem(tempPlant, plantX, plantY, rotation)` where `rotation` is the selected item's rotation state, but `addItem`'s 4th parameter is `allowStacking`. This is benign today (plants aren't stackable, planter is square) but is a latent correctness issue.

**Change:** Pass `false` explicitly for `allowStacking` (planting should never attempt stacking), and drop the stray `rotation` value:

```js
const plantSuccess = targetContainer.addItem(tempPlant, plantX, plantY, false);
```

**Validation:**
- 4a: Find or craft a scenario where rotating an item triggers `validateNesting` rejection (e.g. a non-empty nested container). Verify the item doesn't become a ghost — it should stay at its original rotation.
- 4b: Select an item, then via console force-place another item into the origin cell. Press Escape (clearSelected). Verify the selected item auto-positions instead of vanishing.
- 4c: Trigger auto-rotate by placing a tall item into a wide slot. Check that `item.rotation` is `0` or `90`, never `270`.
- 4d: Plant a seed in a planter while the selection has `rotation: 90`. Verify it works identically to before (no functional change, just correctness).

---

### ACTION 5 — Fix boundary check issues

**Status:** Pending
**Priority:** 5 (defensive hardening)
**Risk:** Low — all changes are additional guards, no behavioral change for in-bounds operations.
**Files:**

#### 5a. `client/src/game/inventory/Container.js` — `updateItemFootprint` (L318–337): clamp or reject

Currently writes only in-bounds cells silently. A dynamically-growing item near an edge reports a size larger than what's actually written.

**Change — option A (clamp and warn):** Keep the current behavior but log a warning when any cell is skipped, so the issue is visible during development:

```js
for (let dy = 0; dy < h; dy++) {
  for (let dx = 0; dx < w; dx++) {
    if (this.isValidPosition(item.x + dx, item.y + dy)) {
      this.grid[item.y + dy][item.x + dx] = itemId;
    } else {
      console.warn(`[Container] updateItemFootprint: cell (${item.x + dx}, ${item.y + dy}) out of bounds for ${item.name} in ${this.id}`);
    }
  }
}
```

**Change — option B (relocate):** If any cell falls out of bounds, call `removeItemFromGrid` + `addItem` to auto-reposition the item where it fully fits. More robust but riskier during a turn-processing tick.

**Recommendation:** Option A for now. The warning makes the edge case visible. A proper fix would involve preventing water puddles from growing beyond container bounds at the source (`ammoCount` logic).

#### 5b. `client/src/game/inventory/Container.js` — `placeItemAt` (~L474–486): guard `ignoreSize` writes

When `ignoreSize` is true, bounds validation is skipped (L475). The subsequent grid write at L484–486 uses `this.grid[y + dy]?.[x + dx]` with optional chaining for reads, but the actual write after occupant checking writes directly. If coordinates are out of bounds, `this.grid[y + dy]` could be `undefined`.

**Change:** Add a bounds clamp for `ignoreSize` containers to enforce that coordinates are at least `(0,0)`:

```js
if (this.ignoreSize) {
  x = Math.max(0, Math.min(x, this.grid[0]?.length - 1 || 0));
  y = Math.max(0, Math.min(y, this.grid.length - 1 || 0));
}
```

This ensures even `ignoreSize` containers can't write outside their grid allocation.

**Validation:** Hard to test directly since the crash path requires a drop coordinate outside a 1×1 slot, which current UI prevents. Add a unit-test-style console check: `container.placeItemAt(item, 5, 5)` on a 1×1 `ignoreSize` container — verify it doesn't throw.

---

### ACTION 6 — Fix React state synchronization issues

**Status:** Pending
**Priority:** 6 (legacy/edge paths)
**Risk:** Low-to-medium — touches drag-drop and selection state.
**Files:**

#### 6a. `client/src/components/Inventory/ContainerGrid.tsx` — virtual source drop rejection (~L58)

The HTML5 drag-drop handler validates the dragged item via `sourceContainer.items.get(itemId)`, but virtual containers (equipment slots, item-mod slots) have empty `items` Maps by design.

**Change:** Before falling back to the `items.get` check, try the InventoryManager's `findItem(itemId)` which searches across all containers including virtual ones:

```tsx
const item = sourceContainer.items.get(itemId)
  ?? engine.inventoryManager?.findItem(itemId)?.item;
if (!item) return; // truly invalid
```

This preserves the safety check (item must exist somewhere) while allowing equipment-slot drags.

#### 6b. `client/src/contexts/InventoryContext.jsx` — stale reference in `clearSelected` (~L550–565)

When `syncWithMap` / `refreshGroundItems` rebuilds ground items from JSON, the selection's `item` reference points to the old (now-orphaned) `Item` instance. `clearSelected` re-inserts this stale instance into the container, overwriting the fresh one.

**Change:** In `clearSelected`, before re-inserting, re-resolve the item by `instanceId`:

```js
const clearSelected = useCallback(() => {
  if (selectedItem && engine.inventoryManager) {
    const { item, originContainerId, originX, originY, originalRotation } = selectedItem;
    if (item.stackCount > 0) {
      const container = engine.inventoryManager.getContainer(originContainerId);
      if (container) {
        // Re-resolve to avoid inserting a stale reference
        const fresh = container.items.get(item.instanceId) || item;
        fresh.rotation = originalRotation;
        if (!container.items.has(fresh.instanceId)) {
          container.placeItemAt(fresh, originX, originY);
        }
        engine.notifyUpdate();
      }
    }
  }
  setSelectedItem(null);
}, [selectedItem]);
```

If the item already exists in the container (because `syncWithMap` reloaded it), we skip the re-insert entirely.

#### 6c. `client/src/game/inventory/InventoryManager.js` — consistent `inventoryChanged` emission

Currently `moveItem` only emits `inventoryChanged` in merge/combine branches. Plain placements rely on the React caller.

**Change:** Add `this.emit('inventoryChanged')` at the end of `moveItem`'s success path (just before `return { success: true }`). This is idempotent — the React layer's `notifyUpdate()` can still fire too, and duplicate events are harmless (they just bump the pulse counter).

**Validation:**
- 6a: Attempt an HTML5 drag from an equipment slot to a container. Verify it succeeds instead of silently failing.
- 6b: Select a ground item, then trigger a `syncWithMap` (e.g. move to an adjacent tile and back). Press Escape. Verify no duplicate items appear.
- 6c: Call `moveItem` from a non-React context (e.g. console). Verify the UI updates.

---

### Summary of all changes by file

| File | Actions |
|---|---|
| `client/src/contexts/InventoryContext.jsx` | 1 (crank fix), 4b (clearSelected guard), 4d (planting param), 6b (stale ref) |
| `client/src/game/utils/TurnProcessingUtils.js` | 2 (unified engine), 3 (category check + getMaxCharge) |
| `client/src/game/inventory/InventoryManager.js` | 2 (delegate to unified), 2 (delete `_chargeBatteries`), 6c (emit inventoryChanged) |
| `client/src/game/map/GameMap.js` | 2 (delegate to unified) |
| `client/src/game/inventory/Item.js` | 4a (rotate rollback) |
| `client/src/game/inventory/Container.js` | 4c (normalize rotation), 5a (footprint warning), 5b (ignoreSize guard) |
| `client/src/components/Inventory/ContainerGrid.tsx` | 6a (virtual source fix) |
