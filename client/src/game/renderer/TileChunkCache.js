import { TileRenderer } from './TileRenderer.js';

export const TILE_CHUNK_SIZE = 16;

/**
 * Caches rendered tile chunks as offscreen canvases so that static terrain,
 * decorations, and edge walls are not redrawn every frame at 60 fps.
 *
 * Only static content is cached here. Dynamic overlays (FOV fog, unexplored
 * black, fire animation, night tint) are applied by MapCanvas on top of the
 * blitted chunks each frame — they cost only simple fillRect calls.
 *
 * Invalidation rules:
 *   • invalidateAll()     — on image reload, map change, or tile-size change.
 *   • invalidateTile(x,y) — when a specific world tile's terrain/walls change.
 *     Also dirtys the 8 neighbouring chunks because edge walls read 1 tile
 *     outside each chunk border.
 */
export class TileChunkCache {
  constructor() {
    this._chunks = new Map(); // "cx,cy" → { canvas, ctx, tileSize }
    this._dirty  = new Set(); // "cx,cy" keys that must be re-rendered
  }

  invalidateTile(worldX, worldY) {
    const cx = Math.floor(worldX / TILE_CHUNK_SIZE);
    const cy = Math.floor(worldY / TILE_CHUNK_SIZE);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        this._dirty.add(`${cx + dx},${cy + dy}`);
      }
    }
  }

  invalidateAll() {
    this._chunks.clear();
    this._dirty.clear();
  }

  /**
   * Release chunks that are no longer on screen to cap GPU memory use.
   * Call once per frame after blitting all visible chunks.
   * @param {Set<string>} visibleKeys — set of "cx,cy" keys rendered this frame.
   */
  evictOffscreen(visibleKeys) {
    for (const key of this._chunks.keys()) {
      if (!visibleKeys.has(key)) {
        this._chunks.delete(key);
      }
    }
  }

  /**
   * Return the offscreen canvas for the given chunk, re-rendering only when
   * the chunk is dirty or the physical tile size has changed.
   */
  getChunk(cx, cy, rTileSize, gameMap, engine, sprites) {
    const key = `${cx},${cy}`;
    const existing = this._chunks.get(key);

    if (existing && !this._dirty.has(key) && existing.tileSize === rTileSize) {
      return existing.canvas;
    }

    const chunkPixels = TILE_CHUNK_SIZE * rTileSize;
    let entry = existing;

    // Recreate the backing canvas if the pixel dimensions changed.
    if (!entry || entry.canvas.width !== chunkPixels || entry.canvas.height !== chunkPixels) {
      const canvas = document.createElement('canvas');
      canvas.width  = chunkPixels;
      canvas.height = chunkPixels;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      entry = { canvas, ctx, tileSize: rTileSize };
    }

    const { ctx } = entry;
    ctx.clearRect(0, 0, chunkPixels, chunkPixels);

    const startWorldX = cx * TILE_CHUNK_SIZE;
    const startWorldY = cy * TILE_CHUNK_SIZE;

    for (let localY = 0; localY < TILE_CHUNK_SIZE; localY++) {
      for (let localX = 0; localX < TILE_CHUNK_SIZE; localX++) {
        const worldX = startWorldX + localX;
        const worldY = startWorldY + localY;
        if (worldX < 0 || worldY < 0 || worldX >= gameMap.width || worldY >= gameMap.height) continue;
        const tile = gameMap.getTile(worldX, worldY);
        if (tile) {
          TileRenderer.drawTileStatic(ctx, localX, localY, worldX, worldY, rTileSize, tile, engine, sprites);
        }
      }
    }

    entry.tileSize = rTileSize;
    this._dirty.delete(key);
    this._chunks.set(key, entry);
    return entry.canvas;
  }
}
