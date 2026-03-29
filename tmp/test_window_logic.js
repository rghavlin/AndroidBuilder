
// Verification script for Pathfinding window cost logic
import { Pathfinding } from '../client/src/game/utils/Pathfinding.js';

function testWindowCost() {
    console.log('--- Testing Window Move Cost for Zombies ---');
    
    // Mock tiles
    const grassTile = { terrain: 'grass', contents: [] };
    const closedWindowTile = { terrain: 'floor', contents: [{ type: 'window', isOpen: false, isBroken: false }] };
    const openWindowTile = { terrain: 'floor', contents: [{ type: 'window', isOpen: true, isBroken: false }] };
    const brokenWindowTile = { terrain: 'floor', contents: [{ type: 'window', isOpen: false, isBroken: true }] };
    
    const x1 = 0, y1 = 0;
    const x2 = 1, y2 = 0; // Cardinal move
    
    // 1. Cardinal move through grass (cost 1)
    const costGrass = Pathfinding.getMovementCost(x1, y1, x2, y2, grassTile, { isZombie: true });
    console.log(`Grass cost: ${costGrass} (Expected: 1)`);
    
    // 2. Cardinal move through closed window (cost 4)
    const costClosed = Pathfinding.getMovementCost(x1, y1, x2, y2, closedWindowTile, { isZombie: true });
    console.log(`Closed Window cost: ${costClosed} (Expected: 4)`);
    
    // 3. Cardinal move through open window (cost 3)
    const costOpen = Pathfinding.getMovementCost(x1, y1, x2, y2, openWindowTile, { isZombie: true });
    console.log(`Open Window cost: ${costOpen} (Expected: 3)`);
    
    // 4. Cardinal move through broken window (cost 3)
    const costBroken = Pathfinding.getMovementCost(x1, y1, x2, y2, brokenWindowTile, { isZombie: true });
    console.log(`Broken Window cost: ${costBroken} (Expected: 3)`);
    
    // Verification
    if (costClosed === 4 && costOpen === 3 && costBroken === 3) {
        console.log('\nSUCCESS: Zombie window AP costs are correctly implemented!');
    } else {
        console.log('\nFAILURE: Zombie window AP costs do not match expectations.');
    }
}

testWindowCost();
