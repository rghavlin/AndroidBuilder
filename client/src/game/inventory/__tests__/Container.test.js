
import { Item } from '../Item.js';
import { Container } from '../Container.js';
import { InventoryManager } from '../InventoryManager.js';
import { ItemTrait } from '../traits.js';

/**
 * Comprehensive test suite for the inventory system
 * Updated for Phase 5 architecture
 */

let testResults = [];

function runTest(testName, testFn) {
  try {
    testFn();
    testResults.push(`✅ ${testName}: PASSED`);
    console.log(`✅ ${testName}: PASSED`);
  } catch (error) {
    testResults.push(`❌ ${testName}: FAILED - ${error.message}`);
    console.error(`❌ ${testName}: FAILED`, error);
  }
}

export function runContainerTests() {
  console.log('[Container Tests] Starting comprehensive inventory tests...');
  testResults = [];

  // Phase 1 Tests
  runTest('Container creation', () => {
    const container = new Container({ id: 'test-container', width: 5, height: 5 });
    if (container.width !== 5 || container.height !== 5) {
      throw new Error('Container dimensions not set correctly');
    }
  });

  runTest('Item creation', () => {
    const item = new Item({ defId: 'test-item', width: 2, height: 1 });
    if (item.width !== 2 || item.height !== 1) {
      throw new Error('Item dimensions not set correctly');
    }
  });

  runTest('isChargeBased method', () => {
    // These defs are looked up in ItemDefs.js during construction if available
    const lighter = new Item({ traits: [ItemTrait.CHARGE_BASED], name: 'Lighter' });
    const battery = new Item({ traits: [ItemTrait.BATTERY], name: 'Battery' });
    const knife = new Item({ name: 'Knife' });

    if (!lighter.hasTrait(ItemTrait.CHARGE_BASED)) throw new Error('Lighter should be charge-based');
    if (!matchbook.hasTrait(ItemTrait.CHARGE_BASED)) throw new Error('Matchbook should be charge-based');
    if (!battery.hasTrait(ItemTrait.BATTERY)) throw new Error('Battery should have battery trait');
    if (knife.hasTrait(ItemTrait.CHARGE_BASED)) throw new Error('Knife should not be charge-based');
  });

  runTest('Item placement', () => {
    const container = new Container({ id: 'test-container', width: 5, height: 5 });
    const item = new Item({ instanceId: 'test-item-1', width: 2, height: 1 });

    const placed = container.placeItemAt(item, 1, 1);
    if (!placed) {
      throw new Error('Item placement failed');
    }

    if (item.x !== 1 || item.y !== 1) {
      throw new Error('Item position not updated correctly');
    }
  });

  runTest('Collision detection', () => {
    const container = new Container({ id: 'test-container', width: 5, height: 5 });
    const item1 = new Item({ instanceId: 'item1', width: 2, height: 1 });
    const item2 = new Item({ instanceId: 'item2', width: 2, height: 1 });

    container.placeItemAt(item1, 1, 1);
    const placed = container.placeItemAt(item2, 1, 1); // Same position

    if (placed) {
      throw new Error('Collision detection failed - items should not overlap');
    }
  });

  runTest('Item stacking', () => {
    const container = new Container({ id: 'test-container', width: 5, height: 5 });
    // Use traits array as per modern Item.js
    const ammo1 = new Item({ instanceId: 'ammo1', defId: 'ammo.556', traits: [ItemTrait.STACKABLE], stackMax: 100, stackCount: 30 });
    const ammo2 = new Item({ instanceId: 'ammo2', defId: 'ammo.556', traits: [ItemTrait.STACKABLE], stackMax: 100, stackCount: 20 });

    container.addItem(ammo1);
    // addItem now defaults allowStacking to true
    container.addItem(ammo2);

    if (ammo1.stackCount !== 50 || container.items.size !== 1) {
      throw new Error(`Item stacking failed. Count: ${ammo1.stackCount}, Items: ${container.items.size}`);
    }
  });

  runTest('Container serialization', () => {
    const container = new Container({ id: 'test-container', width: 5, height: 5 });
    const item = new Item({ instanceId: 'test-item-serialized', defId: 'test-item', width: 2, height: 1 });
    container.placeItemAt(item, 1, 1);

    const json = container.toJSON();
    const restored = Container.fromJSON(json);

    if (restored.items.size !== 1) {
      throw new Error('Container serialization failed');
    }

    const restoredItem = restored.items.get('test-item-serialized');
    if (!restoredItem || restoredItem.x !== 1 || restoredItem.y !== 1) {
      throw new Error('Item serialization in container failed');
    }
  });

  // Phase 2 Tests
  runTest('Item rotation', () => {
    const container = new Container({ id: 'test-container', width: 10, height: 10 });
    const item = new Item({ instanceId: 'sniper_rifle', width: 5, height: 2 });

    container.placeItemAt(item, 0, 0);

    // Should be able to rotate when space allows
    const rotated = item.rotate(true);
    if (!rotated) {
      throw new Error('Item rotation failed when space was available');
    }

    // After rotation, dimensions should be swapped (5x2 becomes 2x5 when rotated)
    if (item.getActualWidth() !== 2 || item.getActualHeight() !== 5) {
      throw new Error(`Item dimensions not updated after rotation. Got ${item.getActualWidth()}x${item.getActualHeight()}`);
    }
  });

  runTest('Drag-and-drop validation', () => {
    const container = new Container({ id: 'test-container', width: 6, height: 6 });
    const item = new Item({ instanceId: 'test-item', width: 2, height: 3 });

    // Valid placement
    const validResult = container.validatePlacement(item, 1, 1);
    if (!validResult.valid) {
      throw new Error('Valid placement was rejected: ' + validResult.reason);
    }

    // Invalid placement (out of bounds)
    const invalidResult = container.validatePlacement(item, 5, 5);
    if (invalidResult.valid) {
      throw new Error('Invalid placement was accepted');
    }
  });

  runTest('Partial stacking with overflow', () => {
    const container = new Container({ id: 'test-container', width: 6, height: 6 });
    const ammo1 = new Item({ instanceId: 'ammo1', defId: 'ammo.556', traits: [ItemTrait.STACKABLE], stackMax: 50, stackCount: 30 });
    const ammo2 = new Item({ instanceId: 'ammo2', defId: 'ammo.556', traits: [ItemTrait.STACKABLE], stackMax: 50, stackCount: 45 });

    container.addItem(ammo1);
    container.addItem(ammo2);

    // Should have two stacks: one full (50) and one partial (25)
    if (container.items.size !== 2) {
      throw new Error(`Expected 2 items, got ${container.items.size}`);
    }

    const items = Array.from(container.items.values());
    const stackCounts = items.map(item => item.stackCount).sort((a, b) => a - b);
    if (stackCounts[0] !== 25 || stackCounts[1] !== 50) {
      throw new Error(`Expected stacks [25, 50], got [${stackCounts.join(', ')}]`);
    }
  });

  runTest('Orientation-agnostic stacking', () => {
    const container = new Container({ id: 'test-container', width: 6, height: 6 });
    const item1 = new Item({ instanceId: 'bottle1', defId: 'bottle', traits: [ItemTrait.STACKABLE, ItemTrait.WATER_CONTAINER], stackMax: 10, stackCount: 5, width: 1, height: 2, ammoCount: 0 });
    const item2 = new Item({ instanceId: 'bottle2', defId: 'bottle', traits: [ItemTrait.STACKABLE, ItemTrait.WATER_CONTAINER], stackMax: 10, stackCount: 3, width: 1, height: 2, ammoCount: 0 });

    container.placeItemAt(item1, 1, 1);
    
    // Rotate item2 so it has a different orientation
    item2.rotate(false); // Rotate without checking container

    // Try to place it on top of item1 via validatePlacement
    const validation = container.validatePlacement(item2, 1, 1);
    if (!validation.stackTarget) {
      throw new Error(`Stacking failed: ${validation.reason || 'no stack target found'}`);
    }

    if (validation.stackTarget.instanceId !== item1.instanceId) {
      throw new Error('Stacking target is incorrect');
    }
  });

  runTest('Auto-expanding ground container', () => {
    const groundContainer = new Container({ id: 'ground', width: 5, height: 5, autoExpand: true });
    const largeItem = new Item({ instanceId: 'large-item', width: 2, height: 8 });

    const placed = groundContainer.addItem(largeItem);
    if (!placed) {
      throw new Error('Auto-expand failed for large item');
    }

    if (groundContainer.height < 8) {
      throw new Error('Container did not expand to accommodate item');
    }
  });

  // Phase 3 Tests - Equipment System
  runTest('Equipment slot assignment', () => {
    const manager = new InventoryManager();
    const rifle = new Item({
      instanceId: 'test-rifle-1',
      defId: 'rifle.test',
      width: 5,
      height: 2,
      equippableSlot: 'long_gun'
    });

    const result = manager.equipItem(rifle);
    if (!result.success) {
      throw new Error('Equipment failed: ' + result.reason);
    }

    if (manager.equipment.long_gun !== rifle || !rifle.isEquipped) {
      throw new Error('Item not properly equipped');
    }
  });

  runTest('Dynamic container creation from equipment', () => {
    const manager = new InventoryManager();
    const vest = new Item({
      instanceId: 'tactical-vest-1',
      defId: 'vest.test',
      width: 2,
      height: 3,
      equippableSlot: 'upper_body',
      containerGrid: { width: 4, height: 2 }
    });

    manager.equipItem(vest);

    // Should create a dynamic container with instance-based ID
    const containerId = `${vest.instanceId}-container`;
    const upperBodyContainer = manager.containers.get(containerId);
    if (!upperBodyContainer) {
      throw new Error(`Dynamic container not created for equipped vest. Expected ID: ${containerId}`);
    }

    if (upperBodyContainer.width !== 4 || upperBodyContainer.height !== 2) {
      throw new Error('Dynamic container dimensions incorrect');
    }
  });

  runTest('Equipment replacement', () => {
    const manager = new InventoryManager();
    const helmet1 = new Item({
      instanceId: 'helmet1',
      defId: 'helmet.1',
      equippableSlot: 'upper_body'
    });
    const helmet2 = new Item({
      instanceId: 'helmet2',
      defId: 'helmet.2',
      equippableSlot: 'upper_body'
    });

    // Equip first helmet
    manager.equipItem(helmet1);

    // Equip second helmet (should replace first)
    const result = manager.equipItem(helmet2);

    if (!result.success || !result.unequippedItem) {
      throw new Error('Equipment replacement failed');
    }

    if (manager.equipment.upper_body !== helmet2) {
      throw new Error('New helmet not equipped');
    }

    if (helmet1.isEquipped) {
      throw new Error('Old helmet still marked as equipped');
    }
  });

  runTest('Firearm attachment system', () => {
    const rifle = new Item({
      instanceId: 'test-rifle',
      defId: 'rifle.test',
      attachmentSlots: [
        { id: 'muzzle', name: 'muzzle', compatibleTypes: ['suppressor', 'compensator'] },
        { id: 'optic', name: 'optic', compatibleTypes: ['scope', 'red-dot'] }
      ]
    });

    const suppressor = new Item({
      instanceId: 'suppressor',
      defId: 'suppressor.test',
    });

    // Use addAttachment (alias) or attachItem
    const result = rifle.addAttachment('muzzle', suppressor);
    if (!result.success && result !== true) { // attachItem might return true or result object
      throw new Error('Attachment failed: ' + (result?.reason || 'Unknown error'));
    }

    if (!rifle.attachments['muzzle'] || rifle.attachments['muzzle'] !== suppressor) {
      throw new Error('Attachment not properly added');
    }
  });

  runTest('Equipment unequipping with inventory placement', () => {
    const manager = new InventoryManager();
    // Default backpack should be equipped to provide space
    const backpack = new Item({
      instanceId: 'test-backpack',
      defId: 'backpack.test',
      width: 3,
      height: 4,
      equippableSlot: 'backpack',
      containerGrid: { id: 'test-backpack-grid', width: 8, height: 10 }
    });
    manager.equipItem(backpack);

    const helmet = new Item({
        instanceId: 'test-helmet',
        defId: 'helmet.test',
        equippableSlot: 'upper_body',
        width: 2,
        height: 2
    });
    manager.equipItem(helmet);

    // Unequip helmet
    const result = manager.unequipItem('upper_body');
    if (!result.success) {
      throw new Error('Unequipping failed: ' + result.reason);
    }

    // Should be placed back in the backpack's container
    const backpackGrid = backpack.getContainerGrid();
    if (!backpackGrid.items.has(helmet.instanceId)) {
      throw new Error('Unequipped item not placed in inventory');
    }
  });

  runTest('Inventory manager serialization', () => {
    const manager = new InventoryManager();

    const rifle = new Item({
      instanceId: 'test-rifle',
      defId: 'rifle.test',
      equippableSlot: 'long_gun'
    });
    const ammo = new Item({
      instanceId: 'test-ammo',
      defId: 'ammo.test',
      traits: [ItemTrait.STACKABLE],
      stackCount: 30
    });

    manager.equipItem(rifle);
    manager.addItem(ammo);

    // Serialize and restore
    const json = manager.toJSON();
    const restored = InventoryManager.fromJSON(json);

    // Check equipment
    if (!restored.equipment.long_gun || restored.equipment.long_gun.instanceId !== 'test-rifle') {
      throw new Error('Equipment not properly restored');
    }

    // Check inventory items
    const restoredAmmo = restored.findItem('test-ammo');
    if (!restoredAmmo) {
      throw new Error('Inventory items not properly restored');
    }
  });

  // Display results
  console.log('\n=== INVENTORY SYSTEM TEST RESULTS ===');
  testResults.forEach(result => console.log(result));

  const passed = testResults.filter(r => r.includes('PASSED')).length;
  const failed = testResults.filter(r => r.includes('FAILED')).length;

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log('🎉 All inventory tests passed! Phase 5 system is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please review the implementation.');
  }

  return testResults;
}

// Export the test function to global scope for dev console access
if (typeof window !== 'undefined') {
  window.runContainerTests = runContainerTests;
  console.log('[Container Tests] Test function exported to window.runContainerTests()');
}
