#!/usr/bin/env node
// Balance simulator CLI.
//
// Usage:
//   npm run balance -- --scenario=shotgun_vs_10 [--runs=1000] [--start-seed=1]
//                      [--zombies=N] [--con=N] [--agi=N] [--per=N] [--str=N]
//                      [--maxhp=N] [--maxap=N] [--json=out.json] [--csv=out.csv]
//   npm run balance -- --scenario=melee_vs_4 --sweep=constitution --from=15 --to=35 --step=5 [--runs=200]
//   npm run balance -- --list
//
// Runs the scenario across `runs` seeds and prints an aggregate summary. --sweep
// varies one knob across [from,to] by step and prints a curve. Optional per-run
// dumps to JSON/CSV.

import { writeFileSync } from 'node:fs';
import { runBalance, runSweep } from './balance.js';
import { SCENARIOS, getScenario } from './scenarios.js';

function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    if (arg.startsWith('--')) {
      const [k, v] = arg.slice(2).split('=');
      out[k] = v === undefined ? true : v;
    }
  }
  return out;
}
const num = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);

const args = parseArgs(process.argv.slice(2));

if (args.list) {
  console.log('Scenarios:');
  for (const [name, s] of Object.entries(SCENARIOS)) {
    const w = s.player.weapon || 'unarmed';
    console.log(`  ${name.padEnd(18)} ${w} vs ${s.zombies.count} ${s.zombies.subtype}`);
  }
  process.exit(0);
}

const scenarioName = args.scenario || 'shotgun_vs_10';
const base = getScenario(scenarioName);
if (!base) {
  console.error(`Unknown scenario "${scenarioName}". Try --list.`);
  process.exit(2);
}

// Shallow-clone so CLI overrides don't mutate the shared definition.
const scenario = {
  ...base,
  player: { ...base.player, attributes: { ...(base.player.attributes || {}) } },
  zombies: { ...base.zombies },
};
if (args.zombies !== undefined) scenario.zombies.count = num(args.zombies, scenario.zombies.count);
if (args.turns !== undefined) scenario.turnCap = num(args.turns, scenario.turnCap);
if (args.maxhp !== undefined) scenario.player.maxHp = num(args.maxhp, scenario.player.maxHp);
if (args.maxap !== undefined) scenario.player.maxAp = num(args.maxap, scenario.player.maxAp);
// Attribute overrides -> derived HP/AP (and combat rolls).
for (const [flag, key] of [['con', 'constitution'], ['agi', 'agility'], ['per', 'perception'], ['str', 'strength']]) {
  if (args[flag] !== undefined) scenario.player.attributes[key] = num(args[flag], undefined);
}

const runs = num(args.runs, args.sweep ? 200 : 1000);
const startSeed = num(args['start-seed'], 1);

// ---- Sweep mode ----------------------------------------------------------
if (args.sweep) {
  const knob = String(args.sweep);
  const from = num(args.from, undefined);
  const to = num(args.to, undefined);
  const step = num(args.step, 1);
  if (from === undefined || to === undefined) {
    console.error('--sweep requires --from and --to (and optionally --step).');
    process.exit(2);
  }
  console.log(`[balance] ${scenario.name}: sweep ${knob} ${from}..${to} step ${step}, ${runs} runs each`);
  const t0 = Date.now();
  const rows = runSweep(scenario, { knob, from, to, step, runs, startSeed });
  const secs = ((Date.now() - t0) / 1000).toFixed(1);

  console.log(`\n=== ${scenario.name}: ${knob} sweep (${runs} runs/point, ${secs}s) ===`);
  console.log(`  ${knob.padEnd(12)} maxHP  maxAP  win%   loss%  timeout%  avgTurns  avgDmgTaken  hpLeft(win)`);
  for (const r of rows) {
    console.log(
      `  ${String(r.value).padEnd(12)} ${String(r.maxHp).padEnd(6)} ${String(r.maxAp).padEnd(6)} ${String(r.winRate).padEnd(6)} ${String(r.lossRate).padEnd(6)} ${String(r.timeoutRate).padEnd(9)} ${String(r.avgTurns).padEnd(9)} ${String(r.avgDamageTaken).padEnd(12)} ${r.avgHpEndOnWin}`,
    );
  }
  if (typeof args.csv === 'string') {
    const header = 'value,maxHp,maxAp,winRate,lossRate,timeoutRate,avgTurns,avgDamageTaken,avgHpEndOnWin';
    const lines = rows.map((r) => [r.value, r.maxHp, r.maxAp, r.winRate, r.lossRate, r.timeoutRate, r.avgTurns, r.avgDamageTaken, r.avgHpEndOnWin].join(','));
    writeFileSync(args.csv, [header, ...lines].join('\n'));
    console.log(`\nWrote sweep CSV -> ${args.csv}`);
  }
  process.exit(0);
}

console.log(`[balance] ${scenario.name}: ${runs} runs (seeds ${startSeed}..${startSeed + runs - 1})`);
const t0 = Date.now();
const summary = runBalance(scenario, { runs, startSeed });
const secs = ((Date.now() - t0) / 1000).toFixed(1);

const rows = [
  ['maxHP / maxAP', `${summary.maxHp} / ${summary.maxAp}`],
  ['win %', summary.winRate],
  ['loss %', summary.lossRate],
  ['timeout %', summary.timeoutRate],
  ['avg turns', summary.avgTurns],
  ['avg turns-to-win', summary.avgTurnsToWin],
  ['avg kills', summary.avgKills],
  ['avg HP left (win)', summary.avgHpEndOnWin],
  ['avg dmg dealt', summary.avgDamageDealt],
  ['avg dmg taken', summary.avgDamageTaken],
  ['avg shots', summary.avgShots],
  ['avg swings', summary.avgSwings],
];
console.log(`\n=== ${summary.scenario} (${runs} runs, ${secs}s) ===`);
for (const [k, v] of rows) console.log(`  ${String(k).padEnd(20)} ${v}`);

if (typeof args.json === 'string') {
  writeFileSync(args.json, JSON.stringify(summary, null, 2));
  console.log(`\nWrote per-run JSON -> ${args.json}`);
}
if (typeof args.csv === 'string') {
  const header = 'seed,outcome,turns,kills,zombiesRemaining,hpStart,hpEnd,damageTaken,damageDealt,shots,swings';
  const lines = summary.results.map((r) => [
    r.seed, r.outcome, r.turns, r.kills, r.zombiesRemaining, r.hpStart, r.hpEnd, r.damageTaken, r.damageDealt, r.shots, r.swings,
  ].join(','));
  writeFileSync(args.csv, [header, ...lines].join('\n'));
  console.log(`Wrote per-run CSV -> ${args.csv}`);
}
