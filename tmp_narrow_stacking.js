
import { Item } from './client/src/game/inventory/Item.js';
import { Container } from './client/src/game/inventory/Container.js';
import { ItemTrait } from './client/src/game/inventory/traits.js';

console.log('--- STARTING NARROW CONTAINER STACKING TEST ---');
try {
    // Narrow container: 1x4 (like a pocket)
    const container = new Container({ id: 'pocket', width: 1, height: 4 });
    
    // item1 is 1x2 at (0,0) -> occupies (0,0), (0,1)
    const item1 = new Item({ 
        instanceId: 'B1',
        defId: 'food.waterbottle_plastic', 
        name: 'Bottle 1',
        traits: [ItemTrait.STACKABLE],
        stackMax: 10, 
        stackCount: 5, 
        width: 1, 
        height: 2 
    });
    
    container.placeItemAt(item1, 0, 0);
    console.log('Placed B1 (1x2) at (0,0) in 1x4 pocket.');

    // item2 is 1x2 -> rotated to 2x1
    const item2 = new Item({ 
        instanceId: 'B2',
        defId: 'food.waterbottle_plastic', 
        name: 'Bottle 2',
        traits: [ItemTrait.STACKABLE],
        stackCount: 3, 
        width: 1, 
        height: 2 
    });
    item2.rotate(true); // 2x1
    console.log('Item2 rotated to 2x1. Dimensions:', item2.getActualWidth(), 'x', item2.getActualHeight());

    console.log('Attempting to stack B2 (2x1) onto B1 at (0,0)...');
    const result = container.validatePlacement(item2, 0, 0);
    
    console.log('VALIDATE:', result.valid);
    console.log('REASON:', result.reason);
    console.log('STACK_TARGET:', result.stackTarget ? result.stackTarget.instanceId : 'null');

} catch (err) {
    console.error('ERROR:', err);
}
console.log('--- END TEST ---');
