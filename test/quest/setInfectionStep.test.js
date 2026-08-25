import { describe, it, expect, beforeEach } from 'vitest';
// The map editor's "Infect / cure player (zombie virus)" event step. This is the
// lethal viral clock (SurvivalCascade.tickInfection), not the recoverable
// Disease/sickness counter and not a rag-bound wound infection — those are
// separate systems that happen to share the word "infected".
import engine from '../../client/src/game/GameEngine.js';
import { GameMap } from '../../client/src/game/map/GameMap.js';
import { EntityFactory } from '../../client/src/game/EntityFactory.js';
import eventRunner from '../../client/src/game/quest/EventRunner.js';
import { DEFAULT_INFECTION_HOURS } from '../../client/src/game/utils/SurvivalCascade.js';

let gameMap, player;

/** Run a one-step event; setInfection resolves synchronously. */
function runStep(step, id = 'inf-test') {
  eventRunner.activeRun = null;
  eventRunner.runEvent({ id, steps: [step] });
}

beforeEach(() => {
  gameMap = new GameMap(10, 10);
  gameMap.initializeMap();
  gameMap.metadata = {};
  player = EntityFactory.createPlayer(5, 5);
  gameMap.addEntity(player, 5, 5);
  engine.gameMap = gameMap;
  engine.player = player;
  eventRunner.activeRun = null;
  eventRunner.firedOnce.clear();
});

describe('setInfection event step', () => {
  it('infects the player on the standard clock', () => {
    expect(player.isInfected).toBe(false);

    runStep({ type: 'setInfection', infected: true });

    expect(player.isInfected).toBe(true);
    expect(player.infectionTicksRemaining).toBe(DEFAULT_INFECTION_HOURS);
  });

  it('defaults to infecting when the step omits the flag', () => {
    runStep({ type: 'setInfection' });
    expect(player.isInfected).toBe(true);
  });

  it('honours an authored lethal countdown', () => {
    runStep({ type: 'setInfection', infected: true, infectionHours: 3 });

    expect(player.isInfected).toBe(true);
    expect(player.infectionTicksRemaining).toBe(3);
  });

  it('does not reset a countdown already ticking', () => {
    runStep({ type: 'setInfection', infected: true });
    player.infectionTicksRemaining = 5; // five hours of play have passed

    runStep({ type: 'setInfection', infected: true }, 'inf-again');

    expect(player.infectionTicksRemaining).toBe(5);
  });

  it('re-times an existing infection when the hours are explicit', () => {
    runStep({ type: 'setInfection', infected: true });
    player.infectionTicksRemaining = 20;

    runStep({ type: 'setInfection', infected: true, infectionHours: 2 }, 'inf-hurry');

    expect(player.isInfected).toBe(true);
    expect(player.infectionTicksRemaining).toBe(2);
  });

  it('cures the infection and drops any treatment in progress', () => {
    runStep({ type: 'setInfection', infected: true, infectionHours: 4 });
    // Mid brain-pulp treatment when the cure lands.
    player.treatmentTicksRemaining = 6;
    player.treatmentSubtype = 'basic';
    player.treatmentName = 'Zombie brain pulp';

    runStep({ type: 'setInfection', infected: false }, 'inf-cure');

    expect(player.isInfected).toBe(false);
    expect(player.infectionTicksRemaining).toBe(DEFAULT_INFECTION_HOURS);
    expect(player.treatmentTicksRemaining).toBe(0);
    expect(player.treatmentSubtype).toBeNull();
    expect(player.treatmentName).toBeNull();
  });

  it('curing an uninfected player is a harmless no-op', () => {
    runStep({ type: 'setInfection', infected: false });

    expect(player.isInfected).toBe(false);
    expect(player.infectionTicksRemaining).toBe(DEFAULT_INFECTION_HOURS);
  });

  it('leaves the separate sickness and wound-infection systems alone', () => {
    player.sickness = 8;
    player.woundInfection = true;

    runStep({ type: 'setInfection', infected: true });

    expect(player.isInfected).toBe(true);
    expect(player.sickness).toBe(8);
    expect(player.woundInfection).toBe(true);
  });

  it('runs the following steps in the same event', () => {
    engine.questState.setFlag('inf_done', false);

    eventRunner.activeRun = null;
    eventRunner.runEvent({
      id: 'inf-chain',
      steps: [
        { type: 'setInfection', infected: true },
        { type: 'setFlag', flag: 'inf_done', value: true },
      ],
    });

    expect(player.isInfected).toBe(true);
    expect(engine.questState.getFlag('inf_done')).toBe(true);
  });
});
