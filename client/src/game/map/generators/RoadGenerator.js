import { BaseMapGenerator } from './BaseMapGenerator.js';

/**
 * RoadGenerator - Generates straight road layouts
 */
export class RoadGenerator extends BaseMapGenerator {
  generate(config, builder) {
    const context = { mapNumber: config.mapNumber || 1 };
    this.passTopology(builder, config);
    this.passZoning(builder, config);
    this.passSpecialization(builder, context);
    this.passDetails(builder, config);
  }

  passTopology(builder, config) {
    const { width, height } = builder;
    const roadThickness = config.roadThickness || 5;
    const sidewalkThickness = config.sidewalkThickness || 1;

    builder.fill('grass');

    // Boundary fences
    for (let y = 0; y < height; y++) {
      builder.setTerrain(0, y, 'fence');
      builder.setTerrain(width - 1, y, 'fence');
    }

    // Road and Sidewalks
    const centerX = Math.floor(width / 2);
    const p1 = { x: centerX, y: 0 };
    const p2 = { x: centerX, y: height - 1 };
    builder.drawRoad(p1, p2, roadThickness, sidewalkThickness);
  }

  passZoning(builder, config) {
    const { width, height } = builder;
    const roadThickness = config.roadThickness || 5;
    const sidewalkThickness = config.sidewalkThickness || 1;
    const centerX = Math.floor(width / 2);
    const half = Math.floor(roadThickness / 2);
    
    const leftSidewalkX = centerX - half - sidewalkThickness;
    const rightSidewalkX = centerX + half + sidewalkThickness;
    const setback = 2;

    const maxLeftW = leftSidewalkX - setback - 2;
    const maxRightW = width - 3 - rightSidewalkX - setback - 1;

    const common = { setback, minW: 12, maxW: 22, minH: 12, maxH: 16, gap: 4, maxBuildings: 8 };

    // Left side (facing East)
    builder.placeBuildingsFromAnchor(leftSidewalkX, height - 1, 'north', 'east', { ...common, maxW: maxLeftW });
    // Right side (facing West)
    builder.placeBuildingsFromAnchor(rightSidewalkX, height - 1, 'north', 'west', { ...common, maxW: maxRightW });
  }

  passSpecialization(builder, context) {
    const buildings = builder.metadata.buildings;
    const { width } = builder;
    const { mapNumber } = context;

    // Candidates: Any residential building
    let candidateBuildings = buildings.filter(b => b.type === 'residential');

    // A. Army Tent (Special rules)
    let spawnTent = false;
    if (mapNumber === 3) {
        spawnTent = true;
    } else if (mapNumber > 4) {
        // 35% chance for straight roads past Map 4
        spawnTent = Math.random() < 0.35;
    }

    if (spawnTent && candidateBuildings.length > 0) {
        const tentIdx = Math.floor(Math.random() * candidateBuildings.length);
        const b = candidateBuildings.splice(tentIdx, 1)[0];

        // Thorough cleanup
        builder.clearArea(b.x, b.y, b.width, b.height);

        // Determine side of map by coordinate, not frontage
        const isLeftSide = b.x < width / 2;
        const tuckedX = isLeftSide ? 3 : width - 13;
        const isFacingEast = isLeftSide; // Tents on left face east, right face west
        const tentW = 10, tentH = 6;
        
        // Clear actual tent area (match drawArmyTent's 1-tile offset)
        builder.clearArea(tuckedX + 1, b.y + 1, tentW, tentH);
        builder.drawArmyTent(tuckedX, b.y, isFacingEast);
    }

    // B. Special Buildings
    if (candidateBuildings.length >= 1) {
        const area = width * builder.height;
        const selectedCount = Math.max(1, Math.floor(area / 5000));
        
        const selected = this.getRandomSubarray(candidateBuildings, selectedCount);
        const types = this.getRandomSubarray(['grocer', 'firestation', 'police', 'gas_station'], selectedCount);

        selected.forEach((b, i) => {
            const type = types[i];
            
            // Thorough cleanup
            builder.clearArea(b.x, b.y, b.width, b.height);

            builder.drawSpecialBuilding(b, type);
        });
    }
  }

  passDetails(builder, config) {
    // Standard straight road doesn't need complex internal fences for now
  }
}
