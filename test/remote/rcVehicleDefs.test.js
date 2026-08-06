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
const { RECEIVER_SLOT_ID, RECEIVER_DEF_ID, RECEIVER_DEF_IDS, AUTONOMOUS_DEF_ID } = RcVehicleConfig;

const makeReceiver = () => new Item(createItemFromDef(RECEIVER_DEF_ID));
const makeController = () => new Item(createItemFromDef(AUTONOMOUS_DEF_ID));

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
    // The book itself is no longer lootable, as its recipes are granted automatically at start.
    expect(ItemDefs[recipe.requiredBook].noLoot).toBe(true);
    for (const ing of recipe.ingredients) {
      expect(ItemDefs[ing.id], `missing ingredient ${ing.id}`).toBeDefined();
    }
    for (const tool of recipe.tools) {
      expect(ItemDefs[tool.id], `missing tool ${tool.id}`).toBeDefined();
    }
  });
});

describe('Autonomous controller item def', () => {
  it('exists, is crafting-only, and carries its own AP budget', () => {
    const def = ItemDefs[AUTONOMOUS_DEF_ID];
    expect(def).toBeDefined();
    expect(def.noLoot).toBe(true);
    // The controller owns its AP pool rather than borrowing the player's, so
    // an exhausted or sleeping player never slows their wagons down.
    expect(def.autonomyStats?.maxAp).toBe(RcVehicleConfig.AUTONOMOUS_MAX_AP);
  });

  it('points at an image that ships with the game', () => {
    // Currently shares the receiver's art. If this changes, the new file has to
    // exist in client/public/images/items or the loader falls back to default.
    const def = ItemDefs[AUTONOMOUS_DEF_ID];
    expect(['rcreceiver', 'autonomouscontroller']).toContain(def.imageId);
  });

  it('upgrades a receiver with a CPU, behind the same book', () => {
    const recipe = CraftingRecipes.find(r => r.resultItem === AUTONOMOUS_DEF_ID);
    expect(recipe).toBeDefined();
    expect(ItemDefs[recipe.requiredBook]).toBeDefined();

    const ingredientIds = recipe.ingredients.map(i => i.id);
    expect(ingredientIds).toContain(RECEIVER_DEF_ID);
    expect(ingredientIds).toContain('crafting.cpu');

    for (const ing of recipe.ingredients) {
      expect(ItemDefs[ing.id], `missing ingredient ${ing.id}`).toBeDefined();
    }
    for (const tool of recipe.tools) {
      expect(ItemDefs[tool.id], `missing tool ${tool.id}`).toBeDefined();
    }
  });

  it('costs at least as much to build as the plain receiver it consumes', () => {
    const receiver = CraftingRecipes.find(r => r.resultItem === RECEIVER_DEF_ID);
    const controller = CraftingRecipes.find(r => r.resultItem === AUTONOMOUS_DEF_ID);
    expect(controller.apCost).toBeGreaterThanOrEqual(receiver.apCost);
  });
});

describe('Wagon receiver slots', () => {
  it.each(WAGONS)('%s has exactly one receiver slot, accepting either controller', (defId) => {
    const wagon = new Item(createItemFromDef(defId));
    const slots = wagon.attachmentSlots.filter(s => s.id === RECEIVER_SLOT_ID);
    expect(slots).toHaveLength(1);
    // Both parts live in the same slot, so a wagon can never carry redundant
    // radio hardware — the autonomous controller supersedes the receiver.
    expect(slots[0].allowedItems).toEqual(RECEIVER_DEF_IDS);

    expect(wagon.attachItem(RECEIVER_SLOT_ID, makeReceiver())).toBeTruthy();
    expect(wagon.getAttachment(RECEIVER_SLOT_ID).defId).toBe(RECEIVER_DEF_ID);
  });

  it.each(WAGONS)('%s accepts the autonomous controller in the receiver slot', (defId) => {
    // The regression guard for the allow-list: attachItem validates against
    // slot.allowedItems, so a slot that still listed only the receiver would
    // reject the controller silently (returns null, no throw).
    const wagon = new Item(createItemFromDef(defId));
    expect(wagon.attachItem(RECEIVER_SLOT_ID, makeController())).toBeTruthy();
    expect(wagon.getAttachment(RECEIVER_SLOT_ID).defId).toBe(AUTONOMOUS_DEF_ID);
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

  it('is not a battery, so the controller can never occupy a power cell slot', () => {
    const wagon = new Item(createItemFromDef('vehicle.wagon'));
    expect(wagon.attachItem('battery_front', makeController())).toBeNull();
    expect(wagon.attachItem('motor_front', makeController())).toBeNull();
  });

  it('does not put a receiver slot on non-wagon vehicles', () => {
    for (const defId of ['vehicle.electric_scooter', 'vehicle.golf_cart']) {
      const ids = (ItemDefs[defId].attachmentSlots || []).map(s => s.id);
      expect(ids).not.toContain(RECEIVER_SLOT_ID);
    }
  });
});
