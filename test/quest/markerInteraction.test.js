import { describe, it, expect, beforeEach } from 'vitest';
// How an event with a map appearance is activated.
//
// An event that draws its own item is activated by clicking THAT ITEM in the
// ground panel, not by clicking its tile on the map. The tile-click path is
// reserved for appearance-less events (e.g. clicking an NPC to replay its
// instructions).
//
// Regression this locks down: MapInterface consumes a tile click whenever the
// player is on *or adjacent to* the tile, so while switches were reachable via
// tile clicks, clicking a switch to walk the last step onto it fired the event
// instead of moving — the player could never actually stand on the switch, and
// the lights came on just from trying to walk there.
import engine from '../../client/src/game/GameEngine.js';
import { GameMap } from '../../client/src/game/map/GameMap.js';
import { Entity, EntityType } from '../../client/src/game/entities/Entity.js';
import { QuestState } from '../../client/src/game/quest/QuestState.js';
import eventRunner from '../../client/src/game/quest/EventRunner.js';

const X = 9;
const Y = 9;

let gameMap;

const withAppearance = () => ({
  id: 'powerOn',
  placement: { kind: 'tile', x: X, y: Y },
  trigger: 'onInteract',
  repeat: 'everyTime',
  preconditions: [{ kind: 'flag', flag: 'mainPower', value: false }],
  appearance: { defId: 'placeable.switch_off' },
  steps: [{ type: 'setFlag', flag: 'mainPower', value: true }],
});

const withoutAppearance = (id = 'npcTalk') => ({
  id,
  placement: { kind: 'tile', x: X, y: Y },
  trigger: 'onInteract',
  repeat: 'everyTime',
  preconditions: [],
  steps: [{ type: 'setFlag', flag: 'talked', value: true }],
});

beforeEach(() => {
  gameMap = new GameMap(20, 20);
  gameMap.initializeMap();
  gameMap.metadata = { events: [] };
  engine.gameMap = gameMap;
  engine.questState = new QuestState();
  engine.inventoryManager = null;
  engine.player = new Entity({ id: 'mi-player', type: EntityType.PLAYER, x: 8, y: 9 });
  eventRunner.reset();
  eventRunner.activeRun = null;
});

describe('Tile clicks vs. event appearances', () => {
  it('does not fire an event that has an appearance', () => {
    gameMap.metadata.events = [withAppearance()];
    // The player clicking (9,9) from the adjacent tile means "walk there".
    expect(eventRunner.checkAndFireOnInteract(X, Y)).toBe(false);
    expect(engine.questState.getFlag('mainPower')).toBe(false);
    expect(eventRunner.activeRun).toBeNull();
  });

  it('still fires an appearance-less event on the same tile', () => {
    gameMap.metadata.events = [withoutAppearance()];
    expect(eventRunner.checkAndFireOnInteract(X, Y)).toBe(true);
    expect(engine.questState.getFlag('talked')).toBe(true);
  });

  it('skips past an appearance event to a later appearance-less one', () => {
    // The filter must run per-event, not just reject the first match, or an
    // NPC event authored after a switch on the same tile would go dead.
    gameMap.metadata.events = [withAppearance(), withoutAppearance()];
    expect(eventRunner.checkAndFireOnInteract(X, Y)).toBe(true);
    expect(engine.questState.getFlag('talked')).toBe(true);
    expect(engine.questState.getFlag('mainPower')).toBe(false);
  });

  it('does not latch endWhen on an event it declined to consider', () => {
    // The filter runs before the eligibility check precisely so a skipped event
    // isn't permanently retired by a check that was never going to fire it.
    const ev = { ...withAppearance(), endWhen: [{ kind: 'flag', flag: 'done', value: true }] };
    gameMap.metadata.events = [ev];
    engine.questState.setFlag('done', true);

    eventRunner.checkAndFireOnInteract(X, Y);
    expect(eventRunner.autoResolved.has('powerOn')).toBe(false);
  });
});

describe('Marker survives the tile -> ground-container handoff', () => {
  it('keeps eventId, isEventMarker and groundPriority', async () => {
    // The link the whole intended workflow hangs on: the player steps onto the
    // switch, InventoryManager.syncWithMap pulls the tile's items and rebuilds
    // them with Item.fromJSON, and the ground-panel click handler then needs
    // item.eventId to know what to fire. Lose it here and clicking the switch
    // silently does nothing.
    const { Item } = await import('../../client/src/game/inventory/Item.js');
    const { syncEventMarkers } = await import('../../client/src/game/quest/EventMarkers.js');

    gameMap.metadata.events = [withAppearance()];
    syncEventMarkers({ firedOnce: new Set(), autoResolved: new Set() });

    const pulled = gameMap.getItemsFromTile(X, Y); // what syncWithMap calls
    expect(pulled).toHaveLength(1);

    const rebuilt = Item.fromJSON(pulled[0]);
    expect(rebuilt.defId).toBe('placeable.switch_off');
    expect(rebuilt.eventId).toBe('powerOn');
    expect(rebuilt.isEventMarker).toBe(true);
    expect(rebuilt.groundPriority).toBe(true);
  });
});

describe('Activating a marker through its item', () => {
  it('runs the event the clicked item is branded with', () => {
    // What UniversalGrid does with a clicked marker: fireItemEvent(item.eventId,
    // { dialogReplay: false, requireActive: true }).
    gameMap.metadata.events = [withAppearance()];
    eventRunner.activateEvent(withAppearance(), { dialogReplay: false, requireActive: true });
    expect(engine.questState.getFlag('mainPower')).toBe(true);
  });

  it('refuses to run when the event is no longer active', () => {
    // Guards against a stale sprite: requireActive re-checks rather than
    // trusting whatever the player clicked.
    gameMap.metadata.events = [withAppearance()];
    engine.questState.setFlag('mainPower', true); // precondition now fails
    eventRunner.activateEvent(withAppearance(), { dialogReplay: false, requireActive: true });
    expect(eventRunner.activeRun).toBeNull();
  });

  it('does not replay dialog for an already-run one-shot marker event', () => {
    // dialogReplay is for the "?" help item only; a switch that has fired should
    // do nothing rather than pop a stale dialog.
    const ev = {
      ...withAppearance(),
      id: 'oneShot',
      repeat: 'once',
      steps: [{ type: 'dialog', speaker: '', text: 'clunk' }],
    };
    gameMap.metadata.events = [ev];
    eventRunner.firedOnce.add('oneShot');
    eventRunner.activateEvent(ev, { dialogReplay: false, requireActive: false });
    expect(eventRunner.activeRun).toBeNull();
  });
});
