import { describe, it, expect, beforeEach } from 'vitest';
// Per-visit map setup. Two things had to be true for an authored event to run
// on *every* entry to a map:
//   1. the map's authored metadata (its events, registries, transitions) has to
//      survive serialization — a map you walk back into is restored from a
//      snapshot, and metadata used to be dropped there entirely;
//   2. there has to be a trigger that means "on arrival". `auto` doesn't: it is
//      re-checked on every reactive pulse, so repeat:'everyTime' on an auto
//      event runs constantly and repeat:'once' runs exactly one time ever.
import engine from '../../client/src/game/GameEngine.js';
import { GameMap } from '../../client/src/game/map/GameMap.js';
import { Entity, EntityType } from '../../client/src/game/entities/Entity.js';
import eventRunner from '../../client/src/game/quest/EventRunner.js';

/** Resets a var to 0 — the shape of real "reset the room" map setup. */
const resetVar = (id, trigger, repeat) => ({
  id,
  trigger,
  repeat,
  placement: { kind: 'chainOnly' },
  preconditions: [],
  steps: [{ type: 'setVar', var: 'timer', op: 'set', varValue: 0 }],
});

function newMap(events) {
  const gameMap = new GameMap(10, 10);
  gameMap.initializeMap();
  gameMap.metadata = {
    events,
    questRegistry: { flags: [], vars: [], factions: [], factionStances: {} },
    mapTransitions: [],
    lightMode: 'time_dependent',
  };
  return gameMap;
}

beforeEach(() => {
  engine.player = new Entity({ id: 'me-player', type: EntityType.PLAYER, x: 5, y: 5 });
  eventRunner.reset();
});

describe('onMapEnter events', () => {
  it('runs on every entry, unlike an auto event with repeat:once', async () => {
    const gameMap = newMap([resetVar('setup', 'onMapEnter', 'everyTime')]);
    engine.gameMap = gameMap;
    gameMap.addEntity(engine.player);

    engine.questState.setVar('timer', 7);
    eventRunner.onMapLoaded();
    expect(engine.questState.getVar('timer')).toBe(0);

    // Leave, come back — through a real serialization round trip, which is what
    // WorldManager does for any map already in the world collection.
    eventRunner.onMapTransition();
    const restored = await GameMap.fromJSONSelective(gameMap.toJSON(), { excludeEntityTypes: ['player'] });
    engine.gameMap = restored;

    engine.questState.setVar('timer', 7);
    eventRunner.onMapLoaded();
    expect(engine.questState.getVar('timer')).toBe(0);
  });

  it('honours repeat:once, firing on the first entry only', () => {
    engine.gameMap = newMap([resetVar('setup', 'onMapEnter', 'once')]);

    eventRunner.onMapLoaded();
    expect(engine.questState.getVar('timer')).toBe(0);

    engine.questState.setVar('timer', 7);
    eventRunner.onMapTransition();
    eventRunner.onMapLoaded();
    expect(engine.questState.getVar('timer')).toBe(7);
  });

  it('is not re-run by the reactive auto-event checks between entries', () => {
    engine.gameMap = newMap([resetVar('setup', 'onMapEnter', 'everyTime')]);

    eventRunner.onMapLoaded();
    engine.questState.setVar('timer', 7);
    eventRunner.checkAutoEvents();
    expect(engine.questState.getVar('timer')).toBe(7);
  });
});

describe('authored map metadata survives serialization', () => {
  it('restores events, registries and transitions on a returning visit', async () => {
    const gameMap = newMap([resetVar('setup', 'onMapEnter', 'everyTime')]);
    gameMap.metadata.mapTransitions = [{ x: 1, y: 2, targetId: 'someMap', targetType: 'scenario' }];

    const restored = await GameMap.fromJSONSelective(gameMap.toJSON(), { excludeEntityTypes: ['player'] });

    expect(restored.metadata.events).toEqual(gameMap.metadata.events);
    expect(restored.metadata.questRegistry).toEqual(gameMap.metadata.questRegistry);
    expect(restored.metadata.mapTransitions).toEqual(gameMap.metadata.mapTransitions);
    expect(restored.metadata.lightMode).toBe('time_dependent');
  });

  it('leaves the generator scratch fields out of the snapshot', () => {
    const gameMap = newMap([]);
    gameMap.metadata.doors = [{ x: 1, y: 1 }];
    gameMap.metadata.entities = [{ type: 'zombie', x: 2, y: 2 }];

    const json = gameMap.toJSON();
    expect(json.metadata.doors).toBeUndefined();
    expect(json.metadata.entities).toBeUndefined();
  });
});
