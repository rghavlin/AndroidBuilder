import engine from '../GameEngine.js';
import { recalcCharacter } from '../utils/SurvivalCascade.js';
import GameEvents, { GAME_EVENT } from '../utils/GameEvents.js';

/**
 * AttributeProgressionManager
 * Handles the logic for granting XP to base RPG attributes (Strength, Agility, Perception, Constitution).
 * When an attribute's XP reaches the required threshold, it rolls 1d3 to increase the base stat.
 */
// Master pacing dial for attribute leveling. XP to raise an attribute currently at
// `value` by one 1d3 roll = ATTR_XP_COEF * value^1.5. Still value-based, so pushing a
// stat toward the 100 cap costs progressively more (natural diminishing returns) — but
// the coefficient was 100, which made a base-20 stat need ~8,900 XP at a 4-per-hit
// trickle (thousands of hits per level). Lower this to level attributes more often.
const ATTR_XP_COEF = 6;

export class AttributeProgressionManager {
  static getRequiredXP(currentStatLevel) {
    // Value-based exponential curve for attribute leveling
    return ATTR_XP_COEF * Math.pow(currentStatLevel, 1.5);
  }

  /**
   * Called to record an action that gives attribute experience.
   * @param {Entity} entity The entity performing the action (usually the player)
   * @param {string} action The name of the action (e.g. 'MELEE_HIT')
   * @param {Object} payload Additional context, like `apSpent` or `amount`
   */
  static recordAction(entity, action, payload = {}) {
    if (!entity || entity.type !== 'player') return;

    const stats = entity.getComponent('RpgStats');
    if (!stats) return;

    const xpGained = { strengthXP: 0, agilityXP: 0, perceptionXP: 0, constitutionXP: 0 };

    switch (action) {
      case 'MELEE_HIT':
        // Small trickle per landed hit (not a lump at level-up) — split across
        // Melee's seed pair, Strength+Agility, mirroring HEARING_SUCCESS in
        // magnitude. Provisional, tune from playtesting.
        xpGained.strengthXP = 4;
        xpGained.agilityXP = 4;
        break;
      case 'BUTCHER_RABBIT':
        xpGained.strengthXP = 15;
        xpGained.agilityXP = 15;
        break;
      case 'PULL_WAGON':
        // Payload should contain apSpent (the extra AP penalty for dragging)
        xpGained.strengthXP = (payload.apSpent || 0) * 1.5;
        break;

      case 'RANGED_HIT':
        // Ranged's seed pair is Agility+Perception — same per-hit trickle pattern as MELEE_HIT.
        xpGained.agilityXP = 4;
        xpGained.perceptionXP = 4;
        break;
      case 'HEARING_SUCCESS':
        xpGained.perceptionXP = 5;
        break;
      case 'LOCKPICK':
        // Split XP between Agility and Perception
        xpGained.perceptionXP = 10;
        xpGained.agilityXP = 10;
        break;

      case 'CRAFTING_SKILL_UP':
        // A crafting skill-up sharpens hands and eyes — a modest flat bump split
        // across Agility + Perception. This USED to grant getRequiredXP(baseAgility),
        // a whole attribute level in one shot, which is why Agility was the only
        // attribute that ever leveled. Now a trickle in line with combat gains.
        xpGained.agilityXP = 30;
        xpGained.perceptionXP = 30;
        break;
      case 'TAKE_DAMAGE':
        // Surviving injury toughens the body — Constitution's steady income source.
        // Without this Constitution barely gained XP (only healing, sickness ticks,
        // and disease recovery), so it effectively never leveled. Scales with the
        // hit taken; fired from Entity.takeDamage for the player.
        xpGained.constitutionXP = (payload.amount || 0) * 4;
        break;
      case 'DEFENSE_SUCCESS':
        // Fires on every successfully contested defense, not just occasional
        // dodge attempts (the old AP-gated model) — split Agility+Perception
        // trickle matching Defense's seed pair, same magnitude as MELEE_HIT/
        // RANGED_HIT for consistency.
        xpGained.agilityXP = 4;
        xpGained.perceptionXP = 4;
        break;
      case 'SPRINT_BONUS':
        // Payload contains apSaved from pathfinding fractional discount
        xpGained.agilityXP = (payload.apSaved || 0) * 5;
        break;

      case 'HEAL_DAMAGE':
        // Payload contains amount healed
        xpGained.constitutionXP = (payload.amount || 0) * 2;
        break;
      case 'ENDURE_HARDSHIP':
        // Tick of survival from sickness, starvation, or dehydration
        xpGained.constitutionXP = 1;
        break;
      case 'DISEASE_RECOVERED':
        xpGained.constitutionXP = 50;
        break;
      
      case 'READ_LIFE_IN_MOTION':
        // Payload contains pagesRead
        const pagesRead = payload.pagesRead || 0;
        xpGained.agilityXP = pagesRead * 5;
        xpGained.perceptionXP = pagesRead * 5;
        break;

      default:
        console.warn(`[AttributeProgression] Unhandled action: ${action}`);
        return;
    }

    this.applyXP(entity, stats, xpGained);
  }

