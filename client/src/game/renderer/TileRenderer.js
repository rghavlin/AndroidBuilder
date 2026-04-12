/**
 * TileRenderer - Pure rendering functions for map terrain and overlays
 */
import { imageLoader } from '../../game/utils/ImageLoader.js';

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
            const isColorOnly = ['sidewalk', 'window'].includes(tile.terrain);
            
            if (!isColorOnly) {
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
