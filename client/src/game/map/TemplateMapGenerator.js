/**
 * TemplateMapGenerator - Template-based map generation system
 * Generates maps from predefined templates with configurable parameters
 * Follows UniversalGoals.md: modular, testable, serializable
 */
export class TemplateMapGenerator {
  constructor() {
    this.templates = new Map();
    this.loadDefaultTemplates();
  }

  /**
   * Load predefined map templates
   */
  loadDefaultTemplates() {
    // Small building template
    this.templates.set('small_building', {
      name: 'Small Building',
      size: { width: 10, height: 8 },
      layout: [
        'wwwwwwwwww',
        'w........w',
        'w..ff....w',
        'w..ff....w',
        'w........w',
        'w....ff..w',
        'w....ff..w',
        'wwwwwwwwww'
      ],
      spawnZones: {
        entrance: [{ x: 5, y: 7 }],
        center: [{ x: 4, y: 3 }, { x: 5, y: 4 }],
        corners: [{ x: 1, y: 1 }, { x: 8, y: 1 }, { x: 1, y: 6 }, { x: 8, y: 6 }]
      },
      parameters: {
        randomWalls: { min: 0, max: 3 },
        extraFloors: { min: 0, max: 5 }
      }
    });

    // Mall section template
    this.templates.set('mall_section', {
      name: 'Mall Section',
      size: { width: 15, height: 12 },
      layout: [
        'wwwwwwwwwwwwwww',
        'w.............w',
        'w.ff.......ff.w',
        'w.ff.......ff.w',
        'w.............w',
        'w.....fff.....w',
        'w.....fff.....w',
        'w.....fff.....w',
        'w.............w',
        'w.ff.......ff.w',
        'w.ff.......ff.w',
        'wwwwwwwwwwwwwww'
      ],
      spawnZones: {
        entrance: [{ x: 7, y: 11 }, { x: 1, y: 6 }, { x: 13, y: 6 }],
        center: [{ x: 7, y: 6 }, { x: 7, y: 7 }],
        shops: [
          { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 12, y: 2 }, { x: 13, y: 2 },
          { x: 2, y: 9 }, { x: 3, y: 9 }, { x: 12, y: 9 }, { x: 13, y: 9 }
        ]
      },
      parameters: {
        randomWalls: { min: 1, max: 5 },
        extraFloors: { min: 2, max: 8 },
        shopVariations: ['small', 'medium', 'large']
      }
    });

    // Outdoor area template
    this.templates.set('outdoor_area', {
      name: 'Outdoor Area',
      size: { width: 20, height: 20 },
      layout: [
        'gggggggggggggggggggg',
        'gwwwwwwwwwwwwwwwwwwg',
        'gw................wg',
        'gw.ff............fwg',
        'gw.ff............fwg',
        'gw................wg',
        'gw......ffff......wg',
        'gw......ffff......wg',
        'gw......ffff......wg',
        'gw......ffff......wg',
        'gw................wg',
        'gw................wg',
        'gw......wwww......wg',
        'gw......w..w......wg',
        'gw......w..w......wg',
        'gw......wwww......wg',
        'gw................wg',
        'gw.ff............fwg',
        'gw.ff............fwg',
        'gwwwwwwwwwwwwwwwwwwg'
      ],
      spawnZones: {
        entrance: [{ x: 10, y: 19 }, { x: 1, y: 10 }, { x: 18, y: 10 }],
        building: [{ x: 13, y: 13 }, { x: 13, y: 14 }],
        openArea: [
          { x: 5, y: 5 }, { x: 15, y: 5 }, { x: 5, y: 15 }, { x: 15, y: 15 }
        ]
      },
      parameters: {
        randomWalls: { min: 2, max: 8 },
        extraFloors: { min: 3, max: 10 },
        buildingVariations: ['small', 'medium']
      }
    });

    // Road template - 23x100 map with central strip
    this.templates.set('road', {
      name: 'Road',
      size: { width: 35, height: 125 },
      layout: [
        'gggggggfffffgggggggg',
        'gggggggfffffgggggggg',
        'gggggggfffffgggggggg',
        'gggggggfffffgggggggg',
        'gggggggfffffgggggggg',
        'gggggggfffffgggggggg',
        'gggggggfffffgggggggg',
        'gggggggfffffgggggggg',
        'gggggggfffffgggggggg',
        'gggggggfffffgggggggg',
        'gggggggfffffgggggggg',
        'gggggggfffffgggggggg',
        'gggggggfffffgggggggg',
        'gggggggfffffgggggggg',
        'gggggggfffffgggggggg',
        'gggggggfffffgggggggg',
        'gggggggfffffgggggggg',
        'gggggggfffffgggggggg',
        'gggggggfffffgggggggg',
        'gggggggfffffgggggggg',
        'gggggggfffffgggggggg',
        'gggggggfffffgggggggg',
        'gggggggfffffgggggggg',
        'gggggggfffffgggggggg',
        'gggggggfffffgggggggg',
        'gggggggfffffgggggggg',
        'gggggggfffffgggggggg',
        'gggggggfffffgggggggg',
        'gggggggfffffgggggggg',
        'gggggggfffffgggggggg',
        'gggggggfffffgggggggg',
        'gggggggfffffgggggggg',
        'gggggggfffffgggggggg',
        'gggggggfffffgggggggg',
        'gggggggfffffgggggggg',
        'gggggggfffffgggggggg',
        'gggggggfffffgggggggg',
        'gggggggfffffgggggggg',
        'gggggggfffffgggggggg'
      ],
      spawnZones: {
        roadStart: [{ x: 17, y: 123 }, { x: 9, y: 7 }, { x: 10, y: 7 }],
        roadEnd: [{ x: 9, y: 32 }, { x: 10, y: 32 }],
        roadside: [
          { x: 6, y: 15 }, { x: 13, y: 15 }, { x: 6, y: 20 }, { x: 13, y: 20 },
          { x: 6, y: 25 }, { x: 13, y: 25 }
        ]
      },
      parameters: {
        randomWalls: { min: 0, max: 2 },
        extraFloors: { min: 0, max: 3 }
      }
    });

    console.log('[TemplateMapGenerator] Loaded', this.templates.size, 'default templates');
  }

