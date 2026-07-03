import { Item } from '../inventory/Item.js';
import { ItemDefs, createItemFromDef } from '../inventory/ItemDefs.js';
import { ItemTrait, Rarity, RarityWeights, ItemCategory } from '../inventory/traits.js';
import { SPECIAL_BUILDING_LOOT, ZOMBIE_LOOT, MAP_WIDE_UNIQUES, MAP_WIDE_REQUIREMENTS } from './LootTables.js';
import { ZombieTypes } from '../entities/ZombieTypes.js';
import { LootProgression, BASELINE_MAP_AREA } from '../config/ProgressionConfig.js';
import { isInsideCompound, isInsideAnyBuilding, isInsideTollGate } from './MapUtils.js';


import { gameRandom } from '../utils/SeededRandom.js';
const LOOT_CONSTANTS = {
    GENERATOR_SPAWN_FUEL_MAX: 6, // 0-5 units
    FUEL_COVER_OFFSET: 3,
    WATER_BOTTLE_RESTRICTION_MAP: LootProgression.WATER_BOTTLE_RESTRICTION_MAP,
};

// Progressive food scarcity: 40% base rejection on Map 1, +5% per map, capped at 85%.
const FOOD_SCARCITY = { base: 0.4, perMap: 0.05, max: 0.85 };

/**
 * Chance (0..max) that a food drop is rejected on a given map, rising with depth.
 * Shared by generateRandomItems() and generateZombieLoot().
 * @param {number} mapNumber
 * @returns {number}
 */
export function getFoodRejectionChance(mapNumber) {
    const chance = FOOD_SCARCITY.base + (mapNumber - 1) * FOOD_SCARCITY.perMap;
    return Math.min(FOOD_SCARCITY.max, Math.max(0.0, chance));
}

/**
 * LootGenerator - Handles random item spawning on maps
 * Refined with rarity-based weights and specific item rules:
 * - Backpacks: Max 1 per map
 * - 9mm Ammo: Uncommon, 1-10 rounds
 * - Sniper Ammo: Rare, max 5 rounds
 * - Food/Water: Uncommon
 * - Water Bottle: Max 1 per loot pile, random fill
 * 
 * New Rules:
 * - Outdoor Loot: 15-20 drops, focus on outdoor items
 * - Indoor Loot: Building-centric logic with tiered probabilities
 */
export class LootGenerator {
    constructor() {
        this.itemKeys = [];
        this.backpacksSpawned = 0;
        this.standardBackpacksSpawnedMap = 0;
        this.hikingBackpacksSpawnedMap = 0;
    }

    /**
     * Spawn loot on the provided game map
     */
    spawnLoot(gameMap, mapNumber = 1, config = {}) {
        this.initItemKeys();
        this.backpacksSpawned = 0;
        this.standardBackpacksSpawnedMap = 0;
        this.hikingBackpacksSpawnedMap = 0;

        // 1. Identify special buildings and spawn specialized loot
        if (gameMap.specialBuildings) {
            gameMap.specialBuildings.forEach(building => {
                this.spawnSpecialLoot(gameMap, building, mapNumber);
            });
        }

        // 2. Identify remaining buildings and spawn indoor loot
        const buildings = (gameMap.buildings || []).filter(b => b.type === 'residential');
        console.log(`[LootGenerator] Detected ${buildings.length} normal buildings for indoor loot`);

        buildings.forEach((building, index) => {
            let dropCount = 0;
            
            // Get all floor tiles within the building boundary
            const buildingTiles = [];
            for (let curY = building.y + 1; curY < building.y + building.height - 1; curY++) {
                for (let curX = building.x + 1; curX < building.x + building.width - 1; curX++) {
                    const tile = gameMap.getTile(curX, curY);
                    if (tile && tile.terrain === 'floor') {
                        buildingTiles.push({ x: curX, y: curY });
                    }
                }
            }
            
            if (buildingTiles.length === 0) return;

            // Tiered probability for loot drops in building (Increased by ~10% each)
            // 95% chance for 1st
            if (gameRandom.next() < 0.95) {
                dropCount++;
                // 60% chance for 2nd
                if (gameRandom.next() < 0.60) {
                    dropCount++;
                    // 35% chance for 3rd
                    if (gameRandom.next() < 0.35) {
                        dropCount++;
                        // 15% chance for 4th
                        if (gameRandom.next() < 0.15) {
                            dropCount++;
                        }
                    }
                }
            }

            if (dropCount > 0) {
                // Exclude doorway tiles and their immediate neighbors from building loot candidates
                // PHASE 15 Fix: Strict door buffer zone (1-tile radius)
                const nonDoorTiles = buildingTiles.filter(pos => !this.isNearDoor(gameMap, pos.x, pos.y));
                const selectedTiles = this.getRandomSubarray(nonDoorTiles, dropCount);
                selectedTiles.forEach(pos => {
                    const items = this.generateRandomItems('inside', mapNumber);
                    if (items.length > 0) {
                        gameMap.setItemsOnTile(pos.x, pos.y, items);
                    }
                });
                console.log(`[LootGenerator] Building ${index + 1}: Spawned ${dropCount} loot drops on ${nonDoorTiles.length} eligible tiles (${buildingTiles.length - nonDoorTiles.length} door tiles excluded)`);
            }

            // Phase 25: Guaranteed Building Loot (Every building has 1-3 planks)
            const guaranteedTiles = buildingTiles.filter(pos => !this.isNearDoor(gameMap, pos.x, pos.y));
            if (guaranteedTiles.length > 0) {
                const plankCount = 1 + gameRandom.nextInt(0, 2);
                const plankTiles = this.getRandomSubarray(guaranteedTiles, plankCount);
                plankTiles.forEach(pos => {
                    const plank = createItemFromDef('weapon.plank');
                    if (plank) {
                        // Append to existing items if any
                        const current = gameMap.getItemsOnTile(pos.x, pos.y) || [];
                        gameMap.setItemsOnTile(pos.x, pos.y, [...current, plank]);
                    }
                });
                console.log(`[LootGenerator] Building ${index + 1}: Spawned ${plankCount} guaranteed planks`);
            }
        });

        // Starting-home loot removed: the starting house no longer exists in the game.

        // 2. Identify outdoor tiles and spawn outdoor loot (excluding doorway tiles)
        const outdoorTiles = [];
        const compound = gameMap.metadata?.townSquareCompound;
        const tollGate = gameMap.metadata?.tollGate;
        for (let y = 0; y < gameMap.height; y++) {
            for (let x = 0; x < gameMap.width; x++) {
                if (isInsideCompound(compound, x, y)) continue;
                if (isInsideTollGate(tollGate, x, y)) continue;


                const tile = gameMap.getTile(x, y);
                if (!tile || !tile.isWalkable()) continue;
                
                // PHASE 15 Fix: Strict door buffer zone for outdoor loot
                if (this.isNearDoor(gameMap, x, y)) continue;

                if (['road', 'sidewalk', 'grass'].includes(tile.terrain)) {
                    outdoorTiles.push({ x, y });
                }
            }
        }

        const currentArea = gameMap.width * gameMap.height;
        const areaMultiplier = currentArea / BASELINE_MAP_AREA;

        const outdoorDropCount = Math.floor((18 + gameRandom.nextInt(0, 6)) * areaMultiplier);
        const selectedOutdoor = this.getRandomSubarray(outdoorTiles, outdoorDropCount);

        selectedOutdoor.forEach(pos => {
            const items = this.generateRandomItems('outside', mapNumber);
            if (items.length > 0) {
                gameMap.setItemsOnTile(pos.x, pos.y, items);
            }
        });
        console.log(`[LootGenerator] Outdoor: Spawned ${outdoorDropCount} loot drops on ${outdoorTiles.length} tiles (Area Multiplier: ${areaMultiplier.toFixed(2)})`);
        
        // Phase 25: Designate Low Spots for Water Puddles (Scaled)
        let lowSpotBase = 3 + gameRandom.nextInt(0, 2);
        if (gameMap.template === 'winding_road' || gameMap.template === 'mirrored_winding_road') {
            lowSpotBase = 5 + gameRandom.nextInt(0, 4); // More for winding maps
        }
        const lowSpotCount = Math.floor(lowSpotBase * areaMultiplier);
        const potentialLowSpots = outdoorTiles.filter(pos => gameMap.getItemsOnTile(pos.x, pos.y).length === 0);
        const lowSpots = this.getRandomSubarray(potentialLowSpots, lowSpotCount);
        gameMap.lowSpots = lowSpots;
        
        // Spawn full 50-unit puddles in random low spot(s) (1 baseline, 4 total on branching_road)
        const isBranching = gameMap.template === 'branching_road';
        const numPuddles = isBranching ? 4 : 1;

        if (lowSpots.length > 0) {
            const shuffledLowSpots = gameRandom.shuffle([...lowSpots]);
            const actualPuddles = Math.min(numPuddles, shuffledLowSpots.length);
            for (let i = 0; i < actualPuddles; i++) {
                const pos = shuffledLowSpots[i];
                const puddle = createItemFromDef('environment.water_puddle');
                if (puddle) {
                    puddle.ammoCount = 50;
                    gameMap.setItemsOnTile(pos.x, pos.y, [puddle]);
                    console.log(`[LootGenerator] Spawned full 50-unit puddle at (${pos.x}, ${pos.y})`);
                }
            }
        }
        
        // 3. Spawn Furniture (Independent of loot drops)
        this.spawnFurniture(gameMap, outdoorTiles);
        
        // Spawn Generator (1 per map, behind a building)
        this.spawnGenerator(gameMap);

        // Spawn Safes (1 on Map 1, 2 on Map 2+; 3 on large map)
        const safeCount = isBranching ? 3 : (mapNumber === 1 ? 1 : 2);
        this.spawnSafes(gameMap, safeCount);

        // 4. Final Pass: Apply map-wide unique loot rules
        this.applyMapWideUniqueRules(gameMap, mapNumber);
    }

