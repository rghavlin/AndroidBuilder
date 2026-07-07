// Character stat recomputation. Two ordered steps, both player-only:
//   1. applySurvivalCascade — hunger/thirst/exhaustion scale CURRENT Strength/
//      Agility/Perception/Constitution down from their BASE values.
//   2. deriveSecondaryStats — maxHp and maxAp are DERIVED from those current
//      attributes (never hand-set). maxHp from Constitution, maxAp from Agility+
//      Perception minus a fatigue penalty.
// recalcCharacter runs both in order. Shared by GameContext's per-turn processing,
// SleepContext's per-hour sleep loop, and EntityFactory at player creation, so all
// three use the exact same formulas.
//
// IMPORTANT — player-only: applySurvivalCascade reads nutrition/hydration/energy,
// which live on SurvivalStats. NPCs don't carry SurvivalStats (their facades read
// 0), so running this on an NPC would compute a full deficit and halve their stats.
// Only ever call recalcCharacter on the player; NPCs keep their typeDef hp/maxAP.
const CASCADE_MAX_PENALTY = 0.5; // fully depleted needs cap stats at 50% of base

const HP_FLOOR = 10;   // max HP never drops below this, whatever Constitution does
const AP_BASE = 10;    // max AP before attribute bonus / fatigue penalty
const AP_FLOOR = 5;    // max AP never drops below this — never fully incapacitated
const AP_EXHAUSTION_COEF = 10; // energy deficit (0-1) × this = AP knocked off the base
// While sick, these attributes are temporarily sapped (1 per remaining sickness turn,
// each capped), tapering to 0 as the counter clears. This is how the "Diseased"
// condition affects the character — entirely through the attribute layer rather than
// poking HP/AP directly: Constitution → lower maxHp; Agility + Perception → lower maxAp
// (and, as a side effect, dodge / crit / hearing). Strength is left intact.
const SICK_CON_PENALTY_CAP = 10;
const SICK_AGI_PENALTY_CAP = 8;
const SICK_PER_PENALTY_CAP = 8;

export function sicknessPenalties(sickness = 0) {
  const s = Math.max(0, sickness || 0);
  return {
    con: Math.min(SICK_CON_PENALTY_CAP, s),
    agi: Math.min(SICK_AGI_PENALTY_CAP, s),
    per: Math.min(SICK_PER_PENALTY_CAP, s),
  };
}

// Sets current* from base* scaled by how depleted the three needs are, and returns
// the individual energy deficit (0-1) so the AP derivation can apply a fatigue
// penalty keyed to exhaustion specifically rather than the blended average.
export function applySurvivalCascade(player) {
  if (!player) return { energyDeficit: 0 };

  const nutritionDeficit = Math.max(0, 1 - player.nutrition / (player.maxNutrition || 25));
  const hydrationDeficit = Math.max(0, 1 - player.hydration / (player.maxHydration || 25));
  const energyDeficit = Math.max(0, 1 - player.energy / (player.maxEnergy || 25));
  const avgDeficit = (nutritionDeficit + hydrationDeficit + energyDeficit) / 3;
  const conditionMultiplier = 1 - avgDeficit * CASCADE_MAX_PENALTY;

  const sick = sicknessPenalties(player.sickness);

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
  } else if (isTreated && player.treatmentSubtype) {
    const sub = player.treatmentSubtype.toLowerCase();
    if (sub === 'basic' || sub === 'zombie') {
      strImmune = true;
    } else if (sub === 'runner') {
      agiMult = 1.1;
      agiImmune = true;
    } else if (sub === 'acid') {
      conMult = 1.1;
      conImmune = true;
    } else if (sub === 'fat') {
      conMult = 1.05;
      strMult = 1.05;
      conImmune = true;
      strImmune = true;
    } else if (sub === 'peeper') {
      perMult = 1.1;
      perImmune = true;
    } else if (sub === 'mutant') {
      strMult = 1.2;
      agiMult = 1.2;
      perMult = 1.2;
      conMult = 1.2;
      strImmune = true;
      agiImmune = true;
      perImmune = true;
      conImmune = true;
    } else if (sub === 'spitter') {
      agiMult = 1.05;
      conMult = 1.05;
      agiImmune = true;
      conImmune = true;
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

  return { energyDeficit };
}

// Derives maxHp/maxAp from current attributes and re-clamps hp/ap into the new
// caps. Clamping only ever lowers current values — and because HP_FLOOR (10) keeps
// maxHp at or above the player's starting HP, the hp clamp can never reach 0, so it
// never trips death. maxHp uses current Constitution: starvation shrinks the bonus
// but the floor guarantees it never falls below HP_FLOOR.
export function deriveSecondaryStats(player, energyDeficit = 0) {
  if (!player) return;

  const conBonus = Math.max(0, Math.floor((player.currentConstitution || 0) * 0.2));
  const newMaxHp = HP_FLOOR + conBonus;
  player.maxHp = newMaxHp;
  if (player.hp > newMaxHp) player.hp = newMaxHp;

  const apAttrBonus = Math.floor(((player.currentAgility || 0) + (player.currentPerception || 0)) / 6);
  const exhaustionPenalty = Math.round(energyDeficit * AP_EXHAUSTION_COEF);
  const newMaxAp = Math.max(AP_FLOOR, AP_BASE + apAttrBonus - exhaustionPenalty);
  player.maxAp = newMaxAp;
  if (player.ap > newMaxAp) player.ap = newMaxAp;
}

// One recompute path: cascade current attributes, then derive maxHp/maxAp from them.
export function recalcCharacter(player) {
  if (!player) return;
  const { energyDeficit } = applySurvivalCascade(player);
  deriveSecondaryStats(player, energyDeficit);

  // Recalculate vision range: +1 sight range for every 20 points of current Perception
  if (player.hasComponent('Vision')) {
    const vision = player.getComponent('Vision');
    const perceptionBonus = Math.floor((player.currentPerception || 0) / 20);
    vision.range = 15 + perceptionBonus;
  }
}
