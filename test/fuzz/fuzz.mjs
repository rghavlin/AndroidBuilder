#!/usr/bin/env node
// Fuzz CLI — random-walker bot over the game's simulation core.
//
// Usage:
//   npm run fuzz -- [--seeds=N] [--start-seed=N] [--turns=N] [--zombies=N] [--out=DIR]
//   npm run fuzz -- replay <crash-file.json>
//
// Runs `seeds` seeds (default 50) starting at `start-seed` (default 1). On any
// exception or invariant violation it writes a crash dump JSON (seed + full ops
// log) to `out` (default ./fuzz-crashes) and exits non-zero, so CI catches it.
// Replay re-applies a crash dump's ops deterministically to reproduce it.

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fuzzSeed, replayLog } from './fuzzer.js';

function parseArgs(argv) {
  const out = { _: [] };
  for (const arg of argv) {
    if (arg.startsWith('--')) {
      const [k, v] = arg.slice(2).split('=');
      out[k] = v === undefined ? true : v;
    } else {
      out._.push(arg);
    }
  }
  return out;
}

function num(v, dflt) {
  const n = Number(v);
  return Number.isFinite(n) ? n : dflt;
}

const args = parseArgs(process.argv.slice(2));

// ---- Replay subcommand ---------------------------------------------------
if (args._[0] === 'replay') {
  const file = args._[1];
  if (!file) {
    console.error('Usage: npm run fuzz -- replay <crash-file.json>');
    process.exit(2);
  }
  const dump = JSON.parse(readFileSync(file, 'utf8'));
  console.log(`Replaying crash for seed ${dump.seed} (${dump.ops.length} ops)...`);
  const result = replayLog(dump.seed, dump.ops, { width: dump.config?.width, height: dump.config?.height });
  if (result.ok) {
    console.log('✅ Replay completed WITHOUT reproducing the failure (non-determinism? or already fixed).');
    process.exit(0);
  } else {
    console.log(`❌ Reproduced: ${result.reason} at op ${result.opIndex ?? '?'}`);
    if (result.issues) console.log('   issues:', result.issues.join('; '));
    if (result.error) console.log('   error:', result.error.message, '\n', result.error.stack);
    process.exit(1);
  }
}

// ---- Fuzz run ------------------------------------------------------------
const startSeed = num(args['start-seed'], 1);
const seeds = num(args.seeds, 50);
const config = {
  turns: num(args.turns, 200),
  zombies: num(args.zombies, 5),
  width: num(args.width, 25),
  height: num(args.height, 25),
};
const outDir = typeof args.out === 'string' ? args.out : 'fuzz-crashes';

console.log(`[fuzz] seeds ${startSeed}..${startSeed + seeds - 1}, ${config.turns} turns, ${config.zombies} zombies`);

let crashes = 0;
let deaths = 0;
let completed = 0;
const t0 = Date.now();

for (let i = 0; i < seeds; i++) {
  const seed = startSeed + i;
  const result = fuzzSeed({ seed, ...config });

  if (!result.ok) {
    crashes++;
    mkdirSync(outDir, { recursive: true });
    const file = join(outDir, `crash-seed-${seed}.json`);
    writeFileSync(file, JSON.stringify({
      seed,
      reason: result.reason,
      atTurn: result.atTurn,
      issues: result.issues,
      error: result.error,
      config,
      finalSnapshot: result.finalSnapshot,
      ops: result.ops,
    }, null, 2));
    console.error(`  ❌ seed ${seed}: ${result.reason}${result.atTurn >= 0 ? ` @turn ${result.atTurn}` : ''} -> ${file}`);
    if (result.issues) console.error(`     ${result.issues.join('; ')}`);
    if (result.error) console.error(`     ${result.error.message}`);
  } else if (result.reason === 'player-died') {
    deaths++;
  } else {
    completed++;
  }
}

const secs = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`[fuzz] done in ${secs}s — ${completed} completed, ${deaths} player-died, ${crashes} crashes`);
process.exit(crashes > 0 ? 1 : 0);
