import { describe, it, expect } from 'vitest';
// Ported from verify_phase_2.mjs — ECS facade delegation to AIState, factory
// wiring, skill progression, and component-aware (de)serialization.
import { Entity } from '../../client/src/game/entities/Entity.js';
import { EntityFactory } from '../../client/src/game/EntityFactory.js';
import { Rabbit } from '../../client/src/game/entities/Rabbit.js';

// Preserve the original assert(cond, msg) semantics under Vitest.
const assert = (condition, message) => expect(condition, message).toBeTruthy();

describe('ECS / AIState facade + component serialization', () => {
  it('delegates behaviorState facade to an implicit AIState component', () => {
    const ent = new Entity('e1', 'zombie');
    ent.behaviorState = 'pursuing';
    assert(ent.behaviorState === 'pursuing', 'Entity behaviorState setter updates AIState');
    const aiComp = ent.getComponent('AIState');
    assert(aiComp !== undefined, 'AIState added implicitly when setting facade');
    assert(aiComp.behaviorState === 'pursuing', 'AIState component has correct behaviorState');
  });

  it('creates AIState explicitly on factory zombies/NPCs and Rabbits', () => {
    assert(EntityFactory.createZombie(0, 0).getComponent('AIState') !== undefined, 'zombie has AIState');
    assert(EntityFactory.createNPC(0, 0).getComponent('AIState') !== undefined, 'NPC has AIState');
    assert(new Rabbit('r1', 0, 0).getComponent('AIState') !== undefined, 'Rabbit has AIState');
  });

  it('advances crafting level via the progression formula', () => {
    const player = EntityFactory.createPlayer(0, 0);
    const startCraftingLvl = player.craftingLvl;
    player.craftingApUsed = 9; // next target for lvl 0 is 10
    player.onItemCrafted(2); // total 11 -> level up
    assert(player.craftingLvl === startCraftingLvl + 1, 'crafting level increased');
  });

  it('serializes/restores AI facade state through the components map', () => {
    const zombie = EntityFactory.createZombie(0, 0);
    zombie.behaviorState = 'wandering';
    const json = zombie.toJSON();
    assert(json.behaviorState === undefined, 'toJSON does not flatten AI facade props');
    assert(json.components && json.components['AIState'], 'AIState serialized within components');
    assert(json.components['AIState'].behaviorState === 'wandering', 'AIState serialized correctly');
    assert(json.components['Position'].x !== undefined, 'other components serialize via toJSON()');

    const restored = Entity.fromJSON(json);
    assert(restored.behaviorState === 'wandering', 'fromJSON restores AIState facade');
  });
});
