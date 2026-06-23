import { BaseMapGenerator } from './BaseMapGenerator.js';

import { gameRandom } from '../../utils/SeededRandom.js';
/**
 * Horizontal inset (in tiles) of the vertical road runs from each map edge.
 * Single source of truth shared with getStartPosition() and the exit metadata.
 */
const ROAD_INSET = 22;

/**
 * Derive the three S-curve road bands (Y rows) for a map of the given height.
 * Keeps 3 bands but stretches them to fill the map. Reproduces the legacy
 * [100, 52, 4] exactly at height 125.
 */
function deriveRoadBands(height) {
  const top = 4;
  const bottom = height - 25;
  const mid = Math.round((top + bottom) / 2);
  return [bottom, mid, top];
}

/**
 * MirroredWindingRoadGenerator - Multi-pass mirrored S-curve suburban generation
 */
export class MirroredWindingRoadGenerator extends BaseMapGenerator {
  generate(config, builder) {
    const context = {
      roadThickness: config.roadThickness || 5,
      sidewalkThickness: config.sidewalkThickness || 1,
      roadXMin: ROAD_INSET,
      roadXMax: builder.width - (ROAD_INSET + 1),
      roadY: deriveRoadBands(builder.height),
      sHalf: 3,
      mapNumber: config.mapNumber || 1
    };

    // Record road exits (mirrored: south exit at roadXMax, north at roadXMin).
    builder.metadata.exits = {
      north: { x: context.roadXMin, y: 0 },
      south: { x: context.roadXMax, y: builder.height - 1 }
    };

    // PASS 1: Topology
    this.passTopology(builder, context);

    // PASS 2: Zoning & Structures
    this.passZoning(builder, context);

    // PASS 3: Specialization
    this.passSpecialization(builder, context);

    // PASS 4: Details
    this.passDetails(builder, context);
  }

  passTopology(builder, context) {
    const { width, height } = builder;
    const { roadXMin, roadXMax, roadY, roadThickness, sidewalkThickness } = context;

    builder.fill('grass');
    for (let y = 0; y < height; y++) {
      builder.setTerrain(0, y, 'fence');
      builder.setTerrain(width - 1, y, 'fence');
    }
    for (let x = 0; x < width; x++) {
      builder.setTerrain(x, 0, 'fence');
      builder.setTerrain(x, height - 1, 'fence');
    }

    // Mirrored S-Curve
    builder.drawRoad({x: roadXMax, y: height-1}, {x: roadXMax, y: roadY[0]}, roadThickness, sidewalkThickness);
    builder.drawRoad({x: roadXMax, y: roadY[0]}, {x: roadXMin, y: roadY[0]}, roadThickness, sidewalkThickness);
    builder.drawRoad({x: roadXMin, y: roadY[0]}, {x: roadXMin, y: roadY[1]}, roadThickness, sidewalkThickness);
    builder.drawRoad({x: roadXMin, y: roadY[1]}, {x: roadXMax, y: roadY[1]}, roadThickness, sidewalkThickness);
    builder.drawRoad({x: roadXMax, y: roadY[1]}, {x: roadXMax, y: roadY[2]}, roadThickness, sidewalkThickness);
    builder.drawRoad({x: roadXMax, y: roadY[2]}, {x: roadXMin, y: roadY[2]}, roadThickness, sidewalkThickness);
    builder.drawRoad({x: roadXMin, y: roadY[2]}, {x: roadXMin, y: 0}, roadThickness, sidewalkThickness);
  }

  passZoning(builder, context) {
    const { roadXMin, roadXMax, roadY, sHalf } = context;
    const { height, width } = builder;

    const setback = 2; // Hard Rule: 2-tile gap
    const common = { setback, minW: 12, maxW: 22, minH: 12, maxH: 16, gap: 4, maxBuildings: 5 }; // Reduced maxH from 18 to 16

    // Horizontal Priority Zones (Mirrored)
    builder.placeBuildingsFromAnchor(roadXMax + sHalf, roadY[2] + sHalf, 'west', 'north', common);
    builder.placeBuildingsFromAnchor(roadXMax + sHalf, roadY[1] - sHalf, 'west', 'south', common);
    builder.placeBuildingsFromAnchor(roadXMin - sHalf, roadY[1] + sHalf, 'east', 'north', common);
    builder.placeBuildingsFromAnchor(roadXMin - sHalf, roadY[0] - sHalf, 'east', 'south', common);
    builder.placeBuildingsFromAnchor(roadXMax + sHalf, roadY[0] + sHalf, 'west', 'north', common);

    // Vertical Perimeters (Width-constrained)
    const maxRightW = width - 3 - (roadXMax + sHalf) - setback - 1;
    const maxLeftW = (roadXMin - sHalf) - setback - 2;

    // A. Bottom-Right (Faces West)
    builder.placeBuildingsFromAnchor(roadXMax + sHalf, height - 1, 'north', 'west', { ...common, maxBuildings: 8, maxW: maxRightW });
    // B. Bottom-Left (Faces East)
    builder.placeBuildingsFromAnchor(roadXMax - sHalf, height - 1, 'north', 'east', { ...common, maxBuildings: 8, maxW: 100 });
    // C. Top-Right (Faces West)
    builder.placeBuildingsFromAnchor(roadXMin + sHalf, 0, 'south', 'west', { ...common, maxBuildings: 8, maxW: 100 });
    // D. Top-Left (Faces East)
    builder.placeBuildingsFromAnchor(roadXMin - sHalf, 0, 'south', 'east', { ...common, maxBuildings: 8, maxW: maxLeftW });
  }

