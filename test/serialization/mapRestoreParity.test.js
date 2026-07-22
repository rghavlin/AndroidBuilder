import { describe, it, expect } from 'vitest';
// Wave 2 P0 (R8#2): GameMap.fromJSONSelective — the path used on EVERY map
// transition — skipped buildings/specialBuildings restoration and the crop
// metadata recompute that fromJSON() ran, so building-dependent logic ran on
// an empty array after a transition. Both paths now share _restoreHeaderFields
// and _restoreAllCropMetadata; this pins that they agree.
import { GameMap } from '../../client/src/game/map/GameMap.js';

function buildSourceMap() {
  const gm = new GameMap(8, 8);
  gm.buildings = [
    { id: 'b1', x: 1, y: 1, width: 3, height: 3, type: 'house' },
    { id: 'b2', x: 5, y: 4, width: 2, height: 2, type: 'gas_station' },
  ];
  gm.specialBuildings = gm.buildings;
  gm.mapNumber = 3;
  return gm;
}

describe('Wave 2 P0 · fromJSON / fromJSONSelective restore parity (R8#2)', () => {
  it('fromJSONSelective restores buildings (not just fromJSON)', async () => {
    const data = buildSourceMap().toJSON();

    const full = await GameMap.fromJSON(data);
    const selective = await GameMap.fromJSONSelective(data);

    expect(full.buildings.length).toBe(2);
    // The regression: selective used to leave this empty.
    expect(selective.buildings.length).toBe(2);
    expect(selective.buildings).toEqual(full.buildings);
    // specialBuildings alias is wired on both paths.
    expect(selective.specialBuildings).toBe(selective.buildings);
  });

  it('fromJSONSelective recomputes crop metadata on every tile', async () => {
    const data = buildSourceMap().toJSON();

    // A freshly restored Tile has no cropInfo property until the recompute
    // pass runs. fromJSON always ran it; fromJSONSelective used to skip it.
    const selective = await GameMap.fromJSONSelective(data);
    const full = await GameMap.fromJSON(data);

    const sTile = selective.getTile(0, 0);
    const fTile = full.getTile(0, 0);
    // `null` (defined) proves the recompute ran; `undefined` would mean it was skipped.
    expect(sTile.cropInfo).toBe(null);
    expect(fTile.cropInfo).toBe(null);
  });

  it('the live restored map does not alias the save POJO buildings (T8)', async () => {
    const data = buildSourceMap().toJSON();
    const selective = await GameMap.fromJSONSelective(data);
    expect(selective.buildings).not.toBe(data.buildings);
    selective.buildings.push({ id: 'mutated' });
    expect(data.buildings.length).toBe(2);
  });
});
