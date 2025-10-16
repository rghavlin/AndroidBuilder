/**
 * AsciiMapRenderer - Console-based map visualization
 * Renders maps as ASCII art in the console for debugging and testing
 * Follows UniversalGoals.md: modular, pure JavaScript, testable
 */
export class AsciiMapRenderer {
  constructor() {
    // Terrain character mapping
    this.terrainChars = {
      'grass': '.',
      'floor': '_',
      'wall': '#',
      'road': 'R',
      'sidewalk': 'S',
      'fence': 'F',
      'building': 'B',
      'water': '~',
      'sand': '^'
    };

    this.entityChars = {
      'player': '@',
      'zombie': 'Z',
      'item': '*',
      'npc': 'N'
    };

    // Color mapping for different terrain types
    this.colors = {
      'wall': '\x1b[90m',     // Dark gray
      'floor': '\x1b[37m',    // Light gray  
      'grass': '\x1b[32m',    // Green
      'road': '\x1b[30m',     // Dark gray (darker than wall)
      'sidewalk': '\x1b[37m', // Light gray
      'fence': '\x1b[33m',    // Yellow/brownish
      'building': '\x1b[91m', // Light red
      'reset': '\x1b[0m',     // Reset
      'gray': '\x1b[90m',     // Dark gray
      'white': '\x1b[37m',    // White
      'green': '\x1b[32m',    // Green
      'cyan': '\x1b[36m',     // Cyan
      'yellow': '\x1b[33m',   // Yellow
      'magenta': '\x1b[35m',  // Magenta
      'red': '\x1b[31m',      // Red
      'blue': '\x1b[34m',     // Blue
      'bright': '\x1b[1m'     // Bright modifier
    };
  }

  /**
   * Render GameMap as ASCII to console
   */
  renderGameMap(gameMap, options = {}) {
    const {
      showCoordinates = false,
      showEntities = true,
      useColors = true,
      title = 'Game Map'
    } = options;

    const mapString = this.gameMapToAscii(gameMap, {
      showCoordinates,
      showEntities,
      useColors
    });

    console.log(`\n${title} (${gameMap.width}x${gameMap.height}):`);
    console.log(mapString);

    if (showCoordinates) {
      console.log('\nCoordinate system: X→ Y↓');
    }
  }

  /**
   * Render template map data as ASCII to console
   */
  renderTemplateMap(templateMapData, options = {}) {
    const {
      showCoordinates = false,
      useColors = true,
      title = 'Template Map'
    } = options;

    const mapString = this.templateMapToAscii(templateMapData, {
      showCoordinates,
      useColors
    });

    console.log(`\n${title} (${templateMapData.width}x${templateMapData.height}):`);
    console.log(mapString);

    if (showCoordinates) {
      console.log('\nCoordinate system: X→ Y↓');
    }
  }

  /**
   * Convert GameMap to ASCII string
   */
  gameMapToAscii(gameMap, options = {}) {
    const { showCoordinates = false, showEntities = true, useColors = true } = options;
    let result = '';

    // Add column headers if showing coordinates
    if (showCoordinates) {
      result += '   '; // Row header space
      for (let x = 0; x < gameMap.width; x++) {
        result += (x % 10).toString();
      }
      result += '\n';
    }

    // Render each row
    for (let y = 0; y < gameMap.height; y++) {
      // Add row header if showing coordinates
      if (showCoordinates) {
        result += `${y.toString().padStart(2, ' ')} `;
      }

      // Render each tile in the row
      for (let x = 0; x < gameMap.width; x++) {
        const tile = gameMap.getTile(x, y);
        let char = this.terrainChars[tile.terrain] || '?';

        // Show entities if enabled and present
        if (showEntities && tile.contents.length > 0) {
          const topEntity = tile.contents[tile.contents.length - 1];
          char = this.entityChars[topEntity.type] || char;
        }

        // Apply colors if enabled
        if (useColors) {
          char = this.colorizeChar(char, tile.terrain, tile.contents);
        }

        result += char;
      }
      result += '\n';
    }

    return result;
  }

