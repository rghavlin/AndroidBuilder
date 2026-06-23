import { GameSaveSystem, DEFAULT_PLAYER_STATS } from '../client/src/game/GameSaveSystem.js';

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
    console.log('=== P2-12: Verify save/load stat defaults ===\n');

    // 1. Verify DEFAULT_PLAYER_STATS properties
    assert(DEFAULT_PLAYER_STATS.hp === 100, 'Default hp is 100');
    assert(DEFAULT_PLAYER_STATS.maxHp === 100, 'Default maxHp is 100');
    assert(DEFAULT_PLAYER_STATS.ap === 12, 'Default ap is 12');
    assert(DEFAULT_PLAYER_STATS.maxAp === 12, 'Default maxAp is 12');

    // 2. Verify saveGameState fallback logic
    const mockStateEmpty = {
        turn: 5,
        player: null,
        gameMap: null,
        worldManager: null,
        inventoryManager: null,
        camera: null,
        metadata: null,
        isPlayerTurn: true
    };

    const savedEmpty = GameSaveSystem.saveGameState(mockStateEmpty);
    assert(savedEmpty.playerStats !== undefined, 'saveGameState generated playerStats');
    if (savedEmpty.playerStats) {
        assert(savedEmpty.playerStats.hp === DEFAULT_PLAYER_STATS.hp, 'Saved fallback hp is correct');
        assert(savedEmpty.playerStats.maxHp === DEFAULT_PLAYER_STATS.maxHp, 'Saved fallback maxHp is correct');
        assert(savedEmpty.playerStats.ap === DEFAULT_PLAYER_STATS.ap, 'Saved fallback ap is correct');
        assert(savedEmpty.playerStats.maxAp === DEFAULT_PLAYER_STATS.maxAp, 'Saved fallback maxAp is correct');
    }

    // 3. Verify loadGameState fallback logic when playerStats is missing
    const mapData = {
        width: 10,
        height: 10,
        tiles: Array(10).fill(0).map((_, y) => 
            Array(10).fill(0).map((_, x) => ({
                x, y, terrain: 'grass', contents: x === 5 && y === 5 ? [{ id: 'p1', type: 'player' }] : []
            }))
        )
    };

    const saveData = {
        version: '1.1.0',
        turn: 10,
        gameMap: mapData,
        worldManager: { currentMapId: 'map_001', maps: [], mapCounter: 1 },
        // playerStats is missing/undefined
        inventoryManager: {},
        cameraPosition: { x: 0, y: 0, zoomLevel: 1 }
    };

    console.log('Loading state with missing playerStats...');
    const loadedState = await GameSaveSystem.loadGameState(saveData);

    assert(loadedState.playerStats !== undefined, 'loadGameState populated playerStats fallback');
    if (loadedState.playerStats) {
        console.log('Loaded playerStats:', loadedState.playerStats);
        assert(loadedState.playerStats.hp === DEFAULT_PLAYER_STATS.hp, 'Loaded fallback hp is 100, not 1000');
        assert(loadedState.playerStats.maxHp === DEFAULT_PLAYER_STATS.maxHp, 'Loaded fallback maxHp is 100, not 1000');
        assert(loadedState.playerStats.ap === DEFAULT_PLAYER_STATS.ap, 'Loaded fallback ap is 12, not 1000');
        assert(loadedState.playerStats.maxAp === DEFAULT_PLAYER_STATS.maxAp, 'Loaded fallback maxAp is 12, not 1000');
    }

    console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
    if (failed > 0) {
        console.error('\n❌ SOME TESTS FAILED');
        process.exit(1);
    } else {
        console.log('\n🎉 All P2-12 save/load defaults tests passed!');
    }
}

verify().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