  /**
   * Generate map from template with parameters
   */
  generateFromTemplate(templateName, config = {}) {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    const {
      randomWalls = template.parameters.randomWalls?.min || 0,
      extraFloors = template.parameters.extraFloors?.min || 0,
      variation = 'default',
      // New equation-based placement parameters
      tileEquations = [],
      stripConfig = null
    } = config;

    // Create base map data structure
    const mapData = {
      width: template.size.width,
      height: template.size.height,
      tiles: [],
      template: templateName,
      config: config,
      metadata: {
        generated: new Date().toISOString(),
        spawnZones: template.spawnZones,
        doors: [] // Track door entities to be created
      }
    };

    // Parse template layout or generate procedurally
    let baseLayout;
    if (stripConfig || tileEquations.length > 0 || templateName === 'road') {
      // Generate procedurally based on equations, or force procedural for road template
      if (templateName === 'road' && !stripConfig) {
        // Force consistent road generation with road, sidewalks, and fences
        const roadThickness = config.roadThickness || 5;
        const sidewalkThickness = config.sidewalkThickness || 1;

        // Generate the road template with multiple strips
        baseLayout = this.generateRoadLayout(template.size, roadThickness, sidewalkThickness, mapData);
      } else {
        baseLayout = this.generateProceduralLayout(template.size, stripConfig, tileEquations);
      }
    } else {
      // Use predefined template layout
      baseLayout = this.parseTemplateLayout(template.layout);
    }

    // Apply variations and randomization
    const finalLayout = this.applyTemplateVariations(baseLayout, template, config);

    // For road template, skip random elements to ensure consistency
    if (templateName !== 'road') {
      // Add random elements only for non-road templates
      this.addRandomWalls(finalLayout, randomWalls);
      this.addRandomFloors(finalLayout, extraFloors);
    }

    // Convert to tile data
    mapData.tiles = this.layoutToTileData(finalLayout);

    // Add yellow transition tile at the top of the map (17,0)
    this.setTileData(mapData, 17, 0, 'transition');

    // Add south transition tile at (17,124) for non-first maps
    // Note: This will be set during map generation when we know the map ID
    this.setTileData(mapData, 17, 124, 'transition');

    // Add spawn zones metadata
    mapData.metadata = {
      ...mapData.metadata,
      spawnZones: {
        roadStart: [{ x: 17, y: 123 }], // Bottom of road for player spawn
        transitionPoints: {
          north: { x: 17, y: 0 }, // Top of map - go to next map
          south: { x: 17, y: 124 } // Bottom of map - go to previous map (not for map_001)
        }
      }
    };

    console.log(`[TemplateMapGenerator] Generated '${templateName}' map (${mapData.width}x${mapData.height}) with ${templateName === 'road' ? 0 : randomWalls} random walls, ${templateName === 'road' ? 0 : extraFloors} extra floors`);

    return mapData;
  }

