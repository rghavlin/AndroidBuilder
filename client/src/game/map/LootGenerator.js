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
        const buildings = this.getBuildings(gameMap);
        console.log(`[LootGenerator] Detected ${buildings.length} normal buildings for indoor loot`);

        buildings.forEach((buildingTiles, index) => {
            let dropCount = 0;

            // Tiered probability for loot drops in building
            // 90% chance for 1st
            if (Math.random() < 0.90) {
                dropCount++;
                // 50% chance for 2nd
                if (Math.random() < 0.50) {
                    dropCount++;
                    // 25% chance for 3rd
                    if (Math.random() < 0.25) {
                        dropCount++;
                        // 10% chance for 4th
                        if (Math.random() < 0.10) {
                            dropCount++;
                        }
                    }
                }
            }

            if (dropCount > 0) {
                // Exclude doorway tiles from building loot candidates
                const nonDoorTiles = buildingTiles.filter(pos => !this.hasDoorOnTile(gameMap, pos.x, pos.y));
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
                if (this.hasDoorOnTile(gameMap, x, y)) continue;

                if (['road', 'sidewalk', 'grass'].includes(tile.terrain)) {
                    outdoorTiles.push({ x, y });
                }
            }
        }

        const outdoorDropCount = 15 + Math.floor(Math.random() * 6); // 15 to 20
        const selectedOutdoor = this.getRandomSubarray(outdoorTiles, outdoorDropCount);

        selectedOutdoor.forEach(pos => {
            const items = this.generateRandomItems('outside');
            if (items.length > 0) {
                gameMap.setItemsOnTile(pos.x, pos.y, items);
            }
        });
        console.log(`[LootGenerator] Outdoor: Spawned ${outdoorDropCount} loot drops on ${outdoorTiles.length} tiles`);
    }

    /**
     * Identify contiguous floor tiles as buildings
     */
    getBuildings(gameMap) {
        const buildings = [];
        const visited = new Set();

        for (let y = 0; y < gameMap.height; y++) {
            for (let x = 0; x < gameMap.width; x++) {
                const tile = gameMap.getTile(x, y);
                const key = `${x},${y}`;

                if (tile && tile.terrain === 'floor' && !visited.has(key)) {
                    // Skip if tile is part of a special building
                    const isSpecial = gameMap.specialBuildings?.some(b => 
                        x >= b.x && x < b.x + b.width && y >= b.y && y < b.y + b.height
                    );
                    if (isSpecial) continue;

                    // Start flood fill for new building
                    const buildingTiles = [];
                    const queue = [{ x, y }];
                    visited.add(key);

                    while (queue.length > 0) {
                        const current = queue.shift();
                        buildingTiles.push(current);

                        // Check neighbors
                        const neighbors = [
                            { x: current.x + 1, y: current.y },
                            { x: current.x - 1, y: current.y },
                            { x: current.x, y: current.y + 1 },
                            { x: current.x, y: current.y - 1 }
                        ];

                        for (const neighbor of neighbors) {
                            const nKey = `${neighbor.x},${neighbor.y}`;
                            const nTile = gameMap.getTile(neighbor.x, neighbor.y);

                            if (nTile && nTile.terrain === 'floor' && !visited.has(nKey)) {
                                visited.add(nKey);
                                queue.push(neighbor);
                            }
                        }
                    }
                    buildings.push(buildingTiles);
                }
            }
        }
        return buildings;
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

                // 3. Conditional Stacks (Corn seeds drop in stacks of 2-3, others 1 unit)
                if (selectedItem.defId === 'food.cornseeds') {
                    selectedItem.stackCount = 2 + Math.floor(Math.random() * 2); // 2-3
                } else {
                    selectedItem.stackCount = 1;
                }

                // 4. Weapon Condition Randomization (found in loot)
                const isWeaponItem = (selectedItem.categories && selectedItem.categories.includes(ItemCategory.WEAPON)) || !!selectedItem.attachmentSlots;
                const isDegradableItem = selectedItem.traits && selectedItem.traits.includes(ItemTrait.DEGRADABLE);

                if (isWeaponItem && isDegradableItem) {
                    const minCondition = 15;
                    const maxCondition = 100;
                    selectedItem.condition = Math.floor(Math.random() * (maxCondition - minCondition + 1)) + minCondition;
                    console.log(`[Loot] Randomized condition for ${selectedItem.name}: ${selectedItem.condition}%`);
                }

                // 4. Custom Water rules
                if (selectedItem.capacity !== undefined && isFood && (selectedItem.defId === 'food.waterbottle' || selectedItem.defId === 'food.waterjug')) {
                    // Water level: 
                    // 75% chance: mostly empty (0-4 units)
                    // 25% chance: significant fill (5-20 units)
                    if (Math.random() < 0.75) {
                        selectedItem.ammoCount = Math.floor(Math.random() * 5); // 0-4
                    } else {
                        selectedItem.ammoCount = 5 + Math.floor(Math.random() * (selectedItem.capacity - 4)); // 5-20
                    }
                }

                // 5. Firearm Attachment logic: Spawn with magazines and random ammo
                if (randomKey === 'weapon.9mmPistol') {
                    const magData = createItemFromDef('attachment.9mm_magazine');
                    if (magData) {
                        magData.ammoCount = 1;
                        selectedItem.attachments = { 'ammo': magData };
                    }
                } else if (randomKey === 'weapon.357Pistol' || randomKey === 'weapon.hunting_rifle') {
                    // .357 / Hunting Rifle: Load with 1 round
                    const ammoType = randomKey === 'weapon.357Pistol' ? 'ammo.357' : 'ammo.308';
                    const ammoData = createItemFromDef(ammoType);
                    if (ammoData) {
                        ammoData.stackCount = 1;
                        selectedItem.attachments = { 'ammo': ammoData };
                    }
                } else if (randomKey === 'weapon.sniper_rifle') {
                    const magData = createItemFromDef('attachment.sniper_magazine');
                    if (magData) {
                        magData.ammoCount = 1;
                        selectedItem.attachments = { 'ammo': magData };
                    }
                } else if (randomKey === 'tool.smallflashlight') {
                    // Flashlight: Spawn with a battery and 1 charge
                    const battery = createItemFromDef('tool.battery');
                    if (battery) {
                        battery.ammoCount = 1;
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
                if (tile && tile.terrain === 'floor' && !this.hasDoorOnTile(gameMap, curX, curY)) {
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
                        { key: 'food.granolabar', weight: 30 },
                        { key: 'food.chips', weight: 30 },
                        { key: 'food.beans', weight: 20 },
                        { key: 'food.waterbottle', weight: 15 },
                        { key: 'backpack.school', weight: 5 }
                    ];
                    this.addItemsFromTable(items, grocerTable, 1, 2);
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
                        if (gun) items.push(gun);
                    }

                    // 25% chance for ONE backpack in building
                    if (index === buildingState.backpackDropIndex) {
                        const backpack = createItemFromDef('backpack.standard');
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
                    if (selectedKey === 'food.cornseeds') {
                        item.stackCount = 2 + Math.floor(Math.random() * 2); // 2-3
                    } else {
                        item.stackCount = 1;
                    }

                    // Custom rules for items dropped by zombies
                    if (selectedKey === 'food.waterbottle') {
                        // Regular zombies drop small amount, firefighter drops FULL (or near full)
                        if (subtype === 'firefighter') {
                            item.ammoCount = item.capacity || 10;
                        } else {
                            item.ammoCount = Math.floor(Math.random() * 5);
                        }
                    } else if (item.categories && (item.categories.includes(ItemCategory.WEAPON) || item.attachmentSlots)) {
                        // Random condition for weapons (found on corpse)
                        const minCondition = 10;
                        const maxCondition = 70; // Slightly worse than world loot
                        item.condition = Math.floor(Math.random() * (maxCondition - minCondition + 1)) + minCondition;
                    }

                    // For firearms, if they have an ammo slot, give them a chance to have some rounds
                    if (selectedKey === 'weapon.9mmPistol') {
                        const magData = createItemFromDef('attachment.9mm_magazine');
                        if (magData) {
                            magData.ammoCount = 1;
                            item.attachments = { 'ammo': magData };
                        }
                    } else if (selectedKey === 'weapon.357Pistol') {
                        const ammoData = createItemFromDef('ammo.357');
                        if (ammoData) {
                            ammoData.stackCount = 1;
                            item.attachments = { 'ammo': ammoData };
                        }
                    } else if (selectedKey === 'weapon.shotgun') {
                        // Shotgun: 1 shell loaded
                        const ammoData = createItemFromDef('ammo.shotgun_shells');
                        if (ammoData) {
                            ammoData.stackCount = 1;
                            item.attachments = { 'ammo': ammoData };
                        }
                    } else if (selectedKey === 'tool.smallflashlight') {
                        // Flashlight from zombie: spawn with a battery and 1 charge
                        const battery = createItemFromDef('tool.battery');
                        if (battery) {
                            battery.ammoCount = 1;
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
                // Force no stacks
                item.stackCount = 1;
                
                // Custom stack/property rules for specialized items
                if (pickedKey === 'food.waterbottle') {
                    item.ammoCount = Math.floor(Math.random() * (item.capacity + 1));
                }
                items.push(item);
            }
        }
    }
}
