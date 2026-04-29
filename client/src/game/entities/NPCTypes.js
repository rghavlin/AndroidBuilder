/**
 * NPC Types Configuration
 * Centralized stats, item pools, and AI chances for NPCs.
 */

export const NPCTypes = {
  survivor: {
    name: 'Survivor',
    hp: 20,
    maxAP: 20,
    hostilityChance: 0.25,
    fleeRecoverChance: 0.30,
    itemPool: [
      'food.canned_beans', 
      'food.energy_bar', 
      'medical.bandage', 
      'tool.lighter', 
      'weapon.knife', 
      'tool.flashlight'
    ],
    minItems: 2,
    maxItems: 4
  }
};

/**
 * Get NPC definition for a given subtype
 * @param {string} subtype 
 * @returns {Object}
 */
export function getNPCType(subtype) {
  return NPCTypes[subtype] || NPCTypes.survivor;
}
