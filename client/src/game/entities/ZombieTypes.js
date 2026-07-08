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
 * - defense: Flat evasion chance (0-1) against incoming attacks. Zombies have
 *   no attributes/skill, so this never grows and never gets the attrMod nudge
 *   player/NPC Defense gets — it's a fixed per-archetype stat (runner highest,
 *   fat/bomb_disposal lowest), replacing the old stumbleEvasion name 1:1.
 * - combat.bleedChance: every zombie type can inflict bleeding on a hit.
 * - combat.sickChance: deliberately Spitter-exclusive — this inflicts the
 *   generic "Diseased" condition (Entity.inflictSickness), not the zombie-bite
 *   infection itself. Do not add it to other archetypes; a regular bite should
 *   never cause plain sickness, only Spitter's ranged attack should.
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
    defense: 0.05,
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
    defense: 0.12,
    combat: { damage: { min: 1, max: 4 }, bleedChance: 0.05 },
    lootTable: 'basic'
  },
  peeper: {
    name: 'Peeper Zombie',
    hp: 10,
    maxAP: 12,
    sightRange: 30,
    accuracy: 0.5,
    moveCostMultiplier: 1.0,
    canPassWindows: true,
    spriteKey: 'peeperzombie',
    defense: 0.05,
    combat: { damage: { min: 1, max: 4 }, bleedChance: 0.05 },
    lootTable: 'basic',
    hearingRangeMultiplier: 2.0
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
    defense: 0.08,
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
    defense: 0.0,
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
    defense: 0.05,
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
    defense: 0.05,
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
    defense: 0.05,
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
    defense: 0.08,
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
    defense: 0.08,
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
    defense: 0.0,
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
    defense: 0.05,
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
