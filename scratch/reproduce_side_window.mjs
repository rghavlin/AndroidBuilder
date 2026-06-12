import { GameMap } from '../client/src/game/map/GameMap.js';
import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { Window } from '../client/src/game/entities/Window.js';
import { ZombieAI } from '../client/src/game/ai/ZombieAI.js';
import { Pathfinding } from '../client/src/game/utils/Pathfinding.js';

async function testWindowOscillations() {
    console.log("--- Testing All Relative Positions for Window Breaching ---");
    
    const zombiePositions = [
        { x: 10, y: 11, desc: "Directly in front of window (10, 11)" },
        { x: 9, y: 11, desc: "To the left/side of window (9, 11) - directly opposite player" },
        { x: 8, y: 11, desc: "Further left (8, 11)" },
        { x: 11, y: 11, desc: "To the right/side of window (11, 11)" },
        { x: 9, y: 12, desc: "2 tiles back, left of window (9, 12)" },
        { x: 10, y: 12, desc: "2 tiles back, in front of window (10, 12)" },
        { x: 11, y: 12, desc: "2 tiles back, right of window (11, 12)" }
    ];

    ZombieAI.DEBUG = false; // Disable noisy logs
    
    for (const pos of zombiePositions) {
        const gameMap = new GameMap(20, 20);
        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 20; x++) {
                gameMap.setTerrain(x, y, 'floor');
            }
        }

        const player = EntityFactory.createPlayer(9, 10);
        gameMap.addEntity(player, 9, 10);

        const zombie = EntityFactory.createZombie(pos.x, pos.y, 'basic', `zombie-${pos.x}-${pos.y}`);
        zombie.currentAP = 10;
        gameMap.addEntity(zombie, pos.x, pos.y);

        for (let x = 0; x < 20; x++) {
            gameMap.getTile(x, 10).edgeWalls.s = true;
            gameMap.getTile(x, 11).edgeWalls.n = true;
        }

        const window = new Window(`window-10-10`, 10, 10, false, false, false, 's');
        window.hp = 5;
        gameMap.addEntity(window, 10, 10);

        zombie.currentTarget = { id: player.id, type: 'player' };
        zombie.setTargetSighted(9, 10);

        const result = ZombieAI.executeZombieTurn(zombie, gameMap, player, [], new Set());
        console.log(`\nTEST: Zombie at (${pos.x}, ${pos.y}) - ${pos.desc}`);
        console.log(`Final position: (${zombie.logicalX}, ${zombie.logicalY}), AP: ${zombie.currentAP}`);
        console.log(`Window isBroken: ${window.isBroken}`);
        console.log(`Actions performed:`);
        result.actions.forEach((a, idx) => {
            console.log(`  Step ${idx + 1}: Type=${a.type}, Success=${a.data.success}, From=(${a.data.from.x}, ${a.data.from.y}), To=(${a.data.to.x}, ${a.data.to.y})`);
        });
    }
}

testWindowOscillations().catch(console.error);
