/**
 * Condition evaluator for event preconditions / end-conditions. Engine-free
 * (takes an explicit ctx) so it's unit-testable without booting the game.
 *
 * ctx: { inventoryManager, questState, player }
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
    case 'itemConsumed':
      // Lifetime tally (see QuestState.recordConsumed), not current inventory —
      // stays true after the consumed item is gone.
      return !!qs && qs.getConsumed(cond.defId) >= (cond.count ?? 1);
    case 'flag':
      return !!qs && qs.getFlag(cond.flag) === !!cond.value;
    case 'var':
      return !!qs && compare(qs.getVar(cond.var), cond.op, cond.value);
    case 'ap':
      return !!ctx?.player && compare(ctx.player.ap, cond.op, cond.value);
    default:
      return false;
  }
}

/** AND-only. An empty/missing condition list is vacuously true. */
export function evalAll(conds, ctx) {
  if (!conds || conds.length === 0) return true;
  return conds.every(cond => evalCondition(cond, ctx));
}

/**
 * Is this event "live" — would interacting with it do anything right now?
 *
 * Side-effect free, unlike EventRunner._isEligible, which latches `autoResolved`
 * as it goes. That matters because this is also called every time map
 * appearances are reconciled (EventMarkers.js): merely *drawing* an event must
 * never mutate its firing state.
 *
 * Deliberately omits the `oncePerTurn` throttle that _isEligible applies. That
 * throttle governs how often an event may fire, not whether it still exists —
 * including it here would make a switch's sprite blink out of the world for the
 * rest of the turn the moment the player used it.
 *
 * Lives here rather than in EventRunner so EventMarkers can import it without
 * an import cycle (EventRunner drives EventMarkers, not the reverse).
 *
 * @param {Object} ev - the authored GameEvent
 * @param {Object} ctx - { inventoryManager, questState, player }
 * @param {{firedOnce: Set<string>, autoResolved: Set<string>}} latches - the runner
 */
export function isEventActive(ev, ctx, latches) {
  if (!ev || !ev.steps || ev.steps.length === 0) return false;
  if (ev.repeat === 'once' && latches.firedOnce.has(ev.id)) return false;
  if (latches.autoResolved.has(ev.id)) return false;
  // Read-only: _isEligible is the only place allowed to latch this.
  if (ev.endWhen && ev.endWhen.length > 0 && evalAll(ev.endWhen, ctx)) return false;
  return evalAll(ev.preconditions, ctx);
}
