
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
        id: 'crafting.makeshift_machete',
        name: 'Makeshift Machete',
        resultItem: 'weapon.makeshift_machete',
        description: 'A sharp mower blade bound with rags to create a devastating makeshift weapon.',
        apCost: 6,
        tab: 'crafting',
        tools: [],
        ingredients: [
            { id: 'crafting.mower_blade', count: 1 },
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
        name: 'Bandage',
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
            { either: ['tool.lighter', 'tool.matchbook', 'tool.bowdrill'], count: 1, label: 'Lighter, Matchbook or Bow drill' }
        ],
        ingredients: [
            { category: ItemCategory.FUEL, count: 1, label: 'Fuel (Rag, Stick, Plank, or Clothing)' }
        ]
    },
    {
        id: 'crafting.bowdrill',
        name: 'Bow drill',
        resultItem: 'tool.bowdrill',
        description: 'A primitive survival tool for starting fires. Requires manual effort to generate heat.',
        apCost: 5,
        tab: 'crafting',
        tools: [],
        ingredients: [
            { id: 'weapon.stick', count: 1 },
            { id: 'crafting.rope', count: 1 },
            { id: 'weapon.plank', count: 1 }
        ]
    },
    {
        id: 'crafting.spikedbat',
        name: 'Spiked Bat',
        resultItem: 'weapon.spikedbat',
        description: 'A wooden bat reinforced with nasty, protruding nails.',
        apCost: 6,
        tab: 'crafting',
        tools: [
            { either: ['weapon.hammer', 'weapon.makeshift_hammer'], label: 'Any Hammer' }
        ],
        ingredients: [
            { id: 'weapon.woodenbat', count: 1 },
            { id: 'crafting.nail', count: 4 }
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
        id: 'cooking.stew',
        name: 'Stew',
        resultItem: 'food.stew',
        description: 'A rich, hearty stew made from a mix of fresh vegetables and raw meat.',
        apCost: 5,
        tab: 'cooking',
        requiresCampfire: true,
        tools: [
            { category: ItemCategory.COOKING_POT, label: 'Any Cooking Pot' }
        ],
        ingredients: [
            { either: [ItemCategory.VEGETABLE, 'food.raw_meat'], count: 1, label: 'Meat (2 units) or Veggies (1 unit) - Max 4 units' },
            { either: ['food.waterbottle', 'food.waterjug'], count: 1, consumeUnits: 2, label: '2 water per unit' }
        ]
    },
    {
        id: 'cooking.cooked_meat',
        name: 'Cooked meat',
        resultItem: 'food.cooked_meat',
        description: 'Cook raw meat over a fire to make it tasty and safe to eat.',
        apCost: 6,
        tab: 'cooking',
        requiresCampfire: true,
        tools: [], 
        ingredients: [
            { id: 'food.raw_meat', count: 1 }
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
    },
    {
        id: 'crafting.makeshift_shovel',
        name: 'Makeshift Shovel',
        resultItem: 'weapon.makeshift_shovel',
        description: 'A crude shovel made from a metal plate and a sturdy stick.',
        apCost: 8,
        tab: 'crafting',
        tools: [],
        ingredients: [
            { id: 'crafting.metal_plate', count: 1 },
            { id: 'weapon.stick', count: 1 },
            { id: 'crafting.rope', count: 1 }
        ]
    },
    {
        id: 'crafting.rabbit_snare',
        name: 'Rabbit Snare',
        resultItem: 'tool.snare_undeployed',
        description: 'A simple snare for catching small animals. Can be set on the ground and retrieved later.',
        apCost: 5,
        tab: 'crafting',
        tools: [],
        ingredients: [
            { id: 'weapon.stick', count: 1 },
            { either: ['crafting.wire', 'crafting.rope'], count: 1, label: 'Wire or Rope' }
        ]
    },
    {
        id: 'crafting.bedroll',
        name: 'Bedroll',
        resultItem: 'bedroll.closed',
        description: 'A comfortable portable bedroll made from salvaged padding and rags.',
        apCost: 10,
        tab: 'crafting',
        tools: [],
        ingredients: [
            { id: 'crafting.feather_padding', count: 1 },
            { id: 'crafting.rag', count: 6 },
            { either: ['crafting.rope', 'crafting.leather_belt'], count: 1, label: 'Rope or Leather Belt' }
        ]
    },
    {
        id: 'crafting.small_sled',
        name: 'Small Sled',
        resultItem: 'placeable.small_sled',
        description: 'A sturdy wooden sled for hauling large quantities of gear across the ground.',
        resultCount: 1,
        apCost: 15,
        tab: 'crafting',
        tools: [
            { either: ['weapon.hammer', 'weapon.makeshift_hammer'], count: 1, label: 'Hammer' }
        ],
        ingredients: [
            { id: 'weapon.plank', count: 4 },
            { id: 'crafting.nail', count: 4 }
        ]
    },
    {
        id: 'crafting.planter_box',
        name: 'Planter box',
        resultItem: 'furniture.planter_box',
        description: 'A wooden box filled with soil for growing plants.',
        apCost: 12,
        tab: 'crafting',
        tools: [
            { either: ['weapon.hammer', 'weapon.makeshift_hammer'], count: 1, label: 'Hammer' }
        ],
        ingredients: [
            { id: 'weapon.plank', count: 4 },
            { id: 'crafting.nail', count: 4 },
            { id: 'crafting.soil', count: 1 }
        ]
    }
];
