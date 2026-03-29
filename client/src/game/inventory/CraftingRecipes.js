
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
        id: 'crafting.makeshift_hammer',
        name: 'Makeshift Hammer',
        resultItem: 'weapon.makeshift_hammer',
        description: 'A crude but effective pounding tool made from salvaged materials.',
        apCost: 5,
        tab: 'crafting',
        tools: [], // No tools required
        ingredients: [
            { id: 'weapon.stick', count: 1 },
            { id: 'crafting.stone', count: 1 },
            { either: ['crafting.tape', 'crafting.wire'], count: 1, label: 'Tape or Wire' }
        ]
    },
    {
        id: 'crafting.makeshift_knife',
        name: 'Makeshift Knife',
        resultItem: 'weapon.makeshift_knife',
        description: 'A sharp shard of glass secured with a makeshift handle.',
        apCost: 4,
        tab: 'crafting',
        tools: [],
        ingredients: [
            { id: 'crafting.glass_shard', count: 1 },
            { id: 'crafting.rag', count: 1 },
            { either: ['crafting.tape', 'crafting.wire'], count: 1, label: 'Tape or Wire' }
        ]
    },
    {
        id: 'crafting.spear',
        name: 'Spear',
        resultItem: 'weapon.spear',
        description: 'A long-reaching weapon made from a stick and a sharp point.',
        apCost: 6,
        tab: 'crafting',
        tools: [],
        ingredients: [
            { id: 'weapon.stick', count: 1 },
            { either: ['crafting.glass_shard', 'weapon.knife', 'weapon.makeshift_knife'], count: 1, label: 'Glass shard or Knife' },
            { either: ['crafting.tape', 'crafting.wire'], count: 1, label: 'Tape or Wire' }
        ]
    },
    {
        id: 'crafting.rag',
        name: 'Rag',
        resultItem: 'crafting.rag',
        description: 'Tear up old clothing into useful rags.',
        apCost: 2,
        tab: 'crafting',
        tools: [
            { category: ItemCategory.KNIFE, label: 'Any Knife' }
        ],
        ingredients: [
            { category: ItemCategory.CLOTHING, count: 1, label: 'Any Clothing' }
        ],
        resultCount: 1,
    },
    {
        id: 'medical.bandages',
        name: 'Craft Bandages',
        tab: 'crafting',
        description: 'Sterilize rags with antiseptic to create effective bandages.',
        ingredients: [
            { id: 'medical.antiseptic', count: 1 },
            { id: 'crafting.rag', count: 2 }
        ],
        tools: [],
        resultItem: 'medical.bandage',
        resultCount: 2,
        apCost: 2
    },
    {
        id: 'crafting.campfire',
        name: 'Campfire',
        resultItem: 'placeable.campfire',
        description: 'A cozy campfire for cooking and warmth. Lasts longer with better fuel.',
        apCost: 5,
        tab: 'crafting',
        tools: [
            { either: ['tool.lighter', 'tool.matchbook'], count: 1, label: 'Lighter or Matchbook' }
        ],
        ingredients: [
            { either: ['crafting.rag', 'weapon.stick', 'weapon.2x4'], count: 1, label: 'Rag, Stick, or 2x4' }
        ]
    },
    {
        id: 'crafting.makeshift_pack',
        name: 'Makeshift pack',
        resultItem: 'backpack.makeshift',
        description: 'A crude backpack made from rags and tape.',
        apCost: 5,
        tab: 'crafting',
        tools: [],
        ingredients: [
            { id: 'crafting.rag', count: 4 },
            { id: 'crafting.tape', count: 2 }
        ]
    },
    {
        id: 'crafting.torch',
        name: 'Torch',
        resultItem: 'tool.torch',
        description: 'A simple torch for lighting up the night. Requires a lighter or matches to ignite.',
        apCost: 3,
        tab: 'crafting',
        tools: [],
        ingredients: [
            { id: 'weapon.stick', count: 1 },
            { id: 'crafting.rag', count: 1 }
        ]
    },
    {
        id: 'cooking.clean_water',
        name: 'Clean Water',
        resultItem: 'food.waterbottle',
        description: 'Boil dirty water to make it safe to drink.',
        apCost: 5,
        tab: 'cooking',
        requiresCampfire: true,
        tools: [
            { category: ItemCategory.COOKING_POT, label: 'Any Cooking Pot' }
        ],
        ingredients: [
            { id: 'food.waterbottle', count: 1, label: 'Dirty Water Bottle', properties: { waterQuality: 'dirty' } }
        ]
    },
    {
        id: 'cooking.clean_water_jug',
        name: 'Clean Water (Jug)',
        resultItem: 'food.waterjug',
        description: 'Boil a whole jug of dirty water to make it safe to drink.',
        apCost: 10,
        tab: 'cooking',
        requiresCampfire: true,
        tools: [
            { category: ItemCategory.COOKING_POT, label: 'Any Cooking Pot' }
        ],
        ingredients: [
            { id: 'food.waterjug', count: 1, label: 'Dirty Water Jug', properties: { waterQuality: 'dirty' } }
        ]
    },
    {
        id: 'cooking.vegetable_soup',
        name: 'Vegetable Soup',
        resultItem: 'food.vegetablesoup',
        description: 'A hearty and nutritious soup made from fresh vegetables.',
        apCost: 5,
        tab: 'cooking',
        requiresCampfire: true,
        tools: [
            { category: ItemCategory.COOKING_POT, label: 'Any Cooking Pot' }
        ],
        ingredients: [
            { id: 'food.corn', count: 1 },
            { id: 'food.tomato', count: 1 },
            { id: 'food.waterbottle', count: 1, consumeUnits: 5, label: 'Water (5 Units)' }
        ]
    },
    {
        id: 'crafting.sling',
        name: 'Sling',
        resultItem: 'weapon.sling',
        description: 'A simple weapon for throwing stones over long distances.',
        apCost: 10,
        tab: 'crafting',
        tools: [
            { category: ItemCategory.KNIFE, label: 'Any Knife' }
        ],
        ingredients: [
            { id: 'crafting.leather_belt', count: 1 }
        ]
    }
];
