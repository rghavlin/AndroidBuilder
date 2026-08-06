/**
 * Tunables for remote-controlled ground vehicles (RC-receiver wagons).
 * Sibling of DroneConfig — same reason: balance passes touch one file.
 */
export const RcVehicleConfig = {
  RECEIVER_DEF_ID: 'tool.rc_receiver',
  RECEIVER_SLOT_ID: 'rc_receiver',

  // The receiver's smarter sibling: same slot, same remote driving, plus a
  // destination it can drive to on its own turn. A strict superset, which is why
  // hasReceiver() tests membership below instead of equality — every part of the
  // RC stack (cycling, driving, the link ring, FOV) must accept both.
  AUTONOMOUS_DEF_ID: 'tool.autonomous_controller',
  RECEIVER_DEF_IDS: ['tool.rc_receiver', 'tool.autonomous_controller'],

  // The controller's own AP pool, spent per turn on the same per-step cost the
  // player pays when driving by hand. Deliberately the auto turret's maxAp: an
  // autonomous device gets its own budget rather than borrowing the player's, so
  // an exhausted player's cart doesn't mysteriously slow down.
  // Fully motorized, on flat ground: Toy 5 tiles/turn, Wagon 2, Cargo 1.
  AUTONOMOUS_MAX_AP: 10,

  // Turns of "I can see where you want me to go but I can't get there" before an
  // order gives up. Without this a marker for a walled-off tile sits forever.
  AUTO_MAX_FAILED_TURNS: 10,

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
