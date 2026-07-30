// Shared helpers for the god-object line budget.
//
// The god-objects listed in AGENTS.md §6 are under managed decomposition: the
// rule is "don't grow them, extract a seam when you touch one". The first half
// of that rule is enforceable by a machine, so it is enforced here — every one
// of these files carries a line budget, and the budget only ever ratchets DOWN.
//
// Consumed by:
//   test/quality/godObjectBudget.test.js  — fails `npm test` on growth
//   scripts/update-god-budget.mjs         — `npm run budget:update`, re-baselines
import { readFileSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const BUDGET_PATH = resolve(REPO_ROOT, 'scripts/god-object-budget.json');

// Repo-relative, POSIX separators — these strings are the keys in the JSON and
// appear verbatim in failure messages, so keep them stable.
export const GOD_OBJECTS = [
  'client/src/game/entities/Entity.js',
  'client/src/game/map/GameMap.js',
  'client/src/game/inventory/InventoryManager.js',
  'client/src/game/inventory/Item.js',
  'client/src/game/map/LootGenerator.js',
  'client/src/game/managers/SimulationManager.js',
  'client/src/pages/editor.tsx',
];

// A file may shrink by this much before you are asked to ratchet the budget
// down. Keeps incidental deletions from nagging, without letting real
// extractions leave behind slack you can silently re-grow into.
export const SHRINK_SLACK = 20;

/** Newline count, matching `wc -l` for files with a trailing newline. */
export function countLines(relPath) {
  const text = readFileSync(resolve(REPO_ROOT, relPath), 'utf8');
  const lines = text.split('\n');
  return text.endsWith('\n') ? lines.length - 1 : lines.length;
}

export function readBudget() {
  if (!existsSync(BUDGET_PATH)) return null;
  return JSON.parse(readFileSync(BUDGET_PATH, 'utf8'));
}

/** Current size of every god-object, keyed by repo-relative path. */
export function measureAll() {
  return Object.fromEntries(GOD_OBJECTS.map((f) => [f, countLines(f)]));
}
