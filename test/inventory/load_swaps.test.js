import { describe, it, expect } from 'vitest';
// Ported from verify_load_swaps.mjs — swapping a battery stack from a backpack
// into a flashlight attachment, verifying split + displacement of the old one.
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import { InventoryManager } from '../../client/src/game/inventory/InventoryManager.js';
import { Item } from '../../client/src/game/inventory/Item.js';

describe('Inventory / battery load-swap into an attachment', () => {
  it('swaps a backpack battery stack onto a flashlight, splitting and displacing correctly', () => {
    const manager = new InventoryManager();

    // Flashlight with an empty battery attached, equipped.
    const flashlight = new Item(createItemFromDef('tool.smallflashlight'));
    flashlight.instanceId = 'flashlight-1';
    const emptyBattery = new Item(createItemFromDef('tool.battery'));
    emptyBattery.instanceId = 'battery-empty';
    emptyBattery.ammoCount = 0;
    flashlight.attachItem('battery', emptyBattery);
    manager.equipment.flashlight = flashlight;
    flashlight.isEquipped = true;

    // Equipped backpack holding a stack of 5 batteries.
    manager.equipItem(new Item(createItemFromDef('backpack.standard')), 'backpack');
    const backpack = manager.getBackpackContainer();
    expect(backpack, 'backpack container should exist').toBeTruthy();

    const batteryStack = new Item(createItemFromDef('tool.battery'));
    batteryStack.instanceId = 'battery-stack';
    batteryStack.stackCount = 5;
    expect(backpack.addItem(batteryStack, 0, 0), 'stack added to backpack').toBeTruthy();

    // Perform the swap.
    const result = manager.attachItemToWeapon(flashlight, 'battery', batteryStack, backpack.id);
    expect(result.success, `swap should succeed: ${result.reason}`).toBe(true);

    // The attachment is now a single battery from the stack. (Which half of the
    // split keeps the original instanceId is an implementation detail and not
    // asserted here — the original verify script's assumption on that has since
    // flipped; the meaningful invariants are the counts and displacement below.)
    const attached = flashlight.getAttachment('battery');
    expect(attached, 'a battery is attached after the swap').toBeTruthy();
    expect(attached.defId).toBe('tool.battery');
    expect(attached.stackCount).toBe(1);

    // The old empty battery is displaced back into the backpack.
    const displaced = backpack.getAllItems().find((it) => it.instanceId === 'battery-empty');
    expect(displaced, 'empty battery displaced to backpack').toBeTruthy();

    // The remainder of the split stack (5 - 1 attached = 4) stays in the backpack.
    const remainder = backpack
      .getAllItems()
      .find((it) => it.defId === 'tool.battery' && it.instanceId !== 'battery-empty' && it.stackCount > 0);
    expect(remainder, 'remainder of battery stack in backpack').toBeTruthy();
    expect(remainder.stackCount).toBe(4);
  });
});
