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

/** Whether a wagon has an RC receiver fitted. */
export function hasReceiver(candidate) {
  return candidate?.attachments?.[RcVehicleConfig.RECEIVER_SLOT_ID]?.defId === RcVehicleConfig.RECEIVER_DEF_ID;
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
 * The remote device at the player's own feet, or null.
 *
 * The player's tile is owned by the ground container — syncWithMap empties the
 * tile when they arrive — so a device underfoot has NO map entity representing
 * it and the renderer has to synthesize one. Prefers whichever device the phone
 * is linked to, since that's the one the player is asking about.
 *
 * @returns {Item|null}
 */
export function getUnderfootDevice(engine) {
  const items = engine?.inventoryManager?.groundContainer?.getAllItems?.() || [];
  let fallback = null;
  for (const item of items) {
    if (!isRemoteDevice(item)) continue;
    if (item.instanceId && item.instanceId === engine?.activeDeviceId) return item;
    if (!fallback) fallback = item;
  }
  return fallback;
}
