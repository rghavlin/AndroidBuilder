import { TemplateMapGenerator } from '../client/src/game/map/TemplateMapGenerator.js';
import { LootGenerator } from '../client/src/game/map/LootGenerator.js';
import { GameMap } from '../client/src/game/map/GameMap.js';

console.log('--- EASY START LOOT VERIFICATION ---');

try {
    const templateMapGenerator = new TemplateMapGenerator();
    const lootGenerator = new LootGenerator();

    const mapData = templateMapGenerator.generateFromTemplate('starting_road', {
        randomWalls: 1,
        extraFloors: 2,
        mapNumber: 1
    });

    const gameMap = new GameMap(mapData.width, mapData.height);
    gameMap.mapNumber = 1;
    await templateMapGenerator.applyToGameMap(gameMap, mapData);
    
    // Spawn loot with easyStart: true
    lootGenerator.spawnLoot(gameMap, 1, { easyStart: true });

    // Locate starting home
    const startingHome = gameMap.buildings.find(b => b.type === 'starting_home');
    if (!startingHome) {
        throw new Error('Starting home building not found on the map!');
    }
    console.log(`Starting Home: at (${startingHome.x}, ${startingHome.y}) size ${startingHome.width}x${startingHome.height}`);

    // Scan starting home floor tiles
    const houseItems = [];
    for (let y = startingHome.y + 1; y < startingHome.y + startingHome.height - 1; y++) {
        for (let x = startingHome.x + 1; x < startingHome.x + startingHome.width - 1; x++) {
            const items = gameMap.getItemsOnTile(x, y) || [];
            if (items.length > 0) {
                houseItems.push(...items);
                console.log(`Loot at (${x}, ${y}): ${items.map(i => `${i.name} (ID: ${i.defId}, Cond: ${i.condition || 'N/A'}, Charges: ${i.ammoCount !== undefined ? i.ammoCount : 'N/A'})`).join(', ')}`);
            }
        }
    }

    // Verify Easy Start requirements
    console.log('\n--- VERIFYING EASY START REQUIREMENTS ---');

    // 1. Water Bottles
    const waterBottles = houseItems.filter(i => i.defId === 'food.waterbottle');
    console.log(`Water bottles found: ${waterBottles.length}`);
    if (waterBottles.length < 2) {
        throw new Error(`Expected at least 2 water bottles, found ${waterBottles.length}`);
    }
    const fullWaterBottles = waterBottles.filter(wb => wb.ammoCount === (wb.capacity || 20));
    console.log(`  Full water bottles found: ${fullWaterBottles.length}`);
    if (fullWaterBottles.length < 2) {
        throw new Error(`Expected at least 2 full water bottles, found ${fullWaterBottles.length}`);
    }

    // 2. Canned Beans
    const beans = houseItems.filter(i => i.defId === 'food.beans');
    console.log(`Canned beans found: ${beans.length}`);
    if (beans.length < 2) {
        throw new Error(`Expected at least 2 canned beans, found ${beans.length}`);
    }

    // 3. Canned Corn
    const corn = houseItems.filter(i => i.defId === 'food.cannedcorn');
    console.log(`Canned corn found: ${corn.length}`);
    if (corn.length < 2) {
        throw new Error(`Expected at least 2 canned corn, found ${corn.length}`);
    }

    // 4. Book Bag
    const bookBags = houseItems.filter(i => i.defId === 'backpack.school');
    console.log(`Book bags found: ${bookBags.length}`);
    if (bookBags.length < 1) {
        throw new Error(`Expected at least 1 book bag, found ${bookBags.length}`);
    }

    // 5. Melee Weapon
    const allowedMelee = ['weapon.machete', 'weapon.fire_axe', 'weapon.hammer', 'weapon.crowbar'];
    const meleeWeapons = houseItems.filter(i => allowedMelee.includes(i.defId));
    console.log(`Guaranteed melee weapons found: ${meleeWeapons.length} (${meleeWeapons.map(w => w.defId).join(', ')})`);
    if (meleeWeapons.length < 1) {
        throw new Error('Expected at least 1 melee weapon (Machete, Fire axe, Hammer, or Crowbar)');
    }
    const perfectMeleeWeapons = meleeWeapons.filter(w => w.condition === 100);
    console.log(`  Perfect condition (100%) melee weapons: ${perfectMeleeWeapons.length}`);
    if (perfectMeleeWeapons.length < 1) {
        throw new Error('Expected at least 1 melee weapon at 100% condition');
    }

    // 6. Work shirt
    const shirts = houseItems.filter(i => i.defId === 'clothing.workshirt');
    console.log(`Work shirts found: ${shirts.length}`);
    if (shirts.length < 1) {
        throw new Error(`Expected at least 1 work shirt, found ${shirts.length}`);
    }

    // 7. Blue jeans
    const jeans = houseItems.filter(i => i.defId === 'clothing.blue_jeans');
    console.log(`Blue jeans found: ${jeans.length}`);
    if (jeans.length < 1) {
        throw new Error(`Expected at least 1 blue jeans, found ${jeans.length}`);
    }

    // 8. Lighter
    const lighters = houseItems.filter(i => i.defId === 'tool.lighter');
    console.log(`Lighters found: ${lighters.length}`);
    if (lighters.length < 1) {
        throw new Error(`Expected at least 1 lighter, found ${lighters.length}`);
    }
    const compliantLighters = lighters.filter(l => l.ammoCount >= 5 && l.ammoCount <= 10);
    console.log(`  Compliant lighters (5-10 charges) found: ${compliantLighters.length}`);
    if (compliantLighters.length < 1) {
        throw new Error('Expected at least 1 lighter with 5-10 charges');
    }

    // 9. Cooking Pot
    const pots = houseItems.filter(i => i.defId === 'tool.cooking_pot');
    console.log(`Cooking pots found: ${pots.length}`);
    if (pots.length < 1) {
        throw new Error(`Expected at least 1 cooking pot, found ${pots.length}`);
    }

    console.log('\n✅ ALL EASY START CHECKS PASSED SUCCESSFULLY!');

} catch (err) {
    console.error('❌ EASY START VERIFICATION FAILED:', err);
    process.exit(1);
}