  static applyXP(entity, stats, xpGained) {
    let xpAdded = false;

    // Helper function to process individual stats
    const processStat = (statName, xpName, xpSpentName) => {
      if (xpGained[xpName] > 0) {
        stats[xpName] += xpGained[xpName];
        xpAdded = true;
        
        const currentProgress = stats[xpName] - (stats[xpSpentName] || 0);
        const requiredXP = this.getRequiredXP(stats[statName]);
        if (currentProgress >= requiredXP) {
          const statLabel = statName.replace('base', '');
          GameEvents.emit(GAME_EVENT.ATTRIBUTE_ROLL_READY, { statName, statLabel });
        }
      }
    };

    processStat('baseStrength', 'strengthXP', 'strengthXpSpent');
    processStat('baseAgility', 'agilityXP', 'agilityXpSpent');
    processStat('basePerception', 'perceptionXP', 'perceptionXpSpent');
    processStat('baseConstitution', 'constitutionXP', 'constitutionXpSpent');

    if (xpAdded) {
      if (typeof entity.notifyChange === 'function') {
        entity.notifyChange();
      }
    }
  }

  /**
   * Triggers a manual stat roll for the given attribute.
   * @param {Entity} entity The player entity
   * @param {string} statType The type of stat ('strength', 'agility', 'perception', 'constitution')
   * @returns {number|null} The value rolled, or null if not enough XP
   */
  static rollAttribute(entity, statType) {
    if (!entity) return null;
    const stats = entity.getComponent('RpgStats');
    if (!stats) return null;

    const statName = `base${statType.charAt(0).toUpperCase()}${statType.slice(1)}`;
    const xpName = `${statType}XP`;
    const xpSpentName = `${statType}XpSpent`;

    const currentProgress = stats[xpName] - (stats[xpSpentName] || 0);
    const requiredXP = this.getRequiredXP(stats[statName]);
    if (currentProgress >= requiredXP) {
      stats[xpSpentName] = (stats[xpSpentName] || 0) + requiredXP;

      // Roll 1d3
      const roll = Math.floor(Math.random() * 3) + 1;

      // Cap at 100
      stats[statName] = Math.min(100, stats[statName] + roll);
      
      const currentName = `current${statType.charAt(0).toUpperCase()}${statType.slice(1)}`;
      stats[currentName] = Math.min(100, stats[currentName] + roll);

      if (typeof entity.notifyChange === 'function') {
        entity.notifyChange();
      }
      recalcCharacter(entity);

      GameEvents.emit(GAME_EVENT.ATTRIBUTE_UPGRADED, { statType, roll });

      return roll;
    }

    return null;
  }
}
