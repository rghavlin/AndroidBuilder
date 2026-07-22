import { describe, it, expect, vi, afterEach } from 'vitest';
// T1 regression tests: deserialization must round-trip legitimate falsy values
// (0, false, '') instead of clobbering them with `|| default`. Each suite pins
// one file fixed in the falsy-default sweep.
import { AIState } from '../../client/src/game/components/AIState.js';
import { Burnable } from '../../client/src/game/components/Burnable.js';
import { RpgStats } from '../../client/src/game/components/RpgStats.js';
import { Tile } from '../../client/src/game/map/Tile.js';
import { WeatherManager } from '../../client/src/game/utils/WeatherManager.js';
import { NPCAISystem } from '../../client/src/game/systems/NPCAISystem.js';
import { CombatResolver } from '../../client/src/game/systems/CombatResolver.js';
import { Door } from '../../client/src/game/entities/Door.js';
import { GarageDoor } from '../../client/src/game/entities/GarageDoor.js';
import { Window } from '../../client/src/game/entities/Window.js';
import { Rabbit } from '../../client/src/game/entities/Rabbit.js';
import { PlaceIcon } from '../../client/src/game/entities/PlaceIcon.js';
import { TestEntity } from '../../client/src/game/entities/TestEntity.js';
import { Entity } from '../../client/src/game/entities/Entity.js';
import { WorldManager } from '../../client/src/game/WorldManager.js';
import { GameMap } from '../../client/src/game/map/GameMap.js';
import { QuestState } from '../../client/src/game/quest/QuestState.js';
import eventRunner from '../../client/src/game/quest/EventRunner.js';

