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
