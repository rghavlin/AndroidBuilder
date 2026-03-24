/**
 * Test script for Gun Noise System
 * Verify zombies are alerted based on distance and noise radius
 */
import { GameMap } from '../client/src/game/map/GameMap.js';
import { Zombie } from '../client/src/game/entities/Zombie.js';

async function testNoiseSystem() {
    console.log('--- Testing Gun Noise System ---');
    
    const map = new GameMap(50, 50);
    
    // 1. Spawn zombies at various distances from (10, 10)
    const zClose = new Zombie('z1', 12, 12); // Distance ~2.8
    const zMid = new Zombie('z2', 25, 10);   // Distance 15
    const zFar = new Zombie('z3', 45, 10);   // Distance 35
    
    map.addEntity(zClose, 12, 12);
    map.addEntity(zMid, 25, 10);
    map.addEntity(zFar, 45, 10);
    
    console.log('Initial state: All zombies should have heardNoise = false');
    console.log(`Z1 (Close): ${zClose.heardNoise}`);
    console.log(`Z2 (Mid): ${zMid.heardNoise}`);
    console.log(`Z3 (Far): ${zFar.heardNoise}`);
    
    // 2. Emit noise (simulate 9mm Pistol - Radius 12)
    console.log('\n--- Emitting 9mm Noise (Radius 12) at (10, 10) ---');
    map.emitNoise(10, 10, 12);
    
    console.log(`Z1 (Close, dist 2.8) heard noise: ${zClose.heardNoise} (Expected: true)`);
    console.log(`Z2 (Mid, dist 15) heard noise: ${zMid.heardNoise} (Expected: false)`);
    
    // Reset
    zClose.clearNoiseHeard();
    
    // 3. Emit noise (simulate Shotgun - Radius 25)
    console.log('\n--- Emitting Shotgun Noise (Radius 25) at (10, 10) ---');
    map.emitNoise(10, 10, 25);
    
    console.log(`Z1 (Close, dist 2.8) heard noise: ${zClose.heardNoise} (Expected: true)`);
    console.log(`Z2 (Mid, dist 15) heard noise: ${zMid.heardNoise} (Expected: true)`);
    console.log(`Z3 (Far, dist 35) heard noise: ${zFar.heardNoise} (Expected: false)`);
    
    // 4. Test Suppressor (Radius 3)
    zClose.clearNoiseHeard();
    zMid.clearNoiseHeard();
    console.log('\n--- Emitting Suppressed Noise (Radius 3) at (10, 10) ---');
    map.emitNoise(10, 10, 3);
    
    console.log(`Z1 (Close, dist 2.8) heard noise: ${zClose.heardNoise} (Expected: true)`);
    console.log(`Z2 (Mid, dist 15) heard noise: ${zMid.heardNoise} (Expected: false)`);
    
    console.log('\n--- Test Complete ---');
}

testNoiseSystem().catch(console.error);
