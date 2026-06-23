import engine from '../client/src/game/GameEngine.js';
import { WorldManager } from '../client/src/game/WorldManager.js';

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
    console.log('=== P2-10: Verify executeTransition fromMapId ===\n');

    const worldManager = new WorldManager();
    engine.worldManager = worldManager;

    console.log('Pre-generating map_001 and map_002...');
    await worldManager.generateNextMap('road', 1); // Generates map_001
    await worldManager.generateNextMap('road', 1); // Generates map_002

    // Set current map ID explicitly to map_001
    worldManager.currentMapId = 'map_001';

    let transitionEventData = null;
    worldManager.addEventListener('mapTransition', (data) => {
        transitionEventData = data;
    });

    console.log('Executing transition map_001 -> map_002...');
    const result = await worldManager.executeTransition('map_002', { x: 5, y: 5 }, 1);

    assert(transitionEventData !== null, 'mapTransition event was emitted');
    if (transitionEventData) {
        console.log('Emitted event data:', transitionEventData);
        assert(transitionEventData.fromMapId === 'map_001', 'fromMapId correctly reports "map_001"');
        assert(transitionEventData.toMapId === 'map_002', 'toMapId correctly reports "map_002"');
        assert(transitionEventData.spawnPosition.x === 5 && transitionEventData.spawnPosition.y === 5, 'spawnPosition is correct');
    }

    console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
    if (failed > 0) {
        console.error('\n❌ SOME TESTS FAILED');
        process.exit(1);
    } else {
        console.log('\n🎉 All P2-10 transition event tests passed!');
    }
}

verify().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
