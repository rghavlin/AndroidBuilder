
import { GameMap } from '../client/src/game/map/GameMap.js';
import { Zombie } from '../client/src/game/entities/Zombie.js';
import { EntityType } from '../client/src/game/entities/Entity.js';
import { ZombieAI } from '../client/src/game/ai/ZombieAI.js';
import { Pathfinding } from '../client/src/game/utils/Pathfinding.js';

async function runTest() {
    console.log("Starting reproduction of zombie oscillation with walls...");
    
    const map = new GameMap(10, 10);
    
    // Building wall at x=1
    for (let y = 0; y < 10; y++) {
        if (y === 3) continue; // Gap in wall? No, make it solid.
        map.setTerrain(1, y, 'wall');
    }
    
    // Player at (2, 2) - inside building? No, if x=1 is wall, x=2 is inside.
    const player = { id: 'player', type: EntityType.PLAYER, x: 2, y: 2 };
    map.addEntity(player, 2, 2);
    
    // Zombie wall around player
    // South: (2, 3)
    const wall1 = new Zombie('wall1', 2, 3);
    map.addEntity(wall1, 2, 3);
    
    // Circled Zombie at (3, 3) - outside building?
    // If x=1 is wall, player at (2,2) is against the wall.
    // (2,3) is occupied.
    // (3,3) is open.
    const zombie = new Zombie('zombie', 3, 3);
    zombie.currentAP = 10;
    map.addEntity(zombie, 3, 3);
    
    console.log("Initial state: Player at (2,2), Zombie at (3,3). Wall at (2,3).");
    
    // Execute turn
    const result = ZombieAI.executeZombieTurn(zombie, map, player, []);
    
    console.log("\nTurn Actions:");
    result.actions.forEach((a, i) => {
        if (a.type === 'move' || a.type === 'wander') {
            console.log(`Action ${i}: ${a.type} from (${a.from.x}, ${a.from.y}) to (${a.to.x}, ${a.to.y})`);
        } else {
            console.log(`Action ${i}: ${a.type}`);
        }
    });

    const finalPos = { x: zombie.x, y: zombie.y };
    console.log(`\nFinal Position: (${finalPos.x}, ${finalPos.y})`);
}

runTest().catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});
