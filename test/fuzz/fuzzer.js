// Fuzz core — random-walker over GameHarness. Importable (used by the CLI in
// fuzz.mjs and by fuzzer.test.js). See TESTING_STRATEGY_PLAN.md Phase 2.
//
// A run: bootstrap a seeded world, spawn some zombies at deterministic
// positions, then each turn pick random valid player actions until AP runs out
// (or a `wait` is chosen), end the turn, and check invariants throughout. Every
// operation is recorded to a flat `ops` log so a failure can be replayed
// deterministically (replayLog) and later turned into a regression test.
//
// Determinism: the SELECTION rng (which action to take) is a separate
// SeededRandom derived from the run seed, so a seed alone reproduces the action
// stream; the GAME rng (gameRandom, consumed by combat/AI) is seeded by the
// harness. Replay ignores the selection rng entirely and just applies the
// recorded actions, so it reproduces regardless.

import { GameHarness } from '../harness/GameHarness.js';
import { SeededRandom } from '../../client/src/game/utils/SeededRandom.js';

export const OP = { SPAWN: 'spawn', ACTION: 'action', END_TURN: 'endTurn' };

function safeSnapshot(h) {
  try {
    return h.snapshotState();
  } catch {
    return null;
  }
}

/**
 * Fuzz a single seed.
 * @param {object} [opts]
 * @param {number} [opts.seed=1]
 * @param {number} [opts.turns=200]
 * @param {number} [opts.zombies=5]
 * @param {number} [opts.width=25]
 * @param {number} [opts.height=25]
 * @param {number} [opts.maxActionsPerTurn=40]
 * @returns {{seed:number, ok:boolean, reason:string, turnsRun:number, ops:Array,
 *            finalSnapshot:object|null, issues?:string[], error?:object, atTurn?:number}}
 */
export function fuzzSeed(opts = {}) {
  const {
    seed = 1,
    turns = 200,
    zombies = 5,
    width = 25,
    height = 25,
    maxActionsPerTurn = 40,
  } = opts;

  // Selection rng distinct from the game's gameRandom stream.
  const sel = new SeededRandom((seed ^ 0x9e3779b9) >>> 0);
  const ops = [];
  const h = new GameHarness({ seed, width, height }).bootstrap();

  const p = GameHarness.pos(h.player);
  for (let i = 0; i < zombies; i++) {
    let x;
    let y;
    let tries = 0;
    do {
      x = sel.nextInt(0, width - 1);
      y = sel.nextInt(0, height - 1);
      tries++;
    } while (x === p.x && y === p.y && tries < 10);
    const id = `fz-${i}`;
    h.spawnZombie(x, y, 'standard', id);
    ops.push({ t: OP.SPAWN, x, y, subtype: 'standard', id });
  }

  const fail = (reason, extra = {}) => ({
    seed, ok: false, reason, ...extra, ops, finalSnapshot: safeSnapshot(h),
  });

  try {
    for (let turn = 0; turn < turns; turn++) {
      let acted = 0;
      while ((h.player.ap ?? 0) >= 1 && acted < maxActionsPerTurn) {
        const actions = h.enumerateValidActions();
        const action = actions[sel.nextInt(0, actions.length - 1)];
        ops.push({ t: OP.ACTION, action });
        h.applyPlayerAction(action);

        const issues = h.assertInvariants();
        if (issues.length) return fail('invariant-violation', { issues: issues.slice(), atTurn: turn });

        if (action.type === 'wait') break;
        acted++;
      }

      ops.push({ t: OP.END_TURN });
      h.endTurn();

      const issues = h.assertInvariants();
      if (issues.length) return fail('invariant-violation-endturn', { issues: issues.slice(), atTurn: turn });

      if ((h.player.hp ?? 1) <= 0) {
        return { seed, ok: true, reason: 'player-died', turnsRun: turn + 1, ops, finalSnapshot: h.snapshotState() };
      }
    }
  } catch (err) {
    return fail('exception', { error: { message: err?.message, stack: err?.stack }, atTurn: -1 });
  }

  return { seed, ok: true, reason: 'completed', turnsRun: turns, ops, finalSnapshot: h.snapshotState() };
}

/**
 * Deterministically replay a recorded ops log for a seed. Applies the exact
 * actions (ignoring the selection rng) and reports the first failure, if any.
 * @param {number} seed
 * @param {Array} ops  the recorded op log from fuzzSeed
 * @param {object} [opts] {width, height} must match the original run
 * @returns {{ok:boolean, reason:string, finalSnapshot:object|null, issues?:string[], error?:object, opIndex?:number}}
 */
export function replayLog(seed, ops, opts = {}) {
  const { width = 25, height = 25 } = opts;
  const h = new GameHarness({ seed, width, height }).bootstrap();

  try {
    for (let i = 0; i < ops.length; i++) {
      const op = ops[i];
      if (op.t === OP.SPAWN) {
        h.spawnZombie(op.x, op.y, op.subtype, op.id);
      } else if (op.t === OP.ACTION) {
        h.applyPlayerAction(op.action);
        const issues = h.assertInvariants();
        if (issues.length) {
          return { ok: false, reason: 'invariant-violation', issues, opIndex: i, finalSnapshot: safeSnapshot(h) };
        }
      } else if (op.t === OP.END_TURN) {
        h.endTurn();
        const issues = h.assertInvariants();
        if (issues.length) {
          return { ok: false, reason: 'invariant-violation-endturn', issues, opIndex: i, finalSnapshot: safeSnapshot(h) };
        }
      }
    }
  } catch (err) {
    return { ok: false, reason: 'exception', error: { message: err?.message, stack: err?.stack }, finalSnapshot: safeSnapshot(h) };
  }

  return { ok: true, reason: 'completed', finalSnapshot: safeSnapshot(h) };
}
