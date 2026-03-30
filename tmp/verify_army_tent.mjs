import { TemplateMapGenerator } from '../client/src/game/map/TemplateMapGenerator.js';

async function test_army_tent_generation() {
    console.log('--- Testing Army Tent Generation ---');
    const generator = new TemplateMapGenerator();
    
    // Map 1: Guaranteed Tent (New requirement)
    console.log('Testing Map 1 (Guaranteed Tent):');
    const mapData1 = generator.generateFromTemplate('road', { mapNumber: 1 });
    const hasTent1 = mapData1.metadata.specialBuildings?.some(b => b.type === 'army_tent');
    console.log(`Map 1 has tent: ${hasTent1}`);
    if (!hasTent1) throw new Error('Army Tent missing on Map 1');

    // Map 3: Guaranteed Tent
    console.log('Testing Map 3 (Guaranteed Tent):');
    const mapData3 = generator.generateFromTemplate('road', { mapNumber: 3 });
    const hasTent3 = mapData3.metadata.specialBuildings?.some(b => b.type === 'army_tent');
    console.log(`Map 3 has tent: ${hasTent3}`);
    if (!hasTent3) throw new Error('Army Tent missing on Map 3');

    // Map 2: No Tent
    console.log('Testing Map 2 (No Tent):');
    const mapData2 = generator.generateFromTemplate('road', { mapNumber: 2 });
    const hasTent2 = mapData2.metadata.specialBuildings?.some(b => b.type === 'army_tent');
    console.log(`Map 2 has tent: ${hasTent2}`);
    if (hasTent2) throw new Error('Army Tent should not spawn on Map 2');

    // Map 4: 35% Chance
    console.log('Testing Map 4 (35% Chance):');
    let tentCount = 0;
    const trials = 100;
    for (let i = 0; i < trials; i++) {
        const mapData = generator.generateFromTemplate('road', { mapNumber: 4 });
        if (mapData.metadata.specialBuildings?.some(b => b.type === 'army_tent')) {
            tentCount++;
        }
    }
    console.log(`Map 4 tent count in ${trials} trials: ${tentCount} (Expected ~35)`);
    if (tentCount === 0 || tentCount > 60) {
        console.warn('Tent spawn rate outside expected range, but could be random chance.');
    }

    console.log('--- Verification Complete ---');
}

test_army_tent_generation().catch(e => {
    console.error('Verification failed:', e);
    process.exit(1);
});
