import { describe, it, expect, beforeEach } from 'vitest';
import { GameMap } from '../../client/src/game/map/GameMap.js';
import { EntityFactory } from '../../client/src/game/EntityFactory.js';
import { NPCAISystem } from '../../client/src/game/systems/NPCAISystem.js';
import { applyNpcAIMode } from '../../client/src/game/quest/EventRunner.js';

// Attack-on-sight hostiles (AIState.attackOnSight, authored per NPC in the map
// editor) skip the extortion DEMAND that ordinary hostiles open with, and never
// flee or escape — they hunt the player and fight to the death.

function makeMap(w = 9, h = 9) {
  const gameMap = new GameMap(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) gameMap.getTile(x, y).terrain = 'grass';
  }
  return gameMap;
}

function place(gameMap, entity, x, y) {
  gameMap.addEntity(entity, x, y);
  return entity;
}

/** Run one AI cycle and return the actions/intents it produced. */
function runCycle(gameMap, entities) {
  const actionQueue = [];
  NPCAISystem.process(entities, null, { gameMap }, actionQueue, null, {});
  return actionQueue;
}

/** Pretend VisionSystem already ran and the NPC has eyes on the player. */
function sees(npc, player) {
  npc.getComponent('Vision').visibleEntities = [player.id];
}

describe('NPC attack-on-sight', () => {
  let gameMap, player;

  beforeEach(() => {
    gameMap = makeMap();
    player = place(gameMap, EntityFactory.createPlayer(4, 4), 4, 4);
  });

  it('attacks immediately instead of demanding loot when adjacent', () => {
    const npc = place(gameMap, EntityFactory.createNPC(4, 5, 'bandits', 'survivor'), 4, 5);
    npc.attackOnSight = true;
    sees(npc, player);

    const actions = runCycle(gameMap, [player, npc]);

    expect(actions.some(a => a.type === 'DEMAND')).toBe(false);
    const attack = actions.find(a => a.type === 'ATTACK');
    expect(attack).toBeDefined();
    expect(attack.data.targetId).toBe(player.id);
    expect(npc.hasDemanded).toBe(false);
  });

  it('still demands first when only the ordinary hostile flag is set', () => {
    const npc = place(gameMap, EntityFactory.createNPC(4, 5, 'bandits', 'survivor'), 4, 5);
    sees(npc, player);

    const actions = runCycle(gameMap, [player, npc]);

    expect(actions.some(a => a.type === 'DEMAND')).toBe(true);
    expect(actions.some(a => a.type === 'ATTACK')).toBe(false);
  });

  it('closes on a visible player rather than travelling to the map exit', () => {
    const npc = place(gameMap, EntityFactory.createNPC(4, 0, 'bandits', 'survivor'), 4, 0);
    npc.attackOnSight = true;
    sees(npc, player);

    runCycle(gameMap, [player, npc]);

    const move = npc.getComponent('MoveIntent');
    expect(move).toBeDefined();
    // Closing the distance means moving south toward the player at (4,4).
    expect(move.dy).toBe(1);
    expect(npc.behaviorState).toBe('hunting');
  });

  it('pursues the last known position after losing line of sight', () => {
    const npc = place(gameMap, EntityFactory.createNPC(4, 0, 'bandits', 'survivor'), 4, 0);
    npc.attackOnSight = true;
    npc.lastSeen = true;
    npc.targetSightedCoords = { x: 4, y: 4 };
    npc.getComponent('Vision').visibleEntities = []; // blind this cycle

    runCycle(gameMap, [player, npc]);

    const move = npc.getComponent('MoveIntent');
    expect(move).toBeDefined();
    expect(move.dy).toBe(1);
  });

  it('fights an adjacent zombie instead of fleeing it', () => {
    const npc = place(gameMap, EntityFactory.createNPC(1, 1, 'bandits', 'survivor'), 1, 1);
    npc.attackOnSight = true;
    npc.getComponent('Vision').visibleEntities = []; // player not in sight
    const zombie = place(gameMap, EntityFactory.createZombie(1, 2, 'standard'), 1, 2);

    const actions = runCycle(gameMap, [player, npc, zombie]);

    const attack = actions.find(a => a.type === 'ATTACK');
    expect(attack).toBeDefined();
    expect(attack.data.targetId).toBe(zombie.id);
    expect(npc.behaviorState).not.toBe('fleeing');
  });

  it('round-trips attackOnSight through entity serialization', () => {
    const npc = EntityFactory.createNPC(2, 2, 'bandits', 'survivor');
    npc.attackOnSight = true;

    const json = JSON.parse(JSON.stringify(npc.toJSON()));
    expect(json.components.AIState.attackOnSight).toBe(true);
  });
});

describe('setNpcAI step / applyNpcAIMode', () => {
  const npc = () => EntityFactory.createNPC(1, 1, 'independent', 'survivor');

  it('attackOnSight mode enables AI, sets the flag and implies hostility', () => {
    const e = npc();
    e.aiDisabled = true;

    expect(applyNpcAIMode(e, { aiMode: 'attackOnSight' })).toBe('attackOnSight');
    expect(e.aiDisabled).toBe(false);
    expect(e.attackOnSight).toBe(true);
    expect(e.isHostile).toBe(true);
  });

  it('normal mode clears attackOnSight but leaves hostility intact', () => {
    const e = EntityFactory.createNPC(1, 1, 'bandits', 'survivor');
    e.attackOnSight = true;

    applyNpcAIMode(e, { aiMode: 'normal' });
    expect(e.attackOnSight).toBe(false);
    expect(e.aiDisabled).toBe(false);
    // De-escalates to demand-first extortion rather than turning friendly.
    expect(e.isHostile).toBe(true);
  });

  it('disabled mode parks the NPC without touching its hostility', () => {
    const e = EntityFactory.createNPC(1, 1, 'bandits', 'survivor');

    applyNpcAIMode(e, { aiMode: 'disabled' });
    expect(e.aiDisabled).toBe(true);
    expect(e.isHostile).toBe(true);
  });

  it('falls back to the legacy `enabled` boolean when aiMode is absent', () => {
    const on = npc();
    expect(applyNpcAIMode(on, { enabled: true })).toBe('normal');
    expect(on.aiDisabled).toBe(false);

    const off = npc();
    expect(applyNpcAIMode(off, { enabled: false })).toBe('disabled');
    expect(off.aiDisabled).toBe(true);
  });
});
