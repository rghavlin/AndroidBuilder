
import { CraftingRecipes } from './CraftingRecipes.js';
import { Item } from './Item.js';
import { ItemDefs, createItemFromDef, getItemName } from './ItemDefs.js';
import { ItemCategory, ItemTrait, getFuelValue } from './traits.js';

export class CraftingManager {
    constructor(inventoryManager) {
        this.inv = inventoryManager;
    }

    /**
     * Internal helper to atomically split 1 unit from a stack for partial consumption/modification
     * Handles the "split-but-don't-decrement" bug in Item.splitStack contract.
     */
    _consumeFromStack(item, container) {
        if (!item) return null;

        // If it's already a single item, no split needed
        if (item.stackCount <= 1) {
            return item;
        }

        // 1. Split 1 item from the stack
        const singleItem = item.splitStack(1);
        if (!singleItem) return null;

        // 2. Reduce source stack count
        // We do this BEFORE adding to ensure the grid footprint is accurate during compacting
        item.stackCount -= 1;

        // 3. Attempt to add the single item to the container
        // FIX: Must set allowStacking=false so it doesn't immediately merge back!
        // We pass the item's current position as a hint to keep it nearby.
        let addResult = container.addItem(singleItem, item.x, item.y, false);
        
        if (!addResult) {
            // FALLBACK 1: Try adding without a preferred position (full grid scan)
            // This handles cases where the radius search around the original item was too small.
            addResult = container.addItem(singleItem, null, null, false);
        }

        if (!addResult) {
            // FALLBACK 2: If placement still failed, the grid might be fragmented. Try compacting.
            console.log(`[CraftingManager] Workspace ${container.id} fragmented. Compacting to fit ${singleItem.name}...`);
            container.compact();
            addResult = container.addItem(singleItem, null, null, false);
        }

        if (!addResult) {
            // FAILURE: Workspace is truly full. Must revert the stack decrement!
            item.stackCount += 1;
            console.error(`[CraftingManager] STACK SPLIT FAILED: Workspace ${container.id} is full for item ${singleItem.name} (${singleItem.width}x${singleItem.height}).`);
            return null;
        }

        return singleItem;
    }

    getNearbyCampfire() {
        if (!this.inv.groundContainer) return null;
        return this.inv.groundContainer.getAllItems().find(item => 
            item.defId === 'placeable.campfire' || 
            (item.defId === 'tool.battery_powered_hotplate' && item.isOn)
        );
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

        if (recipe.requiredBook) {
            const stats = globalThis.gameEngine?.bookStats?.[recipe.requiredBook];
            if (!stats || stats.pagesLeft > 0) {
                return { canCraft: false, missing: ['Recipe Locked'] };
            }
        }

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
                // 1. If the tool has a capacity (like a lighter), it must have at least 1 charge
                if (found.capacity !== null && (found.ammoCount === null || found.ammoCount <= 0)) {
                    missing.push(`${found.name} (Empty)`);
                    found = null; // Mark as not found for this requirement
                } 
                // 2. If the tool is degradable (like a hammer), it must have at least 1 condition
                else if (found.isDegradable() && (found.condition === null || found.condition <= 0)) {
                    missing.push(`${found.name} (Broken)`);
                    found = null;
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
        try {
            const recipe = CraftingRecipes.find(r => r.id === recipeId);
            if (!recipe) return { success: false, reason: 'Recipe not found' };

            if (recipe.requiredBook) {
                const stats = globalThis.gameEngine?.bookStats?.[recipe.requiredBook];
                if (!stats || stats.pagesLeft > 0) {
                    return { success: false, reason: 'Recipe locked' };
                }
            }

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
                lifetimeTurns = getFuelValue(fuelItem);
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
            
            const waterContainers = allItems.filter(i => i.hasTrait(ItemTrait.WATER_CONTAINER) && (i.ammoCount || 0) > 0);
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
                    if (!targetItem) return { success: false, reason: 'No space in workspace to split stack' };
                    
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
                }
            });
            const stewItem = new Item(stewData);

