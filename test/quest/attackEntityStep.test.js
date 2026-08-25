import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
// The map editor's "Attack entity" event step: an authored NPC/zombie takes one
// swing at the player (or at another entity) because the event said so. Unlike
// an AI attack it ignores AP, range and line of sight, and it has no simulation
// pass behind it — so it must resolve its own damage and its own corpse.
import engine from '../../client/src/game/GameEngine.js';
import { GameMap } from '../../client/src/game/map/GameMap.js';
import { EntityFactory } from '../../client/src/game/EntityFactory.js';
import { Door } from '../../client/src/game/entities/Door.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { gameRandom } from '../../client/src/game/utils/SeededRandom.js';
import { CombatResolver } from '../../client/src/game/systems/CombatResolver.js';
import { buildScriptedAttackAction } from '../../client/src/game/systems/ScriptedAttack.js';
import eventRunner from '../../client/src/game/quest/EventRunner.js';


let gameMap, player, npc;

/** The worst possible roll: a miss under any hit chance the game can produce. */
function worstRoll() {
  vi.spyOn(gameRandom, 'next').mockReturnValue(0.999);
}

/** Let the playback promise chain (off-screen swing + step advance) settle. */
const settle = () => new Promise(resolve => setTimeout(resolve, 120));

function arm(entity, defId) {
  const item = Item.fromJSON(createItemFromDef(defId));
  entity.inventory.addItem(item);
  entity.equippedWeaponId = item.instanceId;
  return item;
}

beforeEach(() => {
  gameMap = new GameMap(20, 20);
  gameMap.initializeMap();
  gameMap.metadata = {};
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) gameMap.getTile(x, y).terrain = 'grass';

  player = EntityFactory.createPlayer(5, 5);
  gameMap.addEntity(player, 5, 5);
  npc = EntityFactory.createNPC(5, 6, 'bandits', 'survivor', 'Raider');
  gameMap.addEntity(npc, 5, 6);

  engine.gameMap = gameMap;
  engine.player = player;
  // Off-screen entities skip the animated path, so playback resolves on a
  // timer instead of waiting for a render loop that headless tests don't run.
  engine.camera = { isTileVisible: () => false };
  eventRunner.activeRun = null;
  eventRunner.firedOnce.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  engine.camera = null;
});

describe('buildScriptedAttackAction', () => {
  it('melees with bare hands', () => {
    const { action, isRanged } = buildScriptedAttackAction(npc, player, 'auto');
    expect(isRanged).toBe(false);
    expect(action.type).toBe('ATTACK');
    expect(action.entityId).toBe(npc.id);
    expect(action.data.targetId).toBe(player.id);
    expect(action.data.targetType).toBe('player');
    expect(action.data.weaponType).toBe('melee');
    expect(action.metadata.muzzleFlash).toBeUndefined();
  });

  it('shoots on "auto" when the attacker carries a gun, from any distance', () => {
    arm(npc, 'weapon.9mmPistol');
    gameMap.moveEntity(npc.id, 5, 18, { snap: true });

    const { action, isRanged } = buildScriptedAttackAction(npc, player, 'auto');
    expect(isRanged).toBe(true);
    expect(action.data.weaponType).toBe('ranged');
    expect(action.data.weaponId).toBe('weapon.9mmPistol');
    expect(action.metadata.muzzleFlash).toEqual({ x: 5, y: 18 });
  });

  it('falls back to melee when told to shoot without a ranged weapon', () => {
    arm(npc, 'weapon.knife');
    const { action, isRanged } = buildScriptedAttackAction(npc, player, 'ranged');
    expect(isRanged).toBe(false);
    expect(action.data.weaponType).toBe('melee');
  });

  it('melees on demand even when holding a gun', () => {
    arm(npc, 'weapon.9mmPistol');
    const { isRanged } = buildScriptedAttackAction(npc, player, 'melee');
    expect(isRanged).toBe(false);
  });

  // An authored blow that whiffs is a broken scene. Accuracy is off the table;
  // only how hard it lands is still up to the dice.
  it('lands on the worst possible roll, at any range', () => {
    worstRoll();
    arm(npc, 'weapon.9mmPistol');
    gameMap.moveEntity(npc.id, 5, 19, { snap: true }); // far past the pistol's accuracy falloff

    const { action } = buildScriptedAttackAction(npc, player, 'ranged');
    expect(action.data.success).toBe(true);
    expect(action.data.damage).toBeGreaterThan(0);
    expect(action.data.dodged).toBe(false);
  });

  it('cannot be dodged, however good the defender is', () => {
    const defense = vi.spyOn(CombatResolver, 'resolveDefense').mockReturnValue({ evaded: true });

    const { action } = buildScriptedAttackAction(npc, player, 'melee');
    expect(action.data.success).toBe(true);
    expect(action.data.dodged).toBe(false);
    expect(action.data.damage).toBeGreaterThan(0);
    expect(defense).not.toHaveBeenCalled(); // the evasion roll is skipped outright
  });

  it('still hits when the attacker is a zombie', () => {
    worstRoll();
    const zombie = EntityFactory.createZombie(4, 5);
    gameMap.addEntity(zombie, 4, 5);

    const { action } = buildScriptedAttackAction(zombie, player, 'auto');
    expect(action.data.success).toBe(true);
    expect(action.data.damage).toBeGreaterThan(0);
  });
});

