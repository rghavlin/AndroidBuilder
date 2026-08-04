/**
 * containerSearch - recursive traversal of container trees.
 *
 * A container's items can themselves hold storage: a nested grid
 * (`getContainerGrid()`), clothing pockets (`getPocketContainers()`), or a grid
 * hanging off an attachment (a pouch on a belt, a storage weapon mod). Every
 * one of these has to be walked or items become invisible to search, counting,
 * consumption and stack merging — the "the game ignores my belt pouch" class of
 * bug. Keep the four walks below in step with each other.
 *
 * These are free functions with no InventoryManager state; InventoryManager
 * delegates its `_*Recursive` methods here.
 */

/** Every storage grid an item exposes directly (not via attachments). */
function ownGrids(item) {
  const grids = [];
  const grid = item.getContainerGrid?.();
  if (grid) grids.push(grid);
  const pockets = item.getPocketContainers?.();
  if (pockets) grids.push(...pockets);
  return grids;
}

/** Every storage grid reachable through an item's attachments. */
function attachmentGrids(item) {
  if (!item.attachments) return [];
  const grids = [];
  for (const att of Object.values(item.attachments)) {
    if (!att) continue;
    grids.push(...ownGrids(att));
  }
  return grids;
}

/** All storage grids below an item: its own plus its attachments'. */
export function nestedGrids(item) {
  return [...ownGrids(item), ...attachmentGrids(item)];
}

/**
 * Find an item by instanceId (falling back to defId for legacy callers).
 * Returns { item, container } — or { item, parent, attachmentSlot } when the
 * match is an attached item rather than a grid occupant — or null.
 */
export function findItemRecursive(container, itemId) {
  if (!container || !container.items) return null;

  for (const item of container.items.values()) {
    if (item.instanceId === itemId) {
      return { item, container };
    }

    // Fallback for legacy support or explicit defId searches if needed
    // (But we should avoid this for state-mutating operations)
    if (item.id === itemId) {
      console.warn(`[containerSearch] findItemRecursive matched by defId (legacy): ${itemId} in container ${container.id}`);
      return { item, container };
    }

    // An attachment can be the match itself, or can hold the match in a grid
    // of its own (belt pouch).
    if (item.hasAttachments && item.hasAttachments()) {
      for (const [attachSlot, attachment] of Object.entries(item.attachments)) {
        if (!attachment) continue;
        if (attachment.instanceId === itemId || attachment.id === itemId) {
          if (attachment.id === itemId && attachment.instanceId !== itemId) {
            console.warn(`[containerSearch] findItemRecursive matched attachment by defId (legacy): ${itemId}`);
          }
          return { item: attachment, parent: item, attachmentSlot: attachSlot };
        }
      }
    }

    for (const grid of nestedGrids(item)) {
      const found = findItemRecursive(grid, itemId);
      if (found) return found;
    }
  }

  return null;
}

/** Total units of `defId` in this container tree (stacks counted by stackCount). */
export function countItemRecursive(container, defId) {
  if (!container || !container.items) return 0;

  let count = 0;
  for (const item of container.items.values()) {
    if (item.defId === defId) count += (item.stackCount || 1);

    if (item.attachments) {
      for (const att of Object.values(item.attachments)) {
        if (att && att.defId === defId) count += (att.stackCount || 1);
      }
    }

    for (const grid of nestedGrids(item)) {
      count += countItemRecursive(grid, defId);
    }
  }
  return count;
}

/**
 * Find an existing stack in this container tree that `item` can merge into.
 * Returns { existingItem, container } or null.
 */
export function findStackRecursive(container, item) {
  if (!container || !container.items) return null;

  for (const existingItem of container.items.values()) {
    // Never merge an item into itself. If `item` is still present in the
    // container being searched (a caller forgot to remove it first, or a
    // stale backref made the removal a no-op), matching it against itself
    // would fold its own count away and leave a zombie in the grid.
    if (existingItem.instanceId === item.instanceId) continue;
    if (existingItem.canStackWith(item) && existingItem.stackCount < existingItem.stackMax) {
      return { existingItem, container };
    }

    for (const grid of nestedGrids(existingItem)) {
      const found = findStackRecursive(grid, item);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Consume up to `remaining` units of `defId` from this container tree.
 * Returns how many units are still outstanding.
 */
export function consumeItemRecursive(container, defId, remaining) {
  if (!container || !container.items || remaining <= 0) return remaining;

  const items = Array.from(container.items.values());
  for (const item of items) {
    if (item.defId === defId) {
      const stackMode = item.stackCount !== undefined && item.stackCount !== null;
      const available = stackMode ? item.stackCount : 1;
      const consume = Math.min(available, remaining);

      if (stackMode) {
        item.stackCount -= consume;
        if (item.stackCount <= 0) {
          container.removeItem(item.instanceId);
        }
      } else {
        container.removeItem(item.instanceId);
      }

      remaining -= consume;
      if (remaining <= 0) return 0;
    }

    // Attached items are consumable too (ammo in a weapon's ammo slot).
    if (item.attachments) {
      for (const attSlot of Object.keys(item.attachments)) {
        const att = item.attachments[attSlot];
        if (!att || att.defId !== defId) continue;

        const stackMode = att.stackCount !== undefined && att.stackCount !== null;
        const available = stackMode ? att.stackCount : 1;
        const consume = Math.min(available, remaining);

        if (stackMode) {
          att.stackCount -= consume;
          if (att.stackCount <= 0) delete item.attachments[attSlot];
        } else {
          delete item.attachments[attSlot];
        }

        remaining -= consume;
        if (remaining <= 0) return 0;
      }
    }

    for (const grid of nestedGrids(item)) {
      remaining = consumeItemRecursive(grid, defId, remaining);
      if (remaining <= 0) return 0;
    }
  }
  return remaining;
}
