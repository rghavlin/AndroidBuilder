import { GameMap } from './client/src/game/map/GameMap.js';
import { Entity, EntityType } from './client/src/game/entities/Entity.js';
import { Door } from './client/src/game/entities/Door.js';
import { AISystem } from './client/src/game/systems/AISystem.js';
import { EntityFactory } from './client/src/game/EntityFactory.js';

console.log('--- Debug Clipping ---');

const map = new GameMap(10, 10);
for (let x = 0; x < 10; x++) {
    for (let y = 0; y < 10; y++) {
        map.setTerrain(x, y, 'floor');
    }
}
const player = new Entity('player', EntityType.PLAYER, 5, 2);
player.addComponent({ name: 'Position', x: 5, y: 2 });
map.addEntity(player, 5, 2);

// Add door at (5,4) East edge -> blocks (5,4) to (6,4)
const door = new Door('door1', 5, 4, false, false, false, 'e');
map.getTile(5, 4).addEntity(door);

// Zombie 1 attacking door from (6,4)
const z1 = EntityFactory.createZombie(6, 4, 'basic', 'z1');
map.addEntity(z1, 6, 4);

// Zombie 2 behind Zombie 1 at (7,4)
const z2 = EntityFactory.createZombie(7, 4, 'basic', 'z2');
map.addEntity(z2, 7, 4);

console.log('Targeting player at (5,2) through the door at (5,4) East');

const engineMock = { gameMap: map };
AISystem.process([z2, player], null, engineMock, []);

console.log('Zombie 2 intent from (7,4):', Array.from(z2.components.values()).map(c => c.name || c.constructor.name));

let moveIntent = z2.components.get('MoveIntent');
if (moveIntent) {
    const moved = map.moveEntity(z2.id, z2.logicalX + moveIntent.dx, z2.logicalY + moveIntent.dy, { snap: false });
    console.log('Zombie 2 moveEntity result:', moved);
}
console.log('Zombie 2 pos:', z2.logicalX, z2.logicalY);

// Reset z2 components
z2.components.delete('MoveIntent');
z2.components.delete('DamageIntent');
z2.currentAP = 1;

// Test diagonal move past door
z2.logicalX = 6; z2.logicalY = 5;
z2.x = 6; z2.y = 5;
z2.getComponent('Position').x = 6;
z2.getComponent('Position').y = 5;
map.getTile(7, 4).removeEntity(z2.id);
map.addEntity(z2, 6, 5);

AISystem.process([z2, player], null, engineMock, []);
console.log('Zombie 2 intent from (6,5):', Array.from(z2.components.values()).map(c => c.name || c.constructor.name));

moveIntent = z2.components.get('MoveIntent');
if (moveIntent) {
    const moved = map.moveEntity(z2.id, z2.logicalX + moveIntent.dx, z2.logicalY + moveIntent.dy, { snap: false });
    console.log('Zombie 2 (diag) moveEntity result:', moved);
}
console.log('Zombie 2 (diag) pos:', z2.logicalX, z2.logicalY);
