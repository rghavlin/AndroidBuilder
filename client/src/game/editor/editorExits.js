/**
 * editorExits - exit arrows in the map editor's tile format ({ terrain, items }).
 *
 * Exits are placeable.exit items carrying their destination, like stairs (see
 * inventory/transitionFields.js). Maps saved before that marked exits with a
 * 'transition' terrain (generated roads: a dark square the editor couldn't
 * edit) or a tile-level `mapTransition`; both are converted here on load.
 */
import { copyTransitionFields, edgeExitFields, fieldsFromLegacyMapTransition } from '../inventory/transitionFields.js';

const isExit = (item) => item.defId === 'placeable.exit';
const exitItem = (fields) => copyTransitionFields(fields, { defId: 'placeable.exit' });

/** Add an exit for a legacy authored transition ({ targetType, targetId, level }) unless the tile has one. */
export function addLegacyTransitionItem(tile, tr) {
  if (!tile.items.some(isExit)) tile.items.push(exitItem(fieldsFromLegacyMapTransition(tr)));
}

/**
 * Convert legacy exit markers on editor tiles, in place: 'transition' terrain
 * becomes road, and a tile-level mapTransition (or an edge 'transition' tile)
 * becomes an exit item. Returns the same grid.
 */
export function migrateEditorTransitionTiles(tiles) {
  const height = tiles.length;
  tiles.forEach((row, y) => row.forEach(tile => {
    const tr = tile.mapTransition;
    const wasTransition = tile.terrain === 'transition';
    if (wasTransition) tile.terrain = 'road';
    delete tile.mapTransition;
    if (tile.items.some(isExit)) return;
    const fields = tr ? fieldsFromLegacyMapTransition(tr) : wasTransition ? edgeExitFields(y, height) : null;
    if (fields) tile.items.push(exitItem(fields));
  }));
  return tiles;
}
