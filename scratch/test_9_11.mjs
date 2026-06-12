import { GameMap } from '../client/src/game/map/GameMap.js';
import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { Window } from '../client/src/game/entities/Window.js';
import { ZombieAI } from '../client/src/game/ai/ZombieAI.js';

async function test911() {
    console.log("--- Testing Zombie at (9, 11) ---");
    const gameMap = new GameMap(20, 20);
    for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 20; x++) {
            gameMap.setTerrain(x, y, 'floor');
        }
    }

    const player = EntityFactory.createPlayer(9, 10);
    gameMap.addEntity(player, 9, 10);

    const zombie = EntityFactory.createZombie(9, 11, 'basic', 'zombie-9-11');
    zombie.currentAP = 10;
    gameMap.addEntity(zombie, 9, 11);

    for (let x = 0; x < 20; x++) {
        gameMap.getTile(x, 10).edgeWalls.s = true;
        gameMap.getTile(x, 11).edgeWalls.n = true;
    }

    const window = new Window(`window-10-10`, 10, 10, false, false, false, 's');
    window.hp = 5;
    gameMap.addEntity(window, 10, 10);

    zombie.currentTarget = { id: player.id, type: 'player' };
    zombie.setTargetSighted(9, 10);

    ZombieAI.DEBUG = false;
    const result = ZombieAI.executeZombieTurn(zombie, gameMap, player, [], new Set());
    console.log(`Final position: (${zombie.logicalX}, ${zombie.logicalY}), AP: ${zombie.currentAP}`);
    console.log(`Window isBroken: ${window.isBroken}`);
    console.log(`Actions performed:`);
    result.actions.forEach((a, idx) => {
        console.log(`  Step ${idx + 1}: Type=${a.type}, Success=${a.data.success}, From=(${a.data.from.x}, ${a.data.from.y}), To=(${a.data.to.x}, ${a.data.to.y})`);
    });
}

test911().catch(console.error);
