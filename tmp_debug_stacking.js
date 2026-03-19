
import { Item } from './client/src/game/inventory/Item.js';
import { Container } from './client/src/game/inventory/Container.js';
import { ItemTrait } from './client/src/game/inventory/traits.js';

console.log('--- STARTING 1x2 ORIENTATION STACKING TEST v4 ---');
try {
    const container = new Container({ id: 'test-container', width: 6, height: 6 });
    
    // item1 is 1x2 at (1,1) -> occupies (1,1), (1,2)
    const item1 = new Item({ 
        instanceId: 'bottle1',
        defId: 'food.waterbottle_plastic', 
        name: 'Bottle 1',
        traits: [ItemTrait.STACKABLE],
        stackMax: 10, 
        stackCount: 5, 
        width: 1, 
        height: 2, 
        ammoCount: 1,
        capacity: 20
    });
    
    // item2 is 1x2 -> will be rotated to 2x1
    const item2 = new Item({ 
        instanceId: 'bottle2',
        defId: 'food.waterbottle_plastic', 
        name: 'Bottle 2',
        traits: [ItemTrait.STACKABLE],
        stackMax: 10, 
        stackCount: 3, 
        width: 1, 
        height: 2, 
        ammoCount: 1,
        capacity: 20
    });

    container.placeItemAt(item1, 1, 1);
    console.log('Placed item1 (1x2) at (1,1)');

    console.log('Rotating item2 to 2x1...');
    item2.rotate(true);

    // Try to stack at (0,1): covers (0,1) and (1,1)
    console.log('Attempting to stack item2 (2x1) at (0,1) - overlap at (1,1)...');
    const result1 = container.validatePlacement(item2, 0, 1);
    console.log('Result at (0,1):', JSON.stringify({ valid: result1.valid, reason: result1.reason, hasStackTarget: !!result1.stackTarget }));

    // Try to stack at (1,1): covers (1,1) and (2,1)
    console.log('Attempting to stack item2 (2x1) at (1,1) - overlap at (1,1)...');
    const result2 = container.validatePlacement(item2, 1, 1);
    console.log('Result at (1,1):', JSON.stringify({ valid: result2.valid, reason: result2.reason, hasStackTarget: !!result2.stackTarget }));

} catch (err) {
    console.error('ERROR DURING TEST:', err);
}
console.log('--- END TEST ---');
