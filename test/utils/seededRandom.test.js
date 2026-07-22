import { describe, it, expect } from 'vitest';
import { SeededRandom, makeSeededRandom, gameRandom } from '../../client/src/game/utils/SeededRandom.js';

describe('SeededRandom unit tests', () => {
  it('produces identical output sequence for identical seeds', () => {
    const rng1 = new SeededRandom(12345);
    const rng2 = new SeededRandom(12345);

    const seq1 = Array.from({ length: 10 }, () => rng1.next());
    const seq2 = Array.from({ length: 10 }, () => rng2.next());

    expect(seq1).toEqual(seq2);
  });

  it('produces different sequences for different seeds', () => {
    const rng1 = new SeededRandom(100);
    const rng2 = new SeededRandom(200);

    const val1 = rng1.next();
    const val2 = rng2.next();

    expect(val1).not.toEqual(val2);
  });

  it('correctly captures and restores state via getState and setState', () => {
    const rng1 = new SeededRandom(999);

    // Burn 5 numbers
    for (let i = 0; i < 5; i++) rng1.next();

    // Capture state
    const savedState = rng1.getState();

    // Generate next 5 numbers
    const seqFromSaved = Array.from({ length: 5 }, () => rng1.next());

    // Create a new RNG and restore saved state
    const rng2 = new SeededRandom();
    rng2.setState(savedState);

    const seq2 = Array.from({ length: 5 }, () => rng2.next());

    expect(seq2).toEqual(seqFromSaved);
  });

  it('respects nextInt inclusive min and max bounds', () => {
    const rng = new SeededRandom(42);

    for (let i = 0; i < 1000; i++) {
      const val = rng.nextInt(1, 6);
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(6);
      expect(Number.isInteger(val)).toBe(true);
    }
  });

  it('nextBool honors the specified probability', () => {
    const rng = new SeededRandom(777);
    let trueCount = 0;
    const iterations = 2000;

    for (let i = 0; i < iterations; i++) {
      if (rng.nextBool(0.7)) trueCount++;
    }

    // Expect ~70% true (around 1400 out of 2000)
    const ratio = trueCount / iterations;
    expect(ratio).toBeGreaterThan(0.65);
    expect(ratio).toBeLessThan(0.75);
  });

  it('pick selects elements from an array deterministically', () => {
    const rng1 = new SeededRandom(555);
    const rng2 = new SeededRandom(555);
    const items = ['apple', 'banana', 'cherry', 'date', 'elderberry'];

    const pick1 = rng1.pick(items);
    const pick2 = rng2.pick(items);

    expect(pick1).toBe(pick2);
    expect(items).toContain(pick1);
  });

  it('shuffle performs an in-place unbiased Fisher-Yates shuffle preserving elements', () => {
    const rng = new SeededRandom(31415);
    const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const arrayToShuffle = [...original];

    const result = rng.shuffle(arrayToShuffle);

    expect(result).toBe(arrayToShuffle); // In-place
    expect(result.sort((a, b) => a - b)).toEqual(original); // Same elements
  });

  it('makeSeededRandom returns a function that produces deterministic floats', () => {
    const fn1 = makeSeededRandom(888);
    const fn2 = makeSeededRandom(888);

    const val1 = fn1();
    const val2 = fn2();

    expect(val1).toBe(val2);
    expect(typeof val1).toBe('number');
    expect(val1).toBeGreaterThanOrEqual(0);
    expect(val1).toBeLessThan(1);
  });
});
