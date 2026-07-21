import { describe, it, expect } from 'vitest';
import { GameMap } from '../../client/src/game/map/GameMap.js';
import { EntityFactory } from '../../client/src/game/EntityFactory.js';
import { TemplateMapGenerator } from '../../client/src/game/map/TemplateMapGenerator.js';
import { NPCAISystem } from '../../client/src/game/systems/NPCAISystem.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';

// NPC loadouts are authored in the map editor: a list of items plus the index
// of the equipped weapon. The equipped weapon decides whether NPCAISystem
// shoots or closes to melee; the whole list is what the NPC drops on death.

function emptyTiles(width, height) {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({ terrain: 'grass' }))
  );
}

async function loadScenario(entities, width = 12, height = 12) {
  const tmg = new TemplateMapGenerator();
  const mapData = await tmg.generateFromScenario({
    name: 'loadout_test',
    width,
    height,
    tiles: emptyTiles(width, height),
    entities,
  });
  const gameMap = new GameMap(width, height);
  await tmg.applyToGameMap(gameMap, mapData);
  return gameMap;
}

const npcWith = (inventory, equippedIndex, extra = {}) => ({
  type: 'npc', x: 3, y: 3, typeId: 'survivor', name: 'Raider',
  inventory, equippedIndex, ...extra,
});

function findNpc(gameMap) {
  return Array.from(gameMap.entityMap.values()).find(e => e.type === 'npc');
}

