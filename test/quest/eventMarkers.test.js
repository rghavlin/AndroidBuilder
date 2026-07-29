import { describe, it, expect, beforeEach } from 'vitest';
// EventMarkers — map appearances for authored events (GameEvent.appearance),
// our equivalent of an RPG Maker event page's *graphic*.
//
// The headline case is the on/off switch: two events on one tile with opposite
// flag preconditions and opposite sprites. Because marker presence is recomputed
// from event eligibility rather than tracked incrementally, exactly one of them
// can ever exist, and the pair needs no special-casing anywhere in the engine.
import engine from '../../client/src/game/GameEngine.js';
import { GameMap } from '../../client/src/game/map/GameMap.js';
import { Entity, EntityType } from '../../client/src/game/entities/Entity.js';
import { QuestState } from '../../client/src/game/quest/QuestState.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import { syncEventMarkers, purgeOrphanMarkers } from '../../client/src/game/quest/EventMarkers.js';

const SWITCH_X = 10;
const SWITCH_Y = 5;

let gameMap;
let latches;

/** Stand-in for the EventRunner's two "already happened" sets. */
const freshLatches = () => ({ firedOnce: new Set(), autoResolved: new Set() });

/** The authored on/off pair from the plan: one tile, opposite preconditions. */
const switchPair = () => ([
  {
    id: 'powerOn',
    placement: { kind: 'tile', x: SWITCH_X, y: SWITCH_Y },
    trigger: 'onInteract',
    repeat: 'everyTime',
    preconditions: [{ kind: 'flag', flag: 'mainPower', value: false }],
    appearance: { defId: 'placeable.switch_off' },
    steps: [{ type: 'setFlag', flag: 'mainPower', value: true }],
  },
  {
    id: 'powerOff',
    placement: { kind: 'tile', x: SWITCH_X, y: SWITCH_Y },
    trigger: 'onInteract',
    repeat: 'everyTime',
    preconditions: [{ kind: 'flag', flag: 'mainPower', value: true }],
    appearance: { defId: 'placeable.switch_on' },
    steps: [{ type: 'setFlag', flag: 'mainPower', value: false }],
  },
]);

const markersAt = (x, y) => gameMap.getItemsOnTile(x, y).filter(i => i.isEventMarker);

beforeEach(() => {
  gameMap = new GameMap(20, 20);
  gameMap.initializeMap();
  gameMap.metadata = { events: [] };
  engine.gameMap = gameMap;
  engine.questState = new QuestState();
  engine.player = new Entity({ id: 'em-player', type: EntityType.PLAYER, x: 1, y: 1 });
  // No player standing on the switch tile, so markers live on the map tile
  // rather than in the ground container (the on-tile case has its own test).
  engine.inventoryManager = null;
  latches = freshLatches();
});

describe('EventMarkers — the on/off switch', () => {
  it('shows exactly one sprite, matching the flag', () => {
    gameMap.metadata.events = switchPair();

    engine.questState.setFlag('mainPower', false);
    syncEventMarkers(latches);
    let markers = markersAt(SWITCH_X, SWITCH_Y);
    expect(markers).toHaveLength(1);
    expect(markers[0].defId).toBe('placeable.switch_off');
    // Branded with the event it fires, so clicking it knows what to run.
    expect(markers[0].eventId).toBe('powerOn');

    engine.questState.setFlag('mainPower', true);
    syncEventMarkers(latches);
    markers = markersAt(SWITCH_X, SWITCH_Y);
    expect(markers).toHaveLength(1);
    expect(markers[0].defId).toBe('placeable.switch_on');
    expect(markers[0].eventId).toBe('powerOff');
  });

  it('never shows both sprites and never shows none', () => {
    gameMap.metadata.events = switchPair();
    for (const value of [false, true, false, true, false]) {
      engine.questState.setFlag('mainPower', value);
      syncEventMarkers(latches);
      expect(markersAt(SWITCH_X, SWITCH_Y)).toHaveLength(1);
    }
  });

  it('leaves author-placed items on the tile alone', () => {
    gameMap.metadata.events = switchPair();
    engine.questState.setFlag('mainPower', false);
    const loot = new Item(createItemFromDef('tool.lighter'));
    gameMap.addItemsToTile(SWITCH_X, SWITCH_Y, [loot]);

    syncEventMarkers(latches);
    engine.questState.setFlag('mainPower', true);
    syncEventMarkers(latches);

    const all = gameMap.getItemsOnTile(SWITCH_X, SWITCH_Y);
    expect(all.filter(i => i.isEventMarker)).toHaveLength(1);
    expect(all.some(i => i.defId === 'tool.lighter')).toBe(true);
  });
});

