import { Item } from '../inventory/Item.js';

/**
 * Coerce a remote-device candidate into a real Item.
 *
 * A device sitting on a far tile is an on-map ECS *entity* whose attachments
 * are raw JSON, not Item instances — so getBattery()/consumeCharge()/
 * consumeMotorPower() don't exist on it. Item.fromJSON accepts either shape and
 * rebuilds the attachments as proper Items.
 *
 * Note the result is a COPY when the input was an entity: mutating its battery
 * does not write back through the entity. Callers that spend charge must treat
 * the returned Item as canonical and re-place it, which is what both the
 * drone's launch/land and the RC wagon's drive do.
 *
 * Lives in its own module so the drone and RC-vehicle layers can share it
 * without importing each other.
 */
export function asItemInstance(candidate) {
  if (!candidate) return null;
  if (typeof candidate.getBattery === 'function') return candidate;
  return Item.fromJSON(candidate);
}
