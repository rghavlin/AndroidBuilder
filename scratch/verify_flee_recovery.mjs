import { Entity } from '../client/src/game/entities/Entity.js';
import { AIState } from '../client/src/game/components/AIState.js';

let passed = 0;
let failed = 0;

function assert(condition, label) {
    if (condition) {
        console.log(`✅ PASS: ${label}`);
        passed++;
    } else {
        console.error(`❌ FAIL: ${label}`);
        failed++;
    }
}

async function verify() {
    console.log('=== P2-13: Verify Entity fleeing recovery ===\n');

    const entity = new Entity('test-npc', 'npc', 0, 0);
    entity.addComponent(new AIState({ behaviorState: 'fleeing', fleeRecoverChance: 0.5 }));

    assert(entity.behaviorState === 'fleeing', 'Initial behaviorState is fleeing');
    assert(entity.fleeRecoverChance === 0.5, 'fleeRecoverChance is 0.5');

    // 1. Mock Math.random to guarantee success (e.g. 0.1 < 0.5)
    const originalRandom = Math.random;
    Math.random = () => 0.1;

    console.log('Running startTurn() with roll that should succeed...');
    entity.startTurn();

    assert(entity.behaviorState === 'idle', 'Entity successfully recovered to idle behaviorState');

    // Reset back to fleeing
    entity.behaviorState = 'fleeing';

    // 2. Mock Math.random to guarantee failure (e.g. 0.9 > 0.5)
    Math.random = () => 0.9;

    console.log('Running startTurn() with roll that should fail...');
    entity.startTurn();

    assert(entity.behaviorState === 'fleeing', 'Entity did not recover and remained in fleeing behaviorState');

    // Restore Math.random
    Math.random = originalRandom;

    console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
    if (failed > 0) {
        console.error('\n❌ SOME TESTS FAILED');
        process.exit(1);
    } else {
        console.log('\n🎉 All P2-13 flee recovery tests passed!');
    }
}

verify().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
