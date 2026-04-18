
import { CraftingRecipes } from './CraftingRecipes.js';
import { Item } from './Item.js';
import { ItemDefs, createItemFromDef, getItemName } from './ItemDefs.js';
import { ItemCategory } from './traits.js';

export class CraftingManager {
    constructor(inventoryManager) {
        this.inv = inventoryManager;
    }

    /**
     * Internal helper to atomically split 1 unit from a stack for partial consumption/modification
     * Handles the "split-but-don't-decrement" bug in Item.splitStack contract.
     */
    _consumeFromStack(item, container) {
        if (!item || !container) return item;
        
        if (item.stackCount > 1) {
            const singleItem = item.splitStack(1);
            // CRITICAL: Must reduce source since splitStack is non-mutating
            item.stackCount -= 1;
            
            // Add back to workspace so it's tracked as a separate instance
            // FIX: Must set allowStacking=false so it doesn't immediately merge back!
            // We also pass the item's current position as a hint to keep it nearby.
            container.addItem(singleItem, item.x, item.y, false);
            
            return singleItem;
        }
        return item;
    }

    getNearbyCampfire() {
        if (!this.inv.groundContainer) return null;
        return this.inv.groundContainer.getAllItems().find(item => item.defId === 'placeable.campfire');
    }

    /**
     * Centralized AP cost calculation
     */
    static calculateAPCost(recipe, craftingLevel = 0) {
        if (!recipe.apCost) return 0;
        const isCooking = recipe.tab === 'cooking';
        // Cooking does not currently benefit from crafting skill level discounts
        const apBonus = isCooking ? 0 : (craftingLevel || 0);
        return Math.max(1, recipe.apCost - apBonus);
    }

