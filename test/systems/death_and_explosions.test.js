import { describe, it, expect, beforeAll, afterAll } from 'vitest';
// Ported from verify_phase_4.mjs — death processing (loot/inventory/meat drops,
// target clearance) and ExplosionSystem routing lethal damage through
// DestructionSystem.
//
// This suite mutates process-global state (the `engine` singleton, Math.random,
// and gameRandom.next) to force deterministic drops. Because Vitest runs these
// suites in one process (fileParallelism:false), everything is restored in
// afterAll so other suites (e.g. the battery loot test that seeds gameRandom)
// are unaffected.
import { EntityFactory } from '../../client/src/game/EntityFactory.js';
import { Rabbit } from '../../client/src/game/entities/Rabbit.js';
import { SimulationManager } from '../../client/src/game/managers/SimulationManager.js';
import { GameMap } from '../../client/src/game/map/GameMap.js';
import { ExplosionSystem } from '../../client/src/game/systems/ExplosionSystem.js';
import { IntentQueue } from '../../client/src/game/managers/IntentQueue.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import engine from '../../client/src/game/GameEngine.js';
import { gameRandom } from '../../client/src/game/utils/SeededRandom.js';

const assert = (condition, message) => expect(condition, message).toBeTruthy();

describe('Systems / death drops + explosion -> destruction routing', () => {
  let map;
  let player;
  let origRandom;
  let origLoot;
  let hadOwnLoot;
  const intentQueue = new IntentQueue();
  const actionQueue = [];

  beforeAll(() => {
    // Force the 75%-ish drop rolls to always succeed.
    origRandom = Math.random;
    Math.random = () => 0.1;
    // gameRandom.next is a prototype method; assigning here shadows it with an
    // own property, and deleting that shadow in afterAll restores the real PRNG.
    gameRandom.next = () => 0.1;

    // Mock zombie loot generation on the engine singleton.
    hadOwnLoot = Object.prototype.hasOwnProperty.call(engine, 'lootGenerator');
    origLoot = engine.lootGenerator;
    engine.lootGenerator = {
      generateZombieLoot: () => [{ defId: 'ammo.bullet_9mm', count: 5 }],
    };

    map = new GameMap(10, 10);
    player = EntityFactory.createPlayer(1, 1);
    map.entityMap.set(player.id, player);
  });

  afterAll(() => {
    Math.random = origRandom;
    delete gameRandom.next;
    if (hadOwnLoot) engine.lootGenerator = origLoot;
    else delete engine.lootGenerator;
  });

  it('zombie death: removed from map, targeting cleared, loot dropped on its tile', () => {
    const zombie = EntityFactory.createZombie(2, 2, 'standard');
    const activeZombie = EntityFactory.createZombie(3, 3, 'standard');
    activeZombie.currentTarget = zombie;
    activeZombie.behaviorState = 'pursuing';

    // Use addEntity (not bare entityMap.set) so the by-type index is populated —
    // DestructionSystem clears zombie targeting via getEntitiesByType (T3).
    map.addEntity(zombie, 2, 2);
    map.addEntity(activeZombie, 3, 3);
    zombie.hp = 0;

    const diedAny = SimulationManager.checkAndProcessDeaths(
      map, [player, zombie, activeZombie], intentQueue, actionQueue, player,
    );
    assert(diedAny === true, 'checkAndProcessDeaths returns true when a zombie dies');
    assert(!map.getEntity(zombie.id), 'dead zombie removed from map');
    assert(activeZombie.currentTarget === null, 'dead zombie cleared from survivor target');
    assert(activeZombie.behaviorState === 'idle', 'survivor reverts to idle');

    const tile = map.getTile(2, 2);
    assert(
      tile.inventoryItems && tile.inventoryItems.some((i) => i.defId === 'ammo.bullet_9mm'),
      'zombie drops loot on the tile where it died',
    );
  });

  it('NPC death: removed from map, inventory contents dropped', () => {
    const npc = EntityFactory.createNPC(4, 4);
    const itemDef = createItemFromDef('weapon.9mmPistol');
    assert(itemDef !== null, 'definition found for weapon.9mmPistol');
    npc.inventory.addItem(new Item(itemDef));
    npc.hp = 0;
    map.entityMap.set(npc.id, npc);

    const npcDiedAny = SimulationManager.checkAndProcessDeaths(
      map, [player, npc], intentQueue, actionQueue, player,
    );
    assert(npcDiedAny === true, 'NPC death is processed');
    assert(!map.getEntity(npc.id), 'NPC removed from map');

    const tile = map.getTile(4, 4);
    assert(
      tile.inventoryItems && tile.inventoryItems.some((i) => i.defId === 'weapon.9mmPistol'),
      'NPC drops its inventory items on death',
    );
    assert(npc.inventory.getAllItems().length === 0, 'NPC inventory cleared after dropping');
  });

  it('rabbit death: drops raw meat', () => {
    const rabbit = new Rabbit('rabbit1', 5, 5);
    rabbit.hp = 0;
    map.entityMap.set(rabbit.id, rabbit);

    const rabbitDied = SimulationManager.checkAndProcessDeaths(
      map, [player, rabbit], intentQueue, actionQueue, player,
    );
    assert(rabbitDied === true, 'rabbit death is processed');
    assert(!map.getEntity(rabbit.id), 'rabbit removed from map');

    const tile = map.getTile(5, 5);
    // DestructionSystem drops a rabbit carcass (the verify script's old
    // 'food.raw_meat' expectation is stale — see DestructionSystem.js ~L60).
    assert(
      tile.inventoryItems && tile.inventoryItems.some((i) => i.defId === 'food.rabbit_carcass'),
      'rabbit drops a carcass on death',
    );
  });

  it('explosion routes lethal damage through DestructionSystem', () => {
    const rabbit2 = new Rabbit('rabbit2', 6, 6);
    rabbit2.hp = 10;
    map.entityMap.set(rabbit2.id, rabbit2);

    const explosionIntent = {
      targetX: 6,
      targetY: 6,
      radius: 2,
      minDamage: 20,
      maxDamage: 30,
      isIncendiary: false,
      sourceEntityId: player.id,
    };

    ExplosionSystem.resolve(explosionIntent, [player, rabbit2], map, intentQueue, actionQueue, engine);

    assert(rabbit2.hp <= 0, 'explosion damages the rabbit');
    assert(!map.getEntity(rabbit2.id), 'DestructionSystem removed the killed rabbit');
    const tile = map.getTile(6, 6);
    assert(
      tile.inventoryItems && tile.inventoryItems.some((i) => i.defId === 'food.rabbit_carcass'),
      'rabbit killed by explosion drops a carcass via DestructionSystem',
    );
  });
});