    /**
     * Spawn specialized furniture (Beds) in residential buildings
     */
    spawnFurniture(gameMap, outdoorLootTiles = []) {
        const buildings = (gameMap.buildings || []).filter(b => b.type === 'residential');
        let bedsSpawned = 0;

        buildings.forEach(building => {
            // 25% chance to spawn a bed in a residential house 
            if (gameRandom.next() > 0.25) return;

            const floorTiles = [];
            // Interior tiles only
            for (let y = building.y + 1; y < building.y + building.height - 1; y++) {
                for (let x = building.x + 1; x < building.x + building.width - 1; x++) {
                    const tile = gameMap.getTile(x, y);
                    if (tile && tile.terrain === 'floor') {
                        // 1. Check for existing items/loot
                        const existingItems = gameMap.getItemsOnTile ? gameMap.getItemsOnTile(x, y) : [];
                        if (existingItems.length > 0) continue;

                        // 2. Check for doors (Strict 1-tile buffer zone: prevents spawning ON door or ADJACENT to it)
                        // PHASE 15 Fix: Corrected adjacency loop to include current tile and diagonals properly
                        if (this.isNearDoor(gameMap, x, y)) continue;

                        floorTiles.push({ x, y });
                    }
                }
            }

            if (floorTiles.length > 0) {
                const pos = floorTiles[gameRandom.nextInt(0, floorTiles.length - 1)];
                const bedItem = createItemFromDef('placeable.bed');
                if (bedItem) {
                    // Place directly on tile
                    gameMap.setItemsOnTile(pos.x, pos.y, [bedItem]);
                    bedsSpawned++;
                }
            }
        });

        console.log(`[LootGenerator] Furniture: Spawned ${bedsSpawned} beds across ${buildings.length} residential buildings`);
        
        const allBuildings = gameMap.buildings || [];
        const isBranching = gameMap.template === 'branching_road';

        // Phase 25: Toy Wagon Spawn (35% chance per map, strictly outdoor; 2-4 on large map)
        const wagonTiles = outdoorLootTiles.filter(pos => {
            if (isInsideAnyBuilding(allBuildings, pos.x, pos.y)) return false;
            const existing = gameMap.getItemsOnTile(pos.x, pos.y);
            return !existing || existing.length === 0;
        });

        const numWagons = isBranching
            ? (2 + gameRandom.nextInt(0, 2))
            : (gameRandom.next() < 0.35 ? 1 : 0);

        if (numWagons > 0 && wagonTiles.length > 0) {
            const shuffledWagons = gameRandom.shuffle([...wagonTiles]);
            const actualWagons = Math.min(numWagons, shuffledWagons.length);
            for (let i = 0; i < actualWagons; i++) {
                const pos = shuffledWagons[i];
                const wagon = createItemFromDef('vehicle.toy_wagon');
                if (wagon) {
                    gameMap.setItemsOnTile(pos.x, pos.y, [wagon]);
                    console.log(`[LootGenerator] Furniture: Spawned Toy Wagon at (${pos.x}, ${pos.y})`);
                }
            }
        }

        // Electric Mower Spawn (Guaranteed 1 per map, strictly on grass; 3-5 on large map)
        const mowerTiles = outdoorLootTiles.filter(pos => {
            const tile = gameMap.getTile(pos.x, pos.y);
            if (!tile || tile.terrain !== 'grass') return false;
            if (isInsideAnyBuilding(allBuildings, pos.x, pos.y)) return false;
            const existing = gameMap.getItemsOnTile(pos.x, pos.y);
            return !existing || existing.length === 0;
        });

        const numMowers = isBranching
            ? (5 + gameRandom.nextInt(0, 4))
            : 1;

        if (mowerTiles.length > 0) {
            const shuffledMowers = gameRandom.shuffle([...mowerTiles]);
            const actualMowers = Math.min(numMowers, shuffledMowers.length);
            for (let i = 0; i < actualMowers; i++) {
                const pos = shuffledMowers[i];
                const mower = createItemFromDef('furniture.electric_mower');
                if (mower) {
                    LootGenerator.applySpawnDefaults(mower, false);
                    gameMap.setItemsOnTile(pos.x, pos.y, [mower]);
                    console.log(`[LootGenerator] Furniture: Spawned Electric Mower at (${pos.x}, ${pos.y})`);
                }
            }
        }
        
        // Phase 25: Electric Scooter Spawn (Guaranteed 1 per map, strictly outdoor; 2-4 on large map)
        this.spawnScooter(gameMap, outdoorLootTiles);
    }

    /**
     * Spawn electric scooters in outdoor tiles (2-4 on large map)
     */
    spawnScooter(gameMap, outdoorLootTiles = []) {
        const allBuildings = gameMap.buildings || [];
        const scooterTiles = outdoorLootTiles.filter(pos => {
            if (isInsideAnyBuilding(allBuildings, pos.x, pos.y)) return false;
            const existing = gameMap.getItemsOnTile(pos.x, pos.y);
            return !existing || existing.length === 0;
        });

        const numScooters = gameMap.template === 'branching_road'
            ? (4 + gameRandom.nextInt(0, 3))
            : 1;

        if (scooterTiles.length > 0) {
            const shuffledScooters = gameRandom.shuffle([...scooterTiles]);
            const actualScooters = Math.min(numScooters, shuffledScooters.length);
            for (let i = 0; i < actualScooters; i++) {
                const pos = shuffledScooters[i];
                const scooter = createItemFromDef('vehicle.electric_scooter');
                if (scooter) {
                    LootGenerator.applySpawnDefaults(scooter, false);
                    gameMap.setItemsOnTile(pos.x, pos.y, [scooter]);
                    console.log(`[LootGenerator] Furniture: Spawned Electric Scooter at (${pos.x}, ${pos.y})`);
                }
            }
        }
    }

    /**
     * Spawn generators behind buildings (2-4 on large map)
     */
    spawnGenerator(gameMap) {
        const buildings = (gameMap.buildings || []).filter(b => b.type === 'residential');
        if (buildings.length === 0) return;

        // Shuffle buildings to try different ones if the first choice is blocked
        const shuffledBuildings = gameRandom.shuffle([...buildings]);
        
        const targetCount = gameMap.template === 'branching_road'
            ? (4 + gameRandom.nextInt(0, 3))
            : 1;

        let spawnedCount = 0;

        for (const building of shuffledBuildings) {
            if (spawnedCount >= targetCount) break;

            // "Behind" = Y - 3 (top of building)
            const spawnX = building.x + Math.floor(building.width / 2) - 1;
            const spawnY = building.y - 3;
            
            // Check 3x3 area
            let isSpaceFree = true;
            if (spawnY < 0 || spawnX < 0 || spawnX + 3 > gameMap.width) {
                isSpaceFree = false;
            } else {
                for (let dy = 0; dy < 3; dy++) {
                    for (let dx = 0; dx < 3; dx++) {
                        const tx = spawnX + dx;
                        const ty = spawnY + dy;
                        const tile = gameMap.getTile(tx, ty);
                        // Must be walkable, outdoor terrain, and empty
                        if (!tile || !tile.isWalkable() || ['road', 'sidewalk', 'grass'].indexOf(tile.terrain) === -1) {
                            isSpaceFree = false;
                            break;
                        }
                        const compound = gameMap.metadata?.townSquareCompound;
                        if (isInsideCompound(compound, tx, ty) || isInsideTollGate(gameMap.metadata?.tollGate, tx, ty)) {
                            isSpaceFree = false;
                            break;
                        }
                        const existing = gameMap.getItemsOnTile(tx, ty);
                        if (existing && existing.length > 0) {
                            isSpaceFree = false;
                            break;
                        }
                    }
                    if (!isSpaceFree) break;
                }
            }

            if (isSpaceFree) {
                const generatorData = createItemFromDef('furniture.generator');
                if (generatorData) {
                    const generator = Item.fromJSON(generatorData);
                    // Generators spawn with a small amount of fuel (0-5)
                    generator.ammoCount = Math.floor(gameRandom.next() * LOOT_CONSTANTS.GENERATOR_SPAWN_FUEL_MAX);
                    gameMap.setItemsOnTile(spawnX, spawnY, [generator]);
                    console.log(`[LootGenerator] Spawned Generator behind building at (${spawnX}, ${spawnY})`);
                    spawnedCount++;
                }
            }
        }
        
        if (spawnedCount < targetCount) {
            console.warn(`[LootGenerator] Could not find a suitable spot behind any building for the generator. Spawned: ${spawnedCount}/${targetCount}`);
        }
    }

