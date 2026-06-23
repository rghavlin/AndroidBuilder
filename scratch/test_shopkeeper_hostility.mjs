import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { GameMap } from '../client/src/game/map/GameMap.js';
import { NPCSpawner } from '../client/src/game/utils/NPCSpawner.js';
import { escalateFactionAgainstPlayer } from '../client/src/game/ai/TurretCombat.js';

let allPassed = true;
function assert(condition, message) {
  if (!condition) {
    console.error('❌ FAIL:', message);
    allPassed = false;
  } else {
    console.log('✅ PASS:', message);
  }
}

console.log('--- Shopkeeper Hostility Verification ---');

// 1. Initialize Map
const map = new GameMap(20, 20);
// Mock townSquareCompound metadata so NPCSpawner.spawnShopkeeper doesn't abort
map.metadata = {
  townSquareCompound: {
    fenceBounds: {
      y2: 10
    }
  }
};

// 2. Spawn player and shopkeeper
const player = EntityFactory.createPlayer(5, 5);
const shopkeeper = NPCSpawner.spawnShopkeeper(map);

assert(shopkeeper !== null, 'Shopkeeper is successfully spawned');
assert(shopkeeper.getFaction() === 'town', 'Shopkeeper faction is town');
assert(shopkeeper.isHostileTo(player) === false, 'Shopkeeper is initially friendly/neutral to player');

// 3. Trigger escalation
const escalated = escalateFactionAgainstPlayer(map, 'town');
console.log(`Escalated town faction, escalated turrets count: ${escalated}`);

// 4. Assert that the shopkeeper has become hostile
assert(shopkeeper.hostileOverrides.has('player') === true, 'Shopkeeper hostileOverrides contains player');
assert(shopkeeper.isHostileTo(player) === true, 'Shopkeeper isHostileTo(player) returns true after escalation');

if (allPassed) {
  console.log('\nAll shopkeeper hostility tests passed! 🎉');
} else {
  console.log('\nSome tests failed. Check errors above.');
}
