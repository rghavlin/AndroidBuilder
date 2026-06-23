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
    assert(getTemplateForMapNumber(2) === 'road', 'Map 2 is road');
    assert(getTemplateForMapNumber(3) === 'road', 'Map 3 is road');
    assert(getTemplateForMapNumber(4) === 'winding_road', 'Map 4 is winding_road');
    assert(getTemplateForMapNumber(5) === 'mirrored_winding_road', 'Map 5 is mirrored_winding_road');
    assert(getTemplateForMapNumber(6) === 'split_road', 'Map 6 is split_road');
    assert(getTemplateForMapNumber(10) === 'lab', 'Map 10 is lab');
    
    const randomTemplate7 = getTemplateForMapNumber(7);
    assert(['road', 'winding_road', 'mirrored_winding_road', 'split_road'].includes(randomTemplate7), `Map 7 maps to random road category: ${randomTemplate7}`);

    // --- TEST 3: WorldManager Transition Predictions ---
    console.log('\n--- Test 3: WorldManager predicted transition points ---');
    const world = new WorldManager();
    world.currentMapId = 'map_004'; // Current map is map_004 (which transitions to map_005 next)

    // Set up mock map at map_004 (Winding Road)
    const map4 = new GameMap(85, 125);
    map4.mapNumber = 4;
    
    // Add player at y=0 on a transition tile (exiting to map_005 - Mirrored Winding Road)
    const player = EntityFactory.createPlayer(22, 0);
    map4.addEntity(player, 22, 0);
    const tile = map4.getTile(22, 0);
    tile.terrain = 'transition';

    // Test transition predicting Mirrored Winding Road (nextMapId is map_005)
    // Mirrored Winding Road has height 125, and southEntranceX 62
    const transitionNorth = world.checkTransitionPoint(player, map4);
    assert(transitionNorth !== null, 'Transition detected going north');
    assert(transitionNorth.nextMapId === 'map_005', 'Exits to map_005');
    assert(transitionNorth.spawnPosition.x === 62 && transitionNorth.spawnPosition.y === 123, 
        `Mirrored Winding Road spawn predicted correctly: (${transitionNorth.spawnPosition.x}, ${transitionNorth.spawnPosition.y})`);

    // Let's test entering split_road (map 6) from map 5
    world.currentMapId = 'map_005';
    const map5 = new GameMap(85, 125);
    map5.mapNumber = 5;
    player.x = 22; player.y = 0; // Exiting north from map 5 to map 6 (Split Road)
    map5.addEntity(player, 22, 0);
    map5.getTile(22, 0).terrain = 'transition';

    const transitionNorthToSplit = world.checkTransitionPoint(player, map5);
    assert(transitionNorthToSplit !== null, 'Transition detected going north from map 5');
    assert(transitionNorthToSplit.nextMapId === 'map_006', 'Exits to map_006');
    assert(transitionNorthToSplit.spawnPosition.x === 30 && transitionNorthToSplit.spawnPosition.y === 148,
        `Split Road spawn predicted correctly: (${transitionNorthToSplit.spawnPosition.x}, ${transitionNorthToSplit.spawnPosition.y})`);

    // Let's test entering lab (map 10) from map 9
    world.currentMapId = 'map_009';
    const map9 = new GameMap(45, 125);
    map9.mapNumber = 9;
    player.x = 22; player.y = 0; // Exiting north from map 9 to map 10 (Lab)
    map9.addEntity(player, 22, 0);
    map9.getTile(22, 0).terrain = 'transition';

    const transitionNorthToLab = world.checkTransitionPoint(player, map9);
    assert(transitionNorthToLab !== null, 'Transition detected going north from map 9');
    assert(transitionNorthToLab.nextMapId === 'map_010', 'Exits to map_010');
    assert(transitionNorthToLab.spawnPosition.x === 35 && transitionNorthToLab.spawnPosition.y === 82,
        `Lab spawn predicted correctly: (${transitionNorthToLab.spawnPosition.x}, ${transitionNorthToLab.spawnPosition.y})`);

    // Test transition going back South to previous map (Map 5 -> Map 4)
    world.currentMapId = 'map_005'; // Current map is map_005, previous is map_004 (Winding Road)
    player.x = 22; player.y = 124; // Exiting south from bottom edge of map 5
    map5.addEntity(player, 22, 124);
    map5.getTile(22, 124).terrain = 'transition';

    // Back to map_004 (Winding Road) northExitX is 62
    const transitionSouth = world.checkTransitionPoint(player, map5);
    assert(transitionSouth !== null, 'Transition detected going south');
    assert(transitionSouth.nextMapId === 'map_004', 'Exits south to map_004');
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
