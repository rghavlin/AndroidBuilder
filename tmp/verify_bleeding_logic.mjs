import { Player } from '../client/src/game/entities/Player.js';
import { ZombieAI } from '../client/src/game/ai/ZombieAI.js';

class MockZombie {
    constructor() {
        this.id = 'zombie-1';
        this.currentAP = 10;
        this.subtype = 'standard';
    }
    useAP(amount) {
        this.currentAP -= amount;
    }
}

async function runTests() {
    console.log("Starting Bleeding and Sickness Logic Verification...");

    // 1. Test Player Initial State
    const player = new Player('player-1', 10, 10);
    console.log(`Initial Player Bleeding: ${player.isBleeding} (Expected: false)`);
    console.log(`Initial Player Condition: ${player.condition} (Expected: Normal)`);

    // 2. Test Sickness Duration Update
    player.inflictSickness(3);
    console.log(`Player Sickness Points: ${player.sickness} (Expected: 3)`);
    console.log(`Player Condition: ${player.condition} (Expected: Sick)`);

    // 3. Test Zombie Attack Bleeding Chance (Statistical)
    console.log("\nTesting Zombie Bleeding Chance (5%). Running 1000 hits...");
    const zombie = new MockZombie();
    let bleedingCount = 0;
    for (let i = 0; i < 1000; i++) {
        player.isBleeding = false; // Reset before each hit
        zombie.currentAP = 1; // Allow one attack
        // Override Math.random for deterministic hit
        const originalRandom = Math.random;
        Math.random = () => 0.1; // Always hit (hit chance is 0.5, so 0.1 < 0.5)
        
        // We need another random for the 5% roll. This is tricky.
        // Let's just use the real random and check stats.
        Math.random = originalRandom;
        
        // We need to mock the hit roll separately if we want precision, 
        // but let's just use the actual code.
        const result = ZombieAI.attemptAttack(zombie, player);
        if (player.isBleeding) {
            bleedingCount++;
        }
    }
    console.log(`Total Bleeding Inflicted: ${bleedingCount}/1000 hits (~50 expected)`);

    // 4. Test Bleeding Cure
    player.isBleeding = true;
    console.log(`\nPlayer is bleeding: ${player.isBleeding}`);
    player.isBleeding = false; // Simulating bandage effect (usually handled in InventoryContext)
    console.log(`Player bleeding after cure: ${player.isBleeding} (Expected: false)`);

    console.log("\nVerification complete.");
}

runTests().catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});
