import { describe, it, expect } from 'vitest';
import { planSpecialFurniture, hasSpecialFurnitureLayout } from '../../client/src/game/map/SpecialFurnitureLayouts.js';
import { SPECIAL_BUILDING_SPECS } from '../../client/src/game/map/BuildingTypes.js';
import { FURNITURE_FOOTPRINTS } from '../../client/src/game/map/FurniturePlanner.js';
import { TemplateMapGenerator } from '../../client/src/game/map/TemplateMapGenerator.js';
import { GameMap } from '../../client/src/game/map/GameMap.js';
import { gameRandom } from '../../client/src/game/utils/SeededRandom.js';

const TYPES = ['grocer', 'hardware_store', 'gas_station', 'police'];
const FRONTAGES = ['south', 'west', 'north', 'east'];

const tilesOf = (p) => {
  const t = [];
  for (let y = p.y; y < p.y + p.h; y++) for (let x = p.x; x < p.x + p.w; x++) t.push(`${x},${y}`);
  return t;
};

/** Building as drawSpecialBuilding registers it, entrance included. */
function makeBuilding(type, frontage, width, height) {
  const x = 5, y = 7;
  let entranceX, entranceY, inX, inY;
  if (frontage === 'east') { entranceX = x + width - 1; entranceY = y + Math.floor(height / 2); inX = entranceX - 1; inY = entranceY; }
  else if (frontage === 'west') { entranceX = x; entranceY = y + Math.floor(height / 2); inX = x + 1; inY = entranceY; }
  else if (frontage === 'south') { entranceX = x + Math.floor(width / 2); entranceY = y + height - 1; inX = entranceX; inY = entranceY - 1; }
  else { entranceX = x + Math.floor(width / 2); entranceY = y; inX = entranceX; inY = y + 1; }
  return { type, x, y, width, height, frontage, entranceX, entranceY, inX, inY };
}

function checkLayout(b) {
  const pieces = planSpecialFurniture(b);
  expect(pieces.length).toBeGreaterThan(0);

  const seen = new Set();
  for (const p of pieces) {
    const base = FURNITURE_FOOTPRINTS[p.type];
    expect(base, p.type).toBeTruthy();
    expect([p.w, p.h].sort()).toEqual([base.w, base.h].sort());
    for (const k of tilesOf(p)) {
      const [tx, ty] = k.split(',').map(Number);
      expect(tx >= b.x && tx < b.x + b.width && ty >= b.y && ty < b.y + b.height, `${p.type} at ${k} outside`).toBe(true);
      expect(seen.has(k), `${p.type} overlaps at ${k}`).toBe(false);
      seen.add(k);
    }
  }
  // The entrance and the tile just inside it stay walkable.
  expect(seen.has(`${b.entranceX},${b.entranceY}`), 'entrance blocked').toBe(false);
  expect(seen.has(`${b.inX},${b.inY}`), 'tile inside entrance blocked').toBe(false);
  return pieces;
}

describe('Special building furniture layouts', () => {
  it('covers the stores and the police station, not the fire station', () => {
    for (const t of TYPES) expect(hasSpecialFurnitureLayout(t)).toBe(true);
    expect(hasSpecialFurnitureLayout('firestation')).toBe(false);
  });

  it('fits every type at spec size in every frontage', () => {
    for (const type of TYPES) {
      const { width, height } = SPECIAL_BUILDING_SPECS[type];
      for (const f of FRONTAGES) {
        // Spec dims are canonical (front = width); a side frontage swaps them.
        const sideways = f === 'east' || f === 'west';
        checkLayout(makeBuilding(type, f, sideways ? height : width, sideways ? width : height));
      }
    }
  });

  it('still fits when a lot clamps the building below spec', () => {
    for (const f of FRONTAGES) checkLayout(makeBuilding('grocer', f, 14, 14));
  });

  it('gives stores shelves and the police station desks and benches', () => {
    const types = (t) => new Set(planSpecialFurniture(makeBuilding(t, 'south', SPECIAL_BUILDING_SPECS[t].width, SPECIAL_BUILDING_SPECS[t].height)).map(p => p.type));
    for (const t of ['grocer', 'hardware_store', 'gas_station']) expect([...types(t)]).toEqual(['shelf']);
    expect(types('police')).toEqual(new Set(['desk', 'bench']));
  });

  it('stamps special-building furniture onto generated maps, on floor', async () => {
    const log = console.log;
    console.log = () => {};
    try {
      const gen = new TemplateMapGenerator();
      let specialsFurnished = 0;
      for (let i = 0; i < 3; i++) {
        gameRandom.seed(4200 + i);
        const { gameMap } = await gen.generateValidatedMap(
          'winding_road', { mapNumber: 4, roadThickness: 5, sidewalkThickness: 1 }, GameMap, { maxAttempts: 4 }
        );
        const placed = new Set(gameMap.furniture.map(p => `${p.type}:${p.x}:${p.y}`));
        for (const b of gameMap.buildings.filter(bb => hasSpecialFurnitureLayout(bb.type))) {
          expect(b.furniturePlan?.length, b.type).toBeGreaterThan(0);
          specialsFurnished++;
          for (const p of b.furniturePlan) {
            expect(placed.has(`${p.type}:${p.x}:${p.y}`)).toBe(true);
            for (const k of tilesOf(p)) {
              const [tx, ty] = k.split(',').map(Number);
              expect(gameMap.getTile(tx, ty)?.terrain, `${b.type} ${p.type} at ${k}`).toBe('floor');
            }
          }
        }
      }
      expect(specialsFurnished).toBeGreaterThan(0);
    } finally {
      console.log = log;
    }
  }, 60000);
});
