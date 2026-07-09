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

1. Crank Max AP waste (clear player-facing bug, small fix).
2. Consolidate the two turn-processing engines (structural risk; prevents future drift).
3. Charger category-vs-defId mismatch and capacity-fallback disagreement (latent, bite on any new battery def).
4. Rotation restore-on-failure and the `Item.rotate()` unchecked return (hardening).
5. Virtual-source drop rejection and stale-reference tear (legacy/edge paths).
