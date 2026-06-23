import { SimulationManager } from '../client/src/game/managers/SimulationManager.js';
import { GameMap } from '../client/src/game/map/GameMap.js';
import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { Item } from '../client/src/game/inventory/Item.js';
import { ItemDefs, createItemFromDef } from '../client/src/game/inventory/ItemDefs.js';
import { InventoryManager } from '../client/src/game/inventory/InventoryManager.js';
import { TurretAI } from '../client/src/game/ai/TurretAI.js';
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
    console.log('=== P2-15: Verify Turret Firing try/catch Error Handling ===\n');

    // 1. Reset engine & set up game map + player
    engine.reset();
    const gameMap = new GameMap(10, 10);
    const player = EntityFactory.createPlayer(2, 2);
    gameMap.addEntity(player, 2, 2);
    engine.gameMap = gameMap;
    engine.player = player;

    // 2. Set up inventory manager and place active turret in the ground container at player coordinates
    const inv = new InventoryManager();
    engine.inventoryManager = inv;
    inv.syncWithMap(null, null, 2, 2, gameMap);

    const turretData = createItemFromDef('placeable.auto_turret');
    const turret = new Item(turretData);
    turret.isOn = true;
    inv.groundContainer.addItem(turret);

    // 3. Mock TurretAI.executeTurretTurn to throw an error
    const originalExecute = TurretAI.executeTurretTurn;
    let errorThrownAndCaught = false;
    TurretAI.executeTurretTurn = () => {
        errorThrownAndCaught = true;
        throw new Error('Test turret error simulation');
    };

    // 4. Run the turn simulation
    const context = {
        player,
        isSleeping: false
    };

    console.log('Running turn simulation with a crashing turret...');
    let result = null;
    try {
        result = SimulationManager.runTurn(gameMap, context);
    } catch (e) {
        console.error('Simulation crashed:', e);
    }

    // Restore original method
    TurretAI.executeTurretTurn = originalExecute;

    assert(errorThrownAndCaught === true, 'Turret turn execution threw the simulated error');
    assert(result !== null, 'SimulationManager.runTurn did not crash and returned the action queue');

    console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
    if (failed > 0) {
        console.error('\n❌ SOME TESTS FAILED');
        process.exit(1);
    } else {
        console.log('\n🎉 All P2-15 turret firing try/catch tests passed!');
    }
}

verify().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