    /**
     * Populate safe container with random loot
     */
    populateSafe(safeItem) {
        const grid = safeItem.getContainerGrid();
        if (!grid) return;

        const SAFE_GUNS = [
            { gun: 'weapon.9mmPistol', ammo: 'ammo.9mm' },
            { gun: 'weapon.357Pistol', ammo: 'ammo.357' },
            { gun: 'weapon.hunting_rifle', ammo: 'ammo.308' },
            { gun: 'weapon.battle_rifle', ammo: 'ammo.556' },
            { gun: 'weapon.shotgun', ammo: 'ammo.shotgun_shells' }
        ];

        const options = [];

        // Option: A gun (max one)
        const hasGun = gameRandom.next() < 0.7; // 70% chance to contain a gun
        let spawnedGunInfo = null;
        if (hasGun) {
            const gunInfo = SAFE_GUNS[gameRandom.nextInt(0, SAFE_GUNS.length - 1)];
            spawnedGunInfo = gunInfo;
            options.push(() => {
                const gun = createItemFromDef(gunInfo.gun);
                if (gun) {
                    const item = Item.fromJSON(gun);
                    LootGenerator.applySpawnDefaults(item, false);
                    return item;
                }
                return null;
            });
        }

        // Option: Ammo for the gun in the safe (15-20 rounds)
        if (hasGun) {
            options.push(() => {
                if (!spawnedGunInfo) return null;
                const ammo = createItemFromDef(spawnedGunInfo.ammo);
                if (ammo) {
                    const count = 15 + gameRandom.nextInt(0, 5); // 15-20
                    const item = Item.fromJSON(ammo);
                    item.stackCount = count;
                    return item;
                }
                return null;
            });
        }

        // Option: MREs (1-2)
        if (gameRandom.next() < 0.8) {
            options.push(() => {
                const mre = createItemFromDef('food.mre');
                if (mre) {
                    const item = Item.fromJSON(mre);
                    item.stackCount = gameRandom.next() < 0.5 ? 1 : 2;
                    return item;
                }
                return null;
            });
        }

        // Option: Full water bottles (1-2)
        if (gameRandom.next() < 0.8) {
            options.push(() => {
                const bottle = createItemFromDef('food.waterbottle');
                if (bottle) {
                    const item = Item.fromJSON(bottle);
                    item.ammoCount = 20; // Full
                    item.waterQuality = 'clean';
                    return item;
                }
                return null;
            });
        }

        // Option: Any ammo (15-20 rounds)
        if (gameRandom.next() < 0.8) {
            options.push(() => {
                const randGun = SAFE_GUNS[gameRandom.nextInt(0, SAFE_GUNS.length - 1)];
                const ammo = createItemFromDef(randGun.ammo);
                if (ammo) {
                    const count = 15 + gameRandom.nextInt(0, 5); // 15-20
                    const item = Item.fromJSON(ammo);
                    item.stackCount = count;
                    return item;
                }
                return null;
            });
        }

        // Option: flashlight (with full battery)
        if (gameRandom.next() < 0.6) {
            options.push(() => {
                const flData = createItemFromDef('tool.smallflashlight');
                if (flData) {
                    flData.attachments = {
                        battery: createItemFromDef('tool.battery')
                    };
                    const item = Item.fromJSON(flData);
                    return item;
                }
                return null;
            });
        }

        // Option: batteries (2-4)
        if (gameRandom.next() < 0.7) {
            options.push(() => {
                const bat = createItemFromDef('tool.battery');
                if (bat) {
                    const count = 2 + gameRandom.nextInt(0, 2); // 2-4
                    const item = Item.fromJSON(bat);
                    item.stackCount = count;
                    return item;
                }
                return null;
            });
        }

        // Option: hand cranked battery charger
        if (gameRandom.next() < 0.5) {
            options.push(() => {
                const charger = createItemFromDef('tool.crank_charger');
                return charger ? Item.fromJSON(charger) : null;
            });
        }

        // Option: first aid kit
        if (gameRandom.next() < 0.6) {
            options.push(() => {
                const kit = createItemFromDef('medical.first_aid_kit');
                return kit ? Item.fromJSON(kit) : null;
            });
        }

        // Shuffle the option generators
        const shuffled = gameRandom.shuffle(options);

        // Try to generate and add each item
        let gunAdded = false;
        for (const gen of shuffled) {
            const item = gen();
            if (!item) continue;

            // If it's a gun and we already added a gun, skip it!
            if (item.hasCategory?.(ItemCategory.GUN) || item.categories?.includes(ItemCategory.GUN)) {
                if (gunAdded) continue;
                gunAdded = true;
            }

            // Attempt to add to grid
            const added = grid.addItem(item);
            if (!added) {
                // Try rotating to fit
                item.rotation = item.rotation === 0 ? 90 : 0;
                const addedRotated = grid.addItem(item);
                if (!addedRotated) {
                    console.log(`[LootGenerator] Safe: Item ${item.name} did not fit. Skipping.`);
                } else {
                    console.log(`[LootGenerator] Safe: Added rotated ${item.name}`);
                }
            } else {
                console.log(`[LootGenerator] Safe: Added ${item.name}`);
            }
        }
    }

    /**
     * Spawn safes inside random buildings
     */
    spawnSafes(gameMap, count) {
        const buildings = (gameMap.buildings || []).filter(b => b.type !== 'compound');
        if (buildings.length === 0) {
            console.warn('[LootGenerator] No buildings found to spawn safes');
            return;
        }

        // Shuffle buildings to distribute safes randomly
        const shuffledBuildings = gameRandom.shuffle([...buildings]);
        let safesSpawned = 0;

        for (const building of shuffledBuildings) {
            if (safesSpawned >= count) break;

            // Try to find a suitable 3x3 location inside this building
            let foundLocation = null;

            // Scan the floor tiles of the building
            const candidates = [];
            for (let y = building.y + 1; y <= building.y + building.height - 4; y++) {
                for (let x = building.x + 1; x <= building.x + building.width - 4; x++) {
                    candidates.push({ x, y });
                }
            }

            // Shuffle candidates
            const shuffledCandidates = gameRandom.shuffle(candidates);

            for (const pos of shuffledCandidates) {
                // Check if 3x3 footprint is entirely on floor, not near door, and has no other items
                let isFree = true;
                for (let dy = 0; dy < 3; dy++) {
                    for (let dx = 0; dx < 3; dx++) {
                        const tx = pos.x + dx;
                        const ty = pos.y + dy;
                        const tile = gameMap.getTile(tx, ty);
                        if (!tile || tile.terrain !== 'floor') {
                            isFree = false;
                            break;
                        }
                        if (this.isNearDoor(gameMap, tx, ty)) {
                            isFree = false;
                            break;
                        }
                        const existing = gameMap.getItemsOnTile(tx, ty);
                        if (existing && existing.length > 0) {
                            isFree = false;
                            break;
                        }
                    }
                    if (!isFree) break;
                }

                if (isFree) {
                    foundLocation = pos;
                    break;
                }
            }

            if (foundLocation) {
                // Spawn safe here!
                const safeData = createItemFromDef('furniture.safe');
                if (safeData) {
                    const safe = Item.fromJSON(safeData);
                    // Populate safe with loot
                    this.populateSafe(safe);
                    
                    // Place the safe on the tile
                    gameMap.setItemsOnTile(foundLocation.x, foundLocation.y, [safe]);
                    console.log(`[LootGenerator] Spawned Safe at (${foundLocation.x}, ${foundLocation.y}) inside building at (${building.x}, ${building.y})`);
                    safesSpawned++;
                }
            }
        }

        if (safesSpawned < count) {
            console.warn(`[LootGenerator] Spawned only ${safesSpawned}/${count} safes on map.`);
        }
    }

    /**
     * getBuildings is now deprecated in favor of standardized gameMap.buildings metadata.
     * Retained as a legacy helper for any code not yet migrated.
     */
    getBuildings(gameMap) {
        if (gameMap.buildings) {
            return gameMap.buildings
                .filter(b => b.type === 'residential')
                .map(building => {
                    const tiles = [];
                    for (let y = building.y + 1; y < building.y + building.height - 1; y++) {
                        for (let x = building.x + 1; x < building.x + building.width - 1; x++) {
                            const tile = gameMap.getTile(x, y);
                            if (tile && tile.terrain === 'floor') {
                                tiles.push({ x, y });
                            }
                        }
                    }
                    return tiles;
                });
        }
        return [];
    }

    /**
     * Enforce map-specific backpack limits
     */
    canSpawnBackpack(defId, mapNumber) {
        if (mapNumber === 1) {
            if (defId === 'backpack.hiking') {
                return false; // 0 hiking backpacks on Map 1
            }
            if (defId === 'backpack.standard') {
                return this.standardBackpacksSpawnedMap < 1; // max 1 standard backpack on Map 1
            }
        }
        return true;
    }

