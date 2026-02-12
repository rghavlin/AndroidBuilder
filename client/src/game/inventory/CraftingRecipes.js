
import { ItemCategory } from './traits.js';

/**
 * Crafting Recipes Definition
 * 
 * ingredients: array of requirements
 *   - id: specific item defId
 *   - either: array of defIds (any one satisfies)
 *   - count: required quantity
 */
export const CraftingRecipes = [
    {
        id: 'crafting.makeshift_hatchet',
        name: 'Makeshift Hatchet',
        resultItem: 'weapon.makeshift_hatchet',
        description: 'A crude but effective chopping tool made from salvaged materials.',
        apCost: 5,
        tools: [], // No tools required
        ingredients: [
            { id: 'weapon.stick', count: 1 },
            { id: 'crafting.stone', count: 1 },
            { either: ['crafting.tape', 'crafting.wire'], count: 1, label: 'Tape or Wire' }
        ]
    }
];
