import { describe, it, expect, beforeEach } from 'vitest';
// Harvesting a brainstem used to drop it back into the container the corpse was
// in — for a corpse on the ground that meant the stem stayed on the ground,
// where it is trivially walked away from. addItemToPlayer is the "into the
// player's hands" path: merge into a carried stack, else the first free carried
// slot, and never a silent fall-through to the ground.
import { InventoryManager } from '../../client/src/game/inventory/InventoryManager.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';

function makeItem(defId) {
  const def = createItemFromDef(defId);
  expect(def, `missing item def ${defId}`).toBeTruthy();
  return new Item(def);
}

function equipBackpack(inv) {
  const backpack = makeItem('backpack.standard');
  expect(inv.equipItem(backpack, 'backpack').success).toBe(true);
  inv.updateDynamicContainers();
  return inv.getBackpackContainer();
}

describe('InventoryManager.addItemToPlayer', () => {
  let inv;

  beforeEach(() => {
    inv = new InventoryManager();
  });

  it('merges a harvested brainstem into an existing carried stack', () => {
    const backpack = equipBackpack(inv);
    const existing = makeItem('zombie.brainstem');
    existing.stackCount = 2;
    expect(backpack.addItem(existing, 0, 0, false)).toBe(true);

    const harvested = makeItem('zombie.brainstem');
    const result = inv.addItemToPlayer(harvested);

    expect(result.success).toBe(true);
    expect(result.merged).toBe(true);
    expect(existing.stackCount).toBe(3);
    expect(inv.groundContainer.getAllItems()).toHaveLength(0);
  });

  it('places into free carried space when there is no stack to merge into', () => {
    const backpack = equipBackpack(inv);
    const harvested = makeItem('zombie.brainstem');

    const result = inv.addItemToPlayer(harvested);

    expect(result.success).toBe(true);
    expect(result.container).toBe(backpack.id);
    expect(backpack.getAllItems().map(i => i.instanceId)).toContain(harvested.instanceId);
    expect(inv.groundContainer.getAllItems()).toHaveLength(0);
  });

  it('falls back to a belt pouch when the backpack is full', () => {
    const backpack = equipBackpack(inv);
    const belt = makeItem('crafting.leather_belt');
    const pouch = makeItem('belt.pouch');
    belt.attachItem('pouch', pouch);
    expect(inv.equipItem(belt, 'belt').success).toBe(true);
    inv.updateDynamicContainers();

    // Fill every cell of the backpack with non-stackable 1x1 items
    for (let i = 0; i < backpack.width * backpack.height; i++) {
      backpack.addItem(makeItem('tool.lighter'), null, null, false);
    }
    expect(backpack.findAvailablePosition(makeItem('zombie.brainstem'))).toBeNull();

    const harvested = makeItem('zombie.brainstem');
    const result = inv.addItemToPlayer(harvested);

    expect(result.success).toBe(true);
    expect(result.container).toBe(pouch.getContainerGrid().id);
    expect(inv.groundContainer.getAllItems()).toHaveLength(0);
  });

  it('reports failure rather than dumping the item on the ground', () => {
    // Nothing equipped: the player has no carried storage at all.
    const harvested = makeItem('zombie.brainstem');
    const result = inv.addItemToPlayer(harvested);

    expect(result.success).toBe(false);
    // The caller (harvest) is what decides to leave it behind, and it logs when
    // it does — addItemToPlayer must not make that choice quietly.
    expect(inv.groundContainer.getAllItems()).toHaveLength(0);
  });

  it('merges brain pulp into a carried stack too (pulping, not just harvesting)', () => {
    const backpack = equipBackpack(inv);
    const existing = makeItem('zombie.brainpulp');
    existing.stackCount = 1;
    expect(backpack.addItem(existing, 0, 0, false)).toBe(true);

    const pulped = makeItem('zombie.brainpulp');
    const result = inv.addItemToPlayer(pulped);

    expect(result.success).toBe(true);
    expect(result.merged).toBe(true);
    expect(existing.stackCount).toBe(2);
    expect(inv.groundContainer.getAllItems()).toHaveLength(0);
  });

  it('does not merge into a stack that is lying on the ground', () => {
    equipBackpack(inv);
    const onGround = makeItem('zombie.brainstem');
    onGround.stackCount = 1;
    expect(inv.groundContainer.addItem(onGround, 0, 0, false)).toBe(true);

    const harvested = makeItem('zombie.brainstem');
    const result = inv.addItemToPlayer(harvested);

    expect(result.merged).toBeUndefined();
    expect(onGround.stackCount).toBe(1);
    expect(result.container).toBe(inv.getBackpackContainer().id);
  });
});
