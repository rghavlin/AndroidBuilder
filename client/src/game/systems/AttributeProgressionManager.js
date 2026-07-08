import engine from '../GameEngine.js';
import { recalcCharacter } from '../utils/SurvivalCascade.js';
import GameEvents, { GAME_EVENT } from '../utils/GameEvents.js';

/**
 * AttributeProgressionManager
 * Handles the logic for granting XP to base RPG attributes (Strength, Agility, Perception, Constitution).
 * When an attribute's XP reaches the required threshold, it rolls 1d3 to increase the base stat.
 */
export class AttributeProgressionManager {
  static getRequiredXP(currentStatLevel) {
    // Standard exponential curve for attribute leveling
    return 100 * Math.pow(currentStatLevel, 1.5);
  }

  /**
   * Called to record an action that gives attribute experience.
   * @param {Entity} entity The entity performing the action (usually the player)
   * @param {string} action The name of the action (e.g. 'MELEE_SKILL_UP')
   * @param {Object} payload Additional context, like `apSpent` or `amount`
   */
  static recordAction(entity, action, payload = {}) {
    if (!entity || entity.type !== 'player') return;

    const stats = entity.getComponent('RpgStats');
    if (!stats) return;

    const xpGained = { strengthXP: 0, agilityXP: 0, perceptionXP: 0, constitutionXP: 0 };

    switch (action) {
      case 'MELEE_SKILL_UP':
        // A skill level up grants enough XP to guarantee a stat roll.
        xpGained.strengthXP = this.getRequiredXP(stats.baseStrength);
        break;
      case 'PULL_WAGON':
        // Payload should contain apSpent (the extra AP penalty for dragging)
        xpGained.strengthXP = (payload.apSpent || 0) * 1.5;
        break;

      case 'RANGED_SKILL_UP':
        xpGained.perceptionXP = this.getRequiredXP(stats.basePerception);
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
        xpGained.agilityXP = this.getRequiredXP(stats.baseAgility);
        break;
      case 'DODGE_SUCCESS':
        xpGained.agilityXP = 15;
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
