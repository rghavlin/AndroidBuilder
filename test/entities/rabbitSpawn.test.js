import { describe, it, expect } from 'vitest';
// Wave 2 P1 (R14#4): Rabbit's constructor set hp before maxHp. The hp setter
// clamps to health.max, so setting hp first (against whatever default max the
// Health component has) risks silently zeroing/clamping it — it "worked" only
// by luck of the default. Constructor now sets maxHp before hp (like Door).
import { Rabbit } from '../../client/src/game/entities/Rabbit.js';

describe('Wave 2 P1 · Rabbit spawns with correct HP (R14#4)', () => {
  it('has hp === maxHp === 5 and never spawns dead', () => {
    const rabbit = new Rabbit('rabbit-test', 0, 0);
    expect(rabbit.maxHp).toBe(5);
    expect(rabbit.hp).toBe(5);
    expect(rabbit.hp).toBeLessThanOrEqual(rabbit.maxHp);
    expect(rabbit.hp).toBeGreaterThan(0);
  });
});