  /**
   * Convert layout to tile data format
   */
  layoutToTileData(layout) {
    return layout.map((row, y) =>
      row.map((terrain, x) => ({
        x,
        y,
        terrain,
        contents: []
      }))
    );
  }

  /**
   * Set tile data at specific coordinates
   */
  setTileData(mapData, x, y, terrain) {
    if (y >= 0 && y < mapData.height && x >= 0 && x < mapData.width) {
      // Ensure the row exists
      if (!mapData.tiles[y]) {
        mapData.tiles[y] = [];
      }
      // Ensure the tile data object exists for the coordinate
      if (!mapData.tiles[y][x]) {
        mapData.tiles[y][x] = { x, y, terrain: 'grass', contents: [] }; // Default to grass if not initialized
      }
      mapData.tiles[y][x].terrain = terrain;
    }
  }

  /**
   * Parse template layout strings into 2D array
   */
  parseTemplateLayout(layoutStrings) {
    const terrainMap = {
      'w': 'wall',
      'f': 'floor',
      'g': 'grass',
      'r': 'road',
      's': 'sidewalk',
      'F': 'fence',
      'H': 'water',
      '.': 'grass' // Default open space
    };

    return layoutStrings.map(row =>
      row.split('').map(char => terrainMap[char] || 'grass')
    );
  }

  /**
   * Apply template variations based on config
   */
  applyTemplateVariations(layout, template, config) {
    // Clone layout to avoid modifying original
    const modifiedLayout = layout.map(row => [...row]);

    // Apply shop variations for mall template
    if (template.name === 'Mall Section' && config.shopVariations) {
      this.applyShopVariations(modifiedLayout, template, config.shopVariations);
    }

    // Apply building variations for outdoor template
    if (template.name === 'Outdoor Area' && config.buildingVariations) {
      this.applyBuildingVariations(modifiedLayout, template, config.buildingVariations);
    }

    return modifiedLayout;
  }

  /**
   * Add random walls to layout
   */
  addRandomWalls(layout, count) {
    const height = layout.length;
    const width = layout[0].length;
    let added = 0;

    while (added < count) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);

