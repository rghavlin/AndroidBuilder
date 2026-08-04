import { describe, it, expect } from 'vitest';
import { CraftingManager } from '../../client/src/game/inventory/CraftingManager.js';
import { InventoryManager } from '../../client/src/game/inventory/InventoryManager.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';

const assert = (condition, message) => expect(condition, message).toBeTruthy();

describe('Inventory / Crafting / Torch Recipe Alternatives', () => {
  it('allows crafting a torch with a stick or a plank', () => {
    // 1. Setup mock engine
    const engine = {
      weather: { type: 'clear', intensity: 0 },
      setWeather() {}
    };

    const inv = new InventoryManager(engine);
    engine.inventoryManager = inv;

    const cm = new CraftingManager(inv);
    inv.craftingManager = cm;

    // 2. Test Stick + Rag recipe matching
    const stick = Item.fromJSON(createItemFromDef('weapon.stick'));
    const rag = Item.fromJSON(createItemFromDef('crafting.rag'));

    // Place them in crafting ingredients workspace
    const ingredientContainer = inv.getContainer('crafting-ingredients');
    ingredientContainer.addItem(stick);
    ingredientContainer.addItem(rag);

    // Check requirements
    let requirements = cm.checkRequirements('crafting.torch', 10, 1);
    assert(requirements.canCraft, 'can craft torch with stick and rag');
    assert(requirements.missing.length === 0, 'no missing ingredients');

    // Clean workspace
    ingredientContainer.clear();

    // 3. Test Plank + Rag recipe matching
    const plank = Item.fromJSON(createItemFromDef('weapon.plank'));
    const rag2 = Item.fromJSON(createItemFromDef('crafting.rag'));
    ingredientContainer.addItem(plank);
    ingredientContainer.addItem(rag2);

    requirements = cm.checkRequirements('crafting.torch', 10, 1);
    assert(requirements.canCraft, 'can craft torch with plank and rag');
    assert(requirements.missing.length === 0, 'no missing ingredients');

    // 4. Test missing ingredient (missing stick/plank)
    ingredientContainer.clear();
    ingredientContainer.addItem(rag2);

    requirements = cm.checkRequirements('crafting.torch', 10, 1);
    assert(!requirements.canCraft, 'cannot craft torch without stick/plank');
    assert(requirements.missing.includes('Stick or Plank'), 'should list Stick or Plank as missing');
  });
});