describe('NPC loadout (map editor)', () => {
  it('gives the NPC its authored items and equips the chosen weapon', async () => {
    const gameMap = await loadScenario([
      npcWith([createItemFromDef('food.cannedsoup'), createItemFromDef('weapon.knife')], 1),
    ]);

    const npc = findNpc(gameMap);
    expect(npc).toBeDefined();
    expect(npc.inventory.items.size).toBe(2);

    const weapon = npc.getEquippedWeapon();
    expect(weapon).toBeDefined();
    expect(weapon.defId).toBe('weapon.knife');
  });

  it('leaves the NPC unarmed when equippedIndex is -1', async () => {
    const gameMap = await loadScenario([
      npcWith([createItemFromDef('weapon.knife')], -1),
    ]);

    const npc = findNpc(gameMap);
    expect(npc.inventory.items.size).toBe(1);
    expect(npc.getEquippedWeapon()).toBeNull();
  });

  it('an equipped gun makes the NPC shoot from range', async () => {
    const player = EntityFactory.createPlayer(3, 9);
    const gameMap = await loadScenario([
      npcWith([createItemFromDef('weapon.9mmPistol')], 0, { attackOnSight: true, isHostile: true }),
    ]);
    gameMap.addEntity(player, 3, 9);

    const npc = findNpc(gameMap);
    npc.getComponent('Vision').visibleEntities = [player.id];

    const actionQueue = [];
    NPCAISystem.process([player, npc], null, { gameMap }, actionQueue, null, {});

    const attack = actionQueue.find(a => a.type === 'ATTACK');
    expect(attack).toBeDefined();
    expect(attack.data.targetId).toBe(player.id);
    // Six tiles away: only a ranged weapon can reach.
    expect(npc.getDistanceTo(player.logicalX, player.logicalY)).toBeGreaterThan(1);
  });

  it('a melee-only NPC closes the distance instead of attacking from range', async () => {
    const player = EntityFactory.createPlayer(3, 9);
    const gameMap = await loadScenario([
      npcWith([createItemFromDef('weapon.knife')], 0, { attackOnSight: true, isHostile: true }),
    ]);
    gameMap.addEntity(player, 3, 9);

    const npc = findNpc(gameMap);
    npc.getComponent('Vision').visibleEntities = [player.id];

    const actionQueue = [];
    NPCAISystem.process([player, npc], null, { gameMap }, actionQueue, null, {});

    expect(actionQueue.find(a => a.type === 'ATTACK')).toBeUndefined();
    const move = npc.getComponent('MoveIntent');
    expect(move).toBeDefined();
    expect(move.dy).toBe(1); // stepping toward the player to the south
  });

  // The ATTACK action must say HOW it was made. AudioContext picks the gunshot
  // sample off weaponType/weaponId, and EntityRenderer suppresses the melee
  // lunge for ranged. Without these a shot played as a thrust with melee sounds.
  it('tags a ranged ATTACK with weaponType/weaponId and a muzzle flash', async () => {
    const player = EntityFactory.createPlayer(3, 9);
    const gameMap = await loadScenario([
      npcWith([createItemFromDef('weapon.9mmPistol')], 0, { attackOnSight: true, isHostile: true }),
    ]);
    gameMap.addEntity(player, 3, 9);

    const npc = findNpc(gameMap);
    npc.getComponent('Vision').visibleEntities = [player.id];

    const actionQueue = [];
    NPCAISystem.process([player, npc], null, { gameMap }, actionQueue, null, {});

    const attack = actionQueue.find(a => a.type === 'ATTACK');
    expect(attack.data.weaponType).toBe('ranged');
    expect(attack.data.weaponId).toBe('weapon.9mmPistol');
    // Flash sits on the shooter's own tile — there is no gun-fire art, so no
    // travelling tracer.
    expect(attack.metadata.muzzleFlash).toEqual({ x: 3, y: 3 });
    expect(attack.metadata.projectile).toBeUndefined();
  });

  it('tags a melee ATTACK as melee', async () => {
    const player = EntityFactory.createPlayer(3, 4);
    const gameMap = await loadScenario([
      npcWith([createItemFromDef('weapon.knife')], 0, { attackOnSight: true, isHostile: true }),
    ]);
    gameMap.addEntity(player, 3, 4);

    const npc = findNpc(gameMap);
    npc.getComponent('Vision').visibleEntities = [player.id];

    const actionQueue = [];
    NPCAISystem.process([player, npc], null, { gameMap }, actionQueue, null, {});

    const attack = actionQueue.find(a => a.type === 'ATTACK');
    expect(attack.data.weaponType).toBe('melee');
    expect(attack.data.weaponId).toBe('weapon.knife');
    expect(attack.metadata.muzzleFlash).toBeUndefined();
  });

  it('fires point-blank rather than pistol-whipping', async () => {
    const player = EntityFactory.createPlayer(3, 4); // cardinally adjacent
    const gameMap = await loadScenario([
      npcWith([createItemFromDef('weapon.9mmPistol')], 0, { attackOnSight: true, isHostile: true }),
    ]);
    gameMap.addEntity(player, 3, 4);

    const npc = findNpc(gameMap);
    npc.getComponent('Vision').visibleEntities = [player.id];

    const actionQueue = [];
    NPCAISystem.process([player, npc], null, { gameMap }, actionQueue, null, {});

    const attack = actionQueue.find(a => a.type === 'ATTACK');
    expect(attack.data.weaponType).toBe('ranged');
  });

  it('a gunshot emits noise so zombies can investigate', async () => {
    const player = EntityFactory.createPlayer(3, 9);
    const gameMap = await loadScenario([
      npcWith([createItemFromDef('weapon.9mmPistol')], 0, { attackOnSight: true, isHostile: true }),
    ]);
    gameMap.addEntity(player, 3, 9);

    const npc = findNpc(gameMap);
    npc.getComponent('Vision').visibleEntities = [player.id];

    const noises = [];
    const realEmit = gameMap.emitNoise.bind(gameMap);
    gameMap.emitNoise = (x, y, radius) => { noises.push({ x, y, radius }); return realEmit(x, y, radius); };

    NPCAISystem.process([player, npc], null, { gameMap }, [], null, {});

    expect(noises.length).toBeGreaterThan(0);
    // 9mm rangedStats.noiseRadius is 12, emitted from the shooter's tile.
    expect(noises[0]).toMatchObject({ x: 3, y: 3, radius: 12 });
  });

  it('drops the whole authored loadout on death', async () => {
    const special = createItemFromDef('weapon.machete');
    const gameMap = await loadScenario([
      npcWith([createItemFromDef('food.cannedsoup'), special], 1),
    ]);

    const npc = findNpc(gameMap);
    const dropped = npc.inventory.getAllItems().map(i => i.defId);

    expect(dropped).toContain('food.cannedsoup');
    expect(dropped).toContain('weapon.machete');
  });

  it('keeps the equipped pointer correct when later items fail to fit', async () => {
    // Each fire axe is 5x2 and the NPC container is 6x15, so only ~7 fit. The
    // overflow must not shift the equipped pointer off the author's choice —
    // here a knife deliberately placed at index 0, ahead of the axes.
    const gameMap = await loadScenario([
      npcWith([
        createItemFromDef('weapon.knife'),
        ...Array.from({ length: 12 }, () => createItemFromDef('weapon.fire_axe')),
      ], 0),
    ]);

    const npc = findNpc(gameMap);
    expect(npc.inventory.items.size).toBeLessThan(13); // some genuinely overflowed

    const weapon = npc.getEquippedWeapon();
    expect(weapon).toBeDefined();
    expect(weapon.defId).toBe('weapon.knife');
  });
});
