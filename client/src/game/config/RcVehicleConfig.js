/**
 * Tunables for remote-controlled ground vehicles (RC-receiver wagons).
 * Sibling of DroneConfig — same reason: balance passes touch one file.
 */
export const RcVehicleConfig = {
  RECEIVER_DEF_ID: 'tool.rc_receiver',
  RECEIVER_SLOT_ID: 'rc_receiver',

  // The "+1" in the remote cost formula: max(0, dragApPenalty - motorAssist) + 1.
  // Nobody is pulling, so the Strength discount and the walk baseline are both
  // out; the surcharge is what keeps remote driving strictly worse than walking
  // the wagon over yourself.
  REMOTE_AP_SURCHARGE: 1,

  // Nothing in the game moves for less than this, wagons included.
  MIN_AP_PER_TILE: 0.5,

  // ABSOLUTE sight radius, not a bonus on the player's range — a camera bolted
  // to a cart doesn't see further because the player is holding a flashlight.
  SIGHT_RANGE: 3,

  // Heavier and slower than the drone's 110.
  MS_PER_TILE: 140
};
