import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
// Dialog step `dontShowAgain`: ticking the checkbox on dismiss remembers the
// event (DismissedEvents, localStorage) so it never becomes eligible again —
// even after eventRunner.reset() (new game / start-map Reset).
import eventRunner from '../../client/src/game/quest/EventRunner.js';
import engine from '../../client/src/game/GameEngine.js';
import { isEventDismissed, clearDismissedEvents } from '../../client/src/game/quest/DismissedEvents.js';

const introEvent = (dontShowAgain = true) => ({
  id: 'Game intro',
  trigger: 'auto',
  placement: { kind: 'chainOnly' },
  preconditions: [],
  repeat: 'everyTime',
  steps: [{ type: 'dialog', speaker: '', text: 'Welcome', ...(dontShowAgain ? { dontShowAgain: true } : {}) }],
});

describe('EventRunner · dialog "Don\'t show this again"', () => {
  let savedGameMap, savedPhase;
  const setEvents = (events) => { engine.gameMap = { metadata: { events } }; };

  beforeEach(() => {
    savedGameMap = engine.gameMap;
    savedPhase = engine.turnPhase;
    clearDismissedEvents();
    eventRunner.reset();
  });
  afterEach(() => {
    eventRunner.activeRun = null;
    engine.gameMap = savedGameMap;
    engine.turnPhase = savedPhase;
    clearDismissedEvents();
  });

  it('fires normally until the player ticks the box', () => {
    setEvents([introEvent()]);
    eventRunner.checkAutoEvents();
    expect(eventRunner.getActiveEventId()).toBe('Game intro');
    eventRunner.advance(); // dismissed without ticking
    expect(isEventDismissed('Game intro')).toBe(false);
  });

  it('suppresses the event once dismissed with the box ticked, surviving reset()', () => {
    setEvents([introEvent()]);
    eventRunner.checkAutoEvents();
    eventRunner.advance({ dontShowAgain: true });
    expect(eventRunner.isRunning()).toBe(false);
    expect(isEventDismissed('Game intro')).toBe(true);

    eventRunner.reset(); // new game / reload
    const runSpy = vi.spyOn(eventRunner, 'runEvent');
    eventRunner.checkAutoEvents();
    expect(runSpy).not.toHaveBeenCalled();
    runSpy.mockRestore();
  });

  it('ignores the tick on a dialog step that does not offer the option', () => {
    setEvents([introEvent(false)]);
    eventRunner.checkAutoEvents();
    eventRunner.advance({ dontShowAgain: true });
    expect(isEventDismissed('Game intro')).toBe(false);
  });
});
