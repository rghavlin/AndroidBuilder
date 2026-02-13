
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
    },
    {
        id: 'crafting.campfire',
        name: 'Campfire',
        resultItem: 'placeable.campfire',
        description: 'A cozy campfire for cooking and warmth. Lasts longer with better fuel.',
        apCost: 5,
        tools: [
            { either: ['tool.lighter', 'tool.matchbook'], count: 1, label: 'Lighter or Matchbook' }
        ],
        ingredients: [
            { either: ['crafting.rag', 'weapon.stick', 'weapon.2x4'], count: 1, label: 'Rag, Stick, or 2x4' }
        ]
    }
];
