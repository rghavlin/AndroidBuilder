import { Entity } from './client/src/game/entities/Entity.js';
import { AIState } from './client/src/game/components/AIState.js';
import { PlayerSkills } from './client/src/game/components/PlayerSkills.js';
import { EntityFactory } from './client/src/game/EntityFactory.js';
import { Rabbit } from './client/src/game/entities/Rabbit.js';

let allPassed = true;

function assert(condition, message) {
  if (!condition) {
    console.error('❌ FAIL:', message);
    allPassed = false;
  } else {
    console.log('✅ PASS:', message);
  }
}

console.log('--- Phase 2 Verification ---');

// 1. Facades delegate to AIState
const ent = new Entity('e1', 'zombie');
ent.behaviorState = 'pursuing';
assert(ent.behaviorState === 'pursuing', 'Entity behaviorState setter updates AIState behaviorState');
const aiComp = ent.getComponent('AIState');
assert(aiComp !== undefined, 'AIState component is implicitly added when setting facade');
assert(aiComp.behaviorState === 'pursuing', 'AIState component has correct behaviorState');

// 2. EntityFactory and Rabbit add AIState explicitly
const zombie = EntityFactory.createZombie(0, 0);
assert(zombie.getComponent('AIState') !== undefined, 'EntityFactory creates zombies with AIState');
const npc = EntityFactory.createNPC(0, 0);
assert(npc.getComponent('AIState') !== undefined, 'EntityFactory creates NPCs with AIState');
const rabbit = new Rabbit('r1', 0, 0);
assert(rabbit.getComponent('AIState') !== undefined, 'Rabbit constructor adds AIState');

// 3. Skill progression
const player = EntityFactory.createPlayer(0, 0);
const startCraftingLvl = player.craftingLvl;
player.craftingApUsed = 9; // getNextCraftingTarget for lvl 0 is 10
player.onItemCrafted(2); // adds 2, total 11
assert(player.craftingLvl === startCraftingLvl + 1, 'Player crafting level increased from progression formula');

// 4. toJSON / fromJSON with Components
zombie.behaviorState = 'wandering';
const json = zombie.toJSON();
assert(json.behaviorState === undefined, 'toJSON does not explicitly serialize AI properties');
assert(json.components && json.components['AIState'], 'toJSON serializes AIState within components map');
assert(json.components['AIState'].behaviorState === 'wandering', 'toJSON AIState is serialized correctly');
assert(json.components['Position'].x !== undefined, 'toJSON serializes other components correctly with toJSON() method');

const restored = Entity.fromJSON(json);
assert(restored.behaviorState === 'wandering', 'fromJSON correctly restores AIState facade properties');

if (allPassed) {
  console.log('\nAll Phase 2 verifications passed! 🎉');
} else {
  console.log('\nSome verifications failed. Check errors above.');
}
