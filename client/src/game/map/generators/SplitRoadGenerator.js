import { BaseMapGenerator } from './BaseMapGenerator.js';

/**
 * SplitRoadGenerator - Generates a map with roads on both sides and houses in the center
 */
export class SplitRoadGenerator extends BaseMapGenerator {
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

    // 1. Perimeter Fence (Entire Boundary)
    for (let x = 0; x < width; x++) {
      builder.setTerrain(x, 0, 'fence');
      builder.setTerrain(x, height - 1, 'fence');
    }
    for (let y = 0; y < height; y++) {
      builder.setTerrain(0, y, 'fence');
      builder.setTerrain(width - 1, y, 'fence');
    }

    // 2. Perimeter Sidewalk (Inside Fence)
    for (let x = 1; x < width - 1; x++) {
      builder.setTerrain(x, 1, 'sidewalk');
      builder.setTerrain(x, height - 2, 'sidewalk');
    }
    for (let y = 1; y < height - 1; y++) {
      builder.setTerrain(1, y, 'sidewalk');
      builder.setTerrain(width - 2, y, 'sidewalk');
    }

    // 3. Horizontal Roads (Top and Bottom)
    for (let x = 2; x < width - 2; x++) {
      // Top Road
      for (let ty = 2; ty < 2 + roadThickness; ty++) {
        builder.setTerrain(x, ty, 'road');
      }
      // Bottom Road
      for (let ty = height - 2 - roadThickness; ty < height - 2; ty++) {
        builder.setTerrain(x, ty, 'road');
      }
    }

    // 4. Vertical Roads (Left and Right)
    // Clipped to stay between the horizontal roads
    const roadStartY = 2;
    const roadEndY = height - 2;
    for (let y = roadStartY; y < roadEndY; y++) {
      // Left Road
      for (let tx = 2; tx < 2 + roadThickness; tx++) {
        builder.setTerrain(tx, y, 'road');
      }
      // Right Road
      for (let tx = width - 2 - roadThickness; tx < width - 2; tx++) {
        builder.setTerrain(tx, y, 'road');
      }
    }

    // 5. Inner Sidewalks
    const innerS1 = 2 + roadThickness;
    const innerS2 = height - 3 - roadThickness;
    const innerS3 = width - 3 - roadThickness;
    
    // Horizontal inner sidewalks
    for (let x = innerS1; x <= innerS3; x++) {
      builder.setTerrain(x, innerS1, 'sidewalk');
      builder.setTerrain(x, innerS2, 'sidewalk');
    }
    // Vertical inner sidewalks
    for (let y = innerS1; y <= innerS2; y++) {
      builder.setTerrain(innerS1, y, 'sidewalk');
      builder.setTerrain(innerS3, y, 'sidewalk');
    }

    // 6. Central Vertical Fence
    const centerX = Math.floor(width / 2);
    for (let y = innerS1 + 1; y < innerS2; y++) {
      builder.setTerrain(centerX, y, 'fence');
    }

    // 7. North/South Entry/Exit Road Strips (Center)
    const entryWidth = 5;
    const startX = centerX - Math.floor(entryWidth / 2);
    
    // North Strip: Fence (y=0) and Sidewalk (y=1) are replaced by road for entry
    for (let y = 0; y <= innerS1; y++) {
      for (let x = startX; x < startX + entryWidth; x++) {
        // Special Case: Keep inner sidewalk continuous if requested (Blue Circle area)
        if (y === innerS1) {
            builder.setTerrain(x, y, 'sidewalk');
        } else {
            builder.setTerrain(x, y, 'road');
        }
      }
    }
    
    // South Strip
    for (let y = innerS2; y < height; y++) {
      for (let x = startX; x < startX + entryWidth; x++) {
        if (y === innerS2) {
            builder.setTerrain(x, y, 'sidewalk');
        } else {
            builder.setTerrain(x, y, 'road');
        }
      }
    }
  }

  passZoning(builder, config) {
    const { width, height } = builder;
    const roadThickness = config.roadThickness || 5;
    const sidewalkThickness = config.sidewalkThickness || 1;
    const setback = 2;

    // Inner Sidewalk X coordinates
    const leftInnerSidewalkX = 2 + roadThickness;
    const rightInnerSidewalkX = width - 3 - roadThickness;

    const common = { 
        setback, 
        minW: 12, maxW: 18, 
        minH: 12, maxH: 16, 
        gap: 4, 
        maxBuildings: 10 
    };

    // Left side houses (facing the left road loop)
    // Growth from North to South
    builder.placeBuildingsFromAnchor(leftInnerSidewalkX, 8, 'south', 'west', common);

    // Right side houses (facing the right road loop)
    builder.placeBuildingsFromAnchor(rightInnerSidewalkX, 8, 'south', 'east', common);
  }

  passSpecialization(builder, context) {
    const buildings = builder.metadata.buildings;
    
    // We want exactly 1 special building as per user request
    let candidateBuildings = buildings.filter(b => b.type === 'residential');

    if (candidateBuildings.length >= 1) {
        const selectedIdx = Math.floor(Math.random() * candidateBuildings.length);
        const b = candidateBuildings[selectedIdx];
        
        // Remove from residential list in metadata so it doesn't get treated as one
        builder.metadata.buildings = builder.metadata.buildings.filter(item => item !== b);

        const types = this.getSpecialBuildingTypes(context.mapNumber, 'split_road', 1);
        const type = types[0];
        
        // Cleanup and draw
        builder.clearArea(b.x, b.y, b.width, b.height);
        builder.drawSpecialBuilding(b, type);
    }
  }

  passDetails(builder, config) {
    // No extra details for now
  }
}