describe('T1 falsy-default deserialization', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('AIState round-trips explicit 0/false from a save', () => {
    const saved = new AIState({
      behaviorState: 'hunting',
      heardNoise: false,
      lastSeen: false,
      isAlerted: false,
      hasDemanded: false,
      hasExtorted: false,
      fleeRecoverChance: 0,
      stunnedTurns: 0,
      lastScentSequence: 0,
      attackOnSight: false
    }).toJSON();

    const restored = new AIState(saved);
    expect(restored.behaviorState).toBe('hunting');
    expect(restored.heardNoise).toBe(false);
    expect(restored.lastSeen).toBe(false);
    expect(restored.isAlerted).toBe(false);
    expect(restored.hasDemanded).toBe(false);
    expect(restored.hasExtorted).toBe(false);
    expect(restored.fleeRecoverChance).toBe(0);
    expect(restored.stunnedTurns).toBe(0);
    expect(restored.lastScentSequence).toBe(0);
    expect(restored.attackOnSight).toBe(false);
  });

  it('Burnable round-trips explicit 0 fireTurns/fireResistance', () => {
    const saved = new Burnable({ fireTurns: 0, fireResistance: 0 }).toJSON();
    const restored = new Burnable(saved);
    expect(restored.fireTurns).toBe(0);
    expect(restored.fireResistance).toBe(0);
  });

  it('RpgStats round-trips explicit 0 XP values', () => {
    const saved = new RpgStats({
      strengthXP: 0,
      agilityXP: 0,
      perceptionXP: 0,
      constitutionXP: 0,
      strengthXpSpent: 0,
      agilityXpSpent: 0,
      perceptionXpSpent: 0,
      constitutionXpSpent: 0
    }).toJSON();

    const restored = new RpgStats(saved);
    expect(restored.strengthXP).toBe(0);
    expect(restored.agilityXP).toBe(0);
    expect(restored.perceptionXP).toBe(0);
    expect(restored.constitutionXP).toBe(0);
    expect(restored.strengthXpSpent).toBe(0);
    expect(restored.agilityXpSpent).toBe(0);
    expect(restored.perceptionXpSpent).toBe(0);
    expect(restored.constitutionXpSpent).toBe(0);
  });

  it('Tile.fromJSON preserves a saved waterAmount of 0 on a water tile', () => {
    // The `||` bug: a drained water tile (0) was refilled to the terrain
    // default of 100 on load.
    const tile = Tile.fromJSON({ x: 1, y: 1, terrain: 'water', waterAmount: 0 });
    expect(tile.waterAmount).toBe(0);
  });

  it('Tile.fromJSON still applies the terrain default when waterAmount is absent', () => {
    expect(Tile.fromJSON({ x: 0, y: 0, terrain: 'water' }).waterAmount).toBe(100);
    expect(Tile.fromJSON({ x: 0, y: 0, terrain: 'grass' }).waterAmount).toBe(0);
  });

  it('Tile.fromJSON round-trips explicit 0 scent/fireTurns and false edgeWalls', () => {
    const tile = Tile.fromJSON({
      x: 2, y: 3, terrain: 'floor',
      scent: 0,
      scentSequence: 0,
      fireTurns: 0,
      edgeWalls: { n: false, e: true, s: false, w: false },
      decoration: ''
    });
    expect(tile.scent).toBe(0);
    expect(tile.scentSequence).toBe(0);
    expect(tile.fireTurns).toBe(0);
    expect(tile.edgeWalls).toEqual({ n: false, e: true, s: false, w: false });
    expect(tile.decoration).toBe('');
  });

  it('WeatherManager.fromJSON preserves explicit false/0 weather state', () => {
    const wm = new WeatherManager(null);
    wm.fromJSON({ isRaining: false, durationRemaining: 0, nextEventTurn: 0, intensity: 0 });
    expect(wm.isRaining).toBe(false);
    expect(wm.durationRemaining).toBe(0);
    expect(wm.nextEventTurn).toBe(0);
    expect(wm.intensity).toBe(0);
  });

  it('NPCAISystem.npcAttack measures distance from logicalX 0, not a stale x', () => {
    // `target.logicalX || target.x` sent shots at the wrong tile whenever the
    // target stood on column/row 0 with a stale render x/y.
    vi.spyOn(CombatResolver, 'rollNpc').mockReturnValue({ hit: false, damage: 0, dodged: false });

    const measured = {};
    const npc = {
      id: 'npc1',
      typeId: 'survivor',
      ap: 10,
      logicalX: 1,
      logicalY: 1,
      currentPath: null,
      useAP(cost) { this.ap -= cost; },
      getEquippedWeapon() { return null; },
      getDistanceTo(x, y) { measured.x = x; measured.y = y; return 5; }
    };
    const target = {
      id: 'z1',
      type: 'zombie',
      subtype: 'basic',
      hp: 10,
      logicalX: 0,
      logicalY: 0,
      x: 7, // stale render coordinate — must be ignored
      y: 7
    };
    const pushed = [];
    const ctx = {
      npc,
      gameMap: { emitNoise() {} },
      pushAction(action) { pushed.push(action); }
    };

    NPCAISystem.npcAttack(ctx, target, true);

    expect(measured).toEqual({ x: 0, y: 0 });
    expect(pushed).toHaveLength(1);
    expect(pushed[0].data.to).toEqual({ x: 0, y: 0 });
  });

  it('Door.fromJSON preserves isOpen false (visualIsOpen stays closed)', () => {
    const door = Door.fromJSON({ id: 'd1', x: 1, y: 1, isOpen: false, isLocked: false, edge: 'n' });
    expect(door.visualIsOpen).toBe(false);
  });

  it('GarageDoor.fromJSON preserves isOpen false (visualIsOpen stays closed)', () => {
    const door = GarageDoor.fromJSON({ id: 'g1', x: 1, y: 1, isOpen: false, isLocked: false, edge: 'n', groupId: 'grp1' });
    expect(door.visualIsOpen).toBe(false);
  });

  it('Window.fromJSON round-trips explicit false/0 state', () => {
    const win = Window.fromJSON({
      id: 'w1', x: 1, y: 1,
      isLocked: false,
      isOpen: false,
      isBroken: false,
      isReinforced: false,
      reinforcementHp: 0,
      edge: 'e'
    });
    expect(win.isOpen).toBe(false);
    expect(win.isBroken).toBe(false);
    expect(win.isReinforced).toBe(false);
    expect(win.reinforcementHp).toBe(0);
    expect(win.subtype).toBe('closed');
  });

  it('Rabbit.fromJSON round-trips explicit false/0 state', () => {
    const rabbit = Rabbit.fromJSON({
      id: 'r1', x: 2, y: 2,
      hp: 0, // dead rabbit is a valid saved value
      isActive: false,
      isAnimating: false,
      animationProgress: 0
    });
    expect(rabbit.hp).toBe(0);
    expect(rabbit.isActive).toBe(false);
    expect(rabbit.isAnimating).toBe(false);
    expect(rabbit.animationProgress).toBe(0);
  });

  it('PlaceIcon.fromJSON preserves blocksSight false', () => {
    const icon = PlaceIcon.fromJSON({ id: 'p1', x: 1, y: 1, subtype: 'grocer', blocksMovement: true, blocksSight: false });
    expect(icon.blocksSight).toBe(false);
  });

  it('TestEntity.fromJSON preserves an empty-string description', () => {
    const entity = TestEntity.fromJSON({ id: 't1', x: 0, y: 0, subtype: 'generic', blocksSight: false, description: '' });
    expect(entity.description).toBe('');
    expect(entity.blocksSight).toBe(false);
  });

  it('Entity.fromJSON keeps an x/y of 0 when grid/logical coords are absent', () => {
    const entity = Entity.fromJSON({ id: 'e1', type: 'zombie', x: 0, y: 0 });
    expect(entity.gridX).toBe(0);
    expect(entity.gridY).toBe(0);
    expect(entity.renderX).toBe(0);
    expect(entity.renderY).toBe(0);
  });

  it('WorldManager.fromJSON preserves explicit falsy scalar/object fields', () => {
    const wm = WorldManager.fromJSON({
      currentMapId: 'map_001',
      mapCounter: 0, // degenerate but explicit — must pass through verbatim
      firstEntryTurn: {},
      completedMaps: [],
      turnsFromEntryToExit: {},
      zombiesKilled: { map_001: 0 },
      zombiesSpawned: { map_001: 0 },
      zombiesInitialCount: { map_001: 0 },
      lastReplenishSector: {},
      claimedPrizes: []
    });
    expect(wm.mapCounter).toBe(0);
    expect(wm.firstEntryTurn).toEqual({});
    expect(wm.completedMaps).toEqual([]);
    expect(wm.zombiesKilled).toEqual({ map_001: 0 });
    expect(wm.zombiesSpawned).toEqual({ map_001: 0 });
    expect(wm.zombiesInitialCount).toEqual({ map_001: 0 });
    expect(wm.claimedPrizes).toEqual([]);
  });

  it('GameMap.fromJSON round-trips explicit falsy header fields', async () => {
    const map = new GameMap(3, 3);
    const json = map.toJSON();
    json.scentSequenceCounter = 0;
    json.mapNumber = 1;
    json.furniture = [];
    json.lowSpots = [];
    json.activeFires = [];

    const loaded = await GameMap.fromJSON(json);
    expect(loaded.scentSequenceCounter).toBe(0);
    expect(loaded.mapNumber).toBe(1);
    expect(loaded.furniture).toEqual([]);
    expect(loaded.lowSpots).toEqual([]);
    expect(loaded.activeFires.size).toBe(0);
  });

  it('QuestState.fromJSON preserves vars explicitly set to 0/false', () => {
    const qs = new QuestState();
    qs.fromJSON({
      flags: { metTrader: false },
      vars: { traderRep: 0 },
      activeQuests: {},
      completedQuests: [],
      consumed: { 'food.mre': 0 }
    });
    expect(qs.flags).toEqual({ metTrader: false });
    expect(qs.vars).toEqual({ traderRep: 0 });
    expect(qs.consumed).toEqual({ 'food.mre': 0 });
  });

  it('EventRunner.fromJSON restores explicitly empty fired sets', () => {
    const EventRunnerClass = eventRunner.constructor;
    const runner = new EventRunnerClass();
    runner.fromJSON({ firedOnce: [], autoResolved: [] });
    expect(runner.firedOnce.size).toBe(0);
    expect(runner.autoResolved.size).toBe(0);

    runner.fromJSON({ firedOnce: ['evt1'], autoResolved: [] });
    expect(runner.firedOnce.has('evt1')).toBe(true);
  });
});
