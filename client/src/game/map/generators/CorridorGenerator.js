import { BaseMapGenerator } from './BaseMapGenerator.js';

/**
 * CorridorGenerator - a long, narrow travel map: one straight road running the
 * full height of the map, sidewalks either side, fenced left and right edges,
 * grass everywhere else. No buildings, no zoning, no special lots.
 *
 * This is the "long haul between towns" template. The other road generators all
 * exist to produce *places* (lots, buildings, town squares); this one
 * deliberately produces nothing but distance, so the interesting pressure comes
 * from the journey (food, water, encounters) rather than from what is on the
 * map. That is why there is no passZoning/passSpecialization here — the empty
 * roadside is the point, not an omission.
 *
 * The fences on the left and right edges are load-bearing, not decoration: they
 * stop the player leaving the corridor sideways, so the only way forward is
 * north and the only way back is south.
 */
export class CorridorGenerator extends BaseMapGenerator {
  generate(config, builder) {
    const { width, height } = builder;
    const roadThickness = config.roadThickness || 5;
    const sidewalkThickness = config.sidewalkThickness ?? 1;

    // 1. Grass everywhere as the base layer.
    builder.fill('grass');

    // 2. Road + sidewalks straight down the middle, edge to edge.
    //
    // drawRoad centres a band of `roadThickness` on centerX (half = floor(t/2)
    // either side, so an odd thickness lands symmetrically) and lays the
    // sidewalk ring outside it. Running from y=0 to y=height-1 means the road
    // touches both the north and south edges, which is what lets
    // generateFromTemplate drop transition tiles onto road rather than grass.
    //
    // width 20 / thickness 5 / sidewalk 1 gives: fence 0 | grass 1-6 |
    // sidewalk 7 | road 8-12 | sidewalk 13 | grass 14-18 | fence 19.
    // The grass strips differ by one tile because 20 minus the 7-tile
    // road-and-sidewalk band leaves an odd remainder — unavoidable at even
    // widths, and not visible in play.
    const centerX = Math.floor(width / 2);
    builder.drawRoad(
      { x: centerX, y: 0 },
      { x: centerX, y: height - 1 },
      roadThickness,
      sidewalkThickness
    );

    // 3. Fence the left and right edges LAST so they always win. drawRoad only
    // promotes 'grass' to sidewalk, but its road pass overwrites unconditionally
    // — painting the fences afterwards keeps the corridor sealed even if someone
    // configures a road wide enough to reach the map edge.
    for (let y = 0; y < height; y++) {
      builder.setTerrain(0, y, 'fence');
      builder.setTerrain(width - 1, y, 'fence');
    }

    // 4. Publish the exits. generateFromTemplate reads metadata.exits as the
    // single source of truth for where to stamp the north/south transition
    // tiles and the arrival spawn points; without it the caller falls back to
    // the map centre, which happens to match here but would silently drift the
    // day the road stops being centred.
    builder.metadata.exits = {
      north: { x: centerX, y: 0 },
      south: { x: centerX, y: height - 1 }
    };
  }

  /**
   * Player enters from the south end, standing on the road one tile in from the
   * edge so they are not sitting on the transition tile itself.
   */
  getStartPosition(width, height) {
    return { x: Math.floor(width / 2), y: height - 2 };
  }
}
