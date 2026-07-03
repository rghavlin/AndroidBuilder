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
    accuracy: 0.5,
    moveCostMultiplier: 1.0,
    spriteKey: 'zombie',
    combat: { damage: { min: 1, max: 4 }, bleedChance: 0.05 },
    lootTable: 'basic'
  },
  runner: {
    name: 'Runner',
    hp: 10,
    maxAP: 12,
    sightRange: 15,
    accuracy: 0.5,
    moveCostMultiplier: 0.5,
    canPassWindows: true,
    spriteKey: 'runnerzombie',
    combat: { damage: { min: 1, max: 4 }, bleedChance: 0.05 },
    lootTable: 'basic'
  },
  crawler: {
    name: 'Crawler',
    hp: 7.5,
    maxAP: 6,
    sightRange: 15,
    accuracy: 0.5,
    moveCostMultiplier: 1.0,
    canPassWindows: false,
    spriteKey: 'crawlerzombie',
    combat: { damage: { min: 1, max: 4 }, bleedChance: 0.05 },
    lootTable: 'basic'
  },
  fat: {
    name: 'Fat Zombie',
    hp: 20,
    maxAP: 12,
    sightRange: 15,
    accuracy: 0.5,
    moveCostMultiplier: 1.5,
    canPassWindows: true,
    spriteKey: 'fatzombie',
    combat: { damage: { min: 3, max: 6 }, bleedChance: 0.05 },
    lootTable: 'basic'
  },
  soldier: {
    name: 'Soldier Zombie',
    hp: 25,
    maxAP: 12,
    sightRange: 15,
    accuracy: 0.5,
    moveCostMultiplier: 1.0,
    canPassWindows: true,
    spriteKey: 'soldierzombie',
    combat: { damage: { min: 1, max: 4 }, bleedChance: 0.05 },
    lootTable: 'soldier'
  },
  firefighter: {
    name: 'Firefighter Zombie',
    hp: 15,
    maxAP: 12,
    sightRange: 15,
    accuracy: 0.5,
    moveCostMultiplier: 1.0,
    canPassWindows: true,
    spriteKey: 'firefighterzombie',
    combat: { damage: { min: 1, max: 4 }, bleedChance: 0.05 },
    lootTable: 'firefighter'
  },
  swat: {
    name: 'SWAT Zombie',
    hp: 15,
    maxAP: 12,
    sightRange: 15,
    accuracy: 0.5,
    moveCostMultiplier: 1.0,
    canPassWindows: true,
    spriteKey: 'swatzombie',
    combat: { damage: { min: 1, max: 4 }, bleedChance: 0.05 },
    lootTable: 'swat'
  },
  acid: {
    name: 'Acid Zombie',
    hp: 10,
    maxAP: 12,
    sightRange: 15,
    accuracy: 0.5,
    moveCostMultiplier: 1.0,
    canPassWindows: true,
    spriteKey: 'acidzombie',
    combat: { damage: { min: 2, max: 5 }, bleedChance: 0.05 },
    lootTable: 'basic'
  },
  spitter: {
    name: 'Spitter',
    hp: 10,
    maxAP: 12,
    sightRange: 15,
    accuracy: 0.5,
    moveCostMultiplier: 1.0,
    canPassWindows: true,
    isRanged: true,
    rangedRange: 5,
    rangedApCost: 1.5,
    spriteKey: 'spitterzombie',
    combat: {
      damage: { min: 1, max: 4 },
      rangedDamage: { min: 1, max: 3 },
      sickChance: 0.2,
      bleedChance: 0.05
    },
    lootTable: 'basic'
  },
  bomb_disposal: {
    name: 'Bomb Disposal Zombie',
    hp: 200,
    maxAP: 12,
    sightRange: 15,
    accuracy: 0.5,
    moveCostMultiplier: 2.0,
    canPassWindows: true,
    spriteKey: 'bombdisposalzombie',
    combat: { damage: { min: 3, max: 7 }, bleedChance: 0.05 },
    lootTable: 'swat' // They carry heavy gear
  },
  mutant: {
    name: 'Zombie Mutant',
    hp: 75,
    maxAP: 20,
    sightRange: 15,
    accuracy: 0.5,
    moveCostMultiplier: 1.0,
    attackCost: 0.5,
    canPassWindows: true,
    spriteKey: 'zombiemutant',
    combat: { damage: { min: 2, max: 5 }, bleedChance: 0.05 },
    lootTable: 'mutant'
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
