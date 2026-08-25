import { describe, it, expect, beforeAll } from 'vitest';
// Corridor maps need their own spawn rules. They are ~90% walkable, 20 tiles
// across, and the player must walk every row to get out, so area-scaled counts
// (which assume a wide map with buildings and route choice) land as a far higher
// encounter rate. Both corridor ends are also transition tiles, so the player can
// arrive at either one and needs breathing room there.
import { TemplateMapGenerator } from '../../client/src/game/map/TemplateMapGenerator.js';
import { GameMap } from '../../client/src/game/map/GameMap.js';
import { ZombieSpawner } from '../../client/src/game/utils/ZombieSpawner.js';
import { getProgressionForMap, BASELINE_MAP_AREA } from '../../client/src/game/config/ProgressionConfig.js';
import { gameRandom } from '../../client/src/game/utils/SeededRandom.js';

async function populate(template, mapNumber) {
  gameRandom.seed(4242);
  const tmg = new TemplateMapGenerator();
  const md = tmg.generateFromTemplate(template, { mapNumber });
  const gm = new GameMap(md.width, md.height);
  await tmg.applyToGameMap(gm, md);
  gm.mapNumber = mapNumber;
  gm.template = template;

  // Exactly what WorldManager passes: progression counts scaled by map area.
  const p = getProgressionForMap(mapNumber);
  const m = (gm.width * gm.height) / BASELINE_MAP_AREA;
  const s = (v) => Math.floor(v * m);
  const sr = (r) => ({ min: s(r.min), max: s(r.max) });
  ZombieSpawner.spawnZombies(gm, { x: Math.floor(gm.width / 2), y: gm.height - 2 }, {
    basicCount: s(p.basicCount), crawlerRange: sr(p.crawlerRange),
    runnerCount: s(p.runnerCount), peeperCount: s(p.peeperCount),
    acidRange: sr(p.acidRange), fatRange: sr(p.fatRange),
    spitterCount: s(p.spitterCount || 0), maxTotal: s(p.maxTotal)
  });
  return gm;
}

const zombiesOf = (gm) => gm.getEntitiesByType('zombie');
const rowOf = (z) => z.gridY ?? z.y;

describe('corridor zombie spawning', () => {
  let corridors;

  beforeAll(async () => {
    corridors = {};
    for (const n of [2, 4, 6]) corridors[n] = await populate('corridor', n);
  });

  it('populates by corridor length, not by area', () => {
    for (const n of [2, 4, 6]) {
      const gm = corridors[n];
      const rowsPerZombie = gm.height / zombiesOf(gm).length;
      // Area scaling produced 165-271 zombies on an 800-row corridor (1 every
      // 3-5 rows), which is a wall of bodies on a map about starvation.
      expect(rowsPerZombie, `map ${n} rows per zombie`).toBeGreaterThan(5);
      expect(rowsPerZombie, `map ${n} rows per zombie`).toBeLessThan(20);
    }
  });

  it('keeps difficulty climbing with map number', () => {
    const counts = [2, 4, 6].map(n => zombiesOf(corridors[n]).length);
    expect(counts[1]).toBeGreaterThan(counts[0]);
    expect(counts[2]).toBeGreaterThan(counts[1]);
  });

  it('keeps the full zombie mix — rescaling must not starve the specials', () => {
    // Regression: capping the running TOTAL instead of rescaling each count let
    // `basic` (spawned first, ~60% of the mix) consume the whole budget, so
    // corridors came out 100% basic and maps 2 and 6 played identically.
    for (const n of [2, 4, 6]) {
      const kinds = new Set(zombiesOf(corridors[n]).map(z => z.subtype));
      expect(kinds.size, `map ${n} only had: ${[...kinds].join(',')}`).toBeGreaterThan(3);
      expect(kinds.has('basic')).toBe(true);
    }
  });

  it('leaves a clear buffer at BOTH ends, since either can be the arrival tile', () => {
    for (const n of [2, 4, 6]) {
      const gm = corridors[n];
      const rows = zombiesOf(gm).map(rowOf);
      expect(Math.min(...rows), `map ${n} north end`).toBeGreaterThanOrEqual(15);
      expect(Math.max(...rows), `map ${n} south end`).toBeLessThan(gm.height - 15);
    }
  });

  it('does not change spawning on non-corridor maps', async () => {
    const road = await populate('road', 5);
    const zs = zombiesOf(road);
    // A normal road map is dense and spawns right up to its edges — the corridor
    // rules must not leak into it.
    expect(zs.length).toBeGreaterThan(60);
    expect(Math.min(...zs.map(rowOf))).toBeLessThan(15);
    expect(road.height / zs.length).toBeLessThan(5);
  });
});
