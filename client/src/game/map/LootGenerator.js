import { ItemDefs, createItemFromDef } from '../inventory/ItemDefs.js';
import { ItemTrait } from '../inventory/traits.js';

/**
 * LootGenerator - Handles random item spawning on maps
 * Follows implementation_plan.md requirements:
 * - 20 spawn locations per map
 * - Majority inside (floor), small number outside
 * - Groups of 1-3 items
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
     * @param {GameMap} gameMap - The map to populate
     */
    spawnLoot(gameMap) {
        // Lazily initialize item keys to ensure ItemDefs is populated
        if (!this.itemKeys || this.itemKeys.length === 0) {
            this.itemKeys = Object.keys(ItemDefs).filter(key => {
                // Filter out internal sprite keys
                if (key.includes('.icon') || key.includes('.sprite')) return false;

                // Filter out specialized water bottle states - we'll randomize the base one
                if (key.startsWith('food.waterbottle_')) return false;

                return true;
            });
            console.log(`[LootGenerator] Initialized with ${this.itemKeys.length} item definitions`);
        }

        if (this.itemKeys.length === 0) {
            console.error('[LootGenerator] CRITICAL: No item definitions found! Spawning failed.');
            return;
        }

        console.log(`[LootGenerator] Spawning loot on ${gameMap.width}x${gameMap.height} map`);

        const insideTiles = [];
        const outsideTiles = [];

        // 1. Identify candidate tiles
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

        console.log(`[LootGenerator] Found ${insideTiles.length} inside tiles and ${outsideTiles.length} outside tiles`);

        // 2. Determine counts
        const countInside = Math.floor(this.spawnCount * this.insideWeight);
        const countOutside = this.spawnCount - countInside;

        // 3. Shuffle and pick locations
        const selectedInside = this.getRandomSubarray(insideTiles, countInside);
        const selectedOutside = this.getRandomSubarray(outsideTiles, countOutside);

        const allSelected = [...selectedInside, ...selectedOutside];
        console.log(`[LootGenerator] Selected ${allSelected.length} spawn points (${selectedInside.length} in, ${selectedOutside.length} out)`);

        this.backpacksSpawned = 0;

        // 4. Spawn items at each location
        allSelected.forEach(pos => {
            const items = this.generateRandomItems();
            if (items.length > 0) {
                gameMap.setItemsOnTile(pos.x, pos.y, items);
            }
        });

        console.log(`[LootGenerator] Finished spawning loot. Backpacks spawned: ${this.backpacksSpawned}`);
    }

    /**
     * Generate 1-3 random item instances with refined rules:
     * - Max 1 backpack per map
     * - Max 1 food item per stack
     * - Max 1 water bottle per stack
     * - Randomized water levels for bottles
     */
    generateRandomItems() {
        const count = 1 + Math.floor(Math.random() * 3);
        const items = [];
        let hasFood = false;
        let hasWater = false;

        for (let i = 0; i < count; i++) {
            // Shuffle keys for each attempt to pick a random item that fits criteria
            const shuffledKeys = [...this.itemKeys].sort(() => Math.random() - 0.5);

            let selectedItem = null;

            for (const randomKey of shuffledKeys) {
                const def = ItemDefs[randomKey];

                // Rule: Only 1 backpack per map
                const isBackpack = def.equippableSlot === 'backpack';
                if (isBackpack && this.backpacksSpawned >= 1) continue;

                // Rule: Only one food item per stack
                const isFoodItem = def.categories && def.categories.includes('food');
                const isWaterBottle = randomKey === 'food.waterbottle';

                if (isFoodItem && !isWaterBottle && hasFood) continue;
                if (isWaterBottle && hasWater) continue;

                // If we passed all checks, create the item
                selectedItem = createItemFromDef(randomKey);
                if (selectedItem) {
                    // Update counters
                    if (isBackpack) this.backpacksSpawned++;
                    if (isFoodItem && !isWaterBottle) hasFood = true;
                    if (isWaterBottle) hasWater = true;

                    // Specific logic for chosen item
                    // If stackable, give it a random count between 1 and stackMax
                    if (selectedItem.traits && selectedItem.traits.includes(ItemTrait.STACKABLE)) {
                        selectedItem.stackCount = 1 + Math.floor(Math.random() * (selectedItem.stackMax || 1));
                    }

                    // If it's a water bottle or similar with ammoCount/capacity
                    if (selectedItem.capacity !== undefined) {
                        // Randomize water level between 0 and capacity
                        selectedItem.ammoCount = Math.floor(Math.random() * (selectedItem.capacity + 1));
                    }

                    items.push(selectedItem);
                    break; // Item found for this slot
                }
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
        if (n > len)
            throw new RangeError("getRandom: more elements taken than available");
        while (n--) {
            const x = Math.floor(Math.random() * len);
            result[n] = arr[x in taken ? taken[x] : x];
            taken[x] = --len in taken ? taken[len] : len;
        }
        return result;
    }
}
