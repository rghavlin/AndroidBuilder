import { gameRandom } from '../utils/SeededRandom.js';
/**
 * ProgressionConfig - Centralized difficulty scaling for map progression
 */

// Standard 45x125 map area — used to scale entity counts for larger/smaller maps
export const BASELINE_MAP_AREA = 5625;

export const DEFAULT_DANGER_RADIUS = 8;

export const LootProgression = {
  WATER_BOTTLE_RESTRICTION_MAP: 3,
};

export const MapProgression = {
  1: {
    basicCount: 18,
    crawlerRange: { min: 3, max: 6 },
    acidRange: { min: 1, max: 1 },
    fatRange: { min: 1, max: 1 },
    runnerCount: 1,
    peeperCount: 1,
    spitterCount: 0,
    maxTotal: 120
  },
  2: {
    basicCount: 35,
    crawlerRange: { min: 6, max: 10 },
    acidRange: { min: 3, max: 5 },
    fatRange: { min: 4, max: 7 },
    runnerCount: 3,
    peeperCount: 3,
    spitterCount: 2,
    maxTotal: 180,
    randomSpecialized: {
      swatChance: 0.30,
      firefighterChance: 0.30,
      soldierChance: 0.20
    }
  },
  3: {
    basicCount: 24,
    crawlerRange: { min: 3, max: 6 },
    acidRange: { min: 1, max: 2 },
    fatRange: { min: 2, max: 3 },
    runnerCount: 2,
    peeperCount: 2,
    spitterCount: 0,
    maxTotal: 120
  },
  4: {
    basicCount: 25,
    crawlerRange: { min: 4, max: 7 },
    acidRange: { min: 2, max: 3 },
    fatRange: { min: 3, max: 4 },
    runnerCount: 2,
    peeperCount: 2,
    spitterCount: 1,
    maxTotal: 120
  },
  5: {
    basicCount: 51,
    crawlerRange: { min: 9, max: 15 },
    acidRange: { min: 5, max: 7 },
    fatRange: { min: 7, max: 9 },
    runnerCount: 2,
    peeperCount: 2,
    spitterCount: 1,
    maxTotal: 226
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
  const maxDefinedMap = 5;
  const baseConfig = MapProgression[maxDefinedMap];
  const delta = mapNumber - maxDefinedMap;

  // Scaling rules (More aggressive now that we don't have double-scaling)
  const extraFat = Math.floor(mapNumber / 2.5);
  const extraCrawler = Math.floor(mapNumber / 2.5);
  const extraAcid = Math.floor(mapNumber / 3);

  return {
    basicCount: baseConfig.basicCount + delta * 5,
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
    runnerCount: gameRandom.nextInt(0, 2) + 2,
    peeperCount: gameRandom.nextInt(0, 2) + 2,
    maxTotal: baseConfig.maxTotal + delta * 20,
    spitterCount: mapNumber >= 3 ? Math.floor((mapNumber - 1) / 2) : 0,
    randomSpecialized: {
      swatChance: 0.20,
      firefighterChance: 0.20,
      soldierChance: 0.15
    }
  };
}

export const TOLL_TARGET = 200;

