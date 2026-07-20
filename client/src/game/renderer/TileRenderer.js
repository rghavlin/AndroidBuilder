/**
 * TileRenderer - Pure rendering functions for map terrain and overlays
 */
import { imageLoader } from '../../game/utils/ImageLoader.js';
import { configManager } from '../../game/utils/ConfigManager.js';

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
  'road': '#262626',
  'transition': '#262626',
  'sidewalk': '#555',
  'wall': '#888',     // High-contrast structural gray
  'building': '#6a6a6a', // Concrete/Building gray, slightly darker for contrast
  'fence': '#4a3728', 
  'tree': '#064e3b',
  'tent_wall': '#78716c',
  'tent_floor': '#5b4d3d', 
  'floor': '#3a3a3a', // Raised from pure #333 so procedural detail reads
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

// Steampunk: warm sepia/bronze palette
const STEAMPUNK_TERRAIN_COLORS = {
  'grass': '#8a7d5a',
  'road': '#6b5f4a',
  'transition': '#6b5f4a',
  'sidewalk': '#9c8f74',
  'wall': '#5c4a32',
  'building': '#7a6a50',
  'fence': '#4a3a26',
  'tree': '#4d5c3a',
  'tent_wall': '#8a7a5c',
  'tent_floor': '#a89a7c',
  'floor': '#b0a288',
  'water': '#4a5c6a',
  'dirt': '#7a6a50'
};

const BW_TERRAIN_COLORS = {
  'grass': '#4a4c4f',       // Lighter outdoor grass, clearly distinct from indoor floors
  'road': '#363638',        // Mid-dark gray road, slightly darker than floor for contrast
  'transition': '#363638',
  'sidewalk': '#555555',    // Medium gray
  'wall': '#9a9a9e',        // Bright cool gray for high contrast structure
  'building': '#2a2a2c',    // Building mass, darker than road so roofs/exteriors read as architecture
  'fence': '#666666',       // Light mid-gray
  'tree': '#111111',        // Almost black
  'tent_wall': '#888888',
  'tent_floor': '#2a2c2f',  // Dark floor with cool tint
  'floor': '#282a2d',       // Slightly raised dark indoor floor so details show
  'water': '#101010',       // Darkest
  'dirt': '#3a3a3c'         // Earthy mid-gray, distinct from grass
};

const GRASS_VARIANTS = [
  { col: 0, row: 15 }, { col: 1, row: 15 }, { col: 2, row: 15 }, { col: 3, row: 15 },
  { col: 0, row: 14 }, { col: 1, row: 14 }, { col: 2, row: 14 }, { col: 3, row: 14 }
];

/**
 * Draw a simple no-texture grass pattern: a few short vertical strokes so grass
 * tiles read as vegetation rather than a flat color patch. Positions are
 * deterministic from tile coordinates.
 */
function drawNoTextureGrass(ctx, screenX, screenY, tileSize, x, y) {
  const count = 3 + (Math.abs((x * 13) ^ (y * 7)) % 4);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = Math.max(1, Math.floor(tileSize * 0.06));
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < count; i++) {
    const hx = Math.abs((x * 31 + y * 17 + i * 11) % 100);
    const hy = Math.abs((x * 17 + y * 31 + i * 13) % 100);
    const px = screenX + (hx / 100) * tileSize;
    const py = screenY + (hy / 100) * tileSize;
    const bladeH = tileSize * (0.15 + (hx % 10) / 100);
    ctx.moveTo(px, py + bladeH / 2);
    ctx.lineTo(px, py - bladeH / 2);
  }
  ctx.stroke();
}

/**
 * Draw a subtle tactical tile pattern on floor tiles to break up flat color.
 * Uses deterministic pseudo-random values from tile coordinates so the detail
 * is stable across chunk rebuilds and zooms.
 */
