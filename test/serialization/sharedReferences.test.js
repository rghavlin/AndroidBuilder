import { describe, it, expect } from 'vitest';
// T8 regression: shared-reference / mutable-default hazards. Each test pushes
// into a default or a serialized POJO and asserts every other holder is
// isolated (R13#3 accessor defaults, R31#2 createItemFromDef, R5#5 Tile
// edgeWalls/flags, R8 GameMap header fields, R1#5 toJSON shallow spreads).
import { Entity } from '../../client/src/game/entities/Entity.js';
import { AIState } from '../../client/src/game/components/AIState.js';
import { createItemFromDef, ItemDefs } from '../../client/src/game/inventory/ItemDefs.js';
import { Tile } from '../../client/src/game/map/Tile.js';
import { GameMap } from '../../client/src/game/map/GameMap.js';

const assert = (condition, message) => expect(condition, message).toBeTruthy();

describe('Serialization / shared-reference isolation (T8)', () => {
  it('accessor mutable defaults are not shared between component-less entities', () => {
    const e1 = new Entity('e1', 'zombie');
    const e2 = new Entity('e2', 'zombie');
    assert(e1.getComponent('AIState') === undefined, 'e1 starts without AIState');

    e1.noiseBlacklist.push('corrupted');
    e1.noiseCoords.x = 99;

    assert(e2.noiseBlacklist.length === 0, 'e2 default noiseBlacklist untouched');
    assert(e2.noiseCoords.x === 0, 'e2 default noiseCoords untouched');
    assert(e1.noiseBlacklist.length === 0, 'pushing into a returned default does not stick');
    assert(e1.noiseCoords.x === 0, 'mutating a returned default does not stick');
  });

  it('accessor default isolation does not break the setter path', () => {
    const e1 = new Entity('e1', 'zombie');
    e1.noiseBlacklist = ['a', 'b'];
    assert(e1.noiseBlacklist.length === 2, 'setter stores on a new component');
    e1.noiseBlacklist.push('c');
    assert(e1.noiseBlacklist.length === 3, 'component-backed array mutates normally');
  });

  it('createItemFromDef instances own their nested def objects', () => {
    const def = ItemDefs['zombie.brainpulp'];
    const traitsBefore = def.traits.length;

    const item1 = createItemFromDef('zombie.brainpulp');
    const item2 = createItemFromDef('zombie.brainpulp');

    item1.traits.push('corrupted');
    item1.consumptionEffects.nutrition = 999;

    assert(item2.traits.length === traitsBefore, 'sibling instance traits isolated');
    assert(def.traits.length === traitsBefore, 'ItemDefs entry traits isolated');
    assert(def.consumptionEffects.nutrition === 1, 'ItemDefs entry consumptionEffects isolated');
  });

  it('Tile.toJSON does not alias live edgeWalls/flags', () => {
    const tile = new Tile(0, 0, 'grass');
    tile.edgeWalls.n = true;
    tile.flags = { surveyed: true };

    const json = tile.toJSON();
    json.edgeWalls.n = false;
    json.flags.surveyed = false;

    assert(tile.edgeWalls.n === true, 'live edgeWalls unaffected by save POJO mutation');
    assert(tile.flags.surveyed === true, 'live flags unaffected by save POJO mutation');
  });

  it('Tile.fromJSON does not alias the save POJO', () => {
    const data = {
      x: 0, y: 0, terrain: 'grass',
      edgeWalls: { n: true, e: false, s: false, w: false },
      flags: { surveyed: true }
    };
    const t1 = Tile.fromJSON(data);
    const t2 = Tile.fromJSON(data);

    t1.edgeWalls.e = true;
    t1.flags.surveyed = false;

    assert(data.edgeWalls.e === false, 'save POJO edgeWalls untouched');
    assert(t2.edgeWalls.e === false, 'second load from same data isolated');
    assert(t2.flags.surveyed === true, 'second load flags isolated');
  });

  it('AIState toJSON/constructor do not alias nested state', () => {
    const comp = new AIState({ noiseBlacklist: ['n1'], noiseCoords: { x: 1, y: 2 } });

    const json = comp.toJSON();
    json.noiseBlacklist.push('corrupted');
    json.noiseCoords.x = 99;
    assert(comp.noiseBlacklist.length === 1, 'live component isolated from its save POJO');
    assert(comp.noiseCoords.x === 1, 'live noiseCoords isolated from its save POJO');

    const restored = new AIState(json);
    restored.noiseBlacklist.push('restored-only');
    assert(json.noiseBlacklist.length === 2, 'save POJO isolated from the restored component');
  });

  it('GameMap.fromJSON clones buildings/furniture/lowSpots off the save POJO', async () => {
    const data = {
      width: 1,
      height: 1,
      tiles: [[{ x: 0, y: 0, terrain: 'grass' }]],
      buildings: [{ x: 0, y: 0, w: 1, h: 1, type: 'house' }],
      furniture: [{ type: 'chair', x: 0, y: 0, w: 1, h: 1, rot: 0 }],
      lowSpots: [{ x: 0, y: 0 }],
      activeFires: [],
      scentSequenceCounter: 0,
      mapNumber: 1,
      template: 'road'
    };

    const map = await GameMap.fromJSON(data);
    map.buildings[0].type = 'corrupted';
    map.furniture[0].type = 'corrupted';
    map.lowSpots.push({ x: 9, y: 9 });

    assert(data.buildings[0].type === 'house', 'save POJO buildings untouched');
    assert(data.furniture[0].type === 'chair', 'save POJO furniture untouched');
    assert(data.lowSpots.length === 1, 'save POJO lowSpots untouched');
  });
});
