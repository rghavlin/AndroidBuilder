import { DroneConfig } from '../config/DroneConfig.js';

/**
 * Fractional-charge banking for drone flight, mirroring
 * Item.consumeScooterPower's _powerAccumulator (inventory/Item.js): the
 * fraction is banked on the drone, never stored on the battery, and only
 * whole charges are ever drained from it.
 */

/** Charges currently available on the drone's battery (0 if none attached). */
export function droneChargesRemaining(drone) {
  return drone?.sourceItem?.getCharges ? drone.sourceItem.getCharges() : 0;
}

/**
 * Drain the flight cost of moving `tiles` tiles. Returns false (no state
 * mutated) if the battery can't cover the whole-charge portion once the
 * banked fraction is included — callers should check this before animating
 * the move, not after.
 */
export function consumeFlightCharge(drone, tiles) {
  if (!drone?.sourceItem) return false;
  const rate = drone.chargePerTile ?? DroneConfig.CHARGE_PER_TILE;
  const projected = (drone._powerAccumulator || 0) + tiles * rate;
  const whole = Math.floor(projected);
  const fraction = projected - whole;

  if (whole > 0 && !drone.sourceItem.consumeCharge(whole)) {
    return false;
  }

  drone._powerAccumulator = fraction;
  return true;
}

/** Whether a `tiles`-length flight can be paid for without mutating state. */
export function canAffordFlight(drone, tiles) {
  const rate = drone.chargePerTile ?? DroneConfig.CHARGE_PER_TILE;
  const projected = (drone._powerAccumulator || 0) + tiles * rate;
  return Math.floor(projected) <= droneChargesRemaining(drone);
}

/** Per-turn hover drain. Returns false if the battery is empty. */
export function consumeHoverCharge(drone) {
  if (!drone?.sourceItem) return false;
  return drone.sourceItem.consumeCharge(DroneConfig.HOVER_CHARGE_PER_TURN);
}

/** The immediate charge spent when a stowed drone launches. */
export function consumeDeployCharge(item) {
  return item.consumeCharge(DroneConfig.DEPLOY_CHARGE);
}

/**
 * Charge the equipped phone at most once per turn, no matter how many times
 * the button is pressed this turn (cycling devices, toggling off/on) — a
 * turn stamp on the engine is the only formulation where "one charge per
 * turn active" and "cycling/toggling within a turn is free" are both true
 * from a single guard.
 */
export function consumePhoneChargeOncePerTurn(engine) {
  const phone = engine?.inventoryManager?.equipment?.phone;
  if (!phone) return false;
  if (engine._phoneChargeTurn === engine.turn) return true;
  const charged = phone.consumeCharge(DroneConfig.PHONE_CHARGE_PER_TURN);
  if (charged) engine._phoneChargeTurn = engine.turn;
  return charged;
}
