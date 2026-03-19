
import { Item } from './client/src/game/inventory/Item.js';
import { Container } from './client/src/game/inventory/Container.js';
import { ItemTrait } from './client/src/game/inventory/traits.js';

console.log('--- STARTING WATER BOTTLE STACKING SIMULATION ---');
try {
    const container = new Container({ id: 'test-container', width: 10, height: 10 });
    
    // Create two identical 1x2 water bottles
    const item1 = new Item({ 
        instanceId: 'B1',
        defId: 'food.waterbottle_plastic', 
        name: 'Bottle 1',
        traits: [ItemTrait.STACKABLE],
        stackMax: 10, 
        stackCount: 5, 
        width: 1, 
        height: 2,
        ammoCount: 0 // Empty
    });
    
    const item2 = new Item({ 
        instanceId: 'B2',
        defId: 'food.waterbottle_plastic', 
        name: 'Bottle 2',
        traits: [ItemTrait.STACKABLE],
        stackMax: 10, 
        stackCount: 3, 
        width: 1, 
        height: 2 ,
        ammoCount: 0 // Empty
    });

    container.placeItemAt(item1, 1, 1);
    console.log('Placed B1 (1x2) at (1,1).');

    console.log('Rotating B2 to 2x1...');
    item2.rotate(true);

    // Scenario 1: Dragging B2 onto B1 at (1,1)
    console.log('Dragging B2 (2x1) onto (1,1) - overlap with B1 at (1,1)...');
    const res1 = container.validatePlacement(item2, 1, 1);
    console.log('Result at (1,1):', res1.stackTarget ? 'SUCCESS' : 'FAILED: ' + (res1.reason || 'no target found'));

    // Scenario 2: Dragging B2 onto B1 at (1,2)
    console.log('Dragging B2 (2x1) onto (1,2) - overlap with B1 at (1,2)...');
    const res2 = container.validatePlacement(item2, 1, 2);
    console.log('Result at (1,2):', res2.stackTarget ? 'SUCCESS' : 'FAILED: ' + (res2.reason || 'no target found'));

} catch (err) {
    console.error('ERROR:', err);
}
console.log('--- END TEST ---');
