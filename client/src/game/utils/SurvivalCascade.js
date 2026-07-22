// Character stat recomputation. Two ordered steps, both player-only:
//   1. applySurvivalCascade — hunger/thirst/exhaustion scale CURRENT Strength/
//      Agility/Perception/Constitution down from their BASE values.
//   2. deriveSecondaryStats — maxHp and maxAp are DERIVED from those current
//      attributes (never hand-set). maxHp from Constitution, maxAp from Agility+
//      Perception. Energy only affects maxAp indirectly, via its share of the
//      cascade's blended deficit pulling Agility/Perception down.
// recalcCharacter runs both in order. Shared by GameContext's per-turn processing,
// SleepContext's per-hour sleep loop, and EntityFactory at player creation, so all
// three use the exact same formulas.
//
// IMPORTANT — player-only: applySurvivalCascade reads nutrition/hydration/energy,
// which live on SurvivalStats. NPCs don't carry SurvivalStats (their facades read
// 0), so running this on an NPC would compute a full deficit and halve their stats.
// Only ever call recalcCharacter on the player; NPCs keep their typeDef hp/maxAP.
import { gameRandom } from './SeededRandom.js';

const CASCADE_MAX_PENALTY = 0.5; // fully depleted needs cap stats at 50% of base

const HP_FLOOR = 10;   // max HP never drops below this, whatever Constitution does
const AP_BASE = 10;    // max AP before attribute bonus
// How hard attributes push max HP / max AP. These are the survivability dials:
// bump HP_PER_CON for a beefier health pool, AP_ATTR_DIVISOR down for more actions.
const HP_PER_CON = 0.4;     // max HP gained per point of current Constitution
const AP_ATTR_DIVISOR = 5;  // (Agility + Perception) / this = flat max-AP bonus

// Single source of truth for the attribute → vitals formulas. deriveSecondaryStats
// (live gameplay) and previewDerivedStats (char-creation UI) both route through these
// so the numbers the creator screen shows always match what the player actually gets.
export function maxHpFromAttributes(constitution) {
  const conBonus = Math.max(0, Math.floor((constitution || 0) * HP_PER_CON));
  return HP_FLOOR + conBonus;
}

export function maxApBonusFromAttributes(agility, perception) {
  return Math.floor(((agility || 0) + (perception || 0)) / AP_ATTR_DIVISOR);
}
// While sick, these attributes are temporarily sapped (1 per remaining sickness turn,
// each capped), tapering to 0 as the counter clears. This is how the "Diseased"
// condition affects the character — entirely through the attribute layer rather than
// poking HP/AP directly: Constitution → lower maxHp; Agility + Perception → lower maxAp
// (and, as a side effect, dodge / crit / hearing). Strength is left intact.
const SICK_CON_PENALTY_CAP = 10;
const SICK_AGI_PENALTY_CAP = 8;
const SICK_PER_PENALTY_CAP = 8;

// Hard ceiling on the sickness turn-counter itself (Entity.inflictSickness). Severity
// already caps via the penalty constants above, but without this the *duration* could
// still stack unboundedly (e.g. chained raw meat + dirty water), leaving the player
// Diseased far longer than any single source intends.
export const MAX_SICKNESS_DURATION = 30;

// Wound infection (rag-bound bleeding wound) routes through the exact same attribute
// layer as sickness. While infected we feed this fixed sickness-equivalent magnitude
// into sicknessPenalties, so it saps Con/Agi/Per by a steady amount that — unlike a
// sickness counter — does NOT taper: it holds until the infection is actually cured.
const WOUND_INFECTION_LEVEL = 6;

// Per-turn Constitution roll to shake off a wound infection. Base chance plus a nudge
// scaled off Constitution (same (attr-20)*step shape as CombatResolver.attrMod, inlined
// here to keep this module import-free), plus a flat bonus while asleep — resting gives
// the body a better shot at fighting it off.
const WOUND_CURE_BASE = 0.08;
const WOUND_CURE_CON_STEP = 0.0075; // per Constitution point above the 20 baseline
const WOUND_CURE_SLEEP_BONUS = 0.10;
const WOUND_CURE_MIN = 0.02;
const WOUND_CURE_MAX = 0.95;