  passSpecialization(builder, context) {
    const { mapNumber, roadXMin, roadXMax, roadY } = context;
    const { width } = builder;
    const buildings = builder.metadata.buildings;
    
    // 1. POOL DEFINITIONS
    // Army Tents: Tucked back in corners/perimeters (the green zones)
    const tentPool = buildings.filter(b => {
        if (b.type !== 'residential') return false;
        const isFarPerim = b.x < 20 || b.x > width - 20;
        const isNearCorner = roadY.some(ry => Math.abs(b.y - ry) < 15);
        return isFarPerim && isNearCorner;
    });

    // Other Specials: Must have clear road frontage, away from corners
    const specialPool = buildings.filter(b => {
        if (b.type !== 'residential') return false;
        if (tentPool.includes(b)) return false;

        return this.hasRoadFrontage(builder, b, 6);
    });

    // 2. SELECTION
    const selected = [];
    const area = width * builder.height;
    const totalSpecials = Math.max(1, Math.floor(area / 5000)); // ~2 for winding road

    // A. Army Tent (Always 1 on winding road, independent of special building quota)
    if (tentPool.length > 0) {
        const tentIdx = gameRandom.nextInt(0, tentPool.length - 1);
        selected.push({ building: tentPool[tentIdx], type: 'army_tent' });
    }

    // B. Special Buildings (Quota based on area)
    if (totalSpecials > 0 && specialPool.length > 0) {
        const extraPool = this.getRandomSubarray(specialPool, totalSpecials);
        const extraTypes = this.getSpecialBuildingTypes(mapNumber, 'mirrored_winding_road', totalSpecials);
        extraPool.forEach((b, i) => {
            selected.push({ building: b, type: extraTypes[i] });
        });
    }

    // 3. EXECUTION
    selected.forEach(entry => {
        const { building: b, type } = entry;
        
        // Use thorough cleanup of terrain and metadata
        builder.clearArea(b.x, b.y, b.width, b.height);

        // Draw new structure
        if (type === 'army_tent') {
            // Determine side of map by coordinate, not frontage
            const isLeftSide = b.x < width / 2;
            const tuckedX = isLeftSide ? 3 : width - 13;
            const isFacingEast = isLeftSide; // Tents on left face east, right face west
            const tentW = 10, tentH = 6;
            
            // Clear actual tent area (match drawArmyTent's 1-tile offset)
            builder.clearArea(tuckedX + 1, b.y + 1, tentW, tentH);
            builder.drawArmyTent(tuckedX, b.y, isFacingEast);
        } else {
            builder.drawSpecialBuilding(b, type);
        }
    });
  }

  passDetails(builder, context) {
    const { width, height } = builder;
    const { roadXMin, roadXMax, roadY, roadThickness, sidewalkThickness } = context;

    // Internal Fences (Backyards)
    const fenceYs = [
        Math.floor((roadY[2] + roadY[1]) / 2), // Between top and middle S-bend
        Math.floor((roadY[1] + roadY[0]) / 2)  // Between middle and bottom S-bend
    ];
    fenceYs.forEach((fy, idx) => {
        const xStart = (idx === 0) ? 0 : roadXMin;
        const xEnd = (idx === 0) ? roadXMax : width - 1;
        for (let x = xStart; x <= xEnd; x++) {
            const current = builder.getTerrain(x, fy);
            if (current === 'road' || current === 'sidewalk') continue;

            // If we hit a building/floor, clear it to make room for the fence
            if (current === 'building' || current === 'floor') {
                const b = builder.metadata.buildings.find(building => 
                    x >= building.x && x < building.x + building.width && 
                    fy >= building.y && fy < building.y + building.height
                );

                if (b) {
                    builder.clearArea(b.x, b.y, b.width, b.height);
                } else {
                    builder.setTerrain(x, fy, 'grass');
                    builder.layout[fy][x].edgeWalls = { n: false, e: false, s: false, w: false };
                }
            }

            if (builder.getTerrain(x, fy) === 'grass') {
                builder.setTerrain(x, fy, 'fence');
            }
        }
    });

    // Exit enforcement (Mirrored)
    const roadHalf = Math.floor(roadThickness / 2);
    const sideHalf = roadHalf + sidewalkThickness;

    for (let x = 0; x < width; x++) {
        const distTop = Math.abs(x - roadXMin);
        if (distTop <= roadHalf) builder.setTerrain(x, 0, 'road');
        else if (distTop <= sideHalf) builder.setTerrain(x, 0, 'sidewalk');
        else builder.setTerrain(x, 0, 'fence');

        const distBottom = Math.abs(x - roadXMax);
        if (distBottom <= roadHalf) builder.setTerrain(x, height - 1, 'road');
        else if (distBottom <= sideHalf) builder.setTerrain(x, height - 1, 'sidewalk');
        else builder.setTerrain(x, height - 1, 'fence');
    }
  }

  getStartPosition(width, height) {
    // Player starts at the bottom (south) road run, which sits at roadXMax.
    return { x: width - (ROAD_INSET + 1), y: height - 2 };
  }
}
