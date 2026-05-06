import { BaseMapGenerator } from './BaseMapGenerator.js';

/**
 * WindingRoadGenerator - Multi-pass S-curve suburban generation
 */
export class WindingRoadGenerator extends BaseMapGenerator {
  generate(config, builder) {
    const context = {
      roadThickness: config.roadThickness || 5,
      sidewalkThickness: config.sidewalkThickness || 1,
      roadXMin: 22,
      roadXMax: builder.width - 23,
      roadY: [100, 52, 4],
      sHalf: 3,
      mapNumber: config.mapNumber || 1
    };

    // PASS 1: Topology (Roads and Boundaries)
    this.passTopology(builder, context);

    // PASS 2: Zoning & Structures (Residential)
    this.passZoning(builder, context);

    // PASS 3: Specialization (Convert houses to POIs)
    this.passSpecialization(builder, context);

    // PASS 4: Details (Final fences and exits)
    this.passDetails(builder, context);
  }

  /**
   * PASS 1: Topology - Core road S-curve and boundary fences
   */
  passTopology(builder, context) {
    const { width, height } = builder;
    const { roadXMin, roadXMax, roadY, roadThickness, sidewalkThickness } = context;

    builder.fill('grass');

    // Boundaries
    for (let y = 0; y < height; y++) {
      builder.setTerrain(0, y, 'fence');
      builder.setTerrain(width - 1, y, 'fence');
    }
    for (let x = 0; x < width; x++) {
      builder.setTerrain(x, 0, 'fence');
      builder.setTerrain(x, height - 1, 'fence');
    }

    // S-Curve
    builder.drawRoad({x: roadXMin, y: height-1}, {x: roadXMin, y: roadY[0]}, roadThickness, sidewalkThickness);
    builder.drawRoad({x: roadXMin, y: roadY[0]}, {x: roadXMax, y: roadY[0]}, roadThickness, sidewalkThickness);
    builder.drawRoad({x: roadXMax, y: roadY[0]}, {x: roadXMax, y: roadY[1]}, roadThickness, sidewalkThickness);
    builder.drawRoad({x: roadXMax, y: roadY[1]}, {x: roadXMin, y: roadY[1]}, roadThickness, sidewalkThickness);
    builder.drawRoad({x: roadXMin, y: roadY[1]}, {x: roadXMin, y: roadY[2]}, roadThickness, sidewalkThickness);
    builder.drawRoad({x: roadXMin, y: roadY[2]}, {x: roadXMax, y: roadY[2]}, roadThickness, sidewalkThickness);
    builder.drawRoad({x: roadXMax, y: roadY[2]}, {x: roadXMax, y: 0}, roadThickness, sidewalkThickness);
  }

  /**
   * PASS 2: Zoning & Structures - Neighborhood layout
   */
  passZoning(builder, context) {
    const { roadXMin, roadXMax, roadY, sHalf } = context;
    const { height, width } = builder;

    const setback = 2; // Hard Rule: 2-tile gap
    const common = { setback, minW: 12, maxW: 22, minH: 12, maxH: 16, gap: 4, maxBuildings: 5 }; // Reduced maxH from 18 to 16

    // Horizontal Priority Zones
    builder.placeBuildingsFromAnchor(roadXMin - sHalf, roadY[2] + sHalf, 'east', 'north', common);
    builder.placeBuildingsFromAnchor(roadXMin - sHalf, roadY[1] - sHalf, 'east', 'south', common);
    builder.placeBuildingsFromAnchor(roadXMax + sHalf, roadY[1] + sHalf, 'west', 'north', common);
    builder.placeBuildingsFromAnchor(roadXMax + sHalf, roadY[0] - sHalf, 'west', 'south', common);
    builder.placeBuildingsFromAnchor(roadXMin - sHalf, roadY[0] + sHalf, 'east', 'north', common);

    // Vertical Perimeters (Width-constrained)
    const maxLeftW = (roadXMin - sHalf) - setback - 2;
    const maxRightW = width - 3 - (roadXMax + sHalf) - setback - 1;

    // A. Bottom-Left (Faces East)
    builder.placeBuildingsFromAnchor(roadXMin - sHalf, height - 1, 'north', 'east', { ...common, maxBuildings: 8, maxW: maxLeftW });
    // B. Bottom-Right (Faces West)
    builder.placeBuildingsFromAnchor(roadXMin + sHalf, height - 1, 'north', 'west', { ...common, maxBuildings: 8, maxW: 100 });
    // C. Top-Left (Faces East)
    builder.placeBuildingsFromAnchor(roadXMax - sHalf, 0, 'south', 'east', { ...common, maxBuildings: 8, maxW: 100 });
    // D. Top-Right (Faces West)
    builder.placeBuildingsFromAnchor(roadXMax + sHalf, 0, 'south', 'west', { ...common, maxBuildings: 8, maxW: maxRightW });
  }

