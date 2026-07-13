import { createItemFromDef } from '../inventory/ItemDefs.js';
import { Item } from '../inventory/Item.js';

/**
 * Apply an event's item grants: spawn the specified items onto their authored
 * tiles. Shared by both event systems (modal dialog eventTriggers and on-map
 * speech bubble events), so "an NPC gives the player an item" is expressed as a
 * grant that drops the item on a tile the player can pick up.
 *
 * Grant shape (authored in the map editor):
 *   { defId: string, count?: number, x: number, y: number }
 *
 * While the player stands on a tile, that tile's items live in the inventory
 * manager's live "ground container" and the map tile itself is emptied. So a
 * grant that targets the player's current tile must be pushed into the ground
 * container, not the map tile — otherwise it shows in the tooltip/entity map but
 * not the GROUND panel, and gets clobbered on the next move-sync.
 *
 * @param {Object} gameMap - the live GameMap
 * @param {Array} grants
 * @param {Object} [inventoryManager] - engine.inventoryManager, for the on-player-tile case
 * @returns {number} how many items were placed
 */
export function applyItemGrants(gameMap, grants, inventoryManager = null) {
  if (!gameMap || !Array.isArray(grants) || grants.length === 0) return 0;

  const syncedX = inventoryManager ? inventoryManager.lastSyncedX : null;
  const syncedY = inventoryManager ? inventoryManager.lastSyncedY : null;

  let placed = 0;
  let groundChanged = false;
  for (const g of grants) {
    if (!g || !g.defId) continue;
    if (typeof g.x !== 'number' || typeof g.y !== 'number') continue;

    const count = Math.max(1, Math.floor(g.count || 1));
    const items = [];
    for (let i = 0; i < count; i++) {
      const def = createItemFromDef(g.defId);
      if (def) items.push(new Item(def));
    }
    if (items.length === 0) {
      console.warn(`[applyItemGrants] Unknown item def "${g.defId}" — skipped`);
      continue;
    }

    const onPlayerTile = inventoryManager && syncedX === g.x && syncedY === g.y;
    if (onPlayerTile && inventoryManager.groundManager) {
      for (const item of items) {
        if (inventoryManager.groundManager.addItemSmart(item)) {
          groundChanged = true;
          placed += 1;
        } else {
          console.warn(`[applyItemGrants] Ground full — could not place ${g.defId} at player tile (${g.x}, ${g.y})`);
        }
      }
      console.log(`[applyItemGrants] Placed ${items.length}x ${g.defId} into ground container at player tile (${g.x}, ${g.y})`);
    } else if (typeof gameMap.addItemsToTile === 'function') {
      gameMap.addItemsToTile(g.x, g.y, items);
      placed += items.length;
      console.log(`[applyItemGrants] Placed ${items.length}x ${g.defId} at (${g.x}, ${g.y})`);
    }
  }

  if (groundChanged && typeof inventoryManager.emit === 'function') {
    inventoryManager.emit('inventoryChanged');
  }
  return placed;
}
