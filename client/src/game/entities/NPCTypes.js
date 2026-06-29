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
    sightRange: 18,
    
    // AI Behavior Tuning
    ai: {
      dangerRadius: 5,          // How close a zombie can be before NPC flees
      fleePreference: 0.85,     // 85% chance to try fleeing even when they could fight
      combatSkill: 0.5,         // Base accuracy (melee and ranged)
      surroundThreshold: 3      // Standing ground when surrounded by 3+ zombies
    },
    
    // Categorized pools for structured generation
    pools: {
      weapons: [
        'weapon.knife',
        'weapon.woodenbat',
        'weapon.hammer',
        'weapon.machete',
        'weapon.crowbar',
        'weapon.fire_axe',
        'weapon.9mmPistol',
        'weapon.357Pistol'
      ],
      foodWater: [
        'food.beans',
        'food.granolabar',
        'food.chips',
        'food.apple',
        'food.waterbottle',
        'food.softdrink',
        'food.cannedsoup'
      ],
      rare: [
        'weapon.9mmPistol',
        'weapon.357Pistol',
        'backpack.standard',
        'container.medkit',
        'tool.nightvision',
        'food.mre'
      ],
      general: [
        'medical.bandage',
        'medical.antiseptic',
        'tool.battery',
        'tool.flashlight',
        'tool.lighter',
        'tool.matches',
        'crafting.nail',
        'crafting.rope',
        'crafting.garbage_bag'
      ]
    },
    
    minItems: 10,
    maxItems: 20
  },
  shopkeeper: {
    name: 'Town Merchant',
    factionId: 'town',
    hp: 20,
    maxAP: 0,
    hostilityChance: 0,
    fleeRecoverChance: 0,
    sightRange: 5,
    pools: { weapons: [], foodWater: [], rare: [], general: [] },
    minItems: 0,
    maxItems: 0
  },
  // Stationary guard blocking the only opening of an exit tollgate. Town faction
  // so the gate turrets never target it (and attacking it can escalate them).
  // Killable (hp 20) but the player still can't outrun the turrets to the exit.
  gatekeeper: {
    name: 'Gatekeeper',
    factionId: 'town',
    hp: 20,
    maxAP: 0,
    hostilityChance: 0,
    fleeRecoverChance: 0,
    sightRange: 5,
    pools: { weapons: [], foodWater: [], rare: [], general: [] },
    minItems: 0,
    maxItems: 0
  }
};

/**
 * Get NPC definition for a given subtype
 * @param {string} subtype 
 * @returns {Object}
 */
export function getNPCType(subtype) {
  if (subtype && !NPCTypes[subtype]) {
    console.warn(`[NPCTypes] Unknown NPC subtype "${subtype}", falling back to survivor`);
  }
  return NPCTypes[subtype] || NPCTypes.survivor;
}
