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
import { EntityFactory } from '../../client/src/game/EntityFactory.js';
import { AISystem } from '../../client/src/game/systems/AISystem.js';
import { MovementSystem } from '../../client/src/game/systems/MovementSystem.js';
import engine from '../../client/src/game/GameEngine.js';
import {
  getTurretKeepOutZone,
  isInTurretKeepOut,
  isPatientZeroStepAllowed
} from '../../client/src/game/systems/PatientZeroGuard.js';

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

describe('Patient Zero stays out of turret range', () => {
  it('spawns outside the town turrets\' keep-out zone on map 5 (several seeds)', async () => {
    for (const seed of [1234, 7, 42, 999]) {
      const gm = await populate(PATIENT_ZERO_MAP, seed);
      const zone = getTurretKeepOutZone(gm);
      expect(zone.turrets.length, `seed ${seed}: turrets planned`).toBeGreaterThanOrEqual(2);
      const [pz] = patientZeroes(gm);
      expect(pz, `seed ${seed}`).toBeDefined();
      expect(isInTurretKeepOut(zone, pz.gridX, pz.gridY), `seed ${seed}`).toBe(false);
    }
  });

  /**
   * Open floor with a town compound whose turrets sit at (28,30) and (32,30).
   * The player stands between them, in full view, while the zombie starts
   * south of the keep-out edge and hunts for many turns.
   */
  function chaseIntoTown(subtype) {
    gameRandom.seed(3);
    engine.reset();
    const gm = new GameMap(60, 70);
    for (let y = 0; y < 70; y++) for (let x = 0; x < 60; x++) gm.setTerrain(x, y, 'floor');
    gm.metadata = { ...(gm.metadata || {}), townSquareCompound: { fenceBounds: { x1: 20, y1: 20, x2: 40, y2: 30 } } };
    engine.gameMap = gm;

    const player = EntityFactory.createPlayer(30, 31);
    const zombie = EntityFactory.createZombie(30, 52, subtype, `z-${subtype}`);
    gm.addEntity(player, 30, 31);
    gm.addEntity(zombie, 30, 52);

    const zone = getTurretKeepOutZone(gm);
    let enteredZone = false;
    for (let turn = 0; turn < 20; turn++) {
      zombie.currentAP = 12;
      for (let cycle = 0; cycle < 12; cycle++) {
        const vision = zombie.getComponent('Vision');
        if (vision) vision.visibleEntities = [player.id];
        if (AISystem.process([player, zombie], null, engine, []) === 0) break;
        MovementSystem.process([zombie], null, engine, []);
        zombie.removeComponent('DamageIntent');
        if (isInTurretKeepOut(zone, zombie.gridX, zombie.gridY)) enteredZone = true;
      }
    }
    return { enteredZone, zombie };
  }

  it('an ordinary zombie walks right into turret range (control)', () => {
    expect(chaseIntoTown('basic').enteredZone).toBe(true);
  });

  it('Patient Zero never steps into turret range, even chasing a visible player', () => {
    const { enteredZone, zombie } = chaseIntoTown(PATIENT_ZERO_SUBTYPE);
    expect(enteredZone).toBe(false);
    // It did advance to the edge rather than freezing at its start tile.
    expect(zombie.gridY).toBeLessThan(52);
  });

  it('a Patient Zero already inside the zone may still walk back out', () => {
    const zone = { turrets: [{ x: 0, y: 0 }], radius: 10 };
    expect(isPatientZeroStepAllowed(zone, 5, 0, 6, 0)).toBe(true);  // outward
    expect(isPatientZeroStepAllowed(zone, 5, 0, 4, 0)).toBe(false); // inward
    expect(isPatientZeroStepAllowed(zone, 11, 0, 10, 0)).toBe(false); // crossing in
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
