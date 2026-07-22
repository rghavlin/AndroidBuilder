import { describe, it, expect } from 'vitest';
// T2 regression test: pins the terrain property matrix so the previously
// copy-pasted blocking lists can never drift apart again. Every assertion is
// written out explicitly per terrain — if a new terrain is added or a property
// is flipped, this file must be updated deliberately.
import {
  TERRAIN_PROPS,
  getTerrainProps,
  isTerrainWalkable,
  terrainBlocksSight,
  isTerrainDestructible
} from '../../client/src/game/map/TerrainTypes.js';
import { Tile } from '../../client/src/game/map/Tile.js';
import { LineOfSight } from '../../client/src/game/utils/LineOfSight.js';

// The expected matrix: [walkable, blocksSight, destructible]
const EXPECTED = {
  grass:       [true,  false, false],
  road:        [true,  false, false],
  sidewalk:    [true,  false, false],
  transition:  [true,  false, false],
  floor:       [true,  false, false],
  garagefloor: [true,  false, false],
  tent_floor:  [true,  false, false],
  wall:        [false, true,  true ],
  building:    [false, true,  true ],
  fence:       [false, true,  false],
  tree:        [false, true,  false],
  tent_wall:   [false, true,  false],
  brick:       [false, true,  false],
  metal_wall:  [false, true,  false],
  water:       [false, false, false],
  deep_water:  [false, false, false],
  window:      [false, false, false]
};

describe('T2 terrain property matrix', () => {
  it('TERRAIN_PROPS covers exactly the expected terrain set', () => {
    expect(Object.keys(TERRAIN_PROPS).sort()).toEqual(Object.keys(EXPECTED).sort());
  });

  for (const [terrain, [walkable, blocksSight, destructible]] of Object.entries(EXPECTED)) {
    it(`${terrain}: walkable=${walkable}, blocksSight=${blocksSight}, destructible=${destructible}`, () => {
      const props = getTerrainProps(terrain);
      expect(props.walkable).toBe(walkable);
      expect(props.blocksSight).toBe(blocksSight);
      expect(props.destructible).toBe(destructible);

      // The routed consumers must agree with the table (the drift this test pins):
      expect(isTerrainWalkable(terrain)).toBe(walkable);
      expect(terrainBlocksSight(terrain)).toBe(blocksSight);
      expect(isTerrainDestructible(terrain)).toBe(destructible);
      expect(new Tile(0, 0, terrain).isWalkable()).toBe(walkable);
      expect(LineOfSight.isTerrainBlocking(terrain)).toBe(blocksSight);
    });
  }

  it('unknown terrains fall back to open ground', () => {
    expect(getTerrainProps('nonexistent_terrain')).toEqual({
      walkable: true,
      blocksSight: false,
      destructible: false
    });
    expect(isTerrainWalkable('nonexistent_terrain')).toBe(true);
    expect(terrainBlocksSight('nonexistent_terrain')).toBe(false);
  });

  it('LineOfSight.isTerrainBlocking still honors the ignoreTerrain override', () => {
    expect(LineOfSight.isTerrainBlocking('wall', ['wall'])).toBe(false);
    expect(LineOfSight.isTerrainBlocking('wall', [])).toBe(true);
  });
});
