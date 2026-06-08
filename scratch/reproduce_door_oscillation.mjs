import { GameMap } from '../client/src/game/map/GameMap.js';
import { Tile } from '../client/src/game/map/Tile.js';
import { Zombie } from '../client/src/game/entities/Zombie.js';
import { Door } from '../client/src/game/entities/Door.js';
import { ZombieAI } from '../client/src/game/ai/ZombieAI.js';
import { Pathfinding } from '../client/src/game/utils/Pathfinding.js';

async function runTest() {
    console.log("--- Open Door Pathfinding Test ---");
    const gameMap = new GameMap(10, 10);
    for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
            gameMap.setTerrain(x, y, 'floor');
        }
    }

    // Set horizontal wall between y=4 and y=5
    // Inside is y >= 5, outside is y <= 4.
    // We'll set edge walls on y=5 (north edge) and y=4 (south edge)
    for (let x = 0; x < 10; x++) {
        gameMap.getTile(x, 5).edgeWalls.n = true;
        gameMap.getTile(x, 4).edgeWalls.s = true;
    }

    // We place an open door at (5, 5) on the north edge ('n')
    const door = new Door('door-1', 5, 5, false, true, false, 'n');
    gameMap.addEntity(door, 5, 5);

    // Player outside the room at (5, 4) (directly north of the open door)
    const player = { id: 'player', type: 'player', logicalX: 5, logicalY: 4, x: 5, y: 4 };
    gameMap.addEntity(player, 5, 4);

    // Zombie inside the room at (4, 5) (bottom-left of the doorway, i.e., diagonal)
    const zombie = new Zombie('zombie-1', 4, 5, 'basic');
    zombie.currentAP = 10;
    gameMap.addEntity(zombie, 4, 5);

    console.log(`Initial Setup:`);
    console.log(`Player at (${player.logicalX}, ${player.logicalY})`);
    console.log(`Zombie at (${zombie.logicalX}, ${zombie.logicalY})`);
    console.log(`Door at (${door.logicalX}, ${door.logicalY}), isOpen: ${door.isOpen}, edge: ${door.edge}`);

    // Print walkability of key tiles
    console.log(`Tile (5,5) walkable for zombie:`, gameMap.getTile(5, 5).isWalkable(zombie));
    console.log(`Tile (5,4) walkable for zombie:`, gameMap.getTile(5, 4).isWalkable(zombie));
    console.log(`Is edge blocked from (4,5) to (5,5):`, Pathfinding.isEdgeBlocked(gameMap, 4, 5, 5, 5, zombie));
    console.log(`Is edge blocked from (5,5) to (5,4):`, Pathfinding.isEdgeBlocked(gameMap, 5, 5, 5, 4, zombie));
    console.log(`Can move diagonally from (4,5) to (5,4):`, Pathfinding.canMoveDiagonally(gameMap, 4, 5, 5, 4, zombie));

    // Run A* path from (4,5) to (5,4)
    const path = Pathfinding.findPath(gameMap, 4, 5, 5, 4, {
        allowDiagonal: true,
        isZombie: true,
        entity: zombie,
        maxDistance: 60,
        isPathfinding: true
    });
    console.log("Path found:", path);

    // Enable debug logging on ZombieAI and run turn
    ZombieAI.DEBUG = true;
    console.log("\nExecuting Zombie Turn...");
    const result = ZombieAI.executeZombieTurn(zombie, gameMap, player, [], new Set());
    console.log("Turn Result Actions:", JSON.stringify(result.actions, null, 2));
    console.log(`Final Zombie Position: (${zombie.logicalX}, ${zombie.logicalY})`);
}

runTest().catch(console.error);
