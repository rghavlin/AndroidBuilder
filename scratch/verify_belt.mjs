
import { ItemDefs } from '../client/src/game/inventory/ItemDefs.js';
import { ItemTrait, EquipmentSlot, ItemCategory } from '../client/src/game/inventory/traits.js';

function verifyBelt() {
  const belt = ItemDefs['crafting.leather_belt'];
  console.log('Verifying Leather Belt:');
  console.log('- Traits:', belt.traits);
  console.log('- Slot:', belt.equippableSlot);
  console.log('- Attachment Slots:', belt.attachmentSlots?.length);
  
  const expectedSlots = 7;
  if (belt.attachmentSlots?.length !== expectedSlots) {
    console.error(`Error: Expected ${expectedSlots} attachment slots, found ${belt.attachmentSlots?.length}`);
  }

  const traits = [ItemTrait.EQUIPPABLE, ItemTrait.OPENABLE_WHEN_NESTED];
  traits.forEach(t => {
    if (!belt.traits.includes(t)) {
      console.error(`Error: Missing trait ${t}`);
    }
  });

  if (belt.equippableSlot !== EquipmentSlot.BELT) {
    console.error(`Error: Wrong equipment slot ${belt.equippableSlot}`);
  }
}

function verifyAccessories() {
  const accessories = ['belt.holster', 'belt.ammo_pouch', 'belt.pouch', 'belt.tool_ring'];
  accessories.forEach(id => {
    const acc = ItemDefs[id];
    console.log(`Verifying ${id}:`);
    if (!acc) {
      console.error(`Error: Missing definition for ${id}`);
      return;
    }
    
    // Dimension check
    if (id === 'belt.holster') {
      if (acc.width !== 2 || acc.height !== 1) console.error(`Error: Holster should be 2x1, found ${acc.width}x${acc.height}`);
    } else if (id === 'belt.pouch') {
      if (acc.width !== 2 || acc.height !== 2) console.error(`Error: Pouch should be 2x2, found ${acc.width}x${acc.height}`);
    }

    console.log('- beltGrid:', acc.beltGrid);
    if (!acc.beltGrid) {
      console.error(`Error: Missing beltGrid for ${id}`);
    }
  });
}

try {
  verifyBelt();
  verifyAccessories();
  console.log('Verification complete.');
} catch (e) {
  console.error('Verification failed with error:', e);
}
