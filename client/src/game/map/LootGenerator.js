import { ItemDefs, createItemFromDef } from '../inventory/ItemDefs.js';
import { ItemTrait, Rarity, RarityWeights, ItemCategory } from '../inventory/traits.js';

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
        
        // 3. Spawn Furniture (Independent of loot drops)
        this.spawnFurniture(gameMap);
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
                if (key.startsWith('food.waterbottle_')) return false;
                if (key === 'weapon.makeshift_hammer') return false;
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
            // Outdoor items restricted logic if any (currently none, but location used for weighting)
            if (location === 'inside') {
                if (key === 'weapon.stick' || key === 'crafting.stone') return false;
            }
            return true;
        });

        const totalWeight = filteredKeys.reduce((sum, key) => {
            const rarity = ItemDefs[key].rarity || Rarity.COMMON;
            let weight = RarityWeights[rarity] || 100;

            // Prioritize outdoor items when spawning outside
            if (location === 'outside' || location === 'any') {
                if (key === 'weapon.stick' || key === 'crafting.stone') {
                    weight *= 10; // 10x bias for sticks and stones outdoors
                }
            }

            return sum + weight;
        }, 0);

        let random = Math.random() * totalWeight;
        for (const key of filteredKeys) {
            const rarity = ItemDefs[key].rarity || Rarity.COMMON;
            let weight = RarityWeights[rarity] || 100;

            if (location === 'outside' || location === 'any') {
                if (key === 'weapon.stick' || key === 'crafting.stone') {
                    weight *= 10;
                }
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
        let hasStoneInPile = false;
        let hasBandageInPile = false;
        let hasAntibioticsInPile = false;
        let hasGlassInPile = false;
        let hasBeltInPile = false;

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

            // 2b. Pile limit: Max 1 stone/bandage/belt per pile
            if (randomKey === 'crafting.stone' && hasStoneInPile) continue;
            if (randomKey === 'medical.bandage' && hasBandageInPile) continue;
            if (randomKey === 'medical.antibiotics' && hasAntibioticsInPile) continue;
            if (randomKey === 'crafting.glass_shard' && hasGlassInPile) continue;
            if (randomKey === 'crafting.leather_belt' && hasBeltInPile) continue;

            // Create the item instance
            const selectedItem = createItemFromDef(randomKey);
            if (selectedItem) {
                // Track limits
                if (isBackpack) this.backpacksSpawned++;
                if (isFood) hasFoodInPile = true;
                if (randomKey === 'crafting.stone') hasStoneInPile = true;
                if (randomKey === 'medical.bandage') hasBandageInPile = true;
                if (randomKey === 'medical.antibiotics') hasAntibioticsInPile = true;
                if (randomKey === 'crafting.glass_shard') hasGlassInPile = true;
                if (randomKey === 'crafting.leather_belt') hasBeltInPile = true;

                // 3. Conditional Stacks (Seeds drop in stacks of 2-3, others 1 unit)
                if (selectedItem.defId === 'food.cornseeds' || selectedItem.defId === 'food.tomatoseeds' || selectedItem.defId === 'food.carrotseeds') {
                    selectedItem.stackCount = 2 + Math.floor(Math.random() * 2); // 2-3
                } else if (selectedItem.categories?.includes(ItemCategory.AMMO) && selectedItem.traits?.includes(ItemTrait.STACKABLE)) {
                    selectedItem.stackCount = 3 + Math.floor(Math.random() * 4); // 3-6 rounds (Actual ammo only)
                } else if (selectedItem.defId === 'crafting.nail') {
                    selectedItem.stackCount = 1 + Math.floor(Math.random() * 5); // 1-5
                } else {
                    selectedItem.stackCount = 1;
                }

                // 4. Custom Water rules: Standardize to uniform distribution
                if (selectedItem.capacity !== undefined && isFood && (selectedItem.defId === 'food.waterbottle' || selectedItem.defId === 'food.waterjug')) {
                    selectedItem.ammoCount = Math.floor(Math.random() * (selectedItem.capacity + 1));
                }

                // 5. Weapon-specific logic: Random condition and ammo
                const isWeaponItem = (selectedItem.categories && selectedItem.categories.includes(ItemCategory.WEAPON)) || !!selectedItem.attachmentSlots;
                const isDegradableItem = selectedItem.traits && selectedItem.traits.includes(ItemTrait.DEGRADABLE);
                
                if (isWeaponItem) {
                    if (isDegradableItem) {
                        const minCondition = 15;
                        const maxCondition = 100;
                        selectedItem.condition = Math.floor(Math.random() * (maxCondition - minCondition + 1)) + minCondition;
                        console.log(`[Loot] Randomized condition for ${selectedItem.name}: ${selectedItem.condition}%`);
                    }

                    // Initialize ammo (magazines or internal rounds)
                    this._initializeWeaponAmmo(selectedItem);
                } else if (randomKey === 'tool.smallflashlight') {
                    // Flashlight: Spawn with a battery and random charges
                    const battery = createItemFromDef('tool.battery');
                    if (battery) {
                        battery.ammoCount = 1 + Math.floor(Math.random() * (battery.capacity || 10));
                        selectedItem.attachments = { 'battery': battery };
                    }
                }

                // 6. Tool-specific logic: always a single unit with random charges
                if (randomKey === 'tool.lighter' || randomKey === 'tool.matchbook') {
                    selectedItem.stackCount = 1;
                    if (selectedItem.capacity) {
                        selectedItem.ammoCount = 1 + Math.floor(Math.random() * selectedItem.capacity);
                    }
                } else if (randomKey === 'tool.battery') {
                    // Batteries always spawn as a single item with a FULL charge
                    selectedItem.stackCount = 1;
                    selectedItem.ammoCount = selectedItem.capacity || 10;
                }

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
                    const grocerTable = [
                        { key: 'food.granolabar', weight: 25 },
                        { key: 'food.chips', weight: 25 },
                        { key: 'food.beans', weight: 15 },
                        { key: 'food.tomato', weight: 10 },
                        { key: 'food.carrot', weight: 10 },
                        { key: 'food.corn', weight: 10 },
                        { key: 'food.cornseeds', weight: 5 },
                        { key: 'food.tomatoseeds', weight: 5 },
                        { key: 'food.carrotseeds', weight: 5 },
                        { key: 'food.waterbottle', weight: 10 },
                        { key: 'backpack.school', weight: 5 }
                    ];
                    this.addItemsFromTable(items, grocerTable, 1, 3);
                    break;
                case 'gas_station':
                    const gasTable = [
                        { key: 'food.chips', weight: 35 },
                        { key: 'food.granolabar', weight: 35 },
                        { key: 'food.waterbottle', weight: 20 },
                        { key: 'tool.lighter', weight: 10 }
                    ];
                    this.addItemsFromTable(items, gasTable, 1, 2);
                    break;
                case 'firestation':
                    // 50% chance for bandages or antibiotics in each loot drop
                    if (Math.random() < 0.5) {
                        const medKey = Math.random() < 0.5 ? 'medical.bandage' : 'medical.antibiotics';
                        const med = createItemFromDef(medKey);
                        if (med) {
                            med.stackCount = 1;
                            items.push(med);
                        }
                    }

                    // 50% chance for ONE fire tool in building
                    if (index === buildingState.toolDropIndex) {
                        const toolKeys = ['weapon.fire_axe', 'weapon.hammer', 'weapon.crowbar', 'weapon.machete'];
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
                        const ammoKeys = ['ammo.9mm', 'ammo.357', 'ammo.308', 'ammo.shotgun_shells'];
                        const ammoKey = ammoKeys[Math.floor(Math.random() * ammoKeys.length)];
                        const ammo = createItemFromDef(ammoKey);
                        if (ammo) {
                            ammo.stackCount = 1;
                            items.push(ammo);
                        }
                    }
                    
                    // 50% chance for ONE gun in building
                    if (index === buildingState.gunDropIndex) {
                        const gunKeys = ['weapon.9mmPistol', 'weapon.357Pistol', 'weapon.hunting_rifle', 'weapon.shotgun'];
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
                        const ammoTypes = ['ammo.9mm', 'ammo.sniper', 'ammo.shotgun_shells'];
                        const ammoKey = ammoTypes[Math.floor(Math.random() * ammoTypes.length)];
                        const ammo = createItemFromDef(ammoKey);
                        if (ammo) {
                            ammo.stackCount = 10 + Math.floor(Math.random() * 11); // 10-20
                            items.push(ammo);
                        }
                    }

                    // Gun mods: possible in every drop
                    if (Math.random() < 0.25) { // 25% chance for a mod in a drop
                        const modKeys = ['attachment.suppressor', 'attachment.lasersight', 'attachment.riflescope'];
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
                    const specializedKeys = ['weapon.fire_axe', 'weapon.hammer', 'weapon.crowbar', 'weapon.machete', 'clothing.paramedic_shirt'];
                    selectedKey = specializedKeys[Math.floor(Math.random() * specializedKeys.length)];
                } else if (firefighterRoll < 0.6) {
                    const medicalKeys = ['medical.bandage', 'medical.antibiotics'];
                    selectedKey = medicalKeys[Math.floor(Math.random() * medicalKeys.length)];
                } else if (firefighterRoll < 0.8) {
                    selectedKey = 'food.waterbottle';
                } else {
                    // Fall back to common items for remaining chance
                    const commonKeys = [
                        'clothing.pocket_t', 'clothing.sweatpants', 'crafting.rag'
                    ];
                    selectedKey = commonKeys[Math.floor(Math.random() * commonKeys.length)];
                }
            } else if (subtype === 'swat') {
                const swatRoll = Math.random();
                if (swatRoll < 0.4) {
                    const swatGear = ['weapon.9mmPistol', 'weapon.357Pistol', 'clothing.police_shirt'];
                    selectedKey = swatGear[Math.floor(Math.random() * swatGear.length)];
                } else if (swatRoll < 0.8) {
                    const ammoKeys = ['ammo.9mm', 'ammo.357', 'ammo.shotgun_shells', 'ammo.308'];
                    selectedKey = ammoKeys[Math.floor(Math.random() * ammoKeys.length)];
                } else {
                    selectedKey = 'food.waterbottle';
                }
            } else if (subtype === 'soldier') {
                const soldierRoll = Math.random();
                if (soldierRoll < 0.4) {
                    const soldierGear = ['weapon.9mmPistol', 'weapon.sniper_rifle', 'clothing.police_shirt']; 
                    selectedKey = soldierGear[Math.floor(Math.random() * soldierGear.length)];
                } else if (soldierRoll < 0.8) {
                    const ammoKeys = ['ammo.9mm', 'ammo.sniper', 'ammo.shotgun_shells'];
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
                    const uncommonKeys = [
                        'food.granolabar', 'food.chips', 'food.waterbottle', 'food.softdrink', 'food.energydrink',
                        'medical.bandage', 'medical.antibiotics', 'crafting.leather_belt'
                    ];
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
                    const exoticKeys = ['weapon.9mmPistol', 'weapon.357Pistol', 'weapon.shotgun', 'tool.smallflashlight'];
                    selectedKey = exoticKeys[Math.floor(Math.random() * exoticKeys.length)];
                }
            }
            
            // Pile limit: Max 1 leather belt per zombie loot
            if (selectedKey === 'crafting.leather_belt' && hasBeltInLoot) continue;

            if (selectedKey) {
                const item = createItemFromDef(selectedKey);
                if (item) {
                    if (selectedKey === 'crafting.leather_belt') hasBeltInLoot = true;
                    
                    // Conditional stacks for zombie loot
                    if (selectedKey === 'food.cornseeds' || selectedKey === 'food.tomatoseeds' || selectedKey === 'food.carrotseeds') {
                        item.stackCount = 2 + Math.floor(Math.random() * 2); // 2-3
                    } else if (item.categories?.includes(ItemCategory.AMMO) && item.traits?.includes(ItemTrait.STACKABLE)) {
                        item.stackCount = 3 + Math.floor(Math.random() * 4); // 3-6 (Actual ammo only)
                    } else {
                        item.stackCount = 1;
                    }

                    // Custom rules for items dropped by zombies: Standardize to uniform distribution
                    if (selectedKey === 'food.waterbottle') {
                        item.ammoCount = Math.floor(Math.random() * (item.capacity + 1));
                    } else if (item.categories && (item.categories.includes(ItemCategory.WEAPON) || item.attachmentSlots)) {
                        // Random condition for DEGRADABLE weapons (found on corpse)
                        if (item.traits && item.traits.includes(ItemTrait.DEGRADABLE)) {
                            const minCondition = 10;
                            const maxCondition = 70; // Slightly worse than world loot
                            item.condition = Math.floor(Math.random() * (maxCondition - minCondition + 1)) + minCondition;
                        }

                        // Initialize ammo (magazines or internal rounds)
                        this._initializeWeaponAmmo(item);
                    } else if (selectedKey === 'tool.smallflashlight') {
                        // Flashlight from zombie: spawn with a battery and random charges
                        const battery = createItemFromDef('tool.battery');
                        if (battery) {
                            battery.ammoCount = 1 + Math.floor(Math.random() * (battery.capacity || 10));
                            item.attachments = { 'battery': battery };
                        }
                    }

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
            
            const item = createItemFromDef(pickedKey);
            if (item) {
                // Default stack count
                if (item.defId === 'food.cornseeds' || item.defId === 'food.tomatoseeds' || item.defId === 'food.carrotseeds') {
                    item.stackCount = 2 + Math.floor(Math.random() * 2); // 2-3
                } else if (item.categories?.includes(ItemCategory.AMMO) && item.traits?.includes(ItemTrait.STACKABLE)) {
                    item.stackCount = 3 + Math.floor(Math.random() * 4); // 3-6 rounds (Actual ammo only)
                } else if (item.defId === 'crafting.nail') {
                    item.stackCount = 1 + Math.floor(Math.random() * 5); // 1-5
                } else {
                    item.stackCount = 1;
                }
               
                // Custom stack/property rules for specialized items
               if (pickedKey === 'food.waterbottle') {
                    item.ammoCount = Math.floor(Math.random() * (item.capacity + 1));
                }
                items.push(item);
            }
        }
    }

    /**
     * Helper to initialize magazine-fed firearms with a partially filled magazine.
     * @param {Item} item - Firearm item instance
     */
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
            let maxRand = 6;
            if (item.defId === 'weapon.hunting_rifle') maxRand = 4;
            
            ammoData.stackCount = 1 + Math.floor(Math.random() * maxRand);
            console.log(`[Loot] Initialized ${item.defId} with ${ammoData.stackCount} internally loaded rounds`);
        }

        // 4. Attach to item
        if (!item.attachments) item.attachments = {};
        item.attachments[ammoSlot.id] = ammoData;
    }
}
