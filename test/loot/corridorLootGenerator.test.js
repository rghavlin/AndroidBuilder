import { describe, it, expect, beforeEach } from 'vitest';
import { GameMap } from '../../client/src/game/map/GameMap.js';
import { CorridorLootGenerator } from '../../client/src/game/map/generators/CorridorLootGenerator.js';
import { LootGenerator } from '../../client/src/game/map/LootGenerator.js';
import { TemplateMapGenerator } from '../../client/src/game/map/TemplateMapGenerator.js';
import { gameRandom } from '../../client/src/game/utils/SeededRandom.js';
import { ItemCategory } from '../../client/src/game/inventory/traits.js';

describe('CorridorLootGenerator', () => {
  beforeEach(() => {
    gameRandom.seed(12345);
  });

  function createCorridorMap(width = 20, height = 50) {
    const map = new GameMap(width, height);
    map.template = 'corridor';
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (x === 0 || x === width - 1) {
          map.setTerrain(x, y, 'fence');
        } else if (x >= 8 && x <= 12) {
          map.setTerrain(x, y, 'road');
        } else if (x === 7 || x === 13) {
          map.setTerrain(x, y, 'sidewalk');
        } else {
          map.setTerrain(x, y, 'grass');
        }
      }
    }
    return map;
  }

  it('generates substantially less loot than standard LootGenerator', () => {
    const corridorMap = createCorridorMap(20, 50);
    const standardMap = createCorridorMap(20, 50);
    standardMap.template = 'road';

    const corridorGen = new CorridorLootGenerator();
    corridorGen.spawnLoot(corridorMap, 1, { amount: 'some' });

    const standardGen = new LootGenerator();
    standardGen.spawnLoot(standardMap, 1);

    const countItems = (map) => {
      let total = 0;
      for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
          total += (map.getItemsOnTile(x, y) || []).length;
        }
      }
      return total;
    };

    const corridorItemCount = countItems(corridorMap);
    const standardItemCount = countItems(standardMap);

    expect(corridorItemCount).toBeGreaterThan(0);
    // Standard map spawns electric mower, 2 golf carts with batteries, scooter, ~18-24 outdoor drops, grass pass, etc.
    // Corridor map should have substantially fewer items
    expect(corridorItemCount).toBeLessThan(standardItemCount);
  });

  it('generates mostly sticks and stones', () => {
    const gen = new CorridorLootGenerator();
    let stickCount = 0;
    let stoneCount = 0;
    let otherCount = 0;

    // Run across 20 procedural seeds
    for (let seed = 1; seed <= 20; seed++) {
      gameRandom.seed(seed * 777);
      const map = createCorridorMap(20, 50);
      gen.spawnLoot(map, 1, { amount: 'some' });

      for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
          const items = map.getItemsOnTile(x, y) || [];
          for (const item of items) {
            const id = item.defId || item.id;
            if (id === 'weapon.stick') stickCount++;
            else if (id === 'crafting.stone') stoneCount++;
            else otherCount++;
          }
        }
      }
    }

    const sticksAndStones = stickCount + stoneCount;
    const totalItems = sticksAndStones + otherCount;
    const stickStoneRatio = sticksAndStones / totalItems;

    // Sticks and stones must make up the clear majority (>70%) of all loot generated
    expect(stickStoneRatio).toBeGreaterThan(0.70);
  });

  it('makes food, water, and weapons extremely rare', () => {
    const gen = new CorridorLootGenerator();
    let foodWaterWeaponCount = 0;
    let totalItems = 0;

    for (let seed = 1; seed <= 30; seed++) {
      gameRandom.seed(seed * 1234);
      const map = createCorridorMap(20, 50);
      gen.spawnLoot(map, 1, { amount: 'some' });

      for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
          const items = map.getItemsOnTile(x, y) || [];
          for (const item of items) {
            totalItems++;
            const id = item.defId || item.id;
            const isStick = id === 'weapon.stick';
            const isFood = (id.startsWith('food.') || (item.categories && item.categories.includes(ItemCategory.FOOD))) && id !== 'food.whiskey';
            const isWater = id === 'food.waterbottle' || id.includes('water');
            const isWeapon = (id.startsWith('weapon.') || (item.categories && item.categories.includes(ItemCategory.WEAPONS))) && !isStick;

            if (isFood || isWater || isWeapon) {
              foodWaterWeaponCount++;
            }
          }
        }
      }
    }

    // Food, water, and weapons combined should be < 5% of all items
    const rarityRatio = foodWaterWeaponCount / totalItems;
    expect(rarityRatio).toBeLessThan(0.05);
  });

  it('strictly excludes wild crops, electric mowers, generators, and toy wagons', () => {
    const gen = new CorridorLootGenerator();

    for (let seed = 1; seed <= 30; seed++) {
      gameRandom.seed(seed * 4321);
      const map = createCorridorMap(20, 60);
      gen.spawnLoot(map, 1, { amount: 'lots' });

      for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
          const items = map.getItemsOnTile(x, y) || [];
          for (const item of items) {
            const id = item.defId || item.id;
            expect(id).not.toBe('furniture.electric_mower');
            expect(id).not.toBe('furniture.generator');
            expect(id).not.toBe('vehicle.toy_wagon');
            expect(id.startsWith('environment.wild_')).toBe(false);
            expect(item.isCrop).not.toBe(true);
          }
        }
      }
    }
  });

  it('delegates to CorridorLootGenerator when LootGenerator.spawnLoot is called with corridor template or type', () => {
    const map = createCorridorMap(20, 50);
    const lootGen = new LootGenerator();
    lootGen.spawnLoot(map, 1, { type: 'corridor' });

    let hasItems = false;
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const items = map.getItemsOnTile(x, y) || [];
        if (items.length > 0) hasItems = true;
        for (const item of items) {
          const id = item.defId || item.id;
          expect(id).not.toBe('furniture.electric_mower');
          expect(id).not.toBe('furniture.generator');
          expect(id).not.toBe('vehicle.toy_wagon');
        }
      }
    }
    expect(hasItems).toBe(true);
  });

  it('TemplateMapGenerator skips wild crops on corridor template', async () => {
    const tmg = new TemplateMapGenerator();
    const mapData = tmg.generateFromTemplate('corridor');

    let wildCropsCount = 0;
    for (let y = 0; y < mapData.height; y++) {
      for (let x = 0; x < mapData.width; x++) {
        const tile = mapData.tiles[y][x];
        const items = tile.inventoryItems || [];
        for (const item of items) {
          const id = item.defId || item.id;
          if (id?.startsWith('environment.wild_') || item.isCrop) {
            wildCropsCount++;
          }
        }
      }
    }

    expect(wildCropsCount).toBe(0);
  });

  it('calculates low spots to be approximately half of what they would be on a normal map of similar size', () => {
    // 10,000-tile map (20 x 500)
    const map = createCorridorMap(20, 500);
    const gen = new CorridorLootGenerator();
    gen.spawnLoot(map, 1, { amount: 'some' });

    // Normal map of 10,000 tiles: areaMultiplier = 10000 / 5625 = 1.778
    // Normal map lowSpotBase = 3 to 5 => normal count = 5 to 8
    // Corridor map count is half of normal: ~3 to 5 low spots
    expect(map.lowSpots).toBeDefined();
    expect(map.lowSpots.length).toBeGreaterThanOrEqual(3);
    expect(map.lowSpots.length).toBeLessThanOrEqual(5);
  });
});
