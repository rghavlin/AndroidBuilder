import { TEMPLATE_METADATA, getTemplateForMapNumber, FIXED_TEMPLATE_ASSIGNMENTS } from '../client/src/game/config/TemplateConfig.js';
import { WorldManager } from '../client/src/game/WorldManager.js';
import { GameMap } from '../client/src/game/map/GameMap.js';
import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { Tile } from '../client/src/game/map/Tile.js';

let passed = 0;
let failed = 0;

function assert(condition, label) {
    if (condition) {
        console.log(`✅ PASS: ${label}`);
        passed++;
    } else {
        console.error(`❌ FAIL: ${label}`);
        failed++;
    }
}

function verify() {
    console.log('=== P3-03: Verify Spawn Coordinates & Template Metadata ===\n');

    // --- TEST 1: TEMPLATE_METADATA properties correctness ---
    console.log('--- Test 1: TEMPLATE_METADATA definitions ---');
    assert(TEMPLATE_METADATA.road.size.width === 45 && TEMPLATE_METADATA.road.size.height === 125, 'Road size is 45x125');
    assert(TEMPLATE_METADATA.road.southEntranceX === 22 && TEMPLATE_METADATA.road.northExitX === 22, 'Road entrances are 22');
    
    assert(TEMPLATE_METADATA.winding_road.size.width === 85 && TEMPLATE_METADATA.winding_road.size.height === 125, 'Winding Road size is 85x125');
    assert(TEMPLATE_METADATA.winding_road.southEntranceX === 22 && TEMPLATE_METADATA.winding_road.northExitX === 62, 'Winding Road entrance/exit correct');
    
    assert(TEMPLATE_METADATA.mirrored_winding_road.size.width === 85 && TEMPLATE_METADATA.mirrored_winding_road.size.height === 125, 'Mirrored Winding Road size is 85x125');
    assert(TEMPLATE_METADATA.mirrored_winding_road.southEntranceX === 62 && TEMPLATE_METADATA.mirrored_winding_road.northExitX === 22, 'Mirrored Winding Road entrance/exit correct');
    
    assert(TEMPLATE_METADATA.split_road.size.width === 60 && TEMPLATE_METADATA.split_road.size.height === 150, 'Split Road size is 60x150');
    assert(TEMPLATE_METADATA.split_road.southEntranceX === 30 && TEMPLATE_METADATA.split_road.northExitX === 30, 'Split Road entrance/exit correct');
    
    assert(TEMPLATE_METADATA.lab.size.width === 70 && TEMPLATE_METADATA.lab.size.height === 84, 'Lab size is 70x84');
    assert(TEMPLATE_METADATA.lab.southEntranceX === 35 && TEMPLATE_METADATA.lab.northExitX === 35, 'Lab entrance/exit correct');

    // --- TEST 2: getTemplateForMapNumber progression logic ---
    console.log('\n--- Test 2: progression mapping logic ---');
    assert(getTemplateForMapNumber(1) === 'branching_road', 'Map 1 is branching_road');
    assert(getTemplateForMapNumber(1, true) === 'lab', 'Map 1 is lab when devForceLab is true');
    assert(getTemplateForMapNumber(1) === 'branching_road', 'Map 1 is branching_road');
    assert(getTemplateForMapNumber(1, true) === 'lab', 'Map 1 is lab when devForceLab is true');
    assert(getTemplateForMapNumber(2) === 'branching_road', 'Map 2 is branching_road');
    assert(getTemplateForMapNumber(3) === 'lab', 'Map 3 is lab');
    assert(getTemplateForMapNumber(4) === 'road', 'Map 4 is road');
    assert(getTemplateForMapNumber(5) === 'road', 'Map 5 is road');
    assert(getTemplateForMapNumber(6) === 'winding_road', 'Map 6 is winding_road');
    assert(getTemplateForMapNumber(7) === 'mirrored_winding_road', 'Map 7 is mirrored_winding_road');
    assert(getTemplateForMapNumber(8) === 'split_road', 'Map 8 is split_road');
    
    const randomTemplate9 = getTemplateForMapNumber(9);
    assert(['road', 'winding_road', 'mirrored_winding_road', 'split_road'].includes(randomTemplate9), `Map 9 maps to random road category: ${randomTemplate9}`);

    // --- TEST 3: WorldManager Transition Predictions ---
    console.log('\n--- Test 3: WorldManager predicted transition points ---');
    const world = new WorldManager();
    world.canGoSouth = () => true;
    world.currentMapId = 'map_006'; // Winding Road. Transitions to map_007 next (Mirrored Winding Road)

    // Set up mock map at map_006 (Winding Road)
    const map6 = new GameMap(85, 125);
    map6.mapNumber = 6;
    map6.template = 'winding_road';
    
    // Add player at y=0 on a transition tile (exiting to map_007 - Mirrored Winding Road)
    const player = EntityFactory.createPlayer(22, 0);
    map6.addEntity(player, 22, 0);
    const tile = map6.getTile(22, 0);
    tile.terrain = 'transition';

    // Test transition predicting Mirrored Winding Road (nextMapId is map_007)
    // Mirrored Winding Road has height 125, and southEntranceX 62
    const transitionNorth = world.checkTransitionPoint(player, map6);
    assert(transitionNorth !== null, 'Transition detected going north');
    assert(transitionNorth.nextMapId === 'map_007', 'Exits to map_007');
    assert(transitionNorth.spawnPosition.x === 62 && transitionNorth.spawnPosition.y === 123, 
        `Mirrored Winding Road spawn predicted correctly: (${transitionNorth.spawnPosition.x}, ${transitionNorth.spawnPosition.y})`);

    // Let's test entering split_road (map 8) from map 7
    world.currentMapId = 'map_007';
    const map7 = new GameMap(85, 125);
    map7.mapNumber = 7;
    map7.template = 'mirrored_winding_road';
    player.x = 22; player.y = 0; // Exiting north from map 7 to map 8 (Split Road)
    map7.addEntity(player, 22, 0);
    map7.getTile(22, 0).terrain = 'transition';

    const transitionNorthToSplit = world.checkTransitionPoint(player, map7);
    assert(transitionNorthToSplit !== null, 'Transition detected going north from map 7');
    assert(transitionNorthToSplit.nextMapId === 'map_008', 'Exits to map_008');
    assert(transitionNorthToSplit.spawnPosition.x === 30 && transitionNorthToSplit.spawnPosition.y === 148,
        `Split Road spawn predicted correctly: (${transitionNorthToSplit.spawnPosition.x}, ${transitionNorthToSplit.spawnPosition.y})`);

    // Let's test entering road (map 4) from map 3 (Lab)
    world.currentMapId = 'map_003';
    const map3 = new GameMap(70, 84);
    map3.mapNumber = 3;
    map3.template = 'lab';
    player.x = 22; player.y = 0; // Exiting north from map 3 to map 4 (Road)
    map3.addEntity(player, 22, 0);
    map3.getTile(22, 0).terrain = 'transition';

    const transitionNorthToRoad = world.checkTransitionPoint(player, map3);
    assert(transitionNorthToRoad !== null, 'Transition detected going north from map 3');
    assert(transitionNorthToRoad.nextMapId === 'map_004', 'Exits to map_004');
    assert(transitionNorthToRoad.spawnPosition.x === 22 && transitionNorthToRoad.spawnPosition.y === 123,
        `Road spawn predicted correctly: (${transitionNorthToRoad.spawnPosition.x}, ${transitionNorthToRoad.spawnPosition.y})`);

    // Test transition going back South to previous map (Map 7 -> Map 6)
    world.currentMapId = 'map_007'; // Current map is map_007, previous is map_006 (Winding Road)
    player.x = 22; player.y = 124; // Exiting south from bottom edge of map 7
    map7.addEntity(player, 22, 124);
    map7.getTile(22, 124).terrain = 'transition';

    // Back to map_006 (Winding Road) northExitX is 62
    const transitionSouth = world.checkTransitionPoint(player, map7);
    assert(transitionSouth !== null, 'Transition detected going south');
    assert(transitionSouth.nextMapId === 'map_006', 'Exits south to map_006');
    assert(transitionSouth.spawnPosition.x === 62 && transitionSouth.spawnPosition.y === 1,
        `Winding Road north entrance predicted correctly: (${transitionSouth.spawnPosition.x}, ${transitionSouth.spawnPosition.y})`);

    console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
    if (failed > 0) {
        console.error('\n❌ SOME TESTS FAILED');
        process.exit(1);
    } else {
        console.log('\n🎉 All P3-03 template metadata tests passed!');
        process.exit(0);
    }
}

verify();
