/**
 * ProgressionConfig - Centralized difficulty scaling for map progression
 */

export const LootProgression = {
  WATER_BOTTLE_RESTRICTION_MAP: 3,
};

export const MapProgression = {
  1: {
    basicCount: 18,
    crawlerRange: { min: 3, max: 6 },
    acidRange: { min: 0, max: 0 },
    fatRange: { min: 0, max: 0 },
    runnerCount: 1,
    maxTotal: 120
  },
  2: {
    basicCount: 24,
    crawlerRange: { min: 3, max: 6 },
    acidRange: { min: 1, max: 2 },
    fatRange: { min: 2, max: 3 },
    runnerCount: 2,
    maxTotal: 120
  },
  3: {
    basicCount: 25,
    crawlerRange: { min: 4, max: 7 },
    acidRange: { min: 2, max: 3 },
    fatRange: { min: 3, max: 4 },
    runnerCount: 2,
    maxTotal: 120
  }
};

/**
 * Get difficulty settings for a specific map number
 * @param {number} mapNumber 
 * @returns {Object}
 */
export function getProgressionForMap(mapNumber) {
  // If explicitly defined, use that
  if (MapProgression[mapNumber]) {
    return { ...MapProgression[mapNumber] };
  }

  // Otherwise, use the formula for scaling past the max defined map
  const maxDefinedMap = 3;
  const baseConfig = MapProgression[maxDefinedMap];
  const delta = mapNumber - maxDefinedMap;

  // Scaling rules
  const extraFat = Math.floor(mapNumber / 3);
  const extraCrawler = Math.floor(mapNumber / 3);
  const extraAcid = Math.floor(mapNumber / 4);

  return {
    basicCount: 25 + delta * 2,
    crawlerRange: { 
      min: baseConfig.crawlerRange.min + extraCrawler, 
      max: baseConfig.crawlerRange.max + extraCrawler 
    },
    acidRange: { 
      min: baseConfig.acidRange.min + extraAcid, 
      max: baseConfig.acidRange.max + extraAcid 
    },
    fatRange: { 
      min: baseConfig.fatRange.min + extraFat, 
      max: baseConfig.fatRange.max + extraFat 
    },
    runnerCount: Math.floor(Math.random() * 2) + 1, // Keep it relatively low for balance
    maxTotal: 120,
    randomSpecialized: {
      swatChance: 0.15,
      firefighterChance: 0.15,
      soldierChance: 0.10
    }
  };
}
