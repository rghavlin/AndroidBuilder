import { describe, it, expect } from 'vitest';
import { makeOpenArena, walkCost, maxScavengeRadius, stopsAtDistance, compareVitals } from './apEconomy.js';

describe('AP economy (Phase 3 follow-up: scavenging range)', () => {
  it('a diagonal walk costs ~1.4 AP/tile via the real Pathfinding class', () => {
    const h = makeOpenArena({ seed: 1, size: 40 });
    const out = walkCost(h, 20, 20, 25, 25); // 5 tiles diagonal
    expect(out).toBeTruthy();
    expect(out.tiles).toBe(5);
    // 5 * 1.4 = 7.0, minus the every-5-tiles 0.5 bulk discount = 6.5
    expect(out.cost).toBeCloseTo(6.5, 1);
  });

  it('maxScavengeRadius grows with maxAp and shrinks when stops reserve AP', () => {
    const h = makeOpenArena({ seed: 2, size: 60 });
    const free = maxScavengeRadius(h, 22, { stops: 0 });
    const reserved = maxScavengeRadius(h, 22, { stops: 3, searchCostPerStop: 2 });
    expect(free.radius).toBeGreaterThan(0);
    expect(reserved.radius).toBeLessThanOrEqual(free.radius);

    const lowAp = maxScavengeRadius(h, 14, { stops: 0 });
    const highAp = maxScavengeRadius(h, 26, { stops: 0 });
    expect(highAp.radius).toBeGreaterThan(lowAp.radius);
  });

  it('stopsAtDistance reports fewer stops at lower maxAp for the same trip', () => {
    const h = makeOpenArena({ seed: 3, size: 60 });
    const low = stopsAtDistance(h, 14, 8, { searchCostPerStop: 1 });
    const high = stopsAtDistance(h, 26, 8, { searchCostPerStop: 1 });
    expect(low.stops).toBeLessThanOrEqual(high.stops);
    expect(low.roundTripCost).toBe(high.roundTripCost); // same trip, same cost
  });

  it('compareVitals produces one row per config with a real formation of numbers', () => {
    const rows = compareVitals(
      [{ label: 'current-default', maxAp: 22 }, { label: 'candidate-default', maxAp: 21 }],
      { referenceDistance: 8, searchCostPerStop: 1 },
    );
    expect(rows).toHaveLength(2);
    for (const r of rows) {
      expect(r.freeLootRadius).toBeGreaterThan(0);
      expect(r.stopsAt8).toBeTruthy();
    }
  });
});
