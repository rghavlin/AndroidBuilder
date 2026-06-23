// Mock global window object before importing GameInitializationManager
globalThis.window = {};

import GameInitializationManager from '../client/src/game/GameInitializationManager.js';
import { GameMap } from '../client/src/game/map/GameMap.js';
import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { WorldManager } from '../client/src/game/WorldManager.js';
import { earbucksShopSystem } from '../client/src/game/systems/EarbucksShopSystem.js';
import engine from '../client/src/game/GameEngine.js';

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

async function verify() {
    console.log('=== P3-01: Verify dynamic map ID for earbucks catalog init ===\n');

    // 1. Set up game initialization manager and mock game objects
    const initManager = new GameInitializationManager();
    const gameMap = new GameMap(10, 10);
    const player = EntityFactory.createPlayer(5, 5);
    const worldManager = new WorldManager();
    
    // Set custom map ID
    worldManager.currentMapId = 'map_test_custom_999';
    worldManager.maps.set('map_test_custom_999', { metadata: {} });
    engine.worldManager = worldManager;

    initManager.gameObjects = {
        gameMap,
        player,
        worldManager
    };

    // Mock NPCSpawner.spawnShopkeeper to return true (so the shopkeeper is spawned)
    const { NPCSpawner } = await import('../client/src/game/utils/NPCSpawner.js');
    const originalSpawnShopkeeper = NPCSpawner.spawnShopkeeper;
    const originalSpawnTownTurrets = NPCSpawner.spawnTownTurrets;
    
    NPCSpawner.spawnShopkeeper = () => ({ id: 'shopkeeper-1' });
    NPCSpawner.spawnTownTurrets = () => {};

    // 2. Call _executeWorldPopulation
    console.log('Executing _executeWorldPopulation...');
    await initManager._executeWorldPopulation();

    // 3. Verify that the catalog was initialized under 'map_test_custom_999'
    const catalog = earbucksShopSystem.getCatalog('map_test_custom_999');
    assert(catalog.length > 0, 'Catalog was successfully initialized for the custom map ID "map_test_custom_999"');

    // Clean up mocks
    NPCSpawner.spawnShopkeeper = originalSpawnShopkeeper;
    NPCSpawner.spawnTownTurrets = originalSpawnTownTurrets;

    console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
    if (failed > 0) {
        console.error('\n❌ SOME TESTS FAILED');
        process.exit(1);
    } else {
        console.log('\n🎉 All P3-01 dynamic map ID init catalog tests passed!');
    }
}

verify().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
