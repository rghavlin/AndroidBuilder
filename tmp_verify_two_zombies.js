import { GameMap } from './client/src/game/map/GameMap.js';
import { Zombie } from './client/src/game/entities/Zombie.js';
import { ZombieAI } from './client/src/game/ai/ZombieAI.js';

console.log('--- Zombie AI Multi-zombie Debug Script ---');

const map = new GameMap(40, 40);
for (let x = 0; x < 40; x++) {
    for (let y = 0; y < 40; y++) {
        map.setTerrain(x, y, 'floor');
    }
}

// Set grass outside building (columns 0 to 7)
for (let x = 0; x <= 7; x++) {
    for (let y = 0; y < 40; y++) {
        map.setTerrain(x, y, 'grass');
    }
}

// Player at (7, 10)
const player = { id: 'player', logicalX: 7, logicalY: 10, x: 7, y: 10, type: 'player' };
map.addEntity(player, 7, 10);

// Basic Zombie at (9, 10)
const zombieBasic = new Zombie('zombie-basic', 9, 10, 'basic');
map.addEntity(zombieBasic, 9, 10);

// Mutant Zombie at (9, 9)
const zombieMutant = new Zombie('zombie-mutant', 9, 9, 'mutant');
map.addEntity(zombieMutant, 9, 9);

// Add building edge walls (column 8 has west edge walls)
for (let y = 5; y <= 15; y++) {
    map.getTile(8, y).edgeWalls.w = true;
    map.getTile(7, y).edgeWalls.e = true;
}

// Add a window on the west edge of tile (8, 10)
const windowEntity = {
    id: 'window-1',
    type: 'window',
    edge: 'w',
    x: 8,
    y: 10,
    logicalX: 8,
    logicalY: 10,
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
map.getTile(8, 10).contents.push(windowEntity);

ZombieAI.DEBUG = true;

console.log('\n=== TURN 1: Basic Zombie Turn ===');
const basicResult = ZombieAI.executeZombieTurn(zombieBasic, map, player, [], new Set());
console.log('Basic actions:', JSON.stringify(basicResult.actions, null, 2));

console.log('\n=== TURN 1: Mutant Zombie Turn ===');
const mutantResult = ZombieAI.executeZombieTurn(zombieMutant, map, player, [], new Set());
console.log('Mutant actions:', JSON.stringify(mutantResult.actions, null, 2));

console.log(`\nFinal state:`);
console.log(`Basic Zombie pos: (${zombieBasic.logicalX}, ${zombieBasic.logicalY})`);
console.log(`Mutant Zombie pos: (${zombieMutant.logicalX}, ${zombieMutant.logicalY})`);
console.log(`Window is broken: ${windowEntity.isBroken}`);
