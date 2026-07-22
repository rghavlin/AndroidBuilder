import { describe, it, expect, beforeEach } from 'vitest';
// Wave 2 P1 (R20#5): rollPlayerRanged's scope/laser/default branches read
// stats.accuracyFalloff / stats.minAccuracy with no fallback. A scoped weapon
// whose rangedStats omit them made hitChance NaN, so `roll <= NaN` is always
// false — every shot beyond the scope's free-range silently missed forever.
// The fix supplies `?? ` fallbacks; these prove a hit is now possible.
import { CombatResolver } from '../../client/src/game/systems/CombatResolver.js';
import { gameRandom } from '../../client/src/game/utils/SeededRandom.js';

// A scoped weapon def MISSING accuracyFalloff and minAccuracy entirely.
const brokenScopeStats = { damage: { min: 5, max: 10 } };

function fireManyAtLongRange() {
  let hits = 0;
  gameRandom.seed(12345);
  for (let i = 0; i < 400; i++) {
    const r = CombatResolver.rollPlayerRanged({
      stats: brokenScopeStats,
      skillLvl: 0,
      drunkenness: 0,
      squaresAway: 30,      // well past the scope's 15-tile free range
      hasScope: true,
      currentAgility: 20,
      currentPerception: 20,
    });
    if (r.hit) hits++;
  }
  return hits;
}

describe('Wave 2 P1 · rollPlayerRanged accuracy fallbacks (R20#5)', () => {
  beforeEach(() => gameRandom.seed(1));

  it('a scoped weapon with no falloff/minAccuracy stats can still land hits', () => {
    // Pre-fix: NaN hitChance => 0 hits over any number of rolls.
    // Post-fix: floor of ~0.1 => a meaningful fraction of hits.
    expect(fireManyAtLongRange()).toBeGreaterThan(0);
  });

  it('never returns a NaN-driven result object', () => {
    gameRandom.seed(7);
    const r = CombatResolver.rollPlayerRanged({
      stats: brokenScopeStats,
      skillLvl: 0,
      squaresAway: 40,
      hasScope: true,
    });
    expect(typeof r.hit).toBe('boolean');
    expect(Number.isNaN(r.damage)).toBe(false);
  });
});
