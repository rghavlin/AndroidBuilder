globalThis.window = {
  gameInitInstances: new Set(),
  dispatchEvent: () => {}
};

import GameInitializationManager from '../client/src/game/GameInitializationManager.js';

console.log('--- EASY START LOOT VERIFICATION ---');

try {
    // 1. VERIFY EASY START
    console.log('\n--- VERIFYING EASY START SETUP ---');
    const initManagerEasy = new GameInitializationManager();
    const successEasy = await initManagerEasy.startInitialization(null, { easyStart: true });
    if (!successEasy) {
        throw new Error('Game initialization failed for Easy Start!');
    }

    const invEasy = initManagerEasy.gameObjects.inventoryManager;

    // Verify upper_body is clothing.pocket_t
    const shirt = invEasy.equipment.upper_body;
    if (!shirt || shirt.defId !== 'clothing.pocket_t') {
        throw new Error(`Expected Pocket T-Shirt on upper body, found: ${shirt ? shirt.defId : 'none'}`);
    }
    console.log('✅ Pocket T-Shirt equipped on upper body');

    // Verify lower_body is clothing.sweatpants
    const pants = invEasy.equipment.lower_body;
    if (!pants || pants.defId !== 'clothing.sweatpants') {
        throw new Error(`Expected Sweatpants on lower body, found: ${pants ? pants.defId : 'none'}`);
    }
    console.log('✅ Sweatpants equipped on lower body');

    // Verify melee is weapon.crowbar
    const crowbar = invEasy.equipment.melee;
    if (!crowbar || crowbar.defId !== 'weapon.crowbar') {
        throw new Error(`Expected Crowbar in melee slot, found: ${crowbar ? crowbar.defId : 'none'}`);
    }
    console.log('✅ Crowbar equipped in melee slot');

    // Verify backpack is backpack.school
    const backpack = invEasy.equipment.backpack;
    if (!backpack || backpack.defId !== 'backpack.school') {
        throw new Error(`Expected Book Bag equipped as backpack, found: ${backpack ? backpack.defId : 'none'}`);
    }
    console.log('✅ Book Bag equipped as backpack');

    const backpackContainer = backpack.getContainerGrid();
    if (!backpackContainer) {
        throw new Error('Failed to retrieve backpack container grid!');
    }
    const backpackItems = backpackContainer.getAllItems();

    // Verify 3 canned beans
    const beans = backpackItems.find(i => i.defId === 'food.beans');
    if (!beans || beans.stackCount !== 3) {
        throw new Error(`Expected canned beans with stack count 3, found: ${beans ? `${beans.defId} x${beans.stackCount}` : 'none'}`);
    }
    console.log('✅ 3 Canned beans found inside backpack');

    // Verify 2 granola bars
    const granolas = backpackItems.find(i => i.defId === 'food.granolabar');
    if (!granolas || granolas.stackCount !== 2) {
        throw new Error(`Expected granola bars with stack count 2, found: ${granolas ? `${granolas.defId} x${granolas.stackCount}` : 'none'}`);
    }
    console.log('✅ 2 Granola bars found inside backpack');

    // Verify 2 water bottles
    const waterBottles = backpackItems.find(i => i.defId === 'food.waterbottle');
    if (!waterBottles || waterBottles.stackCount !== 2) {
        throw new Error(`Expected water bottles with stack count 2, found: ${waterBottles ? `${waterBottles.defId} x${waterBottles.stackCount}` : 'none'}`);
    }
    console.log('✅ 2 Water bottles found inside backpack');

    // Verify 1 lighter with full charges (10)
    const lighter = backpackItems.find(i => i.defId === 'tool.lighter');
    if (!lighter || lighter.stackCount !== 1 || lighter.ammoCount !== 10) {
        throw new Error(`Expected 1 lighter with 10 charges, found: ${lighter ? `${lighter.defId} x${lighter.stackCount} (${lighter.ammoCount} charges)` : 'none'}`);
    }
    console.log('✅ 1 Lighter with full charges found inside backpack');

    // Verify 1 knife
    const knife = backpackItems.find(i => i.defId === 'weapon.knife');
    if (!knife) {
        throw new Error('Expected starting knife inside backpack, found none');
    }
    console.log('✅ 1 Starting knife found inside backpack');


    // 2. VERIFY NORMAL START
    console.log('\n--- VERIFYING NORMAL START SETUP ---');
    const initManagerNormal = new GameInitializationManager();
    const successNormal = await initManagerNormal.startInitialization(null, { easyStart: false });
    if (!successNormal) {
        throw new Error('Game initialization failed for Normal Start!');
    }

    const invNormal = initManagerNormal.gameObjects.inventoryManager;

    // Verify upper_body is clothing.pocket_t
    const normalShirt = invNormal.equipment.upper_body;
    if (!normalShirt || normalShirt.defId !== 'clothing.pocket_t') {
        throw new Error(`Expected Pocket T-Shirt on upper body, found: ${normalShirt ? normalShirt.defId : 'none'}`);
    }
    console.log('✅ Pocket T-Shirt equipped on upper body (Normal Start)');

    // Verify lower_body is clothing.sweatpants
    const normalPants = invNormal.equipment.lower_body;
    if (!normalPants || normalPants.defId !== 'clothing.sweatpants') {
        throw new Error(`Expected Sweatpants on lower body, found: ${normalPants ? normalPants.defId : 'none'}`);
    }
    console.log('✅ Sweatpants equipped on lower body (Normal Start)');

    // Verify melee is empty
    if (invNormal.equipment.melee) {
        throw new Error(`Expected melee slot to be empty, found: ${invNormal.equipment.melee.defId}`);
    }
    console.log('✅ Melee slot is empty (Normal Start)');

    // Verify backpack is empty
    if (invNormal.equipment.backpack) {
        throw new Error(`Expected backpack slot to be empty, found: ${invNormal.equipment.backpack.defId}`);
    }
    console.log('✅ Backpack slot is empty (Normal Start)');

    console.log('\n✅ ALL START DIFFICULTY VERIFICATION CHECKS PASSED SUCCESSFULLY!');

} catch (err) {
    console.error('\n❌ VERIFICATION FAILED:', err);
    process.exit(1);
}
