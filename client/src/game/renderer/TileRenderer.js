/**
 * TileRenderer - Pure rendering functions for map terrain and overlays
 */
import { imageLoader } from '../../game/utils/ImageLoader.js';

// Grid coordinates on the 16x16 sprite sheet (2048x2048 total size, 128x128 per tile)
const SPRITE_ATLAS_MAP = {
  'sidewalk':    { col: 6, row: 0 }, // Need to remap later if necessary
  'wall':        { col: 0, row: 0 }, // Red brick walls
  'building':    { col: 0, row: 0 }, 
  'floor':       { col: 8, row: 15 }, // Wood floor (Bottom Center)
  'tent_floor':  { col: 8, row: 15 },
  'tent_wall':   { col: 0, row: 0 },
  'dirt':        { col: 3, row: 7 }, 
  'sand':        { col: 3, row: 7 }
};

export const TileRenderer = {
  /**
   * Draw a single map tile (Terrain, Fog, FOV)
   */
  drawTile: (ctx, x, y, tileSize, tile, isVisible, isExplored, isNight, engine, sprites) => {
    const screenX = x * tileSize;
    const screenY = y * tileSize;

    // 1. Draw Terrain (If explored)
    if (isExplored) {
        // Step A: Draw Base Color Layer (Ensures visibility even if texture fails/is dark)
        const terrainColors = {
            'grass': '#1a3c1a',
            'road': '#2d2d2d',
            'sidewalk': '#555',
            'wall': '#888',     // High-contrast structural gray
            'building': '#777', // Concrete/Building gray
            'fence': '#4a3728', 
            'tree': '#064e3b',
            'tent_wall': '#78716c',
            'tent_floor': '#5b4d3d', 
            'floor': '#333', 
            'water': '#1a3c5a',
            'dirt': '#3d2b1f'
        };
        
        // Use structural mapping for important types to guarantee visibility
        const isStructural = ['wall', 'building', 'fence', 'tent_wall', 'water'].includes(tile.terrain);
        ctx.fillStyle = (isStructural ? terrainColors[tile.terrain] : (tile.color || terrainColors[tile.terrain])) || '#222';
        ctx.fillRect(screenX, screenY, tileSize, tileSize);

        // Step B: Draw Texture Layer (On top of base color) - Skipped in Debug Mode
        if (sprites && !engine.renderDebugColors) {
            // Some terrain types are intentionally color-only (no textures)
            const isColorOnly = ['window'].includes(tile.terrain);
            
            if (!isColorOnly) {
                if (imageLoader.tileSet === 'spritesheet') {
                    const sheet = sprites['tile_spritesheet'];
                    if (sheet) {
                        let mapping;
                        
                        if (tile.terrain === 'grass') {
                            // Bottom Left Grass (Row 14 & 15, Col 0-3)
                            const grassVariants = [
                                { col: 0, row: 15 }, { col: 1, row: 15 }, { col: 2, row: 15 }, { col: 3, row: 15 },
                                { col: 0, row: 14 }, { col: 1, row: 14 }, { col: 2, row: 14 }, { col: 3, row: 14 }
                            ];
                            const index = Math.abs(x * 31 + y * 17) % grassVariants.length;
                            mapping = grassVariants[index];
                        } else if (tile.terrain === 'road') {
                            // Randomize road slabs to create natural road wear/cracks
                            const roadHash = Math.abs(x * 13 + y * 7) % 10;
                            if (roadHash < 3) {
                                mapping = { col: 5, row: 7 }; // Cracked pavement
                            } else if (roadHash < 6) {
                                mapping = { col: 6, row: 1 }; // Worn concrete slab with crack
                            } else {
                                mapping = { col: 7, row: 0 }; // Concrete slab with crack
                            }
                        } else {
                            mapping = SPRITE_ATLAS_MAP[tile.terrain];
                        }

                        if (mapping) {
                            const cellSize = 128; // 2048 / 16 = 128
                            const inset = 3;      // Crop 3px to strip the baked-in black grid lines
                            const sx = mapping.col * cellSize + inset;
                            const sy = mapping.row * cellSize + inset;
                            const sDim = cellSize - (inset * 2);

                            ctx.drawImage(
                                sheet,
                                sx, sy, sDim, sDim, // source bounds (cropped)
                                screenX, screenY, tileSize, tileSize // destination on canvas
                            );
                        }
                    } else {
                        // Reactive lazy-loading for missing master sprite sheet
                        imageLoader.getTileImage(tile.terrain);
                    }
                } else {
                    const spriteKey = `tile_${tile.terrain}`;
                    const sprite = sprites[spriteKey];
                    if (sprite) {
                        ctx.drawImage(sprite, screenX, screenY, tileSize, tileSize);
                    } else {
                        // Reactive lazy-loading for missing tiles
                        imageLoader.getTileImage(tile.terrain);
                    }
                }
            }
        }

        // Draw Edge Walls
        const hasDoorOrWindowOnEdge = (t, edge) => {
            if (!t || !t.contents) return false;
            return t.contents.some(e => (e.type === 'door' || e.type === 'window') && e.edge === edge);
        };

        const hasEdgeWall = (t, edge) => {
            return t && t.edgeWalls && t.edgeWalls[edge] && !hasDoorOrWindowOnEdge(t, edge);
        };

        const hasN = hasEdgeWall(tile, 'n') || (engine && engine.gameMap && hasEdgeWall(engine.gameMap.getTile(x, y - 1), 's'));
        const hasE = hasEdgeWall(tile, 'e') || (engine && engine.gameMap && hasEdgeWall(engine.gameMap.getTile(x + 1, y), 'w'));
        const hasS = hasEdgeWall(tile, 's') || (engine && engine.gameMap && hasEdgeWall(engine.gameMap.getTile(x, y + 1), 'n'));
        const hasW = hasEdgeWall(tile, 'w') || (engine && engine.gameMap && hasEdgeWall(engine.gameMap.getTile(x - 1, y), 'e'));

        if (hasN || hasE || hasS || hasW) {
            const sheet = (imageLoader.tileSet === 'spritesheet') ? sprites?.['tile_spritesheet'] : null;
            if (sheet) {
                const bitmask = (hasN ? 1 : 0) +
                                (hasE ? 2 : 0) +
                                (hasS ? 4 : 0) +
                                (hasW ? 8 : 0);
                const wallCol = bitmask; 
                const wallRow = 0; 
                const cellSize = 128;
                const sx = wallCol * cellSize;
                const sy = wallRow * cellSize;

                ctx.drawImage(
                    sheet,
                    sx, sy, cellSize, cellSize,
                    screenX, screenY, tileSize, tileSize
                );
            } else {
                ctx.strokeStyle = imageLoader.tileSet === 'b&w' ? '#555555' : '#8a2525';
                ctx.lineWidth = Math.max(8, Math.floor(tileSize * 0.16));
                ctx.lineCap = 'square';
                
                if (hasN) {
                    ctx.beginPath();
                    ctx.moveTo(screenX, screenY);
                    ctx.lineTo(screenX + tileSize, screenY);
                    ctx.stroke();
                }
                if (hasS) {
                    ctx.beginPath();
                    ctx.moveTo(screenX, screenY + tileSize);
                    ctx.lineTo(screenX + tileSize, screenY + tileSize);
                    ctx.stroke();
                }
                if (hasW) {
                    ctx.beginPath();
                    ctx.moveTo(screenX, screenY);
                    ctx.lineTo(screenX, screenY + tileSize);
                    ctx.stroke();
                }
                if (hasE) {
                    ctx.beginPath();
                    ctx.moveTo(screenX + tileSize, screenY);
                    ctx.lineTo(screenX + tileSize, screenY + tileSize);
                    ctx.stroke();
                }
            }
        }
        
        // Step C: Add subtle grid line for clarity (only in debug or highly zoomed)
        ctx.strokeStyle = engine.renderDebugColors ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(screenX, screenY, tileSize, tileSize);
    } else {
        // Unexplored is pitch black
        ctx.fillStyle = '#000';
        ctx.fillRect(screenX, screenY, tileSize, tileSize);
        return;
    }

    // 2. Apply Fog of War / Night / FOV layers
    if (!isVisible) {
        // Explored but not visible (Fog of War)
        // Reduced from 0.6 to 0.45 for better structural visibility
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'; 
        ctx.fillRect(screenX, screenY, tileSize, tileSize);
    } else if (isNight) {
        // Visible at night (Blue-tinted dark)
        ctx.fillStyle = 'rgba(0, 5, 20, 0.3)';
        ctx.fillRect(screenX, screenY, tileSize, tileSize);
    }
  },

  /**
   * Draw tile highlights (Hover, Targets, Paths)
   */
  drawHighlight: (ctx, x, y, tileSize, color, type = 'solid') => {
    const screenX = x * tileSize;
    const screenY = y * tileSize;

    ctx.save();
    if (type === 'outline') {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(screenX + 1, screenY + 1, tileSize - 2, tileSize - 2);
    } else {
      ctx.fillStyle = color;
      ctx.fillRect(screenX, screenY, tileSize, tileSize);
    }
    ctx.restore();
  }
};
