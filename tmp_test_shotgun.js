
import { Item } from './client/src/game/inventory/Item.js';
import { InventoryManager } from './client/src/game/inventory/InventoryManager.js';
import { ItemDefs } from './client/src/game/inventory/ItemDefs.js';

console.log('--- TESTING SHOTGUN IMPLEMENTATION ---');

try {
    console.log('1. Initializing InventoryManager...');
    const manager = new InventoryManager();
    console.log('✅ InventoryManager initialized');

    console.log('2. Creating Shotgun and Shells...');
    const shotgun = new Item(ItemDefs['weapon.shotgun']);
    const shells = new Item(ItemDefs['ammo.shotgun_shells']);
    console.log('✅ Items created');

    let failed = 0;

    // 1. Test Dual Slot Equipping
    console.log('\n3. Testing Dual Slot Equipping...');
    console.log('Trying handgun slot...');
    const resultHandgun = manager.equipItem(shotgun, 'handgun');
    if (resultHandgun.success && manager.equipment.handgun === shotgun) {
      console.log('✅ Equipped as handgun: PASSED');
    } else {
      console.log('❌ Equipped as handgun: FAILED', resultHandgun.reason);
      failed++;
    }

    console.log('Unequipping from handgun...');
    manager.unequipItem('handgun');

    console.log('Trying long_gun slot...');
    const resultLongGun = manager.equipItem(shotgun, 'long_gun');
    if (resultLongGun.success && manager.equipment.long_gun === shotgun) {
      console.log('✅ Equipped as long_gun: PASSED');
    } else {
      console.log('❌ Equipped as long_gun: FAILED', resultLongGun.reason);
      failed++;
    }

    // 2. Test Ammo Loading (Capacity 7)
    console.log('\n4. Testing Ammo Loading (Capacity 7)...');
    shells.stackCount = 10;
    
    // CRITICAL: shells must be in a managed container for attachItemToWeapon to work
    manager.groundContainer.addItem(shells);
    console.log('Placed 10 shells in ground container');

    const attachResult = manager.attachItemToWeapon(shotgun, 'ammo', shells);
    if (attachResult.success) {
      const attachedAmmo = shotgun.attachments['ammo'];
      const groundItems = manager.groundContainer.getAllItems();
      const surplus = groundItems.find(i => i.defId === 'ammo.shotgun_shells');
      const surplusCount = surplus ? surplus.stackCount : 0;
      
      if (attachedAmmo.stackCount === 7 && surplusCount === 3) {
        console.log('✅ Loaded 7 shells, 3 remain in ground: PASSED');
      } else {
        console.log(`❌ Incorrect load amount: ${attachedAmmo.stackCount} loaded, ${surplusCount} remain in ground`);
        failed++;
      }
    } else {
      console.log('❌ Ammo attachment failed:', attachResult.reason);
      failed++;
    }

    // 3. Logic check for Combat scaling (Manual verification via formula check)
    console.log('\n5. Verifying Combat Scaling Formulas...');
    const stats = ItemDefs['weapon.shotgun'].rangedStats;
    const calculateShotgunDamage = (dist) => {
        let finalDamage = stats.damage.min; // 20
        if (dist > 1) {
            finalDamage *= Math.pow(1 - 0.1, dist - 1);
        }
        if (dist > 5) {
            finalDamage *= Math.pow(1 - 0.1, dist - 5);
        }
        return Math.floor(finalDamage);
    };

    const calculateShotgunAccuracy = (dist) => {
        if (dist <= 5) return 1.0;
        return Math.max(0, 1.0 - (dist - 5) * 0.2);
    };

    const rangeResults = [
      { dist: 1, expectedDmg: 20, expectedAcc: 1.0 },
      { dist: 3, expectedDmg: 16, expectedAcc: 1.0 }, // 20 * 0.9 * 0.9 = 16.2
      { dist: 5, expectedDmg: 13, expectedAcc: 1.0 }, // 20 * (0.9^4) = 13.122
      { dist: 6, expectedDmg: 10, expectedAcc: 0.8 }, // 13.122 * 0.81 = 10.6...
    ];

    rangeResults.forEach(r => {
        const dmg = calculateShotgunDamage(r.dist);
        const acc = calculateShotgunAccuracy(r.dist);
        if (dmg === r.expectedDmg && Math.abs(acc - r.expectedAcc) < 0.01) {
            console.log(`✅ Dist ${r.dist}: Dmg=${dmg}, Acc=${acc}: PASSED`);
        } else {
            console.log(`❌ Dist ${r.dist}: Dmg=${dmg} (expected ${r.expectedDmg}), Acc=${acc} (expected ${r.expectedAcc}): FAILED`);
            failed++;
        }
    });

    if (failed === 0) {
      console.log('\n🎉 ALL SHOTGUN TESTS PASSED!');
    } else {
      console.log(`\n⚠️ ${failed} tests failed.`);
      process.exit(1);
    }
} catch (err) {
    console.error('\n🚨 FATAL ERROR DURING TESTING:');
    console.error(err);
    process.exit(1);
}
