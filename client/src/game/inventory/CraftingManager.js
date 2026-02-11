
import { CraftingRecipes } from './CraftingRecipes.js';
import { Item } from './Item.js';
import { createItemFromDef } from './ItemDefs.js';

export class CraftingManager {
    constructor(inventoryManager) {
        this.inv = inventoryManager;
        this.toolContainerId = 'crafting-tools';
        this.ingredientContainerId = 'crafting-ingredients';
    }

    /**
     * Check if a recipe can be crafted with current workspace items
     */
    checkRequirements(recipeId) {
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

        // 1. Check Tools (Exact match or category match if needed in future)
        for (const toolReq of recipe.tools) {
            const found = currentTools.find(t =>
                (t.defId === toolReq.id || t.categories.includes(toolReq.category)) &&
                !usedInstances.has(t.instanceId)
            );
            if (found) {
                usedInstances.add(found.instanceId);
            } else {
                missing.push(toolReq.name || toolReq.id);
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

        // Tools are NOT consumed

        // Create result item
        const itemData = createItemFromDef(recipe.resultItem);
        const newItem = new Item(itemData);

        return {
            success: true,
            item: newItem
        };
    }
}
