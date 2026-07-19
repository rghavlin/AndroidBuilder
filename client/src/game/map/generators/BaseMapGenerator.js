import { gameRandom } from '../../utils/SeededRandom.js';
import { SPECIAL_BUILDING_SPECS } from '../BuildingTypes.js';
/**
 * BaseMapGenerator - Strategy interface for map generation
 */
export class BaseMapGenerator {
  /**
   * Pair special-building types to lots so the LARGEST types land on the LARGEST
   * lots — this guarantees each type's standardized footprint fits the lot it is
   * drawn on. Returns [{ lot, type }] (index-zipped after sorting both by size).
   * Types beyond the available lots (or vice versa) are dropped.
   */
  sizeAwareSpecialPairs(lots, types) {
    const area = (t) => { const s = SPECIAL_BUILDING_SPECS[t]; return s ? s.width * s.height : 0; };
    const lotsSorted = [...lots].sort((a, b) => (b.width * b.height) - (a.width * a.height));
    const typesSorted = [...types].filter(Boolean).sort((a, b) => area(b) - area(a));
    const pairs = [];
    for (let i = 0; i < typesSorted.length && i < lotsSorted.length; i++) {
      pairs.push({ lot: lotsSorted[i], type: typesSorted[i] });
    }
    return pairs;
  }

