
import { GameSaveSystem } from './client/src/game/GameSaveSystem.js';
import { GameMap } from './client/src/game/map/GameMap.js';
import { Player } from './client/src/game/entities/Player.js';

async function verifyRestoration() {
    try {
        console.log("Starting Refined Verification of LootGenerator Restoration...");

        // 1. Create a minimal serializable map data
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
            playerStats: { hp: 100, maxHp: 100, ap: 12, maxAp: 12, ammo: 0 },
            inventoryManager: {},
            cameraPosition: { x: 0, y: 0, zoomLevel: 1 }
        };

        console.log("Calling GameSaveSystem.loadGameState...");
        // This will trigger the dynamic imports for LootGenerator, etc.
        const loadedState = await GameSaveSystem.loadGameState(saveData);

        if (loadedState.lootGenerator) {
            console.log("✅ SUCCESS: LootGenerator found in loaded state.");
            const items = loadedState.lootGenerator.generateZombieLoot('basic');
            console.log(`✅ SUCCESS: Generated ${items.length} items.`);
        } else {
            console.error("❌ FAILURE: LootGenerator missing from loaded state.");
            process.exit(1);
        }

    } catch (error) {
        console.error("❌ ERROR during verification:");
        console.error(error.stack || error);
        process.exit(1);
    }
}

verifyRestoration();