  /**
   * Convert template map data to ASCII string
   */
  templateMapToAscii(templateMapData, options = {}) {
    const { showCoordinates = false, useColors = true } = options;
    let result = '';

    // Add column headers if showing coordinates
    if (showCoordinates) {
      result += '   '; // Row header space
      for (let x = 0; x < templateMapData.width; x++) {
        result += (x % 10).toString();
      }
      result += '\n';
    }

    // Render each row
    for (let y = 0; y < templateMapData.height; y++) {
      // Add row header if showing coordinates
      if (showCoordinates) {
        result += `${y.toString().padStart(2, ' ')} `;
      }

      // Render each tile in the row
      for (let x = 0; x < templateMapData.width; x++) {
        const tileData = templateMapData.tiles[y] && templateMapData.tiles[y][x];
        if (!tileData) {
          result += '?'; // Default character for missing tile data
          continue;
        }

        let char = this.terrainChars[tileData.terrain] || '?';

        // Apply colors if enabled
        if (useColors) {
          char = this.colorizeChar(char, tileData.terrain, tileData.contents || []);
        }

        result += char;
      }
      result += '\n';
    }

    return result;
  }

  /**
   * Apply ANSI color codes to character
   */
  colorizeChar(char, terrain, entities) {
    let color = this.colors.reset;

    // Entity colors take priority
    if (entities.length > 0) {
      const topEntity = entities[entities.length - 1];
      switch (topEntity.type) {
        case 'player':
          color = this.colors.blue + this.colors.bright;
          break;
        case 'zombie':
          color = this.colors.red + this.colors.bright;
          break;
        case 'item':
          color = this.colors.yellow;
          break;
        case 'npc':
          color = this.colors.magenta;
          break;
      }
    } else {
      // Terrain colors
      switch (terrain) {
        case 'wall':
          color = this.colors.gray;
          break;
        case 'floor':
          color = this.colors.white;
          break;
        case 'grass':
          color = this.colors.green;
          break;
        case 'water':
          color = this.colors.cyan;
          break;
        case 'door':
          color = this.colors.yellow;
          break;
        case 'stairs':
          color = this.colors.magenta;
          break;
        case 'road':
          color = this.colors.road;
          break;
        case 'sidewalk':
          color = this.colors.sidewalk;
          break;
        case 'fence':
          color = this.colors.fence;
          break;
      }
    }

    return color + char + this.colors.reset;
  }

  /**
   * Render map with legend
   */
  renderWithLegend(mapData, options = {}) {
    // Render the map first
    if (mapData.width) {
      // Template map data
      this.renderTemplateMap(mapData, options);
    } else {
      // GameMap instance
      this.renderGameMap(mapData, options);
    }

    // Show legend
    console.log('\nTerrain Legend:');
    Object.entries(this.terrainChars).forEach(([terrain, char]) => {
      const coloredChar = options.useColors !== false ? 
        this.colorizeChar(char, terrain, []) : char;
      console.log(`  ${coloredChar} = ${terrain}`);
    });

    console.log('\nEntity Legend:');
    Object.entries(this.entityChars).forEach(([entity, char]) => {
      const coloredChar = options.useColors !== false ? 
        this.colorizeChar(char, 'floor', [{ type: entity }]) : char;
      console.log(`  ${coloredChar} = ${entity}`);
    });
  }

  /**
   * Compare two maps side by side
   */
  renderComparison(mapA, mapB, options = {}) {
    const { titleA = 'Map A', titleB = 'Map B', useColors = true } = options;

    const asciiA = mapA.width ? 
      this.templateMapToAscii(mapA, { useColors }) : 
      this.gameMapToAscii(mapA, { useColors });

    const asciiB = mapB.width ? 
      this.templateMapToAscii(mapB, { useColors }) : 
      this.gameMapToAscii(mapB, { useColors });

    const linesA = asciiA.trim().split('\n');
    const linesB = asciiB.trim().split('\n');
    const maxLines = Math.max(linesA.length, linesB.length);

    console.log(`\n${titleA.padEnd(30)} | ${titleB}`);
    console.log('-'.repeat(30) + ' | ' + '-'.repeat(30));

    for (let i = 0; i < maxLines; i++) {
      const lineA = (linesA[i] || '').padEnd(30);
      const lineB = linesB[i] || '';
      console.log(`${lineA} | ${lineB}`);
    }
  }

  /**
   * Create ASCII art border around map
   */
  renderWithBorder(mapData, options = {}) {
    const { title = 'Map', borderChar = '═', cornerChar = '╬' } = options;

    const width = mapData.width || mapData.width;
    const borderLine = cornerChar + borderChar.repeat(width) + cornerChar;

    console.log(`\n${title}:`);
    console.log(borderLine);

    if (mapData.width) {
      // Template map data
      const ascii = this.templateMapToAscii(mapData, options);
      ascii.trim().split('\n').forEach(line => {
        console.log('║' + line + '║');
      });
    } else {
      // GameMap instance
      const ascii = this.gameMapToAscii(mapData, options);
      ascii.trim().split('\n').forEach(line => {
        console.log('║' + line + '║');
      });
    }

    console.log(borderLine);
  }
}