  /**
   * Choose which lots host which special-building types, drawing from the FULL
   * candidate pool so a large type (grocer) can find a lot big enough for its
   * standardized footprint. Assigns the largest types first, each to a random
   * lot that FITS its spec (keeps placement varied), falling back to the largest
   * remaining lot only when nothing fits. Returns [{ lot, type }]; consumed lots
   * are not reused. Prefer this over pre-selecting a random subset then pairing.
   */
  selectSpecialLots(candidates, types) {
    const specOf = (t) => SPECIAL_BUILDING_SPECS[t];
    const fits = (lot, t) => { const s = specOf(t); return !s || (lot.width >= s.width && lot.height >= s.height); };
    const area = (t) => { const s = specOf(t); return s ? s.width * s.height : 0; };
    const typesSorted = [...types].filter(Boolean).sort((a, b) => area(b) - area(a));
    const pool = [...candidates];
    const pairs = [];
    for (const type of typesSorted) {
      if (pool.length === 0) break;
      const fitting = pool.filter((l) => fits(l, type));
      const lot = fitting.length > 0
        ? fitting[gameRandom.nextInt(0, fitting.length - 1)]
        : pool.reduce((a, b) => ((b.width * b.height) > (a.width * a.height) ? b : a));
      pairs.push({ lot, type });
      pool.splice(pool.indexOf(lot), 1);
    }
    return pairs;
  }

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
      const x = Math.floor(gameRandom.next() * len);
      result[n] = arr[x in taken ? taken[x] : x];
      taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
  }

  /**
   * Centralized special building type selection logic
   * @param {number} mapNumber - Current map number
   * @param {string} templateName - Current template name
   * @param {number} count - Number of buildings to select
   * @returns {string[]} - Array of building types
   */
  getSpecialBuildingTypes(mapNumber, templateName, count) {
    const basePool = ['grocer', 'firestation', 'police', 'gas_station', 'hardware_store'];
    let result = [];

    // Rule: Map 1 always includes grocer
    if (mapNumber === 1 && count > 0) {
      result.push('grocer');
    }

    // Rule: Mirrored Winding Road always includes at least one hardware_store
    if (templateName === 'mirrored_winding_road' && count > 0 && !result.includes('hardware_store')) {
      result.push('hardware_store');
    }

    // Fill remaining slots from the random pool
    while (result.length < count) {
      const remainingPool = basePool.filter(type => !result.includes(type));
      if (remainingPool.length === 0) break;
      const randomType = remainingPool[gameRandom.nextInt(0, remainingPool.length - 1)];
      result.push(randomType);
    }

    return result;
  }

  /**
   * Helper to check if a building has clear road frontage across its entire frontage wall
   * @param {MapBuilder} builder - MapBuilder instance
   * @param {Object} b - Building metadata object
   * @param {number} maxDist - Maximum distance to search for road/sidewalk
   * @returns {boolean} - True if the building faces a road/sidewalk within maxDist tiles without blockage
   */
  hasRoadFrontage(builder, b, maxDist = 6) {
    const { frontage, x, y, width, height } = b;
    let hasRoadTile = false;

    if (frontage === 'north' || frontage === 'south') {
      const startY = (frontage === 'north') ? y - 1 : y + height;
      const dy = (frontage === 'north') ? -1 : 1;

      for (let tx = x; tx < x + width; tx++) {
        for (let step = 0; step < maxDist; step++) {
          const curY = startY + dy * step;
          if (curY < 0 || curY >= builder.height) break;

          const terrain = builder.getTerrain(tx, curY);
          if (terrain === 'wall' || terrain === 'floor' || terrain === 'fence') {
            return false; // Blocked!
          }
          if (terrain === 'sidewalk' || terrain === 'road') {
            hasRoadTile = true;
          }
        }
      }
    } else { // east or west
      const startX = (frontage === 'east') ? x + width : x - 1;
      const dx = (frontage === 'east') ? 1 : -1;

      for (let ty = y; ty < y + height; ty++) {
        for (let step = 0; step < maxDist; step++) {
          const curX = startX + dx * step;
          if (curX < 0 || curX >= builder.width) break;

          const terrain = builder.getTerrain(curX, ty);
          if (terrain === 'wall' || terrain === 'floor' || terrain === 'fence') {
            return false; // Blocked!
          }
          if (terrain === 'sidewalk' || terrain === 'road') {
            hasRoadTile = true;
          }
        }
      }
    }

    return hasRoadTile;
  }

  /**
   * Generic road-driven zoning: place rows of buildings down both sides of every
   * road segment, facing the road. Works for any axis-aligned road network (the
   * authored spine + procedural branches from RoadNetwork), replacing the
   * per-template hardcoded passZoning enumerations.
   *
   * Relies on placeBuildingsFromAnchor's grass+buffer collision check, so rows
   * from neighbouring segments simply don't overlap each other or the roads —
   * gaps open naturally where a branch crosses. Run AFTER all roads are
   * rasterized so every road reads as non-grass.
   *
   * @param {MapBuilder} builder
   * @param {Array<{x1,y1,x2,y2,orientation,thickness,sidewalkThickness}>} segments
   * @param {Object} [options] overrides for placeBuildingsFromAnchor sizing
   */
  zoneAlongSegments(builder, segments, options = {}) {
    // Rowhouse-shaped lots: SHALLOW perpendicular to the street (depth) but
    // variable ALONG it (frontage). Keeping depth small lets two rows sit
    // back-to-back in a block, so streets develop on BOTH sides instead of one
    // deep row leaving a backyard. Tight gap packs the frontage.
    const {
      depthMin = 10, depthMax = 13,   // perpendicular to the street
      frontMin = 10, frontMax = 18,   // along the street
      setback = 2, gap = 2
    } = options;

    for (const seg of segments) {
      const thickness = seg.thickness ?? 5;
      const sidewalk = seg.sidewalkThickness ?? 1;
      const hs = Math.floor(thickness / 2) + sidewalk; // road+sidewalk half-width

      // Scale building count to the segment's length so long streets fill end to end.
      const segLen = seg.orientation === 'horizontal' ? (seg.x2 - seg.x1) : (seg.y2 - seg.y1);
      const maxBuildings = options.maxBuildings ?? Math.max(2, Math.ceil(segLen / 12));

      if (seg.orientation === 'horizontal') {
        const cy = seg.y1;
        // Depth is the Y dimension here; frontage is the X dimension.
        const run = {
          setback, gap, maxBuildings, runStart: seg.x1, runEnd: seg.x2,
          minW: frontMin, maxW: frontMax, minH: depthMin, maxH: depthMax
        };
        builder.placeBuildingsFromAnchor(seg.x1, cy - hs, 'east', 'south', run);
        builder.placeBuildingsFromAnchor(seg.x1, cy + hs, 'east', 'north', run);
      } else {
        const cx = seg.x1;
        // Depth is the X dimension here; frontage is the Y dimension.
        const run = {
          setback, gap, maxBuildings, runStart: seg.y1, runEnd: seg.y2,
          minW: depthMin, maxW: depthMax, minH: frontMin, maxH: frontMax
        };
        builder.placeBuildingsFromAnchor(cx - hs, seg.y1, 'south', 'east', run);
        builder.placeBuildingsFromAnchor(cx + hs, seg.y1, 'south', 'west', run);
      }
    }
  }

  /**
   * Generic specialization: convert a few road-fronting residential buildings into
   * POIs (grocer, firestation, ...). Mirrors the existing per-template passes but
   * works off whatever buildings zoneAlongSegments produced.
   *
   * @param {MapBuilder} builder
   * @param {string} templateName
   * @param {number} mapNumber
   * @param {Object} [options]
   * @param {string[]} [options.types]  exact list of POI types to place (overrides the
   *                                    area-based count + getSpecialBuildingTypes)
   * @param {boolean} [options.scatter] spread the chosen buildings evenly across the map
   */
  specializeBuildings(builder, templateName, mapNumber, options = {}) {
    const residential = builder.metadata.buildings.filter(b => b.type === 'residential');
    const candidates = residential.filter(b => this.hasRoadFrontage(builder, b, 6));
    if (candidates.length === 0) return;

    let types;
    if (options.types) {
      // Shuffle so a given type isn't always assigned to the same scattered slot.
      // (getRandomSubarray(arr, arr.length) returns the array unshuffled — it only
      // samples when n < length — so use an explicit shuffle here.)
      types = gameRandom.shuffle([...options.types]);
    } else {
      const area = builder.width * builder.height;
      const count = Math.max(1, Math.floor(area / 5000));
      types = this.getSpecialBuildingTypes(mapNumber, templateName, count);
    }

    const selected = options.scatter
      ? this._selectScattered(candidates, types.length)
      : this.getRandomSubarray(candidates, types.length);

    for (const { lot: b, type } of this.sizeAwareSpecialPairs(selected, types)) {
      builder.clearArea(b.x, b.y, b.width, b.height);
      builder.drawSpecialBuilding(b, type);
    }
  }

  /**
   * Pick `n` buildings spread as evenly as possible across the map via
   * farthest-point sampling (each pick maximizes its minimum distance to the
   * already-picked set).
   */
  _selectScattered(candidates, n) {
    if (candidates.length <= n) return [...candidates];
    const cx = (b) => b.x + b.width / 2;
    const cy = (b) => b.y + b.height / 2;

    const picked = [candidates[gameRandom.nextInt(0, candidates.length - 1)]];
    const inPicked = new Set(picked);
    while (picked.length < n) {
      let best = null, bestDist = -1;
      for (const c of candidates) {
        if (inPicked.has(c)) continue;
        let minD = Infinity;
        for (const p of picked) {
          const dx = cx(c) - cx(p), dy = cy(c) - cy(p);
          const d = dx * dx + dy * dy;
          if (d < minD) minD = d;
        }
        if (minD > bestDist) { bestDist = minD; best = c; }
      }
      if (!best) break;
      picked.push(best);
      inPicked.add(best);
    }
    return picked;
  }
}

