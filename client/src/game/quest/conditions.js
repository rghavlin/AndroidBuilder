/**
 * Condition evaluator for event preconditions / end-conditions. Engine-free
 * (takes an explicit ctx) so it's unit-testable without booting the game.
 *
 * ctx: { inventoryManager, questState }
 */

function compare(a, op, b) {
  switch (op) {
    case '==': return a === b;
    case '!=': return a !== b;
    case '>=': return a >= b;
    case '<=': return a <= b;
    case '>':  return a > b;
    case '<':  return a < b;
    default:   return false;
  }
}

export function evalCondition(cond, ctx) {
  if (!cond) return false;
  const inv = ctx?.inventoryManager;
  const qs = ctx?.questState;

  switch (cond.kind) {
    case 'none':
      return true;
    case 'itemEquipped':
      return !!inv && inv.isItemEquipped(cond.defId);
    case 'itemInInventory':
      return !!inv && inv.hasItemByDefId(cond.defId, cond.count ?? 1);
    case 'flag':
      return !!qs && qs.getFlag(cond.flag) === !!cond.value;
    case 'var':
      return !!qs && compare(qs.getVar(cond.var), cond.op, cond.value);
    default:
      return false;
  }
}

/** AND-only. An empty/missing condition list is vacuously true. */
export function evalAll(conds, ctx) {
  if (!conds || conds.length === 0) return true;
  return conds.every(cond => evalCondition(cond, ctx));
}
