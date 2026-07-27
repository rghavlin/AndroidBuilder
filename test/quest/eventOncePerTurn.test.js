import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
// repeat:'oncePerTurn' — an auto/parallel event fires while its preconditions
// prevail, but at most once per game turn (keyed on engine.turn). It re-fires
// on the next turn if conditions still hold. See EventRunner._isEligible /
// runEvent and eventTypes.ts RepeatMode.
import eventRunner from '../../client/src/game/quest/EventRunner.js';
import engine from '../../client/src/game/GameEngine.js';

// A no-op 'give' (no defId) advances and ends the run synchronously, so each
// runEvent call resolves fully before checkAutoEvents returns.
const autoEvent = () => ({
  id: 'perTurn',
  trigger: 'auto',
  placement: { kind: 'chainOnly' },
  preconditions: [],
  repeat: 'oncePerTurn',
  steps: [{ type: 'give' }],
});

describe('EventRunner · repeat:oncePerTurn throttle', () => {
  let savedGameMap, savedPhase, savedTurn;
  beforeEach(() => {
    savedGameMap = engine.gameMap;
    savedPhase = engine.turnPhase;
    savedTurn = engine.turn;
    engine.turn = 5;
    engine.gameMap = { metadata: { events: [autoEvent()] } };
    eventRunner.activeRun = null;
    eventRunner.firedOnce = new Set();
    eventRunner.autoResolved = new Set();
    eventRunner.lastFiredTurn = new Map();
  });
  afterEach(() => {
    engine.gameMap = savedGameMap;
    engine.turnPhase = savedPhase;
    engine.turn = savedTurn;
    eventRunner.activeRun = null;
    eventRunner.lastFiredTurn = new Map();
  });

  it('fires once when conditions prevail, but not a second time the same turn', () => {
    const runSpy = vi.spyOn(eventRunner, 'runEvent');
    eventRunner.checkAutoEvents();
    eventRunner.checkAutoEvents(); // still turn 5 — throttled
    eventRunner.checkAutoEvents();
    expect(runSpy).toHaveBeenCalledTimes(1);
    expect(eventRunner.lastFiredTurn.get('perTurn')).toBe(5);
    runSpy.mockRestore();
  });

  it('re-fires once the turn advances', () => {
    const runSpy = vi.spyOn(eventRunner, 'runEvent');
    eventRunner.checkAutoEvents(); // turn 5 → fires
    engine.turn = 6;
    eventRunner.checkAutoEvents(); // turn 6 → fires again
    eventRunner.checkAutoEvents(); // still turn 6 → throttled
    expect(runSpy).toHaveBeenCalledTimes(2);
    expect(eventRunner.lastFiredTurn.get('perTurn')).toBe(6);
    runSpy.mockRestore();
  });

  it('persists the throttle across toJSON/fromJSON within a turn', () => {
    eventRunner.checkAutoEvents(); // fires on turn 5
    const saved = eventRunner.toJSON();
    // Simulate a save/load on the same turn.
    eventRunner.activeRun = null;
    eventRunner.lastFiredTurn = new Map();
    eventRunner.fromJSON(saved);
    const runSpy = vi.spyOn(eventRunner, 'runEvent');
    eventRunner.checkAutoEvents(); // still turn 5 — must stay throttled
    expect(runSpy).not.toHaveBeenCalled();
    runSpy.mockRestore();
  });
});