    /**
     * Ensure item keys are initialized
     */
    initItemKeys() {
        if (!this.itemKeys || this.itemKeys.length === 0) {
            this.itemKeys = Object.keys(ItemDefs).filter(key => {
                // Ignore sprite/icon metadata and specialized sub-types
                if (key.includes('.icon') || key.includes('.sprite')) return false;
                if (ItemDefs[key].noLoot) return false;
                return true;
            });
            console.log(`[LootGenerator] Initialized with ${this.itemKeys.length} items (rarity-enabled)`);
        }
    }

    /**
     * Pick a random item key from the catalog using weighted rarity and location filters
     */
    getWeightedRandomItemKey(location = 'any', mapNumber = 1, options = {}) {
        this.initItemKeys();
        const filteredKeys = this.itemKeys.filter(key => {
            // After map 3, water bottles only spawn in allowed locations
            if (mapNumber > LOOT_CONSTANTS.WATER_BOTTLE_RESTRICTION_MAP && key === 'food.waterbottle' && !options.allowWaterBottle) {
                return false;
            }
            // Map 1 specific exclusions: standard and hiking backpacks do not drop in general loot
            if (mapNumber === 1 && (key === 'backpack.standard' || key === 'backpack.hiking')) {
                return false;
            }
            // All maps: hiking backpacks do not drop in general loot (restricted to special buildings)
            if (key === 'backpack.hiking') {
                return false;
            }
            const def = ItemDefs[key];
            if (def.spawnBias && def.spawnBias[location] === 0) return false;
            return true;
        });

        const totalWeight = filteredKeys.reduce((sum, key) => {
            const def = ItemDefs[key];
            const rarity = def.rarity || Rarity.COMMON;
            let weight = RarityWeights[rarity] || 100;

            // Apply location-based weight bias
            if (def.spawnBias) {
                weight *= (def.spawnBias[location] ?? 1);
            }

            return sum + weight;
        }, 0);

        let random = gameRandom.next() * totalWeight;
        for (const key of filteredKeys) {
            const def = ItemDefs[key];
            const rarity = def.rarity || Rarity.COMMON;
            let weight = RarityWeights[rarity] || 100;

            if (def.spawnBias) {
                weight *= (def.spawnBias[location] ?? 1);
            }

            if (random < weight) return key;
            random -= weight;
        }
        return filteredKeys[0] || this.itemKeys[0];
    }

    /**
     * Generate 1-3 random items with rarity and limits
     */
    generateRandomItems(location = 'any', mapNumber = 1, options = {}) {
        const count = 1 + gameRandom.nextInt(0, 2);
        const items = [];
        let hasFoodInPile = false;
        const seenKeysInPile = new Set();

        for (let i = 0; i < count; i++) {
            // Pick a weighted random item
            const randomKey = this.getWeightedRandomItemKey(location, mapNumber, options);
            const def = ItemDefs[randomKey];

            // 1. Map-wide limit: Max 1 backpack per map (excluding school backpacks on Map 1)
            const isBackpack = def.equippableSlot === 'backpack' || (Array.isArray(def.equippableSlot) && def.equippableSlot.includes('backpack'));
            const isSchoolBackpack = randomKey === 'backpack.school';
            const countsAsLimitedBackpack = isBackpack && !(mapNumber === 1 && isSchoolBackpack);
            
            if (countsAsLimitedBackpack && this.backpacksSpawned >= 1) continue;

            // Enforce map-specific standard/hiking limits
            if (!this.canSpawnBackpack(randomKey, mapNumber)) continue;

            // 2. Pile limit: Max 1 food item per loot pile
            const isSeed = def.id && def.id.endsWith('seeds');
            const isFood = !isSeed && ((def.id && def.id.startsWith('food.')) || (def.categories && def.categories.includes(ItemCategory.FOOD))) && def.id !== 'food.whiskey';
            if (isFood) {
                if (gameRandom.next() < getFoodRejectionChance(mapNumber)) {
                    continue; // Reject food spawning for this drop slot
                }
                if (hasFoodInPile) continue;
            }

            // 2b. Pile limit: Items that should be restricted to 1 per pile
            if (def.pileLimitOne && seenKeysInPile.has(randomKey)) continue;

            // Create the item instance
            const selectedItem = createItemFromDef(randomKey);
            if (selectedItem) {
                // Track limits
                if (countsAsLimitedBackpack) this.backpacksSpawned++;
                if (randomKey === 'backpack.standard') this.standardBackpacksSpawnedMap++;
                if (randomKey === 'backpack.hiking') this.hikingBackpacksSpawnedMap++;
                if (isFood) hasFoodInPile = true;
                seenKeysInPile.add(randomKey);

                // Apply defaults (stack count, condition, ammo, etc.)
                LootGenerator.applySpawnDefaults(selectedItem, false);

                items.push(selectedItem);
            }
        }

        return items;
    }

