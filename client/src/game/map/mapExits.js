/**
 * mapExits - placing, finding and migrating the exit arrow items
 * (placeable.exit) that move the player between maps.
 *
 * An exit is an ordinary tile with an arrow item on it, carrying its own
 * destination (see inventory/transitionFields.js) — the same model as stairs.
 * There used to be a 'transition' terrain that spawned the arrow and was where
 * the destination got worked out from; that terrain is gone, and the migrate*
 * helpers below convert maps, scenarios and saves that still contain it.
 */
import { createItemFromDef } from '../inventory/ItemDefs.js';
import {
  copyTransitionFields, edgeExitFields, fieldsFromLegacyMapTransition, transitionTypeOf,
} from '../inventory/transitionFields.js';

export const EXIT_DEF_ID = 'placeable.exit';
const isExit = (item) => item?.defId === EXIT_DEF_ID;

/** Plain item data for an exit arrow with the given transition fields. */
export function exitItemData(fields) {
  return copyTransitionFields(fields, createItemFromDef(EXIT_DEF_ID));
}

/** Put an exit on a plain tile record (generator mapData tile or MapBuilder cell). */
export function addExitToCell(cell, fields) {
  if (!cell.inventoryItems) cell.inventoryItems = [];
  cell.inventoryItems.push(exitItemData(fields));
}

/**
 * Migrate a grid of plain tile records ({ terrain, inventoryItems }) — a
 * scenario's tiles or a MapBuilder layout. Each 'transition' tile becomes road;
 * each authored mapTransition (old scenario files) and each edge 'transition'
 * tile becomes an exit item, unless an exit is already there.
 * @returns {number} exits created
 */
export function migrateLegacyTransitionCells(cells, mapTransitions = []) {
  const height = cells.length;
  const authored = new Map(mapTransitions.map(tr => [`${tr.x},${tr.y}`, tr]));
  let created = 0;
  cells.forEach((row, y) => row.forEach((cell, x) => {
    if (!cell) return;
    const tr = authored.get(`${x},${y}`);
    const wasTransition = cell.terrain === 'transition';
    if (wasTransition) cell.terrain = 'road';
    if (!tr && !wasTransition) return;
    if (cell.inventoryItems?.some(isExit)) return;
    const fields = tr ? fieldsFromLegacyMapTransition(tr) : edgeExitFields(y, height);
    if (fields) { addExitToCell(cell, fields); created++; }
  }));
  return created;
}

/**
 * Migrate a restored GameMap (an old save): 'transition' terrain becomes road,
 * and exit arrows saved without a destination get the one their tile used to
 * imply — an authored mapTransition at that spot, else the map edge.
 */
export function migrateLegacyTransitionsOnMap(gameMap) {
  const authored = new Map((gameMap.metadata?.mapTransitions || []).map(tr => [`${tr.x},${tr.y}`, tr]));
  for (let y = 0; y < gameMap.height; y++) {
    for (let x = 0; x < gameMap.width; x++) {
      const tile = gameMap.getTile(x, y);
      if (!tile) continue;
      if (tile.terrain === 'transition') tile.terrain = 'road';
      for (const item of gameMap.getItemsOnTile(x, y)) {
        if (!isExit(item) || transitionTypeOf(item)) continue;
        const tr = authored.get(`${x},${y}`);
        copyTransitionFields(tr ? fieldsFromLegacyMapTransition(tr) : edgeExitFields(y, gameMap.height), item);
      }
    }
  }
}

/** Every exit arrow on the map, with its tile. */
export function findExits(gameMap) {
  const exits = [];
  for (let y = 0; y < gameMap.height; y++) {
    for (let x = 0; x < gameMap.width; x++) {
      for (const item of gameMap.getItemsOnTile(x, y)) {
        if (isExit(item)) exits.push({ x, y, item });
      }
    }
  }
  return exits;
}

/** Tile of the first exit leading to `type` ('next' / 'previous' / ...), or null. */
export function findExitTile(gameMap, type) {
  const hit = findExits(gameMap).find(e => transitionTypeOf(e.item) === type);
  return hit ? { x: hit.x, y: hit.y } : null;
}

export const hasExitAt = (gameMap, x, y) => gameMap.getItemsOnTile(x, y).some(isExit);

/** Remove the exit arrows leading to `type`. Returns how many were removed. */
export function removeExits(gameMap, type) {
  let removed = 0;
  for (const { x, y, item } of findExits(gameMap)) {
    if (transitionTypeOf(item) !== type) continue;
    gameMap.setItemsOnTile(x, y, gameMap.getItemsOnTile(x, y).filter(i => i !== item));
    removed++;
  }
  return removed;
}
