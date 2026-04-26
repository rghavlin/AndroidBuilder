import { Item } from '../inventory/Item.js';
import { ItemDefs, createItemFromDef } from '../inventory/ItemDefs.js';
import { ItemTrait, Rarity, RarityWeights, ItemCategory } from '../inventory/traits.js';
import { SPECIAL_BUILDING_LOOT, ZOMBIE_LOOT, MAP_WIDE_UNIQUES } from './LootTables.js';

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
        this.insideWeight = 0.75; // Legacy, kept for compatibility if needed
        this.itemKeys = [];
        this.backpacksSpawned = 0;
    }

    /**
     * Spawn loot on the provided game map
     */
    spawnLoot(gameMap) {
        this.initItemKeys();
        this.backpacksSpawned = 0;

        // 1. Identify special buildings and spawn specialized loot
        if (gameMap.specialBuildings) {
            gameMap.specialBuildings.forEach(building => {
                this.spawnSpecialLoot(gameMap, building);
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
            if (Math.random() < 0.95) {
                dropCount++;
                // 60% chance for 2nd
                if (Math.random() < 0.60) {
                    dropCount++;
                    // 35% chance for 3rd
                    if (Math.random() < 0.35) {
                        dropCount++;
                        // 15% chance for 4th
                        if (Math.random() < 0.15) {
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
                    const items = this.generateRandomItems('inside');
                    if (items.length > 0) {
                        gameMap.setItemsOnTile(pos.x, pos.y, items);
                    }
                });
                console.log(`[LootGenerator] Building ${index + 1}: Spawned ${dropCount} loot drops on ${nonDoorTiles.length} eligible tiles (${buildingTiles.length - nonDoorTiles.length} door tiles excluded)`);
            }

            // Phase 25: Guaranteed Building Loot (Every building has 1-3 planks)
            const guaranteedTiles = buildingTiles.filter(pos => !this.isNearDoor(gameMap, pos.x, pos.y));
            if (guaranteedTiles.length > 0) {
                const plankCount = 1 + Math.floor(Math.random() * 3);
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

        // 2. Identify outdoor tiles and spawn outdoor loot (excluding doorway tiles)
        const outdoorTiles = [];
        for (let y = 0; y < gameMap.height; y++) {
            for (let x = 0; x < gameMap.width; x++) {
                const tile = gameMap.getTile(x, y);
                if (!tile || !tile.isWalkable()) continue;
                
                // PHASE 15 Fix: Strict door buffer zone for outdoor loot
                if (this.isNearDoor(gameMap, x, y)) continue;

                if (['road', 'sidewalk', 'grass'].includes(tile.terrain)) {
                    outdoorTiles.push({ x, y });
                }
            }
        }

        const outdoorDropCount = 18 + Math.floor(Math.random() * 7); // Increased density from 15-20 to 18-24 (20% increase)
        const selectedOutdoor = this.getRandomSubarray(outdoorTiles, outdoorDropCount);

        selectedOutdoor.forEach(pos => {
            const items = this.generateRandomItems('outside');
            if (items.length > 0) {
                gameMap.setItemsOnTile(pos.x, pos.y, items);
            }
        });
        console.log(`[LootGenerator] Outdoor: Spawned ${outdoorDropCount} loot drops on ${outdoorTiles.length} tiles`);
        
        // Phase 25: Designate Low Spots for Water Puddles
        const lowSpotCount = 3 + Math.floor(Math.random() * 3); // 3 to 5
        const potentialLowSpots = outdoorTiles.filter(pos => gameMap.getItemsOnTile(pos.x, pos.y).length === 0);
        const lowSpots = this.getRandomSubarray(potentialLowSpots, lowSpotCount);
        gameMap.lowSpots = lowSpots;
        
        // Spawn one 50-unit puddle in a random low spot initially
        if (lowSpots.length > 0) {
            const pos = lowSpots[Math.floor(Math.random() * lowSpots.length)];
            const puddle = createItemFromDef('environment.water_puddle');
            if (puddle) {
                puddle.ammoCount = 50;
                gameMap.setItemsOnTile(pos.x, pos.y, [puddle]);
                console.log(`[LootGenerator] Designated ${lowSpotCount} low spots and spawned initial 50-unit puddle at (${pos.x}, ${pos.y})`);
            }
        }
        
        // 3. Spawn Furniture (Independent of loot drops)
        this.spawnFurniture(gameMap);
        
        // Spawn Generator (1 per map, behind a building)
        this.spawnGenerator(gameMap);

        // 4. Final Pass: Apply map-wide unique loot rules
        this.applyMapWideUniqueRules(gameMap);
    }

    /**
     * Spawn specialized furniture (Beds) in residential buildings
     */
    spawnFurniture(gameMap) {
        const buildings = (gameMap.buildings || []).filter(b => b.type === 'residential');
        let bedsSpawned = 0;

        buildings.forEach(building => {
            // 25% chance to spawn a bed in a residential house 
            if (Math.random() > 0.25) return;

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
                const pos = floorTiles[Math.floor(Math.random() * floorTiles.length)];
                const bedItem = createItemFromDef('placeable.bed');
                if (bedItem) {
                    // Place directly on tile
                    gameMap.setItemsOnTile(pos.x, pos.y, [bedItem]);
                    bedsSpawned++;
                }
            }
        });

        console.log(`[LootGenerator] Furniture: Spawned ${bedsSpawned} beds across ${buildings.length} residential buildings`);
        
        // Phase 25: Toy Wagon Spawn (35% chance per map, strictly outdoor)
        if (Math.random() < 0.35) {
            const outdoorTiles = [];
            const buildings = gameMap.buildings || [];
            
            for (let y = 0; y < gameMap.height; y++) {
                for (let x = 0; x < gameMap.width; x++) {
                    const tile = gameMap.getTile(x, y);
                    // 1. Terrain must be outdoor
                    if (tile && ['road', 'sidewalk', 'grass'].includes(tile.terrain)) {
                        // 2. Must NOT be inside a building rectangle
                        const isInside = buildings.some(b => 
                            x >= b.x && x < b.x + b.width && y >= b.y && y < b.y + b.height
                        );
                        if (isInside) continue;

                        // 3. Must NOT be near a door
                        if (this.isNearDoor(gameMap, x, y)) continue;

                        // 4. Must be empty
                        const existing = gameMap.getItemsOnTile(x, y);
                        if (!existing || existing.length === 0) {
                            outdoorTiles.push({ x, y });
                        }
                    }
                }
            }
            
            if (outdoorTiles.length > 0) {
                const pos = outdoorTiles[Math.floor(Math.random() * outdoorTiles.length)];
                const wagon = createItemFromDef('vehicle.toy_wagon');
                if (wagon) {
                    gameMap.setItemsOnTile(pos.x, pos.y, [wagon]);
                    console.log(`[LootGenerator] Furniture: Spawned single Toy Wagon at (${pos.x}, ${pos.y})`);
                }
            }
        }

        // Electric Mower Spawn (Guaranteed 1 per map, strictly on grass)
        const grassTiles = [];
        const buildingsForMower = gameMap.buildings || [];
        
        for (let y = 0; y < gameMap.height; y++) {
            for (let x = 0; x < gameMap.width; x++) {
                const tile = gameMap.getTile(x, y);
                if (tile && tile.terrain === 'grass') {
                    // 1. Must NOT be inside a building rectangle
                    const isInside = buildingsForMower.some(b => 
                        x >= b.x && x < b.x + b.width && y >= b.y && y < b.y + b.height
                    );
                    if (isInside) continue;

                    // 2. Must NOT be near a door
                    if (this.isNearDoor(gameMap, x, y)) continue;

                    // 3. Must be empty
                    const existing = gameMap.getItemsOnTile(x, y);
                    if (!existing || existing.length === 0) {
                        grassTiles.push({ x, y });
                    }
                }
            }
        }

        if (grassTiles.length > 0) {
            const pos = grassTiles[Math.floor(Math.random() * grassTiles.length)];
            const mower = createItemFromDef('furniture.electric_mower');
            if (mower) {
                this._applySpawnDefaults(mower, false);
                gameMap.setItemsOnTile(pos.x, pos.y, [mower]);
                console.log(`[LootGenerator] Furniture: Spawned single Electric Mower at (${pos.x}, ${pos.y})`);
            }
        }
    }

    /**
     * Spawn a single generator behind a building
     */
    spawnGenerator(gameMap) {
        const buildings = (gameMap.buildings || []).filter(b => b.type === 'residential');
        if (buildings.length === 0) return;

        // Shuffle buildings to try different ones if the first choice is blocked
        const shuffledBuildings = [...buildings].sort(() => Math.random() - 0.5);
        
        for (const building of shuffledBuildings) {
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
                    generator.ammoCount = Math.floor(Math.random() * 6);
                    gameMap.setItemsOnTile(spawnX, spawnY, [generator]);
                    console.log(`[LootGenerator] Spawned Generator behind building at (${spawnX}, ${spawnY})`);
                    return; // Spawn only one
                }
            }
        }
        
        console.warn('[LootGenerator] Could not find a suitable spot behind any building for the generator.');
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
    getWeightedRandomItemKey(location = 'any') {
        this.initItemKeys();
        const filteredKeys = this.itemKeys.filter(key => {
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

        let random = Math.random() * totalWeight;
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
    generateRandomItems(location = 'any') {
        const count = 1 + Math.floor(Math.random() * 3);
        const items = [];
        let hasFoodInPile = false;
        const seenKeysInPile = new Set();

        for (let i = 0; i < count; i++) {
            // Pick a weighted random item
            const randomKey = this.getWeightedRandomItemKey(location);
            const def = ItemDefs[randomKey];

            // 1. Map-wide limit: Max 1 backpack per map
            const isBackpack = def.equippableSlot === 'backpack' || (Array.isArray(def.equippableSlot) && def.equippableSlot.includes('backpack'));
            if (isBackpack && this.backpacksSpawned >= 1) continue;

            // 2. Pile limit: Max 1 food item per loot pile
            const isFood = (def.id && def.id.startsWith('food.')) || (def.categories && def.categories.includes(ItemCategory.FOOD));
            if (isFood && hasFoodInPile) continue;

            // 2b. Pile limit: Items that should be restricted to 1 per pile
            if (def.pileLimitOne && seenKeysInPile.has(randomKey)) continue;

            // Create the item instance
            const selectedItem = createItemFromDef(randomKey);
            if (selectedItem) {
                // Track limits
                if (isBackpack) this.backpacksSpawned++;
                if (isFood) hasFoodInPile = true;
                seenKeysInPile.add(randomKey);

                // Apply defaults (stack count, condition, ammo, etc.)
                this._applySpawnDefaults(selectedItem, false);

                items.push(selectedItem);
            }
        }

        return items;
    }

    /**
     * Spawn specialized loot in a special building
     */
    spawnSpecialLoot(gameMap, building) {
        const { type, x, y, width, height } = building;
        
        // Fuel Cover Spawning for Gas Stations
        if (type === 'gas_station') {
            const isLeft = building.isLeft;
            const coverX = isLeft ? x + width : x - 3;
            const coverY = y;
            
            const coverData = createItemFromDef('furniture.fuel_cover');
            if (coverData) {
                const cover = Item.fromJSON(coverData);
                cover.ammoCount = 5 + Math.floor(Math.random() * 16); // 5-20
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

        // 3 to 6 drops
        const dropCount = 3 + Math.floor(Math.random() * 4);
        const selectedTiles = this.getRandomSubarray(floorTiles, dropCount);

        console.log(`[LootGenerator] Spawning specialized loot for ${type} in ${dropCount} drops`);

        // Building-wide random rolls (ONE per building)
        const buildingState = {
            gunSpawned: false,
            toolSpawned: false,
            backpackSpawned: false,
            hasGun: Math.random() < 0.5,
            hasTool: Math.random() < 0.5,
            hasBackpack: Math.random() < 0.25,
            gunDropIndex: -1,
            toolDropIndex: -1,
            backpackDropIndex: -1
        };

        if (type === 'police') {
            buildingState.gunDropIndex = buildingState.hasGun ? Math.floor(Math.random() * dropCount) : -1;
            buildingState.backpackDropIndex = buildingState.hasBackpack ? Math.floor(Math.random() * dropCount) : -1;
        } else if (type === 'firestation') {
            buildingState.toolDropIndex = buildingState.hasTool ? Math.floor(Math.random() * dropCount) : -1;
            buildingState.backpackDropIndex = buildingState.hasBackpack ? Math.floor(Math.random() * dropCount) : -1;
        } else if (type === 'army_tent') {
            buildingState.hasSniper = Math.random() < 0.35;
            buildingState.has9mm = Math.random() < 0.50;
            buildingState.hasBackpack = Math.random() < 0.35;
            buildingState.sniperDropIndex = buildingState.hasSniper ? Math.floor(Math.random() * dropCount) : -1;
            buildingState.gun9mmDropIndex = buildingState.has9mm ? Math.floor(Math.random() * dropCount) : -1;
            buildingState.backpackDropIndex = buildingState.hasBackpack ? Math.floor(Math.random() * dropCount) : -1;
        }

        selectedTiles.forEach((pos, index) => {
            let items = [];
            
            // Standard indoor loot base for police and fire stations
            if (type === 'police' || type === 'firestation') {
                items = this.generateRandomItems('inside');
            }

            // Guaranteed drops for some buildings on the first tile
            if (index === 0) {
                if (type === 'grocer' || type === 'gas_station') {
                    // Guaranteed full water bottle
                    const water = createItemFromDef('food.waterbottle');
                    if (water) {
                        water.ammoCount = water.capacity;
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
                    if (Math.random() < 0.5) {
                        const medKeys = SPECIAL_BUILDING_LOOT.firestation.medical;
                        const medKey = medKeys[Math.floor(Math.random() * medKeys.length)];
                        const med = createItemFromDef(medKey);
                        if (med) {
                            med.stackCount = 1;
                            items.push(med);
                        }
                    }

                    // 50% chance for ONE fire tool in building
                    if (index === buildingState.toolDropIndex) {
                        const toolKeys = SPECIAL_BUILDING_LOOT.firestation.tools;
                        const toolKey = toolKeys[Math.floor(Math.random() * toolKeys.length)];
                        const tool = createItemFromDef(toolKey);
                        if (tool) items.push(tool);
                    }

                    // 25% chance for ONE backpack in building (Shared with police logic)
                    if (index === buildingState.backpackDropIndex) {
                        const backpack = createItemFromDef('backpack.standard');
                        if (backpack) items.push(backpack);
                    }
                    break;
                case 'police':
                    // 50% chance for ammo in each loot drop
                    if (Math.random() < 0.5) {
                        const ammoKeys = SPECIAL_BUILDING_LOOT.police.ammo;
                        const ammoKey = ammoKeys[Math.floor(Math.random() * ammoKeys.length)];
                        const ammo = createItemFromDef(ammoKey);
                        if (ammo) {
                            ammo.stackCount = 1;
                            items.push(ammo);
                        }
                    }
                    
                    // 50% chance for ONE gun in building
                    if (index === buildingState.gunDropIndex) {
                        const gunKeys = SPECIAL_BUILDING_LOOT.police.guns;
                        const gunKey = gunKeys[Math.floor(Math.random() * gunKeys.length)];
                        const gun = createItemFromDef(gunKey);
                        if (gun) {
                            this._initializeWeaponAmmo(gun);
                            items.push(gun);
                        }
                    }

                    // 25% chance for ONE backpack in building
                    if (index === buildingState.backpackDropIndex) {
                        const backpack = createItemFromDef('backpack.standard');
                        if (backpack) items.push(backpack);
                    }
                    break;
                case 'army_tent':
                    // ARMY TENT RULES:
                    // 1-2 stacks of ammo in EVERY drop
                    const ammoStackCount = 1 + Math.floor(Math.random() * 2); 
                    for(let i=0; i < ammoStackCount; i++) {
                        const ammoTypes = SPECIAL_BUILDING_LOOT.army_tent.ammo;
                        const ammoKey = ammoTypes[Math.floor(Math.random() * ammoTypes.length)];
                        const ammo = createItemFromDef(ammoKey);
                        if (ammo) {
                            ammo.stackCount = 10 + Math.floor(Math.random() * 11); // 10-20
                            items.push(ammo);
                        }
                    }

                    // Gun mods: possible in every drop
                    if (Math.random() < 0.25) { // 25% chance for a mod in a drop
                        const modKeys = SPECIAL_BUILDING_LOOT.army_tent.mods;
                        const modKey = modKeys[Math.floor(Math.random() * modKeys.length)];
                        const mod = createItemFromDef(modKey);
                        if (mod) items.push(mod);
                    }

                    // Building-wide rolled items
                    if (index === buildingState.sniperDropIndex) {
                        const sniper = createItemFromDef('weapon.sniper_rifle');
                        if (sniper) {
                            this._initializeWeaponAmmo(sniper);
                            items.push(sniper);
                        }
                    }
                    if (index === buildingState.gun9mmDropIndex) {
                        const pistol = createItemFromDef('weapon.9mmPistol');
                        if (pistol) {
                            this._initializeWeaponAmmo(pistol);
                            items.push(pistol);
                        }
                    }
                    if (index === buildingState.backpackDropIndex) {
                        const backpack = createItemFromDef('backpack.hiking');
                        if (backpack) items.push(backpack);
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
        return !!(tile && tile.contents.some(e => e.type === 'door'));
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
            const x = Math.floor(Math.random() * len);
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
     * Generate loot for a zombie when it's killed.
     * @param {string} subtype - The zombie's subtype ('basic', 'crawler', 'firefighter')
     * @returns {Array} - Array of Item instances
     */
    generateZombieLoot(subtype = 'basic') {
        this.initItemKeys();
        const itemCount = Math.random() < 0.5 ? 1 : 2;
        const items = [];
        let hasBeltInLoot = false;

        for (let i = 0; i < itemCount; i++) {
            let selectedKey = null;

            if (subtype === 'firefighter') {
                const firefighterRoll = Math.random();
                if (firefighterRoll < 0.3) {
                    const specializedKeys = ZOMBIE_LOOT.firefighter.specialized;
                    selectedKey = specializedKeys[Math.floor(Math.random() * specializedKeys.length)];
                } else if (firefighterRoll < 0.6) {
                    const medicalKeys = ZOMBIE_LOOT.firefighter.medical;
                    selectedKey = medicalKeys[Math.floor(Math.random() * medicalKeys.length)];
                } else if (firefighterRoll < 0.8) {
                    selectedKey = 'food.waterbottle';
                } else {
                    // Fall back to common items for remaining chance
                    const commonKeys = ZOMBIE_LOOT.firefighter.common;
                    selectedKey = commonKeys[Math.floor(Math.random() * commonKeys.length)];
                }
            } else if (subtype === 'swat') {
                const swatRoll = Math.random();
                if (swatRoll < 0.4) {
                    const swatGear = ZOMBIE_LOOT.swat.gear;
                    selectedKey = swatGear[Math.floor(Math.random() * swatGear.length)];
                } else if (swatRoll < 0.8) {
                    const ammoKeys = ZOMBIE_LOOT.swat.ammo;
                    selectedKey = ammoKeys[Math.floor(Math.random() * ammoKeys.length)];
                } else {
                    selectedKey = 'food.waterbottle';
                }
            } else if (subtype === 'soldier') {
                const soldierRoll = Math.random();
                if (soldierRoll < 0.4) {
                    const soldierGear = ZOMBIE_LOOT.soldier.gear;
                    selectedKey = soldierGear[Math.floor(Math.random() * soldierGear.length)];
                } else if (soldierRoll < 0.8) {
                    const ammoKeys = ZOMBIE_LOOT.soldier.ammo;
                    selectedKey = ammoKeys[Math.floor(Math.random() * ammoKeys.length)];
                } else {
                    selectedKey = 'food.waterbottle';
                }
            } else {
                const tierRoll = Math.random();
                if (tierRoll < 0.65) {
                    // Common: any clothing or rag
                    const commonKeys = this.itemKeys.filter(key => {
                        const def = ItemDefs[key];
                        return (def.categories && def.categories.includes(ItemCategory.CLOTHING)) || key === 'crafting.rag';
                    });
                    selectedKey = commonKeys[Math.floor(Math.random() * commonKeys.length)];
                } else if (tierRoll < 0.85) {
                    // Uncommon: granola bar, chips, water bottle (small amount), soft drink, energy drink, bandage, antibiotics
                    const uncommonKeys = ZOMBIE_LOOT.uncommon;
                    selectedKey = uncommonKeys[Math.floor(Math.random() * uncommonKeys.length)];
                } else if (tierRoll < 0.95) {
                    // Rare: Any ammo, knife, lighter, matches
                    const rareKeys = this.itemKeys.filter(key => {
                        const def = ItemDefs[key];
                        return (def.categories && def.categories.includes(ItemCategory.AMMO)) ||
                            key === 'weapon.knife' || key === 'tool.lighter' || key === 'tool.matchbook';
                    });
                    selectedKey = rareKeys[Math.floor(Math.random() * rareKeys.length)];
                } else {
                    // Extremely rare: 9mm pistol, 357 pistol, shotgun, Flashlight
                    const exoticKeys = ZOMBIE_LOOT.exotic;
                    selectedKey = exoticKeys[Math.floor(Math.random() * exoticKeys.length)];
                }
            }
            
            // Pile limit: Max 1 leather belt per zombie loot
            if (selectedKey === 'crafting.leather_belt' && hasBeltInLoot) continue;

            if (selectedKey) {
                const item = createItemFromDef(selectedKey);
                if (item) {
                    if (selectedKey === 'crafting.leather_belt') hasBeltInLoot = true;
                    
                    // Apply defaults (stack count, condition, ammo, etc.)
                    this._applySpawnDefaults(item, true);

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
        const count = min + Math.floor(Math.random() * (max - min + 1));
        for (let i = 0; i < count; i++) {
            const totalWeight = table.reduce((sum, entry) => sum + entry.weight, 0);
            let random = Math.random() * totalWeight;
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
                this._applySpawnDefaults(item, false);
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
    _applySpawnDefaults(item, isZombieLoot = false) {
        if (!item || !item.defId) return;
        const def = ItemDefs[item.defId];
        if (!def) return;

        // 1. Stack Count Randomization
        if (def.spawnStackMin !== undefined && def.spawnStackMax !== undefined) {
            item.stackCount = def.spawnStackMin + Math.floor(Math.random() * (def.spawnStackMax - def.spawnStackMin + 1));
        } else {
            // Default stack count for non-special items
            item.stackCount = 1;
        }

        // 2. Ammo / Charge / Water Randomization
        if (def.spawnAmmoPercent !== undefined && item.capacity) {
            // Apply randomized fill based on capacity
            item.ammoCount = Math.floor(Math.random() * (item.capacity * def.spawnAmmoPercent + 1));
        } else if (item.traits && item.traits.includes(ItemTrait.BATTERY)) {
            // Batteries always spawn as a single item with a FULL charge
            item.ammoCount = item.capacity || 10;
        }

        // 3. Condition Randomization (for DEGRADABLE items)
        if (item.traits && item.traits.includes(ItemTrait.DEGRADABLE)) {
            const minCondition = isZombieLoot ? 10 : 15;
            const maxCondition = isZombieLoot ? 70 : 100;
            item.condition = Math.floor(Math.random() * (maxCondition - minCondition + 1)) + minCondition;
        }

        // Fuel Can randomization (1-10 units)
        if (item.defId === 'tool.fuel_can') {
            item.ammoCount = 1 + Math.floor(Math.random() * 10);
        }

        // 4. Special cases (Battery Powered items, Weapons)
        if (item.traits && item.traits.includes(ItemTrait.BATTERY_POWERED)) {
            const batterySlot = item.attachmentSlots?.find(s => s.type === 'battery' || s.id === 'battery');
            if (batterySlot) {
                const battery = createItemFromDef('tool.battery');
                if (battery) {
                    battery.ammoCount = 1 + Math.floor(Math.random() * (battery.capacity || 10));
                    if (!item.attachments) item.attachments = {};
                    item.attachments[batterySlot.id] = battery;
                }
            }
        }

        // Mower / Large Battery initialization
        if (item.defId === 'furniture.electric_mower') {
            const batterySlot = item.attachmentSlots?.find(s => s.id === 'battery');
            if (batterySlot) {
                const battery = createItemFromDef('tool.large_battery');
                if (battery) {
                    battery.ammoCount = 1 + Math.floor(Math.random() * (battery.capacity || 100));
                    if (!item.attachments) item.attachments = {};
                    item.attachments[batterySlot.id] = battery;
                }
            }
        }

        const isWeapon = (item.categories && item.categories.includes(ItemCategory.WEAPON)) || !!item.attachmentSlots;
        if (isWeapon && (item.categories?.includes(ItemCategory.GUN) || item.attachmentSlots)) {
            this._initializeWeaponAmmo(item);
        }
    }

    /**
     * Centralized weapon initialization logic
     * Handles spawning appropriate magazines or loose ammo with randomized counts
     */
    _initializeWeaponAmmo(item) {
        if (!item || !item.defId) return;

        // 1. Locate the 'ammo' slot (contains Magazines OR loose ammo)
        const ammoSlot = item.attachmentSlots?.find(s => 
            s.id === 'ammo' || (s.allowedCategories && s.allowedCategories.includes('ammunition'))
        );
        if (!ammoSlot) return;

        // 2. Identify the appropriate ammo source
        const ammoDefId = ammoSlot.allowedItems?.[0]; // Default to first allowed item
        if (!ammoDefId) return;

        const ammoData = createItemFromDef(ammoDefId);
        if (!ammoData) return;

        // 3. Randomize based on weapon type and capacity
        if (ammoData.capacity !== undefined && ammoData.capacity > 0) {
            // MAGAZINE-FED (9mm, Sniper)
            ammoData.ammoCount = 1 + Math.floor(Math.random() * ammoData.capacity);
            console.log(`[Loot] Initialized ${item.defId} with magazine (${ammoData.ammoCount}/${ammoData.capacity} rounds)`);
        } else {
            // INTERNALLY-FED (.357, Shotgun, Hunting Rifle)
            const def = ItemDefs[item.defId];
            const maxRand = def?.spawnMaxRounds || 6;
            
            ammoData.stackCount = 1 + Math.floor(Math.random() * maxRand);
            console.log(`[Loot] Initialized ${item.defId} with ${ammoData.stackCount} internally loaded rounds`);
        }

        // 4. Attach to item
        if (!item.attachments) item.attachments = {};
        item.attachments[ammoSlot.id] = ammoData;
    }

    /**
     * Final pass logic to ensure specific rare items spawn exactly once map-wide.
     * Items are added to existing loot piles to ensure they are found in logical locations.
     */
    applyMapWideUniqueRules(gameMap) {
        if (!gameMap) return;
        
        // 1. Collect all tiles that currently have loot
        const lootTiles = [];
        for (let y = 0; y < gameMap.height; y++) {
            for (let x = 0; x < gameMap.width; x++) {
                const items = gameMap.getItemsOnTile(x, y);
                if (items && items.length > 0) {
                    lootTiles.push({ x, y });
                }
            }
        }

        if (lootTiles.length === 0) {
            console.warn('[LootGenerator] No loot piles found on map to place unique items!');
            return;
        }

        // 2. Define unique items to spawn exactly once
        const uniqueSpawns = MAP_WIDE_UNIQUES;

        console.log(`[LootGenerator] Applying map-wide rules for ${uniqueSpawns.length} unique items...`);

        uniqueSpawns.forEach(config => {
            // Pick a random existing loot pile
            const tilePos = lootTiles[Math.floor(Math.random() * lootTiles.length)];
            const item = createItemFromDef(config.defId);
            
            if (item) {
                // Randomize charges (ammoCount)
                if (item.capacity) {
                    item.ammoCount = 1 + Math.floor(Math.random() * item.capacity);
                }

                // Add to the tile
                const currentItems = gameMap.getItemsOnTile(tilePos.x, tilePos.y);
                gameMap.setItemsOnTile(tilePos.x, tilePos.y, [...currentItems, item]);
                
                console.log(`[LootGenerator]   -> Placed ${item.name} at (${tilePos.x}, ${tilePos.y}) with ${item.ammoCount || 'fixed'} charges.`);
            }
        });
    }
}
