import { describe, it, expect } from 'vitest';
import { fuzzSeed, replayLog } from './fuzzer.js';

// Smoke coverage for the fuzz bot: a short run over several seeds must not
// crash or violate invariants, and a run's recorded ops must replay to the
// same final state (proving crash dumps are reproducible).
describe('Fuzzer (Phase 2 random-walker)', () => {
  it('runs several seeds cleanly (no exceptions, no invariant violations)', () => {
    for (let seed = 1; seed <= 6; seed++) {
      const result = fuzzSeed({ seed, turns: 40, zombies: 4, width: 20, height: 20 });
      // ok===true covers both 'completed' and 'player-died'; a crash would be ok:false.
      expect(result.ok, `seed ${seed}: ${result.reason} ${JSON.stringify(result.issues || result.error || '')}`).toBe(true);
      expect(result.ops.length).toBeGreaterThan(0);
    }
  });

  it('replays a run deterministically to the same final state', () => {
    const seed = 3;
    const cfg = { turns: 40, zombies: 4, width: 20, height: 20 };
    const run = fuzzSeed({ seed, ...cfg });
    expect(run.ok).toBe(true);

    const replay = replayLog(seed, run.ops, { width: cfg.width, height: cfg.height });
    expect(replay.ok).toBe(true);
    // Same seed + same recorded ops => identical end state.
    expect(replay.finalSnapshot.player).toEqual(run.finalSnapshot.player);
    expect(replay.finalSnapshot.livingEnemies).toBe(run.finalSnapshot.livingEnemies);
  });
});
