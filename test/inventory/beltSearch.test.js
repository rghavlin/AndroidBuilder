import { describe, it, expect, beforeEach } from 'vitest';
// Belt storage used to be invisible to the "where can this go / where is this"
// scans: InventoryManager.addItem only ever tried the backpack, the clothing
// pockets and the ground, so a belt pouch with free space was skipped for both
// placement and stack merging. getCarriedContainers() is now the single source
// of "containers on the player's body", and the recursive walks in
// containerSearch.js descend through attachments so pouch contents are found.
import { InventoryManager } from '../../client/src/game/inventory/InventoryManager.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';

function makeItem(defId) {
  const def = createItemFromDef(defId);
  expect(def, `missing item def ${defId}`).toBeTruthy();
  return new Item(def);
}

/** Belt in the belt slot with a 4x2 pouch attached, and no backpack/clothing. */
function equipBeltWithPouch(inv) {
  const belt = makeItem('crafting.leather_belt');
  const pouch = makeItem('belt.pouch');
  belt.attachItem('pouch', pouch);
  expect(inv.equipItem(belt, 'belt').success).toBe(true);
  inv.updateDynamicContainers();
  return { belt, pouch, pouchGrid: pouch.getContainerGrid() };
}

describe('belt storage is searched like any other carried container', () => {
  let inv;

  beforeEach(() => {
    inv = new InventoryManager();
  });

  it('lists belt pouch grids among the carried containers', () => {
    const { pouchGrid } = equipBeltWithPouch(inv);
    const carried = inv.getCarriedContainers();
    expect(carried.map(c => c.id)).toContain(pouchGrid.id);
  });

  it('auto-places an item into a belt pouch when nothing else can hold it', () => {
    const { pouchGrid } = equipBeltWithPouch(inv);
    const bandage = makeItem('medical.bandage');

    const result = inv.addItem(bandage);

    expect(result.success).toBe(true);
    // Without the fix this fell through to the ground container.
    expect(result.container).toBe(pouchGrid.id);
    expect(pouchGrid.getAllItems().map(i => i.instanceId)).toContain(bandage.instanceId);
    expect(inv.groundContainer.getAllItems()).toHaveLength(0);
  });

  it('merges into a stack that lives in a belt pouch', () => {
    const { pouchGrid } = equipBeltWithPouch(inv);
    const existing = makeItem('medical.bandage');
    existing.stackCount = 1;
    expect(pouchGrid.addItem(existing, 0, 0, false)).toBe(true);

    const incoming = makeItem('medical.bandage');
    incoming.stackCount = 1;
    const result = inv.addItem(incoming);

    expect(result.merged).toBe(true);
    expect(existing.stackCount).toBe(2);
    expect(inv.groundContainer.getAllItems()).toHaveLength(0);
  });

  it('finds, counts and consumes items stored in a belt pouch', () => {
    const { pouchGrid } = equipBeltWithPouch(inv);
    const bandage = makeItem('medical.bandage');
    bandage.stackCount = 3;
    expect(pouchGrid.addItem(bandage, 0, 0, false)).toBe(true);

    expect(inv.findItem(bandage.instanceId)?.item).toBe(bandage);
    expect(inv.hasItemByDefId('medical.bandage', 3)).toBe(true);
    expect(inv.hasItemByDefId('medical.bandage', 4)).toBe(false);
    expect(inv.hasItemInPlayerInventory('medical.bandage')).toBe(true);
    expect(inv.findMatchingItems({ id: 'medical.bandage' })).toHaveLength(1);

    expect(inv.consumeItemByDefId('medical.bandage', 2)).toBe(true);
    expect(bandage.stackCount).toBe(1);
  });

  it('finds items in a pouch on a belt that is stored inside a backpack', () => {
    // The belt is not equipped here — it sits in the backpack with a loaded
    // pouch attached, so only the attachment-aware recursion can reach it.
    const backpack = makeItem('backpack.standard');
    expect(inv.equipItem(backpack, 'backpack').success).toBe(true);
    inv.updateDynamicContainers();

    const belt = makeItem('crafting.leather_belt');
    const pouch = makeItem('belt.pouch');
    belt.attachItem('pouch', pouch);
    const bandage = makeItem('medical.bandage');
    bandage.stackCount = 2;
    expect(pouch.getContainerGrid().addItem(bandage, 0, 0, false)).toBe(true);
    expect(inv.getBackpackContainer().addItem(belt, 0, 0, false)).toBe(true);

    expect(inv.findItem(bandage.instanceId)?.item).toBe(bandage);
    expect(inv.hasItemByDefId('medical.bandage', 2)).toBe(true);
    expect(inv.consumeItemByDefId('medical.bandage', 1)).toBe(true);
    expect(bandage.stackCount).toBe(1);
  });
});
