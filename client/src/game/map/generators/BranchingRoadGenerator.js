import { BaseMapGenerator } from './BaseMapGenerator.js';
import { RoadNetwork, makeSeededRandom } from '../RoadNetwork.js';

/**
 * BranchingRoadGenerator - a wide central boulevard with an irregular street grid.
 *
 * Hierarchy (keeps the boulevard uncluttered and the blocks varied):
 *   - one wide vertical central spine (the boulevard), full height, carrying the
 *     north/south exits;
 *   - a FEW major horizontal cross-streets branching off the boulevard at jittered
 *     spacing (the only streets that touch the spine);
 *   - secondary vertical streets that branch off those cross-streets (not the
 *     boulevard), at varied positions/counts per band, breaking the bands into
 *     irregular blocks.
 *
 * The network stays connected by construction (secondaries reach their bounding
 * cross-streets, which cross the boulevard). Building rows are clamped to each
 * street's extent (zoneAlongSegments), so every building fronts a road.
 */

const SPINE_THICKNESS = 9;    // the wide central boulevard
const STREET_THICKNESS = 5;   // cross-streets and secondary streets
const SIDEWALK = 1;
const EDGE = 4;               // keep streets this far from the side fences
const SPINE_HALF = Math.floor(SPINE_THICKNESS / 2) + SIDEWALK;

export class BranchingRoadGenerator extends BaseMapGenerator {
  generate(config, builder) {
    const { width, height } = builder;
    const centerX = Math.floor(width / 2);
    const random = config.seed !== undefined ? makeSeededRandom(config.seed) : Math.random;
    const randInt = (lo, hi) => lo + Math.floor(random() * (hi - lo + 1));

    builder.fill('grass');
    for (let y = 0; y < height; y++) {
      builder.setTerrain(0, y, 'fence');
      builder.setTerrain(width - 1, y, 'fence');
    }

    const net = new RoadNetwork(width, height, {
      random,
      roadThickness: STREET_THICKNESS,
      sidewalkThickness: SIDEWALK
    });

    // Boulevard.
    net.addSegment({ x: centerX, y: 0 }, { x: centerX, y: height - 1 }, 'authored', 0, { thickness: SPINE_THICKNESS });

    // A few major cross-streets at jittered spacing (these touch the boulevard).
    const majorYs = [];
    let y = EDGE + randInt(26, 42);
    while (y <= height - 1 - EDGE - 22) {
      majorYs.push(y);
      y += randInt(50, 74); // wide spacing -> few cross-streets off the boulevard
    }
    for (const my of majorYs) {
      net.addSegment({ x: EDGE, y: my }, { x: width - 1 - EDGE, y: my }, 'authored', 0, { thickness: STREET_THICKNESS });
    }

    // Secondary vertical streets within each band, branching off the cross-streets.
    // Gaps are bounded (so no block is wider than ~2 building depths and therefore
    // never has an empty middle) but jittered (so blocks stay irregular).
    const bandBounds = [0, ...majorYs, height - 1];
    for (let i = 0; i < bandBounds.length - 1; i++) {
      const top = bandBounds[i];
      const bottom = bandBounds[i + 1];
      if (bottom - top < 28) continue; // thin bands fill from the cross-streets alone
      // Left of boulevard: boulevard is the right edge (a road), fence is the left.
      this._addSecondaries(net, randInt, top, bottom, EDGE + 2, centerX - SPINE_HALF - 4, 'right');
      // Right of boulevard: boulevard is the left edge, fence is the right.
      this._addSecondaries(net, randInt, top, bottom, centerX + SPINE_HALF + 4, width - 1 - EDGE - 2, 'left');
    }

    net.rasterize(builder);

    this.zoneAlongSegments(builder, net.segments);
    this.specializeBuildings(builder, 'branching_road', config.mapNumber || 1);

    // Top/bottom borders: fence the grass, leave the boulevard exits open.
    for (let x = 0; x < width; x++) {
      if (builder.getTerrain(x, 0) === 'grass') builder.setTerrain(x, 0, 'fence');
      if (builder.getTerrain(x, height - 1) === 'grass') builder.setTerrain(x, height - 1, 'fence');
    }

    builder.metadata.exits = {
      north: { x: centerX, y: 0 },
      south: { x: centerX, y: height - 1 }
    };
    builder.metadata.roadSegments = net.toMetadata();
  }

  /**
   * Fill [xLo, xHi] with vertical streets spanning [top, bottom] at jittered but
   * BOUNDED gaps, so every resulting column is narrow enough to fill completely
   * with buildings (no empty middle) while gap sizes still vary block to block.
   * Walks outward from the boulevard side so the boulevard-adjacent column is
   * always road-bounded on both edges.
   *
   * @param {'left'|'right'} boulevardSide which edge of [xLo,xHi] abuts the boulevard
   */
  _addSecondaries(net, randInt, top, bottom, xLo, xHi, boulevardSide, { minGap = 18, maxGap = 26 } = {}) {
    if (xHi - xLo < 16) return;

    const place = (x) => net.addSegment({ x, y: top }, { x, y: bottom }, 'authored', 0, { thickness: STREET_THICKNESS });

    if (boulevardSide === 'right') {
      // Boulevard at xHi; walk toward the fence at xLo, stopping ~one depth short.
      for (let x = xHi - randInt(minGap, maxGap); x > xLo + 12; x -= randInt(minGap, maxGap)) place(x);
    } else {
      // Boulevard at xLo; walk toward the fence at xHi.
      for (let x = xLo + randInt(minGap, maxGap); x < xHi - 12; x += randInt(minGap, maxGap)) place(x);
    }
  }

  getStartPosition(width, height) {
    return { x: Math.floor(width / 2), y: height - 2 };
  }
}
