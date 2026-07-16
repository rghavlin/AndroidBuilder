#!/usr/bin/env node
// AP-economy CLI — scavenging-range comparison across maxAp values.
//
// Usage:
//   npm run ap-economy -- --ap=14,21,22,26 [--ref=8] [--search-cost=1] [--seed=1]
//
// Prints, for each maxAp value: the max ROUND-TRIP radius reachable with free
// looting (0 stops), the max radius with 3 locked containers (2 AP each), and how
// many `--search-cost`-AP stops fit at a fixed reference distance.

import { compareVitals } from './apEconomy.js';

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
const apValues = String(args.ap || '14,18,21,22,24,26')
  .split(',')
  .map((s) => Number(s.trim()))
  .filter((n) => Number.isFinite(n));

const referenceDistance = num(args.ref, 8);
const searchCostPerStop = num(args['search-cost'], 1);
const arenaSeed = num(args.seed, 1);

const configs = apValues.map((maxAp) => ({ label: `AP=${maxAp}`, maxAp }));
const rows = compareVitals(configs, { referenceDistance, searchCostPerStop, arenaSeed });

console.log(`\n=== AP economy: open-arena scavenging range (ref distance ${referenceDistance} tiles, ${searchCostPerStop} AP/stop) ===`);
console.log(`  maxAP   freeLootRadius   lockedLootRadius(3x2AP)   stopsAt${referenceDistance}   roundTripCostAt${referenceDistance}   apLeftAt${referenceDistance}`);
for (const r of rows) {
  const s = r.stopsAt8;
  console.log(
    `  ${String(r.maxAp).padEnd(7)} ${String(r.freeLootRadius).padEnd(16)} ${String(r.lockedLootRadius).padEnd(25)} ${String(s.stops).padEnd(12)} ${String(s.roundTripCost).padEnd(18)} ${s.leftover}`,
  );
}
console.log('\n(freeLootRadius/lockedLootRadius are the farthest a round trip can reach on ONE full AP bar;');
console.log(' stopsAt<ref> is how many search-cost-AP actions fit after walking a round trip of the reference distance.)');
