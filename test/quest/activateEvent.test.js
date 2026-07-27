import { describe, it, expect, beforeEach } from 'vitest';
// EventRunner.activateEvent — the path behind a clicked help/switch item
// (GameContext.fireHelpEvent / fireDialogAtPlayerTile).
//
// Regression: those callers used to hard-filter the event down to its `dialog`
// steps before running it, so a hand-placed switch wired to a setLightMode /
// controlEntity / setFlag event showed its dialog and did nothing else. The
// filter existed to stop a re-read tutorial from re-granting its items, so the
// rule is now "full run the first time, dialog-only replay after that".
import engine from '../../client/src/game/GameEngine.js';
import { GameMap } from '../../client/src/game/map/GameMap.js';
import { Entity, EntityType } from '../../client/src/game/entities/Entity.js';
import eventRunner from '../../client/src/game/quest/EventRunner.js';

let gameMap;

beforeEach(() => {
  gameMap = new GameMap(20, 20);
  gameMap.initializeMap();
  gameMap.metadata = { lightMode: 'always_dark', alwaysDark: true };
  engine.gameMap = gameMap;
  engine.player = new Entity({ id: 'ae-player', type: EntityType.PLAYER, x: 10, y: 10 });
  gameMap.addEntity(engine.player);
  eventRunner.activeRun = null;
  eventRunner.firedOnce.clear();
  eventRunner.lastFiredTurn.clear();
});

/** A switch-style event: does something, then says something. */
const lightSwitch = (id = 'lightsOn') => ({
  id,
  repeat: 'once',
  trigger: 'onInteract',
  placement: { kind: 'chainOnly' },
  steps: [
    { type: 'setLightMode', lightMode: 'always_light' },
    { type: 'dialog', speaker: '', text: 'lights on' },
  ],
});

describe('EventRunner.activateEvent', () => {
  it('runs non-dialog steps on first activation', () => {
    eventRunner.activateEvent(lightSwitch());
    expect(gameMap.metadata.lightMode).toBe('always_light');
    // It still reaches the dialog step and blocks there for the player.
    expect(eventRunner.activeRun?.event.steps[eventRunner.activeRun.stepIndex].type).toBe('dialog');
  });

  it('replays only dialog steps once a repeat:once event has run', () => {
    eventRunner.activateEvent(lightSwitch());
    eventRunner.activeRun = null;

    // Simulate the world moving on, then re-clicking the item.
    gameMap.metadata.lightMode = 'always_dark';
    gameMap.metadata.alwaysDark = true;
    eventRunner.activateEvent(lightSwitch());

    expect(gameMap.metadata.lightMode).toBe('always_dark'); // side effect NOT repeated
    expect(eventRunner.activeRun?.event.steps).toHaveLength(1);
    expect(eventRunner.activeRun?.event.steps[0].type).toBe('dialog');
  });

  it('does not re-grant items on replay', () => {
    const ev = {
      id: 'tutorial',
      repeat: 'once',
      placement: { kind: 'tile', x: 10, y: 10 },
      steps: [
        { type: 'setFlag', flag: 'sawTutorial', value: true },
        { type: 'dialog', speaker: '', text: 'watch this' },
      ],
    };
    eventRunner.activateEvent(ev);
    eventRunner.activeRun = null;
    eventRunner.activateEvent(ev);
    expect(eventRunner.activeRun?.event.steps).toHaveLength(1);
    expect(eventRunner.activeRun?.event.steps[0].type).toBe('dialog');
  });

  it('runs repeat:everyTime events in full every activation', () => {
    const ev = { ...lightSwitch('toggle'), repeat: 'everyTime' };
    eventRunner.activateEvent(ev);
    eventRunner.activeRun = null;
    gameMap.metadata.lightMode = 'always_dark';
    gameMap.metadata.alwaysDark = true;

    eventRunner.activateEvent(ev);
    expect(gameMap.metadata.lightMode).toBe('always_light');
  });

  it('runs a step-only event that has no dialog at all', () => {
    eventRunner.activateEvent({
      id: 'silentSwitch',
      repeat: 'everyTime',
      placement: { kind: 'chainOnly' },
      steps: [{ type: 'setLightMode', lightMode: 'always_light' }],
    });
    expect(gameMap.metadata.lightMode).toBe('always_light');
  });

  it('ignores an empty or missing event', () => {
    expect(() => eventRunner.activateEvent(null)).not.toThrow();
    expect(() => eventRunner.activateEvent({ id: 'x', steps: [] })).not.toThrow();
    expect(eventRunner.activeRun).toBeNull();
  });
});
