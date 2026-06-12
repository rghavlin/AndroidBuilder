import { GameMap } from '../client/src/game/map/GameMap.js';
import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { Door } from '../client/src/game/entities/Door.js';
import { VisionSystem } from '../client/src/game/systems/VisionSystem.js';
import { AISystem } from '../client/src/game/systems/AISystem.js';
import { CombatSystem } from '../client/src/game/systems/CombatSystem.js';
import { MovementSystem } from '../client/src/game/systems/MovementSystem.js';
import { IntentQueue } from '../client/src/game/managers/IntentQueue.js';

async function testZombieVisionDoor() {
    console.log("--- Starting ECS Zombie Vision Door Test ---");
    const gameMap = new GameMap(40, 40);
    for (let y = 0; y < 40; y++) {
        for (let x = 0; x < 40; x++) {
            gameMap.setTerrain(x, y, 'floor');
        }
    }

    // Player at (22, 20)
    const player = EntityFactory.createPlayer(22, 20);
    gameMap.addEntity(player, 22, 20);

    // Zombie at (19, 20)
    const zombie = EntityFactory.createZombie(19, 20, 'basic', 'zombie-1');
    zombie.currentAP = 10;
    zombie.ap = 10;
    zombie.currentTarget = { id: player.id, type: 'player' };
    zombie.setTargetSighted(22, 20);
    gameMap.addEntity(zombie, 19, 20);

    // Building right wall at x=20, split the map completely
    for (let y = 0; y < 40; y++) {
        gameMap.getTile(20, y).edgeWalls.e = true;
        gameMap.getTile(21, y).edgeWalls.w = true;
    }

    // Closed door at (20, 20) on the East edge
    const door = new Door('door-20-20', 20, 20, false, false, false, 'e');
    door.hp = 5;
    gameMap.addEntity(door, 20, 20);

    const entities = [player, zombie];
    const engine = { gameMap, _uiDirty: false };
    const intentQueue = new IntentQueue();
    const actionQueue = [];

    // Let's run a tick loop similar to SimulationManager
    // We expect the zombie to:
    // 1. Run VisionSystem -> canSee player is false.
    // 2. Run AISystem -> zombie targets door (DamageIntent on door).
    // 3. Resolve Intent -> door is damaged (takes 5 hits = 5 AP). Door breaks, dirtying vision.
    // 4. AISystem runs again because intents were generated -> VisionSystem processes -> spots player -> targets player -> moves/attacks.

    let aiCycleCounter = 0;
    const maxAICycles = 10;
    let newIntentsGenerated = true;

    while (newIntentsGenerated && aiCycleCounter < maxAICycles) {
        newIntentsGenerated = false;

        // 1. Vision System updates
        VisionSystem.process(entities, null, engine, actionQueue);

        // 2. AISystem makes decision
        const initialIntentCount = AISystem.process(entities, null, engine, actionQueue, intentQueue);
        if (initialIntentCount === 0) {
            break;
        }

        // 3. Resolve IntentQueue
        intentQueue.resolve(entities, null, engine, actionQueue);

        // 4. Resolve Movements
        MovementSystem.process(entities, null, engine, actionQueue);

        // 5. Resolve Combat (normal and structure)
        CombatSystem.process(entities, null, engine, actionQueue);

        newIntentsGenerated = true;
        aiCycleCounter++;
    }

    console.log("Actions generated during simulation:", JSON.stringify(actionQueue, null, 2));

    // Assertions
    const structureInteract = actionQueue.find(a => a.type === 'STRUCTURE_INTERACT');
    const playerAttack = actionQueue.find(a => a.type === 'ATTACK' && a.data.targetId === player.id);

    console.log("Structure interact occurred:", !!structureInteract);
    console.log("Player attack occurred:", !!playerAttack);

    if (!structureInteract) {
        throw new Error("Zombie did not attack the door!");
    }
    if (!structureInteract.data.broken) {
        throw new Error("Door was not broken!");
    }
    if (!playerAttack) {
        throw new Error("Zombie did not attack the player after the door was broken!");
    }

    console.log("✅ ECS Zombie Vision Door Test PASSED!");
}

testZombieVisionDoor().catch(e => {
    console.error("❌ Test FAILED:", e);
    process.exit(1);
});