export const TREATMENT_EFFECTS = {
  basic: {
    label: "Zombie Treatment",
    effects: {
      strength: { multiplier: 1.0, immune: true, label: "Strength is Decay Immune" }
    }
  },
  zombie: {
    label: "Zombie Treatment",
    effects: {
      strength: { multiplier: 1.0, immune: true, label: "Strength is Decay Immune" }
    }
  },
  runner: {
    label: "Runner Treatment",
    effects: {
      agility: { multiplier: 1.1, immune: true, label: "+10% Agility & Decay Immune" }
    }
  },
  acid: {
    label: "Acid Treatment",
    effects: {
      constitution: { multiplier: 1.1, immune: true, label: "+10% Constitution & Decay Immune" }
    }
  },
  fat: {
    label: "Fat Zombie Treatment",
    effects: {
      constitution: { multiplier: 1.05, immune: true, label: "+5% Constitution & Decay Immune" },
      strength: { multiplier: 1.05, immune: true, label: "+5% Strength & Decay Immune" }
    }
  },
  peeper: {
    label: "Peeper Treatment",
    effects: {
      perception: { multiplier: 1.1, immune: true, label: "+10% Perception & Decay Immune" }
    }
  },
  mutant: {
    label: "Mutant Treatment",
    effects: {
      strength: { multiplier: 1.2, immune: true, label: "+20% & Decay Immune" },
      agility: { multiplier: 1.2, immune: true, label: "+20% & Decay Immune" },
      perception: { multiplier: 1.2, immune: true, label: "+20% & Decay Immune" },
      constitution: { multiplier: 1.2, immune: true, label: "+20% & Decay Immune" }
    }
  },
  spitter: {
    label: "Spitter Treatment",
    effects: {
      agility: { multiplier: 1.05, immune: true, label: "+5% Agility & Decay Immune" },
      constitution: { multiplier: 1.05, immune: true, label: "+5% Constitution & Decay Immune" }
    }
  }
};

// --- Brainstem stew tuning ---
// Cooking brainstems into a stew trades potency for breadth and duration. Each brainstem
// is worth BRAINSTEM_TREATMENT_HOURS of treatment (same currency as raw brain pulp), up to
// STEW_MAX_STEMS stems (so a full pot lasts STEW_MAX_STEMS * BRAINSTEM_TREATMENT_HOURS = 24h).
// Buffs from every stem are diluted (STEW_DILUTION) and stack additively per attribute, but
// no single attribute may exceed STEW_MAX_ATTR_BONUS — the ceiling that keeps a pot of the
// strong-but-rare mutant brainstems from getting out of hand.
export const BRAINSTEM_TREATMENT_HOURS = 6;
export const STEW_MAX_STEMS = 4;
export const STEW_DILUTION = 0.5;
export const STEW_MAX_ATTR_BONUS = 0.15; // +15% hard cap per attribute
const STEW_ATTRS = ['strength', 'agility', 'perception', 'constitution'];

/**
 * Computes the treatment produced by brewing a set of brainstems into a stew.
 * @param {string[]} subtypes One zombie-subtype string per brainstem going into the pot.
 * @returns {{ hours: number, effects: Object }} Duration in hours and a per-attribute
 *   effects map ({ strength: { multiplier, immune }, ... }) matching TREATMENT_EFFECTS shape.
 */
export function computeBrainstemStewTreatment(subtypes = []) {
  const stems = subtypes.slice(0, STEW_MAX_STEMS);
  const hours = stems.length * BRAINSTEM_TREATMENT_HOURS;

  const bonus = { strength: 0, agility: 0, perception: 0, constitution: 0 };
  const immune = { strength: false, agility: false, perception: false, constitution: false };

  for (const sub of stems) {
    const config = TREATMENT_EFFECTS[(sub || 'basic').toLowerCase()] || TREATMENT_EFFECTS.basic;
    for (const attr of STEW_ATTRS) {
      const eff = config.effects?.[attr];
      if (!eff) continue;
      bonus[attr] += ((eff.multiplier ?? 1.0) - 1.0) * STEW_DILUTION;
      if (eff.immune) immune[attr] = true;
    }
  }

  const effects = {};
  for (const attr of STEW_ATTRS) {
    const capped = Math.min(bonus[attr], STEW_MAX_ATTR_BONUS);
    // Include an attribute if it gained any bonus OR any stem granted decay-immunity for it
    // (e.g. the basic/zombie brainstem is a flat 0% buff whose only value is immunity).
    if (capped > 0 || immune[attr]) {
      effects[attr] = { multiplier: 1 + capped, immune: immune[attr] };
    }
  }

  return { hours, effects };
}

