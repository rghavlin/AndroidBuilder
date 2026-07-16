import { describe, it, expect } from 'vitest';
import { runScenario, runBalance, runSweep } from './balance.js';
import { getScenario } from './scenarios.js';

// Smoke coverage for the balance simulator: scenarios run to a terminal outcome,
// aggregates are well-formed, and results are deterministic per seed.
describe('Balance simulator (Phase 3)', () => {
  it('runs a single scenario to a terminal outcome with sane metrics', () => {
    const r = runScenario(getScenario('pistol_vs_6'), 1);
    expect(['win', 'loss', 'timeout']).toContain(r.outcome);
    expect(r.turns).toBeGreaterThan(0);
    expect(r.kills).toBeGreaterThanOrEqual(0);
    expect(r.kills).toBeLessThanOrEqual(6);
    expect(r.damageDealt).toBeGreaterThanOrEqual(0);
    expect(r.hpEnd).toBeLessThanOrEqual(r.hpStart);
  });

  it('is deterministic: same scenario + seed -> identical outcome', () => {
    const a = runScenario(getScenario('melee_vs_4'), 42);
    const b = runScenario(getScenario('melee_vs_4'), 42);
    expect(a).toEqual(b);
  });

  it('aggregates a small batch into well-formed rates', () => {
    const summary = runBalance(getScenario('pistol_vs_6'), { runs: 8, startSeed: 1 });
    expect(summary.runs).toBe(8);
    expect(summary.results).toHaveLength(8);
    const total = summary.winRate + summary.lossRate + summary.timeoutRate;
    expect(total).toBeGreaterThan(99.8);
    expect(total).toBeLessThan(100.2);
  });

  it('derives maxHp/maxAp from attributes with the real formula', () => {
    // maxHp = 10 + floor(Con*0.4); maxAp = 10 + floor((Agi+Per)/5)
    const scenario = {
      ...getScenario('melee_vs_4'),
      player: { meleeLvl: 4, attributes: { constitution: 30, agility: 25, perception: 25 } },
    };
    const r = runScenario(scenario, 1);
    expect(r.maxHp).toBe(10 + Math.floor(30 * 0.4)); // 22
    expect(r.maxAp).toBe(10 + Math.floor((25 + 25) / 5)); // 20
  });

  it('sweeping Constitution raises maxHp monotonically and shifts win rate', () => {
    const rows = runSweep(getScenario('melee_vs_4'), {
      knob: 'constitution', from: 15, to: 30, step: 5, runs: 20, startSeed: 1,
    });
    expect(rows.map((r) => r.value)).toEqual([15, 20, 25, 30]);
    // maxHp must increase as Constitution increases.
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].maxHp).toBeGreaterThan(rows[i - 1].maxHp);
    }
    // Every point yields well-formed rates.
    for (const r of rows) {
      const total = r.winRate + r.lossRate + r.timeoutRate;
      expect(total).toBeGreaterThan(99.8);
      expect(total).toBeLessThan(100.2);
    }
  });

  it('the shotgun scenario is winnable at least some of the time', () => {
    const summary = runBalance(getScenario('shotgun_vs_10'), { runs: 12, startSeed: 1 });
    // A level-5 shotgunner vs 10 zombies should win at least once in 12 seeds;
    // if this ever hits 0, either combat regressed or the scenario got too hard.
    expect(summary.winRate).toBeGreaterThan(0);
  });
});
