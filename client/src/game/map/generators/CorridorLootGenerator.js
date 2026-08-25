import { createItemFromDef, ItemDefs } from '../../inventory/ItemDefs.js';
import { ItemCategory, Rarity, RarityWeights } from '../../inventory/traits.js';
import { BASELINE_MAP_AREA } from '../../config/ProgressionConfig.js';
import { gameRandom } from '../../utils/SeededRandom.js';
import { planRoadVehicles } from '../RoadVehiclePlanner.js';

/**
 * CorridorLootGenerator
 * 
 * Special loot generator for corridor maps:
 * - Total loot is significantly less than standard maps.
 * - Items generated are predominantly sticks and stones.
 * - Food, water, and weapons (excluding sticks) are extremely rare.
 * - Other items are slightly rarer than normal.
 * - Strictly NO wild crops, electric mowers, generators, or toy wagons.
 */
export class CorridorLootGenerator {
  constructor() {
    this.itemKeys = null;
  }

  /**
   * Spawn corridor loot on the provided gameMap
   * @param {import('../GameMap.js').GameMap} gameMap 
   * @param {number} mapNumber 
   * @param {object} options 
   */
  spawnLoot(gameMap, mapNumber = 1, options = {}) {
    const amountLevel = options.amount || 'some'; // 'lots' | 'some' | 'little'
    this.initItemKeys();

    // 1. Gather all walkable outdoor tiles (road, sidewalk, grass)
    const outdoorTiles = [];
    for (let y = 0; y < gameMap.height; y++) {
      for (let x = 0; x < gameMap.width; x++) {
        const tile = gameMap.getTile(x, y);
        if (!tile || !tile.isWalkable()) continue;

        if (['road', 'sidewalk', 'grass'].includes(tile.terrain)) {
          outdoorTiles.push({ x, y });
        }
      }
    }

    if (outdoorTiles.length === 0) return;

    // 2. Determine outdoor drop count (much less than standard map)
    const currentArea = gameMap.width * gameMap.height;
    const areaMultiplier = currentArea / BASELINE_MAP_AREA;

    let baseDrops = 4;
    if (amountLevel === 'lots') baseDrops = 7;
    else if (amountLevel === 'little') baseDrops = 2;

    const outdoorDropCount = Math.max(1, Math.floor((baseDrops + gameRandom.nextInt(0, 2)) * areaMultiplier));
    const selectedOutdoor = this.getRandomSubarray(outdoorTiles, outdoorDropCount);

    selectedOutdoor.forEach(pos => {
      const items = this.generateRandomItems(mapNumber);
      if (items.length > 0) {
        const existing = gameMap.getItemsOnTile(pos.x, pos.y) || [];
        gameMap.setItemsOnTile(pos.x, pos.y, [...existing, ...items]);
      }
    });

    console.log(`[CorridorLootGenerator] Outdoor: Spawned ${outdoorDropCount} sparse loot drops on ${outdoorTiles.length} tiles (Area Multiplier: ${areaMultiplier.toFixed(2)})`);

    // 3. Low spots for water puddles (calculated as half of what they would be on a normal map of similar size)
    const normalLowSpotBase = 3 + gameRandom.nextInt(0, 2); // 3-5 base on normal map
    const normalLowSpotCount = Math.floor(normalLowSpotBase * areaMultiplier);

    // Half of what they would be on a normal map of similar size
    let lowSpotCount = Math.max(1, Math.round(normalLowSpotCount * 0.5));
    if (amountLevel === 'lots') {
      lowSpotCount = Math.max(1, Math.round(normalLowSpotCount * 0.75));
    } else if (amountLevel === 'little') {
      lowSpotCount = Math.max(1, Math.round(normalLowSpotCount * 0.35));
    }

    const potentialLowSpots = outdoorTiles.filter(pos => (gameMap.getItemsOnTile(pos.x, pos.y) || []).length === 0);
    const lowSpots = this.getRandomSubarray(potentialLowSpots, lowSpotCount);
    gameMap.lowSpots = lowSpots;

    if (lowSpots.length > 0 && gameRandom.next() < 0.5) {
      const pos = lowSpots[0];
      const puddle = createItemFromDef('environment.water_puddle');
      if (puddle) {
        puddle.ammoCount = 25 + gameRandom.nextInt(0, 25);
        gameMap.setItemsOnTile(pos.x, pos.y, [puddle]);
        console.log(`[CorridorLootGenerator] Spawned water puddle at (${pos.x}, ${pos.y})`);
      }
    }

    // 4. Grass scattering pass: mostly sticks and stones along the grass roadside
    let sticksSpawned = 0;
    let stonesSpawned = 0;

    let grassStickChance = 0.012;
    let grassStoneChance = 0.012;
    if (amountLevel === 'lots') {
      grassStickChance = 0.018;
      grassStoneChance = 0.018;
    } else if (amountLevel === 'little') {
      grassStickChance = 0.006;
      grassStoneChance = 0.006;
    }

    for (let y = 0; y < gameMap.height; y++) {
      for (let x = 0; x < gameMap.width; x++) {
        const tile = gameMap.getTile(x, y);
        if (tile && tile.terrain === 'grass' && tile.isWalkable()) {
          const existing = gameMap.getItemsOnTile(x, y) || [];
          if (existing.length === 0) {
            const roll = gameRandom.next();
            if (roll < grassStickChance) {
              const stick = createItemFromDef('weapon.stick');
              if (stick) {
                gameMap.setItemsOnTile(x, y, [stick]);
                sticksSpawned++;
              }
            } else if (roll < (grassStickChance + grassStoneChance)) {
              const stone = createItemFromDef('crafting.stone');
              if (stone) {
                gameMap.setItemsOnTile(x, y, [stone]);
                stonesSpawned++;
              }
            }
          }
        }
      }
    }

    console.log(`[CorridorLootGenerator] Grass Pass: Spawned ${sticksSpawned} sticks and ${stonesSpawned} stones.`);

    // 5. Road vehicles outline planning
    planRoadVehicles(gameMap);
  }

