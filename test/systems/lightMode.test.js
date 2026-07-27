import { describe, it, expect, beforeEach } from 'vitest';
// Map light modes. `always_light` (powered interior) and `always_dark`
// (unpowered interior) are defined as *pinned clock hours* — noon and midnight —
// rather than as their own lighting rules, so they must be indistinguishable
// from a standard time_dependent map at that hour, whatever the clock says.
// These tests exist because the modes previously had hand-written branches in
// four separate files, any of which could silently drift from the day/night path.
import engine from '../../client/src/game/GameEngine.js';
import { GameMap } from '../../client/src/game/map/GameMap.js';
import { Entity, EntityType } from '../../client/src/game/entities/Entity.js';
import eventRunner from '../../client/src/game/quest/EventRunner.js';
import {
  MAX_VISION_RANGE,
  getEffectiveHour,
  getLightMode,
  isNightHour,
} from '../../client/src/game/config/VisionConfig.js';

// getHourFromTurn is (6 + turn - 1) % 24.
const TURN_NOON = 7;
const TURN_MIDNIGHT = 19;
const TURN_0200 = 21;

let gameMap;

function setup() {
  gameMap = new GameMap(30, 30);
  gameMap.initializeMap();
  gameMap.metadata = {};
  engine.gameMap = gameMap;
  const player = new Entity({ id: 'lm-player', type: EntityType.PLAYER, x: 15, y: 15 });
  engine.player = player;
  gameMap.addEntity(player);
  eventRunner.activeRun = null;
}

/** Visible-tile set for a given map light mode / clock hour / gear loadout. */
function fovFor({ lightMode, turn, isFlashlightOn = false, isNightVision = false }) {
  gameMap.metadata.lightMode = lightMode;
  gameMap.metadata.alwaysDark = lightMode === 'always_dark';
  engine.turn = turn;
  engine.setFOVOptions({
    isNight: false, // deliberately wrong: the map's effective hour must win
    isFlashlightOn,
    flashlightRange: 8,
    isNightVision,
    maxRange: MAX_VISION_RANGE,
  });
  engine.invalidateFOV();
  engine.recalculateFOV();
  return new Set(engine.playerFieldOfView.map(p => `${Math.round(p.x)},${Math.round(p.y)}`));
}

describe('VisionConfig light-mode helpers', () => {
  it('normalizes the legacy alwaysDark flag', () => {
    expect(getLightMode({ alwaysDark: true })).toBe('always_dark');
    expect(getLightMode({ alwaysDark: false })).toBe('time_dependent');
    expect(getLightMode(undefined)).toBe('time_dependent');
    expect(getLightMode({ lightMode: 'always_light', alwaysDark: true })).toBe('always_light');
  });

  it('pins always_light to noon and always_dark to midnight', () => {
    for (const hour of [0, 6, 12, 21]) {
      expect(getEffectiveHour({ lightMode: 'always_light' }, hour)).toBe(12);
      expect(getEffectiveHour({ lightMode: 'always_dark' }, hour)).toBe(0);
      expect(getEffectiveHour({ lightMode: 'time_dependent' }, hour)).toBe(hour);
    }
  });

  it('agrees with the day/night boundary used by the clock', () => {
    expect(isNightHour(12)).toBe(false);
    expect(isNightHour(0)).toBe(true);
    expect([...Array(24).keys()].filter(isNightHour)).toEqual([0, 1, 2, 3, 4, 5, 20, 21, 22, 23]);
  });
});

