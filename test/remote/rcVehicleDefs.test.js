// Pins the RC receiver's data wiring. Everything about remote-driving a wagon
// keys off two strings — the slot id and the receiver's defId — and the slot
// system is validated purely from the def, so a typo here fails silently in
// game (the slot just never accepts anything) rather than throwing.

import { describe, it, expect } from 'vitest';
import { Item } from '../../client/src/game/inventory/Item.js';
import { ItemDefs, createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import { CraftingRecipes } from '../../client/src/game/inventory/CraftingRecipes.js';
import { RcVehicleConfig } from '../../client/src/game/config/RcVehicleConfig.js';

const WAGONS = ['vehicle.toy_wagon', 'vehicle.wagon', 'vehicle.cargo_wagon'];
const { RECEIVER_SLOT_ID, RECEIVER_DEF_ID } = RcVehicleConfig;

const makeReceiver = () => new Item(createItemFromDef(RECEIVER_DEF_ID));

describe('RC receiver item def', () => {
  it('exists, points at the shipped image, and never spawns as loot', () => {
    const def = ItemDefs[RECEIVER_DEF_ID];
    expect(def).toBeDefined();
    expect(def.imageId).toBe('rcreceiver');
    expect(def.noLoot).toBe(true); // crafting-only
  });

  it('is not a battery, so it can never occupy a wagon power cell slot', () => {
    const receiver = makeReceiver();
    const wagon = new Item(createItemFromDef('vehicle.wagon'));
    expect(wagon.attachItem('battery_front', receiver)).toBeNull();
    expect(wagon.attachItem('motor_front', receiver)).toBeNull();
  });

  it('is gated behind a craftable book, not loot', () => {
    const recipe = CraftingRecipes.find(r => r.resultItem === RECEIVER_DEF_ID);
    expect(recipe).toBeDefined();
    expect(ItemDefs[recipe.requiredBook]).toBeDefined();
    // The book itself must stay lootable or the recipe is unreachable.
    expect(ItemDefs[recipe.requiredBook].noLoot).toBeUndefined();
    for (const ing of recipe.ingredients) {
      expect(ItemDefs[ing.id], `missing ingredient ${ing.id}`).toBeDefined();
    }
    for (const tool of recipe.tools) {
      expect(ItemDefs[tool.id], `missing tool ${tool.id}`).toBeDefined();
    }
  });
});

describe('Wagon receiver slots', () => {
  it.each(WAGONS)('%s has exactly one receiver slot that accepts only the receiver', (defId) => {
    const wagon = new Item(createItemFromDef(defId));
    const slots = wagon.attachmentSlots.filter(s => s.id === RECEIVER_SLOT_ID);
    expect(slots).toHaveLength(1);
    expect(slots[0].allowedItems).toEqual([RECEIVER_DEF_ID]);

    expect(wagon.attachItem(RECEIVER_SLOT_ID, makeReceiver())).toBeTruthy();
    expect(wagon.getAttachment(RECEIVER_SLOT_ID).defId).toBe(RECEIVER_DEF_ID);
  });

  it.each(WAGONS)('%s receiver slot id avoids the "battery" substring trap', (defId) => {
    // Item._getActiveRideBatterySlots and getBatteryStatuses both select slots
    // with s.id.includes('battery'). A receiver slot caught by that filter would
    // be treated as a power cell.
    expect(RECEIVER_SLOT_ID).not.toContain('battery');
    const wagon = new Item(createItemFromDef(defId));
    wagon.attachItem(RECEIVER_SLOT_ID, makeReceiver());
    for (const status of wagon.getBatteryStatuses()) {
      expect(status.slotId ?? status.id).not.toBe(RECEIVER_SLOT_ID);
    }
  });

  it.each(WAGONS)('%s keeps its motor/battery pairs intact', (defId) => {
    const wagon = new Item(createItemFromDef(defId));
    const ids = wagon.attachmentSlots.map(s => s.id);
    const motors = ids.filter(id => id.startsWith('motor'));
    const batteries = ids.filter(id => id.includes('battery'));
    expect(motors).toHaveLength(batteries.length);
    // The receiver is appended last so the pairs stay adjacent in the panel.
    expect(ids[ids.length - 1]).toBe(RECEIVER_SLOT_ID);
  });

  it('does not put a receiver slot on non-wagon vehicles', () => {
    for (const defId of ['vehicle.electric_scooter', 'vehicle.golf_cart']) {
      const ids = (ItemDefs[defId].attachmentSlots || []).map(s => s.id);
      expect(ids).not.toContain(RECEIVER_SLOT_ID);
    }
  });
});
