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

    // Winding Road template - 75x125 map for S-curve suburban layout
    this.templates.set('winding_road', {
      name: 'Winding Road',
      size: { width: 85, height: 125 },
      layout: [], // Procedurally generated
      parameters: {
        randomWalls: { min: 0, max: 2 },
        extraFloors: { min: 0, max: 3 },
        roadThickness: 5,
        sidewalkThickness: 1
      }
    });

    // Mirrored Winding Road template
    this.templates.set('mirrored_winding_road', {
      name: 'Mirrored Winding Road',
      size: { width: 85, height: 125 },
      layout: [], // Procedurally generated
      parameters: {
        randomWalls: { min: 0, max: 2 },
        extraFloors: { min: 0, max: 3 },
        roadThickness: 5,
        sidewalkThickness: 1
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
    if (stripConfig || tileEquations.length > 0 || templateName === 'road' || templateName === 'winding_road' || templateName === 'mirrored_winding_road') {
      // Generate procedurally based on equations, or force procedural for road templates
      if (templateName === 'road' && !stripConfig) {
        // Force consistent road generation with road, sidewalks, and fences
        const roadThickness = config.roadThickness || 5;
        const sidewalkThickness = config.sidewalkThickness || 1;

        // Generate the road template with multiple strips
        baseLayout = this.generateRoadLayout(template.size, roadThickness, sidewalkThickness, mapData);
      } else if (templateName === 'winding_road') {
        const roadThickness = config.roadThickness || 5;
        const sidewalkThickness = config.sidewalkThickness || 1;
        baseLayout = this.generateWindingRoadLayout(template.size, roadThickness, sidewalkThickness, mapData);
      } else if (templateName === 'mirrored_winding_road') {
        const roadThickness = config.roadThickness || 5;
        const sidewalkThickness = config.sidewalkThickness || 1;
        baseLayout = this.generateMirroredWindingRoadLayout(template.size, roadThickness, sidewalkThickness, mapData);
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

    // Set transition tiles at road exits
    const centerX = Math.floor(mapData.width / 2);
    let northExitX = centerX;
    let southExitX = centerX;
    
    if (templateName === 'winding_road') {
        northExitX = mapData.width - 23; // roadXMax
        southExitX = 22;               // roadXMin
    } else if (templateName === 'mirrored_winding_road') {
        northExitX = 22;               // roadXMin (Mirrored exit)
        southExitX = mapData.width - 23; // roadXMax (Mirrored start)
    }

    // Add transition tiles (using setTileData to update the tiles array)
    this.setTileData(mapData, northExitX, 0, 'transition');
    this.setTileData(mapData, southExitX, mapData.height - 1, 'transition');

    // Add spawn zones metadata
    mapData.metadata = {
      ...mapData.metadata,
      spawnZones: {
        roadStart: [{ x: southExitX, y: mapData.height - 2 }], 
        transitionPoints: {
          north: { x: northExitX, y: 0 }, 
          south: { x: southExitX, y: mapData.height - 1 } 
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

    const mapNumber = mapData.config?.mapNumber || 1;
    // If map level > 2, 50% chance that NO wild crops appear
    if (mapNumber > 2 && Math.random() > 0.5) {
      console.log(`[TemplateMapGenerator] Map ${mapNumber} skipped wild crop generation (50% chance)`);
      return;
    }

    // Pick exactly 1 random spot (Max 1 per map)
    const count = 1;
    const selectedSpots = [];
    if (validSpots.length > 0) {
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
        isHarvestable: true
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

    // PHASE 25: Removed static water tiles in favor of dynamic Water Puddles
    // this.addPonds(layout);

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
    if (mapNumber === 3) {
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
    
    // Define building object with frontage
    const bWidth = 14;
    const frontage = useLeftSide ? 'east' : 'west';
    const bX = useLeftSide ? (leftSidewalkStartX - grassGapFromSidewalk - bWidth) : (rightSidewalkEndX + grassGapFromSidewalk);

    // Place special building
    this.placeSpecialBuilding(layout, {
        x: bX,
        y: specialBuildingY,
        width: bWidth,
        height: specialBuildingHeight,
        frontage: frontage
    }, type, mapData);

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
  placeSpecialBuilding(layout, b, type, mapData) {
    const { x, y, width, height, frontage } = b;
    const isHorizontal = (frontage === 'north' || frontage === 'south');
    
    // 1. Build the structure
    for (let ty = y; ty < y + height; ty++) {
      for (let tx = x; tx < x + width; tx++) {
        const isPerimeter = (ty === y || ty === y + height - 1 || tx === x || tx === x + width - 1);
        const isCorner = (ty === y || ty === y + height - 1) && (tx === x || tx === x + width - 1);
        
        // Firestation internal wall - Shifted down slightly to give garage more room
        const wallOffset = isHorizontal ? Math.floor(width * 0.6) : Math.floor(height * 0.6);
        const isInternalWall = type === 'firestation' && (isHorizontal ? tx === x + wallOffset : ty === y + wallOffset);

        if (isPerimeter || isInternalWall) {
          layout[ty][tx] = 'building';
        } else {
          layout[ty][tx] = 'floor';
        }
      }
    }

    // 2. Entrance Logic
    let entranceX, entranceY;
    if (frontage === 'east') { entranceX = x + width - 1; entranceY = y + Math.floor(height / 2); }
    else if (frontage === 'west') { entranceX = x; entranceY = y + Math.floor(height / 2); }
    else if (frontage === 'south') { entranceX = x + Math.floor(width / 2); entranceY = y + height - 1; }
    else { entranceX = x + Math.floor(width / 2); entranceY = y; }

    if (type === 'firestation') {
        const wallOffset = isHorizontal ? Math.floor(width * 0.6) : Math.floor(height * 0.6);
        
        // Apparatus Opening (4 tiles wide) - Centered in the garage section
        const appSize = 4;
        const appOffset = Math.floor(wallOffset / 2) - 2;
        
        for (let i = 0; i < appSize; i++) {
            let ax = entranceX, ay = entranceY;
            if (isHorizontal) ax = x + appOffset + i; else ay = y + appOffset + i;
            layout[ay][ax] = 'floor';
            if (!mapData.metadata.doors) mapData.metadata.doors = [];
            mapData.metadata.doors.push({ x: ax, y: ay, isOpening: true, isOpen: true });
        }

        // Support Room Door
        let sx = entranceX, sy = entranceY;
        if (isHorizontal) sx = x + width - 3; else sy = y + height - 3;
        layout[sy][sx] = 'floor';
        mapData.metadata.doors.push({ x: sx, y: sy, isLocked: Math.random() < 0.2, isOpen: false });

        // Internal Connecting Door - Placed on the internal wall
        let ix, iy;
        if (isHorizontal) {
            ix = x + wallOffset;
            iy = y + Math.floor(height / 2);
        } else {
            ix = x + Math.floor(width / 2);
            iy = y + wallOffset;
        }
        layout[iy][ix] = 'floor';
        mapData.metadata.doors.push({ x: ix, y: iy, isLocked: false, isOpen: false });
        
        entranceX = sx; entranceY = sy; 
    } else {
        // Normal Single Door - Enforce floor tile
        layout[entranceY][entranceX] = 'floor';
        if (!mapData.metadata.doors) mapData.metadata.doors = [];
        mapData.metadata.doors.push({ x: entranceX, y: entranceY, isLocked: Math.random() < 0.1, isOpen: false });
    }

    // 3. Register Building
    this._registerBuilding(mapData, type, x, y, width, height, { frontage, entranceX, entranceY });

    // 4. Place Icons (Offset from door to stay on building wall)
    if (!mapData.metadata.placeIcons) mapData.metadata.placeIcons = [];
    if (type === 'gas_station') {
        let pumpX = entranceX, pumpY = entranceY;
        if (frontage === 'east') pumpX += 3; else if (frontage === 'west') pumpX -= 3;
        else if (frontage === 'south') pumpY += 3; else pumpY -= 3;
        mapData.metadata.placeIcons.push({ subtype: 'fuelpump', x: pumpX, y: pumpY });
    } else {
        let signX = entranceX, signY = entranceY;
        // Shift sign 1 tile away from door along the wall
        if (frontage === 'east' || frontage === 'west') signY--; 
        else if (frontage === 'north' || frontage === 'south') signX--;

        mapData.metadata.placeIcons.push({ 
            subtype: type, 
            x: signX, 
            y: (type === 'firestation' && !isHorizontal) ? y + 3 : signY 
        });
    }
  }

  /**
   * Place buildings in a specific zone with given constraints
   */
  placeBuildingsInZone(layout, zoneStartX, zoneEndX, zoneStartY, zoneEndY,
    minWidth, maxWidth, minHeight, maxHeight, minGap, maxGap, mapData, options = {}) {
    const zoneWidth = zoneEndX - zoneStartX + 1;
    const zoneHeight = zoneEndY - zoneStartY + 1;
    const frontage = options.frontage || (zoneStartX < layout[0].length / 2 ? 'east' : 'west');
    const direction = options.direction || 'vertical';

    if (direction === 'horizontal') {
      let currentX = zoneStartX;
      while (currentX < zoneEndX) {
        const buildingWidth = Math.min(zoneWidth - (currentX - zoneStartX), minWidth + Math.floor(Math.random() * (maxWidth - minWidth + 1)));
        const buildingHeight = Math.min(zoneHeight, minHeight + Math.floor(Math.random() * (maxHeight - minHeight + 1)));

        if (currentX + buildingWidth > zoneEndX + 1 || buildingWidth < minWidth || buildingHeight < minHeight) {
          currentX++;
          continue;
        }

        let buildingStartY;
        if (frontage === 'south') buildingStartY = Math.max(zoneStartY, zoneEndY - buildingHeight + 1);
        else buildingStartY = zoneStartY;

        // Collision Check (Buffer building-to-building, but allow adjacency to sidewalks)
        let canPlace = true;
        for (let y = buildingStartY - 1; y <= buildingStartY + buildingHeight; y++) {
          for (let x = currentX - 1; x <= currentX + buildingWidth; x++) {
            if (layout[y] && layout[y][x]) {
              const tile = layout[y][x];
              if (tile === 'building' || tile === 'road' || tile === 'fence') {
                canPlace = false;
                break;
              }
            }
          }
          if (!canPlace) break;
        }

        if (canPlace) {
          this._drawBuilding(layout, currentX, buildingStartY, buildingWidth, buildingHeight, frontage, mapData);
          currentX += buildingWidth + minGap + Math.floor(Math.random() * (maxGap - minGap + 1));
        } else {
          currentX++; 
        }
      }
    } else {
      // Vertical placement (Sliding logic with safety buffer)
      let currentY = zoneStartY;
      while (currentY < zoneEndY) {
        const buildingWidth = Math.min(zoneWidth, minWidth + Math.floor(Math.random() * (maxWidth - minWidth + 1)));
        const buildingHeight = Math.min(zoneHeight + 1, minHeight + Math.floor(Math.random() * (maxHeight - minHeight + 1)));

        if (currentY + buildingHeight > zoneEndY + 1 || buildingHeight < minHeight) {
          currentY++;
          continue;
        }

        let buildingStartX;
        if (frontage === 'east') buildingStartX = Math.max(zoneStartX, zoneEndX - buildingWidth + 1);
        else buildingStartX = zoneStartX;

        // Collision Check (Buffer building-to-building, but allow adjacency to sidewalks)
        let canPlace = true;
        for (let y = currentY - 1; y <= currentY + buildingHeight; y++) {
          for (let x = buildingStartX - 1; x <= buildingStartX + buildingWidth; x++) {
            if (layout[y] && layout[y][x]) {
              const tile = layout[y][x];
              // Only block if it hits another building or the road itself
              if (tile === 'building' || tile === 'road' || tile === 'fence') {
                canPlace = false;
                break;
              }
            }
          }
          if (!canPlace) break;
        }

        if (canPlace) {
          this._drawBuilding(layout, buildingStartX, currentY, buildingWidth, buildingHeight, frontage, mapData);
          currentY += buildingHeight + minGap + Math.floor(Math.random() * (maxGap - minGap + 1));
        } else {
          currentY++; 
        }
      }
    }
  }

  /**
   * Place buildings starting from a specific anchor point (sidewalk corner)
   * Ensures precise measurement and spacing (2-tile setback, 4-tile gap)
   */
  placeBuildingsFromAnchor(layout, anchorX, anchorY, growthDir, frontage, mapData, options = {}) {
    const {
      minW = 14, maxW = 22,
      minH = 14, maxH = 18,
      gap = 4,
      setback = 2,
      maxBuildings = 10
    } = options;

    let currentX = anchorX;
    let currentY = anchorY;
    let placedCount = 0;
    let attempts = 0;
    const maxAttempts = 500; // Increased to ensure we can nudge past wide roads/sidewalks

    while (placedCount < maxBuildings && attempts < maxAttempts) {
      attempts++;
      const bW = minW + Math.floor(Math.random() * (maxW - minW + 1));
      const bH = minH + Math.floor(Math.random() * (maxH - minH + 1));

      let bX, bY;

      // Calculate building position based on frontage and growth direction
      if (frontage === 'north') {
        bY = anchorY + setback + 1;
        bX = (growthDir === 'west') ? currentX - bW : currentX;
      } else if (frontage === 'south') {
        bY = anchorY - setback - bH;
        bX = (growthDir === 'west') ? currentX - bW : currentX;
      } else if (frontage === 'east') {
        bX = anchorX - setback - bW;
        bY = (growthDir === 'north') ? currentY - bH : currentY;
      } else if (frontage === 'west') {
        bX = anchorX + setback + 1;
        bY = (growthDir === 'north') ? currentY - bH : currentY;
      }

      // Bounds check - if we hit the edge, we stop this growth line
      if (bX < 2 || bX + bW >= layout[0].length - 2 || bY < 2 || bY + bH >= layout.length - 2) {
          // If we are strictly out of bounds, we nudge and try again, but if we are way off, we'll hit maxAttempts
          if (growthDir === 'west') currentX--;
          else if (growthDir === 'east') currentX++;
          else if (growthDir === 'north') currentY--;
          else if (growthDir === 'south') currentY++;
          continue;
      }
      
      // Collision Check
      let canPlace = true;
      for (let ty = bY - 1; ty <= bY + bH; ty++) {
        for (let tx = bX - 1; tx <= bX + bW; tx++) {
          if (layout[ty] && layout[ty][tx] && layout[ty][tx] !== 'grass') {
            canPlace = false;
            break;
          }
        }
        if (!canPlace) break;
      }

      if (canPlace) {
        this._drawBuilding(layout, bX, bY, bW, bH, frontage, mapData);
        placedCount++;
        attempts = 0; // Reset attempts after successful placement

        // Update growth position for next building (jump by building size + gap)
        if (growthDir === 'west') currentX -= (bW + gap);
        else if (growthDir === 'east') currentX += (bW + gap);
        else if (growthDir === 'north') currentY -= (bH + gap);
        else if (growthDir === 'south') currentY += (bH + gap);
      } else {
        // Nudge forward by 1 tile and try again (allows skipping fences or tight spots)
        if (growthDir === 'west') currentX--;
        else if (growthDir === 'east') currentX++;
        else if (growthDir === 'north') currentY--;
        else if (growthDir === 'south') currentY++;
      }
    }

  }

  /**
   * Helper to draw the actual building tiles and register metadata
   */
  _drawBuilding(layout, x, y, w, h, frontage, mapData) {
    for (let ty = y; ty < y + h; ty++) {
      for (let tx = x; tx < x + w; tx++) {
        const isPerimeter = (ty === y || ty === y + h - 1 || tx === x || tx === x + w - 1);
        layout[ty][tx] = isPerimeter ? 'building' : 'floor';
      }
    }

    // Entrance logic
    let entranceX, entranceY;
    if (frontage === 'east') { entranceX = x + w - 1; entranceY = y + 2 + Math.floor(Math.random() * (h - 4)); }
    else if (frontage === 'west') { entranceX = x; entranceY = y + 2 + Math.floor(Math.random() * (h - 4)); }
    else if (frontage === 'south') { entranceX = x + 2 + Math.floor(Math.random() * (w - 4)); entranceY = y + h - 1; }
    else { entranceX = x + 2 + Math.floor(Math.random() * (w - 4)); entranceY = y; }

    layout[entranceY][entranceX] = 'floor';
    if (mapData && mapData.metadata) {
      if (!mapData.metadata.doors) mapData.metadata.doors = [];
      mapData.metadata.doors.push({ x: entranceX, y: entranceY, isLocked: Math.random() < 0.2, isOpen: false });
    }

    this._registerBuilding(mapData, 'residential', x, y, w, h, { entranceX, entranceY, frontage });
    this.subdivideBuilding(layout, x, y, w, h, mapData);
    this.placeWindows(layout, x, y, w, h, mapData);
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
                const conflictsWithDoor = (mapData.metadata.doors || []).some(d => Math.abs(d.x - sx) <= 1);
                if (!conflictsWithDoor) possibleX.push(sx);
            }
        }

        const possibleY = [];
        if (room.h >= (minInteriorSize * 2) + 1) {
            for (let sy = room.y + minInteriorSize; sy <= room.y + room.h - minInteriorSize - 1; sy++) {
                // IMPORTANT: Avoid all doors (perimeter and interior) to prevent blocking
                // Check within +- 1 tile buffer
                const conflictsWithDoor = (mapData.metadata.doors || []).some(d => Math.abs(d.y - sy) <= 1);
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
                const isAdjacentToDoor = (mapData.metadata.doors || []).some(d => 
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
                const isAdjacentToDoor = (mapData.metadata.doors || []).some(d => 
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
  _registerBuilding(mapData, type, x, y, width, height, extra = {}) {
    if (!mapData.metadata.buildings) {
      mapData.metadata.buildings = [];
    }
    
    mapData.metadata.buildings.push({
      type,
      x,
      y,
      width,
      height,
      ...extra
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
      'winding_road': { x: 22, y: template ? template.size.height - 2 : 123 },
      'mirrored_winding_road': { x: width - 23, y: template ? template.size.height - 2 : 123 },
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
      if (templateMapData.metadata) {
        gameMap.metadata = templateMapData.metadata;
        if (templateMapData.metadata.buildings) {
          gameMap.buildings = templateMapData.metadata.buildings;
        }
        if (templateMapData.metadata.specialBuildings) {
          gameMap.specialBuildings = templateMapData.metadata.specialBuildings;
        }
      }
      
      return gameMap;
    } catch (error) {
      console.error('[TemplateMapGenerator] Failed to apply template to GameMap:', error);
      throw error;
    }
  }

  /**
   * Generate winding road layout (S-curve) with precise 18/20/2 spacing
   */
  generateWindingRoadLayout(size, roadThickness, sidewalkThickness, mapData) {
    const { width, height } = size;
    const layout = Array(height).fill().map(() => Array(width).fill('grass'));

    // 1. Boundary fences
    for (let y = 0; y < height; y++) {
      layout[y][0] = 'fence';
      layout[y][width - 1] = 'fence';
    }
    for (let x = 0; x < width; x++) {
      layout[0][x] = 'fence';
      layout[height - 1][x] = 'fence';
    }

    // 2. Constants for the modular grid (Math-based for 18/20/2 requirements)
    const roadXMin = 22; // 18-tile edge on left
    const roadXMax = width - 23; // 18-tile edge on right
    const roadY = [100, 52, 4]; // Shifted up to allow more space at the bottom (25 tiles)
    const centerX = Math.floor(width / 2);

    // 3. Draw the S-curve road (Following the white line: Start at Left)
    // Start Vertical (Left side)
    this._drawCleanRoad(layout, {x: roadXMin, y: height-1}, {x: roadXMin, y: roadY[0]}, roadThickness, sidewalkThickness);
    
    // Segments
    // Road 0 (Bottom): Left -> Right
    this._drawCleanRoad(layout, {x: roadXMin, y: roadY[0]}, {x: roadXMax, y: roadY[0]}, roadThickness, sidewalkThickness);
    this._drawCleanRoad(layout, {x: roadXMax, y: roadY[0]}, {x: roadXMax, y: roadY[1]}, roadThickness, sidewalkThickness);
    
    // Road 1 (Middle): Right -> Left
    this._drawCleanRoad(layout, {x: roadXMax, y: roadY[1]}, {x: roadXMin, y: roadY[1]}, roadThickness, sidewalkThickness);
    this._drawCleanRoad(layout, {x: roadXMin, y: roadY[1]}, {x: roadXMin, y: roadY[2]}, roadThickness, sidewalkThickness);
    
    // Road 2 (Top): Left -> Right
    this._drawCleanRoad(layout, {x: roadXMin, y: roadY[2]}, {x: roadXMax, y: roadY[2]}, roadThickness, sidewalkThickness);
    this._drawCleanRoad(layout, {x: roadXMax, y: roadY[2]}, {x: roadXMax, y: 0}, roadThickness, sidewalkThickness);

    // 4. Blocking Fences (Backyard barriers)
    const fenceYs = [roadY[0] - 24, roadY[1] - 24]; // y=76 and y=28
    fenceYs.forEach((fy, idx) => {
        const xStart = (idx % 2 === 0) ? 0 : roadXMin + 10;
        const xEnd = (idx % 2 === 0) ? roadXMax - 10 : width - 1;
        for (let x = xStart; x <= xEnd; x++) {
            if (layout[fy][x] === 'grass') layout[fy][x] = 'fence';
        }
    });

    // MASTER NEIGHBORHOOD ZONING (Anchor-Based Placement)
    const sHalf = 3; // Sidewalk distance from road center
    
    // 1. GENERATE FULL RESIDENTIAL NEIGHBORHOOD
    // --- Horizontal Zones (Matched to S-curve inner corners to fill space) ---
    // We place horizontal zones FIRST to give them priority in their respective rows
    // White Zone (Top): Anchor at top-left corner, grow East, frontage North
    this.placeBuildingsFromAnchor(layout, roadXMin - sHalf, roadY[2] + sHalf, 'east', 'north', mapData, { maxBuildings: 5 });
    // Tan Zone (Upper-Mid): Anchor at upper-mid left corner, grow East, frontage South
    this.placeBuildingsFromAnchor(layout, roadXMin - sHalf, roadY[1] - sHalf, 'east', 'south', mapData, { maxBuildings: 5 });
    // Orange Zone (Upper-Mid): Anchor at upper-mid right corner, grow West, frontage North
    this.placeBuildingsFromAnchor(layout, roadXMax + sHalf, roadY[1] + sHalf, 'west', 'north', mapData, { maxBuildings: 5 });
    // Blue Zone (Lower-Mid): Anchor at lower-mid right corner, grow West, frontage South
    this.placeBuildingsFromAnchor(layout, roadXMax + sHalf, roadY[0] - sHalf, 'west', 'south', mapData, { maxBuildings: 5 });
    // Red Zone (Bottom): Anchor at bottom-left corner, grow East, frontage North
    this.placeBuildingsFromAnchor(layout, roadXMin - sHalf, roadY[0] + sHalf, 'east', 'north', mapData, { maxBuildings: 5 });

    // --- Vertical Perimeters (Secondary - only fills remaining gaps) ---
    // Green Zone (Left): Start at absolute bottom corner, grow North, frontage East
    this.placeBuildingsFromAnchor(layout, roadXMin - sHalf, height - 1, 'north', 'east', mapData, { maxBuildings: 8 });
    // Cyan Zone (Right): Start at absolute top corner, grow South, frontage West
    this.placeBuildingsFromAnchor(layout, roadXMax + sHalf, 0, 'south', 'west', mapData, { maxBuildings: 8 });




    // 2. CONVERT RESIDENTIAL HOUSES TO SPECIAL BUILDINGS
    const mapNumber = mapData.config.mapNumber || 1;
    const buildings = mapData.metadata.buildings;
    
    // Identify valid candidates (any house with direct road frontage)
    let candidateBuildings = buildings.filter(b => {
        if (b.type !== 'residential') return false;
        
        // Vertical Perimeters with roads
        const isLeftPerim = (b.frontage === 'east' && b.x < 20 && ((b.y > 10 && b.y < 42) || (b.y > 105 && b.y < 120)));
        const isRightPerim = (b.frontage === 'west' && b.x > 64 && b.y > 60 && b.y < 90);
        
        // Horizontal Bays with roads
        const isTopBay = (b.frontage === 'north' && b.y < 24);
        const isMidUpper = (b.frontage === 'south' && b.y > 32 && b.y < 46);
        const isMidLower = (b.frontage === 'north' && b.y > 58 && b.y < 72);
        const isBottomUpper = (b.frontage === 'south' && b.y > 80 && b.y < 94);
        const isBottomBay = (b.frontage === 'north' && b.y > 106);

        return isLeftPerim || isRightPerim || isTopBay || isMidUpper || isMidLower || isBottomUpper || isBottomBay;
    });

    if (candidateBuildings.length >= 2) {
        const selectedForConversion = this.getRandomSubarray(candidateBuildings, Math.min(candidateBuildings.length, 3));
        const availableTypes = this.getRandomSubarray(['grocer', 'firestation', 'police', 'gas_station'], 4);
        
        selectedForConversion.forEach((b, i) => {
            const isTentSpawn = (i === 2 && ((mapNumber === 3) || (mapNumber > 3 && Math.random() < 0.35)));
            const isSpecialSpawn = (i < 2);

            if (isSpecialSpawn || isTentSpawn) {
                // ... tiles/metadata clearing code ...
                for (let ty = b.y; ty < b.y + b.height; ty++) {
                    for (let tx = b.x; tx < b.x + b.width; tx++) {
                        layout[ty][tx] = 'grass';
                    }
                }
                mapData.metadata.doors = mapData.metadata.doors.filter(d => 
                    !(d.x >= b.x && d.x < b.x + b.width && d.y >= b.y && d.y < b.y + b.height)
                );
                if (mapData.metadata.windows) {
                    mapData.metadata.windows = mapData.metadata.windows.filter(w => 
                        !(w.x >= b.x && w.x < b.x + b.width && w.y >= b.y && w.y < b.y + b.height)
                    );
                }
                
                const realIdx = buildings.indexOf(b);
                if (realIdx !== -1) buildings.splice(realIdx, 1);

                // 3. Place new building
                if (isTentSpawn) {
                    // Tent always anchors to perimeter roads for now
                    this.placeArmyTent(layout, b.frontage === 'east', b.y, b.frontage === 'east' ? 17 : 67, 65, mapData);
                } else {
                    const type = availableTypes[i % availableTypes.length]; 
                    this.placeSpecialBuilding(layout, b, type, mapData);
                }
            }
        });
    }

    // 3. FINAL FENCE & EXIT ENFORCEMENT
    // Ensure road exits at roadXMin (bottom) and roadXMax (top) are clear
    const roadHalf = Math.floor(roadThickness / 2);
    const sideHalf = roadHalf + sidewalkThickness;

    for (let x = 0; x < width; x++) {
        // --- Top Edge Exit (Centered around x=62) ---
        const distTop = Math.abs(x - roadXMax);
        if (distTop <= roadHalf) {
            layout[0][x] = 'road';
        } else if (distTop <= sideHalf) {
            layout[0][x] = 'sidewalk';
        } else {
            layout[0][x] = 'fence';
        }

        // --- Bottom Edge Exit (Centered around x=22) ---
        const distBottom = Math.abs(x - roadXMin);
        if (distBottom <= roadHalf) {
            layout[height - 1][x] = 'road';
        } else if (distBottom <= sideHalf) {
            layout[height - 1][x] = 'sidewalk';
        } else {
            layout[height - 1][x] = 'fence';
        }
    }

    return layout;
  }

  /**
   * Draw road with clean edges (no blobs)
   */
  _drawCleanRoad(layout, p1, p2, thickness, sidewalkThickness) {
    const half = Math.floor(thickness / 2);
    const sHalf = half + sidewalkThickness;
    
    const x1 = Math.min(p1.x, p2.x);
    const x2 = Math.max(p1.x, p2.x);
    const y1 = Math.min(p1.y, p2.y);
    const y2 = Math.max(p1.y, p2.y);

    // Draw Sidewalk First (under road)
    for (let y = y1 - sHalf; y <= y2 + sHalf; y++) {
        for (let x = x1 - sHalf; x <= x2 + sHalf; x++) {
            if (layout[y] && layout[y][x] === 'grass') layout[y][x] = 'sidewalk';
        }
    }

    // Draw Road
    for (let y = y1 - half; y <= y2 + half; y++) {
        for (let x = x1 - half; x <= x2 + half; x++) {
            if (layout[y] && layout[y][x]) layout[y][x] = 'road';
        }
    }
  }

  /**
   * Helper to get a random subarray of specified length
   */
  getRandomSubarray(arr, size) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, size);
  }
  /**
   * Generate mirrored winding road layout (Mirrored S-curve)
   */
  generateMirroredWindingRoadLayout(size, roadThickness, sidewalkThickness, mapData) {
    const { width, height } = size;
    const layout = Array(height).fill().map(() => Array(width).fill('grass'));

    // 1. Boundary fences
    for (let y = 0; y < height; y++) {
      layout[y][0] = 'fence';
      layout[y][width - 1] = 'fence';
    }
    for (let x = 0; x < width; x++) {
      layout[0][x] = 'fence';
      layout[height - 1][x] = 'fence';
    }

    // 2. Constants (Mirrored)
    const roadXMin = 22; 
    const roadXMax = width - 23; 
    const roadY = [100, 52, 4]; 

    // 3. Draw the Mirrored S-curve road (Start at Right)
    // Start Vertical (Right side)
    this._drawCleanRoad(layout, {x: roadXMax, y: height-1}, {x: roadXMax, y: roadY[0]}, roadThickness, sidewalkThickness);
    
    // Segments
    // Road 0 (Bottom): Right -> Left
    this._drawCleanRoad(layout, {x: roadXMax, y: roadY[0]}, {x: roadXMin, y: roadY[0]}, roadThickness, sidewalkThickness);
    this._drawCleanRoad(layout, {x: roadXMin, y: roadY[0]}, {x: roadXMin, y: roadY[1]}, roadThickness, sidewalkThickness);
    
    // Road 1 (Middle): Left -> Right
    this._drawCleanRoad(layout, {x: roadXMin, y: roadY[1]}, {x: roadXMax, y: roadY[1]}, roadThickness, sidewalkThickness);
    this._drawCleanRoad(layout, {x: roadXMax, y: roadY[1]}, {x: roadXMax, y: roadY[2]}, roadThickness, sidewalkThickness);
    
    // Road 2 (Top): Right -> Left
    this._drawCleanRoad(layout, {x: roadXMax, y: roadY[2]}, {x: roadXMin, y: roadY[2]}, roadThickness, sidewalkThickness);
    this._drawCleanRoad(layout, {x: roadXMin, y: roadY[2]}, {x: roadXMin, y: 0}, roadThickness, sidewalkThickness);

    // 4. Blocking Fences (Mirrored logic)
    const fenceYs = [roadY[0] - 24, roadY[1] - 24]; 
    fenceYs.forEach((fy, idx) => {
        const xStart = (idx % 2 === 0) ? roadXMin + 10 : 0;
        const xEnd = (idx % 2 === 0) ? width - 1 : roadXMax - 10;
        for (let x = xStart; x <= xEnd; x++) {
            if (layout[fy][x] === 'grass') layout[fy][x] = 'fence';
        }
    });

    // MASTER NEIGHBORHOOD ZONING (Anchor-Based Placement - Mirrored)
    const sHalf = 3; 
    
    // 1. GENERATE FULL RESIDENTIAL NEIGHBORHOOD
    // --- Horizontal Zones (Matched to Mirrored S-curve inner corners to fill space) ---
    // We place horizontal zones FIRST to give them priority
    // White Zone (Top): Anchor at top-right corner, grow West, frontage North
    this.placeBuildingsFromAnchor(layout, roadXMax + sHalf, roadY[2] + sHalf, 'west', 'north', mapData, { maxBuildings: 5 });
    
    // Tan Zone (Upper-Mid Above): Anchor at upper-mid right corner, grow West, frontage South
    this.placeBuildingsFromAnchor(layout, roadXMax + sHalf, roadY[1] - sHalf, 'west', 'south', mapData, { maxBuildings: 5 });
    
    // Orange Zone (Upper-Mid Below): Anchor at upper-mid left corner, grow East, frontage North
    this.placeBuildingsFromAnchor(layout, roadXMin - sHalf, roadY[1] + sHalf, 'east', 'north', mapData, { maxBuildings: 5 });
    
    // Blue Zone (Lower-Mid Above): Anchor at lower-mid left corner, grow East, frontage South
    this.placeBuildingsFromAnchor(layout, roadXMin - sHalf, roadY[0] - sHalf, 'east', 'south', mapData, { maxBuildings: 5 });
    
    // Red Zone (Bottom): Anchor at bottom-right corner, grow West, frontage North
    this.placeBuildingsFromAnchor(layout, roadXMax + sHalf, roadY[0] + sHalf, 'west', 'north', mapData, { maxBuildings: 5 });

    // --- Vertical Perimeters (Secondary - only fills gaps) ---
    // Right Vertical: Start at absolute bottom corner, grow North, frontage West
    this.placeBuildingsFromAnchor(layout, roadXMax + sHalf, height - 1, 'north', 'west', mapData, { maxBuildings: 8 });
    // Left Vertical: Start at absolute top corner, grow South, frontage East
    this.placeBuildingsFromAnchor(layout, roadXMin - sHalf, 0, 'south', 'east', mapData, { maxBuildings: 8 });





    // 2. CONVERT RESIDENTIAL HOUSES TO SPECIAL BUILDINGS
    const mapNumber = mapData.config.mapNumber || 1;
    const buildings = mapData.metadata.buildings;
    
    let candidateBuildings = buildings.filter(b => {
        if (b.type !== 'residential') return false;
        
        // Vertical Perimeters
        const isLeftPerim = (b.frontage === 'east' && b.x < 20 && b.y > 60 && b.y < 90);
        const isRightPerim = (b.frontage === 'west' && b.x > 64 && ((b.y > 10 && b.y < 42) || (b.y > 105 && b.y < 120)));
        
        // Horizontal Bays (Mirrored conditions)
        const isTopBay = (b.frontage === 'north' && b.y < 24);
        const isMidUpper = (b.frontage === 'south' && b.y > 32 && b.y < 46);
        const isMidLower = (b.frontage === 'north' && b.y > 58 && b.y < 72);
        const isBottomUpper = (b.frontage === 'south' && b.y > 80 && b.y < 94);
        const isBottomBay = (b.frontage === 'north' && b.y > 106);

        return isLeftPerim || isRightPerim || isTopBay || isMidUpper || isMidLower || isBottomUpper || isBottomBay;
    });

    if (candidateBuildings.length >= 2) {
        const selectedForConversion = this.getRandomSubarray(candidateBuildings, Math.min(candidateBuildings.length, 3));
        const availableTypes = this.getRandomSubarray(['grocer', 'firestation', 'police', 'gas_station'], 4);
        
        selectedForConversion.forEach((b, i) => {
            const isTentSpawn = (i === 2 && ((mapNumber === 3) || (mapNumber > 3 && Math.random() < 0.35)));
            const isSpecialSpawn = (i < 2);

            if (isSpecialSpawn || isTentSpawn) {
                for (let ty = b.y; ty < b.y + b.height; ty++) {
                    for (let tx = b.x; tx < b.x + b.width; tx++) {
                        layout[ty][tx] = 'grass';
                    }
                }
                mapData.metadata.doors = mapData.metadata.doors.filter(d => 
                    !(d.x >= b.x && d.x < b.x + b.width && d.y >= b.y && d.y < b.y + b.height)
                );
                if (mapData.metadata.windows) {
                    mapData.metadata.windows = mapData.metadata.windows.filter(w => 
                        !(w.x >= b.x && w.x < b.x + b.width && w.y >= b.y && w.y < b.y + b.height)
                    );
                }
                
                const realIdx = buildings.indexOf(b);
                if (realIdx !== -1) buildings.splice(realIdx, 1);

                if (isTentSpawn) {
                    this.placeArmyTent(layout, b.frontage === 'east', b.y, b.frontage === 'east' ? 17 : 67, 65, mapData);
                } else {
                    const type = availableTypes[i % availableTypes.length]; 
                    this.placeSpecialBuilding(layout, b, type, mapData);
                }
            }
        });
    }

    // 3. FINAL FENCE & EXIT ENFORCEMENT
    const roadHalf = Math.floor(roadThickness / 2);
    const sideHalf = roadHalf + sidewalkThickness;

    for (let x = 0; x < width; x++) {
        // --- Top Edge Exit (Centered around x=22 in Mirrored) ---
        const distTop = Math.abs(x - roadXMin);
        if (distTop <= roadHalf) {
            layout[0][x] = 'road';
        } else if (distTop <= sideHalf) {
            layout[0][x] = 'sidewalk';
        } else {
            layout[0][x] = 'fence';
        }

        // --- Bottom Edge Exit (Centered around x=roadXMax in Mirrored) ---
        const distBottom = Math.abs(x - roadXMax);
        if (distBottom <= roadHalf) {
            layout[height - 1][x] = 'road';
        } else if (distBottom <= sideHalf) {
            layout[height - 1][x] = 'sidewalk';
        } else {
            layout[height - 1][x] = 'fence';
        }
    }

    return layout;
  }
}