            return { success: true, item: stewItem, apCost: actualAP };
        }
        // SPECIAL CASE: Cooked Vegetables dynamic scaling
        if (recipeId === 'cooking.cooked_vegetables') {
            const allItems = ingredientContainer.getAllItems();
            const vegItems = allItems.filter(i => i.hasCategory(ItemCategory.VEGETABLE));

            if (vegItems.length === 0) return { success: false, reason: 'No vegetables found' };

            // Max 4 units
            let unitsUsed = 0;
            let totalNutrition = 0;
            const consumedInstances = new Map();

            for (const item of vegItems) {
                if (unitsUsed >= 4) break;
                const take = Math.min(item.stackCount, 4 - unitsUsed);
                const baseNutr = item.consumptionEffects?.nutrition || 5;
                consumedInstances.set(item.instanceId, take);
                totalNutrition += (baseNutr + 1) * take;
                unitsUsed += take;
            }

            // Perform consumption
            for (const [id, count] of consumedInstances.entries()) {
                const item = ingredientContainer.items.get(id);
                if (item) {
                    item.stackCount -= count;
                    if (item.stackCount <= 0) ingredientContainer.removeItem(id);
                }
            }

            // Create final item
            const vegData = createItemFromDef(recipe.resultItem, {
                consumptionEffects: {
                    nutrition: totalNutrition
                },
                description: `A warm bowl of cooked vegetables. Nutrition: ${totalNutrition}`
            });
            const vegItem = new Item(vegData);

            return { success: true, item: vegItem, apCost: actualAP };
        }

        if (recipeId === 'cooking.clean_water' || recipeId === 'cooking.clean_water_jug') {
            const candidates = ingredientContainer.getAllItems();
            
            // Look for the specific dirty container that triggered the craft
            // We search for a water container with some dirty water in it
            const sourceBottle = candidates.find(i =>
                i.hasTrait(ItemTrait.WATER_CONTAINER) && (i.waterQuality === 'dirty' || !i.waterQuality) && (i.ammoCount || 0) > 0
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
        const returnedItems = [];

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
                    if (!targetItem) return { success: false, reason: 'No space in workspace to split stack' };

                    targetItem.ammoCount = Math.max(0, (targetItem.ammoCount || 0) - req.consumeUnits);

                    console.log(`[CraftingManager] Consumed ${req.consumeUnits} units from ${targetItem.name}. Remaining: ${targetItem.ammoCount}`);
                    remainingToConsume -= 1;
                } else {
                    // FULL ITEM CONSUMPTION
                    const consumeAmount = Math.min(item.stackCount, remainingToConsume);

                    // Check if the consumed item is a container with contents
                    if (item.isContainer?.()) {
                        const grid = item.getContainerGrid?.();
                        if (grid) {
                            const nested = grid.getAllItems();
                            if (nested.length > 0) {
                                console.log(`[CraftingManager] Ingredient ${item.name} is a container. Returning ${nested.length} nested items.`);
                                returnedItems.push(...nested);
                                grid.clear();
                            }
                        }
                    }
                    if (typeof item.getPocketContainers === 'function') {
                        const pockets = item.getPocketContainers();
                        pockets.forEach(pocket => {
                            const nested = pocket.getAllItems();
                            if (nested.length > 0) {
                                console.log(`[CraftingManager] Ingredient ${item.name} has pockets. Returning ${nested.length} pocket items.`);
                                returnedItems.push(...nested);
                                pocket.clear();
                            }
                        });
                    }

                    item.stackCount -= consumeAmount;
                    remainingToConsume -= consumeAmount;

                    if (item.stackCount <= 0) {
                        ingredientContainer.removeItem(item.instanceId);
                    }
                }
            }
        }

        // Tools: Consume a charge or degrade condition
        for (const toolReq of recipe.tools) {
            const toolContainer = this.inv.getContainer(toolContainerId);
            const currentTools = toolContainer.getAllItems();

            let found = null;
            if (toolReq.either) {
                found = currentTools.find(t => toolReq.either.includes(t.defId));
            } else {
                found = currentTools.find(t => t.defId === toolReq.id || (toolReq.category && t.categories.includes(toolReq.category)));
            }

            if (found) {
                // Use the helper for tool consumption from stack (e.g. for matches)
                const singleTool = this._consumeFromStack(found, toolContainer);
                if (!singleTool) return { success: false, reason: 'No space in workspace to use tool' };

                if (singleTool.capacity !== null && (singleTool.ammoCount !== null && singleTool.ammoCount > 0)) {
                    // Charge-based consumption (Lighter, Matches)
                    singleTool.ammoCount -= 1;
                    console.log(`[CraftingManager] Consumed 1 charge from tool: ${singleTool.name}. Remaining: ${singleTool.ammoCount}`);
                } else if (singleTool.isDegradable()) {
                    // Condition-based degradation (Hammer, Knife)
                    // Uses default fragility (2) or def-specified fragility, same as combat.
                    if (singleTool.hasCategory(ItemCategory.COOKING_POT)) {
                        singleTool.degrade(1);
                    } else {
                        singleTool.degrade();
                    }
                    console.log(`[CraftingManager] Degraded tool: ${singleTool.name}. Remaining: ${singleTool.condition}`);
                }
            }
        }

        // Create result item
        const itemData = createItemFromDef(recipe.resultItem, preservedProperties);
        if (lifetimeTurns !== null) itemData.lifetimeTurns = Math.ceil(lifetimeTurns);
        const newItem = new Item(itemData);

        // Handle result count (for stackable items)
        if (recipe.resultCount && recipe.resultCount > 1) {
            newItem.stackCount = recipe.resultCount;
            console.log(`[CraftingManager] Applied resultCount ${recipe.resultCount} to ${newItem.name}`);
        }

        // Handle GROUND_ONLY/Furniture placement (e.g. Campfire, Sled, Bed)
        if (newItem.hasTrait(ItemTrait.FURNITURE) || newItem.hasTrait(ItemTrait.GROUND_ONLY)) {
            const ground = this.inv.groundContainer;
            console.log(`[CraftingManager] Placing furniture/ground item ${newItem.name} on infinite ground...`);

            // 1. Attempt to add the item to the ground container. 
            // Since it's auto-expanding and the ground is "infinite", this should always succeed.
            // We pass (0,0) as preferred coordinates to keep it near the player's logical center.
            if (ground.addItem(newItem, 0, 0, false)) {
                return { success: true, item: newItem, placedInGround: true, apCost: actualAP, returnedItems };
            } else {
                // FALLBACK: If for some reason addItem fails (should be impossible on auto-expand ground),
                // we try to force place it by clearing space at (0,0).
                console.warn('[CraftingManager] addItem failed on ground, attempting force placement at (0,0)');
                const displacedItems = this.inv.clearSpaceInContainer(ground, 0, 0, newItem.width, newItem.height);
                
                if (ground.placeItemAt(newItem, 0, 0)) {
                    // Re-add displaced items to any available spot
                    displacedItems.forEach(item => this.inv.addItem(item, 'ground', null, null, true));
                    return { success: true, item: newItem, placedInGround: true, apCost: actualAP, returnedItems };
                } else {
                    console.error('[CraftingManager] CRITICAL: Failed to place ground-only item even after clearing!');
                    // Restore displaced items
                    displacedItems.forEach(item => this.inv.addItem(item, 'ground', null, null, true));
                    
                    // Final safety: Just return the item even if placement failed (it might stay in workspace)
                    return { success: true, item: newItem, placedInGround: false, apCost: actualAP, returnedItems };
                }
            }
        }

        return {
            success: true,
            item: newItem,
            apCost: actualAP,
            returnedItems
        };
    } catch (error) {
        console.error('[CraftingManager] Unexpected error during craft:', error);
        return { success: false, reason: 'Internal error: ' + error.message };
    }
    }

    /**
     * Autoload tools and ingredients for a recipe
     */
    autoload(recipeId) {
        const recipe = CraftingRecipes.find(r => r.id === recipeId);
        if (!recipe) return { success: false, reason: 'Recipe not found' };

        // 1. Unload existing crafting items first
        this.unload();

        // Dynamically resolve workspace containers based on recipe tab
        const prefix = recipe.tab === 'cooking' ? 'cooking' : 'crafting';
        const toolContainerId = `${prefix}-tools`;
        const ingredientContainerId = `${prefix}-ingredients`;
        const ingredientContainer = this.inv.getContainer(ingredientContainerId);

        // 2. Find and move tools
        for (const toolReq of recipe.tools) {
            const found = this.inv.findMatchingItems(toolReq)[0];
            if (found) {
                const { item, container, equipment } = found;
                const sourceId = container ? container.id : `equipment-${equipment}`;
                this.inv.moveItem(item.instanceId, sourceId, toolContainerId);
            }
        }

        // 3. Find and move ingredients
        for (const ingReq of recipe.ingredients) {
            let needed = ingReq.count;
            const candidates = this.inv.findMatchingItems(ingReq).filter(c => !c.equipment);
            
            for (const { item, container, equipment } of candidates) {
                if (needed <= 0) break;
                
                const sourceId = container ? container.id : `equipment-${equipment}`;
                
                if (item.stackCount <= needed) {
                    const count = item.stackCount;
                    this.inv.moveItem(item.instanceId, sourceId, ingredientContainerId);
                    needed -= count;
                } else {
                    const split = item.splitStack(needed);
                    if (split) {
                        item.stackCount -= needed;
                        ingredientContainer.addItem(split);
                        needed = 0;
                    }
                }
            }
        }
        
        this.inv.emit('inventoryChanged');
        return { success: true };
    }

    /**
     * Unload crafting workspace
     */
    unload() {
        // Clear all workspace containers (both crafting and cooking)
        const containerIds = [
            'crafting-tools', 'crafting-ingredients',
            'cooking-tools', 'cooking-ingredients'
        ];

        const items = [];
        for (const id of containerIds) {
            const container = this.inv.getContainer(id);
            if (container) {
                items.push(...container.getAllItems());
            }
        }

        if (items.length === 0) return;
        
        items.forEach(item => {
            if (item._container) {
                item._container.removeItem(item.instanceId);
            }
            this.inv.addItem(item, null, null, null, true);
        });
        
        this.inv.emit('inventoryChanged');
    }
}
