import { createItemFromDef } from '../inventory/ItemDefs.js';
import { MapBuilder } from './MapBuilder.js';
import { RoadGenerator } from './generators/RoadGenerator.js';
import { SplitRoadGenerator } from './generators/SplitRoadGenerator.js';
import { WindingRoadGenerator } from './generators/WindingRoadGenerator.js';
import { MirroredWindingRoadGenerator } from './generators/MirroredWindingRoadGenerator.js';

/**
 * TemplateMapGenerator - Template-based map generation system
 * Generates maps from predefined templates with configurable parameters
 * Follows UniversalGoals.md: modular, testable, serializable
 */
export class TemplateMapGenerator {
  constructor() {
    this.templates = new Map();
    this.generators = new Map();
    this.loadDefaultTemplates();
    this.registerGenerators();
  }

  /**
   * Register template generators
   */
  registerGenerators() {
    this.generators.set('road', new RoadGenerator());
    this.generators.set('split_road', new SplitRoadGenerator());
    this.generators.set('winding_road', new WindingRoadGenerator());
    this.generators.set('mirrored_winding_road', new MirroredWindingRoadGenerator());
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

    // Split Road template
    this.templates.set('split_road', {
      name: 'Split Road',
      size: { width: 60, height: 150 },
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

    const builder = new MapBuilder(template.size.width, template.size.height);
    const generator = this.generators.get(templateName);

    if (generator) {
      generator.generate(config, builder);
    } else if (template.layout && template.layout.length > 0) {
      // Legacy support for fixed layout templates
      const parsedLayout = this.parseTemplateLayout(template.layout);
      builder.layout = parsedLayout;
    }

    // Convert builder state to final mapData
    const mapData = builder.getFinalMapData(templateName, config);

    // Apply variations and randomization (only for legacy fixed layouts or specific cases)
    if (!generator && templateName !== 'road') {
      const randomWalls = config.randomWalls || template.parameters?.randomWalls?.min || 0;
      const extraFloors = config.extraFloors || template.parameters?.extraFloors?.min || 0;
      this.addRandomWalls(builder.layout, randomWalls);
      this.addRandomFloors(builder.layout, extraFloors);
      // Re-map tiles after random modifications
      mapData.tiles = this.layoutToTileData(builder.layout);
    }

    // Set transition tiles at road exits
    const roadXMin = 22;
    const roadXMax = mapData.width - 23;
    const centerX = Math.floor(mapData.width / 2);
    let northExitX = centerX;
    let southExitX = centerX;
    
    if (templateName === 'winding_road') {
        northExitX = roadXMax;
        southExitX = roadXMin;
    } else if (templateName === 'mirrored_winding_road') {
        northExitX = roadXMin;
        southExitX = roadXMax;
    }

    this.setTileData(mapData, northExitX, 0, 'transition');
    this.setTileData(mapData, southExitX, mapData.height - 1, 'transition');

    // Add spawn zones metadata
    mapData.metadata.spawnZones = {
      ...template.spawnZones,
      roadStart: [{ x: southExitX, y: mapData.height - 2 }], 
      transitionPoints: {
        north: { x: northExitX, y: 0 }, 
        south: { x: southExitX, y: mapData.height - 1 } 
      }
    };

    this.placeWildCrops(mapData);

    console.log(`[TemplateMapGenerator] Generated '${templateName}' map using ${generator ? 'Strategy' : 'Legacy'} engine`);
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
    if (['police', 'firestation', 'grocer', 'gas_station', 'army_tent', 'hardware_store'].includes(type)) {
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
    const template = this.templates.get(templateName);
    const width = template ? template.size.width : 45;
    const height = template ? template.size.height : 125;
    
    const generator = this.generators.get(templateName);
    if (generator) {
      return generator.getStartPosition(width, height);
    }

    const templateStartPositions = {
      'small_building': { x: 5, y: 7 },
      'mall_section': { x: 7, y: 11 },
      'outdoor_area': { x: 10, y: 19 }
    };

    return templateStartPositions[templateName] || { x: Math.floor(width / 2), y: height - 2 };
  }

  /**
   * Apply template-generated map data to a GameMap instance
   */
  async applyToGameMap(gameMap, templateMapData) {
    try {
      if (!templateMapData || !templateMapData.tiles) {
        throw new Error('Invalid template data: missing tiles array');
      }

      if (templateMapData.template) {
        gameMap.template = templateMapData.template;
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
}