  /**
   * Initialize catalog item keys for corridor loot
   */
  initItemKeys() {
    if (!this.itemKeys || this.itemKeys.length === 0) {
      this.itemKeys = Object.keys(ItemDefs).filter(key => {
        if (key.includes('.icon') || key.includes('.sprite')) return false;
        if (ItemDefs[key].noLoot) return false;

        // Strictly exclude forbidden items
        if (key === 'furniture.electric_mower') return false;
        if (key === 'furniture.generator') return false;
        if (key === 'vehicle.toy_wagon') return false;
        if (key.startsWith('environment.wild_')) return false;
        if (key === 'placeable.bed') return false;
        if (key === 'backpack.hiking' || key === 'backpack.standard') return false;

        return true;
      });
    }
  }

  /**
   * Pick a weighted item key specifically tuned for corridor map rules
   * - Sticks and stones: heavy dominant weight
   * - Food, water, weapons: extremely rare (0.05x weight / 95% rejection)
   * - Everything else: slightly rarer than normal (0.5x weight)
   */
  getWeightedCorridorItemKey(mapNumber = 1) {
    this.initItemKeys();

    // 70% of rolls are directly sticks or stones
    if (gameRandom.next() < 0.70) {
      return gameRandom.next() < 0.5 ? 'weapon.stick' : 'crafting.stone';
    }

    const filteredKeys = this.itemKeys.filter(key => {
      const def = ItemDefs[key];
      if (!def) return false;
      if (def.spawnBias && def.spawnBias.outside === 0) return false;
      return true;
    });

    const totalWeight = filteredKeys.reduce((sum, key) => {
      const def = ItemDefs[key];
      const rarity = def.rarity || Rarity.COMMON;
      let weight = RarityWeights[rarity] || 100;

      if (def.spawnBias) {
        weight *= (def.spawnBias.outside ?? 1);
      }

      const isStick = key === 'weapon.stick';
      const isStone = key === 'crafting.stone';
      const isFood = (key.startsWith('food.') || (def.categories && def.categories.includes(ItemCategory.FOOD))) && key !== 'food.whiskey';
      const isWater = key === 'food.waterbottle' || key.includes('water');
      const isWeapon = (key.startsWith('weapon.') || (def.categories && def.categories.includes(ItemCategory.WEAPONS))) && !isStick;

      if (isStick || isStone) {
        weight *= 5.0; // Sticks and stones are high priority
      } else if (isFood || isWater || isWeapon) {
        // Food, water, and weapons are extremely rare
        weight *= 0.05;
      } else {
        // Everything else is slightly more rare than normal
        weight *= 0.5;
      }

      return sum + weight;
    }, 0);

    let random = gameRandom.next() * totalWeight;
    for (const key of filteredKeys) {
      const def = ItemDefs[key];
      const rarity = def.rarity || Rarity.COMMON;
      let weight = RarityWeights[rarity] || 100;

      if (def.spawnBias) {
        weight *= (def.spawnBias.outside ?? 1);
      }

      const isStick = key === 'weapon.stick';
      const isStone = key === 'crafting.stone';
      const isFood = (key.startsWith('food.') || (def.categories && def.categories.includes(ItemCategory.FOOD))) && key !== 'food.whiskey';
      const isWater = key === 'food.waterbottle' || key.includes('water');
      const isWeapon = (key.startsWith('weapon.') || (def.categories && def.categories.includes(ItemCategory.WEAPONS))) && !isStick;

      if (isStick || isStone) {
        weight *= 5.0;
      } else if (isFood || isWater || isWeapon) {
        weight *= 0.05;
      } else {
        weight *= 0.5;
      }

      if (random < weight) return key;
      random -= weight;
    }

    return gameRandom.next() < 0.5 ? 'weapon.stick' : 'crafting.stone';
  }

