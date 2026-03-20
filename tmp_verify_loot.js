import { LootGenerator } from './client/src/game/map/LootGenerator.js';

// Mock GameMap
const gameMap = {
    getTile: (x, y) => ({ terrain: 'floor' }),
    setItemsOnTile: (x, y, items) => {
        console.log(`[Test] Tile (${x}, ${y}) got ${items.length} items: ${items.map(i => i.name).join(', ')}`);
        // Basic check for requested items
        items.forEach(item => {
            if (item.name.includes('Backpack')) console.log('  -> FOUND BACKPACK');
            if (item.name.includes('Pistol') || item.name.includes('Rifle') || item.name.includes('Shotgun')) console.log('  -> FOUND GUN');
            if (item.name.includes('Ammo')) console.log('  -> FOUND AMMO');
            if (item.name.includes('Axe') || item.name.includes('Hammer') || item.name.includes('Crowbar')) console.log('  -> FOUND FIRE TOOL');
            if (item.name.includes('Bandage') || item.name.includes('Antibiotics')) console.log('  -> FOUND MEDICAL');
        });
    }
};

const generator = new LootGenerator();

console.log('--- Testing Police Station Loot ---');
generator.spawnSpecialLoot(gameMap, { type: 'police', x: 10, y: 10, width: 6, height: 6 });

console.log('\n--- Testing Fire Station Loot ---');
generator.spawnSpecialLoot(gameMap, { type: 'firestation', x: 20, y: 20, width: 6, height: 6 });
