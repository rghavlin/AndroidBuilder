
import { CraftingRecipes } from './CraftingRecipes.js';
import { Item } from './Item.js';
import { createItemFromDef, getItemName } from './ItemDefs.js';
import { ItemCategory } from './traits.js';

export class CraftingManager {
    constructor(inventoryManager) {
        this.inv = inventoryManager;
    }

    getNearbyCampfire() {
        if (!this.inv.groundContainer) return null;
        return this.inv.groundContainer.getAllItems().find(item => item.defId === 'placeable.campfire');
    }

    /**
     * Check if a recipe can be crafted with current workspace items
     */
    checkRequirements(recipeId, availableAP = null, craftingLevel = 0) {
        const recipe = CraftingRecipes.find(r => r.id === recipeId);
        if (!recipe) return { canCraft: false, missing: [] };

        const isCooking = recipe.tab === 'cooking';
        const apBonus = isCooking ? 0 : craftingLevel;
        const actualAP = Math.max(1, (recipe.apCost || 0) - apBonus);

        const prefix = recipe.tab === 'cooking' ? 'cooking' : 'crafting';
        const toolContainer = this.inv.getContainer(`${prefix}-tools`);
        const ingredientContainer = this.inv.getContainer(`${prefix}-ingredients`);

        if (!toolContainer || !ingredientContainer) {
            return { canCraft: false, missing: ['System Error: Containers missing'] };
        }

        const currentTools = toolContainer.getAllItems();
        const currentIngredients = ingredientContainer.getAllItems();

        const missing = [];
        const usedInstances = new Set();

        // 1. Check AP Cost
        if (recipe.apCost && availableAP !== null) {
            if (availableAP < actualAP) {
                missing.push(`${actualAP} AP`);
            }
        }

        // 2. Check Campfire requirement
        if (recipe.requiresCampfire) {
            const campfire = this.getNearbyCampfire();
            if (!campfire) {
                missing.push('Campfire');
            }
        }

        // 3. Check Tools (Handling either/or and categories)
        for (const toolReq of recipe.tools) {
            let found = null;
            if (toolReq.either) {
                found = currentTools.find(t =>
                    toolReq.either.includes(t.defId) && !usedInstances.has(t.instanceId)
                );
            } else {
                found = currentTools.find(t =>
                    (t.defId === toolReq.id || (toolReq.category && t.categories.includes(toolReq.category))) &&
                    !usedInstances.has(t.instanceId)
                );
            }

            if (found) {
                // If the tool has a capacity (like a lighter), it must have at least 1 charge
                if (found.capacity !== null && (found.ammoCount === null || found.ammoCount <= 0)) {
                    missing.push(`${found.name} (Empty)`);
                    found = null; // Mark as not found for this requirement
                }
            }

            if (found) {
                usedInstances.add(found.instanceId);
            } else {
                missing.push(toolReq.label || toolReq.name || getItemName(toolReq.id));
            }
        }

        // 4. Check Ingredients (Handling either/or, counts, and properties)
        for (const req of recipe.ingredients) {
            let foundCount = 0;
            const candidates = currentIngredients.filter(i => !usedInstances.has(i.instanceId));

            let matches = [];
            if (req.either) {
                // Handle "Either A or B"
                matches = candidates.filter(i => req.either.includes(i.defId));
            } else if (req.category) {
                // Handle by Category (e.g. "any clothing")
                matches = candidates.filter(i => i.categories && i.categories.includes(req.category));
            } else {
                // Handle specific item
                matches = candidates.filter(i => i.defId === req.id);
            }

            // Property filter
            if (req.properties) {
                matches = matches.filter(item => {
                    return Object.entries(req.properties).every(([prop, val]) => item[prop] === val);
                });
            }

            // Unit requirement check (e.g. 5 units of water)
            if (req.consumeUnits) {
                matches = matches.filter(item => (item.ammoCount || 0) >= req.consumeUnits);
            }

            foundCount = matches.reduce((sum, i) => sum + i.stackCount, 0);

            if (foundCount < req.count) {
                missing.push(req.label || req.name || getItemName(req.id));
            }
        }

        return {
            canCraft: missing.length === 0,
            missing
        };
    }

