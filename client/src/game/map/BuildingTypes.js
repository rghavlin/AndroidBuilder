/**
 * Building Types Configuration
 * Centralized list of building type properties.
 */
export const BuildingTypes = {
  residential: { isSpecial: false },
  police: { isSpecial: true },
  firestation: { isSpecial: true },
  grocer: { isSpecial: true },
  gas_station: { isSpecial: true },
  army_tent: { isSpecial: true },
  hardware_store: { isSpecial: true },
  lab: { isSpecial: true }
};

/**
 * Standardized footprints for special buildings, in CANONICAL orientation
 * (front faces the road). drawSpecialBuilding shrinks the reserved lot down to
 * this size and re-anchors it against the road-facing edge, so every special of
 * a given type is the same size and shape regardless of the lot it landed on.
 * Ordered smallest -> largest (gas station smallest, grocer largest).
 * army_tent (its own tent shape) and lab (its own map) are intentionally absent.
 */
export const SPECIAL_BUILDING_SPECS = {
  gas_station:    { width: 8,  height: 8  },
  police:         { width: 10, height: 10 },
  hardware_store: { width: 12, height: 10 },
  firestation:    { width: 12, height: 12 },
  grocer:         { width: 16, height: 14 },
};

/**
 * Check if a building type is designated as a special building
 * @param {string} type
 * @returns {boolean}
 */
export function isSpecialBuilding(type) {
  return !!(BuildingTypes[type] && BuildingTypes[type].isSpecial);
}
