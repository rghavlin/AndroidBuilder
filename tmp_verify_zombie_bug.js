import { GameMap } from './client/src/game/map/GameMap.js';
import { Zombie } from './client/src/game/entities/Zombie.js';
import { ZombieAI } from './client/src/game/ai/ZombieAI.js';

console.log('--- Zombie AI Debug Script ---');

const map = new GameMap(40, 40);
for (let x = 0; x < 40; x++) {
    for (let y = 0; y < 40; y++) {
        map.setTerrain(x, y, 'floor');
    }
}

// Player at (22, 20)
const player = { id: 'player', logicalX: 22, logicalY: 20, x: 22, y: 20, type: 'player' };
map.addEntity(player, 22, 20);

// Zombie inside building at (19, 20)
const zombie = new Zombie('zombie-inside', 19, 17, 'basic');
map.addEntity(zombie, 19, 17); // Set zombie at (19, 17) like the image

// Let's build a building structure
// Tiles from x=15 to 20, y=15 to 22 are floor with appropriate edge walls
for (let y = 15; y <= 22; y++) {
    for (let x = 15; x <= 20; x++) {
        const tile = map.getTile(x, y);
        // North wall
        if (y === 15) tile.edgeWalls.n = true;
        // South wall
        if (y === 22) tile.edgeWalls.s = true;
        // West wall
        if (x === 15) tile.edgeWalls.w = true;
        // East wall
        if (x === 20) tile.edgeWalls.e = true;
    }
}

// Adjust adjacent tiles to have matching edge walls (since double-sided check)
for (let y = 15; y <= 22; y++) {
    map.getTile(14, y).edgeWalls.e = true;
    map.getTile(21, y).edgeWalls.w = true;
}
for (let x = 15; x <= 20; x++) {
    map.getTile(x, 14).edgeWalls.s = true;
    map.getTile(x, 23).edgeWalls.n = true;
}

// Put a window on the east wall at (20, 20)
const windowEntity = {
    id: 'window-1',
    type: 'window',
    edge: 'e',
    x: 20,
    y: 20,
    logicalX: 20,
    logicalY: 20,
    isOpen: false,
    isBroken: false,
    isReinforced: false,
    blocksMovement: true,
    takeDamage: function(dmg) {
        console.log(`Window took ${dmg} damage!`);
        this.isBroken = true;
        return { isBroken: true };
    }
};
map.getTile(20, 20).contents.push(windowEntity);

// Check if zombie can see player (Blocked case)
const canSeeBlocked = zombie.canSeeEntity(map, player);
console.log(`[TEST 1: Blocked] Zombie at (${zombie.logicalX}, ${zombie.logicalY}) can see player at (${player.logicalX}, ${player.logicalY}):`, canSeeBlocked);

ZombieAI.DEBUG = true;
const resultBlocked = ZombieAI.executeZombieTurn(zombie, map, player, [], new Set());
console.log('[TEST 1: Blocked] Result actions:', JSON.stringify(resultBlocked.actions, null, 2));
console.log(`[TEST 1: Blocked] Final zombie pos: (${zombie.logicalX}, ${zombie.logicalY}), AP: ${zombie.currentAP}`);

console.log('\n--- TEST 2: Sight through Window and Breaching ---');
// Move zombie to (19, 20) - directly facing the window at (20, 20)
map.removeEntity(zombie.id);
zombie.logicalX = 19; zombie.logicalY = 20;
zombie.x = 19; zombie.y = 20;
zombie.gridX = 19; zombie.gridY = 20;
zombie.hp = zombie.maxHp;
zombie.currentAP = zombie.maxAP;
zombie.lastSeen = false;
zombie.heardNoise = false;
zombie.behaviorState = 'idle';
map.addEntity(zombie, 19, 20);

// Reset window to unbroken
windowEntity.isBroken = false;
windowEntity.isOpen = false;

const canSeeWindow = zombie.canSeeEntity(map, player);
console.log(`[TEST 2: Window] Zombie at (${zombie.logicalX}, ${zombie.logicalY}) can see player at (${player.logicalX}, ${player.logicalY}):`, canSeeWindow);

const resultWindow = ZombieAI.executeZombieTurn(zombie, map, player, [], new Set());
console.log('[TEST 2: Window] Result actions:', JSON.stringify(resultWindow.actions, null, 2));
console.log(`[TEST 2: Window] Final zombie pos: (${zombie.logicalX}, ${zombie.logicalY}), AP: ${zombie.currentAP}`);

