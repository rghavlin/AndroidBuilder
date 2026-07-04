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

const TERRAIN_COLORS = {
  'grass': '#1a3c1a',
  'road': '#2d2d2d',
  'transition': '#2d2d2d',
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

const LIGHT_TERRAIN_COLORS = {
  'grass': '#e2e8f0',
  'road': '#cbd5e1',
  'transition': '#cbd5e1',
  'sidewalk': '#94a3b8',
  'wall': '#475569',
  'building': '#94a3b8',
  'fence': '#64748b',
  'tree': '#334155',
  'tent_wall': '#cbd5e1',
  'tent_floor': '#e2e8f0',
  'floor': '#f1f5f9',
  'water': '#e2e8f0',
  'dirt': '#e2e8f0'
};

const GRASS_VARIANTS = [
  { col: 0, row: 15 }, { col: 1, row: 15 }, { col: 2, row: 15 }, { col: 3, row: 15 },
  { col: 0, row: 14 }, { col: 1, row: 14 }, { col: 2, row: 14 }, { col: 3, row: 14 }
];

export const TileRenderer = {
  /**
   * Draw a single map tile (Terrain, Fog, FOV)
   */
  drawTile: (ctx, x, y, tileSize, tile, isVisible, isExplored, isNight, engine, sprites, currentTime) => {
    const screenX = x * tileSize;
    const screenY = y * tileSize;

    // 1. Draw Terrain (If explored)
    if (isExplored) {
        const isLight = document.documentElement.classList.contains('light');
        // Use structural mapping for important types to guarantee visibility
        const colors = isLight ? LIGHT_TERRAIN_COLORS : TERRAIN_COLORS;
        const isStructural = ['wall', 'building', 'fence', 'tent_wall', 'water'].includes(tile.terrain);
        ctx.fillStyle = (isStructural ? colors[tile.terrain] : (tile.color || colors[tile.terrain])) || '#222';
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
                            if (tile._variantIndex === undefined) {
                                tile._variantIndex = Math.abs(x * 31 + y * 17) % GRASS_VARIANTS.length;
                            }
                            mapping = GRASS_VARIANTS[tile._variantIndex];
                        } else if (tile.terrain === 'road' || tile.terrain === 'transition') {
                            if (tile._variantIndex === undefined) {
                                const roadHash = Math.abs(x * 13 + y * 7) % 10;
                                if (roadHash < 3) {
                                    tile._variantIndex = 0; // Cracked pavement
                                } else if (roadHash < 6) {
                                    tile._variantIndex = 1; // Worn concrete slab with crack
                                } else {
                                    tile._variantIndex = 2; // Concrete slab with crack
                                }
                            }
                            if (tile._variantIndex === 0) {
                                mapping = { col: 5, row: 7 };
                            } else if (tile._variantIndex === 1) {
                                mapping = { col: 6, row: 1 };
                            } else {
                                mapping = { col: 7, row: 0 };
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

                            if (isLight) ctx.globalAlpha = 0.25;
                            ctx.drawImage(
                                sheet,
                                sx, sy, sDim, sDim, // source bounds (cropped)
                                screenX, screenY, tileSize, tileSize // destination on canvas
                            );
                            if (isLight) ctx.globalAlpha = 1.0;
                        }
                    } else {
                        // Reactive lazy-loading for missing master sprite sheet
                        imageLoader.getTileImage(tile.terrain);
                    }
                } else {
                    const terrainKey = tile.terrain === 'transition' ? 'road' : tile.terrain;
                    const spriteKey = `tile_${terrainKey}`;
                    const sprite = sprites[spriteKey];
                    if (sprite) {
                        if (isLight) ctx.globalAlpha = 0.25;
                        ctx.drawImage(sprite, screenX, screenY, tileSize, tileSize);
                        if (isLight) ctx.globalAlpha = 1.0;
                    } else {
                        // Reactive lazy-loading for missing tiles
                        imageLoader.getTileImage(terrainKey);
                    }
                }
            }
        }

        // Step B.5: Draw Decoration Layer (on top of terrain, below walls/fog)
        if (tile.decoration && imageLoader.tileSet !== 'none' && !engine.renderDebugColors) {
            const isIndoor = ['brokenchair', 'crack', 'debris', 'paper', 'tabledebris'].includes(tile.decoration);
            const decorType = isIndoor ? 'indoor' : 'outdoor';
            const decorKey = `decor_${decorType}_${tile.decoration}`;
            const decorSprite = sprites[decorKey];
            if (decorSprite) {
                ctx.drawImage(decorSprite, screenX, screenY, tileSize, tileSize);
            } else {
                // Reactive lazy-loading for missing decorations
                imageLoader.getDecorationImage(tile.decoration, decorType);
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
                // Two-tone wall: a dark casing under a lighter core, so the wall
                // reads against BOTH dark backgrounds (road) and light ones (floor),
                // and stays distinct from the near-white window frames.
                const isBW = imageLoader.tileSet === 'b&w';
                const coreColor = isBW ? '#bfbfbf' : '#a83838';
                const casingColor = isBW ? '#1c1c1c' : '#2a0a0a';
                const coreW = Math.max(6, Math.floor(tileSize * 0.16));
                const casingW = coreW + Math.max(4, Math.floor(tileSize * 0.12));
                ctx.lineCap = 'butt'; // Use 'butt' to precisely control overlap and caps

                const getTile = (tx, ty) => engine && engine.gameMap ? engine.gameMap.getTile(tx, ty) : null;
                
                const wallAtN = (tx, ty) => hasEdgeWall(getTile(tx, ty), 'n') || hasEdgeWall(getTile(tx, ty - 1), 's');
                const wallAtS = (tx, ty) => hasEdgeWall(getTile(tx, ty), 's') || hasEdgeWall(getTile(tx, ty + 1), 'n');
                const wallAtW = (tx, ty) => hasEdgeWall(getTile(tx, ty), 'w') || hasEdgeWall(getTile(tx - 1, ty), 'e');
                const wallAtE = (tx, ty) => hasEdgeWall(getTile(tx, ty), 'e') || hasEdgeWall(getTile(tx + 1, ty), 'w');

                // Determine horizontal/vertical continuations
                const nLeftConnect  = hasN && (wallAtN(x - 1, y) || wallAtW(x, y) || wallAtW(x, y - 1));
                const nRightConnect = hasN && (wallAtN(x + 1, y) || wallAtE(x, y) || wallAtE(x, y - 1));

                const sLeftConnect  = hasS && (wallAtS(x - 1, y) || wallAtW(x, y + 1) || wallAtW(x, y));
                const sRightConnect = hasS && (wallAtS(x + 1, y) || wallAtE(x, y + 1) || wallAtE(x, y));

                const wTopConnect    = hasW && (wallAtW(x, y - 1) || wallAtN(x, y) || wallAtN(x - 1, y));
                const wBottomConnect = hasW && (wallAtW(x, y + 1) || wallAtS(x, y) || wallAtS(x - 1, y));

                const eTopConnect    = hasE && (wallAtE(x, y - 1) || wallAtN(x + 1, y) || wallAtN(x, y));
                const eBottomConnect = hasE && (wallAtE(x, y + 1) || wallAtS(x + 1, y) || wallAtS(x, y));

                // Draw casings first
                ctx.strokeStyle = casingColor;
                ctx.lineWidth = casingW;

                if (hasN) {
                    const x1 = nLeftConnect ? screenX : screenX - casingW / 2;
                    const x2 = nRightConnect ? screenX + tileSize : screenX + tileSize + casingW / 2;
                    ctx.beginPath();
                    ctx.moveTo(x1, screenY);
                    ctx.lineTo(x2, screenY);
                    ctx.stroke();
                }
                if (hasS) {
                    const x1 = sLeftConnect ? screenX : screenX - casingW / 2;
                    const x2 = sRightConnect ? screenX + tileSize : screenX + tileSize + casingW / 2;
                    ctx.beginPath();
                    ctx.moveTo(x1, screenY + tileSize);
                    ctx.lineTo(x2, screenY + tileSize);
                    ctx.stroke();
                }
                if (hasW) {
                    const y1 = wTopConnect ? screenY : screenY - casingW / 2;
                    const y2 = wBottomConnect ? screenY + tileSize : screenY + tileSize + casingW / 2;
                    ctx.beginPath();
                    ctx.moveTo(screenX, y1);
                    ctx.lineTo(screenX, y2);
                    ctx.stroke();
                }
                if (hasE) {
                    const y1 = eTopConnect ? screenY : screenY - casingW / 2;
                    const y2 = eBottomConnect ? screenY + tileSize : screenY + tileSize + casingW / 2;
                    ctx.beginPath();
                    ctx.moveTo(screenX + tileSize, y1);
                    ctx.lineTo(screenX + tileSize, y2);
                    ctx.stroke();
                }

                // Draw cores on top
                ctx.strokeStyle = coreColor;
                ctx.lineWidth = coreW;

                if (hasN) {
                    ctx.beginPath();
                    ctx.moveTo(screenX - coreW / 2, screenY);
                    ctx.lineTo(screenX + tileSize + coreW / 2, screenY);
                    ctx.stroke();
                }
                if (hasS) {
                    ctx.beginPath();
                    ctx.moveTo(screenX - coreW / 2, screenY + tileSize);
                    ctx.lineTo(screenX + tileSize + coreW / 2, screenY + tileSize);
                    ctx.stroke();
                }
                if (hasW) {
                    ctx.beginPath();
                    ctx.moveTo(screenX, screenY - coreW / 2);
                    ctx.lineTo(screenX, screenY + tileSize + coreW / 2);
                    ctx.stroke();
                }
                if (hasE) {
                    ctx.beginPath();
                    ctx.moveTo(screenX + tileSize, screenY - coreW / 2);
                    ctx.lineTo(screenX + tileSize, screenY + tileSize + coreW / 2);
                    ctx.stroke();
                }
            }
        }
        
        // Fire Overlay
        if (tile.fireTurns > 0) {
            const time = currentTime || Date.now();
            const pulse = 0.35 + Math.sin(time / 180) * 0.15;
            ctx.fillStyle = `rgba(249, 115, 22, ${pulse})`;
            ctx.fillRect(screenX, screenY, tileSize, tileSize);
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
   * Draw a tile into an offscreen chunk canvas — terrain, decorations, and
   * edge walls only. No FOV/fog, no fire animation, no night tint; those
   * dynamic overlays are applied by MapCanvas on top of the blitted chunk.
   *
   * @param localX/localY  — position within the chunk canvas (0…CHUNK_SIZE-1)
   * @param worldX/worldY  — actual map coordinates (used for variant indices
   *                         and neighbour tile lookups)
   */
  drawTileStatic: (ctx, localX, localY, worldX, worldY, tileSize, tile, engine, sprites) => {
    const screenX = localX * tileSize;
    const screenY = localY * tileSize;

    // Base colour (always drawn — unexplored tiles are masked by MapCanvas)
    const isLight = document.documentElement.classList.contains('light');
    const colors = isLight ? LIGHT_TERRAIN_COLORS : TERRAIN_COLORS;
    const isStructural = ['wall', 'building', 'fence', 'tent_wall', 'water'].includes(tile.terrain);
    ctx.fillStyle = (isStructural ? colors[tile.terrain] : (tile.color || colors[tile.terrain])) || '#222';
    ctx.fillRect(screenX, screenY, tileSize, tileSize);

    // Texture layer
    if (sprites && !engine.renderDebugColors) {
      const isColorOnly = ['window'].includes(tile.terrain);
      if (!isColorOnly) {
        if (imageLoader.tileSet === 'spritesheet') {
          const sheet = sprites['tile_spritesheet'];
          if (sheet) {
            let mapping;
            if (tile.terrain === 'grass') {
              if (tile._variantIndex === undefined) {
                tile._variantIndex = Math.abs(worldX * 31 + worldY * 17) % GRASS_VARIANTS.length;
              }
              mapping = GRASS_VARIANTS[tile._variantIndex];
            } else if (tile.terrain === 'road' || tile.terrain === 'transition') {
              if (tile._variantIndex === undefined) {
                const roadHash = Math.abs(worldX * 13 + worldY * 7) % 10;
                tile._variantIndex = roadHash < 3 ? 0 : roadHash < 6 ? 1 : 2;
              }
              mapping = tile._variantIndex === 0 ? { col: 5, row: 7 }
                      : tile._variantIndex === 1 ? { col: 6, row: 1 }
                      :                            { col: 7, row: 0 };
            } else {
              mapping = SPRITE_ATLAS_MAP[tile.terrain];
            }
            if (mapping) {
              const cellSize = 128;
              const inset = 3;
              if (isLight) ctx.globalAlpha = 0.25;
              ctx.drawImage(
                sheet,
                mapping.col * cellSize + inset, mapping.row * cellSize + inset,
                cellSize - inset * 2, cellSize - inset * 2,
                screenX, screenY, tileSize, tileSize
              );
              if (isLight) ctx.globalAlpha = 1.0;
            }
          } else {
            imageLoader.getTileImage(tile.terrain);
          }
        } else {
          const terrainKey = tile.terrain === 'transition' ? 'road' : tile.terrain;
          const sprite = sprites[`tile_${terrainKey}`];
          if (sprite) {
            if (isLight) ctx.globalAlpha = 0.25;
            ctx.drawImage(sprite, screenX, screenY, tileSize, tileSize);
            if (isLight) ctx.globalAlpha = 1.0;
          } else {
            imageLoader.getTileImage(terrainKey);
          }
        }
      }
    }

    // Decoration layer
    if (tile.decoration && imageLoader.tileSet !== 'none' && !engine.renderDebugColors) {
      const isIndoor = ['brokenchair', 'crack', 'debris', 'paper', 'tabledebris'].includes(tile.decoration);
      const decorType = isIndoor ? 'indoor' : 'outdoor';
      const decorSprite = sprites?.[`decor_${decorType}_${tile.decoration}`];
      if (decorSprite) {
        ctx.drawImage(decorSprite, screenX, screenY, tileSize, tileSize);
      } else {
        imageLoader.getDecorationImage(tile.decoration, decorType);
      }
    }

    // Edge walls — neighbour lookups use world coordinates
    const hasDoorOrWindowOnEdge = (t, edge) =>
      t?.contents?.some(e => (e.type === 'door' || e.type === 'window') && e.edge === edge) ?? false;
    const hasEdgeWall = (t, edge) => t?.edgeWalls?.[edge] && !hasDoorOrWindowOnEdge(t, edge);

    const hasN = hasEdgeWall(tile, 'n') || (engine?.gameMap && hasEdgeWall(engine.gameMap.getTile(worldX, worldY - 1), 's'));
    const hasE = hasEdgeWall(tile, 'e') || (engine?.gameMap && hasEdgeWall(engine.gameMap.getTile(worldX + 1, worldY), 'w'));
    const hasS = hasEdgeWall(tile, 's') || (engine?.gameMap && hasEdgeWall(engine.gameMap.getTile(worldX, worldY + 1), 'n'));
    const hasW = hasEdgeWall(tile, 'w') || (engine?.gameMap && hasEdgeWall(engine.gameMap.getTile(worldX - 1, worldY), 'e'));

    if (hasN || hasE || hasS || hasW) {
      const sheet = (imageLoader.tileSet === 'spritesheet') ? sprites?.['tile_spritesheet'] : null;
      if (sheet) {
        const bitmask = (hasN ? 1 : 0) + (hasE ? 2 : 0) + (hasS ? 4 : 0) + (hasW ? 8 : 0);
        const cellSize = 128;
        ctx.drawImage(sheet, bitmask * cellSize, 0, cellSize, cellSize, screenX, screenY, tileSize, tileSize);
      } else {
        const isBW = imageLoader.tileSet === 'b&w';
        const coreColor   = isBW ? '#bfbfbf' : '#a83838';
        const casingColor = isBW ? '#1c1c1c' : '#2a0a0a';
        const coreW   = Math.max(6, Math.floor(tileSize * 0.16));
        const casingW = coreW + Math.max(4, Math.floor(tileSize * 0.12));
        ctx.lineCap = 'butt';

        const gmap = engine?.gameMap;
        const getTile = (tx, ty) => gmap ? gmap.getTile(tx, ty) : null;
        const wallAtN = (tx, ty) => hasEdgeWall(getTile(tx, ty), 'n') || hasEdgeWall(getTile(tx, ty - 1), 's');
        const wallAtS = (tx, ty) => hasEdgeWall(getTile(tx, ty), 's') || hasEdgeWall(getTile(tx, ty + 1), 'n');
        const wallAtW = (tx, ty) => hasEdgeWall(getTile(tx, ty), 'w') || hasEdgeWall(getTile(tx - 1, ty), 'e');
        const wallAtE = (tx, ty) => hasEdgeWall(getTile(tx, ty), 'e') || hasEdgeWall(getTile(tx + 1, ty), 'w');

        const nLeftConnect  = hasN && (wallAtN(worldX - 1, worldY) || wallAtW(worldX, worldY) || wallAtW(worldX, worldY - 1));
        const nRightConnect = hasN && (wallAtN(worldX + 1, worldY) || wallAtE(worldX, worldY) || wallAtE(worldX, worldY - 1));
        const sLeftConnect  = hasS && (wallAtS(worldX - 1, worldY) || wallAtW(worldX, worldY + 1) || wallAtW(worldX, worldY));
        const sRightConnect = hasS && (wallAtS(worldX + 1, worldY) || wallAtE(worldX, worldY + 1) || wallAtE(worldX, worldY));
        const wTopConnect    = hasW && (wallAtW(worldX, worldY - 1) || wallAtN(worldX, worldY) || wallAtN(worldX - 1, worldY));
        const wBottomConnect = hasW && (wallAtW(worldX, worldY + 1) || wallAtS(worldX, worldY) || wallAtS(worldX - 1, worldY));
        const eTopConnect    = hasE && (wallAtE(worldX, worldY - 1) || wallAtN(worldX + 1, worldY) || wallAtN(worldX, worldY));
        const eBottomConnect = hasE && (wallAtE(worldX, worldY + 1) || wallAtS(worldX + 1, worldY) || wallAtS(worldX, worldY));

        ctx.strokeStyle = casingColor;
        ctx.lineWidth = casingW;
        if (hasN) { const x1 = nLeftConnect  ? screenX : screenX - casingW/2; const x2 = nRightConnect ? screenX + tileSize : screenX + tileSize + casingW/2; ctx.beginPath(); ctx.moveTo(x1, screenY); ctx.lineTo(x2, screenY); ctx.stroke(); }
        if (hasS) { const x1 = sLeftConnect  ? screenX : screenX - casingW/2; const x2 = sRightConnect ? screenX + tileSize : screenX + tileSize + casingW/2; ctx.beginPath(); ctx.moveTo(x1, screenY + tileSize); ctx.lineTo(x2, screenY + tileSize); ctx.stroke(); }
        if (hasW) { const y1 = wTopConnect    ? screenY : screenY - casingW/2; const y2 = wBottomConnect ? screenY + tileSize : screenY + tileSize + casingW/2; ctx.beginPath(); ctx.moveTo(screenX, y1); ctx.lineTo(screenX, y2); ctx.stroke(); }
        if (hasE) { const y1 = eTopConnect    ? screenY : screenY - casingW/2; const y2 = eBottomConnect ? screenY + tileSize : screenY + tileSize + casingW/2; ctx.beginPath(); ctx.moveTo(screenX + tileSize, y1); ctx.lineTo(screenX + tileSize, y2); ctx.stroke(); }

        ctx.strokeStyle = coreColor;
        ctx.lineWidth = coreW;
        if (hasN) { ctx.beginPath(); ctx.moveTo(screenX - coreW/2, screenY); ctx.lineTo(screenX + tileSize + coreW/2, screenY); ctx.stroke(); }
        if (hasS) { ctx.beginPath(); ctx.moveTo(screenX - coreW/2, screenY + tileSize); ctx.lineTo(screenX + tileSize + coreW/2, screenY + tileSize); ctx.stroke(); }
        if (hasW) { ctx.beginPath(); ctx.moveTo(screenX, screenY - coreW/2); ctx.lineTo(screenX, screenY + tileSize + coreW/2); ctx.stroke(); }
        if (hasE) { ctx.beginPath(); ctx.moveTo(screenX + tileSize, screenY - coreW/2); ctx.lineTo(screenX + tileSize, screenY + tileSize + coreW/2); ctx.stroke(); }
      }
    }

    // Subtle grid line (same as drawTile)
    ctx.strokeStyle = engine.renderDebugColors ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(screenX, screenY, tileSize, tileSize);
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