    /**
     * Spawn specialized loot in a special building
     */
    spawnSpecialLoot(gameMap, building, mapNumber = 1) {
        const { type, x, y, width, height } = building;
        
        // Fuel Cover Spawning for Gas Stations
        if (type === 'gas_station') {
            const frontage = building.frontage;
            let coverX = x, coverY = y;
            
            // Place in a corner of the new 3-tile parking lot area
            if (frontage === 'east') {
                coverX = x + width + 2;
                coverY = y;
            } else if (frontage === 'west') {
                coverX = x - 3;
                coverY = y;
            } else if (frontage === 'south') {
                coverX = x;
                coverY = y + height + 2;
            } else if (frontage === 'north') {
                coverX = x;
                coverY = y - 3;
            }
            
            const coverData = createItemFromDef('furniture.fuel_cover');
            if (coverData) {
                const cover = Item.fromJSON(coverData);
                cover.ammoCount = 5 + gameRandom.nextInt(0, 15); // 5-20
                gameMap.setItemsOnTile(coverX, coverY, [cover]);
                console.log(`[LootGenerator] Spawned Fuel Cover at (${coverX}, ${coverY}) with ${cover.ammoCount} fuel`);
            }
        }
        
        // Find internal floor tiles (excluding doorway tiles)
        const floorTiles = [];
        for (let curY = y + 1; curY < y + height - 1; curY++) {
            for (let curX = x + 1; curX < x + width - 1; curX++) {
                const tile = gameMap.getTile(curX, curY);
                if (tile && tile.terrain === 'floor' && !this.isNearDoor(gameMap, curX, curY)) {
                    floorTiles.push({ x: curX, y: curY });
                }
            }
        }

        if (floorTiles.length === 0) return;

        // 3 to 6 drops (Hardware store gets more: 6 to 10)
        let dropCount = 3 + gameRandom.nextInt(0, 3);
        if (type === 'hardware_store') dropCount = 6 + gameRandom.nextInt(0, 4);
        const selectedTiles = this.getRandomSubarray(floorTiles, dropCount);
        // Guaranteed-drop indices MUST be rolled against the number of tiles we
        // actually selected, not the requested dropCount. When a small building
        // has fewer eligible floor tiles than dropCount, selectedTiles is shorter
        // and an index in [0, dropCount) can point past the end — silently losing
        // the "guaranteed" gun/backpack/etc. (selectedTiles.length >= 1 here since
        // we returned early on floorTiles.length === 0.)
        const dropSlots = selectedTiles.length;

        console.log(`[LootGenerator] Spawning specialized loot for ${type} in ${dropCount} drops`);

        // Building-wide random rolls (ONE per building)
        const buildingRules = SPECIAL_BUILDING_LOOT[type]?.rules || {};
        const buildingState = {
            hasGun: buildingRules.hasGun ? gameRandom.next() < buildingRules.hasGun : false,
            hasTool: buildingRules.hasTool ? gameRandom.next() < buildingRules.hasTool : false,
            hasBackpack: buildingRules.hasBackpack ? gameRandom.next() < buildingRules.hasBackpack : false,
            hasGrenade: buildingRules.hasGrenade ? gameRandom.next() < buildingRules.hasGrenade : false,
            hasBattleRifle: buildingRules.hasBattleRifle ? gameRandom.next() < buildingRules.hasBattleRifle : false,
            has9mm: buildingRules.has9mm ? gameRandom.next() < buildingRules.has9mm : false,
            hasDesertEagle: buildingRules.hasDesertEagle ? gameRandom.next() < buildingRules.hasDesertEagle : false,
            hasNightVision: buildingRules.hasNightVision ? gameRandom.next() < buildingRules.hasNightVision : false,
            gunDropIndex: -1,
            toolDropIndex: -1,
            backpackDropIndex: -1,
            grenadeDropIndex: -1,
            battleRifleDropIndex: -1,
            gun9mmDropIndex: -1,
            desertEagleDropIndex: -1,
            nightVisionDropIndex: -1
        };

        if (buildingRules.hasGun) buildingState.gunDropIndex = buildingState.hasGun ? Math.floor(gameRandom.next() * dropSlots) : -1;
        if (buildingRules.hasTool) buildingState.toolDropIndex = buildingState.hasTool ? Math.floor(gameRandom.next() * dropSlots) : -1;
        if (buildingRules.hasBackpack) buildingState.backpackDropIndex = buildingState.hasBackpack ? Math.floor(gameRandom.next() * dropSlots) : -1;
        if (buildingRules.hasGrenade) buildingState.grenadeDropIndex = buildingState.hasGrenade ? Math.floor(gameRandom.next() * dropSlots) : -1;
        if (buildingRules.hasBattleRifle) buildingState.battleRifleDropIndex = buildingState.hasBattleRifle ? Math.floor(gameRandom.next() * dropSlots) : -1;
        if (buildingRules.has9mm) buildingState.gun9mmDropIndex = buildingState.has9mm ? Math.floor(gameRandom.next() * dropSlots) : -1;
        if (buildingRules.hasDesertEagle) buildingState.desertEagleDropIndex = buildingState.hasDesertEagle ? Math.floor(gameRandom.next() * dropSlots) : -1;
        if (buildingRules.hasNightVision) buildingState.nightVisionDropIndex = buildingState.hasNightVision ? Math.floor(gameRandom.next() * dropSlots) : -1;
        
        // --- LABORATORY SPECIAL CASE ---
        if (type === 'lab' && buildingRules.roomLayout) {
            const layout = buildingRules.roomLayout;
            const nvgRoomIndex = Math.floor(gameRandom.next() * layout.roomsCount);
            const nvgDropIndex = Math.floor(gameRandom.next() * (buildingRules.dropsPerRoom?.min || 2));
            
            const wingWidth = layout.wingWidth;
            const roomHeight = layout.roomHeight;
            const leftX = x + 1;
            const rightX = x + (width - wingWidth - 1); // Dynamic calculation
            const rooms = [];

            for (let ry = y + 1; ry < y + height - 1; ry += roomHeight) {
                const segmentH = Math.min(roomHeight - 1, (y + height - 1) - ry);
                if (segmentH < 3) break;
                rooms.push({ x: leftX, y: ry, w: wingWidth, h: segmentH });
                rooms.push({ x: rightX, y: ry, w: wingWidth, h: segmentH });
            }

            console.log(`[LootGenerator] Lab: Spawning loot for ${rooms.length} rooms using data-driven rules`);

            rooms.forEach((room, rIdx) => {
                const roomFloorTiles = [];
                for (let ty = room.y; ty < room.y + room.h; ty++) {
                    for (let tx = room.x; tx < room.x + room.w; tx++) {
                        if (!this.isNearDoor(gameMap, tx, ty)) roomFloorTiles.push({ x: tx, y: ty });
                    }
                }
                if (roomFloorTiles.length === 0) return;

                const minD = buildingRules.dropsPerRoom?.min || 2;
                const maxD = buildingRules.dropsPerRoom?.max || 3;
                const roomDropCount = minD + Math.floor(gameRandom.next() * (maxD - minD + 1));
                const roomSelectedTiles = this.getRandomSubarray(roomFloorTiles, roomDropCount);

                roomSelectedTiles.forEach((tilePos, dIdx) => {
                    const roomItems = [];
                    // Weighted chances moved to config-driven logic if needed, but currently keeping inline rolls
                    if (gameRandom.next() < 0.5) {
                        const medPool = SPECIAL_BUILDING_LOOT[type].medical;
                        const med = createItemFromDef(medPool[gameRandom.nextInt(0, medPool.length - 1)]);
                        if (med) roomItems.push(med);
                    }
                    if (gameRandom.next() < 0.7) {
                        const techPool = SPECIAL_BUILDING_LOOT[type].tech;
                        const tech = createItemFromDef(techPool[gameRandom.nextInt(0, techPool.length - 1)]);
                        if (tech) {
                            LootGenerator.applySpawnDefaults(tech, false);
                            roomItems.push(tech);
                        }
                    }
                    
                    // Uniques (NVGs etc)
                    if (rIdx === nvgRoomIndex && dIdx === nvgDropIndex) {
                        const unique = buildingRules.uniques?.[0]; // Current lab only has 1 unique
                        if (unique) {
                            const item = createItemFromDef(unique.defId);
                            if (item) roomItems.push(item);
                        }
                    }
                    if (roomItems.length > 0) gameMap.setItemsOnTile(tilePos.x, tilePos.y, roomItems);
                });
            });
            return;
        }
        // --- END LABORATORY SPECIAL CASE ---

        selectedTiles.forEach((pos, index) => {
            let items = [];
            
            // Standard indoor loot base for police and fire stations
            if (type === 'police' || type === 'firestation') {
                items = this.generateRandomItems('inside', mapNumber, { allowWaterBottle: type === 'firestation' });
            }

            // Guaranteed drops for some buildings on the first tile
            if (index === 0) {
                if (type === 'grocer' || type === 'gas_station') {
                    // Guaranteed partially full water bottle (50-100%)
                    const water = createItemFromDef('food.waterbottle');
                    if (water) {
                        const minFill = Math.floor(water.capacity * 0.5);
                        water.ammoCount = minFill + Math.floor(gameRandom.next() * (water.capacity - minFill + 1));
                        items.push(water);
                    }
                }
            }

            // Building specific loot tables/logic
            switch(type) {
                case 'grocer':
                    this.addItemsFromTable(items, SPECIAL_BUILDING_LOOT.grocer, 1, 3);
                    break;
                case 'gas_station':
                    this.addItemsFromTable(items, SPECIAL_BUILDING_LOOT.gas_station, 1, 2);
                    break;
                case 'firestation':
                    // 50% chance for bandages or antibiotics in each loot drop
                    if (gameRandom.next() < 0.5) {
                        const medKeys = SPECIAL_BUILDING_LOOT.firestation.medical;
                        const medKey = medKeys[gameRandom.nextInt(0, medKeys.length - 1)];
                        const med = createItemFromDef(medKey);
                        if (med) {
                            med.stackCount = 1;
                            items.push(med);
                        }
                    }

                    // 50% chance for ONE fire tool in building
                    if (index === buildingState.toolDropIndex) {
                        const toolKeys = SPECIAL_BUILDING_LOOT.firestation.tools;
                        const toolKey = toolKeys[gameRandom.nextInt(0, toolKeys.length - 1)];
                        const tool = createItemFromDef(toolKey);
                        if (tool) items.push(tool);
                    }

                    // Backpack in building
                    if (index === buildingState.backpackDropIndex && buildingRules.backpackType) {
                        if (this.canSpawnBackpack(buildingRules.backpackType, mapNumber)) {
                            const backpack = createItemFromDef(buildingRules.backpackType);
                            if (backpack) {
                                items.push(backpack);
                                if (buildingRules.backpackType === 'backpack.standard') this.standardBackpacksSpawnedMap++;
                                if (buildingRules.backpackType === 'backpack.hiking') this.hikingBackpacksSpawnedMap++;
                            }
                        }
                    }
                    break;
                case 'police':
                    // 50% chance for ammo in each loot drop
                    if (gameRandom.next() < 0.5) {
                        const ammoKeys = SPECIAL_BUILDING_LOOT.police.ammo;
                        const ammoKey = ammoKeys[gameRandom.nextInt(0, ammoKeys.length - 1)];
                        const ammo = createItemFromDef(ammoKey);
                        if (ammo) {
                            ammo.stackCount = 1;
                            items.push(ammo);
                        }
                    }
                    
                    // 50% chance for ONE gun in building
                    if (index === buildingState.gunDropIndex) {
                        const gunKeys = SPECIAL_BUILDING_LOOT.police.guns;
                        const gunKey = gunKeys[gameRandom.nextInt(0, gunKeys.length - 1)];
                        const gun = createItemFromDef(gunKey);
                        if (gun) {
                            LootGenerator.initializeWeaponAmmo(gun);
                            items.push(gun);
                        }
                    }

                    // Backpack in building
                    if (index === buildingState.backpackDropIndex && buildingRules.backpackType) {
                        if (this.canSpawnBackpack(buildingRules.backpackType, mapNumber)) {
                            const backpack = createItemFromDef(buildingRules.backpackType);
                            if (backpack) {
                                items.push(backpack);
                                if (buildingRules.backpackType === 'backpack.standard') this.standardBackpacksSpawnedMap++;
                                if (buildingRules.backpackType === 'backpack.hiking') this.hikingBackpacksSpawnedMap++;
                            }
                        }
                    }

                    // 20% chance for tactical gear (holsters, ammo pouches) in each drop
                    if (gameRandom.next() < 0.20) {
                        const gearKeys = SPECIAL_BUILDING_LOOT.police.gear;
                        const gearKey = gearKeys[gameRandom.nextInt(0, gearKeys.length - 1)];
                        const gear = createItemFromDef(gearKey);
                        if (gear) items.push(gear);
                    }
                    break;
                case 'army_tent':
                    // ARMY TENT RULES:
                    // 1-2 stacks of ammo in EVERY drop
                    const ammoStackCount = 1 + gameRandom.nextInt(0, 1); 
                    for(let i=0; i < ammoStackCount; i++) {
                        const ammoTypes = SPECIAL_BUILDING_LOOT.army_tent.ammo;
                        const ammoKey = ammoTypes[gameRandom.nextInt(0, ammoTypes.length - 1)];
                        const ammo = createItemFromDef(ammoKey);
                        if (ammo) {
                            ammo.stackCount = 5 + gameRandom.nextInt(0, 5); // 5-10
                            items.push(ammo);
                        }
                    }

                    // Gun mods: possible in every drop
                    if (gameRandom.next() < 0.25) { // 25% chance for a mod in a drop
                        const modKeys = SPECIAL_BUILDING_LOOT.army_tent.mods;
                        const modKey = modKeys[gameRandom.nextInt(0, modKeys.length - 1)];
                        const mod = createItemFromDef(modKey);
                        if (mod) items.push(mod);
                    }

                    // 15% chance for tactical gear in each drop
                    if (gameRandom.next() < 0.15) {
                        const gearKeys = SPECIAL_BUILDING_LOOT.army_tent.gear;
                        const gearKey = gearKeys[gameRandom.nextInt(0, gearKeys.length - 1)];
                        const gear = createItemFromDef(gearKey);
                        if (gear) items.push(gear);
                    }

                    // Building-wide rolled items
                    if (index === buildingState.grenadeDropIndex) {
                        const grenade = createItemFromDef('weapon.grenade');
                        if (grenade) {
                            grenade.stackCount = 2 + gameRandom.nextInt(0, 1); // 2-3 grenades
                            items.push(grenade);
                        }
                    }
                    if (index === buildingState.battleRifleDropIndex) {
                        const rifle = createItemFromDef('weapon.battle_rifle');
                        if (rifle) {
                            LootGenerator.initializeWeaponAmmo(rifle);
                            items.push(rifle);
                        }
                    }
                    if (index === buildingState.gun9mmDropIndex) {
                        const pistol = createItemFromDef('weapon.9mmPistol');
                        if (pistol) {
                            LootGenerator.initializeWeaponAmmo(pistol);
                            items.push(pistol);
                        }
                    }
                    if (index === buildingState.backpackDropIndex && buildingRules.backpackType) {
                        if (this.canSpawnBackpack(buildingRules.backpackType, mapNumber)) {
                            const backpack = createItemFromDef(buildingRules.backpackType);
                            if (backpack) {
                                items.push(backpack);
                                if (buildingRules.backpackType === 'backpack.standard') this.standardBackpacksSpawnedMap++;
                                if (buildingRules.backpackType === 'backpack.hiking') this.hikingBackpacksSpawnedMap++;
                            }
                        }
                    }
                    if (index === buildingState.desertEagleDropIndex) {
                        const deagle = createItemFromDef('weapon.deserteagle');
                        if (deagle) {
                            LootGenerator.applySpawnDefaults(deagle, false);
                            items.push(deagle);
                        }
                    }
                    if (index === buildingState.nightVisionDropIndex) {
                        const nvg = createItemFromDef('tool.nightvision');
                        if (nvg) {
                            LootGenerator.applySpawnDefaults(nvg, false);
                            items.push(nvg);
                        }
                    }
                    break;
                case 'hardware_store':
                    // Hardware Store: High density mixture of tools and materials
                    const hardwareLoot = SPECIAL_BUILDING_LOOT.hardware_store;
                    
                    // 60% chance for a tool in every drop
                    if (gameRandom.next() < 0.6) {
                        const toolKey = hardwareLoot.tools[gameRandom.nextInt(0, hardwareLoot.tools.length - 1)];
                        const tool = createItemFromDef(toolKey);
                        if (tool) items.push(tool);
                    }
                    
                    // 1 guaranteed material, 50% chance for a second one
                    const matCount = gameRandom.next() < 0.5 ? 2 : 1;
                    for (let i = 0; i < matCount; i++) {
                        const matKey = hardwareLoot.materials[gameRandom.nextInt(0, hardwareLoot.materials.length - 1)];
                        const mat = createItemFromDef(matKey);
                        if (mat) {
                            LootGenerator.applySpawnDefaults(mat, false);
                            items.push(mat);
                        }
                    }

                    // Rare Tech Spawns: Mapped from config
                    const techPool = buildingRules.guaranteedTech || [];
                    if (techPool[index]) {
                        const tech = createItemFromDef(techPool[index]);
                        if (tech) items.push(tech);
                    }
                    break;
            }


            if (items.length > 0) {
                gameMap.setItemsOnTile(pos.x, pos.y, items);
            }
        });
    }

