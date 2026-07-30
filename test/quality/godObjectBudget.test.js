// Enforces the "do not grow the god-objects" half of the managed-decomposition
// rule in AGENTS.md §6.
//
// Prose in CLAUDE.md did not hold: between 2026-07-21 (when Wave 4 was written)
// and 2026-07-30, all four measured god-objects got bigger, not smaller —
// InventoryManager 3335→3346, Entity 1257→1293, GameMap 1650→1685,
// Item 1788→1812. "Extract opportunistically" quietly became "never", because
// nothing ever said no. This test says no.
//
// Growth fails. Meaningful shrinkage also fails, asking you to ratchet the
// budget down, so an extraction can't leave slack behind for the file to
// silently re-grow into.
import { describe, it, expect } from 'vitest';
import {
  GOD_OBJECTS,
  SHRINK_SLACK,
  countLines,
  readBudget,
} from '../../scripts/godObjectBudget.mjs';

const budgetFile = readBudget();

describe('god-object line budgets', () => {
  it('has a budget recorded for every tracked god-object', () => {
    expect(budgetFile, 'scripts/god-object-budget.json is missing — run `npm run budget:update -- --init`').not.toBeNull();
    for (const file of GOD_OBJECTS) {
      expect(budgetFile.budgets[file], `no budget recorded for ${file}`).toBeTypeOf('number');
    }
  });

  for (const file of GOD_OBJECTS) {
    it(`${file} stays within its budget`, () => {
      const budget = budgetFile.budgets[file];
      const actual = countLines(file);

      if (actual > budget) {
        throw new Error(
          `${file} grew to ${actual} lines, over its budget of ${budget} (+${actual - budget}).\n\n` +
            'This file is under managed decomposition (AGENTS.md §6). Put the new behavior in a\n' +
            'system/module instead, or extract a seam here to pay for it — see Wave 4 in\n' +
            'CODE_QUALITY_ACTION_PLAN.md for the mapped-out targets.\n\n' +
            'If the growth is genuinely warranted, raise the number in\n' +
            'scripts/god-object-budget.json by hand so the decision is visible in the diff.',
        );
      }

      if (budget - actual > SHRINK_SLACK) {
        throw new Error(
          `${file} is down to ${actual} lines, ${budget - actual} under its budget of ${budget}.\n\n` +
            'Nice — now lock it in: run `npm run budget:update` so the file can never grow\n' +
            'back into that space.',
        );
      }

      expect(actual).toBeLessThanOrEqual(budget);
    });
  }
});
