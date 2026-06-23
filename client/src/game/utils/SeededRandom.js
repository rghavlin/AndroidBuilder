/**
 * SeededRandom — deterministic PRNG for reproducible gameplay.
 *
 * Uses the mulberry32 algorithm (fast, 32-bit state, good distribution).
 * Provides helper methods for common patterns: integers, booleans,
 * array picking, and an unbiased Fisher-Yates shuffle.
 *
 * Usage:
 *   import { SeededRandom, gameRandom } from './SeededRandom.js';
 *
 *   // Global singleton (seeded once at game start):
 *   gameRandom.seed(12345);
 *   gameRandom.next();          // 0..1
 *   gameRandom.nextInt(1, 6);   // 1..6
 *   gameRandom.shuffle(arr);    // in-place Fisher-Yates
 *
 *   // Per-subsystem instance:
 *   const mapRng = new SeededRandom(baseSeed + mapNumber);
 */

export class SeededRandom {
  /**
   * @param {number} [seed] - Integer seed. If omitted, uses a random seed.
   */
  constructor(seed) {
    this._state = 0;
    this.seed(seed !== undefined ? seed : (Math.random() * 0xFFFFFFFF) >>> 0);
  }

  /**
   * Re-seed the generator. Resets all state.
   * @param {number} seed - Integer seed (will be coerced to uint32).
   */
  seed(seed) {
    this._state = seed >>> 0;
  }

  /**
   * Returns the next float in [0, 1). Core PRNG (mulberry32).
   * @returns {number}
   */
  next() {
    this._state |= 0;
    this._state = (this._state + 0x6d2b79f5) | 0;
    let t = Math.imul(this._state ^ (this._state >>> 15), 1 | this._state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns a random integer in [min, max] (inclusive).
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  nextInt(min, max) {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /**
   * Returns true with the given probability (0..1).
   * @param {number} [chance=0.5]
   * @returns {boolean}
   */
  nextBool(chance = 0.5) {
    return this.next() < chance;
  }

  /**
   * Pick a random element from an array.
   * @template T
   * @param {T[]} arr
   * @returns {T}
   */
  pick(arr) {
    return arr[Math.floor(this.next() * arr.length)];
  }

  /**
   * Unbiased in-place Fisher-Yates shuffle. Returns the array.
   * @template T
   * @param {T[]} arr
   * @returns {T[]}
   */
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }
}

/**
 * Backward-compatible factory: returns a bare function () => float.
 * Used by RoadNetwork which expects a plain function, not a class.
 * @param {number} seed
 * @returns {() => number}
 */
export function makeSeededRandom(seed) {
  const rng = new SeededRandom(seed);
  return () => rng.next();
}

/**
 * Global game PRNG singleton.
 * Seeded once at game start; subsystems use it directly or derive children.
 */
export const gameRandom = new SeededRandom();
