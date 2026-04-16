/**
 * Zombie Types Configuration
 * Centralized stats and behavior multipliers for all zombie subtypes.
 * 
 * Stats:
 * - hp: Maximum health points
 * - maxAP: Maximum action points per turn
 * - sightRange: Distance in tiles the zombie can see the player
 * - moveCostMultiplier: AP cost multiplier for movement (lower is faster)
 * - canPassWindows: Whether the zombie can climb through windows (crawlers cannot)
 */
export const ZombieTypes = {
  walker: {
    name: 'Walker',
    hp: 10,
    maxAP: 12,
    sightRange: 15,
    moveCostMultiplier: 1.0,
    canPassWindows: true
  },
  runner: {
    name: 'Runner',
    hp: 10,
    maxAP: 12,
    sightRange: 15,
    moveCostMultiplier: 0.5,
    canPassWindows: true
  },
  crawler: {
    name: 'Crawler',
    hp: 7.5,
    maxAP: 6,
    sightRange: 15,
    moveCostMultiplier: 1.0,
    canPassWindows: false
  },
  fat: {
    name: 'Fat Zombie',
    hp: 20,
    maxAP: 12,
    sightRange: 15,
    moveCostMultiplier: 1.5,
    canPassWindows: true
  },
  soldier: {
    name: 'Soldier Zombie',
    hp: 25,
    maxAP: 12,
    sightRange: 15,
    moveCostMultiplier: 1.0,
    canPassWindows: true
  },
  firefighter: {
    name: 'Firefighter Zombie',
    hp: 15,
    maxAP: 12,
    sightRange: 15,
    moveCostMultiplier: 1.0,
    canPassWindows: true
  },
  swat: {
    name: 'SWAT Zombie',
    hp: 15,
    maxAP: 12,
    sightRange: 15,
    moveCostMultiplier: 1.0,
    canPassWindows: true
  },
  acid: {
    name: 'Acid Zombie',
    hp: 10,
    maxAP: 12,
    sightRange: 15,
    moveCostMultiplier: 1.0,
    canPassWindows: true
  }
};

/**
 * Get zombie definition for a given subtype
 * @param {string} subtype 
 * @returns {Object}
 */
export function getZombieType(subtype) {
  return ZombieTypes[subtype] || ZombieTypes.walker;
}
