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
}