export function sicknessPenalties(sickness = 0) {
  const s = Math.max(0, sickness || 0);
  return {
    con: Math.min(SICK_CON_PENALTY_CAP, s),
    agi: Math.min(SICK_AGI_PENALTY_CAP, s),
    per: Math.min(SICK_PER_PENALTY_CAP, s),
  };
}

// Sets current* from base* scaled by how depleted nutrition/hydration/energy are.
export function applySurvivalCascade(player) {
  if (!player) return;

  const nutritionDeficit = Math.max(0, 1 - player.nutrition / (player.maxNutrition || 25));
  const hydrationDeficit = Math.max(0, 1 - player.hydration / (player.maxHydration || 25));
  const energyDeficit = Math.max(0, 1 - player.energy / (player.maxEnergy || 25));
  const avgDeficit = (nutritionDeficit + hydrationDeficit + energyDeficit) / 3;
  const conditionMultiplier = 1 - avgDeficit * CASCADE_MAX_PENALTY;

  // Sickness and wound infection share one attribute-penalty channel. Take whichever
  // demands the larger drop rather than stacking them, so a sick-AND-infected player is
  // penalized once (by the worse of the two) instead of being double-docked.
  const effectiveSickness = Math.max(
    player.sickness || 0,
    player.woundInfection ? WOUND_INFECTION_LEVEL : 0
  );
  const sick = sicknessPenalties(effectiveSickness);

  const isInfected = !!player.isInfected;
  const isTreated = isInfected && (player.treatmentTicksRemaining > 0);

  let strMult = 1, agiMult = 1, perMult = 1, conMult = 1;
  let strImmune = false, agiImmune = false, perImmune = false, conImmune = false;

  if (isInfected && !isTreated) {
    // debuff all attributes by a flat 10%
    strMult = 0.9;
    agiMult = 0.9;
    perMult = 0.9;
    conMult = 0.9;
  } else if (isTreated) {
    // A brainstem stew carries a precomputed multi-attribute effects map (player.treatmentEffects);
    // raw brain pulp carries only a single subtype key. Prefer the map when present, else look up
    // the subtype's profile — both share the same { strength: { multiplier, immune }, ... } shape.
    let effects = null;
    if (player.treatmentEffects) {
      effects = player.treatmentEffects;
    } else if (player.treatmentSubtype) {
      effects = TREATMENT_EFFECTS[player.treatmentSubtype.toLowerCase()]?.effects || null;
    }
    if (effects) {
      if (effects.strength) {
        strMult = effects.strength.multiplier ?? 1.0;
        strImmune = effects.strength.immune ?? false;
      }
      if (effects.agility) {
        agiMult = effects.agility.multiplier ?? 1.0;
        agiImmune = effects.agility.immune ?? false;
      }
      if (effects.perception) {
        perMult = effects.perception.multiplier ?? 1.0;
        perImmune = effects.perception.immune ?? false;
      }
      if (effects.constitution) {
        conMult = effects.constitution.multiplier ?? 1.0;
        conImmune = effects.constitution.immune ?? false;
      }
    }
  }

  const strCond = strImmune ? 1 : conditionMultiplier;
  const agiCond = agiImmune ? 1 : conditionMultiplier;
  const perCond = perImmune ? 1 : conditionMultiplier;
  const conCond = conImmune ? 1 : conditionMultiplier;

  const agiSick = agiImmune ? 0 : sick.agi;
  const perSick = perImmune ? 0 : sick.per;
  const conSick = conImmune ? 0 : sick.con;

  player.currentStrength = Math.max(0, Math.round(player.baseStrength * strCond * strMult));
  // Agility, Perception and Constitution take the survival hit like Strength, PLUS a
  // temporary sickness penalty — this is how the Diseased condition lowers maxAp/maxHp,
  // through the attribute layer rather than by poking AP/HP directly.
  player.currentAgility = Math.max(0, Math.round(player.baseAgility * agiCond * agiMult) - agiSick);
  player.currentPerception = Math.max(0, Math.round(player.basePerception * perCond * perMult) - perSick);
  player.currentConstitution = Math.max(0, Math.round(player.baseConstitution * conCond * conMult) - conSick);
}

