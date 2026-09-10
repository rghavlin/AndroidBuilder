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
 *   blocksFlight  - does this terrain stop a flying device (recon drone)
 *                   passing over or hovering on it. Full-height obstacles
 *                   (walls, buildings, tree canopy) do; low ones a drone
 *                   clears — a fence, open water — do not. Every walkable
 *                   terrain is flyable by definition.
 *
 * Entity-level blocking (doors, windows, furniture, turrets) is NOT here —
 * those live on the entities and in LineOfSight/Pathfinding structure checks.
 * Unknown terrains fall back to DEFAULT_TERRAIN_PROPS (open ground).
 */
export const TERRAIN_PROPS = {
  // Open ground
  grass:       { walkable: true,  blocksSight: false, destructible: false, blocksFlight: false },
  road:        { walkable: true,  blocksSight: false, destructible: false, blocksFlight: false },
  sidewalk:    { walkable: true,  blocksSight: false, destructible: false, blocksFlight: false },
  transition:  { walkable: true,  blocksSight: false, destructible: false, blocksFlight: false },
  // Interior surfaces
  floor:       { walkable: true,  blocksSight: false, destructible: false, blocksFlight: false },
  garagefloor: { walkable: true,  blocksSight: false, destructible: false, blocksFlight: false },
  tent_floor:  { walkable: true,  blocksSight: false, destructible: false, blocksFlight: false },
  // Solid structures — full height, so they stop a drone as well as a walker
  wall:        { walkable: false, blocksSight: true,  destructible: true,  blocksFlight: true  },
  building:    { walkable: false, blocksSight: true,  destructible: true,  blocksFlight: true  },
  tree:        { walkable: false, blocksSight: true,  destructible: false, blocksFlight: true  },
  tent_wall:   { walkable: false, blocksSight: true,  destructible: false, blocksFlight: true  },
  brick:       { walkable: false, blocksSight: true,  destructible: false, blocksFlight: true  },
  metal_wall:  { walkable: false, blocksSight: true,  destructible: false, blocksFlight: true  },
  // Low obstacles — impassable on foot, but a drone flies straight over them
  fence:       { walkable: false, blocksSight: true,  destructible: false, blocksFlight: false },
  // Water blocks movement but not sight
  water:       { walkable: false, blocksSight: false, destructible: false, blocksFlight: false },
  deep_water:  { walkable: false, blocksSight: false, destructible: false, blocksFlight: false },
  // Legacy full-tile window terrain (see GameMap sheltered checks)
  window:      { walkable: false, blocksSight: false, destructible: false, blocksFlight: true  }
};

const DEFAULT_TERRAIN_PROPS = { walkable: true, blocksSight: false, destructible: false, blocksFlight: false };

/** Property lookup for any terrain string; unknown terrains are open ground. */
export const getTerrainProps = (terrain) => TERRAIN_PROPS[terrain] || DEFAULT_TERRAIN_PROPS;

/** Can an entity stand on / path through this terrain (before entity checks)? */
export const isTerrainWalkable = (terrain) => getTerrainProps(terrain).walkable;

/** Does this terrain block line of sight? */
export const terrainBlocksSight = (terrain) => getTerrainProps(terrain).blocksSight;

/** Can explosions breach this terrain? */
export const isTerrainDestructible = (terrain) => getTerrainProps(terrain).destructible;

/**
 * Can a flying device (recon drone) pass over / hover on this terrain? Every
 * walkable terrain is flyable; on top of those, the low obstacles a drone
 * clears — a fence, open water — are flyable while a walker is still stopped.
 */
export const isTerrainFlyable = (terrain) => !getTerrainProps(terrain).blocksFlight;

