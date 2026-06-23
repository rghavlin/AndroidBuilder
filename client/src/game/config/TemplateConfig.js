/**
 * TemplateConfig.js
 * Centralized metadata and progression rules for map templates
 */

export const TEMPLATE_METADATA = {
  road: {
    name: 'Road',
    size: { width: 45, height: 125 },
    southEntranceX: 22,
    northExitX: 22
  },
  winding_road: {
    name: 'Winding Road',
    size: { width: 85, height: 125 },
    southEntranceX: 22,
    northExitX: 62
  },
  mirrored_winding_road: {
    name: 'Mirrored Winding Road',
    size: { width: 85, height: 125 },
    southEntranceX: 62,
    northExitX: 22
  },
  split_road: {
    name: 'Split Road',
    size: { width: 60, height: 150 },
    southEntranceX: 30,
    northExitX: 30
  },
  lab: {
    name: 'Lab',
    size: { width: 70, height: 84 },
    southEntranceX: 35,
    northExitX: 35
  },
  branching_road: {
    name: 'Branching Road',
    size: { width: 220, height: 260 },
    southEntranceX: 110,
    northExitX: 110
  },
  starting_road: {
    name: 'Starting Road',
    size: { width: 45, height: 117 },
    southEntranceX: 22,
    northExitX: 22
  }
};

export const FIXED_TEMPLATE_ASSIGNMENTS = {
  1: 'branching_road',
  2: 'road',
  3: 'road',
  4: 'winding_road',
  5: 'mirrored_winding_road',
  6: 'split_road',
  10: 'lab'
};

/**
 * Determine template for a specific map number
 */
export function getTemplateForMapNumber(mapNumber, devForceLab = false) {
  if (devForceLab && mapNumber === 1) return 'lab';
  if (FIXED_TEMPLATE_ASSIGNMENTS[mapNumber]) {
    return FIXED_TEMPLATE_ASSIGNMENTS[mapNumber];
  }
  
  // Pseudo-random selection fallback for unspecified maps
  const seed = (mapNumber * 12345) % 100;
  if (seed < 25) return 'road';
  if (seed < 50) return 'winding_road';
  if (seed < 75) return 'mirrored_winding_road';
  return 'split_road';
}