// Derives maxHp/maxAp from current attributes and reconciles hp/ap against the new
// caps: a drop in the cap takes the difference off current hp/ap like damage, and a
// rise in the cap adds the difference to current hp/ap like healing. Because HP_FLOOR
// (10) keeps maxHp at or above the player's starting HP, the hp clamp can never reach
// 0, so it never trips death. maxHp uses current Constitution: starvation shrinks the
// bonus but the floor guarantees it never falls below HP_FLOOR.
export function deriveSecondaryStats(player) {
  if (!player) return;

  const oldMaxHp = player.maxHp || 0;
  const newMaxHp = maxHpFromAttributes(player.currentConstitution);
  player.maxHp = newMaxHp;
  if (newMaxHp !== oldMaxHp) {
    player.hp = Math.max(0, Math.min(newMaxHp, player.hp + (newMaxHp - oldMaxHp)));
  }

  const oldMaxAp = player.maxAp || 0;
  const apAttrBonus = maxApBonusFromAttributes(player.currentAgility, player.currentPerception);
  // R37#2: no AP_FLOOR max() — apAttrBonus is always >= 0, so AP_BASE + bonus
  // can never fall below the old floor of 5; this now matches deriveSecondaryStats.
  const newMaxAp = AP_BASE + apAttrBonus;
  player.maxAp = newMaxAp;
  if (newMaxAp !== oldMaxAp) {
    player.ap = Math.max(0, Math.min(newMaxAp, player.ap + (newMaxAp - oldMaxAp)));
  }
}

// One recompute path: cascade current attributes, then derive maxHp/maxAp from them.
export function recalcCharacter(player) {
  if (!player) return;
  applySurvivalCascade(player);
  deriveSecondaryStats(player);

  // Recalculate vision range: +1 sight range for every 20 points of current Perception
  if (player.hasComponent('Vision')) {
    const vision = player.getComponent('Vision');
    const perceptionBonus = Math.floor((player.currentPerception || 0) / 20);
    vision.range = 15 + perceptionBonus;
  }
}

/**
 * Ticks down player infection or treatment timer.
 * Emits messages via the provided logCallback.
 */
export function tickInfection(player, logCallback = null) {
  if (!player || !player.isInfected) return;

  if (player.treatmentTicksRemaining > 0) {
    player.treatmentTicksRemaining -= 1;
    if (player.treatmentTicksRemaining === 0) {
      player.treatmentSubtype = null;
      player.treatmentEffects = null;
      player.treatmentColor = null;
      player.treatmentName = null;
      if (logCallback) {
        logCallback("Your treatment has worn off! The infection resumes...", "warning");
      }
    }
  } else {
    player.infectionTicksRemaining -= 1;
    if (player.infectionTicksRemaining <= 0) {
      player.hp = 0;
      if (logCallback) {
        logCallback("You have succumbed to the zombie virus.", "danger");
      }
    }
  }
}

/**
 * Per-turn chance (0-1) for a Constitution roll to clear a wound infection. Higher
 * Constitution recovers faster; resting (asleep=true) adds a flat bonus.
 */
export function woundInfectionCureChance(currentConstitution = 0, asleep = false) {
  const conBonus = ((currentConstitution || 0) - 20) * WOUND_CURE_CON_STEP;
  const chance = WOUND_CURE_BASE + conBonus + (asleep ? WOUND_CURE_SLEEP_BONUS : 0);
  return Math.max(WOUND_CURE_MIN, Math.min(WOUND_CURE_MAX, chance));
}

/**
 * Rolls the per-tick Constitution check against an active wound infection. On success
 * clears the infection and logs recovery; returns true iff the player was cured this
 * tick. Shared by the per-turn (awake) and per-hour (asleep) loops so both use the
 * same odds, differing only by the asleep bonus.
 */
export function rollWoundInfectionCure(player, { asleep = false, logCallback = null } = {}) {
  if (!player || !player.woundInfection) return false;
  const chance = woundInfectionCureChance(player.currentConstitution, asleep);
  if (gameRandom.next() < chance) {
    player.woundInfection = false;
    player.notifyChange?.();
    if (logCallback) {
      logCallback('Your wound has healed cleanly — the infection has passed.', 'status');
    }
    return true;
  }
  return false;
}

/**
 * Shared helper to calculate derived max HP and max AP from base attributes (used for UI previews).
 */
export function previewDerivedStats({ constitution, agility, perception }) {
  const maxHp = maxHpFromAttributes(constitution);
  const maxAp = AP_BASE + maxApBonusFromAttributes(agility, perception);
  return { maxHp, maxAp };
}
