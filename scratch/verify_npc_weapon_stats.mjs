import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { Item } from '../client/src/game/inventory/Item.js';
import { ItemDefs, createItemFromDef } from '../client/src/game/inventory/ItemDefs.js';
import { ItemTrait, ItemCategory } from '../client/src/game/inventory/traits.js';
import { NPCAI } from '../client/src/game/ai/NPCAI.js';
import { GameMap } from '../client/src/game/map/GameMap.js';
import engine from '../client/src/game/GameEngine.js';

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

// Register custom test weapon definitions at runtime
ItemDefs['weapon.test_npc_ranged_heavy'] = {
    id: 'weapon.test_npc_ranged_heavy',
    name: 'Test NPC Ranged Heavy',
    width: 2,
    height: 1,
    traits: [ItemTrait.EQUIPPABLE],
    categories: [ItemCategory.WEAPON],
    rangedStats: {
        maxRange: 12,
        apCost: 3.5,
        damage: { min: 10, max: 20 }
    }
};

ItemDefs['weapon.test_npc_ranged_light'] = {
    id: 'weapon.test_npc_ranged_light',
    name: 'Test NPC Ranged Light',
    width: 1,
    height: 1,
    traits: [ItemTrait.EQUIPPABLE],
    categories: [ItemCategory.WEAPON],
    rangedStats: {
        maxRange: 5,
        apCost: 1.5,
        damage: { min: 5, max: 10 }
    }
};

ItemDefs['weapon.test_npc_melee'] = {
    id: 'weapon.test_npc_melee',
    name: 'Test NPC Melee',
    width: 1,
    height: 1,
    traits: [ItemTrait.EQUIPPABLE],
    categories: [ItemCategory.WEAPON],
    combat: {
        apCost: 0.5,
        damage: { min: 3, max: 6 }
    }
};

ItemDefs['weapon.test_npc_ranged_fallback'] = {
    id: 'weapon.test_npc_ranged_fallback',
    name: 'Test NPC Ranged Fallback',
    width: 1,
    height: 1,
    traits: [ItemTrait.EQUIPPABLE],
    categories: [ItemCategory.WEAPON],
    rangedStats: {
        // No maxRange, no apCost defined
        damage: { min: 2, max: 5 }
    }
};

