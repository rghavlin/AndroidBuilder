/**
 * BaseMapGenerator - Strategy interface for map generation
 */
export class BaseMapGenerator {
  /**
   * Main generation entry point
   * @param {Object} config - Generation parameters
   * @param {MapBuilder} builder - MapBuilder utility instance
   */
  generate(config, builder) {
    throw new Error('generate() must be implemented by subclasses');
  }

  /**
   * Get template-specific start position
   */
  getStartPosition(width, height) {
    return { x: Math.floor(width / 2), y: height - 2 };
  }

  /**
   * Utility to get N random elements from an array
   */
  getRandomSubarray(arr, n) {
    if (arr.length <= n) return arr;
    const result = new Array(n);
    let len = arr.length;
    const taken = new Array(len);
    while (n--) {
      const x = Math.floor(Math.random() * len);
      result[n] = arr[x in taken ? taken[x] : x];
      taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
  }

  /**
   * Centralized special building type selection logic
   * @param {number} mapNumber - Current map number
   * @param {string} templateName - Current template name
   * @param {number} count - Number of buildings to select
   * @returns {string[]} - Array of building types
   */
  getSpecialBuildingTypes(mapNumber, templateName, count) {
    const basePool = ['grocer', 'firestation', 'police', 'gas_station', 'hardware_store'];
    let result = [];

    // Rule: Map 1 always includes grocer
    if (mapNumber === 1 && count > 0) {
      result.push('grocer');
    }

    // Rule: Mirrored Winding Road always includes at least one hardware_store
    if (templateName === 'mirrored_winding_road' && count > 0 && !result.includes('hardware_store')) {
      result.push('hardware_store');
    }

    // Fill remaining slots from the random pool
    while (result.length < count) {
      const remainingPool = basePool.filter(type => !result.includes(type));
      if (remainingPool.length === 0) break;
      const randomType = remainingPool[Math.floor(Math.random() * remainingPool.length)];
      result.push(randomType);
    }

    return result;
  }
}
