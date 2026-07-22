import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
// Wave 2 P1 (R42#2): EventRunner chained events with no cycle detection — a
// chain of non-blocking steps that loops (A->B->A, A->A) recursed synchronously
// through runEvent -> _processCurrentStep until the stack overflowed. A
// per-chain visited set + depth cap now aborts the chain cleanly.
import eventRunner from '../../client/src/game/quest/EventRunner.js';
import engine from '../../client/src/game/GameEngine.js';

// trigger:'manual' so the post-abort checkAutoEvents (which only re-fires
// 'auto'/'parallel' events) never re-runs these fixtures.
const chainEvent = (id, toId) => ({ id, trigger: 'manual', steps: [{ type: 'chain', eventId: toId }] });

describe('Wave 2 P1 · EventRunner chain cycle detection (R42#2)', () => {
  let savedGameMap, savedPhase;
  beforeEach(() => {
    savedGameMap = engine.gameMap;
    savedPhase = engine.turnPhase;
    eventRunner.activeRun = null;
  });
  afterEach(() => {
    engine.gameMap = savedGameMap;
    engine.turnPhase = savedPhase;
    eventRunner.activeRun = null;
  });

  it('A -> B -> A aborts instead of overflowing the stack', () => {
    engine.gameMap = { metadata: { events: [chainEvent('A', 'B'), chainEvent('B', 'A')] } };
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => eventRunner.runEvent(engine.gameMap.metadata.events[0])).not.toThrow();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
    expect(eventRunner.activeRun).toBe(null);
    expect(engine.turnPhase).toBe('PLAYER_TURN');
  });

  it('A -> A self-chain aborts', () => {
    engine.gameMap = { metadata: { events: [chainEvent('A', 'A')] } };
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => eventRunner.runEvent(engine.gameMap.metadata.events[0])).not.toThrow();
    warn.mockRestore();
    expect(eventRunner.activeRun).toBe(null);
    expect(engine.turnPhase).toBe('PLAYER_TURN');
  });

  it('a long acyclic chain (A -> B -> C) still completes, not falsely aborted', () => {
    const events = [
      chainEvent('A', 'B'),
      chainEvent('B', 'C'),
      // C ends the chain with a no-op step (give with no defId just advances).
      { id: 'C', trigger: 'manual', steps: [{ type: 'give' }] },
    ];
    engine.gameMap = { metadata: { events } };
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => eventRunner.runEvent(events[0])).not.toThrow();
    // No cycle/limit warning should fire for a legitimate acyclic chain.
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
    expect(eventRunner.activeRun).toBe(null);
    expect(engine.turnPhase).toBe('PLAYER_TURN');
  });
});
