const fs = require('fs');
const acorn = require('acorn');

const files = [
    'c:/Games/AndroidBuilder/client/src/game/map/GameMap.js',
    'c:/Games/AndroidBuilder/client/src/game/inventory/InventoryManager.js',
    'c:/Games/AndroidBuilder/client/src/game/inventory/Item.js',
    'c:/Games/AndroidBuilder/client/src/game/map/LootGenerator.js',
    'c:/Games/AndroidBuilder/client/src/game/inventory/ItemDefs.js',
    'c:/Games/AndroidBuilder/client/src/game/inventory/CraftingManager.js',
    'c:/Games/AndroidBuilder/client/src/game/inventory/traits.js',
    'c:/Games/AndroidBuilder/client/src/game/utils/TurnProcessingUtils.js',
    'c:/Games/AndroidBuilder/client/src/game/entities/ZombieTypes.js'
];

files.forEach(file => {
    try {
        const content = fs.readFileSync(file, 'utf8');
        acorn.parse(content, { ecmaVersion: 'latest', sourceType: 'module' });
        console.log(`[OK] ${file}`);
    } catch (err) {
        console.error(`[ERROR] ${file}: ${err.message}`);
        console.error(`At position: ${err.pos}`);
        const snippet = fs.readFileSync(file, 'utf8').slice(Math.max(0, err.pos - 50), err.pos + 50);
        console.error(`Snippet: ...${snippet}...`);
    }
});
