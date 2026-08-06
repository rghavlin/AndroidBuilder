import { Item } from './Item.js';

/**
 * gridUtils - Shared helpers for reading container grids.
 *
 * A container grid stores its contents in `grid.items`, which may be a Map
 * (canonical runtime form), a plain array, or a plain object (legacy/serialized
 * forms). `gridItems` normalizes all of these to a plain array so callers can
 * iterate without repeating the type checks.
 */

export function gridItems(grid) {
  if (!grid || !grid.items) return [];
  if (grid.items instanceof Map) return Array.from(grid.items.values());
  if (Array.isArray(grid.items)) return grid.items;
  return Object.values(grid.items || {});
}

/**
 * Like `gridItems`, but guarantees real `Item` instances — and writes any it had
 * to inflate back into the grid, in place.
 *
 * A container that lives on an ON-MAP entity holds its contents as plain
 * serialized objects: `GameMap.convertLegacyItemToECS` copies `containerGrid`
 * across verbatim, so `grid.items` is an array of JSON, not Items. Anything that
 * calls Item methods on those entries throws (`isHostileTo is not a function`
 * was how this surfaced — a turret riding in a parked wagon never fired, because
 * TurretAI's exception was swallowed by TurretSystem's catch).
 *
 * The write-back is the load-bearing half. Inflating a throwaway copy each turn
 * would let a nested turret fire from a `fromJSON` clone whose drained magazine
 * is discarded when the turn ends — refunding its ammo forever. Storing the
 * inflated Item back into the grid makes the entity's own container the single
 * authoritative copy, so spent rounds and charge stick.
 *
 * Serialization is unaffected: `Entity.toJSON` passes a plain grid straight
 * through, and `JSON.stringify` invokes each `Item.toJSON()` on the way out.
 *
 * @param {Object} grid - a Container or a serialized container grid
 * @returns {Array<Item>}
 */
export function hydratedGridItems(grid) {
  const raw = grid?.items;
  if (!raw) return [];

  const isMap = raw instanceof Map;
  const entries = isMap
    ? [...raw.entries()]
    : (Array.isArray(raw) ? raw.map((value, index) => [index, value]) : Object.entries(raw));

  const out = [];
  for (const [key, entry] of entries) {
    if (!entry) continue;

    // Already a real Item (the ground-container path, and any grid this has
    // already run over). Item.fromJSON would hand it straight back anyway, but
    // skipping the call keeps the common case allocation-free.
    if (typeof entry.hasTrait === 'function') {
      out.push(entry);
      continue;
    }

    const item = Item.fromJSON(entry);
    if (!item) continue;

    if (isMap) raw.set(key, item);
    else raw[key] = item;
    out.push(item);
  }

  return out;
}

/**
 * True if an item is storing anything: its own container grid, any clothing
 * pocket, or any container hanging off a belt attachment. Use this before
 * destroying or transforming a container-ish item so its contents can't be
 * silently deleted.
 */
export function hasItemsInside(item) {
  if (!item) return false;

  const grids = [
    typeof item.getContainerGrid === 'function' ? item.getContainerGrid() : null,
    ...(typeof item.getPocketContainers === 'function' ? item.getPocketContainers() || [] : []),
    ...(typeof item.getBeltContainers === 'function' ? item.getBeltContainers() || [] : [])
  ];

  return grids.some(grid => gridItems(grid).length > 0);
}
