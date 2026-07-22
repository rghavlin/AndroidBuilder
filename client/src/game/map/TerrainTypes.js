/**
 * Terrain-type helpers.
 *
 * 'garagefloor' behaves identically to 'floor' in every system EXCEPT
 * golf-cart movement: a golf cart may drive onto 'garagefloor' but is blocked
 * from ordinary 'floor'. Route every floor-parity check through these helpers so
 * a future floor-like terrain only has to be added here, in one place.
 */

// Interior "floor" surfaces the player walks on. Both count as a proper floor
// for spawning, loot, room-shell and rendering purposes.
export const isFloor = (terrain) => terrain === 'floor' || terrain === 'garagefloor';

// "Indoor" = a sheltered interior surface. Drives weather exposure, ambient
// darkness reduction and footstep audio ("inside") checks. tent_floor is
// sheltered too, but is not a hard-surface floor for spawn/loot logic.
export const isIndoorFloor = (terrain) =>
  terrain === 'floor' || terrain === 'garagefloor' || terrain === 'tent_floor';

/**
 * TERRAIN_PROPS — the single source of truth for what a terrain does
 * (T2: replaces the 5-6 copy-pasted blocking lists that had already drifted).
 *
 *   walkable      - can an entity stand on / path through this terrain
 *                   (drives Tile.isWalkable and the UI click/hover filters)
 *   blocksSight   - does this terrain block line of sight
 *                   (drives LineOfSight / VisionSystem)
 *   destructible  - can explosions breach this terrain
 *                   (drives ExplosionSystem wall breaching)
 *
 * Entity-level blocking (doors, windows, furniture, turrets) is NOT here —
 * those live on the entities and in LineOfSight/Pathfinding structure checks.
 * Unknown terrains fall back to DEFAULT_TERRAIN_PROPS (open ground).
 */
export const TERRAIN_PROPS = {
  // Open ground
  grass:       { walkable: true,  blocksSight: false, destructible: false },
  road:        { walkable: true,  blocksSight: false, destructible: false },
  sidewalk:    { walkable: true,  blocksSight: false, destructible: false },
  transition:  { walkable: true,  blocksSight: false, destructible: false },
  // Interior surfaces
  floor:       { walkable: true,  blocksSight: false, destructible: false },
  garagefloor: { walkable: true,  blocksSight: false, destructible: false },
  tent_floor:  { walkable: true,  blocksSight: false, destructible: false },
  // Solid structures
  wall:        { walkable: false, blocksSight: true,  destructible: true  },
  building:    { walkable: false, blocksSight: true,  destructible: true  },
  fence:       { walkable: false, blocksSight: true,  destructible: false },
  tree:        { walkable: false, blocksSight: true,  destructible: false },
  tent_wall:   { walkable: false, blocksSight: true,  destructible: false },
  brick:       { walkable: false, blocksSight: true,  destructible: false },
  metal_wall:  { walkable: false, blocksSight: true,  destructible: false },
  // Water blocks movement but not sight
  water:       { walkable: false, blocksSight: false, destructible: false },
  deep_water:  { walkable: false, blocksSight: false, destructible: false },
  // Legacy full-tile window terrain (see GameMap sheltered checks)
  window:      { walkable: false, blocksSight: false, destructible: false }
};

const DEFAULT_TERRAIN_PROPS = { walkable: true, blocksSight: false, destructible: false };

/** Property lookup for any terrain string; unknown terrains are open ground. */
export const getTerrainProps = (terrain) => TERRAIN_PROPS[terrain] || DEFAULT_TERRAIN_PROPS;

/** Can an entity stand on / path through this terrain (before entity checks)? */
export const isTerrainWalkable = (terrain) => getTerrainProps(terrain).walkable;

/** Does this terrain block line of sight? */
export const terrainBlocksSight = (terrain) => getTerrainProps(terrain).blocksSight;

/** Can explosions breach this terrain? */
export const isTerrainDestructible = (terrain) => getTerrainProps(terrain).destructible;

