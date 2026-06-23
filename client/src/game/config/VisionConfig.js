/**
 * Centralized configuration and helpers for vision mechanics (e.g. Day/Night cycle, weather reductions)
 */

export const MAX_VISION_RANGE = 15;
export const FLASHLIGHT_RANGE = 8;

/**
 * Calculates base ambient sight range based on the hour of the day.
 * @param {number} hour - Hour of the day (0 to 23)
 * @param {number} maxRange - The default/maximum daylight range
 * @returns {number} The calculated base ambient sight range
 */
export function getSightRangeForHour(hour, maxRange) {
  // ambient base range mappings based on time of day
  if (hour === 19) {
    return 12;
  }
  if (hour === 20) {
    return 8;
  }
  if (hour === 21) {
    return 4;
  }
  if (hour === 22 || hour === 23 || hour === 0 || hour === 1 || hour === 2 || hour === 3) {
    return 1.5;
  }
  if (hour === 4) {
    return 4;
  }
  if (hour === 5) {
    return 8;
  }
  
  return maxRange;
}