    /**
     * Check if a recipe can be crafted with current workspace items
     */
    checkRequirements(recipeId, availableAP = null, craftingLevel = 0) {
        const recipe = CraftingRecipes.find(r => r.id === recipeId);
        if (!recipe) return { canCraft: false, missing: [] };

        const actualAP = CraftingManager.calculateAPCost(recipe, craftingLevel);

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
                // Handle "Either A or B" (supports both defId and category)
                matches = candidates.filter(i => 
                    req.either.includes(i.defId) || 
                    (i.categories && i.categories.some(cat => req.either.includes(cat)))
                );
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
    craft(recipeId, craftingLevel = 0, availableAP = null) {
        const recipe = CraftingRecipes.find(r => r.id === recipeId);
        if (!recipe) return { success: false, reason: 'Recipe not found' };

        const actualAP = CraftingManager.calculateAPCost(recipe, craftingLevel);

        const status = this.checkRequirements(recipeId, availableAP, craftingLevel);
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

        // SPECIAL CASE: Stew dynamic scaling
        if (recipeId === 'cooking.stew') {
            const allItems = ingredientContainer.getAllItems();
            
            // 1. Gather possible ingredients and water
            const vegItems = allItems.filter(i => i.hasCategory(ItemCategory.VEGETABLE));
            const meatItems = allItems.filter(i => i.defId === 'food.raw_meat');
            
            const waterContainers = allItems.filter(i => i.isWaterBottle() && (i.ammoCount || 0) > 0);
            const totalWaterAvailable = waterContainers.reduce((sum, i) => sum + ((i.ammoCount || 0) * i.stackCount), 0);

            // 2. Greedily determine what to cook (Max 4 units: Meat = 2, Veg = 1)
            let unitsUsed = 0;
            let meatToCook = 0;
            let vegToCook = 0;
            
            // Priority: Meat (2 units each)
            let availableMeat = meatItems.reduce((sum, i) => sum + i.stackCount, 0);
            while (availableMeat > 0 && unitsUsed + 2 <= 4) {
                if (totalWaterAvailable < (unitsUsed + 2) * 2) break; // Water check
                meatToCook++;
                unitsUsed += 2;
                availableMeat--;
            }

            // Fill remainder: Veggies (1 unit each)
            let availableVeg = vegItems.reduce((sum, i) => sum + i.stackCount, 0);
            while (availableVeg > 0 && unitsUsed + 1 <= 4) {
                if (totalWaterAvailable < (unitsUsed + 1) * 2) break; // Water check
                vegToCook++;
                unitsUsed += 1;
                availableVeg--;
            }

            if (unitsUsed === 0) {
                if (meatItems.length === 0 && vegItems.length === 0) return { success: false, reason: 'No meat or vegetables found' };
                return { success: false, reason: 'Insufficient water (Need 2 units per ingredient unit)' };
            }

            // 3. Assign specific instances and calculate nutrition
            let totalNutrition = 0;
            const consumedInstances = new Map();

            let meatRemaining = meatToCook;
            for (const item of meatItems) {
                if (meatRemaining <= 0) break;
                const take = Math.min(item.stackCount, meatRemaining);
                consumedInstances.set(item.instanceId, take);
                totalNutrition += 12 * take;
                meatRemaining -= take;
            }

            let vegRemaining = vegToCook;
            for (const item of vegItems) {
                if (vegRemaining <= 0) break;
                const take = Math.min(item.stackCount, vegRemaining);
                const baseNutr = item.consumptionEffects?.nutrition || 5;
                consumedInstances.set(item.instanceId, take);
                totalNutrition += (baseNutr + 2) * take;
                vegRemaining -= take;
            }

            // 4. Perform consumption
            for (const [id, count] of consumedInstances.entries()) {
                const item = ingredientContainer.items.get(id);
                if (item) {
                    item.stackCount -= count;
                    if (item.stackCount <= 0) ingredientContainer.removeItem(id);
                }
            }

            let waterToConsume = unitsUsed * 2;
            for (const item of waterContainers) {
                if (waterToConsume <= 0) break;
                
                // If it's a stack, we might need to take from multiple bottles in it
                while (waterToConsume > 0 && (item.ammoCount || 0) > 0) {
                    const consume = Math.min(item.ammoCount, waterToConsume);
                    
                    // Use the new helper for robust stacking support
                    const targetItem = this._consumeFromStack(item, ingredientContainer);
                    targetItem.ammoCount -= consume;
                    console.log(`[CraftingManager] Consumed ${consume} units for stew. Remaining in bottle: ${targetItem.ammoCount}`);

                    waterToConsume -= consume;
                    
                    // If targetItem is NOT the stack itself (i.e. it was split), 
                    // then targetItem now represents a single modified bottle.
                    // The 'item' variable still points to the (now smaller) stack.
                    // If it was NOT a stack, item === targetItem and we loop again if needed.
                    if (item !== targetItem && item.stackCount <= 0) break;
                    if (item === targetItem) break; // Standalone bottle fully used or remaining units handled by loop
                }
            }

            // 5. Create final item
            const stewData = createItemFromDef(recipe.resultItem, {
                consumptionEffects: {
                    nutrition: totalNutrition,
                    hydration: unitsUsed * 2
                },
                description: `A rich, hot stew containing ${meatToCook > 0 ? `${meatToCook} meat` : ''}${meatToCook > 0 && vegToCook > 0 ? ' and ' : ''}${vegToCook > 0 ? `${vegToCook} vegetables` : ''}. Nutrition: ${totalNutrition}, Hydration: ${unitsUsed * 2}`
            });
            const stewItem = new Item(stewData);

            return { success: true, item: stewItem, apCost: actualAP };
        }

        if (recipeId === 'cooking.clean_water' || recipeId === 'cooking.clean_water_jug') {
            const candidates = ingredientContainer.getAllItems();
            
            // Look for the specific dirty container that triggered the craft
            // We search for a water container with some dirty water in it
            const sourceBottle = candidates.find(i =>
                i.isWaterBottle() && (i.waterQuality === 'dirty' || !i.waterQuality) && (i.ammoCount || 0) > 0
            );

            if (sourceBottle) {
                // Determine ammo count (fill level) - default to 20 if instance property is somehow missing
                const level = sourceBottle.ammoCount !== undefined ? sourceBottle.ammoCount : (ItemDefs[sourceBottle.defId]?.ammoCount || 20);
                preservedProperties.ammoCount = level;
                preservedProperties.waterQuality = 'clean';
                console.log(`[CraftingManager] Purifying ${sourceBottle.name}: ${level} units. Setting result to CLEAN.`);
            } else {
                // FALLBACK: Use definition capacity for the result item
                const resultDef = ItemDefs[recipe.resultItem];
                const capacity = resultDef?.capacity || (recipeId === 'cooking.clean_water_jug' ? 50 : 20);
                preservedProperties.ammoCount = capacity;
                preservedProperties.waterQuality = 'clean';
                console.warn(`[CraftingManager] No dirty source found in workspace! Defaulting result ${recipe.resultItem} to FULL (${capacity} units).`);
            }
        }

        // Consume ingredients
        for (const req of recipe.ingredients) {
            let remainingToConsume = req.count;
            const candidates = ingredientContainer.getAllItems();

            let matches = req.either
                ? candidates.filter(i => 
                    req.either.includes(i.defId) || 
                    (i.categories && i.categories.some(cat => req.either.includes(cat)))
                )
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
                    // PARTIAL UNIT CONSUMPTION using the helper
                    const targetItem = this._consumeFromStack(item, ingredientContainer);
                    targetItem.ammoCount = Math.max(0, (targetItem.ammoCount || 0) - req.consumeUnits);

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
                // Use the helper for tool consumption from stack
                const singleTool = this._consumeFromStack(found, toolContainer);
                singleTool.ammoCount -= 1;
                console.log(`[CraftingManager] Consumed 1 charge from tool: ${singleTool.name}. Remaining: ${singleTool.ammoCount}`);
            } else if (found) {
                console.warn(`[CraftingManager] Found ${found.name} but cannot consume charge (capacity: ${found.capacity}, ammo: ${found.ammoCount})`);
            }
        }

        // Create result item
        const itemData = createItemFromDef(recipe.resultItem, preservedProperties);
        if (lifetimeTurns !== null) itemData.lifetimeTurns = lifetimeTurns;
        const newItem = new Item(itemData);

        // Handle result count (for stackable items)
        if (recipe.resultCount && recipe.resultCount > 1) {
            newItem.stackCount = recipe.resultCount;
            console.log(`[CraftingManager] Applied resultCount ${recipe.resultCount} to ${newItem.name}`);
        }

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
                    const result = this.inv.addItem(item, 'ground', 0, 4, true);
                });
                return { success: true, item: newItem, placedInGround: true };
            } else {
                console.error('[CraftingManager] Failed to place ground-only item even after clearing!');
                // Try to restore displaced items if placement fails
                displacedItems.forEach(item => this.inv.addItem(item, null, null, null, true));
                return { success: false, reason: 'Ground is blocked (Internal Error)' };
            }
        }

        return {
            success: true,
            item: newItem,
            apCost: actualAP
        };
    }
}
