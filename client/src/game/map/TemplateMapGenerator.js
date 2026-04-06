import { createItemFromDef } from '../inventory/ItemDefs.js';

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
      size: { width: 45, height: 125 },
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

    // Add yellow transition tile at the top of the map (centerX,0)
    const centerX = Math.floor(mapData.width / 2);
    this.setTileData(mapData, centerX, 0, 'transition');

    // Add south transition tile at (centerX, height-1) for non-first maps
    // Note: This will be set during map generation when we know the map ID
    this.setTileData(mapData, centerX, mapData.height - 1, 'transition');

    // Add spawn zones metadata
    mapData.metadata = {
      ...mapData.metadata,
      spawnZones: {
        roadStart: [{ x: centerX, y: mapData.height - 2 }], // Bottom of road for player spawn
        transitionPoints: {
          north: { x: centerX, y: 0 }, // Top of map - go to next map
          south: { x: centerX, y: mapData.height - 1 } // Bottom of map - go to previous map (not for map_001)
        }
      }
    };

    this.placeWildCrops(mapData);

    console.log(`[TemplateMapGenerator] Generated '${templateName}' map (${mapData.width}x${mapData.height}) with ${templateName === 'road' ? 0 : randomWalls} random walls, ${templateName === 'road' ? 0 : extraFloors} extra floors`);

    return mapData;
  }

  /**
   * Place wild crops in secluded grass areas
   */
  placeWildCrops(mapData) {
    const validSpots = [];
    const { width, height, tiles } = mapData;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const tile = tiles[y][x];
        if (tile.terrain !== 'grass') continue;

        // Check neighbors for seclusion criteria
        let nearBuildingOrWall = false;
        let nearRoadOrSidewalk = false;

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const neighbor = tiles[y + dy][x + dx];
            if (!neighbor) continue;

            if (neighbor.terrain === 'building' || neighbor.terrain === 'wall' || neighbor.terrain === 'tent_wall' || neighbor.terrain === 'fence') {
              nearBuildingOrWall = true;
            }
            if (neighbor.terrain === 'road' || neighbor.terrain === 'sidewalk') {
              nearRoadOrSidewalk = true;
            }
          }
        }

        if (nearBuildingOrWall && !nearRoadOrSidewalk) {
          validSpots.push({ x, y });
        }
      }
    }

    if (validSpots.length === 0) return;

    // Pick 1 to 3 random spots
    const count = 1 + Math.floor(Math.random() * 3);
    const selectedSpots = [];
    for (let i = 0; i < count && validSpots.length > 0; i++) {
      const index = Math.floor(Math.random() * validSpots.length);
      selectedSpots.push(validSpots.splice(index, 1)[0]);
    }

    // Crop definitions for wild variety
    const crops = [
      { defId: 'provision.harvestable_tomato', name: 'Harvestable Tomato', subtype: 'harvestable_tomato' },
      { defId: 'provision.harvestable_carrot', name: 'Harvestable Carrot', subtype: 'harvestable_carrot' },
      { defId: 'provision.harvestable_corn', name: 'Harvestable Corn', subtype: 'harvestable_corn' }
    ];

    selectedSpots.forEach(spot => {
      const tile = tiles[spot.y][spot.x];
      const cropDef = crops[Math.floor(Math.random() * crops.length)];
      
      const wildCropItem = createItemFromDef(cropDef.defId, {
        subtype: cropDef.subtype,
        x: spot.x,
        y: spot.y,
        isWild: true,
        isHarvestable: true,
        lifetimeTurns: 0
      });

      if (!tile.inventoryItems) tile.inventoryItems = [];
      tile.inventoryItems.push(wildCropItem);
    });

    console.log(`[TemplateMapGenerator] Placed ${selectedSpots.length} wild crops`);
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
    // Guaranteed water patch per user request
    // if (Math.random() > 0.5) return; // Removed 50% chance

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
    const pondSize = 2 + Math.floor(Math.random() * 4); // 2 to 5 tiles per user request

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
    const minBuildingWidth = 11;
    const maxBuildingWidth = 15;
    const minBuildingHeight = 11;
    const maxBuildingHeight = 18;
    const minGapBetweenBuildings = 6;
    const maxGapBetweenBuildings = 15;
    const buildingBuffer = 2; // Top and bottom rows to avoid
    const grassGapFromSidewalk = 2; // Two tiles of grass between sidewalk and building

    // Calculate building zones (one tile away from sidewalk)
    const leftBuildingZoneEnd = leftSidewalkStartX - grassGapFromSidewalk - 1;
    const rightBuildingZoneStart = rightSidewalkEndX + grassGapFromSidewalk + 1;

    // Check for Army Tent spawn conditions
    const mapNumber = mapData.config.mapNumber || 1;
    let spawnArmyTent = false;
    if (mapNumber === 1 || mapNumber === 3) {
      spawnArmyTent = true;
    } else if (mapNumber > 3) {
      spawnArmyTent = Math.random() < 0.35;
    }

    // Choose building type and height
    const types = ['grocer', 'firestation', 'police', 'gas_station'];
    const type = types[Math.floor(Math.random() * types.length)];
    const specialBuildingHeight = type === 'firestation' ? 17 : 12;

    // Calculate special building location
    const useLeftSide = Math.random() < 0.5;
    const specialBuildingMinY = buildingBuffer + 10;
    const specialBuildingMaxY = height - buildingBuffer - specialBuildingHeight - 10;
    const specialBuildingY = specialBuildingMinY + Math.floor(Math.random() * (specialBuildingMaxY - specialBuildingMinY));
    
    // Place special building
    this.placeSpecialBuilding(layout, useLeftSide, specialBuildingY, type, leftSidewalkStartX, rightSidewalkEndX, mapData);

    // Place Army Tent if triggered
    let armyTentSideLeft = false;
    let armyTentY = -1;
    if (spawnArmyTent) {
      // Use the opposite side of the special building for better space utilization
      armyTentSideLeft = !useLeftSide;
      const tentHeightTotal = 6;
      // Find a Y position away from the special building Y range
      if (specialBuildingY > height / 2) {
        // Special building is in the bottom half, place tent in top half
        armyTentY = buildingBuffer + 2;
      } else {
        // Special building is in the top half, place tent in bottom half
        armyTentY = height - buildingBuffer - tentHeightTotal - 2;
      }
      this.placeArmyTent(layout, armyTentSideLeft, armyTentY, leftSidewalkStartX, rightSidewalkEndX, mapData);
    }

    // Place buildings on left side
    const leftSpecialY = useLeftSide ? specialBuildingY : (spawnArmyTent && armyTentSideLeft ? armyTentY : -1);
    const leftSpecialHeight = useLeftSide ? specialBuildingHeight : (spawnArmyTent && armyTentSideLeft ? 6 : 0);

    if (leftSpecialY === -1) {
      this.placeBuildingsInZone(layout, 1, leftBuildingZoneEnd, buildingBuffer, height - buildingBuffer,
        minBuildingWidth, maxBuildingWidth, minBuildingHeight, maxBuildingHeight,
        minGapBetweenBuildings, maxGapBetweenBuildings, mapData);
    } else {
      this.placeBuildingsInZone(layout, 1, leftBuildingZoneEnd, buildingBuffer, leftSpecialY - 2,
        minBuildingWidth, maxBuildingWidth, minBuildingHeight, maxBuildingHeight,
        minGapBetweenBuildings, maxGapBetweenBuildings, mapData);
      this.placeBuildingsInZone(layout, 1, leftBuildingZoneEnd, leftSpecialY + leftSpecialHeight + 2, height - buildingBuffer,
        minBuildingWidth, maxBuildingWidth, minBuildingHeight, maxBuildingHeight,
        minGapBetweenBuildings, maxGapBetweenBuildings, mapData);
    }

    // Place buildings on right side
    const rightSpecialY = !useLeftSide ? specialBuildingY : (spawnArmyTent && !armyTentSideLeft ? armyTentY : -1);
    const rightSpecialHeight = !useLeftSide ? specialBuildingHeight : (spawnArmyTent && !armyTentSideLeft ? 6 : 0);

    if (rightSpecialY === -1) {
      this.placeBuildingsInZone(layout, rightBuildingZoneStart, width - 2, buildingBuffer, height - buildingBuffer,
        minBuildingWidth, maxBuildingWidth, minBuildingHeight, maxBuildingHeight,
        minGapBetweenBuildings, maxGapBetweenBuildings, mapData);
    } else {
      this.placeBuildingsInZone(layout, rightBuildingZoneStart, width - 2, buildingBuffer, rightSpecialY - 2,
        minBuildingWidth, maxBuildingWidth, minBuildingHeight, maxBuildingHeight,
        minGapBetweenBuildings, maxGapBetweenBuildings, mapData);
      this.placeBuildingsInZone(layout, rightBuildingZoneStart, width - 2, rightSpecialY + rightSpecialHeight + 2, height - buildingBuffer,
        minBuildingWidth, maxBuildingWidth, minBuildingHeight, maxBuildingHeight,
        minGapBetweenBuildings, maxGapBetweenBuildings, mapData);
    }
  }

  /**
   * Place a special building with unique rules
   */
  placeSpecialBuilding(layout, isLeft, y, type, leftSidewalkX, rightSidewalkX, mapData) {
    const width = type === 'firestation' ? 10 : 9;
    const height = type === 'firestation' ? 17 : 12;
    const gapFromSidewalk = type === 'gas_station' ? 3 : 2;
    
    let startX;
    if (isLeft) {
      startX = leftSidewalkX - gapFromSidewalk - width;
    } else {
      // FIX: Add 1 to offset right side calculation for correct gap count
      startX = rightSidewalkX + gapFromSidewalk + 1;
    }

    const entranceY = type === 'firestation' ? y + 14 : y + Math.floor(height / 2);
    const entranceX = isLeft ? startX + width - 1 : startX;

    // Replace front tiles with road
    const roadX = isLeft ? leftSidewalkX - 1 : rightSidewalkX + 1;
    const roadGap = isLeft ? leftSidewalkX - 2 : rightSidewalkX + 2;
    for (let currentY = y; currentY < y + height; currentY++) {
        if (layout[currentY]) {
            layout[currentY][roadX] = 'road';
            layout[currentY][roadGap] = 'road';
        }
    }

    // Build the structure
    for (let curY = y; curY < y + height; curY++) {
      for (let curX = startX; curX < startX + width; curX++) {
        if (layout[curY] && layout[curY][curX]) {
          const isPerimeter = (curY === y || curY === y + height - 1 || curX === startX || curX === startX + width - 1);
          const isCorner = (curY === y || curY === y + height - 1) && (curX === startX || curX === startX + width - 1);
          
          // Internal separation wall for fire station
          const isInternalWall = type === 'firestation' && curY === y + 11 && curX > startX && curX < startX + width - 1;

          if (isPerimeter || isInternalWall) {
            let canHaveWindow = !isCorner && !isInternalWall;
            
            // Rule 1: Police stations and fire stations have no windows
            if (type === 'police' || type === 'firestation') {
              canHaveWindow = false;
            }
            
            // Rule 2: Grocer and Gas Station only have windows on the street-facing side
            if (type === 'grocer' || type === 'gas_station') {
              if (curX !== entranceX) {
                canHaveWindow = false;
              }
            }
            
            // Rule 3: No window on door or firestation opening
            if (curX === entranceX) {
              if (type === 'firestation') {
                // Apparatus opening y+4 to y+7 and support door y+14
                if ((curY >= y + 4 && curY < y + 8) || curY === y + 14) {
                  canHaveWindow = false;
                }
              } else if (curY === entranceY) {
                // Normal door
                canHaveWindow = false;
              }
            }

            if (canHaveWindow && Math.random() < 0.2) {
              layout[curY][curX] = 'window';
              if (mapData && mapData.metadata) {
                if (!mapData.metadata.windows) mapData.metadata.windows = [];
                mapData.metadata.windows.push({
                  x: curX,
                  y: curY,
                  isLocked: Math.random() < 0.5,
                  isOpen: false
                });
              }
            } else {
              layout[curY][curX] = 'building';
            }
          } else {
            layout[curY][curX] = 'floor';
          }
        }
      }
    }

    // Standardized metadata registration
    this._registerBuilding(mapData, type, startX, y, width, height);

    // Entrance and Icons
    if (type === 'firestation') {
        // Apparatus opening (8x10 room)
        for (let fy = y + 4; fy < y + 8; fy++) {
            layout[fy][entranceX] = 'floor';
            
            // Add opening to metadata to prevent subdivision overlap
            if (mapData && mapData.metadata && mapData.metadata.doors) {
                mapData.metadata.doors.push({
                    x: entranceX,
                    y: fy,
                    isOpening: true,
                    isOpen: true
                });
            }
        }

        // Support room door (8x4 room)
        const supportDoorY = y + 14;
        layout[supportDoorY][entranceX] = 'floor';
        if (!mapData.metadata.doors) mapData.metadata.doors = [];
        mapData.metadata.doors.push({
            x: entranceX,
            y: supportDoorY,
            isLocked: Math.random() < 0.2,
            isOpen: false
        });

        // Internal door between rooms
        const internalDoorX = startX + 5;
        const internalDoorY = y + 11;
        layout[internalDoorY][internalDoorX] = 'floor';
        mapData.metadata.doors.push({
            x: internalDoorX,
            y: internalDoorY,
            isLocked: false,
            isOpen: false
        });
    } else {
        // Normal door
        layout[entranceY][entranceX] = 'floor';
        if (!mapData.metadata.doors) mapData.metadata.doors = [];
        mapData.metadata.doors.push({
            x: entranceX,
            y: entranceY,
            isLocked: Math.random() < 0.1,
            isOpen: false
        });
    }

    // Place Icons
    if (!mapData.metadata.placeIcons) mapData.metadata.placeIcons = [];
    
    if (type === 'gas_station') {
        const fuelPumpX = isLeft ? startX + width + 1 : startX - 2;
        const fuelPumpY = entranceY;
        
        // Main fuel pump landmark (Primary indicator)
        mapData.metadata.placeIcons.push({
            subtype: 'fuelpump',
            x: fuelPumpX,
            y: fuelPumpY
        });
    } else if (type === 'grocer' || type === 'police' || type === 'firestation') {
        // Sign icon above door (Mapping consistent with ImageLoader assets)
        mapData.metadata.placeIcons.push({
            subtype: type === 'grocer' ? 'grocer' : (type === 'police' ? 'police' : 'firestation'),
            x: entranceX,
            y: type === 'firestation' ? y + 3 : entranceY - 1
        });
    }
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

      // Standardized metadata registration for residential buildings
      this._registerBuilding(mapData, 'residential', buildingStartX, currentY, buildingWidth, buildingHeight);

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

        // Remove any window metadata at this entrance location
        if (mapData && mapData.metadata && mapData.metadata.windows) {
          mapData.metadata.windows = mapData.metadata.windows.filter(w => w.x !== entranceX || w.y !== entranceY);
        }

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
        } else {
          // If no door added, record metadata for subdivision logic to know about opening
          if (mapData && mapData.metadata && mapData.metadata.doors) {
            mapData.metadata.doors.push({
              x: entranceX,
              y: entranceY,
              isOpening: true,
              isOpen: true
            });
          }
        }
      }

      // Add back door (40% chance)
      if (Math.random() < 0.4) {
        const backDoorY = currentY + 1 + Math.floor(Math.random() * (buildingHeight - 2));
        let backDoorX;
        if (zoneStartX < 12) {
          // Left side - back door on left wall
          backDoorX = buildingStartX;
        } else {
          // Right side - back door on right wall
          backDoorX = buildingStartX + buildingWidth - 1;
        }

        if (backDoorX >= 0 && backDoorX < layout[0].length &&
            backDoorY >= 0 && backDoorY < layout.length) {
          layout[backDoorY][backDoorX] = 'floor';

          // Remove any window metadata at this back door location
          if (mapData && mapData.metadata && mapData.metadata.windows) {
            mapData.metadata.windows = mapData.metadata.windows.filter(w => w.x !== backDoorX || w.y !== backDoorY);
          }

          if (mapData && mapData.metadata && mapData.metadata.doors) {
            mapData.metadata.doors.push({
              x: backDoorX,
              y: backDoorY,
              isLocked: Math.random() < 0.3, // Slightly higher chance for locked back door
              isOpen: false
            });
          }
        }
      }

      // Subdivide into rooms (2-3 rooms)
      this.subdivideBuilding(layout, buildingStartX, currentY, buildingWidth, buildingHeight, mapData);

      // Place windows (after subdivision to avoid junctions)
      this.placeWindows(layout, buildingStartX, currentY, buildingWidth, buildingHeight, mapData);

      // Move to next building position with random gap
      const gap = minGap + Math.floor(Math.random() * (maxGap - minGap + 1));
      currentY += buildingHeight + gap;
    }
  }

  /**
   * Refined window placement: avoids junctions, no side-by-side, max 2 per wall
   */
  placeWindows(layout, x, y, w, h, mapData) {
    const walls = [
      { name: 'top', tiles: [], dx: 0, dy: 1 },
      { name: 'bottom', tiles: [], dx: 0, dy: -1 },
      { name: 'left', tiles: [], dx: 1, dy: 0 },
      { name: 'right', tiles: [], dx: -1, dy: 0 }
    ];

    // Collect candidate wall tiles (excluding corners)
    for (let cx = x + 1; cx < x + w - 1; cx++) {
      walls[0].tiles.push({ x: cx, y: y });
      walls[1].tiles.push({ x: cx, y: y + h - 1 });
    }
    for (let cy = y + 1; cy < y + h - 1; cy++) {
      walls[2].tiles.push({ x: x, y: cy });
      walls[3].tiles.push({ x: x + w - 1, y: cy });
    }

    walls.forEach(wall => {
      // Filter candidates based on constraints
      let candidates = wall.tiles.filter(t => {
        // 1. Must be a building tile (not already a door)
        if (layout[t.y][t.x] !== 'building') return false;
        
        const hasDoor = mapData.metadata?.doors?.some(d => d.x === t.x && d.y === t.y);
        if (hasDoor) return false;

        // 2. Must not be an interior wall junction
        // Check 1 tile "inward" based on wall direction
        const inwardX = t.x + wall.dx;
        const inwardY = t.y + wall.dy;
        if (layout[inwardY] && layout[inwardY][inwardX] === 'building') return false;

        return true;
      });

      if (candidates.length === 0) return;

      // Determine number of windows (0 to 2)
      // 20% none, 50% one, 30% two (if possible)
      let numRequested = Math.random() < 0.2 ? 0 : (Math.random() < 0.7 ? 1 : 2);
      const selected = [];

      for (let i = 0; i < numRequested; i++) {
        if (candidates.length === 0) break;

        const idx = Math.floor(Math.random() * candidates.length);
        const pick = candidates[idx];
        selected.push(pick);

        // Remove the picked tile and its direct neighbors to prevent side-by-side windows
        candidates = candidates.filter(c => {
          const dist = Math.abs(c.x - pick.x) + Math.abs(c.y - pick.y);
          return dist > 1;
        });
      }

      // Finalize the selected windows
      selected.forEach(t => {
        layout[t.y][t.x] = 'window';
        if (mapData && mapData.metadata) {
          if (!mapData.metadata.windows) mapData.metadata.windows = [];
          mapData.metadata.windows.push({
            x: t.x,
            y: t.y,
            isLocked: Math.random() < 0.7,
            isOpen: false
          });
        }
      });
    });
  }

  /**
   * Place an Army Tent (8x4 structure, 10x6 with buffer)
   */
  placeArmyTent(layout, isLeft, y, leftSidewalkX, rightSidewalkX, mapData) {
    const width = 12;
    const height = 8;
    const tentWidth = 10;
    const tentHeight = 6;
    
    let startX;
    if (isLeft) {
      startX = leftSidewalkX - 4 - tentWidth; // 4 tiles back from sidewalk (3 gap + 1 for wall)
    } else {
      startX = rightSidewalkX + 3; // 3 tiles forward from sidewalk
    }

    // Build the structure (8x4 olive walls)
    for (let curY = y + 1; curY < y + 1 + tentHeight; curY++) {
      for (let curX = startX + 1; curX < startX + 1 + tentWidth; curX++) {
        if (layout[curY] && layout[curY][curX]) {
          const isPerimeter = (curY === y + 1 || curY === y + tentHeight || curX === startX + 1 || curX === startX + tentWidth);
          
          if (isPerimeter) {
            layout[curY][curX] = 'tent_wall';
          } else {
            layout[curY][curX] = 'floor';
          }
        }
      }
    }

    // Entrance: 2-tile wide street-facing opening
    const entranceX = isLeft ? startX + tentWidth : startX + 1;
    const entranceYStart = y + Math.floor(tentHeight / 2);
    for (let ey = entranceYStart; ey < entranceYStart + 2; ey++) {
      if (layout[ey] && layout[ey][entranceX]) {
        layout[ey][entranceX] = 'floor';
        
        // Add opening to metadata for subdivision logic awareness
        if (mapData && mapData.metadata && mapData.metadata.doors) {
          mapData.metadata.doors.push({
            x: entranceX,
            y: ey,
            isOpening: true,
            isOpen: true
          });
        }
      }
    }

    // Standardized metadata registration
    this._registerBuilding(mapData, 'army_tent', startX + 1, y + 1, tentWidth, tentHeight);

    console.log(`[TemplateMapGenerator] Placed Army Tent at (${startX + 1}, ${y + 1})`);
  }

  /**
   * Subdivide a building into 2-3 rooms with min size 4x4
   */
  subdivideBuilding(layout, x, y, w, h, mapData) {
    const minInteriorSize = 4;
    
    // Building interior: (x+1, y+1) to (x+w-2, y+h-2)
    // Interior dimensions: (w-2) x (h-2)
    
    const rooms = [{
        x: x + 1,
        y: y + 1,
        w: w - 2,
        h: h - 2
    }];

    // Determine target number of rooms (2 or 3)
    const targetRooms = Math.random() < 0.4 ? 3 : 2;
    
    // Get exterior doors for this building to avoid conflicts
    const buildingDoors = (mapData && mapData.metadata && mapData.metadata.doors) ? 
      mapData.metadata.doors.filter(d => 
        ((d.x === x || d.x === x + w - 1) && d.y >= y && d.y < y + h) ||
        ((d.y === y || d.y === y + h - 1) && d.x >= x && d.x < x + w)
      ) : [];

    for (let i = 0; i < targetRooms - 1; i++) {
        // Pick largest room to split
        rooms.sort((a, b) => (b.w * b.h) - (a.w * a.h));
        const room = rooms[0];
        
        // Find split possibilities
        const possibleX = [];
        if (room.w >= (minInteriorSize * 2) + 1) {
            for (let sx = room.x + minInteriorSize; sx <= room.x + room.w - minInteriorSize - 1; sx++) {
                // IMPORTANT: Avoid all doors (perimeter and interior) to prevent blocking
                // Check within +- 1 tile buffer to allow stepping into the building before hitting internal wall
                const conflictsWithDoor = mapData.metadata.doors.some(d => Math.abs(d.x - sx) <= 1);
                if (!conflictsWithDoor) possibleX.push(sx);
            }
        }

        const possibleY = [];
        if (room.h >= (minInteriorSize * 2) + 1) {
            for (let sy = room.y + minInteriorSize; sy <= room.y + room.h - minInteriorSize - 1; sy++) {
                // IMPORTANT: Avoid all doors (perimeter and interior) to prevent blocking
                // Check within +- 1 tile buffer
                const conflictsWithDoor = mapData.metadata.doors.some(d => Math.abs(d.y - sy) <= 1);
                if (!conflictsWithDoor) possibleY.push(sy);
            }
        }

        if (possibleX.length === 0 && possibleY.length === 0) break;
        
        // Decide split direction
        let splitVertical = false;
        if (possibleX.length > 0 && possibleY.length > 0) {
            // Prefer splitting along the longer dimension
            splitVertical = room.w > room.h ? true : (room.h > room.w ? false : Math.random() < 0.5);
        } else {
            splitVertical = possibleX.length > 0;
        }
        
        if (splitVertical) {
            const splitX = possibleX[Math.floor(Math.random() * possibleX.length)];
            // Place wall
            for (let curY = room.y; curY < room.y + room.h; curY++) {
                layout[curY][splitX] = 'building';
            }
            // Add interior door - avoid corners and existing doors
            const potentialDoorYs = [];
            for (let dy = room.y + 1; dy <= room.y + room.h - 2; dy++) {
                const isAdjacentToDoor = mapData.metadata.doors.some(d => 
                    Math.abs(d.x - splitX) + Math.abs(d.y - dy) <= 1
                );
                if (!isAdjacentToDoor) potentialDoorYs.push(dy);
            }
            
            const doorY = potentialDoorYs.length > 0 ? 
                potentialDoorYs[Math.floor(Math.random() * potentialDoorYs.length)] : 
                room.y + 1 + Math.floor(Math.random() * Math.max(1, room.h - 2));

            layout[doorY][splitX] = 'floor';
            if (mapData && mapData.metadata && mapData.metadata.doors) {
                mapData.metadata.doors.push({
                    x: splitX,
                    y: doorY,
                    isLocked: false,
                    isOpen: false
                });
            }
            // Update rooms list
            const oldWidth = room.w;
            rooms.push({
                x: splitX + 1,
                y: room.y,
                w: oldWidth - (splitX - room.x) - 1,
                h: room.h
            });
            room.w = splitX - room.x;
        } else {
            const splitY = possibleY[Math.floor(Math.random() * possibleY.length)];
            // Place wall
            for (let curX = room.x; curX < room.x + room.w; curX++) {
                layout[splitY][curX] = 'building';
            }
            // Add interior door - avoid corners and existing doors
            const potentialDoorXs = [];
            for (let dx = room.x + 1; dx <= room.x + room.w - 2; dx++) {
                const isAdjacentToDoor = mapData.metadata.doors.some(d => 
                    Math.abs(d.x - dx) + Math.abs(d.y - splitY) <= 1
                );
                if (!isAdjacentToDoor) potentialDoorXs.push(dx);
            }
            
            const doorX = potentialDoorXs.length > 0 ? 
                potentialDoorXs[Math.floor(Math.random() * potentialDoorXs.length)] : 
                room.x + 1 + Math.floor(Math.random() * Math.max(1, room.w - 2));

            layout[splitY][doorX] = 'floor';
            if (mapData && mapData.metadata && mapData.metadata.doors) {
                mapData.metadata.doors.push({
                    x: doorX,
                    y: splitY,
                    isLocked: false,
                    isOpen: false
                });
            }
            // Update rooms list
            const oldHeight = room.h;
            rooms.push({
                x: room.x,
                y: splitY + 1,
                w: room.w,
                h: oldHeight - (splitY - room.y) - 1
            });
            room.h = splitY - room.y;
        }
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
   * Standardized helper to register building metadata for loot and spawning systems
   */
  _registerBuilding(mapData, type, x, y, width, height) {
    if (!mapData.metadata.buildings) {
      mapData.metadata.buildings = [];
    }
    
    mapData.metadata.buildings.push({
      type,
      x,
      y,
      width,
      height
    });
    
    // Provide backward compatibility for specialBuildings key during map transition phase
    if (['police', 'firestation', 'grocer', 'gas_station', 'army_tent'].includes(type)) {
      if (!mapData.metadata.specialBuildings) {
        mapData.metadata.specialBuildings = [];
      }
      mapData.metadata.specialBuildings.push(mapData.metadata.buildings[mapData.metadata.buildings.length - 1]);
    }

    console.log(`[TemplateMapGenerator] Registered ${type} building at (${x}, ${y}) size ${width}x${height}`);
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
  getStartPosition(templateName = 'road') {
    const template = this.getTemplate(templateName);
    const width = template ? template.size.width : 45;
    const centerX = Math.floor(width / 2);

    const templateStartPositions = {
      'road': { x: centerX, y: template ? template.size.height - 2 : 123 },
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

          // Transfer inventory items (Wild Crops, etc.)
          if (tileData.inventoryItems && tileData.inventoryItems.length > 0) {
            gameMap.setItemsOnTile(x, y, tileData.inventoryItems);
          }
        }
      }

      console.log(`[TemplateMapGenerator] Applied template map data to GameMap (${gameMap.width}x${gameMap.height})`);

      // Instantiate door entities from metadata
      if (templateMapData.metadata && templateMapData.metadata.doors) {
        const { Door } = await import('../entities/Door.js');
        templateMapData.metadata.doors.forEach(doorData => {
          const { x, y } = doorData;
          
          // PHASE 1: DOORWAY CLEARANCE ("PUNCH THROUGH") 
          const tileLeft = x > 0 ? templateMapData.tiles[y][x - 1]?.terrain : null;
          const tileRight = x < templateMapData.width - 1 ? templateMapData.tiles[y][x + 1]?.terrain : null;
          const tileUp = y > 0 ? templateMapData.tiles[y - 1][x]?.terrain : null;
          const tileDown = y < templateMapData.height - 1 ? templateMapData.tiles[y + 1][x]?.terrain : null;
          const wallTypes = ['building', 'wall', 'window', 'fence'];

          const hasWallLeft = wallTypes.includes(tileLeft);
          const hasWallRight = wallTypes.includes(tileRight);
          const hasWallUp = wallTypes.includes(tileUp);
          const hasWallDown = wallTypes.includes(tileDown);

          // If the door is in a horizontal-aligned wall structure (or corner)
          if (hasWallLeft || hasWallRight) {
            // Door is in a horizontal wall segment: ensure North and South tiles are floor
            // FIX: Only clear if the tile is NOT part of a vertical wall structure (Corner Protection)
            if (y > 0 && !hasWallUp && (templateMapData.tiles[y-1][x]?.terrain === 'building' || templateMapData.tiles[y-1][x]?.terrain === 'wall')) {
                gameMap.setTerrain(x, y - 1, 'floor');
            }
            if (y < templateMapData.height - 1 && !hasWallDown && (templateMapData.tiles[y+1][x]?.terrain === 'building' || templateMapData.tiles[y+1][x]?.terrain === 'wall')) {
                gameMap.setTerrain(x, y + 1, 'floor');
            }
          }
          
          // If the door is in a vertical-aligned wall structure (or corner)
          if (hasWallUp || hasWallDown) {
            // Door is in a vertical wall segment: ensure East and West tiles are floor
            // FIX: Only clear if the tile is NOT part of a horizontal wall structure (Corner Protection)
            if (x > 0 && !hasWallLeft && (templateMapData.tiles[y][x-1]?.terrain === 'building' || templateMapData.tiles[y][x-1]?.terrain === 'wall')) {
                gameMap.setTerrain(x - 1, y, 'floor');
            }
            if (x < templateMapData.width - 1 && !hasWallRight && (templateMapData.tiles[y][x+1]?.terrain === 'building' || templateMapData.tiles[y][x+1]?.terrain === 'wall')) {
                gameMap.setTerrain(x + 1, y, 'floor');
            }
          }
          
          // Phase 2: Create Door entity
          if (!doorData.isOpening) {
            const door = new Door(
              doorData.id || `door-${doorData.x}-${doorData.y}`,
              doorData.x,
              doorData.y,
              doorData.isLocked,
              doorData.isOpen
            );
            gameMap.addEntity(door, doorData.x, doorData.y);
          }
          
          // Ensure the door site itself is definitely walkable (floor)
          gameMap.setTerrain(doorData.x, doorData.y, 'floor');
        });
        console.log(`[TemplateMapGenerator] Added ${templateMapData.metadata.doors.length} doors with doorway clearance logic`);
      }

      // Instantiate window entities from metadata
      if (templateMapData.metadata && templateMapData.metadata.windows) {
        const { Window } = await import('../entities/Window.js');
        templateMapData.metadata.windows.forEach(windowData => {
          const window = new Window(
            windowData.id || `window-${windowData.x}-${windowData.y}`,
            windowData.x,
            windowData.y,
            windowData.isLocked,
            windowData.isOpen,
            windowData.isBroken
          );
          gameMap.addEntity(window, windowData.x, windowData.y);
        });
        console.log(`[TemplateMapGenerator] Added ${templateMapData.metadata.windows.length} windows to map`);
      }

      // Instantiate place icons from metadata
      if (templateMapData.metadata && templateMapData.metadata.placeIcons) {
        const { PlaceIcon } = await import('../entities/PlaceIcon.js');
        templateMapData.metadata.placeIcons.forEach(iconData => {
          const icon = new PlaceIcon(
            iconData.id || `icon-${iconData.subtype}-${iconData.x}-${iconData.y}`,
            iconData.x,
            iconData.y,
            iconData.subtype
          );
          if (iconData.subtype === 'fuelpump') {
            icon.blocksMovement = true;
          }
          gameMap.addEntity(icon, iconData.x, iconData.y);
        });
        console.log(`[TemplateMapGenerator] Added ${templateMapData.metadata.placeIcons.length} icons to map`);
      }

      // Store standardized building metadata on gameMap
      if (templateMapData.metadata && templateMapData.metadata.buildings) {
        gameMap.buildings = templateMapData.metadata.buildings;
      }
      
      // Legacy support for specialBuildings (if needed by other systems during phased migration)
      if (templateMapData.metadata && templateMapData.metadata.specialBuildings) {
        gameMap.specialBuildings = templateMapData.metadata.specialBuildings;
      }

      return gameMap;
    } catch (error) {
      console.error('[TemplateMapGenerator] Failed to apply template to GameMap:', error);
      throw error;
    }
  }
}