describe('EventMarkers — visibility rules', () => {
  it('shows nothing while no event on the tile is eligible', () => {
    gameMap.metadata.events = [{
      id: 'gated',
      placement: { kind: 'tile', x: 3, y: 3 },
      trigger: 'onInteract',
      repeat: 'everyTime',
      preconditions: [{ kind: 'flag', flag: 'unlocked', value: true }],
      appearance: { defId: 'placeable.switch_off' },
      steps: [{ type: 'setFlag', flag: 'used', value: true }],
    }];

    syncEventMarkers(latches);
    expect(markersAt(3, 3)).toHaveLength(0);

    engine.questState.setFlag('unlocked', true);
    syncEventMarkers(latches);
    expect(markersAt(3, 3)).toHaveLength(1);
  });

  it('removes a repeat:once event’s marker after it fires', () => {
    gameMap.metadata.events = [{
      id: 'oneShot',
      placement: { kind: 'tile', x: 4, y: 4 },
      trigger: 'onInteract',
      repeat: 'once',
      preconditions: [],
      appearance: { defId: 'placeable.switch_off' },
      steps: [{ type: 'setFlag', flag: 'pulled', value: true }],
    }];

    syncEventMarkers(latches);
    expect(markersAt(4, 4)).toHaveLength(1);

    latches.firedOnce.add('oneShot'); // as EventRunner.runEvent would
    syncEventMarkers(latches);
    expect(markersAt(4, 4)).toHaveLength(0);
  });

  it('keeps a oncePerTurn event’s marker within the same turn', () => {
    // The per-turn throttle governs how often the event may fire, not whether
    // it exists — the sprite must not blink out of the world after one use.
    gameMap.metadata.events = [{
      id: 'perTurn',
      placement: { kind: 'tile', x: 5, y: 5 },
      trigger: 'onInteract',
      repeat: 'oncePerTurn',
      preconditions: [],
      appearance: { defId: 'placeable.switch_on' },
      steps: [{ type: 'setFlag', flag: 'ticked', value: true }],
    }];

    engine.turn = 7;
    syncEventMarkers(latches);
    expect(markersAt(5, 5)).toHaveLength(1);

    // Even with the throttle engaged for this turn, the marker stays put.
    syncEventMarkers(latches);
    expect(markersAt(5, 5)).toHaveLength(1);
  });

  it('hides a marker once the event’s endWhen has latched', () => {
    gameMap.metadata.events = [{
      id: 'resolved',
      placement: { kind: 'tile', x: 6, y: 6 },
      trigger: 'onInteract',
      repeat: 'everyTime',
      preconditions: [],
      endWhen: [{ kind: 'flag', flag: 'done', value: true }],
      appearance: { defId: 'placeable.switch_off' },
      steps: [{ type: 'setFlag', flag: 'x', value: true }],
    }];

    syncEventMarkers(latches);
    expect(markersAt(6, 6)).toHaveLength(1);

    engine.questState.setFlag('done', true);
    syncEventMarkers(latches);
    expect(markersAt(6, 6)).toHaveLength(0);
  });

  it('does not mutate firing state just by drawing', () => {
    // Reconciliation runs constantly; it must never latch autoResolved, or an
    // event would be silently retired by nothing more than being looked at.
    gameMap.metadata.events = [{
      id: 'peek',
      placement: { kind: 'tile', x: 7, y: 7 },
      trigger: 'onInteract',
      repeat: 'everyTime',
      preconditions: [],
      endWhen: [{ kind: 'flag', flag: 'over', value: true }],
      appearance: { defId: 'placeable.switch_off' },
      steps: [{ type: 'setFlag', flag: 'x', value: true }],
    }];

    engine.questState.setFlag('over', true);
    syncEventMarkers(latches);
    expect(latches.autoResolved.size).toBe(0);
  });

  it('ignores proximity and chain-only placements', () => {
    gameMap.metadata.events = [
      {
        id: 'prox', placement: { kind: 'proximity', x: 8, y: 8, radius: 3 },
        trigger: 'onEnter', repeat: 'everyTime', preconditions: [],
        appearance: { defId: 'placeable.switch_off' },
        steps: [{ type: 'dialog', text: 'hi' }],
      },
      {
        id: 'chain', placement: { kind: 'chainOnly' },
        trigger: 'onInteract', repeat: 'everyTime', preconditions: [],
        appearance: { defId: 'placeable.switch_on' },
        steps: [{ type: 'dialog', text: 'hi' }],
      },
    ];
    expect(() => syncEventMarkers(latches)).not.toThrow();
    expect(markersAt(8, 8)).toHaveLength(0);
  });

  it('gives a contested tile to the first eligible event in author order', () => {
    // Matches EventRunner._findEventAt, so the sprite always depicts the event
    // a click would actually run.
    gameMap.metadata.events = [
      {
        id: 'first', placement: { kind: 'tile', x: 9, y: 9 },
        trigger: 'onInteract', repeat: 'everyTime', preconditions: [],
        appearance: { defId: 'placeable.switch_off' },
        steps: [{ type: 'setFlag', flag: 'a', value: true }],
      },
      {
        id: 'second', placement: { kind: 'tile', x: 9, y: 9 },
        trigger: 'onInteract', repeat: 'everyTime', preconditions: [],
        appearance: { defId: 'placeable.switch_on' },
        steps: [{ type: 'setFlag', flag: 'b', value: true }],
      },
    ];
    syncEventMarkers(latches);
    const markers = markersAt(9, 9);
    expect(markers).toHaveLength(1);
    expect(markers[0].eventId).toBe('first');
  });

  it('warns but survives an unknown appearance defId', () => {
    gameMap.metadata.events = [{
      id: 'bogus', placement: { kind: 'tile', x: 2, y: 2 },
      trigger: 'onInteract', repeat: 'everyTime', preconditions: [],
      appearance: { defId: 'placeable.does_not_exist' },
      steps: [{ type: 'setFlag', flag: 'x', value: true }],
    }];
    expect(() => syncEventMarkers(latches)).not.toThrow();
    expect(markersAt(2, 2)).toHaveLength(0);
  });
});

