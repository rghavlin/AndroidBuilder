// Survival cascade: hunger/thirst/exhaustion scale current Strength/Agility/
// Perception down from their base values. All three needs feed all three
// stats uniformly for now (no per-stat pairing yet). Shared by GameContext's
// per-turn processing and SleepContext's per-hour sleep loop so both use the
// exact same formula.
const CASCADE_MAX_PENALTY = 0.5; // fully depleted needs cap stats at 50% of base

export function applySurvivalCascade(player) {
  if (!player) return;

  const nutritionDeficit = Math.max(0, 1 - player.nutrition / (player.maxNutrition || 25));
  const hydrationDeficit = Math.max(0, 1 - player.hydration / (player.maxHydration || 25));
  const energyDeficit = Math.max(0, 1 - player.energy / (player.maxEnergy || 25));
  const avgDeficit = (nutritionDeficit + hydrationDeficit + energyDeficit) / 3;
  const conditionMultiplier = 1 - avgDeficit * CASCADE_MAX_PENALTY;

  player.currentStrength = Math.round(player.baseStrength * conditionMultiplier);
  player.currentAgility = Math.round(player.baseAgility * conditionMultiplier);
  player.currentPerception = Math.round(player.basePerception * conditionMultiplier);
}
