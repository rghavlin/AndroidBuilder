
import { Item } from '../Item.js';
import { Container } from '../Container.js';
import { InventoryManager } from '../InventoryManager.js';

/**
 * Comprehensive test suite for the inventory system
 * Covers Phases 1, 2, and 3 functionality
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
    const item = new Item({ id: 'test-item', type: 'weapon', width: 2, height: 1 });
    if (item.width !== 2 || item.height !== 1) {
      throw new Error('Item dimensions not set correctly');
    }
  });

  runTest('Item placement', () => {
    const container = new Container({ id: 'test-container', width: 5, height: 5 });
    const item = new Item({ id: 'test-item', type: 'weapon', width: 2, height: 1 });
    
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
    const item1 = new Item({ id: 'item1', type: 'weapon', width: 2, height: 1 });
    const item2 = new Item({ id: 'item2', type: 'weapon', width: 2, height: 1 });
    
    container.placeItemAt(item1, 1, 1);
    const placed = container.placeItemAt(item2, 1, 1); // Same position
    
    if (placed) {
      throw new Error('Collision detection failed - items should not overlap');
    }
  });

  runTest('Item stacking', () => {
    const container = new Container({ id: 'test-container', width: 5, height: 5 });
    const ammo1 = new Item({ id: 'ammo1', type: 'ammo', stackable: true, stackMax: 100, stackCount: 30 });
    const ammo2 = new Item({ id: 'ammo2', type: 'ammo', stackable: true, stackMax: 100, stackCount: 20 });
    
    container.addItem(ammo1);
    container.addItem(ammo2);
    
    if (ammo1.stackCount !== 50 || container.items.size !== 1) {
      throw new Error('Item stacking failed');
    }
  });

  runTest('Container serialization', () => {
    const container = new Container({ id: 'test-container', width: 5, height: 5 });
    const item = new Item({ id: 'test-item', type: 'weapon', width: 2, height: 1 });
    container.placeItemAt(item, 1, 1);
    
    const json = container.toJSON();
    const restored = Container.fromJSON(json);
    
    if (restored.items.size !== 1) {
      throw new Error('Container serialization failed');
    }
    
    const restoredItem = restored.items.get('test-item');
    if (!restoredItem || restoredItem.x !== 1 || restoredItem.y !== 1) {
      throw new Error('Item serialization in container failed');
    }
  });

  // Phase 2 Tests
  runTest('Item rotation', () => {
    const container = new Container({ id: 'test-container', width: 5, height: 5 });
    const item = new Item({ id: 'rifle', type: 'weapon', width: 4, height: 1 });
    
    container.placeItemAt(item, 1, 1);
    
    // Should be able to rotate when space allows
    const rotated = item.rotate(true);
    if (!rotated) {
      throw new Error('Item rotation failed when space was available');
    }
    
    // After rotation, dimensions should be swapped (4×1 becomes 1×4 when rotated)
    if (item.getActualWidth() !== 1 || item.getActualHeight() !== 4) {
      throw new Error('Item dimensions not updated after rotation');
    }
  });

  runTest('Drag-and-drop validation', () => {
    const container = new Container({ id: 'test-container', width: 6, height: 6 });
    const item = new Item({ id: 'test-item', type: 'weapon', width: 2, height: 3 });
    
    // Valid placement
    const validResult = container.validatePlacement(item, 1, 1);
    if (!validResult.valid) {
      throw new Error('Valid placement was rejected');
    }
    
    // Invalid placement (out of bounds)
    const invalidResult = container.validatePlacement(item, 5, 5);
    if (invalidResult.valid) {
      throw new Error('Invalid placement was accepted');
    }
  });

  runTest('Partial stacking with overflow', () => {
    const container = new Container({ id: 'test-container', width: 6, height: 6 });
    const ammo1 = new Item({ id: 'ammo1', type: 'ammo', subtype: '5.56mm', name: '5.56mm Ammo', stackable: true, stackMax: 50, stackCount: 30 });
    const ammo2 = new Item({ id: 'ammo2', type: 'ammo', subtype: '5.56mm', name: '5.56mm Ammo', stackable: true, stackMax: 50, stackCount: 45 });
    
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

  runTest('Auto-expanding ground container', () => {
    const groundContainer = new Container({ id: 'ground', width: 5, height: 5, autoExpand: true });
    const largeItem = new Item({ id: 'large-item', type: 'weapon', width: 2, height: 8 });
    
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
      id: 'test-rifle', 
      type: 'weapon', 
      subtype: 'rifle',
      width: 1, 
      height: 4, 
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
      id: 'tactical-vest', 
      type: 'armor', 
      subtype: 'vest',
      width: 2, 
      height: 3,
      equippableSlot: 'upper_body',
      containerGrid: { width: 4, height: 2 }
    });
    
    manager.equipItem(vest);
    
    // Should create a dynamic container
    const upperBodyContainer = manager.containers.get('upper_body-container');
    if (!upperBodyContainer) {
      throw new Error('Dynamic container not created for equipped vest');
    }
    
    if (upperBodyContainer.width !== 4 || upperBodyContainer.height !== 2) {
      throw new Error('Dynamic container dimensions incorrect');
    }
  });

  runTest('Equipment replacement', () => {
    const manager = new InventoryManager();
    const helmet1 = new Item({ 
      id: 'helmet1', 
      type: 'armor', 
      subtype: 'helmet',
      equippableSlot: 'upper_body' 
    });
    const helmet2 = new Item({ 
      id: 'helmet2', 
      type: 'armor', 
      subtype: 'helmet',
      equippableSlot: 'upper_body' 
    });
    
    // Add first helmet to backpack, then equip
    manager.addItem(helmet1);
    manager.equipItem(helmet1);
    
    // Add second helmet and equip (should replace first)
    manager.addItem(helmet2);
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
      id: 'test-rifle', 
      type: 'weapon', 
      subtype: 'rifle',
      attachmentSlots: [
        { name: 'muzzle', compatibleTypes: ['suppressor', 'compensator'] },
        { name: 'optic', compatibleTypes: ['scope', 'red-dot'] }
      ]
    });
    
    const suppressor = new Item({ 
      id: 'suppressor', 
      type: 'attachment', 
      subtype: 'suppressor' 
    });
    
    const result = rifle.addAttachment('muzzle', suppressor);
    if (!result.success) {
      throw new Error('Attachment failed: ' + result.reason);
    }
    
    if (!rifle.attachments.has('muzzle') || rifle.attachments.get('muzzle') !== suppressor) {
      throw new Error('Attachment not properly added');
    }
    
    if (!suppressor.isAttached || suppressor._parentWeapon !== rifle) {
      throw new Error('Attachment parent reference not set');
    }
  });

  runTest('Equipment unequipping with inventory placement', () => {
    const manager = new InventoryManager();
    const backpack = new Item({ 
      id: 'test-backpack', 
      type: 'container', 
      subtype: 'backpack',
      width: 3, 
      height: 4,
      equippableSlot: 'backpack',
      containerGrid: { width: 8, height: 10 }
    });
    
    // Equip backpack
    manager.equipItem(backpack);
    
    // Unequip backpack
    const result = manager.unequipItem('backpack');
    if (!result.success) {
      throw new Error('Unequipping failed: ' + result.reason);
    }
    
    // Should be placed back in default backpack
    if (!manager.containers.get('backpack-default').items.has(backpack.id)) {
      throw new Error('Unequipped item not placed in inventory');
    }
    
    // Dynamic container should be removed
    if (manager.containers.has('backpack-container')) {
      throw new Error('Dynamic container not removed after unequipping');
    }
  });

  runTest('Inventory manager serialization', () => {
    const manager = new InventoryManager();
    
    // Add some items and equipment
    const rifle = new Item({ 
      id: 'test-rifle', 
      type: 'weapon', 
      equippableSlot: 'long_gun' 
    });
    const ammo = new Item({ 
      id: 'test-ammo', 
      type: 'ammo', 
      stackable: true, 
      stackCount: 30 
    });
    
    manager.equipItem(rifle);
    manager.addItem(ammo);
    
    // Serialize and restore
    const json = manager.toJSON();
    const restored = InventoryManager.fromJSON(json);
    
    // Check equipment
    if (!restored.equipment.long_gun || restored.equipment.long_gun.id !== 'test-rifle') {
      throw new Error('Equipment not properly restored');
    }
    
    // Check inventory items
    const backpack = restored.getBackpackContainer();
    if (!backpack.items.has('test-ammo')) {
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
    console.log('🎉 All inventory tests passed! Phase 3 system is working correctly.');
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
