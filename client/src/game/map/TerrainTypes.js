/**
 * Terrain-type helpers.
 *
 * 'garagefloor' behaves identically to 'floor' in every system EXCEPT
 * golf-cart movement: a golf cart may drive onto 'garagefloor' but is blocked
 * from ordinary 'floor'. Route every floor-parity check through these helpers so
 * a future floor-like terrain only has to be added here, in one place.
 */

// Interior "floor" surfaces the player walks on. Both count as a proper floor
// for spawning, loot, room-shell and rendering purposes.
export const isFloor = (terrain) => terrain === 'floor' || terrain === 'garagefloor';

// "Indoor" = a sheltered interior surface. Drives weather exposure, ambient
// darkness reduction and footstep audio ("inside") checks. tent_floor is
// sheltered too, but is not a hard-surface floor for spawn/loot logic.
export const isIndoorFloor = (terrain) =>
  terrain === 'floor' || terrain === 'garagefloor' || terrain === 'tent_floor';