describe('always_light is a standard map at noon', () => {
  beforeEach(setup);

  it('matches noon regardless of what the clock reads', () => {
    const noon = fovFor({ lightMode: 'time_dependent', turn: TURN_NOON });
    expect(noon.size).toBeGreaterThan(100); // sanity: full daylight range
    expect(fovFor({ lightMode: 'always_light', turn: TURN_NOON })).toEqual(noon);
    expect(fovFor({ lightMode: 'always_light', turn: TURN_0200 })).toEqual(noon);
    expect(fovFor({ lightMode: 'always_light', turn: TURN_MIDNIGHT })).toEqual(noon);
  });

  it('treats a flashlight as the no-op it is at noon', () => {
    const noonFl = fovFor({ lightMode: 'time_dependent', turn: TURN_NOON, isFlashlightOn: true });
    expect(fovFor({ lightMode: 'always_light', turn: TURN_0200, isFlashlightOn: true })).toEqual(noonFl);
  });

  it('blinds night vision exactly as noon does', () => {
    const noonNvg = fovFor({ lightMode: 'time_dependent', turn: TURN_NOON, isFlashlightOn: true, isNightVision: true });
    expect(fovFor({ lightMode: 'always_light', turn: TURN_0200, isFlashlightOn: true, isNightVision: true })).toEqual(noonNvg);
  });

  it('is not night for tinting purposes', () => {
    expect(isNightHour(getEffectiveHour({ lightMode: 'always_light' }, 2))).toBe(false);
  });
});

describe('always_dark is a standard map at midnight', () => {
  beforeEach(setup);

  it('matches midnight regardless of what the clock reads', () => {
    const midnight = fovFor({ lightMode: 'time_dependent', turn: TURN_MIDNIGHT });
    expect(fovFor({ lightMode: 'always_dark', turn: TURN_NOON })).toEqual(midnight);
  });

  it('lets a flashlight extend vision exactly as it does at midnight', () => {
    const midnightFl = fovFor({ lightMode: 'time_dependent', turn: TURN_MIDNIGHT, isFlashlightOn: true });
    const darkFl = fovFor({ lightMode: 'always_dark', turn: TURN_NOON, isFlashlightOn: true });
    expect(darkFl).toEqual(midnightFl);
    expect(darkFl.size).toBeGreaterThan(fovFor({ lightMode: 'always_dark', turn: TURN_NOON }).size);
  });
});

describe('setLightMode event step', () => {
  beforeEach(setup);

  it('flips a live map to noon and back to midnight', () => {
    const noon = fovFor({ lightMode: 'time_dependent', turn: TURN_NOON });
    const midnight = fovFor({ lightMode: 'time_dependent', turn: TURN_MIDNIGHT });

    // Start unpowered, on a clock that reads noon: the map must still be dark.
    fovFor({ lightMode: 'always_dark', turn: TURN_NOON });
    expect(new Set(engine.playerFieldOfView.map(p => `${Math.round(p.x)},${Math.round(p.y)}`))).toEqual(midnight);

    eventRunner.runEvent({ id: 'lm-on', steps: [{ type: 'setLightMode', lightMode: 'always_light' }] });
    expect(gameMap.metadata.lightMode).toBe('always_light');
    expect(gameMap.metadata.alwaysDark).toBe(false); // legacy flag kept in sync
    expect(new Set(engine.playerFieldOfView.map(p => `${Math.round(p.x)},${Math.round(p.y)}`))).toEqual(noon);

    eventRunner.activeRun = null;
    eventRunner.runEvent({ id: 'lm-off', steps: [{ type: 'setLightMode', lightMode: 'always_dark' }] });
    expect(gameMap.metadata.lightMode).toBe('always_dark');
    expect(gameMap.metadata.alwaysDark).toBe(true);
    expect(new Set(engine.playerFieldOfView.map(p => `${Math.round(p.x)},${Math.round(p.y)}`))).toEqual(midnight);
  });

  it('falls back to time_dependent when the step has no mode', () => {
    gameMap.metadata.lightMode = 'always_dark';
    eventRunner.activeRun = null;
    eventRunner.runEvent({ id: 'lm-bad', steps: [{ type: 'setLightMode' }] });
    expect(gameMap.metadata.lightMode).toBe('time_dependent');
    expect(gameMap.metadata.alwaysDark).toBe(false);
  });
});
