import { GameMap } from '../client/src/game/map/GameMap.js';
import { Zombie } from '../client/src/game/entities/Zombie.js';
import { Door } from '../client/src/game/entities/Door.js';
import { ZombieAI } from '../client/src/game/ai/ZombieAI.js';
import { Pathfinding } from '../client/src/game/utils/Pathfinding.js';

async function testZombieBug() {
    console.log("--- Reproducing Zombie AI Door Bug ---");
    const gameMap = new GameMap(40, 40);
    for (let y = 0; y < 40; y++) {
        for (let x = 0; x < 40; x++) {
            gameMap.setTerrain(x, y, 'floor');
        }
    }

    // Player at (22, 20)
    const player = { id: 'player', type: 'player', logicalX: 22, logicalY: 20, x: 22, y: 20 };
    gameMap.addEntity(player, 22, 20);

    // Zombie at (19, 20)
    const zombie = new Zombie('zombie-1', 19, 20, 'basic');
    zombie.currentAP = 10;
    gameMap.addEntity(zombie, 19, 20);

    // Building right wall at x=20, split the map completely
    for (let y = 0; y < 40; y++) {
        gameMap.getTile(20, y).edgeWalls.e = true;
        gameMap.getTile(21, y).edgeWalls.w = true;
    }

    // Closed door at (20, 20) on the East edge
    const door = new Door('door-20-20', 20, 20, false, false, false, 'e');
    gameMap.addEntity(door, 20, 20);

    // Setup zombie's target memory since player just closed the door
    zombie.currentTarget = { id: 'player', type: 'player' };
    zombie.setTargetSighted(22, 20); // last seen player at (22, 20)

    console.log(`Zombie Pos: (${zombie.logicalX}, ${zombie.logicalY}), targetSightedCoords: (${zombie.targetSightedCoords.x}, ${zombie.targetSightedCoords.y}), lastSeen: ${zombie.lastSeen}`);
    console.log(`Door Pos: (${door.logicalX}, ${door.logicalY}), isOpen: ${door.isOpen}, edge: ${door.edge}`);

    // Check path
    const path = Pathfinding.findPath(gameMap, zombie.logicalX, zombie.logicalY, 22, 20, {
        allowDiagonal: true,
        isZombie: true,
        entity: zombie,
        maxDistance: 60,
        isPathfinding: true
    });
    console.log("Path from zombie to player position:", path);

    // Run turn
    ZombieAI.DEBUG = true;
    const result = ZombieAI.executeZombieTurn(zombie, gameMap, player, [], new Set());
    console.log("Turn actions:", JSON.stringify(result.actions, null, 2));
    console.log(`Final Zombie Pos: (${zombie.logicalX}, ${zombie.logicalY}), AP remaining: ${zombie.currentAP}`);
}

testZombieBug().catch(console.error);