    /**
     * Perform the craft: consume items and return the new item
     */
    craft(recipeId) {
        const recipe = CraftingRecipes.find(r => r.id === recipeId);
        if (!recipe) return { success: false, reason: 'Recipe not found' };

        const status = this.checkRequirements(recipeId);
        if (!status.canCraft) return { success: false, reason: 'Requirements not met: ' + status.missing.join(', ') };

        const prefix = recipe.tab === 'cooking' ? 'cooking' : 'crafting';
        const toolContainerId = `${prefix}-tools`;
        const ingredientContainerId = `${prefix}-ingredients`;
        const ingredientContainer = this.inv.getContainer(ingredientContainerId);

        // SPECIAL CASE: Determine lifetime for campfire based on fuel used
        let lifetimeTurns = null;
        if (recipeId === 'crafting.campfire') {
            const candidates = ingredientContainer.getAllItems();
            const fuelItem = candidates.find(i => i.hasCategory(ItemCategory.FUEL));
            if (fuelItem) {
                if (fuelItem.defId === 'crafting.rag') lifetimeTurns = 0.5;
                else if (fuelItem.defId === 'weapon.stick') lifetimeTurns = 1.0;
                else if (fuelItem.defId === 'weapon.2x4') lifetimeTurns = 1.0;
                else if (fuelItem.hasCategory(ItemCategory.CLOTHING)) lifetimeTurns = 0.5;
                else if (fuelItem.hasCategory(ItemCategory.FUEL)) lifetimeTurns = 0.5;
                console.log(`[CraftingManager] Campfire fuel identified: ${fuelItem.name}, lifetime: ${lifetimeTurns} turns`);
            }
        }

        // Track properties to preserve (e.g., water level when boiling)
        let preservedProperties = {};

        // SPECIAL CASE: Vegetable Soup dynamic scaling
        if (recipeId === 'cooking.vegetable_soup') {
            const allItems = ingredientContainer.getAllItems();
            
            // 1. Gather vegetables and water
            const vegItems = allItems.filter(i => i.hasCategory(ItemCategory.VEGETABLE));
            const totalVegAvailable = vegItems.reduce((sum, i) => sum + i.stackCount, 0);
            
            const waterContainers = allItems.filter(i => i.isWaterBottle() && (i.ammoCount || 0) > 0);
            const totalWater = waterContainers.reduce((sum, i) => sum + (i.ammoCount || 0), 0);

            // Calculate how many vegetables we can actually cook (max 4, min 1, requires 2 water each)
            const vegCount = Math.min(totalVegAvailable, 4, Math.floor(totalWater / 2));

            if (vegCount === 0) {
                if (totalVegAvailable === 0) return { success: false, reason: 'No vegetables found' };
                return { success: false, reason: 'Insufficient water (Need 2 units per vegetable)' };
            }

            // 2. Gather specific vegetables to consume and calculate stats
            const waterNeeded = vegCount * 2;
            let totalNutrition = 0;
            const consumedInstances = new Map(); // Track how many to take from each stack

            let remainingVegToAssign = vegCount;
            for (const item of vegItems) {
                if (remainingVegToAssign <= 0) break;
                
                const take = Math.min(item.stackCount, remainingVegToAssign);
                const baseNutr = item.consumptionEffects?.nutrition || 5;
                
                totalNutrition += (baseNutr + 2) * take;
                consumedInstances.set(item.instanceId, take);
                remainingVegToAssign -= take;
            }

            // 3. Consume vegetables
            for (const [id, count] of consumedInstances.entries()) {
                const item = ingredientContainer.items.get(id);
                if (item) {
                    item.stackCount -= count;
                    if (item.stackCount <= 0) ingredientContainer.removeItem(id);
                }
            }

            // 4. Consume water
            let waterToConsume = waterNeeded;
            for (const container of waterContainers) {
                if (waterToConsume <= 0) break;
                const consume = Math.min(container.ammoCount, waterToConsume);
                container.ammoCount -= consume;
                waterToConsume -= consume;
            }

            // 5. Create final item
            const soupData = createItemFromDef(recipe.resultItem, {
                consumptionEffects: {
                    nutrition: totalNutrition,
                    hydration: vegCount * 2
                },
                description: `A hearty soup made with ${vegCount} vegetables. Nutrition: ${totalNutrition}, Hydration: ${vegCount * 2}`
            });
            const soupItem = new Item(soupData);

            return { success: true, item: soupItem };
        }

        if (recipeId === 'cooking.clean_water' || recipeId === 'cooking.clean_water_jug') {
            const candidates = ingredientContainer.getAllItems();
            const sourceBottle = candidates.find(i =>
                (i.defId === 'food.waterbottle' || i.defId === 'food.waterjug') && i.waterQuality === 'dirty'
            );
            if (sourceBottle) {
                preservedProperties.ammoCount = sourceBottle.ammoCount;
                preservedProperties.waterQuality = 'clean';
                console.log(`[CraftingManager] Preserving water level for purification: ${sourceBottle.ammoCount}`);
            }
        }

        // Consume ingredients
        for (const req of recipe.ingredients) {
            let remainingToConsume = req.count;
            const candidates = ingredientContainer.getAllItems();

            let matches = req.either
                ? candidates.filter(i => req.either.includes(i.defId))
                : req.category
                    ? candidates.filter(i => i.categories && i.categories.includes(req.category))
                    : candidates.filter(i => i.defId === req.id);

            // Property filter for consumption matches
            if (req.properties) {
                matches = matches.filter(item => {
                    return Object.entries(req.properties).every(([prop, val]) => item[prop] === val);
                });
            }

            for (const item of matches) {
                if (remainingToConsume <= 0) break;

                if (req.consumeUnits) {
                    // PARTIAL UNIT CONSUMPTION
                    // Handle stacking: if it's a stack, we must split 1 item off to modify its units
                    let targetItem = item;
                    if (item.stackCount > 1) {
                        // Create a new instance with 1 count
                        targetItem = item.splitStack(1);

                        // CRITICAL: Reduce units BEFORE adding back to container
                        // This ensures it doesn't immediately merge back into the original stack
                        // (since bottles with different fill levels don't stack)
                        targetItem.ammoCount = Math.max(0, (targetItem.ammoCount || 0) - req.consumeUnits);

                        // Place the new single item back into the workspace so it remains visible
                        ingredientContainer.addItem(targetItem);
                    } else {
                        // Single item, just reduce units
                        targetItem.ammoCount = Math.max(0, (targetItem.ammoCount || 0) - req.consumeUnits);
                    }

                    console.log(`[CraftingManager] Consumed ${req.consumeUnits} units from ${targetItem.name}. Remaining: ${targetItem.ammoCount}`);
                    remainingToConsume -= 1;
                } else {
                    // FULL ITEM CONSUMPTION
                    const consumeAmount = Math.min(item.stackCount, remainingToConsume);
                    item.stackCount -= consumeAmount;
                    remainingToConsume -= consumeAmount;

                    if (item.stackCount <= 0) {
                        ingredientContainer.removeItem(item.instanceId);
                    }
                }
            }
        }

        // Tools: Consume a charge from tools that have charges (e.g. Lighter)
        for (const toolReq of recipe.tools) {
            const toolContainer = this.inv.getContainer(toolContainerId);
            const currentTools = toolContainer.getAllItems();

            let found = null;
            if (toolReq.either) {
                found = currentTools.find(t => toolReq.either.includes(t.defId));
            } else {
                found = currentTools.find(t => t.defId === toolReq.id || (toolReq.category && t.categories.includes(toolReq.category)));
            }

            if (found && found.capacity !== null && (found.ammoCount !== null && found.ammoCount > 0)) {
                found.ammoCount -= 1;
                console.log(`[CraftingManager] Consumed 1 charge from ${found.name} (${found.instanceId}). Remaining: ${found.ammoCount}`);
            } else if (found) {
                console.warn(`[CraftingManager] Found ${found.name} but cannot consume charge (capacity: ${found.capacity}, ammo: ${found.ammoCount})`);
            }
        }

        // Create result item
        const itemData = createItemFromDef(recipe.resultItem, preservedProperties);
        if (lifetimeTurns !== null) itemData.lifetimeTurns = lifetimeTurns;
        const newItem = new Item(itemData);

        // Handle GROUND_ONLY placement (e.g. Campfire)
        if (newItem.isGroundOnly && newItem.isGroundOnly()) {
            const ground = this.inv.groundContainer;
            console.log(`[CraftingManager] Placing ground-only item ${newItem.name} at (0,0)`);

            // 1. Clear 4x4 area at (0,0) and get displaced items
            const displacedItems = this.inv.clearSpaceInContainer(ground, 0, 0, newItem.width, newItem.height);
            console.log(`[CraftingManager] Displaced ${displacedItems.length} items for ${newItem.name}`);

            // 2. Place the new item
            if (ground.placeItemAt(newItem, 0, 0)) {
                // 3. Re-add displaced items to any available spot, preferably below the campfire
                displacedItems.forEach(item => {
                    // Try to place at row 5 (index 4) or below to avoid the 4x4 campfire area
                    const result = this.inv.addItem(item, 'ground', 0, 4);
                });
                return { success: true, item: newItem, placedInGround: true };
            } else {
                console.error('[CraftingManager] Failed to place ground-only item even after clearing!');
                // Try to restore displaced items if placement fails
                displacedItems.forEach(item => this.inv.addItem(item));
                return { success: false, reason: 'Ground is blocked (Internal Error)' };
            }
        }

        return {
            success: true,
            item: newItem
        };
    }
}
