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
  player.currentStrength = Math.round(player.baseStrength * conditionMultiplier);
  // Agility, Perception and Constitution take the survival hit like Strength, PLUS a
  // temporary sickness penalty — this is how the Diseased condition lowers maxAp/maxHp,
  // through the attribute layer rather than by poking AP/HP directly.
  player.currentAgility = Math.max(0, Math.round(player.baseAgility * conditionMultiplier) - sick.agi);
  player.currentPerception = Math.max(0, Math.round(player.basePerception * conditionMultiplier) - sick.per);
  player.currentConstitution = Math.max(0, Math.round(player.baseConstitution * conditionMultiplier) - sick.con);

  return { energyDeficit };
}

// Derives maxHp/maxAp from current attributes and re-clamps hp/ap into the new
// caps. Clamping only ever lowers current values — and because HP_FLOOR (10) keeps
// maxHp at or above the player's starting HP, the hp clamp can never reach 0, so it
// never trips death. maxHp uses current Constitution: starvation shrinks the bonus
// but the floor guarantees it never falls below HP_FLOOR.
export function deriveSecondaryStats(player, energyDeficit = 0) {
  if (!player) return;

  const conBonus = Math.max(0, Math.floor((player.currentConstitution || 0) * 0.5));
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
}
