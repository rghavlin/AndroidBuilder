import { GameMap } from './client/src/game/map/GameMap.js';
import { Rabbit } from './client/src/game/entities/Rabbit.js';
import { RabbitAI } from './client/src/game/ai/RabbitAI.js';

console.log('--- Rabbit Sight System Verification ---');

const testCases = [
    { name: 'Vicinity (Dist 9, Wall)', dist: 9, hasWall: true, expectFlee: true },
    { name: 'Sight (Dist 12, No Wall)', dist: 12, hasWall: false, expectFlee: true },
    { name: 'Invisibility (Dist 12, Wall)', dist: 12, hasWall: true, expectFlee: false },
    { name: 'Out of Range (Dist 16, No Wall)', dist: 16, hasWall: false, expectFlee: false }
];

testCases.forEach(tc => {
    const map = new GameMap(40, 40);
    const rabbit = new Rabbit('test-rabbit', 20, 20);
    map.addEntity(rabbit, 20, 20);
    
    // Player at (20 + dist, 20)
    const player = { id: 'player', x: 20 + tc.dist, y: 20 };
    
    if (tc.hasWall) {
        // Place wall at (20 + 5, 20)
        map.setTerrain(20 + 5, 20, 'wall'); 
    }

    const result = RabbitAI.executeRabbitTurn(rabbit, map, player, []);
    const fled = result.actions.some(a => a.type === 'flee');
    
    console.log(`Test: ${tc.name.padEnd(25)} | Expected: ${tc.expectFlee ? 'FLEE' : 'STAY'} | Result: ${fled ? 'FLEE' : 'STAY'} | ${fled === tc.expectFlee ? '✅ PASS' : '❌ FAIL'}`);
});