    /**
     * Check whether a tile has a door entity on it
     * @param {GameMap} gameMap
     * @param {number} x
     * @param {number} y
     * @returns {boolean}
     */
    hasDoorOnTile(gameMap, x, y) {
        const tile = gameMap.getTile(x, y);
        return !!(tile && tile.contents && tile.contents.some(e => e.type === 'door'));
    }

    /**
     * Check whether a tile or any of its 8 neighbors has a door entity
     * @param {GameMap} gameMap
     * @param {number} x
     * @param {number} y
     * @returns {boolean}
     */
    isNearDoor(gameMap, x, y) {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (this.hasDoorOnTile(gameMap, x + dx, y + dy)) return true;
            }
        }
        return false;
    }

    /**
     * Utility to get N random elements from an array
     */
    getRandomSubarray(arr, n) {
        if (arr.length <= n) return arr;
        const result = new Array(n);
        let len = arr.length;
        const taken = new Array(len);
        while (n--) {
            const x = Math.floor(gameRandom.next() * len);
            result[n] = arr[x in taken ? taken[x] : x];
            taken[x] = --len in taken ? taken[len] : len;
        }
        return result;
    }
    /**
     * Generate 1-2 random items for zombie loot drops
     * Common (65%): any clothing or rag
     * Uncommon (20%): granola bar, chips, water bottle (small amount), bandage, antibiotics
     * Rare (10%): Any ammo, knife, lighter, matches
     * Extremely rare (5%): 9mm pistol, 357 pistol, Flashlight
     */

    /**
     * Helper to handle water bottle restriction for map progression
     */
    _getProcessedLootKey(key, mapNumber) {
        if (mapNumber > LOOT_CONSTANTS.WATER_BOTTLE_RESTRICTION_MAP && key === 'food.waterbottle') {
            // If water bottle is picked after map 3, swap it for chips or granola bar
            return gameRandom.next() < 0.5 ? 'food.chips' : 'food.granolabar';
        }
        return key;
    }

    /**
     * Generate loot for a zombie when it's killed.
     * @param {string} subtype - The zombie's subtype ('basic', 'crawler', 'firefighter')
     * @returns {Array} - Array of Item instances
     */
    generateZombieLoot(subtype = 'basic', mapNumber = 1) {
        this.initItemKeys();
        const itemCount = gameRandom.next() < 0.5 ? 1 : 2;
        const items = [];
        let hasBeltInLoot = false;

        const tableKey = ZombieTypes[subtype]?.lootTable || 'basic';

        // Specialized Boss Drops
        if (tableKey === 'mutant') {
            const deagle = createItemFromDef('weapon.deserteagle');
            if (deagle) {
                LootGenerator.applySpawnDefaults(deagle, true);
                return [deagle];
            }
        }

        for (let i = 0; i < itemCount; i++) {
            let selectedKey = null;

            if (tableKey !== 'basic') {
                const table = ZOMBIE_LOOT[tableKey];
                const roll = gameRandom.next();

                if (tableKey === 'firefighter') {
                    if (roll < 0.3) {
                        selectedKey = table.specialized[gameRandom.nextInt(0, table.specialized.length - 1)];
                    } else if (roll < 0.6) {
                        selectedKey = table.medical[gameRandom.nextInt(0, table.medical.length - 1)];
                    } else if (roll < 0.8) {
                        selectedKey = this._getProcessedLootKey('food.waterbottle', mapNumber);
                    } else {
                        selectedKey = table.common[gameRandom.nextInt(0, table.common.length - 1)];
                    }
                } else if (tableKey === 'swat' || tableKey === 'soldier') {
                    if (roll < 0.4) {
                        selectedKey = table.gear[gameRandom.nextInt(0, table.gear.length - 1)];
                    } else if (roll < 0.8) {
                        selectedKey = table.ammo[gameRandom.nextInt(0, table.ammo.length - 1)];
                    } else {
                        selectedKey = this._getProcessedLootKey('food.waterbottle', mapNumber);
                    }
                }
            } else {
                const tierRoll = gameRandom.next();
                if (tierRoll < 0.65) {
                    // Common: any clothing or rag
                    const commonKeys = this.itemKeys.filter(key => {
                        const def = ItemDefs[key];
                        return (def.categories && def.categories.includes(ItemCategory.CLOTHING)) || key === 'crafting.rag';
                    });
                    selectedKey = commonKeys[gameRandom.nextInt(0, commonKeys.length - 1)];
                } else if (tierRoll < 0.85) {
                    // Uncommon: granola bar, chips, water bottle, etc.
                    const uncommonKeys = ZOMBIE_LOOT.uncommon;
                    const rawKey = uncommonKeys[gameRandom.nextInt(0, uncommonKeys.length - 1)];
                    selectedKey = this._getProcessedLootKey(rawKey, mapNumber);
                } else if (tierRoll < 0.95) {
                    // Rare: Any ammo, knife, lighter, matches
                    const rareKeys = this.itemKeys.filter(key => {
                        const def = ItemDefs[key];
                        return (def.categories && def.categories.includes(ItemCategory.AMMO)) ||
                            key === 'weapon.knife' || key === 'tool.lighter' || key === 'tool.matchbook';
                    });
                    selectedKey = rareKeys[gameRandom.nextInt(0, rareKeys.length - 1)];
                } else {
                    // Extremely rare: 9mm pistol, 357 pistol, shotgun, Flashlight
                    const exoticKeys = ZOMBIE_LOOT.exotic;
                    selectedKey = exoticKeys[gameRandom.nextInt(0, exoticKeys.length - 1)];
                }
            }
            
            // Pile limit: Max 1 leather belt per zombie loot
            if (selectedKey === 'crafting.leather_belt' && hasBeltInLoot) continue;

            if (selectedKey) {
                const def = ItemDefs[selectedKey];
                if (def) {
                    const isSeed = def.id && def.id.endsWith('seeds');
                    const isFood = !isSeed && ((def.id && def.id.startsWith('food.')) || (def.categories && def.categories.includes(ItemCategory.FOOD))) && def.id !== 'food.whiskey';
                    if (isFood) {
                        if (gameRandom.next() < getFoodRejectionChance(mapNumber)) {
                            continue; // Reject food drop
                        }
                    }
                }

                const item = createItemFromDef(selectedKey);
                if (item) {
                    if (selectedKey === 'crafting.leather_belt') hasBeltInLoot = true;
                    
                    // Apply defaults (stack count, condition, ammo, etc.)
                    LootGenerator.applySpawnDefaults(item, true);

                    items.push(item);
                }
            }
        }
        return items;
    }

    /**
     * Helper to pick items from a weighted table and add to collection
     */
    addItemsFromTable(items, table, min, max) {
        const count = min + Math.floor(gameRandom.next() * (max - min + 1));
        for (let i = 0; i < count; i++) {
            const totalWeight = table.reduce((sum, entry) => sum + entry.weight, 0);
            let random = gameRandom.next() * totalWeight;
            let pickedKey = table[0].key;
            for (const entry of table) {
                if (random < entry.weight) {
                    pickedKey = entry.key;
                    break;
                }
                random -= entry.weight;
            }
            
            // Safety Check: Avoid spawning items marked as noLoot (Map-Wide unique rule)
            if (ItemDefs[pickedKey] && ItemDefs[pickedKey].noLoot) {
                console.warn(`[LootGenerator] Skipping illegal 'noLoot' item picked from specialized table: ${pickedKey}`);
                continue; 
            }

            const item = createItemFromDef(pickedKey);
            if (item) {
                LootGenerator.applySpawnDefaults(item, false);
                items.push(item);
            }
        }
    }

    /**
     * Helper to initialize magazine-fed firearms with a partially filled magazine.
     * @param {Item} item - Firearm item instance
     */
    /**
     * Centralized logic to apply spawn-time defaults (stack counts, charges, condition)
     * based on metadata in ItemDefs.
     * @param {Item} item - The item instance to modify
     * @param {boolean} isZombieLoot - Whether this item is dropped by a zombie (affects condition)
     */
    static applySpawnDefaults(item, isZombieLoot = false) {
        if (!item || !item.defId) return;
        const def = ItemDefs[item.defId];
        if (!def) return;

        // 1. Stack Count Randomization
        if (def.spawnStackMin !== undefined && def.spawnStackMax !== undefined) {
            item.stackCount = def.spawnStackMin + Math.floor(gameRandom.next() * (def.spawnStackMax - def.spawnStackMin + 1));
        } else {
            // Default stack count for non-special items
            item.stackCount = 1;
        }

        // 2. Ammo / Charge / Water Randomization
        if (def.spawnAmmoPercent !== undefined && item.capacity) {
            // Apply randomized fill based on capacity (0 to capacity * spawnAmmoPercent)
            item.ammoCount = Math.floor(gameRandom.next() * (item.capacity * def.spawnAmmoPercent + 1));

            // Specialized Rule: Lighters and matches never spawn empty
            if ((item.defId === 'tool.lighter' || item.defId === 'tool.matchbook') && item.ammoCount < 1) {
                item.ammoCount = 1;
            }
        } else if (item.traits && item.traits.includes(ItemTrait.BATTERY)) {
            // Batteries always spawn as a single item with a FULL charge
            item.ammoCount = item.capacity || 10;
        }

        // 3. Condition Randomization (for DEGRADABLE items)
        if (item.traits && item.traits.includes(ItemTrait.DEGRADABLE)) {
            const minCondition = isZombieLoot ? 10 : 15;
            const maxCondition = isZombieLoot ? 70 : 100;
            item.condition = Math.floor(gameRandom.next() * (maxCondition - minCondition + 1)) + minCondition;
        }

        // Fuel Can randomization (1-10 units)
        if (item.defId === 'tool.fuel_can') {
            item.ammoCount = 1 + gameRandom.nextInt(0, 9);
        }

        // 4. Special cases (Battery Powered items, Weapons)
        if (item.traits && item.traits.includes(ItemTrait.BATTERY_POWERED)) {
            const batterySlot = item.attachmentSlots?.find(s => s.type === 'battery' || s.id === 'battery');
            if (batterySlot) {
                const batteryData = createItemFromDef('tool.battery');
                if (batteryData) {
                    const battery = new Item(batteryData);
                    battery.ammoCount = 1 + Math.floor(gameRandom.next() * (battery.capacity || 10));
                    if (!item.attachments) item.attachments = {};
                    item.attachments[batterySlot.id] = battery;
                }
            }
        }

        // Mower / Scooter / Hotplate / Large Battery initialization
        if (item.defId === 'furniture.electric_mower' || item.defId === 'vehicle.electric_scooter' || item.defId === 'tool.battery_powered_hotplate') {
            const batterySlot = item.attachmentSlots?.find(s => s.id === 'battery');
            if (batterySlot) {
                const batteryData = createItemFromDef('tool.large_battery');
                if (batteryData) {
                    const battery = new Item(batteryData);
                    if (item.defId === 'tool.battery_powered_hotplate') {
                        battery.ammoCount = 10 + gameRandom.nextInt(0, 20); // 10 to 30 charges
                    } else {
                        battery.ammoCount = 1 + Math.floor(gameRandom.next() * (battery.capacity || 100));
                    }
                    if (!item.attachments) item.attachments = {};
                    item.attachments[batterySlot.id] = battery;
                }
            }
        }

        const isWeapon = (item.categories && item.categories.includes(ItemCategory.WEAPON)) || !!item.attachmentSlots;
        if (isWeapon && (item.categories?.includes(ItemCategory.GUN) || item.attachmentSlots)) {
            LootGenerator.initializeWeaponAmmo(item);
        }
    }

    /**
     * Centralized weapon initialization logic
     * Handles spawning appropriate magazines or loose ammo with randomized counts
     */
    static initializeWeaponAmmo(item) {
        if (!item || !item.defId) return;

        // 1. Locate the 'ammo' slot (contains Magazines OR loose ammo)
        const ammoSlot = item.attachmentSlots?.find(s => 
            s.id === 'ammo' || (s.allowedCategories && s.allowedCategories.includes('ammunition'))
        );
        if (!ammoSlot) return;

        // 2. Identify the appropriate ammo source
        const ammoDefId = ammoSlot.allowedItems?.[0]; // Default to first allowed item
        if (!ammoDefId) return;

        const ammoItemData = createItemFromDef(ammoDefId);
        if (!ammoItemData) return;

        const ammoItem = new Item(ammoItemData);

        // 3. Randomize based on weapon type and capacity
        if (ammoItem.capacity !== undefined && ammoItem.capacity > 0) {
            // MAGAZINE-FED (9mm, Sniper)
            ammoItem.ammoCount = 1 + Math.floor(gameRandom.next() * ammoItem.capacity);
            console.log(`[Loot] Initialized ${item.defId} with magazine (${ammoItem.ammoCount}/${ammoItem.capacity} rounds)`);
        } else {
            // INTERNALLY-FED (.357, Shotgun, Hunting Rifle)
            const def = ItemDefs[item.defId];
            const maxRand = def?.spawnMaxRounds || 6;
            
            ammoItem.stackCount = 1 + Math.floor(gameRandom.next() * maxRand);
            console.log(`[Loot] Initialized ${item.defId} with ${ammoItem.stackCount} internally loaded rounds`);
        }

        // 4. Attach to item
        if (!item.attachments) item.attachments = {};
        item.attachments[ammoSlot.id] = ammoItem;
    }

    /**
     * Final pass logic to ensure specific rare items spawn exactly once map-wide.
     * Items are added to existing loot piles to ensure they are found in logical locations.
     */
    applyMapWideUniqueRules(gameMap, mapNumber = 1) {
        if (!gameMap) return;
        
        // 1. Collect all tiles that currently have loot AND count existing items for requirement checks
        const lootTiles = [];
        const itemCounts = new Map();
        
        // Get requirements for this map
        const requirements = MAP_WIDE_REQUIREMENTS[mapNumber] || [];
        const requiredDefIds = new Set(requirements.map(r => r.defId));

        for (let y = 0; y < gameMap.height; y++) {
            for (let x = 0; x < gameMap.width; x++) {
                const items = gameMap.getItemsOnTile(x, y);
                if (items && items.length > 0) {
                    lootTiles.push({ x, y });
                    
                    // Count items that are in our requirement list
                    if (requiredDefIds.size > 0) {
                        items.forEach(item => {
                            if (requiredDefIds.has(item.defId)) {
                                itemCounts.set(item.defId, (itemCounts.get(item.defId) || 0) + 1);
                            }
                        });
                    }
                }
            }
        }

        if (lootTiles.length === 0) {
            console.warn('[LootGenerator] No loot piles found on map to place unique items!');
            return;
        }

        // 2. Process Requirements (At least X of Y)
        if (requirements.length > 0) {
            console.log(`[LootGenerator] Processing ${requirements.length} map-wide requirements...`);
            requirements.forEach(req => {
                const currentCount = itemCounts.get(req.defId) || 0;
                if (currentCount < req.minCount) {
                    const toSpawn = req.minCount - currentCount;
                    console.log(`[LootGenerator] Requirement for ${req.defId} not met (${currentCount}/${req.minCount}). Spawning ${toSpawn} more.`);
                    
                    for (let i = 0; i < toSpawn; i++) {
                        const tilePos = lootTiles[gameRandom.nextInt(0, lootTiles.length - 1)];
                        const itemData = createItemFromDef(req.defId);
                        if (itemData) {
                            const item = new Item(itemData);
                            LootGenerator.applySpawnDefaults(item, false);
                            const currentItems = gameMap.getItemsOnTile(tilePos.x, tilePos.y);
                            gameMap.setItemsOnTile(tilePos.x, tilePos.y, [...currentItems, item]);
                        }
                    }
                } else {
                    console.log(`[LootGenerator] Requirement for ${req.defId} met (${currentCount}/${req.minCount}).`);
                }
            });
        }

        // 3. Define unique items to spawn (Exactly 1 of each or random subset)
        const uniqueSpawns = MAP_WIDE_UNIQUES;
        let spawnsToProcess = [...uniqueSpawns];

        if (spawnsToProcess.length > 0) {
            // NEW RULE: After Map 2, spawn only 1 of either, rather than 1 of each.
            // For Map 5+, reduce the chance of even 1 of them spawning to 50%.
            if (mapNumber > 2) {
                // Pick exactly one from the list
                const picked = spawnsToProcess[gameRandom.nextInt(0, spawnsToProcess.length - 1)];
                spawnsToProcess = [picked];

                // Map 5+ reduction check
                if (mapNumber >= 5) {
                    if (gameRandom.next() > 0.50) {
                        spawnsToProcess = [];
                        console.log(`[LootGenerator] Map ${mapNumber} >= 5: Skipped unique item spawn (50% chance)`);
                    }
                }
            }

            console.log(`[LootGenerator] Applying map-wide uniques for ${spawnsToProcess.length} items (Map ${mapNumber})...`);

            spawnsToProcess.forEach(config => {
                if (!config) return;
                // Pick a random existing loot pile
                const tilePos = lootTiles[gameRandom.nextInt(0, lootTiles.length - 1)];
                const itemData = createItemFromDef(config.defId);
                
                if (itemData) {
                    const item = new Item(itemData);
                    // Standard randomization (replaces manual capacity check)
                    LootGenerator.applySpawnDefaults(item, false);

                    // Add to the tile
                    const currentItems = gameMap.getItemsOnTile(tilePos.x, tilePos.y);
                    gameMap.setItemsOnTile(tilePos.x, tilePos.y, [...currentItems, item]);
                    
                    console.log(`[LootGenerator]   -> Placed ${item.name} at (${tilePos.x}, ${tilePos.y}) with ${item.ammoCount || 'fixed'} charges.`);
                }
            });
        }
    }

    /**
     * Apply Easy Start rules to the starting home building:
     * Guarantees 2 full water bottles, 2 canned beans, 2 canned corn, 1 book bag,
     * 1 work shirt, 1 blue jeans, 1 cooking pot, 1 lighter (5-10 charges), 
     * and 1 of [Machete, Fire axe, Hammer, Crowbar] at 100% condition.
     */
    applyEasyStartLoot(gameMap, buildingTiles, selectedTiles) {
        console.log('[LootGenerator] Running second pass starting home loot for Easy Start...');
        let waterBottleCount = 0;
        let beansCount = 0;
        let cornCount = 0;
        let bookBagCount = 0;
        let hasMeleeWeapon = false;
        let workShirtCount = 0;
        let blueJeansCount = 0;
        let lighterCount = 0;
        let potCount = 0;

        const meleeIDs = ['weapon.machete', 'weapon.fire_axe', 'weapon.hammer', 'weapon.crowbar'];

        // First pass: Count existing items on the starting home tiles
        buildingTiles.forEach(pos => {
            const items = gameMap.getItemsOnTile(pos.x, pos.y) || [];
            items.forEach(item => {
                if (item.defId === 'food.waterbottle') {
                    // Make it full
                    item.ammoCount = item.capacity || 20;
                    waterBottleCount++;
                } else if (item.defId === 'food.beans') {
                    beansCount++;
                } else if (item.defId === 'food.cannedcorn') {
                    cornCount++;
                } else if (item.defId === 'backpack.school') {
                    bookBagCount++;
                } else if (meleeIDs.includes(item.defId)) {
                    // Set condition to 100%
                    item.condition = 100;
                    hasMeleeWeapon = true;
                } else if (item.defId === 'clothing.workshirt') {
                    workShirtCount++;
                } else if (item.defId === 'clothing.blue_jeans') {
                    blueJeansCount++;
                } else if (item.defId === 'tool.lighter') {
                    // Ensure charges are between 5 and 10
                    if (item.ammoCount === undefined || item.ammoCount < 5 || item.ammoCount > 10) {
                        item.ammoCount = 5 + gameRandom.nextInt(0, 5); // 5-10
                    }
                    lighterCount++;
                } else if (item.defId === 'tool.cooking_pot') {
                    potCount++;
                }
            });
        });

        // Second pass: Spawn missing items
        const itemsToAdd = [];

        // 2 full water bottles
        if (waterBottleCount < 2) {
            const needed = 2 - waterBottleCount;
            for (let i = 0; i < needed; i++) {
                const water = createItemFromDef('food.waterbottle', { ammoCount: 20 });
                if (water) itemsToAdd.push(water);
            }
        }

        // 2 canned beans
        if (beansCount < 2) {
            const needed = 2 - beansCount;
            for (let i = 0; i < needed; i++) {
                const beans = createItemFromDef('food.beans');
                if (beans) itemsToAdd.push(beans);
            }
        }

        // 2 canned corn
        if (cornCount < 2) {
            const needed = 2 - cornCount;
            for (let i = 0; i < needed; i++) {
                const corn = createItemFromDef('food.cannedcorn');
                if (corn) itemsToAdd.push(corn);
            }
        }

        // 1 book bag
        if (bookBagCount < 1) {
            const bag = createItemFromDef('backpack.school');
            if (bag) itemsToAdd.push(bag);
        }

        // 1 melee weapon at 100% condition (Machete, Fire axe, Hammer, Crowbar)
        if (!hasMeleeWeapon) {
            const randomMeleeId = meleeIDs[gameRandom.nextInt(0, meleeIDs.length - 1)];
            const weapon = createItemFromDef(randomMeleeId, { condition: 100 });
            if (weapon) itemsToAdd.push(weapon);
        }

        // 1 work shirt
        if (workShirtCount < 1) {
            const shirt = createItemFromDef('clothing.workshirt');
            if (shirt) itemsToAdd.push(shirt);
        }

        // 1 blue jeans
        if (blueJeansCount < 1) {
            const jeans = createItemFromDef('clothing.blue_jeans');
            if (jeans) itemsToAdd.push(jeans);
        }

        // 1 lighter with 5-10 charges
        if (lighterCount < 1) {
            const charges = 5 + gameRandom.nextInt(0, 5);
            const lighter = createItemFromDef('tool.lighter', { ammoCount: charges });
            if (lighter) itemsToAdd.push(lighter);
        }

        // 1 cooking pot
        if (potCount < 1) {
            const pot = createItemFromDef('tool.cooking_pot');
            if (pot) itemsToAdd.push(pot);
        }

        console.log(`[LootGenerator] Easy Start: Adding ${itemsToAdd.length} missing items to the starting home.`);

        // Pick fallback tiles if selectedTiles is not set or empty
        const tilesToUse = selectedTiles && selectedTiles.length > 0 ? selectedTiles : buildingTiles;

        // Distribute items to the selected loot tiles randomly
        itemsToAdd.forEach(item => {
            const randomTile = tilesToUse[gameRandom.nextInt(0, tilesToUse.length - 1)];
            const currentItems = gameMap.getItemsOnTile(randomTile.x, randomTile.y) || [];
            gameMap.setItemsOnTile(randomTile.x, randomTile.y, [...currentItems, item]);
            console.log(`[LootGenerator]   -> Placed guaranteed ${item.name} at (${randomTile.x}, ${randomTile.y})`);
        });
    }
}
