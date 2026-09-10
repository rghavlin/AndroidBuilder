import { asItemInstance } from './RemoteItem.js';

/**
 * How much power a remote device has left.
 *
 * The phone's device list needs one number per controllable, and getting it is
 * not as simple as reading a battery: a device's charge lives in a different
 * place for every form it takes.
 *
 *   - an airborne drone is an Entity whose battery hangs off its stashed
 *     sourceItem (the Item it folds back into when it lands)
 *   - a grounded drone or a wagon parked on a far tile is an on-map item ENTITY
 *     whose attachments are raw JSON with no methods on them at all
 *   - the same device under the player's feet is a live Item in the ground
 *     container
 *   - and a big wagon carries up to four power cells, not one
 *
 * listControllables hands back raw candidates in whichever of those forms the
 * device currently has, so everything here goes through asItemInstance first —
 * the same normalization the drive and launch paths use.
 *
 * Read-only: asItemInstance returns a COPY for an on-map entity, so nothing
 * here may mutate what it is handed.
 */

/** No battery fitted, or nothing to read one off. */
const NO_CHARGE = Object.freeze({ present: false, charges: 0, max: 0, percent: 0, cells: 0 });

/**
 * @typedef {Object} DeviceCharge
 * @property {boolean} present - is at least one power cell fitted
 * @property {number} charges - charges remaining, summed across cells
 * @property {number} max - capacity, summed across the SAME cells
 * @property {number} percent - 0-100, of that summed capacity
 * @property {number} cells - how many cells are fitted (a Cargo Wagon has three)
 */

/**
 * Charge left in one device item, whatever form it arrives in.
 * @param {Object|null} candidate - Item, on-map item entity, or null
 * @returns {DeviceCharge}
 */
export function itemCharge(candidate) {
  const item = asItemInstance(candidate);
  if (!item || typeof item.getBatteryStatuses !== 'function') return NO_CHARGE;

  // Empty slots are excluded from BOTH sums: an unfitted cell is missing
  // capacity, not depleted capacity, and counting it would show a wagon with
  // one full battery and one empty socket as half charged.
  const fitted = item.getBatteryStatuses().filter(s => s.present);
  if (fitted.length === 0) return NO_CHARGE;

  const charges = fitted.reduce((sum, s) => sum + (s.ammoCount || 0), 0);
  const max = fitted.reduce((sum, s) => sum + (s.max || 0), 0);

  return {
    present: true,
    charges,
    max,
    percent: max > 0 ? Math.min(100, Math.max(0, (charges / max) * 100)) : 0,
    cells: fitted.length
  };
}

/**
 * Charge left in one entry of listControllables().
 * @param {{kind: string, drone?: Object, item?: Object}|null} target
 * @returns {DeviceCharge}
 */
export function deviceCharge(target) {
  if (!target) return NO_CHARGE;
  // An airborne drone keeps its Item — battery and all — parked on sourceItem;
  // that is the thing DronePower drains, so it is the thing to report.
  const candidate = target.kind === 'drone-air' ? target.drone?.sourceItem : target.item;
  return itemCharge(candidate);
}
