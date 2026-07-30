// Ratchet the god-object line budgets down to their current sizes.
//
//   npm run budget:update
//
// This script will LOWER a budget but never RAISE one. That asymmetry is the
// whole point: extractions lock in permanently, and growth cannot be waved
// through with a command. If a god-object genuinely has to get bigger, edit
// scripts/god-object-budget.json by hand — that way the increase lands in the
// diff as a deliberate line someone has to justify, instead of drifting up
// unnoticed a few lines per commit.
import { writeFileSync } from 'fs';
import { BUDGET_PATH, GOD_OBJECTS, measureAll, readBudget } from './godObjectBudget.mjs';

const init = process.argv.includes('--init');
const existing = readBudget();

if (!existing && !init) {
  console.error(`No budget file at ${BUDGET_PATH}. Run with --init to create one.`);
  process.exit(1);
}

const actual = measureAll();
const budgets = existing ? { ...existing.budgets } : {};
const lowered = [];
const refused = [];

for (const file of GOD_OBJECTS) {
  const current = actual[file];
  const budget = budgets[file];

  if (budget === undefined) {
    budgets[file] = current;
    lowered.push(`  + ${file}: baseline set at ${current}`);
  } else if (current < budget) {
    budgets[file] = current;
    lowered.push(`  ↓ ${file}: ${budget} → ${current} (−${budget - current})`);
  } else if (current > budget) {
    refused.push(`  ✗ ${file}: ${current} lines vs budget ${budget} (+${current - budget})`);
  }
}

// Drop stale keys for files no longer tracked, so the JSON can't accumulate
// budgets for paths that have been renamed or fully decomposed.
for (const key of Object.keys(budgets)) {
  if (!GOD_OBJECTS.includes(key)) delete budgets[key];
}

if (refused.length) {
  console.error('Refusing to raise a budget. These files are OVER their limit:\n');
  console.error(refused.join('\n'));
  console.error(
    '\nExtract a seam (CODE_QUALITY_ACTION_PLAN.md, Wave 4) so the file fits, or edit\n' +
      'scripts/god-object-budget.json by hand if the growth is genuinely warranted.',
  );
  process.exit(1);
}

if (!lowered.length) {
  console.log('All god-object budgets already match current sizes. Nothing to ratchet.');
  process.exit(0);
}

writeFileSync(
  BUDGET_PATH,
  `${JSON.stringify(
    {
      $comment:
        'Line budgets for the god-objects in AGENTS.md §6. Lowered by `npm run budget:update`; ' +
        'enforced by test/quality/godObjectBudget.test.js. Raising a number here should be a ' +
        'deliberate, reviewed decision.',
      budgets,
    },
    null,
    2,
  )}\n`,
  'utf8',
);

console.log('Ratcheted god-object budgets:\n');
console.log(lowered.join('\n'));
console.log(`\nWrote ${BUDGET_PATH}`);
