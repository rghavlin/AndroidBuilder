/**
 * Authored contents + lock state for containers placed in the map editor
 * (currently the safe: any def with a containerGrid and an isLocked default).
 *
 * The editor keeps a container's contents as a flat item list. On export they
 * are packed into the def's real Container grid, so the shipped JSON carries
 * placed x/y and the container rules (size, allowedCategories) are enforced
 * here — the same rejection the game would apply — instead of items silently
 * vanishing on load.
 */
import { Container } from '../inventory/Container.js';
import { Item } from '../inventory/Item.js';
import { ItemDefs } from '../inventory/ItemDefs.js';
import { ItemTrait } from '../inventory/traits.js';

/** True when the editor should offer Locked + Contents controls for this def. */
export function isLockableContainer(defId) {
  const def = ItemDefs[defId];
  return !!def?.containerGrid && def.isLocked !== undefined;
}

/**
 * Pack item JSON into a fresh grid for `containerDefId`.
 * @param {string} containerDefId
 * @param {object[]} itemsJson - full item JSON (createItemFromDef shape)
 * @param {string} ownerId - instanceId of the container item
 * @returns {{ containerGrid: object|null, rejected: number[] }} the serialized
 *   grid (an Item's containerGrid field) and indices of items that did not fit.
 */
export function packContainerContents(containerDefId, itemsJson, ownerId) {
  const def = ItemDefs[containerDefId];
  if (!def?.containerGrid) return { containerGrid: null, rejected: itemsJson.map((_, i) => i) };

  const grid = Container.fromJSON({
    ...def.containerGrid,
    id: `${ownerId}-container`,
    name: def.name,
    ownerId,
  });

  const rejected = [];
  itemsJson.forEach((data, i) => {
    const item = Item.fromJSON(data);
    // Furniture-sized things (another safe) can't go in a pocket of any kind.
    if (item.hasTrait?.(ItemTrait.GROUND_ONLY)) { rejected.push(i); return; }
    if (grid.addItem(item)) return;
    item.rotation = item.rotation === 0 ? 90 : 0;
    if (!grid.addItem(item)) rejected.push(i);
  });

  return { containerGrid: grid.toJSON(), rejected };
}
