import { describe, it, expect, beforeEach } from 'vitest';
// New-game intro: an infected survivor spawns above the player, talks in
// speech bubbles, then vanishes (despawnEntity step).
import engine from '../../client/src/game/GameEngine.js';
import { GameMap } from '../../client/src/game/map/GameMap.js';
import { EntityFactory } from '../../client/src/game/EntityFactory.js';
import eventRunner from '../../client/src/game/quest/EventRunner.js';
import { startIntroEncounter, INTRO_NPC_TAG } from '../../client/src/game/quest/IntroEncounter.js';

let gameMap, player;

const introNpcs = () => [...gameMap.entityMap.values()].filter(e => e.registryTag === INTRO_NPC_TAG);

beforeEach(() => {
  gameMap = new GameMap(10, 10);
  gameMap.initializeMap();
  gameMap.metadata = {};
  player = EntityFactory.createPlayer(5, 5);
  player.name = 'Alex';
  gameMap.addEntity(player, 5, 5);
  engine.gameMap = gameMap;
  engine.player = player;
  eventRunner.activeRun = null;
});

describe('intro encounter', () => {
  it('spawns the survivor directly above the player and opens with their warning', () => {
    expect(startIntroEncounter()).toBe(true);

    const [npc] = introNpcs();
    expect(npc).toBeTruthy();
    expect(npc.logicalX).toBe(5);
    expect(npc.logicalY).toBe(4);
    expect(npc.aiDisabled).toBe(true);

    const bubble = eventRunner.getActiveSpeechStep();
    expect(bubble.text).toBe("Stay back! I'm infected!");
    expect(bubble.anchorX).toBe(5);
    expect(bubble.anchorY).toBe(4);
  });

  it('alternates speakers, anchoring the player lines on the player', () => {
    startIntroEncounter();
    eventRunner.advance();
    const bubble = eventRunner.getActiveSpeechStep();
    expect(bubble.speaker).toBe('Alex');
    expect(bubble.anchorX).toBe(5);
    expect(bubble.anchorY).toBe(5);
  });

  it('removes the survivor once the last line is dismissed', () => {
    startIntroEncounter();
    let guard = 0;
    while (eventRunner.isRunning() && guard++ < 50) eventRunner.advance();

    expect(eventRunner.isRunning()).toBe(false);
    expect(introNpcs()).toHaveLength(0);
    expect(engine.turnPhase).toBe('PLAYER_TURN');
  });

  it('falls back to another neighbour when the tile above is blocked', () => {
    gameMap.getTile(5, 4).terrain = 'wall';
    startIntroEncounter();
    const [npc] = introNpcs();
    expect(npc).toBeTruthy();
    expect(Math.abs(npc.logicalX - 5) <= 1 && Math.abs(npc.logicalY - 5) <= 1).toBe(true);
    expect(npc.logicalX === 5 && npc.logicalY === 4).toBe(false);
  });

  it('waits for an already-running event before starting', async () => {
    eventRunner.runEvent({ id: 'setup', steps: [{ type: 'speech', text: 'hi', anchorX: 0, anchorY: 0 }] });
    startIntroEncounter();
    expect(introNpcs()).toHaveLength(0);

    eventRunner.advance(); // setup ends
    await new Promise(r => setTimeout(r, 5));
    expect(introNpcs()).toHaveLength(1);
    expect(eventRunner.getActiveEventId()).toBe('intro_infected_survivor');
  });
});