async function verify() {
    console.log('=== P3-02: Verify NPC Combat Stats from Weapon Definitions ===\n');

    const gameMap = new GameMap(20, 20);
    engine.gameMap = gameMap;

    // Helper to equip a weapon definition on an NPC
    function equipWeapon(npc, defId) {
        const weaponData = createItemFromDef(defId);
        const weapon = new Item(weaponData);
        npc.inventory.addItem(weapon);
        npc.equippedWeaponId = weapon.instanceId;
        return weapon;
    }

    // --- TEST 1: Ranged Heavy Weapon (Max Range: 12, AP Cost: 3.5) ---
    {
        console.log('--- Test 1: Heavy Ranged Weapon ---');
        const npc = EntityFactory.createNPC(5, 5, true); // Hostile NPC
        gameMap.addEntity(npc, 5, 5);
        equipWeapon(npc, 'weapon.test_npc_ranged_heavy');

        // Player at distance 10 (5, 15)
        const player = EntityFactory.createPlayer(5, 15);
        gameMap.addEntity(player, 5, 15);

        npc.hasDemanded = true;
        npc.ap = 10;
        const turnResult = { actions: [], success: true };

        // 1. Engagement range check
        const canEngage = NPCAI.processHostilePlayer(npc, gameMap, player, turnResult);
        assert(canEngage === true, 'NPC can engage player at distance 10 when weapon range is 12');
        assert(turnResult.actions.some(a => a.type === 'ATTACK'), 'Attack action was queued');

        // 2. AP Consumption check
        npc.ap = 10;
        NPCAI.performAttack(npc, player, turnResult, true);
        assert(npc.ap === 6.5, `NPCAI.performAttack consumed exactly 3.5 AP (remaining AP: ${npc.ap})`);

        // Clean up
        gameMap.removeEntity(npc.id);
        gameMap.removeEntity(player.id);
    }

    // --- TEST 2: Ranged Light Weapon (Max Range: 5, AP Cost: 1.5) ---
    {
        console.log('\n--- Test 2: Light Ranged Weapon ---');
        const npc = EntityFactory.createNPC(5, 5, true);
        gameMap.addEntity(npc, 5, 5);
        equipWeapon(npc, 'weapon.test_npc_ranged_light');

        // Player at distance 6 (5, 11) - too far for range 5
        const player = EntityFactory.createPlayer(5, 11);
        gameMap.addEntity(player, 5, 11);

        npc.hasDemanded = true;
        npc.ap = 10;
        const turnResult = { actions: [], success: true };

        // 1. Engagement range check (too far)
        const canMove = NPCAI.processHostilePlayer(npc, gameMap, player, turnResult);
        assert(canMove === true, 'processHostilePlayer returns true when moving towards player');
        assert(turnResult.actions.some(a => a.type === 'MOVE'), 'Move action was queued instead of attack');
        assert(!turnResult.actions.some(a => a.type === 'ATTACK'), 'No attack action was queued when too far');

        // 2. Engagement range check (in range at distance 4)
        npc.moveTo(5, 7); // Move NPC closer to (5, 7), distance to (5, 11) is 4
        npc.ap = 10;
        turnResult.actions = [];
        const canEngageClose = NPCAI.processHostilePlayer(npc, gameMap, player, turnResult);
        assert(canEngageClose === true, 'NPC can engage player at distance 4 when weapon range is 5');
        assert(turnResult.actions.some(a => a.type === 'ATTACK'), 'Attack action was queued when in range');

        // 3. AP Consumption check
        npc.ap = 10;
        NPCAI.performAttack(npc, player, turnResult, true);
        assert(npc.ap === 8.5, `NPCAI.performAttack consumed exactly 1.5 AP (remaining AP: ${npc.ap})`);

        // Clean up
        gameMap.removeEntity(npc.id);
        gameMap.removeEntity(player.id);
    }

    // --- TEST 3: Melee Weapon (AP Cost: 0.5) ---
    {
        console.log('\n--- Test 3: Melee Weapon ---');
        const npc = EntityFactory.createNPC(5, 5, true);
        gameMap.addEntity(npc, 5, 5);
        equipWeapon(npc, 'weapon.test_npc_melee');

        const player = EntityFactory.createPlayer(5, 6); // adjacent
        gameMap.addEntity(player, 5, 6);

        npc.ap = 10;
        const turnResult = { actions: [], success: true };

        NPCAI.performAttack(npc, player, turnResult, false);
        assert(npc.ap === 9.5, `NPCAI.performAttack consumed exactly 0.5 AP for custom melee weapon (remaining AP: ${npc.ap})`);

        // Clean up
        gameMap.removeEntity(npc.id);
        gameMap.removeEntity(player.id);
    }

    // --- TEST 4: Fallback Ranged Weapon (No stats in definition -> Fallback Range: 8, AP: 2.0) ---
    {
        console.log('\n--- Test 4: Ranged Fallback Weapon ---');
        const npc = EntityFactory.createNPC(5, 5, true);
        gameMap.addEntity(npc, 5, 5);
        equipWeapon(npc, 'weapon.test_npc_ranged_fallback');

        // Player at distance 7 (5, 12) - fits inside fallback range 8
        const player = EntityFactory.createPlayer(5, 12);
        gameMap.addEntity(player, 5, 12);

        npc.hasDemanded = true;
        npc.ap = 10;
        const turnResult = { actions: [], success: true };

        // 1. Engagement range check at distance 7
        const canEngage = NPCAI.processHostilePlayer(npc, gameMap, player, turnResult);
        assert(canEngage === true, 'NPC can engage player at distance 7 when using fallback range (8)');
        assert(turnResult.actions.some(a => a.type === 'ATTACK'), 'Attack action was queued');

        // 2. Engagement range check at distance 9 (out of fallback range)
        npc.moveTo(5, 3); // Distance to (5, 12) is 9
        npc.ap = 10;
        turnResult.actions = [];
        const canMoveFar = NPCAI.processHostilePlayer(npc, gameMap, player, turnResult);
        assert(canMoveFar === true, 'processHostilePlayer returns true when moving towards player at distance 9');
        assert(turnResult.actions.some(a => a.type === 'MOVE'), 'Move action was queued at distance 9');
        assert(!turnResult.actions.some(a => a.type === 'ATTACK'), 'No attack action was queued at distance 9');

        // 3. AP Consumption check (fallback to 2.0)
        npc.ap = 10;
        NPCAI.performAttack(npc, player, turnResult, true);
        assert(npc.ap === 8.0, `NPCAI.performAttack consumed exactly 2.0 AP (fallback) (remaining AP: ${npc.ap})`);

        // Clean up
        gameMap.removeEntity(npc.id);
        gameMap.removeEntity(player.id);
    }

    console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
    if (failed > 0) {
        console.error('\n❌ SOME TESTS FAILED');
        process.exit(1);
    } else {
        console.log('\n🎉 All P3-02 NPC weapon stats tests passed!');
        process.exit(0);
    }
}

verify().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
