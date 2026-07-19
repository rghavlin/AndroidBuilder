import { BaseMapGenerator } from './BaseMapGenerator.js';
import { RoadNetwork } from '../RoadNetwork.js';
import { makeSeededRandom } from '../../utils/SeededRandom.js';
import { createItemFromDef } from '../../inventory/ItemDefs.js';
import { computeTollGateLayout } from '../TollGate.js';

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
 *
 * At the center is a TOWN SQUARE: a grass plaza enclosed by a ring road. The
 * boulevard is interrupted there and meets the ring at top/bottom-center; the
 * ring's top and bottom are full-width cross-streets so the neighborhoods still
 * connect across. The plaza interior is kept clear of buildings (a future
 * building type goes there).
 */

const SPINE_THICKNESS = 9;    // the wide central boulevard
const STREET_THICKNESS = 5;   // cross-streets and secondary streets
const SIDEWALK = 1;
const EDGE = 4;               // keep streets this far from the side fences
const SPINE_HALF = Math.floor(SPINE_THICKNESS / 2) + SIDEWALK;
const STREET_HALF = Math.floor(STREET_THICKNESS / 2) + SIDEWALK;
const PLAZA_HALF = 24;        // half-size of the central town square (grass + ring)

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

    // Town square (centered): grass plaza enclosed by a ring road.
    const centerY = Math.floor(height / 2);
    const plaza = {
      top: centerY - PLAZA_HALF, bottom: centerY + PLAZA_HALF,
      left: centerX - PLAZA_HALF, right: centerX + PLAZA_HALF
    };

    // Boulevard, interrupted by the plaza: meets the ring at top/bottom-center.
    net.addSegment({ x: centerX, y: 0 }, { x: centerX, y: plaza.top }, 'authored', 0, { thickness: SPINE_THICKNESS });
    net.addSegment({ x: centerX, y: plaza.bottom }, { x: centerX, y: height - 1 }, 'authored', 0, { thickness: SPINE_THICKNESS });

    // Ring: top & bottom are full-width cross-streets; left & right close the loop.
    net.addSegment({ x: EDGE, y: plaza.top }, { x: width - 1 - EDGE, y: plaza.top }, 'authored', 0, { thickness: STREET_THICKNESS });
    net.addSegment({ x: EDGE, y: plaza.bottom }, { x: width - 1 - EDGE, y: plaza.bottom }, 'authored', 0, { thickness: STREET_THICKNESS });
    net.addSegment({ x: plaza.left, y: plaza.top }, { x: plaza.left, y: plaza.bottom }, 'authored', 0, { thickness: STREET_THICKNESS });
    net.addSegment({ x: plaza.right, y: plaza.top }, { x: plaza.right, y: plaza.bottom }, 'authored', 0, { thickness: STREET_THICKNESS });

    // Other major cross-streets at jittered spacing. Kept >= 30 tiles from the
    // plaza ring so the bands beside it are tall enough to seat buildings (a
    // cross-street landing just outside the ring would leave an empty thin band).
    const crossYs = [plaza.top, plaza.bottom];
    for (let y = EDGE + randInt(26, 42); y <= height - 1 - EDGE - 28; y += randInt(50, 74)) {
      if (y < plaza.top - 30 || y > plaza.bottom + 30) {
        crossYs.push(y);
        net.addSegment({ x: EDGE, y }, { x: width - 1 - EDGE, y }, 'authored', 0, { thickness: STREET_THICKNESS });
      }
    }
    crossYs.sort((a, b) => a - b);

    // Secondary vertical streets within each band (bounded jittered gaps -> no
    // empty middles, varied blocks). The plaza band skips the square itself.
    const topCapStreets = [];
    const bottomCapStreets = [];
    const bands = [];
    const bandBounds = [0, ...crossYs, height - 1];
    for (let i = 0; i < bandBounds.length - 1; i++) {
      const top = bandBounds[i];
      const bottom = bandBounds[i + 1];
      if (bottom - top < 28) continue; // thin bands fill from the cross-streets alone

      const isPlaza = (top === plaza.top && bottom === plaza.bottom);
      let secs;
      if (isPlaza) {
        // Plaza band: zone the strips beside the square; leave the square itself.
        secs = [
          ...this._addSecondaries(net, randInt, top, bottom, EDGE + 2, plaza.left - 4, 'right'),
          ...this._addSecondaries(net, randInt, top, bottom, plaza.right + 4, width - 1 - EDGE - 2, 'left')
        ];
      } else {
        secs = [
          ...this._addSecondaries(net, randInt, top, bottom, EDGE + 2, centerX - SPINE_HALF - 4, 'right'),
          ...this._addSecondaries(net, randInt, top, bottom, centerX + SPINE_HALF + 4, width - 1 - EDGE - 2, 'left')
        ];
      }

      // Vertical roads bounding this band's columns (for two-sided zoning).
      const verticals = secs.map(x => ({ x, hs: STREET_HALF }));
      if (isPlaza) {
        verticals.push({ x: plaza.left, hs: STREET_HALF }, { x: plaza.right, hs: STREET_HALF });
      } else {
        verticals.push({ x: centerX, hs: SPINE_HALF });
      }
      bands.push({ top, bottom, verticals, isPlaza });

      // Streets in the first/last band run to the map edge -> cap as cul-de-sacs.
      if (top === 0) topCapStreets.push(...secs);
      if (bottom === height - 1) bottomCapStreets.push(...secs);
    }

    net.rasterize(builder);

    // Add sidewalk tiles at the top and bottom of the town square to cross the boulevard
    for (let x = centerX - 5; x <= centerX + 5; x++) {
      builder.setTerrain(x, plaza.top + STREET_HALF, 'sidewalk');
      builder.setTerrain(x, plaza.bottom - STREET_HALF, 'sidewalk');
    }

    // Fill each band column with two rows of rowhouses (one facing each bounding
    // street), so every street develops on BOTH sides.
    this._zoneBandColumns(builder, bands, plaza, width);

    // Guarantee that at least one POI in the starting area (bottom-center corridor) is a grocer or gas station.
    const residential = builder.metadata.buildings.filter(b => b.type === 'residential');
    const candidates = residential.filter(b => this.hasRoadFrontage(builder, b, 6));
    const bottomCenterCandidates = candidates.filter(b => {
      const isBelowPlaza = b.y >= plaza.bottom;
      const isNearCenter = Math.abs((b.x + b.width / 2) - centerX) < 30;
      return isBelowPlaza && isNearCenter;
    });

    let forcedType = null;
    if (bottomCenterCandidates.length > 0) {
      forcedType = random() < 0.5 ? 'grocer' : 'gas_station';
      // Put the forced POI on the largest bottom-center lot so a grocer fits.
      const [pair] = this.sizeAwareSpecialPairs(bottomCenterCandidates, [forcedType]);
      const chosenBuilding = pair ? pair.lot : bottomCenterCandidates[0];
      builder.clearArea(chosenBuilding.x, chosenBuilding.y, chosenBuilding.width, chosenBuilding.height);
      builder.drawSpecialBuilding(chosenBuilding, forcedType);
    } else {
      console.warn('[BranchingRoadGenerator] No bottom-center POI candidates found!');
    }

    // Fixed POI mix for this map: 2 each except 1 hardware store, scattered evenly.
    const types = [
      'grocer', 'grocer',
      'firestation', 'firestation',
      'police', 'police',
      'gas_station', 'gas_station',
      'hardware_store'
    ];
    if (forcedType) {
      const typeIdx = types.indexOf(forcedType);
      if (typeIdx !== -1) {
        types.splice(typeIdx, 1);
      }
    }

    this.specializeBuildings(builder, 'branching_road', config.mapNumber || 1, {
      types: types,
      scatter: true
    });

    // Keep the plaza interior clear: remove any building that intrudes into it.
    this._clearPlazaInterior(builder, plaza);

    // Cap dead-end vertical streets that reach the top/bottom edge (cul-de-sacs):
    // fence at the edge, a sidewalk strip just inside. The boulevard is excluded
    // (its ends are the map exits).
    for (const x of topCapStreets) this._capStreet(builder, x, 0, 1);
    for (const x of bottomCapStreets) this._capStreet(builder, x, height - 1, -1);

    // Top/bottom borders: fence the remaining grass, leave the boulevard exits open.
    for (let x = 0; x < width; x++) {
      if (builder.getTerrain(x, 0) === 'grass') builder.setTerrain(x, 0, 'fence');
      if (builder.getTerrain(x, height - 1) === 'grass') builder.setTerrain(x, height - 1, 'fence');
    }

    builder.metadata.exits = {
      north: { x: centerX, y: 0 },
      south: { x: centerX, y: height - 1 }
    };

    // Record the tollgate exclusion footprint now (before loot/zombie population)
    // so spawners keep that area clear. The gate entities themselves are placed
    // post-generation by NPCSpawner.spawnTollGate using the same calculation.
    builder.metadata.tollGate = computeTollGateLayout(
      builder.metadata.exits.north,
      { edge: 'north' }
    ).area;

    builder.metadata.roadSegments = net.toMetadata();

    // Record the grass plaza interior (inside the ring road) for later use.
    builder.metadata.townSquare = {
      x: plaza.left + STREET_HALF + 1,
      y: plaza.top + STREET_HALF + 1,
      width: (plaza.right - plaza.left) - 2 * (STREET_HALF + 1),
      height: (plaza.bottom - plaza.top) - 2 * (STREET_HALF + 1)
    };

    // Build the fenced compound inside the town square
    this._buildTownSquareCompound(builder, plaza);

    // Upgraded branching road for maps beyond map 1: spawn 4-6 army tents
    if ((config.mapNumber || 1) > 1) {
      const count = randInt(4, 6);
      this._spawnArmyTents(builder, random, count);
    }
  }

  /**
   * Fill every band's columns with two-sided rowhouse rows. Each column (the grass
   * between two consecutive vertical roads, or a road and the side fence) gets a
   * row of buildings facing each bounding road. Depth is adapted to the column's
   * width so the two rows fill it back-to-back -> every street develops on BOTH
   * sides with at most a small backyard.
   */
  _zoneBandColumns(builder, bands, plaza, width) {
    for (const band of bands) {
      const edges = [
        { x: 1, hs: 0, road: false },                       // left fence boundary
        ...band.verticals.map(v => ({ ...v, road: true })),
        { x: width - 2, hs: 0, road: false }                // right fence boundary
      ].sort((a, b) => a.x - b.x);

      for (let i = 0; i < edges.length - 1; i++) {
        const a = edges[i];
        const b = edges[i + 1];
        // Leave the town square itself empty.
        if (band.isPlaza && a.x === plaza.left && b.x === plaza.right) continue;
        this._fillColumn(builder, a, b, band.top, band.bottom);
      }
    }
  }

  /** Place the row(s) of buildings in one column between edges a (left) and b (right). */
  _fillColumn(builder, a, b, top, bottom) {
    // Floor of 10 so every house is at least 10 deep — the smallest authored
    // floorplan is 10x10, so narrower lots (which would fall back to procedural,
    // bathroom-less houses) are skipped instead.
    const DEPTH_MIN = 10, DEPTH_MAX = 18;
    const gx0 = a.road ? a.x + a.hs + 1 : a.x;  // first grass column
    const gx1 = b.road ? b.x - b.hs - 1 : b.x;  // last grass column
    const grassW = gx1 - gx0 + 1;
    if (grassW < DEPTH_MIN + 1) return;

    const maxB = Math.max(2, Math.ceil((bottom - top) / 12));
    const cap = (d) => Math.max(DEPTH_MIN, Math.min(DEPTH_MAX, d));
    // GAP between neighbouring houses along the street (>= 3, ideally 4); the
    // collision buffer is floor(gap/2) so this also keeps a real grass margin.
    const HOUSE_GAP = 4;
    const BACKYARD = 4; // grass seam reserved between the two back-to-back rows
    const row = (frontage, anchorX, depth) => builder.placeBuildingsFromAnchor(
      anchorX, top, 'south', frontage,
      { setback: 2, gap: HOUSE_GAP, maxBuildings: maxB, runStart: top, runEnd: bottom,
        minW: depth, maxW: depth, minH: 10, maxH: 18 }
    );

    // Two back-to-back rows: each is (grassW - 2*setback - BACKYARD)/2 deep so a
    // ~BACKYARD-tile grass seam stays between their backs.
    const twoDepth = Math.floor((grassW - 4 - BACKYARD) / 2);
    if (a.road && b.road && twoDepth >= DEPTH_MIN) {
      const depth = Math.min(DEPTH_MAX, twoDepth);
      row('west', a.x + a.hs, depth);  // east side of a (faces the left road)
      row('east', b.x - b.hs, depth);  // west side of b (faces the right road)
    } else if (a.road) {
      row('west', a.x + a.hs, cap(grassW - 5));  // one row facing the left road
    } else if (b.road) {
      row('east', b.x - b.hs, cap(grassW - 5));  // one row facing the right road
    }
  }

  /**
   * Remove any building whose footprint pokes into the plaza interior (the grass
   * inside the ring road), so the town square stays open.
   */
  _clearPlazaInterior(builder, plaza) {
    // Interior = the grass strictly inside the ring road.
    const ix0 = plaza.left + STREET_HALF + 1;
    const ix1 = plaza.right - STREET_HALF - 1;
    const iy0 = plaza.top + STREET_HALF + 1;
    const iy1 = plaza.bottom - STREET_HALF - 1;

    // Iterate a copy: clearArea() mutates metadata.buildings as it filters.
    for (const b of [...builder.metadata.buildings]) {
      const intrudes = b.x <= ix1 && b.x + b.width - 1 >= ix0 && b.y <= iy1 && b.y + b.height - 1 >= iy0;
      if (intrudes) builder.clearArea(b.x, b.y, b.width, b.height);
    }

    // Wipe any road/sidewalk that bled in from the boulevard/ring endpoints so the
    // square is pure grass (the box is inside the ring, so the ring road is safe).
    builder.fill('grass', ix0, iy0, ix1, iy1);
  }

  /**
   * Place vertical streets dividing [xLo, xHi] (spanning [top, bottom]) into
   * fillable columns. Interior gaps are sized for TWO back-to-back building rows
   * (so the column fills from both bounding streets, no empty middle), jittered so
   * blocks still vary. The fence-side leftover column is bounded to ~one building
   * depth so its single row (the fence has no buildings) fills it instead of
   * leaving a wasted strip. Walks outward from the boulevard side.
   *
   * @param {'left'|'right'} boulevardSide which edge of [xLo,xHi] abuts the boulevard
   */
  _addSecondaries(net, randInt, top, bottom, xLo, xHi, boulevardSide, { target = 44, fenceCol = 20 } = {}) {
    const place = (x) => net.addSegment({ x, y: top }, { x, y: bottom }, 'authored', 0, { thickness: STREET_THICKNESS });
    if (xHi - xLo < 16) return;

    // Reserve a narrow one-row column against the fence (which has no buildings on
    // its far side); split the rest (road on both ends) into ~target-wide columns
    // that fill from both sides with a small backyard gap.
    let splitLo, splitHi, fenceDivider;
    if (boulevardSide === 'left') {      // boulevard at xLo, fence at xHi
      fenceDivider = xHi - fenceCol;
      splitLo = xLo; splitHi = fenceDivider;
    } else {                             // boulevard at xHi, fence at xLo
      fenceDivider = xLo + fenceCol;
      splitLo = fenceDivider; splitHi = xHi;
    }

    const dividers = [];
    const splitW = splitHi - splitLo;
    if (splitW >= 18) {
      let n = Math.max(1, Math.round(splitW / target));
      while (splitW / n > 46) n++;        // keep columns from getting too wide (big backyards)
      const base = splitW / n;
      for (let k = 1; k < n; k++) dividers.push(Math.round(splitLo + k * base + randInt(-3, 3)));
    }
    if (fenceDivider > xLo + 12 && fenceDivider < xHi - 12) dividers.push(fenceDivider);

    for (const x of dividers) place(x);
    return dividers;
  }

  /**
   * Cap a vertical street that dead-ends at a map edge as a cul-de-sac: fence
   * across the street width at the very edge, then a sidewalk strip just inside.
   *
   * @param {number} cx     street centerline x
   * @param {number} edgeY  the edge row (0 or height-1)
   * @param {number} dir    +1 for the top edge, -1 for the bottom edge
   */
  _capStreet(builder, cx, edgeY, dir) {
    for (let x = cx - STREET_HALF; x <= cx + STREET_HALF; x++) {
      if (x <= 0 || x >= builder.width - 1) continue; // leave the side fences
      builder.setTerrain(x, edgeY, 'fence');            // terminate at the edge
      builder.setTerrain(x, edgeY + dir, 'sidewalk');   // strip just inside the fence
    }
  }

  /**
   * Build a fenced compound with a central building in the town square.
   * Leaves 6 grass tiles between the building and the fence.
   */
  _buildTownSquareCompound(builder, plaza) {
    const ts = builder.metadata.townSquare;
    if (!ts) return;

    const x1 = ts.x;
    const y1 = ts.y;
    const x2 = ts.x + ts.width - 1;
    const y2 = ts.y + ts.height - 1;

    // Draw the fence perimeter
    for (let x = x1; x <= x2; x++) {
      builder.setTerrain(x, y1, 'fence');
      builder.setTerrain(x, y2, 'fence');
    }
    for (let y = y1; y <= y2; y++) {
      builder.setTerrain(x1, y, 'fence');
      builder.setTerrain(x2, y, 'fence');
    }

    // Cut a gate on the south side at horizontal center (3-tile wide gap)
    const centerX = Math.floor(builder.width / 2);
    // Remove fence and place sidewalk for the gate entrance
    for (let gx = centerX - 1; gx <= centerX + 1; gx++) {
      builder.setTerrain(gx, y2, 'sidewalk');
    }

    // 6-tile grass gap. Building boundaries:
    const GRASS_GAP = 6;
    const FENCE_WIDTH = 1;
    const offset = FENCE_WIDTH + GRASS_GAP;

    const bx = x1 + offset;
    const by = y1 + offset;
    const bw = ts.width - 2 * offset;
    const bh = ts.height - 2 * offset;

    if (bw > 0 && bh > 0) {
      // 1. Draw floor terrain
      for (let y = by; y < by + bh; y++) {
        for (let x = bx; x < bx + bw; x++) {
          builder.setTerrain(x, y, 'floor');
        }
      }

      // 2. Draw outer walls (edge walls)
      // Top wall (north edge)
      for (let x = bx; x < bx + bw; x++) {
        builder.setEdgeWall(x, by, 'n', true);
      }
      // Bottom wall (south edge)
      for (let x = bx; x < bx + bw; x++) {
        builder.setEdgeWall(x, by + bh - 1, 's', true);
      }
      // Left wall (west edge)
      for (let y = by; y < by + bh; y++) {
        builder.setEdgeWall(bx, y, 'w', true);
      }
      // Right wall (east edge)
      for (let y = by; y < by + bh; y++) {
        builder.setEdgeWall(bx + bw - 1, y, 'e', true);
      }

      // 3. Place double doors in the center of the south wall
      const southY = by + bh - 1;
      const doorX1 = centerX - 1;
      const doorX2 = centerX;

      // Doors are walkable (terrain = floor)
      builder.setTerrain(doorX1, southY, 'floor');
      builder.setTerrain(doorX2, southY, 'floor');

      // Register the doors in metadata
      builder.metadata.doors.push({
        x: doorX1,
        y: southY,
        isLocked: false,
        isOpen: false,
        edge: 's'
      });
      builder.metadata.doors.push({
        x: doorX2,
        y: southY,
        isLocked: false,
        isOpen: false,
        edge: 's'
      });

      // Register building of type 'compound'
      builder.registerBuilding('compound', bx, by, bw, bh, {
        frontage: 'south',
        entranceX: doorX1,
        entranceY: southY
      });
      
      builder.metadata.townSquareCompound = {
        x: bx,
        y: by,
        width: bw,
        height: bh,
        fenceBounds: {
          x1: x1,
          y1: y1,
          x2: x2,
          y2: y2
        }
      };

      // Place barriers on both sides of the fence opening (unwalkable, full-tile images)
      // leaving only a 1-tile space (centerX) to enter the compound.
      const barrierLeftX = centerX - 1;
      const barrierRightX = centerX + 1;

      builder.metadata.placeIcons.push({ subtype: 'barrier', x: barrierLeftX, y: y2 });
      builder.metadata.placeIcons.push({ subtype: 'barrier', x: barrierRightX, y: y2 });

      // Outside the building, left side of the entrance pathway:
      // 3 columns of harvestable crops (Tomato, Carrot, Corn), 4 in each column
      const cropDefs = [
        { x: centerX - 7, defId: 'provision.harvestable_tomato', subtype: 'harvestable_tomato' },
        { x: centerX - 5, defId: 'provision.harvestable_carrot', subtype: 'harvestable_carrot' },
        { x: centerX - 3, defId: 'provision.harvestable_corn', subtype: 'harvestable_corn' }
      ];

      cropDefs.forEach(col => {
        for (let cy = y2 - 5; cy <= y2 - 2; cy++) {
          const cropItem = createItemFromDef(col.defId, {
            subtype: col.subtype,
            x: col.x,
            y: cy,
            isWild: false,
            isHarvestable: true
          });
          if (cropItem) {
            const cell = builder.layout[cy][col.x];
            if (!cell.inventoryItems) cell.inventoryItems = [];
            cell.inventoryItems.push(cropItem);
          }
        }
      });

      // Outside the building, right side of the entrance pathway:
      // 6 rain catchers (2x3 grid)
      const rainCatcherCols = [centerX + 3, centerX + 5];
      const rainCatcherRows = [y2 - 5, y2 - 3, y2 - 1];

      rainCatcherCols.forEach(cx => {
        rainCatcherRows.forEach(cy => {
          const rcItem = createItemFromDef('provision.rain_collector', {
            x: cx,
            y: cy
          });
          if (rcItem) {
            const cell = builder.layout[cy][cx];
            if (!cell.inventoryItems) cell.inventoryItems = [];
            cell.inventoryItems.push(rcItem);
          }
        });
      });

    }
  }

  _canPlaceTent(builder, tx, ty, tw, th) {
    if (tx < 2 || tx + tw >= builder.width - 2) return false;
    if (ty < 2 || ty + th >= builder.height - 2) return false;

    const ts = builder.metadata.townSquare;
    if (ts) {
      const tsX1 = ts.x - 10;
      const tsY1 = ts.y - 10;
      const tsX2 = ts.x + ts.width + 10;
      const tsY2 = ts.y + ts.height + 10;
      if (!(tx + tw < tsX1 || tx > tsX2 || ty + th < tsY1 || ty > tsY2)) {
        return false;
      }
    }

    const tg = builder.metadata.tollGate;
    if (tg) {
      if (!(tx + tw < tg.x1 || tx > tg.x2 || ty + th < tg.y1 || ty > tg.y2)) {
        return false;
      }
    }

    for (let y = ty - 1; y <= ty + th; y++) {
      for (let x = tx - 1; x <= tx + tw; x++) {
        if (x < 0 || x >= builder.width || y < 0 || y >= builder.height) return false;
        const cell = builder.layout[y][x];
        if (cell.terrain !== 'grass') return false;
        if (cell.edgeWalls && (cell.edgeWalls.n || cell.edgeWalls.s || cell.edgeWalls.e || cell.edgeWalls.w)) return false;
        if (cell.inventoryItems && cell.inventoryItems.length > 0) return false;
      }
    }

    for (const b of builder.metadata.buildings) {
      const bX1 = b.x - 1;
      const bY1 = b.y - 1;
      const bX2 = b.x + b.width;
      const bY2 = b.y + b.height;
      if (!(tx + tw < bX1 || tx > bX2 || ty + th < bY1 || ty > bY2)) {
        return false;
      }
    }

    return true;
  }

  _spawnArmyTents(builder, random, count) {
    const tentW = 12;
    const tentH = 8;
    const candidates = [];

    for (let y = 10; y < builder.height - 15; y += 4) {
      for (let x = 4; x < builder.width - 15; x += 4) {
        if (this._canPlaceTent(builder, x, y, tentW, tentH)) {
          candidates.push({ x, y });
        }
      }
    }

    if (candidates.length === 0) {
      console.warn('[BranchingRoadGenerator] No suitable locations found for army tents!');
      return;
    }

    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      const temp = candidates[i];
      candidates[i] = candidates[j];
      candidates[j] = temp;
    }

    const placed = [];
    for (const c of candidates) {
      if (placed.length >= count) break;

      let overlap = false;
      for (const p of placed) {
        if (Math.abs(c.x - p.x) < 15 && Math.abs(c.y - p.y) < 11) {
          overlap = true;
          break;
        }
      }

      if (!overlap) {
        placed.push(c);
        const isFacingEast = c.x < builder.width / 2;
        builder.drawArmyTent(c.x, c.y, isFacingEast);
        console.log(`[BranchingRoadGenerator] Placed army tent at (${c.x + 1}, ${c.y + 1})`);
      }
    }
  }

  getStartPosition(width, height) {
    return { x: Math.floor(width / 2), y: height - 2 };
  }
}