describe('EventMarkers — idempotence and cleanup', () => {
  it('does not duplicate when synced repeatedly', () => {
    gameMap.metadata.events = switchPair();
    engine.questState.setFlag('mainPower', false);
    syncEventMarkers(latches);
    syncEventMarkers(latches);
    syncEventMarkers(latches);
    expect(markersAt(SWITCH_X, SWITCH_Y)).toHaveLength(1);
  });

  it('reuses the existing marker rather than respawning it', () => {
    gameMap.metadata.events = switchPair();
    engine.questState.setFlag('mainPower', false);
    syncEventMarkers(latches);
    const firstId = markersAt(SWITCH_X, SWITCH_Y)[0].instanceId;
    syncEventMarkers(latches);
    expect(markersAt(SWITCH_X, SWITCH_Y)[0].instanceId).toBe(firstId);
  });

  it('purges a marker whose event no longer exists', () => {
    // The save/load case: markers are ordinary tile items, so a save made while
    // one existed restores it even after the author deletes the event.
    const orphan = new Item({
      ...createItemFromDef('placeable.switch_on'),
      eventId: 'deletedEvent',
      isEventMarker: true,
    });
    gameMap.addItemsToTile(12, 12, [orphan]);
    expect(markersAt(12, 12)).toHaveLength(1);

    gameMap.metadata.events = switchPair(); // 'deletedEvent' is not among them
    expect(purgeOrphanMarkers()).toBe(1);
    expect(markersAt(12, 12)).toHaveLength(0);
  });

  it('purges a marker whose event changed its appearance defId', () => {
    const stale = new Item({
      ...createItemFromDef('placeable.switch_on'),
      eventId: 'powerOn', // real event, but it now wants switch_off
      isEventMarker: true,
    });
    gameMap.addItemsToTile(13, 13, [stale]);
    gameMap.metadata.events = switchPair();
    expect(purgeOrphanMarkers()).toBe(1);
    expect(markersAt(13, 13)).toHaveLength(0);
  });

  it('leaves a still-valid marker in place during a purge', () => {
    gameMap.metadata.events = switchPair();
    engine.questState.setFlag('mainPower', false);
    syncEventMarkers(latches);
    expect(purgeOrphanMarkers()).toBe(0);
    expect(markersAt(SWITCH_X, SWITCH_Y)).toHaveLength(1);
  });
});

describe('EventMarkers — the player-tile case', () => {
  /**
   * While the player stands on a tile, its items live in the inventory
   * manager's ground container and the map tile is emptied (see
   * InventoryManager.syncWithMap). A marker written to the tile there would be
   * invisible and clobbered on the next move, so reconciliation has to target
   * the container instead.
   */
  it('places the marker in the ground container, not on the tile', async () => {
    const { InventoryManager } = await import('../../client/src/game/inventory/InventoryManager.js');
    const inv = new InventoryManager();
    inv.lastSyncedX = SWITCH_X;
    inv.lastSyncedY = SWITCH_Y;
    engine.inventoryManager = inv;

    gameMap.metadata.events = switchPair();
    engine.questState.setFlag('mainPower', false);
    syncEventMarkers(latches);

    const ground = inv.groundContainer.getAllItems().filter(i => i.isEventMarker);
    expect(ground).toHaveLength(1);
    expect(ground[0].defId).toBe('placeable.switch_off');
    expect(markersAt(SWITCH_X, SWITCH_Y)).toHaveLength(0);
  });

  it('swaps the container marker when the flag flips, without recursing', async () => {
    const { InventoryManager } = await import('../../client/src/game/inventory/InventoryManager.js');
    const inv = new InventoryManager();
    inv.lastSyncedX = SWITCH_X;
    inv.lastSyncedY = SWITCH_Y;
    engine.inventoryManager = inv;

    // Writing to the ground container emits 'inventoryChanged', which in the
    // real engine calls straight back into syncEventMarkers. Re-entering here
    // must be a no-op rather than an infinite loop.
    let emissions = 0;
    inv.on('inventoryChanged', () => {
      emissions += 1;
      syncEventMarkers(latches); // the re-entrant call the guard exists for
    });

    gameMap.metadata.events = switchPair();
    engine.questState.setFlag('mainPower', false);
    syncEventMarkers(latches);
    engine.questState.setFlag('mainPower', true);
    syncEventMarkers(latches);

    const ground = inv.groundContainer.getAllItems().filter(i => i.isEventMarker);
    expect(ground).toHaveLength(1);
    expect(ground[0].defId).toBe('placeable.switch_on');
    expect(emissions).toBeGreaterThan(0); // the guard was actually exercised
  });
});
