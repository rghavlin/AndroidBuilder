import { describe, it, expect } from 'vitest';
// Wave 2 P0 (R43#1): TileChunkCache.invalidateTile existed with correct
// semantics but had ZERO callers — MapCanvas only ever called invalidateAll,
// so mid-game tile mutations (explosion breaches a wall, a door/window is
// removed) rendered stale chunks until the next zoom/theme/map change. The
// method is now wired from MapCanvas' terrainChanged / structure add-remove
// subscriptions. This pins the neighbourhood-dirtying contract the wiring
// relies on (edge walls read one tile across chunk borders, so the 8
// neighbouring chunks must dirty too).
import { TileChunkCache, TILE_CHUNK_SIZE } from '../../client/src/game/renderer/TileChunkCache.js';

describe('Wave 2 P0 · TileChunkCache.invalidateTile neighbourhood (R43#1)', () => {
  it('dirties the tile chunk plus all 8 neighbours (3x3)', () => {
    const cache = new TileChunkCache();
    // Tile well inside chunk (1,1): worldX/Y = 20 with a 16-tile chunk.
    const cx = 1, cy = 1;
    cache.invalidateTile(cx * TILE_CHUNK_SIZE + 4, cy * TILE_CHUNK_SIZE + 4);

    const expected = new Set();
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        expected.add(`${cx + dx},${cy + dy}`);
      }
    }
    expect(cache._dirty.size).toBe(9);
    for (const key of expected) expect(cache._dirty.has(key)).toBe(true);
  });

  it('a tile on a chunk border dirties both chunks it straddles', () => {
    const cache = new TileChunkCache();
    // Last tile of chunk 0 (worldX = 15) — neighbourhood spans chunk -1..1.
    cache.invalidateTile(TILE_CHUNK_SIZE - 1, TILE_CHUNK_SIZE - 1);
    expect(cache._dirty.has('0,0')).toBe(true);
    expect(cache._dirty.has('1,1')).toBe(true);
    expect(cache._dirty.has('-1,-1')).toBe(true);
  });

  it('invalidateAll clears both chunk and dirty state', () => {
    const cache = new TileChunkCache();
    cache.invalidateTile(40, 40);
    expect(cache._dirty.size).toBeGreaterThan(0);
    cache.invalidateAll();
    expect(cache._dirty.size).toBe(0);
    expect(cache._chunks.size).toBe(0);
  });
});
