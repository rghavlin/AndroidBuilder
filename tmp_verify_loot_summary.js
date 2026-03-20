import { LootGenerator } from './client/src/game/map/LootGenerator.js';

const generator = new LootGenerator();

function testLoot(type, iterations = 100) {
    console.log(`--- Testing ${type} Loot over ${iterations} iterations ---`);
    let totalDrops = 0;
    let counts = {
        gun: 0,
        ammo: 0,
        backpack: 0,
        fireTool: 0,
        medicalSurcharge: 0, // Extra medical from the 50% rule
        standard: 0
    };

    const gameMap = {
        getTile: (x, y) => ({ terrain: 'floor' }),
        setItemsOnTile: (x, y, items) => {
            totalDrops++;
            items.forEach(item => {
                if (item.id === 'backpack.standard') counts.backpack++;
                if (['weapon.9mmPistol', 'weapon.357Pistol', 'weapon.hunting_rifle', 'weapon.shotgun'].includes(item.id)) counts.gun++;
                if (item.id.startsWith('ammo.')) counts.ammo++;
                if (['weapon.fire_axe', 'weapon.hammer', 'weapon.crowbar'].includes(item.id)) counts.fireTool++;
                if (item.id === 'medical.bandage' || item.id === 'medical.antibiotics') counts.medicalSurcharge++;
            });
        }
    };

    for (let i = 0; i < iterations; i++) {
        generator.spawnSpecialLoot(gameMap, { type, x: 10, y: 10, width: 6, height: 6 });
    }

    console.log(`Total drops (tiles): ${totalDrops}`);
    console.log(`Average drops per building: ${(totalDrops / iterations).toFixed(2)}`);
    console.log(`Backpack count: ${counts.backpack} (${((counts.backpack / iterations) * 100).toFixed(1)}% of buildings)`);
    if (type === 'police') {
        console.log(`Gun count: ${counts.gun} (${((counts.gun / iterations) * 100).toFixed(1)}% of buildings)`);
        console.log(`Ammo count: ${counts.ammo} (${((counts.ammo / totalDrops) * 100).toFixed(1)}% of drops)`);
    } else if (type === 'firestation') {
        console.log(`Fire tool count: ${counts.fireTool} (${((counts.fireTool / iterations) * 100).toFixed(1)}% of buildings)`);
        console.log(`Medical surcharge count: ${counts.medicalSurcharge} (${((counts.medicalSurcharge / totalDrops) * 100).toFixed(1)}% of drops)`);
    }
}

testLoot('police');
console.log('');
testLoot('firestation');
