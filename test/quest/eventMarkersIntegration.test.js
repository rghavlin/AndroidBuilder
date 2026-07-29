import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
// Event appearances through the REAL map-load path.
//
// eventMarkers.test.js drives syncEventMarkers against a hand-built
// `gameMap.metadata`, which proves the reconciliation maths but skips every
// piece of wiring in between. When an author reported no marker appearing
// in-game, all of those unit tests still passed — the suspicion was that
// `metadata.events` wasn't surviving the trip from scenario JSON to the live
// map, or that the map-ready call order was wrong.
//
// So this file starts from an actual scenario file on disk and runs the same
// calls the game does: TemplateMapGenerator.generateFromScenario (which is what
// GameInitializationManager invokes), then the GameContext map-ready sequence
// applyMapRegistries -> checkAutoEvents -> onMapLoaded.
import engine from '../../client/src/game/GameEngine.js';
import { GameMap } from '../../client/src/game/map/GameMap.js';
import { TemplateMapGenerator } from '../../client/src/game/map/TemplateMapGenerator.js';
import { QuestState, applyMapRegistries } from '../../client/src/game/quest/QuestState.js';
import { Entity, EntityType } from '../../client/src/game/entities/Entity.js';
import eventRunner from '../../client/src/game/quest/EventRunner.js';
import { resolveMapEvents } from '../../client/src/game/quest/migrateEvents.js';

const SCENARIO = path.resolve('customMaps/eventItemTest.scenario.json');
const SWITCH_X = 9;
const SWITCH_Y = 9;

const hasScenario = fs.existsSync(SCENARIO);
const markersAt = (gameMap, x, y) =>
  gameMap.getItemsOnTile(x, y).filter(i => i.isEventMarker);

/**
 * Everything GameInitializationManager + GameContext do between "player picked a
 * scenario" and "map is playable", in the same order.
 */
async function loadScenario(scenarioData) {
  const gen = new TemplateMapGenerator();
  const mapData = await gen.generateFromScenario(scenarioData);
  const gameMap = new GameMap(mapData.width, mapData.height);
  await gen.applyToGameMap(gameMap, mapData);

  engine.gameMap = gameMap;
  engine.questState = new QuestState();
  engine.inventoryManager = null; // player is not standing on the switch tile
  engine.player = new Entity({ id: 'emi-player', type: EntityType.PLAYER, x: 1, y: 1 });

  eventRunner.reset();
  // GameContext's [isInitialized] effect, verbatim.
  applyMapRegistries(engine.questState, engine.gameMap);
  eventRunner.checkAutoEvents();
  eventRunner.onMapLoaded();

  return gameMap;
}

