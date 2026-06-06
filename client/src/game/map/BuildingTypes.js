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
 * Check if a building type is designated as a special building
 * @param {string} type
 * @returns {boolean}
 */
export function isSpecialBuilding(type) {
  return !!(BuildingTypes[type] && BuildingTypes[type].isSpecial);
}
