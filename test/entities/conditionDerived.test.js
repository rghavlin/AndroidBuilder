import { describe, it, expect } from 'vitest';
// Regression coverage for the derived `condition` getter. Bug: the getter
// returns 'Bleeding'/'Diseased'/etc. computed from real flags, but several
// per-turn stat-sync paths read it and wrote it back through the setter,
// poisoning the stored fallback (stats.condition). After the underlying flag
// cleared (e.g. bandaging a bleed) the stale string survived, pinning
// condition off 'Normal' and blocking HP regen forever.
import { Entity } from '../../client/src/game/entities/Entity.js';

describe('Entity.condition (derived) — stored-fallback guard', () => {
  it('reports Bleeding while isBleeding, then Normal after it clears', () => {
    const p = new Entity('p1', 'player');
    p.setBleeding(true);
    expect(p.condition).toBe('Bleeding');
    p.setBleeding(false);
    expect(p.condition).toBe('Normal');
  });

  it('ignores a stored condition poisoned with a derived keyword', () => {
    const p = new Entity('p2', 'player');
    // Simulate the old round-trip: getter value written back through the setter.
    p.condition = 'Bleeding';
    // With the flag NOT set, the stored keyword must not leak through.
    expect(p.isBleeding).toBe(false);
    expect(p.condition).toBe('Normal');
  });

  it('surviving a bleed round-trip does not block the Normal state', () => {
    const p = new Entity('p3', 'player');
    p.setBleeding(true);
    p.condition = p.condition; // the poisoning write-back that used to happen
    p.setBleeding(false);
    expect(p.condition).toBe('Normal');
  });

  it('still honors a genuine custom (non-derived) stored condition', () => {
    const p = new Entity('p4', 'player');
    p.condition = 'Exhausted';
    expect(p.condition).toBe('Exhausted');
  });
});