function drawFloorTilePattern(ctx, screenX, screenY, tileSize, x, y, theme) {
  const hash = Math.abs((x * 31) ^ (y * 17));
  const baseAlpha = theme === 'light' ? 0.05 : 0.07;
  const lineAlpha = baseAlpha + (hash % 5) / 400;

  ctx.save();
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'miter';

  // Very subtle panel / grout lines so large rooms read as tiled concrete.
  ctx.strokeStyle = theme === 'light' ? `rgba(0,0,0,${lineAlpha})` : `rgba(255,255,255,${lineAlpha})`;
  ctx.lineWidth = Math.max(1, Math.floor(tileSize * 0.03));
  const pad = tileSize * 0.12;
  ctx.strokeRect(screenX + pad, screenY + pad, tileSize - pad * 2, tileSize - pad * 2);

  // A few tiny scuff marks / stains.
  const scuffs = 2 + (hash % 3);
  ctx.fillStyle = theme === 'light' ? `rgba(0,0,0,${lineAlpha * 0.6})` : `rgba(255,255,255,${lineAlpha * 0.6})`;
  for (let i = 0; i < scuffs; i++) {
    const sx = screenX + ((hash + i * 47) % 100) / 100 * tileSize;
    const sy = screenY + ((hash + i * 73) % 100) / 100 * tileSize;
    const sw = tileSize * (0.08 + ((hash + i * 13) % 6) / 100);
    const sh = tileSize * 0.03;
    ctx.fillRect(sx, sy, sw, sh);
  }

  ctx.restore();
}

/**
 * Draw drop shadows beneath wall edges to give walls visual weight and separate
 * them from the floor.
 */
function drawWallShadow(ctx, screenX, screenY, tileSize, hasN, hasE, hasS, hasW, theme) {
  const shadowSize = Math.max(2, Math.floor(tileSize * 0.12));
  const shadowAlpha = theme === 'light' ? 0.14 : 0.32;

  ctx.save();
  ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;

  if (hasN) ctx.fillRect(screenX, screenY, tileSize, shadowSize);
  if (hasS) ctx.fillRect(screenX, screenY + tileSize - shadowSize, tileSize, shadowSize);
  if (hasW) ctx.fillRect(screenX, screenY, shadowSize, tileSize);
  if (hasE) ctx.fillRect(screenX + tileSize - shadowSize, screenY, shadowSize, tileSize);

  ctx.restore();
}

/**
 * Darken the inner corners where walls meet to create ambient occlusion and
 * make corners read as solid architectural joins.
 */
