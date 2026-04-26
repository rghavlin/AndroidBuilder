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
  basic: {
    name: 'Zombie',
    hp: 10,
    maxAP: 12,
    sightRange: 15,
    moveCostMultiplier: 1.0,
    spriteKey: 'zombie',
    combat: { damage: { min: 1, max: 4 } },
    lootTable: 'basic'
  },
  runner: {
    name: 'Runner',
    hp: 10,
    maxAP: 12,
    sightRange: 15,
    moveCostMultiplier: 0.5,
    canPassWindows: true,
    spriteKey: 'runnerzombie',
    combat: { damage: { min: 1, max: 4 } },
    lootTable: 'basic'
  },
  crawler: {
    name: 'Crawler',
    hp: 7.5,
    maxAP: 6,
    sightRange: 15,
    moveCostMultiplier: 1.0,
    canPassWindows: false,
    spriteKey: 'crawlerzombie',
    combat: { damage: { min: 1, max: 4 } },
    lootTable: 'basic'
  },
  fat: {
    name: 'Fat Zombie',
    hp: 20,
    maxAP: 12,
    sightRange: 15,
    moveCostMultiplier: 1.5,
    canPassWindows: true,
    spriteKey: 'fatzombie',
    combat: { damage: { min: 3, max: 6 } },
    lootTable: 'basic'
  },
  soldier: {
    name: 'Soldier Zombie',
    hp: 25,
    maxAP: 12,
    sightRange: 15,
    moveCostMultiplier: 1.0,
    canPassWindows: true,
    spriteKey: 'soldierzombie',
    combat: { damage: { min: 1, max: 4 } },
    lootTable: 'soldier'
  },
  firefighter: {
    name: 'Firefighter Zombie',
    hp: 15,
    maxAP: 12,
    sightRange: 15,
    moveCostMultiplier: 1.0,
    canPassWindows: true,
    spriteKey: 'firefighterzombie',
    combat: { damage: { min: 1, max: 4 } },
    lootTable: 'firefighter'
  },
  swat: {
    name: 'SWAT Zombie',
    hp: 15,
    maxAP: 12,
    sightRange: 15,
    moveCostMultiplier: 1.0,
    canPassWindows: true,
    spriteKey: 'swatzombie',
    combat: { damage: { min: 1, max: 4 } },
    lootTable: 'swat'
  },
  acid: {
    name: 'Acid Zombie',
    hp: 10,
    maxAP: 12,
    sightRange: 15,
    moveCostMultiplier: 1.0,
    canPassWindows: true,
    spriteKey: 'acidzombie',
    combat: { damage: { min: 2, max: 5 } },
    lootTable: 'basic'
  }
};

/**
 * Get zombie definition for a given subtype
 * @param {string} subtype 
 * @returns {Object}
 */
export function getZombieType(subtype) {
  return ZombieTypes[subtype] || ZombieTypes.basic;
}
