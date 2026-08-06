import { RcVehicleConfig } from '../config/RcVehicleConfig.js';

/**
 * "Is this thing a remote device?" — the one answer shared by the renderer, the
 * FOV layer and the RC-vehicle layer.
 *
 * Deliberately dependency-free apart from a pure config module. EntityRenderer
 * and DroneVision both need these predicates, and both sit upstream of code
 * that reaches back to the engine singleton, so anything heavier here would
 * close an import cycle. Every check is a plain field read that works on an
 * `Item` instance AND on a raw on-map item entity (whose attachments are JSON).
 */

/** The drone's two item forms: 2x2 deployed/landed, and the 2x1 carry form. */
export const DRONE_ITEM_DEF_IDS = new Set(['tool.recon_drone', 'tool.recon_drone_stowed']);

/**
 * Whether a wagon has anything fitted that answers the phone — a plain RC
 * receiver or the autonomous controller that supersedes it.
 *
 * Membership, not equality: this predicate is the chokepoint for the entire RC
 * stack (listRcVehicles, getActiveRcVehicle, isRemoteDevice, the link ring,
 * DroneVision), so a wagon carrying the controller has to pass it or it goes
 * invisible to all of them at once.
 */
export function hasReceiver(candidate) {
  const fitted = candidate?.attachments?.[RcVehicleConfig.RECEIVER_SLOT_ID]?.defId;
  return !!fitted && RcVehicleConfig.RECEIVER_DEF_IDS.includes(fitted);
}

/**
 * Whether a wagon can drive itself — the narrower question hasReceiver's
 * superset hides. False for a plain receiver, which only ever moves while the
 * player is holding the phone.
 */
export function hasAutonomy(candidate) {
  return candidate?.attachments?.[RcVehicleConfig.RECEIVER_SLOT_ID]?.defId === RcVehicleConfig.AUTONOMOUS_DEF_ID;
}

/**
 * Whether this item is a remote device the player owns and needs to be able to
 * find on the map — a drone in any of its item forms, or a receiver-fitted
 * wagon. Drives display priority: a device you can't see is a device you can't
 * command, so these outrank the ordinary tile-icon tiers.
 *
 * @param {Item|Entity|Object} candidate
 */
export function isRemoteDevice(candidate) {
  if (!candidate) return false;
  return DRONE_ITEM_DEF_IDS.has(candidate.defId || candidate.id) || hasReceiver(candidate);
}

/**
 * Whether the phone currently has a radio link to this device.
 * Null/absent activeDeviceId means the player is in control of themselves.
 */
export function isLinkedDevice(candidate, engine) {
  const key = engine?.activeDeviceId;
  return !!key && !!candidate?.instanceId && candidate.instanceId === key;
}

/**
 * The LINKED remote device at the player's own feet, or null.
 *
 * The player's tile is owned by the ground container — syncWithMap empties the
 * tile when they arrive — so a device underfoot has no map entity representing
 * it and the renderer has to synthesize one.
 *
 * Restricted to the linked device on purpose. Drawing every device underfoot
 * would put a wagon on top of the player's own sprite permanently, for a player
 * who may not even own a phone; only the thing you are actively steering earns
 * the right to cover you.
 *
 * @returns {Item|null}
 */
export function getLinkedDeviceUnderfoot(engine) {
  if (!engine?.activeDeviceId) return null;
  const items = engine.inventoryManager?.groundContainer?.getAllItems?.() || [];
  return items.find(item => isRemoteDevice(item) && isLinkedDevice(item, engine)) || null;
}
