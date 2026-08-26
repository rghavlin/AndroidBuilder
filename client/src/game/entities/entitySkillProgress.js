import { AttributeProgressionManager } from '../systems/AttributeProgressionManager.js';
import { PlayerSkills } from '../components/PlayerSkills.js';

/**
 * Skill progression for an entity: crafting, melee/ranged hits, and defense.
 * All three follow the same shape — bump a counter, trickle attribute XP for the
 * player only, and level up on crossing the next milestone — so they live
 * together here rather than in Entity.js, which is under managed decomposition
 * (AGENTS.md §6). Entity keeps thin delegating methods; these take the entity as
 * their first argument and touch nothing else.
 */

/** Crafting progress from AP spent at a workbench. */
export function onItemCrafted(entity, apUsed = 1) {
  entity.craftingApUsed += apUsed;
  const nextTarget = PlayerSkills.getNextCraftingTarget(entity.craftingLvl);
  if (entity.craftingApUsed >= nextTarget) {
    entity.craftingLvl++;
    if (entity.type === 'player') {
      AttributeProgressionManager.recordAction(entity, 'CRAFTING_SKILL_UP');
    }
  }
  entity.notifyChange();
}

/**
 * Fires on every landed hit (not just kills) — skill progress and its paired
 * attribute-XP trickle are both hit-driven, decoupled from whether the hit
 * happened to be lethal. Melee grants Strength+Agility XP per hit, Ranged
 * grants Agility+Perception, mirroring their skill-seed pairs. Returns the
 * new level on a milestone crossing, or null otherwise.
 */
export function recordHit(entity, type) {
  const isMelee = type === 'melee';
  const hitField = isMelee ? 'meleeHits' : 'rangedHits';
  const lvlField = isMelee ? 'meleeLvl' : 'rangedLvl';
  const currentLevel = entity[lvlField];

  entity.modifyStat(hitField, 1);
  if (entity.type === 'player') {
    AttributeProgressionManager.recordAction(entity, isMelee ? 'MELEE_HIT' : 'RANGED_HIT');
  }

  const nextMilestone = PlayerSkills.getNextHitMilestone(currentLevel);
  if (entity[hitField] >= nextMilestone) {
    const newLevel = currentLevel + 1;
    entity.setStat(lvlField, newLevel);
    return newLevel;
  }
  return null;
}

/**
 * Fires on every successfully contested defense (the attacker's own hit
 * roll succeeded, and this entity then evaded it) — an attack that would
 * have missed anyway never calls this, since resolveDefense is only
 * invoked from inside a roll function's `if (hit)` branch. Mirrors
 * recordHit's per-action growth model exactly; grants Agility+Perception
 * XP, matching Defense's seed pair. Player and NPC both progress; only the
 * player also gets the attribute-XP trickle (same gating as recordHit).
 */
export function recordDefense(entity) {
  const currentLevel = entity.defenseLvl;
  entity.modifyStat('defenseHits', 1);
  if (entity.type === 'player') {
    AttributeProgressionManager.recordAction(entity, 'DEFENSE_SUCCESS');
  }

  const nextMilestone = PlayerSkills.getNextHitMilestone(currentLevel);
  if (entity.defenseHits >= nextMilestone) {
    const newLevel = currentLevel + 1;
    entity.setStat('defenseLvl', newLevel);
    return newLevel;
  }
  return null;
}
