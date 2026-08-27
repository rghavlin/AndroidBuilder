import { getRcVehicle } from './RcVehicle.js';

/**
 * How the player drives each remote device: 'remote' spends their own AP here
 * and now, 'auto' hands the wagon a destination to reach on its own turns.
 *
 * Per device, not per session. The choice belongs to the wagon the player made
 * it for — a cargo hauler left running errands on its own stays that way while
 * the scout wagon beside it is still steered by hand — so it is keyed by
 * instanceId, the same shape as the standing orders in AutoWagonOrders.js and
 * for the same reason: the on-map save path serializes items through a
 * whitelist that would drop a field written onto the wagon itself.
 *
 * 'remote' is the absence of an entry rather than a stored value. Driving it
 * yourself is the default, the harmless mode, and what every device that has
 * never been touched should do — so only 'auto' is ever written down.
 */

export const CONTROL_MODES = Object.freeze({ REMOTE: 'remote', AUTO: 'auto' });

/** The engine's mode table, created on first use. */
function modes(engine) {
  if (!engine._deviceControlModes) engine._deviceControlModes = new Map();
  return engine._deviceControlModes;
}

/**
 * How this device is driven. Defaults to 'remote' for anything the player has
 * never set, including a null key (nothing linked).
 * @param {GameEngine} engine
 * @param {string|null} [key] - device key; defaults to the linked device
 */
export function getControlMode(engine, key = engine?.activeDeviceId) {
  if (!engine || !key) return CONTROL_MODES.REMOTE;
  return modes(engine).get(key) === CONTROL_MODES.AUTO
    ? CONTROL_MODES.AUTO
    : CONTROL_MODES.REMOTE;
}

/**
 * Set how this device is driven. Choosing 'remote' forgets the entry rather
 * than storing it, so an untouched device and one explicitly set back to hand
 * control are the same state.
 */
export function setControlMode(engine, mode, key = engine?.activeDeviceId) {
  if (!engine || !key) return;
  if (mode === CONTROL_MODES.AUTO) modes(engine).set(key, CONTROL_MODES.AUTO);
  else modes(engine).delete(key);
}

/** Forget a device's mode — for when the device itself is gone. */
export function clearControlMode(engine, key) {
  if (engine && key) modes(engine).delete(key);
}

/** The keys currently set to autonomous control. */
export function serializeControlModes(engine) {
  return [...modes(engine).entries()]
    .filter(([, mode]) => mode === CONTROL_MODES.AUTO)
    .map(([instanceId]) => instanceId);
}

/**
 * Restore the table, dropping any key whose wagon no longer exists in either
 * home — the same both-homes validation the standing orders and activeDeviceId
 * get, and for the same reason: a mode for a wagon scrapped three saves ago is
 * a slow leak that can only ever apply to the wrong thing if an id is reused.
 */
export function restoreControlModes(engine, data) {
  const table = modes(engine);
  table.clear();
  if (!Array.isArray(data)) return;

  for (const instanceId of data) {
    if (typeof instanceId !== 'string' || !instanceId) continue;
    if (!getRcVehicle(engine, instanceId)) continue;
    table.set(instanceId, CONTROL_MODES.AUTO);
  }
}
