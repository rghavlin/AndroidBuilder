import { gameRandom, makeSeededRandom } from '../utils/SeededRandom.js';

export const OUTDOOR_DECORATIONS = [
  'outdoordecor1',
  'outdoordecor2',
  'outdoordecor3',
  'outdoordecor4',
  'outdoordecor5',
];

/**
 * Indoor floor decorations (cracks, debris, broken furniture) were retired when
 * furniture outlines took over building interiors. Nothing places them any more;
 * the names survive only so legacy maps that still carry them can be recognised
 * and dropped on load/render instead of drawing a decoration under the furniture.
 */
export const RETIRED_INDOOR_DECORATIONS = [
  'brokenchair',
  'crack',
  'debris',
  'paper',
  'tabledebris',
];

export const ROAD_DECORATIONS = [
  'road1',
  'road2',
  'road3',
];

export const DECORATION_DENSITIES = {
  sparse: 0.02,
  normal: 0.05,
  dense: 0.10,
};

function isInsideCompound(compound, x, y) {
  if (!compound) return false;
  return (
    x >= compound.minX &&
    x <= compound.maxX &&
    y >= compound.minY &&
    y <= compound.maxY
  );
}

/**
 * True for decoration names that no longer exist in the game (retired indoor set).
 * Callers should treat the tile as having no decoration at all.
 * @param {string} decorName
 * @returns {boolean}
 */
export function isRetiredDecoration(decorName) {
  return RETIRED_INDOOR_DECORATIONS.includes(decorName);
}

/**
 * Returns the folder/type category for a given decoration name.
 * @param {string} decorName
 * @returns {'roadandsidewalk'|'outdoor'}
 */
export function getDecorationCategory(decorName) {
  if (ROAD_DECORATIONS.includes(decorName)) {
    return 'roadandsidewalk';
  }
  return 'outdoor';
}

/**
 * Procedurally places decorations on map tiles.
 * Works with a 2D array of tile objects (e.g. editor tiles or GameMap/Template tiles).
 *
 * Interiors are deliberately left alone — furniture outlines cover them.
 *
 * @param {Array<Array<any>>} tiles - 2D grid of tile objects
 * @param {Object} [options]
 * @param {boolean} [options.outdoor=true] - Place outdoor grass decorations
 * @param {boolean} [options.road=true] - Place road & sidewalk decorations
 * @param {'sparse'|'normal'|'dense'|number} [options.density='normal'] - Density level or raw probability
 * @param {boolean} [options.clearExisting=false] - Clear existing decorations first
 * @param {Object} [options.compound] - Optional compound bounding box to avoid
 * @param {number|Function} [options.seedOrRandom] - Seed number or PRNG random function
 * @returns {{ outdoor: number, road: number, total: number }}
 */
export function planDecorations(tiles, options = {}) {
  if (!tiles || !tiles.length || !tiles[0]) {
    return { outdoor: 0, road: 0, total: 0 };
  }

  const {
    outdoor = true,
    road = true,
    density = 'normal',
    clearExisting = false,
    compound = null,
    seedOrRandom,
  } = options;

  let randomFn;
  if (typeof seedOrRandom === 'function') {
    randomFn = seedOrRandom;
  } else if (typeof seedOrRandom === 'number') {
    randomFn = makeSeededRandom(seedOrRandom);
  } else {
    randomFn = () => gameRandom.next();
  }

  const baseProb = typeof density === 'number'
    ? density
    : (DECORATION_DENSITIES[density] ?? DECORATION_DENSITIES.normal);

  let outdoorCount = 0;
  let roadCount = 0;

  const height = tiles.length;
  const width = tiles[0].length;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tile = tiles[y]?.[x];
      if (!tile) continue;

      // Retired indoor decorations are dropped wherever we find them, compound
      // or not, so a generator pass also cleans up legacy maps.
      if (isRetiredDecoration(tile.decoration)) {
        delete tile.decoration;
      }

      if (compound && isInsideCompound(compound, x, y)) {
        continue;
      }

      if (clearExisting) {
        delete tile.decoration;
      }

      // Skip if tile already has a decoration
      if (tile.decoration) continue;

      // Skip tiles with existing inventory items
      const hasItems = (tile.items && tile.items.length > 0) || (tile.inventoryItems && tile.inventoryItems.length > 0);
      if (hasItems) continue;

      const terrain = tile.terrain;

      // Outdoor grass
      if (outdoor && terrain === 'grass') {
        if (randomFn() < baseProb) {
          const idx = Math.floor(randomFn() * OUTDOOR_DECORATIONS.length);
          tile.decoration = OUTDOOR_DECORATIONS[idx];
          outdoorCount++;
        }
      }
      // Road & sidewalk (placed at 50% base rate to keep roads clean)
      else if (road && (terrain === 'road' || terrain === 'sidewalk')) {
        if (randomFn() < baseProb * 0.5) {
          const idx = Math.floor(randomFn() * ROAD_DECORATIONS.length);
          tile.decoration = ROAD_DECORATIONS[idx];
          roadCount++;
        }
      }
    }
  }

  return {
    outdoor: outdoorCount,
    road: roadCount,
    total: outdoorCount + roadCount,
  };
}
