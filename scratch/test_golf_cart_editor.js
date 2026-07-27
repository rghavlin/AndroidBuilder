import { ItemDefs, createItemFromDef } from '../client/src/game/inventory/ItemDefs.js';
import { Item } from '../client/src/game/inventory/Item.js';
import { ItemCategory, ItemTrait } from '../client/src/game/inventory/traits.js';

function getDefaultVehicleAttachments(defId) {
  const def = ItemDefs[defId];
  if (!def?.attachmentSlots || !def?.defaultAttachments) return {};
  const res = {};
  for (const [slotId, attDefId] of Object.entries(def.defaultAttachments)) {
    if (attDefId) {
      const attDef = ItemDefs[attDefId];
      const isBattery = attDef?.categories?.includes(ItemCategory.BATTERY) ||
                        attDef?.categories?.includes(ItemCategory.LARGE_BATTERY) ||
                        attDef?.traits?.includes(ItemTrait.BATTERY);
      res[slotId] = {
        defId: attDefId,
        ...(isBattery ? { charges: attDef?.capacity ?? (attDefId === 'tool.high_capacity_battery' ? 400 : 100) } : {})
      };
    }
  }
  return res;
}

function buildFullItem(item) {
  const full = createItemFromDef(item.defId);
  if (!full) return { defId: item.defId, quantity: 1 };

  if (item.vehicleAttachments) {
    const itemDef = ItemDefs[item.defId];
    if (itemDef?.attachmentSlots) {
      if (!full.attachments) full.attachments = {};
      for (const slot of itemDef.attachmentSlots) {
        const attInfo = item.vehicleAttachments[slot.id];
        if (attInfo && attInfo.defId) {
          const att = createItemFromDef(attInfo.defId);
          if (att) {
            if (attInfo.charges !== undefined && (att.categories?.includes(ItemCategory.BATTERY) || att.categories?.includes(ItemCategory.LARGE_BATTERY) || att.traits?.includes(ItemTrait.BATTERY))) {
              att.ammoCount = attInfo.charges;
            }
            full.attachments[slot.id] = att;
          } else {
            delete full.attachments[slot.id];
          }
        } else {
          delete full.attachments[slot.id];
        }
      }
    }
  }
  return full;
}

console.log('--- 1. Testing getDefaultVehicleAttachments for Golf Cart ---');
const defaultAtts = getDefaultVehicleAttachments('vehicle.golf_cart');
console.log('Defaults:', JSON.stringify(defaultAtts, null, 2));

if (
  defaultAtts.motor_front?.defId === 'electric_motor' &&
  defaultAtts.battery_front?.defId === 'tool.large_battery' &&
  defaultAtts.battery_front?.charges === 100 &&
  defaultAtts.motor_rear?.defId === 'electric_motor' &&
  defaultAtts.battery_rear?.defId === 'tool.large_battery' &&
  defaultAtts.battery_rear?.charges === 100
) {
  console.log('✓ Default attachments correctly resolved.');
} else {
  console.error('✗ Default attachments resolution failed!');
  process.exit(1);
}

console.log('--- 2. Testing Custom Golf Cart Attachment Configuration ---');
const customEditorItem = {
  defId: 'vehicle.golf_cart',
  vehicleAttachments: {
    motor_front: { defId: 'electric_motor' },
    battery_front: { defId: 'tool.high_capacity_battery', charges: 350 },
    motor_rear: { defId: '' }, // empty rear motor
    battery_rear: { defId: 'tool.large_battery', charges: 25 },
  }
};

const fullCart = buildFullItem(customEditorItem);
const golfCartItem = new Item(fullCart);

console.log('Front motor:', golfCartItem.attachments.motor_front?.defId);
console.log('Front battery:', golfCartItem.attachments.battery_front?.defId, 'charges:', golfCartItem.attachments.battery_front?.ammoCount);
console.log('Rear motor:', golfCartItem.attachments.motor_rear?.defId);
console.log('Rear battery:', golfCartItem.attachments.battery_rear?.defId, 'charges:', golfCartItem.attachments.battery_rear?.ammoCount);

if (
  golfCartItem.attachments.motor_front?.defId === 'electric_motor' &&
  golfCartItem.attachments.battery_front?.defId === 'tool.high_capacity_battery' &&
  golfCartItem.attachments.battery_front?.ammoCount === 350 &&
  !golfCartItem.attachments.motor_rear &&
  golfCartItem.attachments.battery_rear?.defId === 'tool.large_battery' &&
  golfCartItem.attachments.battery_rear?.ammoCount === 25
) {
  console.log('✓ Custom attachments built into runtime Item correctly.');
} else {
  console.error('✗ Custom attachments build failed!');
  process.exit(1);
}

console.log('--- All scratch tests passed! ---');