  /**
   * PASS 3: Specialization - Conversion to POIs
   */
  passSpecialization(builder, context) {
    const { mapNumber, roadXMin, roadXMax, roadY } = context;
    const { width } = builder;
    const buildings = builder.metadata.buildings;
    
    // 1. POOL DEFINITIONS
    // Army Tents: Tucked back in corners/perimeters (the green zones)
    const tentPool = buildings.filter(b => {
        if (b.type !== 'residential') return false;
        const isFarPerim = b.x < 20 || b.x > width - 20;
        const isNearCorner = Math.abs(b.y - 4) < 15 || Math.abs(b.y - 52) < 15 || Math.abs(b.y - 100) < 15;
        return isFarPerim && isNearCorner;
    });

    // Other Specials: Must have clear road frontage, away from corners
    const specialPool = buildings.filter(b => {
        if (b.type !== 'residential') return false;
        if (tentPool.includes(b)) return false;

        // 1. Must be in a central-ish zone (away from map start/end)
        const isCentral = (b.y > 15 && b.y < 110);
        if (!isCentral) return false;

        // 2. Must have strict road frontage (Max distance 5 tiles)
        let hasFrontage = false;
        const dist = 5;
        if (b.frontage === 'east') {
            const nearMin = Math.abs((b.x + b.width) - roadXMin) <= dist;
            const nearMax = Math.abs((b.x + b.width) - roadXMax) <= dist;
            hasFrontage = nearMin || nearMax;
        }
        else if (b.frontage === 'west') {
            const nearMin = Math.abs(b.x - roadXMin) <= dist;
            const nearMax = Math.abs(b.x - roadXMax) <= dist;
            hasFrontage = nearMin || nearMax;
        }
        else if (b.frontage === 'south') {
            // Find which S-bend road segment we are near
            const nearRoad = roadY.some(ry => Math.abs((b.y + b.height) - ry) <= dist);
            hasFrontage = nearRoad;
        }
        else if (b.frontage === 'north') {
            const nearRoad = roadY.some(ry => Math.abs(b.y - ry) <= dist);
            hasFrontage = nearRoad;
        }

        return hasFrontage;
    });

    // 2. SELECTION
    const selected = [];
    const area = width * builder.height;
    const totalSpecials = Math.max(1, Math.floor(area / 5000)); // ~2 for winding road

    // A. Army Tent (Always 1 on winding road, independent of special building quota)
    if (tentPool.length > 0) {
        const tentIdx = Math.floor(Math.random() * tentPool.length);
        selected.push({ building: tentPool[tentIdx], type: 'army_tent' });
    }

    // B. Special Buildings (Quota based on area)
    if (totalSpecials > 0 && specialPool.length > 0) {
        const extraPool = this.getRandomSubarray(specialPool, totalSpecials);
        const extraTypes = this.getRandomSubarray(['grocer', 'firestation', 'police', 'gas_station'], totalSpecials);
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
            const isFacingEast = b.frontage === 'east';
            // Tuck back: Left side -> x=3, Right side -> width-13
            const tuckedX = isFacingEast ? 3 : builder.width - 13;
            const tentW = 10, tentH = 6;
            
            // Clear the actual tent area thoroughly (match drawArmyTent's 1-tile offset)
            builder.clearArea(tuckedX + 1, b.y + 1, tentW, tentH);
            builder.drawArmyTent(tuckedX, b.y, isFacingEast);
        } else {
            builder.drawSpecialBuilding(b, type);
        }
    });
  }

  /**
   * PASS 4: Details - Backyard fences and road exit enforcement
   */
  passDetails(builder, context) {
    const { width, height } = builder;
    const { roadXMin, roadXMax, roadY, roadThickness, sidewalkThickness } = context;

    // Internal Fences (Backyards)
    const fenceYs = [
        Math.floor((roadY[2] + roadY[1]) / 2), // Between top and middle S-bend
        Math.floor((roadY[1] + roadY[0]) / 2)  // Between middle and bottom S-bend
    ];
    fenceYs.forEach((fy, idx) => {
        const xStart = (idx === 0) ? roadXMin : 0;
        const xEnd = (idx === 0) ? width - 1 : roadXMax;
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
                    // Clear old footprint
                    for (let ty = b.y; ty < b.y + b.height; ty++) {
                      for (let tx = b.x; tx < b.x + b.width; tx++) {
                        builder.setTerrain(tx, ty, 'grass');
                      }
                    }
                    // Remove doors/windows/metadata
                    builder.metadata.doors = builder.metadata.doors.filter(d => 
                        !(d.x >= b.x && d.x < b.x + b.width && d.y >= b.y && d.y < b.y + b.height)
                    );
                    builder.metadata.windows = builder.metadata.windows.filter(w => 
                        !(w.x >= b.x && w.x < b.x + b.width && w.y >= b.y && w.y < b.y + b.height)
                    );
                    const idx = builder.metadata.buildings.indexOf(b);
                    if (idx !== -1) builder.metadata.buildings.splice(idx, 1);
                } else {
                    builder.setTerrain(x, fy, 'grass');
                }
            }

            if (builder.getTerrain(x, fy) === 'grass') {
                builder.setTerrain(x, fy, 'fence');
            }
        }
    });

    // Exit enforcement
    const roadHalf = Math.floor(roadThickness / 2);
    const sideHalf = roadHalf + sidewalkThickness;

    for (let x = 0; x < width; x++) {
        const distTop = Math.abs(x - roadXMax);
        if (distTop <= roadHalf) builder.setTerrain(x, 0, 'road');
        else if (distTop <= sideHalf) builder.setTerrain(x, 0, 'sidewalk');
        else builder.setTerrain(x, 0, 'fence');

        const distBottom = Math.abs(x - roadXMin);
        if (distBottom <= roadHalf) builder.setTerrain(x, height - 1, 'road');
        else if (distBottom <= sideHalf) builder.setTerrain(x, height - 1, 'sidewalk');
        else builder.setTerrain(x, height - 1, 'fence');
    }
  }

  getRandomSubarray(arr, size) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, size);
  }

  getStartPosition(width, height) {
    return { x: 22, y: height - 2 };
  }
}