      // Don't overwrite existing walls or place on edges
      if (layout[y][x] !== 'wall' && x > 0 && x < width - 1 && y > 0 && y < height - 1) {
        layout[y][x] = 'wall';
        added++;
      }
    }
  }

  /**
   * Add random floor tiles to layout
   */
  addRandomFloors(layout, count) {
    const height = layout.length;
    const width = layout[0].length;
    let added = 0;

    while (added < count) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);

      // Only place on grass, not walls or existing floors
      if (layout[y][x] === 'grass') {
        layout[y][x] = 'floor';
        added++;
      }
    }
  }

  /**
   * Apply shop variations to mall template
   */
  applyShopVariations(layout, template, variations) {
    // Example: modify shop areas based on variation
    if (variations.includes('large')) {
      // Expand some shop areas
      for (let y = 2; y <= 3; y++) {
        for (let x = 2; x <= 4; x++) {
          if (layout[y] && layout[y][x] === 'grass') {
            layout[y][x] = 'floor';
          }
        }
      }
    }
  }

  /**
   * Apply building variations to outdoor template
   */
  applyBuildingVariations(layout, template, variations) {
    // Example: modify building size based on variation
    if (variations.includes('medium')) {
      // Expand the central building
      for (let y = 11; y <= 16; y++) {
        for (let x = 6; x <= 14; x++) {
          if (layout[y] && layout[y][x] === 'grass') {
            layout[y][x] = 'wall';
          }
        }
      }
    }
  }

  /**
   * Generate road layout with road, sidewalks, fences, and buildings
   */
  generateRoadLayout(size, roadThickness, sidewalkThickness, mapData) {
    const { width, height } = size;

    // Initialize with grass
    const layout = Array(height).fill().map(() => Array(width).fill('grass'));

    // Add fence strips on left and right edges
    for (let y = 0; y < height; y++) {
      layout[y][0] = 'fence';  // Left edge
      layout[y][width - 1] = 'fence';  // Right edge
    }

    // Calculate positions for road and sidewalks
    const centerX = Math.floor(width / 2);
    const roadHalfThickness = Math.floor(roadThickness / 2);

    // Road strip in the center
    const roadStartX = centerX - roadHalfThickness;
    const roadEndX = centerX + roadHalfThickness;

    // Sidewalk strips on either side of the road
    const leftSidewalkStartX = roadStartX - sidewalkThickness;
    const leftSidewalkEndX = roadStartX - 1;
    const rightSidewalkStartX = roadEndX + 1;
    const rightSidewalkEndX = roadEndX + sidewalkThickness;

    // Apply the strips
    for (let y = 0; y < height; y++) {
      // Left sidewalk
      for (let x = Math.max(1, leftSidewalkStartX); x <= leftSidewalkEndX && x < width - 1; x++) {
        layout[y][x] = 'sidewalk';
      }

      // Road
      for (let x = roadStartX; x <= roadEndX && x < width - 1; x++) {
        if (x > 0) layout[y][x] = 'road';
      }

      // Right sidewalk
      for (let x = rightSidewalkStartX; x <= Math.min(rightSidewalkEndX, width - 2); x++) {
        layout[y][x] = 'sidewalk';
      }
    }

    // Add buildings
    this.placeBuildingsOnRoad(layout, width, height, leftSidewalkStartX, rightSidewalkEndX, mapData);

    // Add ponds (50% chance)
    this.addPonds(layout);

    return layout;
  }

  /**
   * Add irregularly shaped ponds to the layout
   */
  addPonds(layout) {
    if (Math.random() > 0.5) return; // 50% chance

    const height = layout.length;
    const width = layout[0].length;

    // Find a good spot (grass area)
    const spots = [];
    for (let y = 10; y < height - 10; y++) {
      for (let x = 2; x < width - 2; x++) {
        if (layout[y][x] === 'grass') {
          // Check for a 3x3 grass area at minimum
          let isGrassPatch = true;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (!layout[y + dy] || layout[y + dy][x + dx] !== 'grass') {
                isGrassPatch = false;
                break;
              }
            }
            if (!isGrassPatch) break;
          }
          if (isGrassPatch) spots.push({ x, y });
        }
      }
    }

    if (spots.length === 0) {
      console.log('[TemplateMapGenerator] No suitable spot found for pond');
      return;
    }

    const pondCenter = spots[Math.floor(Math.random() * spots.length)];
    const pondSize = 5 + Math.floor(Math.random() * 6); // 5 to 10 tiles

    // Simple blob generation
    const pondTiles = [pondCenter];
    for (let i = 0; i < pondSize; i++) {
      const current = pondTiles[Math.floor(Math.random() * pondTiles.length)];
      const dirs = [
        { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
        { dx: 1, dy: 1 }, { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }
      ];
      const dir = dirs[Math.floor(Math.random() * dirs.length)];
      const next = { x: current.x + dir.dx, y: current.y + dir.dy };

      // Ensure it's grass and not overlapping too much or hitting buildings
      if (layout[next.y] && layout[next.y][next.x] === 'grass') {
        const alreadyAdded = pondTiles.some(t => t.x === next.x && t.y === next.y);
        if (!alreadyAdded) {
          pondTiles.push(next);
        }
      }
    }

    pondTiles.forEach(tile => {
      layout[tile.y][tile.x] = 'water';
    });

    console.log(`[TemplateMapGenerator] Added pond with ${pondTiles.length} tiles at (${pondCenter.x}, ${pondCenter.y})`);
  }

  /**
   * Place buildings along the road with specific placement rules
   */
  placeBuildingsOnRoad(layout, width, height, leftSidewalkStartX, rightSidewalkEndX, mapData) {
    // Building placement parameters
    const minBuildingWidth = 6;
    const maxBuildingWidth = 10;
    const minBuildingHeight = 8;
    const maxBuildingHeight = 12;
    const minGapBetweenBuildings = 2;
    const maxGapBetweenBuildings = 10;
    const buildingBuffer = 2; // Top and bottom rows to avoid
    const grassGapFromSidewalk = 1; // One tile of grass between sidewalk and building

    // Calculate building zones (one tile away from sidewalk)
    const leftBuildingZoneEnd = leftSidewalkStartX - grassGapFromSidewalk - 1;
    const rightBuildingZoneStart = rightSidewalkEndX + grassGapFromSidewalk + 1;

    // Place buildings on left side
    this.placeBuildingsInZone(layout, 1, leftBuildingZoneEnd, buildingBuffer, height - buildingBuffer,
      minBuildingWidth, maxBuildingWidth, minBuildingHeight, maxBuildingHeight,
      minGapBetweenBuildings, maxGapBetweenBuildings, mapData);

    // Place buildings on right side
    this.placeBuildingsInZone(layout, rightBuildingZoneStart, width - 2, buildingBuffer, height - buildingBuffer,
      minBuildingWidth, maxBuildingWidth, minBuildingHeight, maxBuildingHeight,
      minGapBetweenBuildings, maxGapBetweenBuildings, mapData);
  }

  /**
   * Place buildings in a specific zone with given constraints
   */
  placeBuildingsInZone(layout, zoneStartX, zoneEndX, zoneStartY, zoneEndY,
    minWidth, maxWidth, minHeight, maxHeight, minGap, maxGap, mapData) {
    const zoneWidth = zoneEndX - zoneStartX + 1;
    const zoneHeight = zoneEndY - zoneStartY;

    if (zoneWidth < minWidth || zoneHeight < minHeight) {
      return; // Zone too small for buildings
    }

    let currentY = zoneStartY;

    while (currentY < zoneEndY) {
      // Random building dimensions
      const buildingWidth = minWidth + Math.floor(Math.random() * (maxWidth - minWidth + 1));
      const buildingHeight = minHeight + Math.floor(Math.random() * (maxHeight - minHeight + 1));

      // Check if building fits in remaining vertical space
      if (currentY + buildingHeight > zoneEndY) {
        break;
      }

      // Place building at consistent position relative to sidewalk
      let buildingStartX;
      if (zoneStartX < 12) {
        // Left side - place buildings at the right edge of the zone (closest to road)
        buildingStartX = Math.max(zoneStartX, zoneEndX - buildingWidth + 1);
      } else {
        // Right side - place buildings at the left edge of the zone (closest to road)
        buildingStartX = zoneStartX;
      }

      // Ensure building fits within zone boundaries
      if (buildingStartX + buildingWidth > zoneEndX + 1) {
        buildingStartX = zoneEndX - buildingWidth + 1;
      }
      if (buildingStartX < zoneStartX) {
        buildingStartX = zoneStartX;
      }

      // Place hollow building with walls and floor interior
      for (let y = currentY; y < currentY + buildingHeight; y++) {
        for (let x = buildingStartX; x < buildingStartX + buildingWidth; x++) {
          if (x >= 0 && x < layout[0].length && y >= 0 && y < layout.length) {
            // Create walls on the perimeter, floor tiles inside
            const isPerimeter = (y === currentY || y === currentY + buildingHeight - 1 ||
              x === buildingStartX || x === buildingStartX + buildingWidth - 1);

            if (isPerimeter) {
              layout[y][x] = 'building';
            } else {
              layout[y][x] = 'floor';
            }
          }
        }
      }

      // Add entrance - random gap in wall closest to sidewalk
      const entranceY = currentY + 1 + Math.floor(Math.random() * (buildingHeight - 2)); // Avoid corners
      let entranceX;

      if (zoneStartX < 12) {
        // Left side - entrance on right wall (closest to road)
        entranceX = buildingStartX + buildingWidth - 1;
      } else {
        // Right side - entrance on left wall (closest to road)
        entranceX = buildingStartX;
      }

      // Create the entrance by replacing wall with floor
      if (entranceX >= 0 && entranceX < layout[0].length &&
        entranceY >= 0 && entranceY < layout.length) {
        layout[entranceY][entranceX] = 'floor';

        // 90% chance to add a door at the entrance
        if (Math.random() < 0.9) {
          if (mapData && mapData.metadata && mapData.metadata.doors) {
            mapData.metadata.doors.push({
              x: entranceX,
              y: entranceY,
              isLocked: Math.random() < 0.1, // 10% chance to be locked
              isOpen: false
            });
          }
        }
      }

      // Move to next building position with random gap
      const gap = minGap + Math.floor(Math.random() * (maxGap - minGap + 1));
      currentY += buildingHeight + gap;
    }
  }

  /**
   * Generate procedural layout based on equations and strip config
   */
  generateProceduralLayout(size, stripConfig, tileEquations) {
    const { width, height } = size;

    // Initialize with default terrain
    const layout = Array(height).fill().map(() => Array(width).fill('grass'));

    // Apply strip configuration if provided
    if (stripConfig) {
      this.applyStripConfig(layout, width, height, stripConfig);
    }

    // Apply tile equations
    tileEquations.forEach(equation => {
      this.applyTileEquation(layout, width, height, equation);
    });

    return layout;
  }

  /**
   * Apply strip configuration to layout
   */
  applyStripConfig(layout, width, height, stripConfig) {
    const {
      type = 'vertical', // 'vertical', 'horizontal', 'diagonal'
      terrain = 'floor',
      thickness = 1,
      position = 'center', // 'center', number, or equation string
      startY = 0,
      endY = height - 1,
      startX = 0,
      endX = width - 1
    } = stripConfig;

    if (type === 'vertical') {
      let centerX;
      if (position === 'center') {
        centerX = Math.floor(width / 2);
      } else if (typeof position === 'number') {
        centerX = position;
      } else if (typeof position === 'string') {
        // Evaluate equation (simple math expressions)
        centerX = this.evaluatePositionEquation(position, { width, height });
      }

      const halfThickness = Math.floor(thickness / 2);

      for (let y = startY; y <= endY; y++) {
        for (let x = centerX - halfThickness; x <= centerX + halfThickness; x++) {
          if (x >= 0 && x < width && y >= 0 && y < height) {
            layout[y][x] = terrain;
          }
        }
      }
    } else if (type === 'horizontal') {
      let centerY;
      if (position === 'center') {
        centerY = Math.floor(height / 2);
      } else if (typeof position === 'number') {
        centerY = position;
      } else if (typeof position === 'string') {
        centerY = this.evaluatePositionEquation(position, { width, height });
      }

      const halfThickness = Math.floor(thickness / 2);

      for (let x = startX; x <= endX; x++) {
        for (let y = centerY - halfThickness; y <= centerY + halfThickness; y++) {
          if (x >= 0 && x < width && y >= 0 && y < height) {
            layout[y][x] = terrain;
          }
        }
      }
    }
  }

  /**
   * Apply individual tile equation to layout
   */
  applyTileEquation(layout, width, height, equation) {
    const {
      condition, // Function or string equation that returns true/false
      terrain,
      name = 'custom'
    } = equation;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let shouldPlace = false;

        if (typeof condition === 'function') {
          shouldPlace = condition(x, y, width, height);
        } else if (typeof condition === 'string') {
          shouldPlace = this.evaluateTileCondition(condition, x, y, width, height);
        }

        if (shouldPlace) {
          layout[y][x] = terrain;
        }
      }
    }
  }

  /**
   * Evaluate simple position equations
   */
  evaluatePositionEquation(equation, variables) {
    // Simple math expression evaluator
    // Replace variables in equation
    let expr = equation.replace(/width/g, variables.width)
      .replace(/height/g, variables.height);

    // Evaluate basic math (security: only allow numbers, +, -, *, /, %, parentheses)
    if (/^[0-9+\-*/%().\s]+$/.test(expr)) {
      try {
        // Use Function constructor for safer evaluation than eval()
        const calculate = new Function(`return Math.floor(${expr})`);
        return calculate();
      } catch (e) {
        console.warn('[TemplateMapGenerator] Invalid position equation:', equation);
        return 0;
      }
    }
    return 0;
  }

  /**
   * Evaluate tile placement conditions
   */
  evaluateTileCondition(condition, x, y, width, height) {
    // Replace variables in condition
    let expr = condition.replace(/x/g, x)
      .replace(/y/g, y)
      .replace(/width/g, width)
      .replace(/height/g, height);

    // Evaluate boolean expression (security: only allow numbers, comparison operators, math)
    if (/^[0-9+\-*/%().\s<>=!&|]+$/.test(expr)) {
      try {
        // Use Function constructor for safer evaluation than eval()
        const conditionFunction = new Function('x', 'y', 'mapWidth', 'mapHeight', `return ${expr}`);
        return conditionFunction(x, y, width, height);
      } catch (e) {
        console.warn('[TemplateMapGenerator] Invalid tile condition:', condition);
        return false;
      }
    }
    return false;
  }

  /**
   * Get available templates
   */
  getAvailableTemplates() {
    return Array.from(this.templates.keys()).map(key => ({
      id: key,
      name: this.templates.get(key).name,
      size: this.templates.get(key).size,
      parameters: this.templates.get(key).parameters
    }));
  }

  /**
   * Get template details
   */
  getTemplate(templateName) {
    return this.templates.get(templateName);
  }

  /**
   * Get template-specific starting position
   */
  getTemplateStartPosition(templateName) {
    const templateStartPositions = {
      'road': { x: 17, y: 123 },
      'small_building': { x: 5, y: 7 },
      'mall_section': { x: 7, y: 11 },
      'outdoor_area': { x: 10, y: 19 }
    };

    return templateStartPositions[templateName] || null;
  }

  /**
   * Apply template-generated map data to a GameMap instance
   */
  async applyToGameMap(gameMap, templateMapData) {
    try {
      // Verify template data exists
      if (!templateMapData || !templateMapData.tiles) {
        throw new Error('Invalid template data: missing tiles array');
      }

      // Verify size compatibility
      if (templateMapData.width !== gameMap.width || templateMapData.height !== gameMap.height) {
        console.warn('[TemplateMapGenerator] Map size mismatch, resizing GameMap');
        gameMap.width = templateMapData.width;
        gameMap.height = templateMapData.height;
        gameMap.initializeMap(); // Reinitialize with new size
      }

      // Apply terrain from template
      for (let y = 0; y < templateMapData.height; y++) {
        for (let x = 0; x < templateMapData.width; x++) {
          if (!templateMapData.tiles[y] || !templateMapData.tiles[y][x]) {
            console.warn(`[TemplateMapGenerator] Missing tile data at (${x}, ${y})`);
            continue;
          }
          const tileData = templateMapData.tiles[y][x];
          if (tileData.terrain) {
            gameMap.setTerrain(x, y, tileData.terrain);
          }
        }
      }

      console.log(`[TemplateMapGenerator] Applied template map data to GameMap (${gameMap.width}x${gameMap.height})`);

      // Instantiate door entities from metadata
      if (templateMapData.metadata && templateMapData.metadata.doors) {
        const { Door } = await import('../entities/Door.js');
        templateMapData.metadata.doors.forEach(doorData => {
          const door = new Door(
            doorData.id || `door-${doorData.x}-${doorData.y}`,
            doorData.x,
            doorData.y,
            doorData.isLocked,
            doorData.isOpen
          );
          gameMap.addEntity(door, doorData.x, doorData.y);
        });
        console.log(`[TemplateMapGenerator] Added ${templateMapData.metadata.doors.length} doors to map`);
      }

      return gameMap;
    } catch (error) {
      console.error('[TemplateMapGenerator] Failed to apply template to GameMap:', error);
      throw error;
    }
  }
}