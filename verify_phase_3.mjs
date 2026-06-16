import { EntityFactory } from './client/src/game/EntityFactory.js';
import { Rabbit } from './client/src/game/entities/Rabbit.js';
import { FireSystem } from './client/src/game/systems/FireSystem.js';
import { GameMap } from './client/src/game/map/GameMap.js';

let allPassed = true;
function assert(condition, message) {
  if (!condition) {
    console.error('❌ FAIL:', message);
    allPassed = false;
  } else {
    console.log('✅ PASS:', message);
  }
}

console.log('--- Phase 3 Verification ---');

// 1. Check Burnable components
const player = EntityFactory.createPlayer(0, 0);
assert(player.getComponent('Burnable') !== undefined, 'Player has Burnable component');
const zombie = EntityFactory.createZombie(0, 0, 'firefighter');
assert(zombie.getComponent('Burnable').fireResistance === 2, 'Firefighter zombie has fire resistance');
const rabbit = new Rabbit('r1', 0, 0);
assert(rabbit.getComponent('Burnable') !== undefined, 'Rabbit has Burnable component');

// 2. FireSystem.ignite
const mockTile = { x: 0, y: 0, fireTurns: 0 };
FireSystem.ignite(mockTile, 3);
assert(mockTile.fireTurns === 3, 'FireSystem ignites tiles correctly');

FireSystem.ignite(player, 2);
assert(player.fireTurns === 2, 'FireSystem ignites entities via Burnable facade');

// 3. processEntityFires
const initialHp = player.hp;
const map = new GameMap(10, 10);
map.entityMap.set(player.id, player);
FireSystem.processEntityFires(map);
assert(player.fireTurns === 1, 'processEntityFires decrements fireTurns');
assert(player.hp < initialHp, 'processEntityFires applies fire damage');

// 4. checkTileIgnition
mockTile.fireTurns = 2;
map.tiles = [mockTile];
map.width = 1;
map.height = 1;
map.getTile = () => mockTile;

const npc = EntityFactory.createNPC(0, 0);
npc.fireTurns = 0;
const npcInitialHp = npc.hp;
FireSystem.checkTileIgnition(npc, map);
assert(npc.fireTurns === 2, 'checkTileIgnition sets entity on fire when stepping on fire tile');
assert(npc.hp < npcInitialHp, 'checkTileIgnition deals immediate damage');

if (allPassed) {
  console.log('\\nAll Phase 3 verifications passed! 🎉');
} else {
  console.log('\\nSome verifications failed. Check errors above.');
}
