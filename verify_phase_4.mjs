import { EntityFactory } from './client/src/game/EntityFactory.js';
import { Rabbit } from './client/src/game/entities/Rabbit.js';
import { SimulationManager } from './client/src/game/managers/SimulationManager.js';
import { GameMap } from './client/src/game/map/GameMap.js';
import { DestructionSystem } from './client/src/game/systems/DestructionSystem.js';
import { DestroyIntent } from './client/src/game/components/DestroyIntent.js';
import { ExplosionSystem } from './client/src/game/systems/ExplosionSystem.js';
import { IntentQueue } from './client/src/game/managers/IntentQueue.js';
import { Item } from './client/src/game/inventory/Item.js';
import { createItemFromDef } from './client/src/game/inventory/ItemDefs.js';
import engine from './client/src/game/GameEngine.js';

let allPassed = true;
function assert(condition, message) {
  if (!condition) {
    console.error('❌ FAIL:', message);
    allPassed = false;
  } else {
    console.log('✅ PASS:', message);
  }
}

console.log('--- Phase 4 Verification ---');

// Mock Loot Generator for testing zombie loot drops
engine.lootGenerator = {
  generateZombieLoot: (subtype, mapNumber) => {
    return [{ defId: 'ammo.bullet_9mm', count: 5 }];
  }
};

// Mock Math.random to make the 75% random check always succeed
const originalRandom = Math.random;
Math.random = () => 0.1;

const map = new GameMap(10, 10);

// --- 1. Test Zombie Death Loot Drop & Targeting Clearance ---
const player = EntityFactory.createPlayer(1, 1);
const zombie = EntityFactory.createZombie(2, 2, 'standard');
const activeZombie = EntityFactory.createZombie(3, 3, 'standard');

// Set targeting reference
activeZombie.currentTarget = zombie;
activeZombie.behaviorState = 'pursuing';

map.entityMap.set(player.id, player);
map.entityMap.set(zombie.id, zombie);
map.entityMap.set(activeZombie.id, activeZombie);

// Set zombie HP to 0
zombie.hp = 0;

const ecsEntities = [player, zombie, activeZombie];
const intentQueue = new IntentQueue();
const actionQueue = [];

// Run checkAndProcessDeaths
const diedAny = SimulationManager.checkAndProcessDeaths(map, ecsEntities, intentQueue, actionQueue, player);
assert(diedAny === true, 'SimulationManager.checkAndProcessDeaths returns true when a zombie dies');
assert(!map.getEntity(zombie.id), 'Zombie is removed from the map on death');

// Check targeting clearance
assert(activeZombie.currentTarget === null, 'Dead zombie reference is cleared from surviving zombie targets');
assert(activeZombie.behaviorState === 'idle', 'Surviving zombie behavior state reverts to idle');

// Check loot drop on tile (2, 2)
const tile22 = map.getTile(2, 2);
assert(tile22.inventoryItems && tile22.inventoryItems.some(i => i.defId === 'ammo.bullet_9mm'), 'Zombie drops loot on the tile where it died');


// --- 2. Test NPC Death drops inventory contents ---
const npc = EntityFactory.createNPC(4, 4);
const itemDef = createItemFromDef('weapon.9mmPistol');
assert(itemDef !== null, 'Found definition for weapon.9mmPistol');
const item = new Item(itemDef);
npc.inventory.addItem(item);
npc.hp = 0;

map.entityMap.set(npc.id, npc);

const npcDiedAny = SimulationManager.checkAndProcessDeaths(map, [player, npc], intentQueue, actionQueue, player);
assert(npcDiedAny === true, 'NPC death is processed');
assert(!map.getEntity(npc.id), 'NPC is removed from map');

const tile44 = map.getTile(4, 4);
assert(tile44.inventoryItems && tile44.inventoryItems.some(i => i.defId === 'weapon.9mmPistol'), 'NPC drops its inventory items on death');
assert(npc.inventory.getAllItems().length === 0, 'NPC inventory is cleared after dropping');


// --- 3. Test Rabbit drops raw meat ---
const rabbit = new Rabbit('rabbit1', 5, 5);
rabbit.hp = 0;
map.entityMap.set(rabbit.id, rabbit);

const rabbitDied = SimulationManager.checkAndProcessDeaths(map, [player, rabbit], intentQueue, actionQueue, player);
assert(rabbitDied === true, 'Rabbit death is processed');
assert(!map.getEntity(rabbit.id), 'Rabbit is removed from map');

const tile55 = map.getTile(5, 5);
assert(tile55.inventoryItems && tile55.inventoryItems.some(i => i.defId === 'food.raw_meat'), 'Rabbit drops raw meat on death');


// --- 4. Test ExplosionSystem routing death to DestructionSystem ---
const rabbit2 = new Rabbit('rabbit2', 6, 6);
rabbit2.hp = 10;
map.entityMap.set(rabbit2.id, rabbit2);

// Resolve an explosion at (6, 6) that deals enough damage to kill the rabbit
const explosionIntent = {
  targetX: 6,
  targetY: 6,
  radius: 2,
  minDamage: 20,
  maxDamage: 30,
  isIncendiary: false,
  sourceEntityId: player.id
};

ExplosionSystem.resolve(explosionIntent, [player, rabbit2], map, intentQueue, actionQueue, engine);

assert(rabbit2.hp <= 0, 'Explosion deals damage to rabbit');
assert(!map.getEntity(rabbit2.id), 'Explosion killed rabbit and DestructionSystem removed it');
const tile66 = map.getTile(6, 6);
assert(tile66.inventoryItems && tile66.inventoryItems.some(i => i.defId === 'food.raw_meat'), 'Rabbit killed by explosion drops raw meat via DestructionSystem');

// Restore original Math.random
Math.random = originalRandom;

if (allPassed) {
  console.log('\nAll Phase 4 verifications passed! 🎉');
} else {
  console.log('\nSome verifications failed. Check errors above.');
}
