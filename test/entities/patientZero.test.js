import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
// Patient Zero is the game's one unique zombie: a single copy on map 5, a plain
// zombie in a fight, and the only source of the Patient Zero Head — which the
// player cuts off its corpse with a knife instead of the usual brainstem.
import { ZombieTypes, PATIENT_ZERO_SUBTYPE } from '../../client/src/game/entities/ZombieTypes.js';
import {
  getCorpseOverrides,
  PATIENT_ZERO_HEAD_DEF_ID
} from '../../client/src/game/entities/ZombieCorpseConfig.js';
import { ItemDefs, createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { TemplateMapGenerator } from '../../client/src/game/map/TemplateMapGenerator.js';
import { GameMap } from '../../client/src/game/map/GameMap.js';
import { ZombieSpawner, PATIENT_ZERO_MAP } from '../../client/src/game/utils/ZombieSpawner.js';
import { getTemplateForMapNumber } from '../../client/src/game/config/TemplateConfig.js';
import { getProgressionForMap, BASELINE_MAP_AREA } from '../../client/src/game/config/ProgressionConfig.js';
import { gameRandom } from '../../client/src/game/utils/SeededRandom.js';

/** Populate a map exactly the way WorldManager does for that map number. */
async function populate(mapNumber, seed = 1234) {
  gameRandom.seed(seed);
  const template = getTemplateForMapNumber(mapNumber);
  const tmg = new TemplateMapGenerator();
  const md = tmg.generateFromTemplate(template, { mapNumber });
  const gm = new GameMap(md.width, md.height);
  await tmg.applyToGameMap(gm, md);
  gm.mapNumber = mapNumber;
  gm.template = template;

  const p = getProgressionForMap(mapNumber);
  const m = (gm.width * gm.height) / BASELINE_MAP_AREA;
  const s = (v) => Math.floor(v * m);
  const sr = (r) => ({ min: s(r.min), max: s(r.max) });
  ZombieSpawner.spawnZombies(gm, { x: Math.floor(gm.width / 2), y: 1 }, {
    basicCount: s(p.basicCount), crawlerRange: sr(p.crawlerRange),
    runnerCount: s(p.runnerCount), peeperCount: s(p.peeperCount),
    acidRange: sr(p.acidRange), fatRange: sr(p.fatRange),
    spitterCount: s(p.spitterCount || 0), maxTotal: s(p.maxTotal)
  });
  return gm;
}

const patientZeroes = (gm) =>
  gm.getEntitiesByType('zombie').filter(z => z.subtype === PATIENT_ZERO_SUBTYPE);

describe('Patient Zero zombie', () => {
  it('fights exactly like a standard zombie', () => {
    const pz = ZombieTypes[PATIENT_ZERO_SUBTYPE];
    const basic = ZombieTypes.basic;
    expect(pz).toBeDefined();
    expect(pz.name).toBe('Patient Zero');
    for (const stat of ['hp', 'maxAP', 'sightRange', 'accuracy', 'moveCostMultiplier', 'defense', 'lootTable']) {
      expect(pz[stat], `stat ${stat}`).toBe(basic[stat]);
    }
    expect(pz.combat).toEqual(basic.combat);
  });

  it('uses its own sprite, which exists on disk', () => {
    expect(ZombieTypes[PATIENT_ZERO_SUBTYPE].spriteKey).toBe('patientZero');
    expect(fs.existsSync(path.resolve('client/public/images/entities/patientZero.png'))).toBe(true);
  });
});

describe('Patient Zero spawning', () => {
  let map5;

  beforeAll(async () => {
    map5 = await populate(PATIENT_ZERO_MAP);
  });

  it('places exactly one Patient Zero on map 5', () => {
    expect(patientZeroes(map5)).toHaveLength(1);
  });

  it('places none on any other map', async () => {
    for (const n of [1, 3, 6]) {
      const gm = await populate(n);
      expect(patientZeroes(gm), `map ${n}`).toHaveLength(0);
    }
  });

  it('never doubles up when a populated map is re-populated', () => {
    ZombieSpawner.spawnPatientZero(map5, { x: 0, y: 0 });
    ZombieSpawner.spawnPatientZero(map5, { x: 0, y: 0 });
    expect(patientZeroes(map5)).toHaveLength(1);
  });

  it('keeps its distance from the arrival tile', async () => {
    const spawn = { x: Math.floor(map5.width / 2), y: 1 };
    const [pz] = patientZeroes(map5);
    const dist = Math.abs((pz.gridX ?? pz.x) - spawn.x) + Math.abs((pz.gridY ?? pz.y) - spawn.y);
    expect(dist).toBeGreaterThanOrEqual(20);
  });
});

describe('Patient Zero corpse and head', () => {
  it('drops a Patient Zero Corpse that is black on white in every theme', () => {
    const overrides = getCorpseOverrides(PATIENT_ZERO_SUBTYPE);
    expect(overrides.name).toBe('Patient Zero Corpse');
    expect(overrides.imageId).toBe('patientZeroCorpse');
    expect(overrides.backgroundColor).toBe('#FFFFFF');
    // fixedAppearance is what opts the art out of the per-theme icon filters.
    expect(overrides.fixedAppearance).toBe(true);
    expect(fs.existsSync(path.resolve('client/public/images/items/patientZeroCorpse.png'))).toBe(true);

    const corpse = createItemFromDef('zombie.corpse', overrides);
    expect(corpse.zombieSubtype).toBe(PATIENT_ZERO_SUBTYPE);
    expect(corpse.name).toBe('Patient Zero Corpse');
  });

  it('defines the head as a 2x2 item with its own art', () => {
    const def = ItemDefs[PATIENT_ZERO_HEAD_DEF_ID];
    expect(def).toBeDefined();
    expect(def.name).toBe('Patient Zero Head');
    expect(def.imageId).toBe('patientZeroHead');
    expect(def.width).toBe(2);
    expect(def.height).toBe(2);
    expect(def.noLoot).toBe(true);
    expect(fs.existsSync(path.resolve('client/public/images/items/patientZeroHead.png'))).toBe(true);

    const head = new Item(createItemFromDef(PATIENT_ZERO_HEAD_DEF_ID));
    expect(head.name).toBe('Patient Zero Head');
    expect(head.width).toBe(2);
    expect(head.height).toBe(2);
  });

  it('is not a brainstem — the stew recipe cannot take it', () => {
    expect(PATIENT_ZERO_HEAD_DEF_ID).not.toBe('zombie.brainstem');
    expect(ItemDefs[PATIENT_ZERO_HEAD_DEF_ID].stackable).toBeUndefined();
  });
});