describe.skipIf(!hasScenario)('Event appearances — real scenario load path', () => {
  let scenarioData;

  beforeEach(() => {
    scenarioData = JSON.parse(fs.readFileSync(SCENARIO, 'utf8'));
  });

  it('carries `appearance` from scenario JSON onto the live map metadata', async () => {
    // The link most likely to break silently: metadata.events has to survive
    // generateFromScenario and applyToGameMap's structuredClone.
    const gameMap = await loadScenario(scenarioData);
    const events = resolveMapEvents(gameMap.metadata);

    expect(events.length).toBeGreaterThan(0);
    const withAppearance = events.filter(e => e?.appearance?.defId);
    expect(withAppearance.length).toBeGreaterThan(0);
  });

  it('seeds the registry flag so a precondition can be evaluated', async () => {
    await loadScenario(scenarioData);
    // Registry declares the flag with no initialValue, so it must seed to false.
    expect(engine.questState.getFlag('lightOn')).toBe(false);
  });

  it('places the marker for the eligible event on its placement tile', async () => {
    const gameMap = await loadScenario(scenarioData);
    const markers = markersAt(gameMap, SWITCH_X, SWITCH_Y);

    expect(markers).toHaveLength(1);
    expect(markers[0].isEventMarker).toBe(true);
    // Branded with the event that owns it, so a click knows what to run.
    expect(markers[0].eventId).toBeTruthy();
  });

  it('swaps the marker when the gating flag flips', async () => {
    // Authored as a pair on one tile with opposite flag preconditions, so the
    // sprite must follow the flag. Uses whatever the scenario actually declares
    // rather than hard-coding defIds, so re-authoring the map can't break this.
    const gameMap = await loadScenario(scenarioData);
    const events = resolveMapEvents(gameMap.metadata);

    const offEvent = events.find(e =>
      e?.appearance?.defId && e.preconditions?.some(c => c.kind === 'flag' && c.value === false));
    const onEvent = events.find(e =>
      e?.appearance?.defId && e.preconditions?.some(c => c.kind === 'flag' && c.value === true));
    if (!offEvent || !onEvent) return; // map isn't authored as a toggle pair

    expect(markersAt(gameMap, SWITCH_X, SWITCH_Y)[0].eventId).toBe(offEvent.id);

    const flag = offEvent.preconditions.find(c => c.kind === 'flag').flag;
    engine.questState.setFlag(flag, true);
    eventRunner.syncMarkers();

    const after = markersAt(gameMap, SWITCH_X, SWITCH_Y);
    expect(after).toHaveLength(1);
    expect(after[0].eventId).toBe(onEvent.id);
  });

  it('keeps exactly one marker across repeated syncs and flag churn', async () => {
    const gameMap = await loadScenario(scenarioData);
    for (const v of [true, false, true, false]) {
      engine.questState.setFlag('lightOn', v);
      eventRunner.syncMarkers();
      eventRunner.syncMarkers();
      expect(markersAt(gameMap, SWITCH_X, SWITCH_Y)).toHaveLength(1);
    }
  });

  it('does not touch the tile when the sprite does not actually change', async () => {
    // This map currently uses the SAME defId for both halves of the pair, so
    // flipping the flag hands ownership to the other event without changing what
    // is drawn. Reconciliation should recognise that and leave the tile alone
    // rather than churning entities every sync.
    const gameMap = await loadScenario(scenarioData);
    const events = resolveMapEvents(gameMap.metadata);
    const defIds = new Set(events.filter(e => e?.appearance?.defId).map(e => e.appearance.defId));
    if (defIds.size !== 1) return; // map re-authored with distinct sprites

    const before = markersAt(gameMap, SWITCH_X, SWITCH_Y)[0].instanceId;
    engine.questState.setFlag('lightOn', true);
    eventRunner.syncMarkers();
    const after = markersAt(gameMap, SWITCH_X, SWITCH_Y)[0];
    expect(after.instanceId).toBe(before); // same entity reused
  });

  it('requests a repaint when the sprite really does change', async () => {
    // The canvas only redraws on request (MapCanvas's rAF loop), so mutating
    // tile contents without notifying leaves the new sprite invisible until the
    // slow safety interval fires.
    const gameMap = await loadScenario(scenarioData);
    const events = resolveMapEvents(gameMap.metadata);
    const onEvent = events.find(e =>
      e?.appearance?.defId && e.preconditions?.some(c => c.kind === 'flag' && c.value === true));
    if (!onEvent) return;
    // Force a genuinely different sprite for the "on" half, independent of how
    // the map happens to be authored today.
    onEvent.appearance.defId = 'placeable.switch_on';

    let notified = 0;
    const original = engine.notifyUpdate.bind(engine);
    engine.notifyUpdate = () => { notified += 1; original(); };
    try {
      engine.questState.setFlag('lightOn', true);
      eventRunner.syncMarkers();
    } finally {
      engine.notifyUpdate = original;
    }

    const after = markersAt(gameMap, SWITCH_X, SWITCH_Y);
    expect(after).toHaveLength(1);
    expect(after[0].defId).toBe('placeable.switch_on');
    expect(notified).toBeGreaterThan(0);
  });
});