describe('attackEntity event step', () => {
  it('damages the player without spending the attacker\'s AP', async () => {
    const hpBefore = player.hp;
    npc.ap = 0; // a scripted swing is a cutscene beat, not a turn action

    eventRunner.runEvent({
      id: 'atk-player',
      steps: [{ type: 'attackEntity', entityTag: 'Raider', attackTargetTag: 'player', attackMode: 'melee' }],
    });
    await settle();

    expect(player.hp).toBeLessThan(hpBefore);
    expect(npc.ap).toBe(0);
  });

  it('shoots a distant target — no range or line-of-sight gate', async () => {
    arm(npc, 'weapon.9mmPistol');
    gameMap.moveEntity(npc.id, 5, 19, { snap: true });
    const hpBefore = player.hp;

    eventRunner.runEvent({
      id: 'atk-ranged',
      steps: [{ type: 'attackEntity', entityTag: 'Raider', attackTargetTag: 'player', attackMode: 'ranged' }],
    });
    await settle();

    expect(player.hp).toBeLessThan(hpBefore);
  });

  it('removes a target the scripted blow kills', async () => {
    const zombie = EntityFactory.createZombie(5, 4);
    gameMap.addEntity(zombie, 5, 4);
    zombie.hp = 1;
    gameMap.metadata.entityRegistry = { entries: [{ tag: 'victim', type: 'zombie', x: 5, y: 4 }] };

    eventRunner.runEvent({
      id: 'atk-kill',
      steps: [{ type: 'attackEntity', entityTag: 'Raider', attackTargetTag: 'victim', attackMode: 'melee' }],
    });
    await settle();

    expect(gameMap.getEntity(zombie.id)).toBeFalsy();
  });

  it('runs the rest of the event when the attacker or target cannot be resolved', async () => {
    engine.questState.setFlag('atk_done', false);

    eventRunner.runEvent({
      id: 'atk-bad-tag',
      steps: [
        { type: 'attackEntity', entityTag: 'Nobody', attackTargetTag: 'player' },
        { type: 'setFlag', flag: 'atk_done', value: true },
      ],
    });
    await settle();

    expect(engine.questState.getFlag('atk_done')).toBe(true);
  });

  it('refuses to swing at a structure — that is controlEntity\'s job', async () => {
    const door = new Door(null, 6, 5, false, false, false, 'north');
    gameMap.addEntity(door, 6, 5);
    const hpBefore = door.hp ?? door.health;
    gameMap.metadata.entityRegistry = { entries: [{ tag: 'front_door', type: 'door', x: 6, y: 5 }] };

    eventRunner.runEvent({
      id: 'atk-door',
      steps: [{ type: 'attackEntity', entityTag: 'Raider', attackTargetTag: 'front_door', attackMode: 'melee' }],
    });
    await settle();

    expect(door.hp ?? door.health).toBe(hpBefore);
  });

  it('refuses to make an entity attack itself', async () => {
    const hpBefore = npc.hp;

    eventRunner.runEvent({
      id: 'atk-self',
      steps: [{ type: 'attackEntity', entityTag: 'Raider', attackTargetTag: 'Raider' }],
    });
    await settle();

    expect(npc.hp).toBe(hpBefore);
  });
});