function drawWallAmbientOcclusion(ctx, screenX, screenY, tileSize, hasN, hasE, hasS, hasW, theme) {
  const cornerSize = Math.max(4, Math.floor(tileSize * 0.22));
  const aoAlpha = theme === 'light' ? 0.1 : 0.28;

  ctx.save();
  ctx.fillStyle = `rgba(0, 0, 0, ${aoAlpha})`;

  const corners = [
    [hasN && hasW, screenX, screenY],
    [hasN && hasE, screenX + tileSize - cornerSize, screenY],
    [hasS && hasW, screenX, screenY + tileSize - cornerSize],
    [hasS && hasE, screenX + tileSize - cornerSize, screenY + tileSize - cornerSize]
  ];

  for (const [active, cx, cy] of corners) {
    if (active) {
      ctx.fillRect(cx, cy, cornerSize, cornerSize);
    }
  }

  ctx.restore();
}

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
        const isSteampunk = document.documentElement.classList.contains('steampunk');
        const theme = isSteampunk ? 'steampunk' : (isLight ? 'light' : 'dark');
        // Use structural mapping for important types to guarantee visibility
        const colors = imageLoader.tileSet === 'none' ? BW_TERRAIN_COLORS : (isSteampunk ? STEAMPUNK_TERRAIN_COLORS : (isLight ? LIGHT_TERRAIN_COLORS : TERRAIN_COLORS));
        const isStructural = ['wall', 'building', 'fence', 'tent_wall', 'water'].includes(tile.terrain);
        ctx.fillStyle = (isStructural ? colors[tile.terrain] : (tile.color || colors[tile.terrain])) || '#222';
        ctx.fillRect(screenX, screenY, tileSize, tileSize);

        // Subtle per-tile floor variation for the grayscale no-texture mode.
        // This breaks up large uniform rooms so they don't look like a flat void.
        if (tile.terrain === 'floor' && imageLoader.tileSet === 'none' && !engine.renderDebugColors) {
            const hash = Math.abs((x * 31) ^ (y * 17)) % 16;
            const alpha = 0.025 + (hash / 16) * 0.045;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fillRect(screenX, screenY, tileSize, tileSize);

            // Tactical tile pattern: faint grout lines and scuff marks.
            drawFloorTilePattern(ctx, screenX, screenY, tileSize, x, y, theme);
        }

        // Simple grass blade pattern when no tile sprites are loaded.
        if (tile.terrain === 'grass' && imageLoader.tileSet === 'none' && !engine.renderDebugColors) {
            drawNoTextureGrass(ctx, screenX, screenY, tileSize, x, y);
        }

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
                                sx, sy, sDim, sDim,
                                screenX, screenY, tileSize, tileSize
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
                        if (isLight && imageLoader.tileSet !== 'b&w') ctx.globalAlpha = 0.25;
                        ctx.drawImage(sprite, screenX, screenY, tileSize, tileSize);
                        if (isLight && imageLoader.tileSet !== 'b&w') ctx.globalAlpha = 1.0;
                    } else {
                        // Reactive lazy-loading for missing tiles
                        imageLoader.getTileImage(terrainKey);
                    }
                }
            }
        }

        // Step B.5: Draw Decoration Layer (on top of terrain, below walls/fog)
        if (tile.decoration && !engine.renderDebugColors) {
            let decorType = 'outdoor';
            if (['brokenchair', 'crack', 'debris', 'paper', 'tabledebris'].includes(tile.decoration)) {
                decorType = 'indoor';
            } else if (['road1', 'road2', 'road3'].includes(tile.decoration)) {
                decorType = 'roadandsidewalk';
            }
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
            // Drop-shadow and corner occlusion give walls weight before the wall lines are drawn.
            drawWallShadow(ctx, screenX, screenY, tileSize, hasN, hasE, hasS, hasW, theme);
            drawWallAmbientOcclusion(ctx, screenX, screenY, tileSize, hasN, hasE, hasS, hasW, theme);

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
                const isBW = imageLoader.tileSet === 'none' || imageLoader.tileSet === 'b&w';
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
        if (engine.renderDebugColors) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(screenX, screenY, tileSize, tileSize);
        }
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
    const isSteampunk = document.documentElement.classList.contains('steampunk');
    const theme = isSteampunk ? 'steampunk' : (isLight ? 'light' : 'dark');
    const colors = imageLoader.tileSet === 'none' ? BW_TERRAIN_COLORS : (isSteampunk ? STEAMPUNK_TERRAIN_COLORS : (isLight ? LIGHT_TERRAIN_COLORS : TERRAIN_COLORS));
    const isStructural = ['wall', 'building', 'fence', 'tent_wall', 'water'].includes(tile.terrain);
    ctx.fillStyle = (isStructural ? colors[tile.terrain] : (tile.color || colors[tile.terrain])) || '#222';
    ctx.fillRect(screenX, screenY, tileSize, tileSize);

    // Subtle per-tile floor variation for the grayscale no-texture mode.
    if (tile.terrain === 'floor' && imageLoader.tileSet === 'none' && !engine.renderDebugColors) {
      const hash = Math.abs((worldX * 31) ^ (worldY * 17)) % 16;
      const alpha = 0.025 + (hash / 16) * 0.045;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fillRect(screenX, screenY, tileSize, tileSize);

      // Tactical tile pattern: faint grout lines and scuff marks.
      drawFloorTilePattern(ctx, screenX, screenY, tileSize, worldX, worldY, theme);
    }

    // Simple grass blade pattern when no tile sprites are loaded.
    if (tile.terrain === 'grass' && imageLoader.tileSet === 'none' && !engine.renderDebugColors) {
      drawNoTextureGrass(ctx, screenX, screenY, tileSize, worldX, worldY);
    }

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
              if (isLight && imageLoader.tileSet !== 'b&w') ctx.globalAlpha = 0.25;
              ctx.drawImage(
                sheet,
                mapping.col * cellSize + inset, mapping.row * cellSize + inset,
                cellSize - inset * 2, cellSize - inset * 2,
                screenX, screenY, tileSize, tileSize
              );
              if (isLight && imageLoader.tileSet !== 'b&w') ctx.globalAlpha = 1.0;
            }
          } else {
            imageLoader.getTileImage(tile.terrain);
          }
        } else {
          const terrainKey = tile.terrain === 'transition' ? 'road' : tile.terrain;
          const sprite = sprites[`tile_${terrainKey}`];
          if (sprite) {
            if (isLight && imageLoader.tileSet !== 'b&w') ctx.globalAlpha = 0.25;
            ctx.drawImage(sprite, screenX, screenY, tileSize, tileSize);
            if (isLight && imageLoader.tileSet !== 'b&w') ctx.globalAlpha = 1.0;
          } else {
            imageLoader.getTileImage(terrainKey);
          }
        }
      }
    }

    // Decoration layer
    if (tile.decoration && !engine.renderDebugColors) {
      let decorType = 'outdoor';
      if (['brokenchair', 'crack', 'debris', 'paper', 'tabledebris'].includes(tile.decoration)) {
        decorType = 'indoor';
      } else if (['road1', 'road2', 'road3'].includes(tile.decoration)) {
        decorType = 'roadandsidewalk';
      }
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
      // Drop-shadow and corner occlusion give walls weight before the wall lines are drawn.
      drawWallShadow(ctx, screenX, screenY, tileSize, hasN, hasE, hasS, hasW, theme);
      drawWallAmbientOcclusion(ctx, screenX, screenY, tileSize, hasN, hasE, hasS, hasW, theme);

      const sheet = (imageLoader.tileSet === 'spritesheet') ? sprites?.['tile_spritesheet'] : null;
      if (sheet) {
        const bitmask = (hasN ? 1 : 0) + (hasE ? 2 : 0) + (hasS ? 4 : 0) + (hasW ? 8 : 0);
        const cellSize = 128;
        ctx.drawImage(sheet, bitmask * cellSize, 0, cellSize, cellSize, screenX, screenY, tileSize, tileSize);
      } else {
        const isBW = imageLoader.tileSet === 'none' || imageLoader.tileSet === 'b&w';
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
    if (engine.renderDebugColors) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(screenX, screenY, tileSize, tileSize);
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
  },

  /**
   * Draw one floorplan furniture piece (from gameMap.furniture) in world-pixel
   * space. piece = {type, x, y, w, h, rot}: x/y anchor tile of the ROTATED
   * footprint, w/h rotated footprint in tiles, rot = quarter-turns clockwise.
   *
   * `theme` is one of 'light' | 'steampunk' | 'dark'. Passing it avoids a
   * DOM classList query for every piece, which matters when hundreds of pieces
   * are drawn per frame.
   */
  drawFurniture: (ctx, piece, tileSize, theme) => {
    const px = piece.x * tileSize;
    const py = piece.y * tileSize;
    const wpx = piece.w * tileSize;
    const hpx = piece.h * tileSize;
    const rot = piece.rot || 0;
    // Base (unrotated) pixel dims: swapped for 90°/270° rotations
    const bw = (rot % 2) ? hpx : wpx;
    const bh = (rot % 2) ? wpx : hpx;

    ctx.save();
    ctx.translate(px + wpx / 2, py + hpx / 2);
    ctx.rotate(rot * Math.PI / 2);

    // Apply transparent styling for CAD-style furniture outlines
    const furnitureOpacity = configManager.get('furnitureOpacity') ?? 0.85;
    ctx.globalAlpha = furnitureOpacity;

    // Small drop shadow to ground the furniture against dark floors.
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = tileSize * 0.12;
    ctx.shadowOffsetY = tileSize * 0.12;
    TileRenderer.drawCADDecoration(ctx, -bw / 2, -bh / 2, tileSize, piece.type, theme);
    ctx.restore();
  },

  /**
   * Procedurally draw CAD-style multi-tile furniture outlines at pixel origin
   * (x, y) in base orientation ("head" at top). Sizes derive from tileSize
   * (bed/table 2x3 tiles, couch 2x2, desk 2x1, bathtub 1x2, toilet 1x1).
   */
  drawCADDecoration: (ctx, x, y, tileSize, type, theme) => {
    ctx.save();

    // Architect blueprint style: high-contrast strokes so furniture reads clearly
    // against both dark and light floors. Fills stay subtle so only the lines pop.
    // `theme` is usually provided by the caller (MapCanvas) so we don't query the
    // DOM for every single piece; fall back to DOM only for standalone callers.
    if (!theme) {
      const isLight = document.documentElement.classList.contains('light');
      const isSteampunk = document.documentElement.classList.contains('steampunk');
      theme = isSteampunk ? 'steampunk' : (isLight ? 'light' : 'dark');
    }

    if (theme === 'light') {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    } else if (theme === 'steampunk') {
        ctx.strokeStyle = 'rgba(60, 40, 20, 0.95)';
        ctx.fillStyle = 'rgba(60, 40, 20, 0.12)';
    } else {
        // Dark / grayscale mode - crisp blueprint lines that read against dark floors.
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        // Cool blueprint fill, stronger than before so furniture reads as a solid surface.
        ctx.fillStyle = 'rgba(120, 160, 220, 0.16)';
    }

    ctx.lineWidth = Math.max(2.5, Math.floor(tileSize * 0.09));
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    
    const pad = tileSize * 0.1;
    
    if (type === 'bed') {
      const w = tileSize * 2 - pad * 2;
      const h = tileSize * 3 - pad * 2;
      // mattress
      ctx.fillRect(x + pad, y + pad, w, h);
      ctx.strokeRect(x + pad, y + pad, w, h);
      // headboard
      ctx.beginPath();
      ctx.moveTo(x + pad, y + pad + h * 0.06);
      ctx.lineTo(x + pad + w, y + pad + h * 0.06);
      ctx.stroke();
      // pillows
      const pillowW = (w - pad * 3) / 2;
      const pillowH = h * 0.15;
      ctx.strokeRect(x + pad * 2, y + pad * 2, pillowW, pillowH);
      ctx.strokeRect(x + pad * 3 + pillowW, y + pad * 2, pillowW, pillowH);
      // sheet/blanket divider
      ctx.beginPath();
      ctx.moveTo(x + pad, y + pad + h * 0.35);
      ctx.lineTo(x + pad + w, y + pad + h * 0.35);
      ctx.stroke();
      // footboard legs
      const leg = tileSize * 0.12;
      ctx.beginPath();
      ctx.moveTo(x + pad + leg, y + pad + h);
      ctx.lineTo(x + pad + leg, y + pad + h + leg);
      ctx.moveTo(x + pad + w - leg, y + pad + h);
      ctx.lineTo(x + pad + w - leg, y + pad + h + leg);
      ctx.stroke();
    } else if (type === 'table') {
      // 6-person dining table (spans 2x3 tiles)
      const tablePad = tileSize * 0.3;
      const tW = tileSize * 2 - tablePad * 2;
      const tH = tileSize * 3 - tablePad * 2;
      ctx.fillRect(x + tablePad, y + tablePad, tW, tH);
      ctx.strokeRect(x + tablePad, y + tablePad, tW, tH);
      // center detail
      ctx.beginPath();
      ctx.ellipse(x + tileSize, y + tileSize * 1.5, tW * 0.15, tH * 0.1, 0, 0, Math.PI * 2);
      ctx.stroke();

      const chairW = tileSize * 0.45;
      const chairH = tileSize * 0.35;
      const backThick = tileSize * 0.08;
      // top/bottom chairs (horizontal backs)
      ctx.strokeRect(x + tileSize - chairW/2, y + pad, chairW, chairH);
      ctx.beginPath();
      ctx.moveTo(x + tileSize - chairW/2, y + pad + backThick);
      ctx.lineTo(x + tileSize + chairW/2, y + pad + backThick);
      ctx.stroke();

      ctx.strokeRect(x + tileSize - chairW/2, y + tileSize * 3 - pad - chairH, chairW, chairH);
      ctx.beginPath();
      ctx.moveTo(x + tileSize - chairW/2, y + tileSize * 3 - pad - backThick);
      ctx.lineTo(x + tileSize + chairW/2, y + tileSize * 3 - pad - backThick);
      ctx.stroke();

      // left/right chairs (vertical backs) - two on each long side
      const sideChairs = [
        { cx: x + pad, cy: y + tileSize - chairH/2 },
        { cx: x + pad, cy: y + tileSize * 2 - chairH/2 },
        { cx: x + tileSize * 2 - pad - chairH, cy: y + tileSize - chairH/2 },
        { cx: x + tileSize * 2 - pad - chairH, cy: y + tileSize * 2 - chairH/2 }
      ];
      for (const c of sideChairs) {
        ctx.strokeRect(c.cx, c.cy, chairH, chairW);
        const backX = c.cx < x + tileSize ? c.cx + backThick : c.cx + chairH - backThick;
        ctx.beginPath();
        ctx.moveTo(backX, c.cy);
        ctx.lineTo(backX, c.cy + chairW);
        ctx.stroke();
      }
    } else if (type === 'bathtub') {
      const w = tileSize * 1 - pad * 2;
      const h = tileSize * 2 - pad * 2;
      ctx.fillRect(x + pad, y + pad, w, h);
      ctx.strokeRect(x + pad, y + pad, w, h);
      const rim = tileSize * 0.15;
      ctx.strokeRect(x + pad + rim, y + pad + rim, w - rim*2, h - rim*2);
      // drain
      ctx.beginPath();
      ctx.arc(x + tileSize/2, y + pad + h - rim * 2, tileSize * 0.06, 0, Math.PI * 2);
      ctx.stroke();
      // faucet
      ctx.beginPath();
      ctx.moveTo(x + tileSize/2, y + pad + rim);
      ctx.lineTo(x + tileSize/2, y + pad + rim * 1.6);
      ctx.lineTo(x + tileSize/2 + rim * 0.8, y + pad + rim * 1.3);
      ctx.stroke();
    } else if (type === 'toilet') {
      const w = tileSize * 1 - pad * 2;
      const h = tileSize * 1 - pad * 2;
      // tank
      ctx.fillRect(x + pad, y + pad, w, h * 0.3);
      ctx.strokeRect(x + pad, y + pad, w, h * 0.3);
      // bowl
      ctx.beginPath();
      ctx.ellipse(x + tileSize/2, y + pad + h * 0.65, w * 0.35, h * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // seat line
      ctx.beginPath();
      ctx.ellipse(x + tileSize/2, y + pad + h * 0.65, w * 0.22, h * 0.22, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (type === 'desk') {
      const w = tileSize * 2 - pad * 2;
      const h = tileSize * 1 - pad * 2;
      ctx.fillRect(x + pad, y + pad, w, h);
      ctx.strokeRect(x + pad, y + pad, w, h);
      // monitor
      const monW = tileSize * 0.6;
      const monH = h * 0.35;
      ctx.strokeRect(x + tileSize - monW/2, y + pad + h * 0.1, monW, monH);
      // keyboard
      ctx.beginPath();
      ctx.moveTo(x + tileSize - monW * 0.6, y + pad + h * 0.65);
      ctx.lineTo(x + tileSize + monW * 0.6, y + pad + h * 0.65);
      ctx.stroke();
      // drawer unit
      ctx.strokeRect(x + tileSize - tileSize*0.3, y + pad * 1.5 + h * 0.55, tileSize*0.6, h * 0.25);
      ctx.beginPath();
      ctx.moveTo(x + tileSize, y + pad * 1.5 + h * 0.55);
      ctx.lineTo(x + tileSize, y + pad * 1.5 + h * 0.8);
      ctx.stroke();
    } else if (type === 'chair') {
      const w = tileSize * 1 - pad * 2;
      const h = tileSize * 1 - pad * 2;
      const armW = tileSize * 0.3; // Armrest width
      const backThick = tileSize * 0.3; // Backrest thickness

      // Base outline (full body of the chair)
      ctx.fillRect(x + pad, y + pad, w, h);
      ctx.strokeRect(x + pad, y + pad, w, h);

      // Backrest horizontal line (between the armrests)
      ctx.beginPath();
      ctx.moveTo(x + pad + armW, y + pad + backThick);
      ctx.lineTo(x + pad + w - armW, y + pad + backThick);
      ctx.stroke();

      // Armrest side vertical lines
      ctx.beginPath();
      ctx.moveTo(x + pad + armW, y + pad);
      ctx.lineTo(x + pad + armW, y + pad + h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + pad + w - armW, y + pad);
      ctx.lineTo(x + pad + w - armW, y + pad + h);
      ctx.stroke();
    } else if (type === 'couch') {
      const w = tileSize * 3 - pad * 2;
      const h = tileSize * 1 - pad * 2;
      const armW = tileSize * 0.3; // Armrest width
      const backThick = tileSize * 0.3; // Backrest thickness

      // Base outline (full body of the couch)
      ctx.fillRect(x + pad, y + pad, w, h);
      ctx.strokeRect(x + pad, y + pad, w, h);

      // Backrest horizontal line (between the armrests)
      ctx.beginPath();
      ctx.moveTo(x + pad + armW, y + pad + backThick);
      ctx.lineTo(x + pad + w - armW, y + pad + backThick);
      ctx.stroke();

      // Armrest side vertical lines
      ctx.beginPath();
      ctx.moveTo(x + pad + armW, y + pad);
      ctx.lineTo(x + pad + armW, y + pad + h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + pad + w - armW, y + pad);
      ctx.lineTo(x + pad + w - armW, y + pad + h);
      ctx.stroke();

      // Seat cushion dividers (divide the remaining width into 3)
      const seatW = (w - armW * 2) / 3;
      for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x + pad + armW + seatW * i, y + pad + backThick);
        ctx.lineTo(x + pad + armW + seatW * i, y + pad + h);
        ctx.stroke();
      }
    } else if (type === 'counter') {
      // Kitchen counter (2x1): worktop with a sink basin and a 4-burner cooktop.
      const w = tileSize * 2 - pad * 2;
      const h = tileSize * 1 - pad * 2;
      ctx.fillRect(x + pad, y + pad, w, h);
      ctx.strokeRect(x + pad, y + pad, w, h);
      // Sink basin (left half)
      const basinW = tileSize * 0.5;
      const basinH = h * 0.5;
      ctx.strokeRect(x + tileSize * 0.5 - basinW / 2, y + pad + (h - basinH) / 2, basinW, basinH);
      // Faucet tick above the basin
      ctx.beginPath();
      ctx.arc(x + tileSize * 0.5, y + pad + (h - basinH) / 2, tileSize * 0.05, 0, Math.PI * 2);
      ctx.stroke();
      // Cooktop (right half): four burner rings
      const burnR = tileSize * 0.11;
      const cx = x + tileSize * 1.5;
      const cy = y + pad + h / 2;
      const off = tileSize * 0.22;
      for (const [ox, oy] of [[-off, -off * (h < off * 2 ? 0.6 : 1)], [off, -off * (h < off * 2 ? 0.6 : 1)], [-off, off * (h < off * 2 ? 0.6 : 1)], [off, off * (h < off * 2 ? 0.6 : 1)]]) {
        ctx.beginPath();
        ctx.arc(cx + ox, cy + oy, burnR, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
};
