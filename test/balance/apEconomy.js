// AP-economy simulator — models the OTHER half of the HP/AP tuning question:
// how far a player can scavenge on one turn's AP bar. See TESTING_STRATEGY_PLAN.md
// Phase 3 follow-up. Built to check the claim "most AP is spent moving around" and
// to quantify how a candidate maxAp formula affects scavenging range, not just combat.
//
// FIDELITY NOTE: this deliberately does NOT reuse GameHarness.applyPlayerAction's
// 'move' (which mirrors MovementSystem's flat 1-AP-per-step AI mover). A real
// player's click-to-walk movement goes through PlayerContext.startAnimatedMovement,
// which spends Pathfinding.calculateMovementCost — diagonal steps cost 1.4 AP (true
// sqrt(2) distance) vs 1.0 cardinal, and every 5 tiles of a path gets a -0.5 bulk
// discount. This module calls the real Pathfinding class directly so distances are
// faithful to what a player actually pays.
//
// MODEL: a "turn" is the unit that matters here, not a multi-turn campaign — AP
// fully refills every turn (GameContext.simulateTurn's pendingAPRefill), so the
// relevant question is "what can I get done on ONE full AP bar," which nutrition/
// hydration/energy (each -1/turn) then gates how often you can afford to spend.
// Container searching itself costs no AP in this codebase (grep confirms no
// search-AP sink); the AP sinks scavenging actually hits are movement plus
// occasional lockpick (1 AP) / pry-open (2 AP) / dig (5 AP) interactions — modeled
// here as a configurable `searchCostPerStop` per loot stop.

import { GameHarness } from '../harness/GameHarness.js';
import { Pathfinding } from '../../client/src/game/utils/Pathfinding.js';

/**
 * Real player movement cost (one-way) from (fromX,fromY) to (toX,toY), using the
 * actual pathfinder + cost function the game uses for click-to-walk.
 */
export function walkCost(h, fromX, fromY, toX, toY) {
  const path = Pathfinding.findPath(h.gameMap, fromX, fromY, toX, toY, { allowDiagonal: true, entity: h.player });
  if (!path || path.length === 0) return null;
  return { cost: Pathfinding.calculateMovementCost(h.gameMap, path, h.player), tiles: path.length - 1 };
}

/**
 * Build a harness with a large open arena (no obstacles) so distance and AP cost
 * are the only variables — isolates the HP/AP formula's effect from map layout.
 */
export function makeOpenArena({ seed = 1, size = 60 } = {}) {
  return new GameHarness({ seed, width: size, height: size, terrain: 'floor' }).bootstrap();
}

/**
 * For a straight diagonal walk (the cheapest path — 1.4/tile with the bulk
 * discount), find the maximum one-way Chebyshev distance a round trip can reach
 * on `maxAp`, after reserving `searchCostPerStop * stops` AP for actions at the
 * destination. Returns null if even distance 0 doesn't fit (shouldn't happen).
 */
export function maxScavengeRadius(h, maxAp, { stops = 1, searchCostPerStop = 0 } = {}) {
  const reserved = stops * searchCostPerStop;
  const budget = maxAp - reserved;
  if (budget <= 0) return { radius: 0, roundTripCost: 0, reserved, apLeft: maxAp };

  const cx = Math.floor(h.width / 2);
  const cy = Math.floor(h.height / 2);
  const maxPossible = Math.min(Math.floor(h.width / 2) - 1, Math.floor(h.height / 2) - 1);

  let best = { radius: 0, roundTripCost: 0 };
  for (let d = 1; d <= maxPossible; d++) {
    const tx = cx + d;
    const ty = cy + d; // pure diagonal — cheapest path per tile
    const out = walkCost(h, cx, cy, tx, ty);
    if (!out) break;
    const roundTripCost = out.cost * 2;
    if (roundTripCost > budget) break;
    best = { radius: d, roundTripCost: +roundTripCost.toFixed(2) };
  }
  return { ...best, reserved, apLeft: +(maxAp - best.roundTripCost - reserved).toFixed(2) };
}

/**
 * At a fixed round-trip distance, how many `searchCostPerStop`-AP actions fit in
 * the AP left over after the walk.
 */
export function stopsAtDistance(h, maxAp, distance, { searchCostPerStop = 1 } = {}) {
  const cx = Math.floor(h.width / 2);
  const cy = Math.floor(h.height / 2);
  const out = walkCost(h, cx, cy, cx + distance, cy + distance);
  if (!out) return null;
  const roundTripCost = out.cost * 2;
  const leftover = maxAp - roundTripCost;
  const stops = searchCostPerStop > 0 ? Math.max(0, Math.floor(leftover / searchCostPerStop)) : (leftover >= 0 ? Infinity : 0);
  return { distance, roundTripCost: +roundTripCost.toFixed(2), leftover: +leftover.toFixed(2), stops };
}

/**
 * Compare a set of {label, maxAp} vitals configs on the same metrics: max
 * scavenge radius (free looting, 1 stop) and stops available at a fixed
 * reference distance (e.g. "the nearest building is 8 tiles away").
 */
export function compareVitals(configs, { referenceDistance = 8, searchCostPerStop = 1, arenaSeed = 1 } = {}) {
  const h = makeOpenArena({ seed: arenaSeed });
  return configs.map(({ label, maxAp }) => ({
    label,
    maxAp,
    freeLootRadius: maxScavengeRadius(h, maxAp, { stops: 0 }).radius,
    lockedLootRadius: maxScavengeRadius(h, maxAp, { stops: 3, searchCostPerStop: 2 }).radius,
    stopsAt8: stopsAtDistance(h, maxAp, referenceDistance, { searchCostPerStop }),
  }));
}
