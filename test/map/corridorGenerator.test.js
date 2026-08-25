import { describe, it, expect } from 'vitest';
// CorridorGenerator is the long-haul travel template: a straight road with
// sidewalks running the full height, fenced left and right, grass either side
// and nothing else. The fences are gameplay, not scenery — they are what stops
// the player leaving the corridor sideways — so the edge assertions below are
// load-bearing, not cosmetic.
import { TemplateMapGenerator } from '../../client/src/game/map/TemplateMapGenerator.js';
import { CorridorGenerator } from '../../client/src/game/map/generators/CorridorGenerator.js';
import { TEMPLATE_METADATA } from '../../client/src/game/config/TemplateConfig.js';

// fence | grass*6 | sidewalk | road*5 | sidewalk | grass*5 | fence
const PROFILE = [
  'fence',
  ...Array(6).fill('grass'),
  'sidewalk',
  ...Array(5).fill('road'),
  'sidewalk',
  ...Array(5).fill('grass'),
  'fence'
];

describe('CorridorGenerator', () => {
  const mapData = new TemplateMapGenerator().generateFromTemplate('corridor', { mapNumber: 1 });
  // Derived, so changing the corridor length in TemplateConfig retunes this suite
  // instead of breaking it. Only the size assertion below pins actual numbers.
  const H = mapData.height;

  it('generates at the configured 20x800 size', () => {
    expect(mapData.width).toBe(20);
    expect(mapData.height).toBe(800);
    expect(TEMPLATE_METADATA.corridor.size).toEqual({ width: 20, height: 800 });
    // 800 must stay under the ~1000 Manhattan cap in Pathfinding.findPath, or
    // end-to-end paths (NPC travel goals target the map exit) silently fail.
    expect(H).toBeLessThan(1000);
    expect(PROFILE).toHaveLength(20);
  });

  it('every interior row is the same road profile', () => {
    // Rows 0 and height-1 carry the transition tile, so they are checked
    // separately below; every row between them must be identical.
    for (let y = 1; y < mapData.height - 1; y++) {
      const row = mapData.tiles[y].map(t => t.terrain);
      expect(row, `row ${y}`).toEqual(PROFILE);
    }
  });

  it('fences run the full length of both side edges', () => {
    for (let y = 0; y < mapData.height; y++) {
      expect(mapData.tiles[y][0].terrain, `left edge y=${y}`).toBe('fence');
      expect(mapData.tiles[y][mapData.width - 1].terrain, `right edge y=${y}`).toBe('fence');
    }
  });

  it('north and south transitions land on the road, not the grass', () => {
    const { transitionPoints } = mapData.metadata.spawnZones;
    expect(transitionPoints.north).toEqual({ x: 10, y: 0 });
    expect(transitionPoints.south).toEqual({ x: 10, y: H - 1 });

    expect(mapData.tiles[0][10].terrain).toBe('transition');
    expect(mapData.tiles[H - 1][10].terrain).toBe('transition');

    // The tiles flanking each transition are road, which is what makes the
    // arrival tile reachable rather than stranding the player against a fence.
    expect(mapData.tiles[0][9].terrain).toBe('road');
    expect(mapData.tiles[H - 1][11].terrain).toBe('road');
  });

  it('places no buildings — the empty roadside is the point', () => {
    expect(mapData.metadata.buildings).toHaveLength(0);
    expect(mapData.metadata.specialBuildings).toHaveLength(0);
  });

  it('starts the player on the road at the south end, off the transition tile', () => {
    const start = new CorridorGenerator().getStartPosition(20, H);
    expect(start).toEqual({ x: 10, y: H - 2 });
    expect(mapData.tiles[start.y][start.x].terrain).toBe('road');
  });

  it('honours a custom road and sidewalk thickness', () => {
    // Guards the fences-drawn-last ordering: a road wide enough to reach the
    // map edge must still not punch a hole in the boundary.
    const wide = new TemplateMapGenerator().generateFromTemplate('corridor', {
      roadThickness: 9,
      sidewalkThickness: 2
    });
    const row = wide.tiles[Math.floor(H / 2)].map(t => t.terrain);
    expect(row[0]).toBe('fence');
    expect(row[19]).toBe('fence');
    expect(row.filter(t => t === 'road')).toHaveLength(9);
    expect(row.filter(t => t === 'sidewalk')).toHaveLength(4);
  });
});
