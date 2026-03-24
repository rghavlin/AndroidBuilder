import { GameMap } from '../client/src/game/map/GameMap.js';
import { Zombie } from '../client/src/game/entities/Zombie.js';
import assert from 'assert';

async function testNoiseSystem() {
    console.log('--- Testing Gun Noise System (Assertions) ---');
    
    const map = new GameMap(50, 50);
    
    // 1. Spawn zombies
    const zClose = new Zombie('z1', 12, 12); // Dist ~2.8
    const zMid = new Zombie('z2', 25, 10);   // Dist 15
    const zFar = new Zombie('z3', 45, 10);   // Dist 35
    
    map.addEntity(zClose, 12, 12);
    map.addEntity(zMid, 25, 10);
    map.addEntity(zFar, 45, 10);
    
    // Initial check
    assert.strictEqual(zClose.heardNoise, false);
    assert.strictEqual(zMid.heardNoise, false);
    assert.strictEqual(zFar.heardNoise, false);
    
    // 2. 9mm Pistol (Radius 12)
    map.emitNoise(10, 10, 12);
    assert.strictEqual(zClose.heardNoise, true, 'Close zombie should hear 9mm');
    assert.strictEqual(zMid.heardNoise, false, 'Mid zombie should NOT hear 9mm');
    assert.strictEqual(zClose.noiseCoords.x, 10);
    assert.strictEqual(zClose.noiseCoords.y, 10);
    
    // Reset
    zClose.clearNoiseHeard();
    
    // 3. Shotgun (Radius 25)
    map.emitNoise(10, 10, 25);
    assert.strictEqual(zClose.heardNoise, true, 'Close zombie should hear shotgun');
    assert.strictEqual(zMid.heardNoise, true, 'Mid zombie should hear shotgun');
    assert.strictEqual(zFar.heardNoise, false, 'Far zombie should NOT hear shotgun');
    
    // 4. Suppressed (Radius 3)
    zClose.clearNoiseHeard();
    zMid.clearNoiseHeard();
    map.emitNoise(10, 10, 3);
    assert.strictEqual(zClose.heardNoise, true, 'Close zombie should hear suppressed shot at dist 2.8');
    assert.strictEqual(zMid.heardNoise, false, 'Mid zombie should NOT hear suppressed shot at dist 15');
    
    console.log('✅ All noise assertions passed!');
}

testNoiseSystem().catch(err => {
    console.error('❌ Test failed!');
    console.error(err);
    process.exit(1);
});
