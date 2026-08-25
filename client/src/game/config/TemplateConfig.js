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
  },
  // Long-haul travel corridor: narrow, empty, and tall. The height is the
  // design knob — at ~15 tiles/turn and ~16 waking turns a day, 800 tiles is
  // roughly three days of travel, so chain a couple for a longer journey.
  //
  // 800 is deliberately under ~1000: Pathfinding.findPath caps a search at
  // maxDistance 1000 Manhattan, and an end-to-end path down a corridor costs
  // about `height`. Past that, long paths (notably NPC travel goals, which
  // target the map exit) silently return an empty path. Raising this materially
  // above 1000 means raising that cap too.
  corridor: {
    name: 'Corridor',
    size: { width: 20, height: 800 },
    southEntranceX: 10,
    northExitX: 10
  }
};

/**
 * Templates offered in the map editor's "Generate Map Template" picker, in the
 * order they are listed. Lives here rather than inline in editor.tsx so adding a
 * generator is a one-line change next to its metadata instead of an edit to the
 * god-object page component (AGENTS.md §6).
 *
 * The last three are the legacy fixed-layout templates, which have no generator
 * strategy and are stamped straight from their `layout` arrays.
 */
export const EDITOR_TEMPLATE_CHOICES = [
  { id: 'starting_road', name: 'Starting Road (Yard/House)' },
  { id: 'road', name: 'Straight Road' },
  { id: 'winding_road', name: 'Winding Road' },
  { id: 'mirrored_winding_road', name: 'Mirrored Winding Road' },
  { id: 'split_road', name: 'Split Road' },
  { id: 'branching_road', name: 'Branching Road' },
  { id: 'corridor', name: 'Corridor (20×500 travel road)' },
  { id: 'lab', name: 'Lab Complex' },
  { id: 'small_building', name: 'Small Building base' },
  { id: 'mall_section', name: 'Mall Section base' },
  { id: 'outdoor_area', name: 'Outdoor Area base' }
];

/**
 * Generator class names selectable as a transition target in the editor.
 * WorldManager.executeTransition maps these to template ids; ScenarioMapGenerator
 * has no template of its own and falls back to 'road' there.
 */
export const EDITOR_GENERATOR_CHOICES = [
  'BranchingRoadGenerator',
  'CorridorGenerator',
  'LabMapGenerator',
  'MirroredWindingRoadGenerator',
  'RoadGenerator',
  'ScenarioMapGenerator',
  'SplitRoadGenerator',
  'StartingRoadGenerator',
  'WindingRoadGenerator'
];

export const FIXED_TEMPLATE_ASSIGNMENTS = {
  1: 'branching_road',
  2: 'corridor',
  3: 'road',
  4: 'corridor',
  5: 'branching_road',
  6: 'corridor',
  7: 'lab'
};

export const POST_MAP_7_CYCLE = [
  'corridor',
  'road',
  'corridor',
  'branching_road'
];

/**
 * Determine template for a specific map number
 */
export function getTemplateForMapNumber(mapNumber, devForceLab = false) {
  if (devForceLab && mapNumber === 1) return 'lab';
  if (FIXED_TEMPLATE_ASSIGNMENTS[mapNumber]) {
    return FIXED_TEMPLATE_ASSIGNMENTS[mapNumber];
  }
  
  if (mapNumber > 7) {
    const cycleIndex = (mapNumber - 8) % POST_MAP_7_CYCLE.length;
    return POST_MAP_7_CYCLE[cycleIndex];
  }

  return 'road';
}
