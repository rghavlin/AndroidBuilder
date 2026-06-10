import { ItemDefs } from '../client/src/game/inventory/ItemDefs.js';
import { CraftingRecipes } from '../client/src/game/inventory/CraftingRecipes.js';
import { Item } from '../client/src/game/inventory/Item.js';

function runVerification() {
  console.log("=== Cargo Wagon Verification ===");

  const def = ItemDefs['vehicle.cargo_wagon'];
  if (!def) {
    throw new Error("FAIL: vehicle.cargo_wagon definition not found in ItemDefs!");
  }
  console.log("✅ found definition in ItemDefs.js");

  // Validate properties
  if (def.name !== 'Cargo Wagon') throw new Error(`FAIL: expected name "Cargo Wagon", got "${def.name}"`);
  if (def.imageId !== 'cargowagon') throw new Error(`FAIL: expected imageId "cargowagon", got "${def.imageId}"`);
  if (def.width !== 6 || def.height !== 10) throw new Error(`FAIL: expected dimensions 6x10, got ${def.width}x${def.height}`);
  if (def.dragApPenalty !== 3) throw new Error(`FAIL: expected dragApPenalty 3, got ${def.dragApPenalty}`);
  if (def.noPickup !== true) throw new Error(`FAIL: expected noPickup true, got ${def.noPickup}`);
  if (def.noLoot !== true) throw new Error(`FAIL: expected noLoot true, got ${def.noLoot}`);

  console.log("✅ item attributes match exactly (6x10 size, 3 AP penalty, noPickup: true, noLoot: true)");

  // Validate containerGrid
  if (!def.containerGrid || def.containerGrid.width !== 6 || def.containerGrid.height !== 9 || !def.containerGrid.isVehicle) {
    throw new Error(`FAIL: containerGrid incorrect: ${JSON.stringify(def.containerGrid)}`);
  }
  console.log("✅ containerGrid is exactly 6x9 overlay (isVehicle: true)");

  // Validate attachmentSlots (3 motors, 3 batteries)
  const motors = def.attachmentSlots.filter(s => s.id.startsWith('motor'));
  const batteries = def.attachmentSlots.filter(s => s.id.startsWith('battery'));
  if (motors.length !== 3) throw new Error(`FAIL: expected 3 motor slots, got ${motors.length}`);
  if (batteries.length !== 3) throw new Error(`FAIL: expected 3 battery slots, got ${batteries.length}`);
  console.log("✅ attachment slots hold 3 electric motors and 3 large batteries");

  // Verify Item class getMotorizedBonus motorized logic includes middle axle
  const cargoWagonItem = new Item(def);
  // Mock attachments
  cargoWagonItem.attachments = {
    'motor_front': { defId: 'electric_motor' },
    'battery_front': { defId: 'tool.large_battery', ammoCount: 100 },
    'motor_middle': { defId: 'electric_motor' },
    'battery_middle': { defId: 'tool.large_battery', ammoCount: 100 },
    'motor_rear': { defId: 'electric_motor' },
    'battery_rear': { defId: 'tool.large_battery', ammoCount: 100 }
  };
  
  const bonus = cargoWagonItem.getMotorizedBonus();
  if (bonus !== 1.5) {
    throw new Error(`FAIL: expected motorized bonus 1.5 with 3 motor/battery pairs, got ${bonus}`);
  }
  console.log(`✅ Item class correctly calculates motorized bonus: ${bonus} AP (includes middle axle)`);

  // Verify recipe
  const recipe = CraftingRecipes.find(r => r.id === 'vehicle.cargo_wagon');
  if (!recipe) {
    throw new Error("FAIL: Crafting recipe for vehicle.cargo_wagon not found in CraftingRecipes!");
  }
  console.log("✅ found crafting recipe in CraftingRecipes.js");

  // Validate ingredients
  const wheelCount = recipe.ingredients.find(i => i.id === 'crafting.wheel')?.count || 0;
  const plankCount = recipe.ingredients.find(i => i.id === 'weapon.plank')?.count || 0;
  const nailCount = recipe.ingredients.find(i => i.id === 'crafting.nail')?.count || 0;
  const rodCount = recipe.ingredients.find(i => i.id === 'weapon.metal_rod')?.count || 0;

  if (wheelCount !== 6) throw new Error(`FAIL: expected 6 wheels in recipe, got ${wheelCount}`);
  if (plankCount !== 8) throw new Error(`FAIL: expected 8 planks in recipe, got ${plankCount}`);
  if (nailCount !== 8) throw new Error(`FAIL: expected 8 nails in recipe, got ${nailCount}`);
  if (rodCount !== 3) throw new Error(`FAIL: expected 3 metal rods in recipe, got ${rodCount}`);

  console.log("✅ recipe ingredients are correct: 8 planks, 8 nails, 3 metal rods, 6 wheels");

  // Validate tools
  const tools = recipe.tools || [];
  const hasHammer = tools.some(t => t.either?.includes('weapon.hammer') && t.label === 'Hammer');
  if (!hasHammer) throw new Error(`FAIL: expected Hammer tool in recipe, got ${JSON.stringify(tools)}`);
  console.log("✅ recipe tool requires a hammer");

  console.log("\nALL CARGO WAGON VERIFICATIONS PASSED SUCCESSFULLY! 🎉");
}

runVerification();
