import { GameMap } from '../client/src/game/map/GameMap.js';
import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { Window } from '../client/src/game/entities/Window.js';
import { ZombieAI } from '../client/src/game/ai/ZombieAI.js';
import { Pathfinding } from '../client/src/game/utils/Pathfinding.js';
import { LineOfSight } from '../client/src/game/utils/LineOfSight.js';

async function testWindowSide() {
    console.log("--- Testing Zombie Window Side Breaching ---");
    const gameMap = new GameMap(20, 20);
    for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 20; x++) {
            gameMap.setTerrain(x, y, 'floor');
        }
    }

    // Player inside the room at (9, 10)
    const player = EntityFactory.createPlayer(9, 10);
    gameMap.addEntity(player, 9, 10);

    // Zombie at (10, 11)
    const zombie = EntityFactory.createZombie(10, 11, 'basic', 'zombie-1');
    zombie.currentAP = 10;
    gameMap.addEntity(zombie, 10, 11);

    // Set walls between y=10 and y=11
    for (let x = 0; x < 20; x++) {
        gameMap.getTile(x, 10).edgeWalls.s = true;
        gameMap.getTile(x, 11).edgeWalls.n = true;
    }

    // A closed window is on the edge between (10, 10) and (10, 11)
    const window = new Window('window-10-10', 10, 10, false, false, false, 's');
    window.hp = 5;
    gameMap.addEntity(window, 10, 10);

    // Setup zombie's target memory
    zombie.currentTarget = { id: player.id, type: 'player' };
    zombie.setTargetSighted(9, 10); 

    const los = LineOfSight.hasLineOfSight(gameMap, zombie.logicalX, zombie.logicalY, player.logicalX, player.logicalY);
    console.log(`LOS from Zombie to Player:`, los);

    console.log("Walkability check of (10,10):", gameMap.getTile(10,10).isWalkable(zombie));

    // Run 1 turn
    ZombieAI.DEBUG = true;
    const result = ZombieAI.executeZombieTurn(zombie, gameMap, player, [], new Set());
    console.log("Turn actions:", JSON.stringify(result.actions, null, 2));
    console.log(`Final Zombie Pos: (${zombie.logicalX}, ${zombie.logicalY}), AP remaining: ${zombie.currentAP}`);
}

testWindowSide().catch(console.error);
