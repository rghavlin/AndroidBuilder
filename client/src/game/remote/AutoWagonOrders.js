import { RcVehicleConfig } from '../config/RcVehicleConfig.js';
import { getRcVehicle, getAutonomousVehicle, driveBlockedReason } from './RcVehicle.js';
import { findRcPath, sliceLegByAp } from './RcPathing.js';
import { consumePhoneChargeOncePerTurn } from './DronePower.js';

/**
 * Standing orders for autonomous wagons: "go here, take as many turns as you
 * need". One order per wagon, keyed by instanceId.
 *
 * Deliberately an engine-level side table rather than a field on the wagon Item,
 * for three reasons that all bite:
 *
 *   1. The on-map save path (Entity.toJSON) serializes items through the
 *      ITEM_SERIALIZED_FIELDS *whitelist*, so an ad-hoc field on the Item would
 *      be silently dropped for any wagon parked away from the player — which is
 *      the normal state for a wagon that's off running an errand.
 *   2. asItemInstance() hands back a COPY for on-map entities, so writes aimed
 *      at "the wagon" would land in a throwaway.
 *   3. WagonSystem destroys and re-creates the entity every time it moves, so
 *      anything hanging off the object would have to be copied forward by hand
 *      each turn.
 *
 * engine.activeDeviceId already works exactly this way — instanceId key, stable
 * across both of the wagon's homes, persisted alongside the rest of
 * interactionState.
 *
 * @typedef {{x: number, y: number, failedTurns: number, lastBlockReason: string|null}} WagonOrder
 */

/** The live order book, created on first use. */
export function getOrders(engine) {
  if (!engine.autoWagonOrders) engine.autoWagonOrders = new Map();
  return engine.autoWagonOrders;
}

/** @returns {WagonOrder|null} */
export function getOrder(engine, instanceId) {
  return getOrders(engine).get(instanceId) || null;
}

export function clearOrder(engine, instanceId) {
  getOrders(engine).delete(instanceId);
}

/**
 * Estimated turns for `item` to walk `path`, at the controller's per-turn AP
 * budget. Used for the hover label and the confirmation log, so the player can
 * tell "two turns" from "twenty" before committing.
 *
 * @returns {number} >= 1, or Infinity if the wagon can't afford a single step
 */
export function estimateTurns(path, item, gameMap) {
  if (!path || path.length <= 1) return 0;

  let remaining = path;
  let turns = 0;

  while (remaining.length > 1) {
    const { leg } = sliceLegByAp(remaining, item, gameMap, RcVehicleConfig.AUTONOMOUS_MAX_AP);
    if (leg.length <= 1) return Infinity; // can't even afford one step
    remaining = remaining.slice(leg.length - 1);
    turns++;
  }

  return turns;
}

/**
 * Order the linked wagon to drive to (x, y) under its own power.
 *
 * Rejects unreachable targets up front rather than letting the wagon sit there
 * failing quietly — the player is looking at the map right now, which is the
 * only moment "you can't get there" is useful information.
 *
 * @returns {{success: boolean, message: string}}
 */
export function setDestination(x, y, engine) {
  const device = getAutonomousVehicle(engine);
  if (!device) return { success: false, message: 'No autonomous wagon linked' };

  const blocked = driveBlockedReason(device.item, engine);
  if (blocked) return { success: false, message: blocked };

  if (device.x === x && device.y === y) {
    return { success: false, message: 'It is already there' };
  }

  const path = findRcPath(device.x, device.y, x, y, engine, device.item.instanceId);
  if (path.length <= 1) return { success: false, message: 'No route there' };

  // Same rule as every other phone command: issuing one costs at most one
  // charge per turn, and it's free if the player already spent it linking.
  if (!consumePhoneChargeOncePerTurn(engine)) {
    return { success: false, message: 'The phone has no charge.' };
  }

  const turns = estimateTurns(path, device.item, engine.gameMap);
  if (!Number.isFinite(turns)) {
    return { success: false, message: 'It has no power to move' };
  }

  // One order per wagon: a new destination replaces the old one outright.
  getOrders(engine).set(device.item.instanceId, {
    x, y, failedTurns: 0, lastBlockReason: null
  });

  const eta = turns === 1 ? 'next turn' : `in about ${turns} turns`;
  return { success: true, message: `The ${device.item.name} sets off — arriving ${eta}.` };
}

/** @returns {Array<{instanceId: string, x: number, y: number, failedTurns: number}>} */
export function serializeOrders(engine) {
  return [...getOrders(engine).entries()].map(([instanceId, o]) => ({
    instanceId, x: o.x, y: o.y, failedTurns: o.failedTurns || 0
  }));
}

/**
 * Restore orders, dropping any whose wagon no longer exists in either home —
 * the same both-homes validation activeDeviceId gets on load, and for the same
 * reason: a stale key would draw a destination marker for a wagon that was
 * scrapped three saves ago.
 */
export function restoreOrders(engine, data) {
  const orders = getOrders(engine);
  orders.clear();
  if (!Array.isArray(data)) return;

  for (const entry of data) {
    if (!entry?.instanceId) continue;
    if (!getRcVehicle(engine, entry.instanceId)) continue;
    orders.set(entry.instanceId, {
      x: entry.x,
      y: entry.y,
      failedTurns: entry.failedTurns || 0,
      lastBlockReason: null
    });
  }
}
