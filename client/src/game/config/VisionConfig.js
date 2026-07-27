/**
 * Centralized configuration and helpers for vision mechanics (e.g. Day/Night cycle, weather reductions)
 */

export const MAX_VISION_RANGE = 15;
export const FLASHLIGHT_RANGE = 8;

/**
 * Map light modes (map.metadata.lightMode).
 *   time_dependent — normal outdoor day/night cycle, driven by the game clock.
 *   always_light   — powered interior: the map is permanently at noon.
 *   always_dark    — unpowered interior: the map is permanently at midnight.
 *
 * The two "always" modes are defined as *pinned clock hours*, not as a parallel
 * set of lighting rules. Everything downstream (ambient sight range, isNight,
 * the fog/night tint) is derived from getEffectiveHour() below, so an
 * always_light map is identical to a standard map at noon by construction —
 * there is no second code path that could drift away from it.
 */
export const ALWAYS_LIGHT_HOUR = 12;
export const ALWAYS_DARK_HOUR = 0;

/**
 * Normalize a map's light mode, tolerating the legacy `alwaysDark` boolean that
 * predates lightMode (older saved maps and scenarios still carry only that).
 * @param {object} [mapMetadata] - gameMap.metadata (or any {lightMode, alwaysDark})
 * @returns {'time_dependent'|'always_light'|'always_dark'}
 */
export function getLightMode(mapMetadata) {
  const mode = mapMetadata?.lightMode;
  if (mode === 'always_light' || mode === 'always_dark' || mode === 'time_dependent') return mode;
  return mapMetadata?.alwaysDark ? 'always_dark' : 'time_dependent';
}

/**
 * The hour the lighting model should use for this map: the real clock hour on a
 * time_dependent map, or the pinned hour of an always_light/always_dark map.
 * @param {object} [mapMetadata] - gameMap.metadata
 * @param {number} actualHour - hour from the game clock (getHourFromTurn)
 * @returns {number} Hour of the day (0-23) to light the map by
 */
export function getEffectiveHour(mapMetadata, actualHour) {
  switch (getLightMode(mapMetadata)) {
    case 'always_light': return ALWAYS_LIGHT_HOUR;
    case 'always_dark': return ALWAYS_DARK_HOUR;
    default: return actualHour;
  }
}

/**
 * Whether an hour counts as night for tinting/vision purposes.
 * @param {number} hour - Hour of the day (0 to 23)
 */
export function isNightHour(hour) {
  return hour >= 20 || hour < 6;
}

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