  /**
   * Generate 1-2 random items with corridor constraints
   */
  generateRandomItems(mapNumber = 1) {
    const count = 1 + (gameRandom.next() < 0.25 ? 1 : 0); // Mostly 1 item, 25% chance for 2 items
    const items = [];

    for (let i = 0; i < count; i++) {
      const randomKey = this.getWeightedCorridorItemKey(mapNumber);
      const def = ItemDefs[randomKey];
      if (!def) continue;

      const isStick = randomKey === 'weapon.stick';
      const isFood = (randomKey.startsWith('food.') || (def.categories && def.categories.includes(ItemCategory.FOOD))) && randomKey !== 'food.whiskey';
      const isWater = randomKey === 'food.waterbottle' || randomKey.includes('water');
      const isWeapon = (randomKey.startsWith('weapon.') || (def.categories && def.categories.includes(ItemCategory.WEAPONS))) && !isStick;

      // Double-check extreme rarity filter: 90% rejection on rolled food, water, or weapon
      if ((isFood || isWater || isWeapon) && gameRandom.next() < 0.90) {
        // Fallback to stick or stone
        const fallbackKey = gameRandom.next() < 0.5 ? 'weapon.stick' : 'crafting.stone';
        const fallbackItem = createItemFromDef(fallbackKey);
        if (fallbackItem) items.push(fallbackItem);
        continue;
      }

      const selectedItem = createItemFromDef(randomKey);
      if (selectedItem) {
        items.push(selectedItem);
      }
    }

    return items;
  }

  /**
   * Random subarray helper
   */
  getRandomSubarray(arr, size) {
    const shuffled = gameRandom.shuffle([...arr]);
    return shuffled.slice(0, Math.min(size, shuffled.length));
  }
}
