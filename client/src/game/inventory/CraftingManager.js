
import { CraftingRecipes } from './CraftingRecipes.js';
import { Item } from './Item.js';
import { createItemFromDef } from './ItemDefs.js';
import { ItemCategory } from './traits.js';

export class CraftingManager {
    constructor(inventoryManager) {
        this.inv = inventoryManager;
        this.toolContainerId = 'crafting-tools';
        this.ingredientContainerId = 'crafting-ingredients';
    }

    /**
     * Check if a recipe can be crafted with current workspace items
     */
    checkRequirements(recipeId, availableAP = null) {
        const recipe = CraftingRecipes.find(r => r.id === recipeId);
        if (!recipe) return { canCraft: false, missing: [] };

        const toolContainer = this.inv.getContainer(this.toolContainerId);
        const ingredientContainer = this.inv.getContainer(this.ingredientContainerId);

        if (!toolContainer || !ingredientContainer) {
            return { canCraft: false, missing: ['System Error: Containers missing'] };
        }

        const currentTools = toolContainer.getAllItems();
        const currentIngredients = ingredientContainer.getAllItems();

        const missing = [];
        const usedInstances = new Set();

        // 1. Check AP Cost
        if (recipe.apCost && availableAP !== null) {
            if (availableAP < recipe.apCost) {
                missing.push(`${recipe.apCost} AP`);
            }
        }

        // 2. Check Tools (Handling either/or and categories)
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
                missing.push(toolReq.label || toolReq.name || toolReq.id || "Unknown Tool");
            }
        }

        // 2. Check Ingredients (Handling either/or and counts)
        for (const req of recipe.ingredients) {
            let foundCount = 0;
            const candidates = currentIngredients.filter(i => !usedInstances.has(i.instanceId));

            if (req.either) {
                // Handle "Either A or B"
                const matches = candidates.filter(i => req.either.includes(i.defId));
                foundCount = matches.reduce((sum, i) => sum + i.stackCount, 0);
            } else {
                // Handle specific item
                const matches = candidates.filter(i => i.defId === req.id);
                foundCount = matches.reduce((sum, i) => sum + i.stackCount, 0);
            }

            if (foundCount < req.count) {
                missing.push(req.label || req.name || req.id);
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
        const status = this.checkRequirements(recipeId);
        if (!status.canCraft) return { success: false, reason: 'Requirements not met' };

        const recipe = CraftingRecipes.find(r => r.id === recipeId);
        const ingredientContainer = this.inv.getContainer(this.ingredientContainerId);

        // SPECIAL CASE: Determine lifetime for campfire based on fuel used
        let lifetimeTurns = null;
        if (recipeId === 'crafting.campfire') {
            const candidates = ingredientContainer.getAllItems();
            const fuelItem = candidates.find(i => i.hasCategory(ItemCategory.FUEL));
            if (fuelItem) {
                if (fuelItem.defId === 'crafting.rag') lifetimeTurns = 0;
                else if (fuelItem.defId === 'weapon.stick') lifetimeTurns = 1;
                else if (fuelItem.defId === 'weapon.2x4') lifetimeTurns = 2;
                console.log(`[CraftingManager] Campfire fuel identified: ${fuelItem.name}, lifetime: ${lifetimeTurns} turns`);
            }
        }

        // Consume ingredients
        for (const req of recipe.ingredients) {
            let remainingToConsume = req.count;
            const candidates = ingredientContainer.getAllItems();

            const matches = req.either
                ? candidates.filter(i => req.either.includes(i.defId))
                : candidates.filter(i => i.defId === req.id);

            for (const item of matches) {
                if (remainingToConsume <= 0) break;

                const consumeAmount = Math.min(item.stackCount, remainingToConsume);
                item.stackCount -= consumeAmount;
                remainingToConsume -= consumeAmount;

                if (item.stackCount <= 0) {
                    ingredientContainer.removeItem(item.instanceId);
                }
            }
        }

        // Tools: Consume a charge from tools that have charges (e.g. Lighter)
        for (const toolReq of recipe.tools) {
            const toolContainer = this.inv.getContainer(this.toolContainerId);
            const currentTools = toolContainer.getAllItems();

            let found = null;
            if (toolReq.either) {
                found = currentTools.find(t => toolReq.either.includes(t.defId));
            } else {
                found = currentTools.find(t => t.defId === toolReq.id || (toolReq.category && t.categories.includes(toolReq.category)));
            }

            if (found && found.capacity !== null && found.ammoCount > 0) {
                found.ammoCount -= 1;
                console.log(`[CraftingManager] Consumed 1 charge from ${found.name} (${found.instanceId}). Remaining: ${found.ammoCount}`);
            } else if (found) {
                console.warn(`[CraftingManager] Found ${found.name} but cannot consume charge (capacity: ${found.capacity}, ammo: ${found.ammoCount})`);
            }
        }

        // Create result item
        const itemData = createItemFromDef(recipe.resultItem);
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
