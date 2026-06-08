import { BaseMapGenerator } from './BaseMapGenerator.js';

/**
 * StartingRoadGenerator - Generates the map 1 starting road layout
 */
export class StartingRoadGenerator extends BaseMapGenerator {
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

    // Road and Sidewalks stop at y = 98 (leaving y = 99 to 124 for player yard)
    const centerX = Math.floor(width / 2);
    const roadEndOffset = 95;
    const p1 = { x: centerX, y: 0 };
    const p2 = { x: centerX, y: roadEndOffset };
    builder.drawRoad(p1, p2, roadThickness, sidewalkThickness);

    // Place fences at top borders in the grass area and all the way across the bottom
    for (let x = 0; x < width; x++) {
      if (builder.getTerrain(x, 0) === 'grass') {
        builder.setTerrain(x, 0, 'fence');
      }
      builder.setTerrain(x, height - 1, 'fence');
    }
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

    // Standard buildings (Left and Right) starting above the yard (anchor y = 98)
    builder.placeBuildingsFromAnchor(leftSidewalkX, 98, 'north', 'east', { ...common, maxW: maxLeftW });
    builder.placeBuildingsFromAnchor(rightSidewalkX, 98, 'north', 'west', { ...common, maxW: maxRightW });

    // Draw the starting house at the bottom of the map
    const houseW = 21;
    const houseH = 11;
    const houseX = Math.floor((width - houseW) / 2);
    const houseY = 102; // Moved up to be within 4 tiles of the road (from y = 108)
    
    builder.drawBuilding(houseX, houseY, houseW, houseH, 'north', 'starting_home');
  }

  passSpecialization(builder, context) {
    const buildings = builder.metadata.buildings;
    const { width } = builder;
    const { mapNumber } = context;

    // Candidates: Any residential building (excluding the starting home!)
    let candidateBuildings = buildings.filter(b => b.type === 'residential');

    // A. Special Buildings (Map 1 always includes grocer)
    if (candidateBuildings.length >= 1) {
        const area = width * builder.height;
        const selectedCount = Math.max(1, Math.floor(area / 5000));
        
        const selected = this.getRandomSubarray(candidateBuildings, selectedCount);
        const types = this.getSpecialBuildingTypes(mapNumber, 'road', selectedCount);

        selected.forEach((b, i) => {
            const type = types[i];
            
            // Thorough cleanup
            builder.clearArea(b.x, b.y, b.width, b.height);

            builder.drawSpecialBuilding(b, type);
        });
    }
  }

  passDetails(builder, config) {
    // No additional complex internal details needed
  }

  getStartPosition(width, height) {
    // Player starts inside the starting house
    return { x: 22, y: 106 }; // houseY is 102, so houseY + 4 = 106 (centered inside)
  }
}
