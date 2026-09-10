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
  isTerrainDestructible,
  isTerrainFlyable
} from '../../client/src/game/map/TerrainTypes.js';
import { Tile } from '../../client/src/game/map/Tile.js';
import { LineOfSight } from '../../client/src/game/utils/LineOfSight.js';

// The expected matrix: [walkable, blocksSight, destructible, blocksFlight].
// blocksFlight is only ever true for full-height obstacles — the low ones a
// recon drone clears (fence, water) are walkable=false but flyable.
const EXPECTED = {
  grass:       [true,  false, false, false],
  road:        [true,  false, false, false],
  sidewalk:    [true,  false, false, false],
  transition:  [true,  false, false, false],
  floor:       [true,  false, false, false],
  garagefloor: [true,  false, false, false],
  tent_floor:  [true,  false, false, false],
  wall:        [false, true,  true,  true ],
  building:    [false, true,  true,  true ],
  fence:       [false, true,  false, false],
  tree:        [false, true,  false, true ],
  tent_wall:   [false, true,  false, true ],
  brick:       [false, true,  false, true ],
  metal_wall:  [false, true,  false, true ],
  water:       [false, false, false, false],
  deep_water:  [false, false, false, false],
  window:      [false, false, false, true ]
};

describe('T2 terrain property matrix', () => {
  it('TERRAIN_PROPS covers exactly the expected terrain set', () => {
    expect(Object.keys(TERRAIN_PROPS).sort()).toEqual(Object.keys(EXPECTED).sort());
  });

  for (const [terrain, [walkable, blocksSight, destructible, blocksFlight]] of Object.entries(EXPECTED)) {
    it(`${terrain}: walkable=${walkable}, blocksSight=${blocksSight}, destructible=${destructible}, blocksFlight=${blocksFlight}`, () => {
      const props = getTerrainProps(terrain);
      expect(props.walkable).toBe(walkable);
      expect(props.blocksSight).toBe(blocksSight);
      expect(props.destructible).toBe(destructible);
      expect(props.blocksFlight).toBe(blocksFlight);

      // The routed consumers must agree with the table (the drift this test pins):
      expect(isTerrainWalkable(terrain)).toBe(walkable);
      expect(terrainBlocksSight(terrain)).toBe(blocksSight);
      expect(isTerrainDestructible(terrain)).toBe(destructible);
      expect(isTerrainFlyable(terrain)).toBe(!blocksFlight);
      expect(new Tile(0, 0, terrain).isWalkable()).toBe(walkable);
      // A flying device gets the flight gate, everything else the walk gate.
      expect(new Tile(0, 0, terrain).isWalkable(null, { flying: true })).toBe(!blocksFlight);
      expect(LineOfSight.isTerrainBlocking(terrain)).toBe(blocksSight);
    });
  }

  it('unknown terrains fall back to open ground', () => {
    expect(getTerrainProps('nonexistent_terrain')).toEqual({
      walkable: true,
      blocksSight: false,
      destructible: false,
      blocksFlight: false
    });
    expect(isTerrainWalkable('nonexistent_terrain')).toBe(true);
    expect(terrainBlocksSight('nonexistent_terrain')).toBe(false);
  });

  it('LineOfSight.isTerrainBlocking still honors the ignoreTerrain override', () => {
    expect(LineOfSight.isTerrainBlocking('wall', ['wall'])).toBe(false);
    expect(LineOfSight.isTerrainBlocking('wall', [])).toBe(true);
  });
});
