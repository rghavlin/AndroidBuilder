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
 */
export class LootGenerator {
    constructor() {
        this.spawnCount = 20;
        this.insideWeight = 0.75; // 75% inside
        this.itemKeys = [];
        this.backpacksSpawned = 0;
    }

    /**
     * Spawn loot on the provided game map
     */
    spawnLoot(gameMap) {
        this.initItemKeys();

        const insideTiles = [];
        const outsideTiles = [];

        for (let y = 0; y < gameMap.height; y++) {
            for (let x = 0; x < gameMap.width; x++) {
                const tile = gameMap.getTile(x, y);
                if (!tile || !tile.isWalkable()) continue;

                if (tile.terrain === 'floor') {
                    insideTiles.push({ x, y });
                } else if (['road', 'sidewalk', 'grass'].includes(tile.terrain)) {
                    outsideTiles.push({ x, y });
                }
            }
        }

        const countInside = Math.floor(this.spawnCount * this.insideWeight);
        const countOutside = this.spawnCount - countInside;

        const selectedInside = this.getRandomSubarray(insideTiles, countInside);
        const selectedOutside = this.getRandomSubarray(outsideTiles, countOutside);

        const allSelected = [...selectedInside, ...selectedOutside];
        this.backpacksSpawned = 0;

        allSelected.forEach(pos => {
            const terrain = gameMap.getTile(pos.x, pos.y).terrain;
            const location = ['road', 'sidewalk', 'grass'].includes(terrain) ? 'outside' : 'inside';

            const items = this.generateRandomItems(location);
            if (items.length > 0) {
                gameMap.setItemsOnTile(pos.x, pos.y, items);
            }
        });
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
                if (key === 'weapon.makeshift_hatchet') return false;
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
            // Outdoor items: sticks and stones
            if (location === 'inside') {
                if (key === 'weapon.stick' || key === 'crafting.stone') return false;
            }
            return true;
        });

        const totalWeight = filteredKeys.reduce((sum, key) => {
            const rarity = ItemDefs[key].rarity || Rarity.COMMON;
            return sum + (RarityWeights[rarity] || 100);
        }, 0);

        let random = Math.random() * totalWeight;
        for (const key of filteredKeys) {
            const rarity = ItemDefs[key].rarity || Rarity.COMMON;
            const weight = RarityWeights[rarity] || 100;
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
        let hasGlassInPile = false;

        for (let i = 0; i < count; i++) {
            // Pick a weighted random item
            const randomKey = this.getWeightedRandomItemKey(location);
            const def = ItemDefs[randomKey];

            // 1. Map-wide limit: Max 1 backpack per map
            const isBackpack = def.equippableSlot === 'backpack';
            if (isBackpack && this.backpacksSpawned >= 1) continue;

            // 2. Pile limit: Max 1 food item per loot pile
            const isFood = (def.id && def.id.startsWith('food.')) || (def.categories && def.categories.includes(ItemCategory.FOOD));
            if (isFood && hasFoodInPile) continue;

            // 2b. Pile limit: Max 1 stone/bandage per pile
            if (randomKey === 'crafting.stone' && hasStoneInPile) continue;
            if (randomKey === 'medical.bandage' && hasBandageInPile) continue;
            if (randomKey === 'crafting.glass_shard' && hasGlassInPile) continue;

            // Create the item instance
            const selectedItem = createItemFromDef(randomKey);
            if (selectedItem) {
                // Track limits
                if (isBackpack) this.backpacksSpawned++;
                if (isFood) hasFoodInPile = true;
                if (randomKey === 'crafting.stone') hasStoneInPile = true;
                if (randomKey === 'medical.bandage') hasBandageInPile = true;
                if (randomKey === 'crafting.glass_shard') hasGlassInPile = true;

                // 3. Custom Stack Rules
                if (isFood || randomKey === 'crafting.stone' || randomKey === 'medical.bandage' || randomKey === 'crafting.glass_shard') {
                    // Food/Water/Stones/Bandages/Glass: Always spawn only 1 at a time (as a single unit)
                    selectedItem.stackCount = 1;
                } else if (randomKey === 'ammo.9mm') {
                    // 9mm: 1-10 rounds (override default stackMax logic)
                    selectedItem.stackCount = 1 + Math.floor(Math.random() * 10);
                } else if (randomKey === 'ammo.sniper') {
                    // Sniper: max 5 rounds
                    selectedItem.stackCount = 1 + Math.floor(Math.random() * 5);
                } else if (randomKey === 'crafting.rag') {
                    // Rags: max 2 per drop
                    selectedItem.stackCount = 1 + Math.floor(Math.random() * 2);
                } else if (randomKey === 'crafting.tape' || randomKey === 'crafting.wire') {
                    // Tape/Wire: 1-5 units
                    selectedItem.stackCount = 1 + Math.floor(Math.random() * 5);
                } else if (selectedItem.traits && selectedItem.traits.includes(ItemTrait.STACKABLE)) {
                    // General stackables: 1 to stackMax
                    selectedItem.stackCount = 1 + Math.floor(Math.random() * (selectedItem.stackMax || 1));
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
                if (selectedItem.capacity !== undefined && isFood && selectedItem.defId === 'food.waterbottle') {
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
                        magData.ammoCount = Math.floor(Math.random() * (magData.capacity + 1));
                        selectedItem.attachments = { 'ammo': magData };
                    }
                } else if (randomKey === 'weapon.sniper_rifle') {
                    const magData = createItemFromDef('attachment.sniper_magazine');
                    if (magData) {
                        magData.ammoCount = Math.floor(Math.random() * (magData.capacity + 1));
                        selectedItem.attachments = { 'ammo': magData };
                    }
                }

                // 6. Tool-specific logic (charges)
                if (randomKey === 'tool.lighter' || randomKey === 'tool.matchbook') {
                    if (selectedItem.capacity) {
                        // Start with 1 to capacity charges
                        selectedItem.ammoCount = 1 + Math.floor(Math.random() * selectedItem.capacity);
                    }
                }

                items.push(selectedItem);
            }
        }

        return items;
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
}
