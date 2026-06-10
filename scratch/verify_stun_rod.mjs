import engine from '../client/src/game/GameEngine.js';
import { Player } from '../client/src/game/entities/Player.js';
import { Zombie } from '../client/src/game/entities/Zombie.js';
import { NPC } from '../client/src/game/entities/NPC.js';
import { Item } from '../client/src/game/inventory/Item.js';
import { ItemDefs } from '../client/src/game/inventory/ItemDefs.js';
import { CraftingRecipes } from '../client/src/game/inventory/CraftingRecipes.js';

function runTest() {
    console.log("=== Running Stun Rod & Stunned Condition Verification Test ===");

    // Reset game engine
    engine.reset();
    const player = new Player('player-1', 'Player', 0, 0);
    player.ap = 100;
    player.maxAp = 100;
    engine.player = player;

    // --- 1. Verify Definitions ---
    console.log("\n--- Testing definitions in ItemDefs.js ---");
    const bookDef = ItemDefs['book.nomad_survivor_7'];
    if (!bookDef) {
        throw new Error("FAIL: book.nomad_survivor_7 definition is missing!");
    }
    console.log("✅ book.nomad_survivor_7 is defined. Description:", bookDef.description);
    if (bookDef.totalPages !== 25) {
        throw new Error(`FAIL: book.nomad_survivor_7 totalPages should be 25, got ${bookDef.totalPages}`);
    }
    console.log("✅ book.nomad_survivor_7 page count is 25.");

    const stunRodDef = ItemDefs['weapon.stun_rod'];
    if (!stunRodDef) {
        throw new Error("FAIL: weapon.stun_rod definition is missing!");
    }
    console.log("✅ weapon.stun_rod is defined. Rarity:", stunRodDef.rarity);
    if (!stunRodDef.noLoot) {
        throw new Error("FAIL: weapon.stun_rod should have noLoot: true!");
    }
    console.log("✅ weapon.stun_rod has noLoot: true.");
    if (stunRodDef.width !== 4 || stunRodDef.height !== 2) {
        throw new Error(`FAIL: weapon.stun_rod should be 4x2, got ${stunRodDef.width}x${stunRodDef.height}`);
    }
    console.log("✅ weapon.stun_rod size is 4x2.");
    
    // Check attachment slot category restriction
    const batterySlot = stunRodDef.attachmentSlots?.find(s => s.id === 'battery');
    if (!batterySlot || !batterySlot.allowedCategories.includes('large_battery')) {
        throw new Error("FAIL: weapon.stun_rod battery slot must restrict to 'large_battery' category!");
    }
    console.log("✅ weapon.stun_rod restricts slot to large_battery category.");

    // --- 2. Verify Crafting Recipe Lock/Unlock ---
    console.log("\n--- Testing crafting recipe lock/unlock ---");
    const recipe = CraftingRecipes.find(r => r.id === 'weapon.stun_rod');
    if (!recipe) {
        throw new Error("FAIL: weapon.stun_rod recipe is missing!");
    }
    console.log("✅ weapon.stun_rod recipe found. Required Book:", recipe.requiredBook);

    // Initial check
    const initialCheck = engine.inventoryManager.craftingManager.checkRequirements('weapon.stun_rod', player.ap, player.craftingLvl);
    if (initialCheck.canCraft !== false || !initialCheck.missing.includes('Recipe Locked')) {
        throw new Error("FAIL: Stun rod recipe should be locked initially!");
    }
    console.log("✅ Recipe is locked correctly.");

    // Simulate book reading
    console.log("Simulating reading Nomad Survivor Vol 7...");
    const stats = engine.bookStats['book.nomad_survivor_7'];
    if (!stats) {
        throw new Error("FAIL: book.nomad_survivor_7 stats not found in engine.bookStats!");
    }
    stats.pagesLeft = 0; // Fully read

    // Recipe check after reading
    const afterCheck = engine.inventoryManager.craftingManager.checkRequirements('weapon.stun_rod', player.ap, player.craftingLvl);
    if (afterCheck.missing.includes('Recipe Locked')) {
        throw new Error("FAIL: Recipe is still locked after reading the book!");
    }
    if (!afterCheck.missing.includes('Pliers')) {
        throw new Error("FAIL: Recipe should report 'Pliers' tool is missing!");
    }
    console.log("✅ Recipe reports Pliers tool missing correctly.");
    console.log("✅ Recipe is unlocked correctly after reading book.");

    // --- 3. Verify Stunned Condition AP Suppression & Turn Progression ---
    console.log("\n--- Testing Stunned Condition AP limits and turns ---");
    const zombie = new Zombie('zombie-1', 1, 1, 'basic');
    const npc = new NPC('npc-1', 'Survivor', 2, 2, false);

    // Initial check
    if (zombie.stunnedTurns !== 0 || npc.stunnedTurns !== 0) {
        throw new Error("FAIL: Entities should not start stunned!");
    }
    console.log("✅ Entities start with stunnedTurns = 0.");

    // Turn start checks when not stunned
    zombie.startTurn();
    npc.startTurn();
    console.log(`zombie AP on turn start (not stunned): ${zombie.currentAP}`);
    console.log(`npc AP on turn start (not stunned): ${npc.ap}`);
    if (zombie.currentAP !== zombie.maxAP || npc.ap !== npc.maxAp) {
        throw new Error("FAIL: Normal turn start AP should be maxAP!");
    }
    console.log("✅ Normal turn start AP matches max values.");

    // Apply Stun
    zombie.stunnedTurns = 2;
    npc.stunnedTurns = 1;

    // Check serialization/deserialization
    console.log("Testing Zombie serialization with stun...");
    const zombieJSON = zombie.toJSON();
    if (zombieJSON.stunnedTurns !== 2) {
        throw new Error(`FAIL: Serialized Zombie stunnedTurns should be 2, got ${zombieJSON.stunnedTurns}`);
    }
    const restoredZombie = Zombie.fromJSON(zombieJSON);
    if (restoredZombie.stunnedTurns !== 2) {
        throw new Error(`FAIL: Deserialized Zombie stunnedTurns should be 2, got ${restoredZombie.stunnedTurns}`);
    }
    console.log("✅ Zombie serialization of stunnedTurns matches.");

    console.log("Testing NPC serialization with stun...");
    const npcJSON = npc.toJSON();
    if (npcJSON.stunnedTurns !== 1) {
        throw new Error(`FAIL: Serialized NPC stunnedTurns should be 1, got ${npcJSON.stunnedTurns}`);
    }
    const restoredNPC = NPC.fromJSON(npcJSON);
    if (restoredNPC.stunnedTurns !== 1) {
        throw new Error(`FAIL: Deserialized NPC stunnedTurns should be 1, got ${restoredNPC.stunnedTurns}`);
    }
    console.log("✅ NPC serialization of stunnedTurns matches.");

    // Turn start check when stunned (should get 0 AP)
    zombie.startTurn();
    npc.startTurn();
    console.log(`zombie AP on turn start (STUNNED): ${zombie.currentAP}`);
    console.log(`npc AP on turn start (STUNNED): ${npc.ap}`);
    if (zombie.currentAP !== 0 || npc.ap !== 0) {
        throw new Error("FAIL: Stunned entities must start turn with 0 AP!");
    }
    console.log("✅ Stunned entities get 0 AP on startTurn.");

    // Turn end check (should decrement stunnedTurns)
    zombie.endTurn();
    npc.endTurn();
    console.log(`zombie stunnedTurns after turn end: ${zombie.stunnedTurns}`);
    console.log(`npc stunnedTurns after turn end: ${npc.stunnedTurns}`);
    if (zombie.stunnedTurns !== 1 || npc.stunnedTurns !== 0) {
        throw new Error("FAIL: stunnedTurns decrementing logic failed!");
    }
    console.log("✅ stunnedTurns decrements properly at endTurn.");

    // Start turn again for NPC (stunnedTurns was 0 now, should get full AP)
    npc.startTurn();
    console.log(`npc AP after stun wears off: ${npc.ap}`);
    if (npc.ap !== npc.maxAp) {
        throw new Error("FAIL: NPC should regain full AP once stun wears off!");
    }
    console.log("✅ NPC regains full AP once stun wears off.");

    // --- 4. Verify Combat Attack Integration ---
    console.log("\n--- Testing Combat Attack Math Simulation ---");
    // Instantiate Stun Rod item
    const stunRod = new Item({
        id: 'weapon.stun_rod',
        defId: 'weapon.stun_rod'
    });
    // Attach battery mock
    const largeBattery = new Item({
        id: 'tool.large_battery',
        defId: 'tool.large_battery'
    });
    largeBattery.ammoCount = 100;
    stunRod.attachments['battery'] = largeBattery;

    // Simulate performMeleeAttack logic
    function mockPerformMeleeAttack(weapon, targetEntity) {
        let isStunRodActive = false;
        if (weapon && weapon.defId === 'weapon.stun_rod') {
            const battery = typeof weapon.getBattery === 'function' ? weapon.getBattery() : null;
            if (battery && battery.ammoCount > 0) {
                isStunRodActive = true;
                battery.ammoCount = Math.max(0, battery.ammoCount - 1);
            }
        }

        const combatDef = ItemDefs[weapon.defId]?.combat || {};
        // Simulate hit
        const hit = true;
        
        let baseDamage = Math.floor(Math.random() * (combatDef.damage.max - combatDef.damage.min + 1)) + combatDef.damage.min;
        let damage = baseDamage;
        let extraDamageApplied = 0;
        let stunApplied = false;
        let stunDuration = 0;

        if (hit && isStunRodActive && targetEntity) {
            extraDamageApplied = Math.floor(Math.random() * 5) + 1;
            damage += extraDamageApplied;
            stunDuration = Math.floor(Math.random() * 3) + 1;
            targetEntity.stunnedTurns = stunDuration;
            stunApplied = true;
        }

        return { hit, damage, extraDamageApplied, stunApplied, stunDuration };
    }

    console.log("Simulating attack with fully charged Stun rod...");
    console.log(`Battery charge before attack: ${largeBattery.ammoCount}`);
    const target = new Zombie('zombie-2', 3, 3, 'basic');
    const attack1 = mockPerformMeleeAttack(stunRod, target);
    console.log("Attack Result:", attack1);
    console.log(`Battery charge after attack: ${largeBattery.ammoCount}`);

    if (largeBattery.ammoCount !== 99) {
        throw new Error(`FAIL: Battery charge should be 99, got ${largeBattery.ammoCount}`);
    }
    console.log("✅ Battery charge decreased by 1.");
    if (!attack1.stunApplied || attack1.extraDamageApplied < 1 || attack1.extraDamageApplied > 5) {
        throw new Error("FAIL: Charged strike should apply stun and 1-5 extra damage!");
    }
    console.log(`✅ Stun applied successfully. Target stunnedTurns: ${target.stunnedTurns}`);
    if (target.stunnedTurns < 1 || target.stunnedTurns > 3) {
        throw new Error(`FAIL: Target stunnedTurns should be between 1 and 3, got ${target.stunnedTurns}`);
    }
    console.log("✅ Stun duration falls in range [1, 3] turns.");

    // Attack again when battery is empty
    largeBattery.ammoCount = 0;
    console.log("\nSimulating attack with uncharged Stun rod (0 battery charge)...");
    const target2 = new Zombie('zombie-3', 4, 4, 'basic');
    const attack2 = mockPerformMeleeAttack(stunRod, target2);
    console.log("Attack Result:", attack2);
    if (largeBattery.ammoCount !== 0) {
        throw new Error("FAIL: Battery charge should remain 0!");
    }
    console.log("✅ Battery charge remains 0.");
    if (attack2.stunApplied || attack2.extraDamageApplied !== 0 || target2.stunnedTurns !== 0) {
        throw new Error("FAIL: Uncharged strike should not stun or deal extra damage!");
    }
    console.log("✅ Uncharged strike has no stun/extra damage.");

    console.log("\n=== ALL TESTS PASSED SUCCESSFULLY ===");
}

try {
    runTest();
} catch (error) {
    console.error("Test failed with error:", error);
    process.exit(1);
}
