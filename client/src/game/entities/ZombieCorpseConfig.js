import { gameRandom } from '../utils/SeededRandom.js';
import { createItemFromDef } from '../inventory/ItemDefs.js';
import { PATIENT_ZERO_SUBTYPE } from './ZombieTypes.js';

// Patient Zero is unique: one zombie in the whole game, and knifing its corpse
// produces the Patient Zero Head instead of the usual brainstem. The subtype id
// lives with the other subtypes in ZombieTypes and is re-exported here so the
// harvest path in ActionContext can take the corpse and the head it yields from
// a single import.
export { PATIENT_ZERO_SUBTYPE };
export const PATIENT_ZERO_HEAD_DEF_ID = 'zombie.patient_zero_head';

export const ZombieCorpseConfig = {
  fat:    { name: 'Fat Zombie Corpse',    imageId: 'fatzombiecorpse', backgroundColor: '#833802' },
  mutant: { name: 'Mutant Corpse',        imageId: 'zombiemutantcorpse', backgroundColor: '#A10C00' },
  // Patient Zero's corpse is the game's one source of the Patient Zero Head, so
  // it is deliberately the only corpse with a fixed appearance: black art on a
  // white field in every UI theme (fixedAppearance opts it out of the theme
  // icon filters). Harvesting it with a knife yields the head, not a brainstem.
  [PATIENT_ZERO_SUBTYPE]: {
    name: 'Patient Zero Corpse',
    imageId: 'patientZeroCorpse',
    backgroundColor: '#FFFFFF',
    fixedAppearance: true
  },
  runner: { name: 'Runner Corpse',        backgroundColor: '#F6C915' },
  peeper: { name: 'Peeper Corpse',        backgroundColor: '#22536A' },
  spitter:{ name: 'Spitter Corpse',       backgroundColor: '#5A4858' },
  acid:   { name: 'Acid Zombie Corpse',   backgroundColor: '#6FD200' },
  // Non-special types get default corpse name + image:
  crawler:       { name: 'Crawler Corpse' },
  soldier:       { name: 'Soldier Corpse' },
  firefighter:   { name: 'Firefighter Corpse' },
  swat:          { name: 'SWAT Corpse' },
  bomb_disposal: { name: 'Bomb Disposal Corpse' }
};

export function getCorpseOverrides(zombieSubtype) {
  const config = ZombieCorpseConfig[zombieSubtype] || {};
  return {
    name: config.name || 'Zombie Corpse',
    zombieSubtype: zombieSubtype || 'basic',
    ...(config.imageId && { imageId: config.imageId }),
    ...(config.backgroundColor && { backgroundColor: config.backgroundColor }),
    ...(config.fixedAppearance && { fixedAppearance: true })
  };
}

export function getBrainstemOverrides(zombieSubtype) {
  const config = ZombieCorpseConfig[zombieSubtype] || {};
  const hasColor = !!config.backgroundColor;
  const prettyName = hasColor
    ? `${zombieSubtype.charAt(0).toUpperCase() + zombieSubtype.slice(1)} zombie brainstem`
    : 'Zombie brainstem';
  return {
    name: prettyName,
    zombieSubtype: hasColor ? zombieSubtype : 'basic',
    ...(hasColor && { backgroundColor: config.backgroundColor }),
  };
}

// A plain/basic zombie brainstem has no configured color, so it renders black —
// distinguishing it from the "no data" case (which also falls back to black) is
// unnecessary since basic zombies genuinely have no signature color to show.
export function getBrainstemColor(zombieSubtype) {
  const config = ZombieCorpseConfig[zombieSubtype] || {};
  return config.backgroundColor || '#000000';
}

/**
 * Distinct, ordered (first-appearance) list of brainstem colors for a stew brewed from
 * the given subtypes. One subtype in -> one color out (a single-type stew, including an
 * all-basic one, is never a "rainbow" — it's just that color).
 */
export function getBrainstemStewColors(subtypes = []) {
  const colors = [];
  for (const sub of subtypes) {
    const color = getBrainstemColor(sub || 'basic');
    if (!colors.includes(color)) colors.push(color);
  }
  return colors.length > 0 ? colors : ['#000000'];
}

export function getBrainPulpOverrides(zombieSubtype) {
  const config = ZombieCorpseConfig[zombieSubtype] || {};
  const hasColor = !!config.backgroundColor;
  const prettyName = hasColor
    ? `${zombieSubtype.charAt(0).toUpperCase() + zombieSubtype.slice(1)} zombie brain pulp`
    : 'Zombie brain pulp';
  return {
    name: prettyName,
    zombieSubtype: hasColor ? zombieSubtype : 'basic',
    ...(hasColor && { backgroundColor: config.backgroundColor }),
  };
}

/**
 * Unifies zombie loot dropping and corpse spawning.
 * Relies on seeded gameRandom to ensure reproducibility guarantees.
 */
export function dropZombieDeathLoot(target, x, y, gameMap, lootGenerator, placeItemsCallback) {
  if (!target || !gameMap) return;

  const tile = gameMap.getTile(x, y);
  const hasWindow = tile?.contents.some(e => e.type === 'window');

  if (lootGenerator && !target.noLoot && !hasWindow && gameRandom.next() < 0.75) {
    const mapNumber = gameMap.mapNumber || 1;
    const loot = lootGenerator.generateZombieLoot(target.subtype, mapNumber);
    if (loot && loot.length > 0) {
      placeItemsCallback(loot);
    }
  }

  const corpseOverrides = getCorpseOverrides(target.subtype);
  if (target.lastAttacker?.type !== 'player') {
    corpseOverrides.earbucksValue = 0;
  } else if (target.earbucksValue !== undefined) {
    // Map editor may author a per-zombie earbucks value; otherwise the
    // zombie.corpse item def default (1) applies.
    corpseOverrides.earbucksValue = target.earbucksValue;
  }
  const corpse = createItemFromDef('zombie.corpse', corpseOverrides);
  if (corpse) {
    placeItemsCallback([corpse]);
  }
}
