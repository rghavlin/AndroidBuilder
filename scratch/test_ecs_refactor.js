import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { Entity } from '../client/src/game/entities/Entity.js';

async function testECSRefactor() {
  console.log("--- Testing ECS Refactor Completion ---");

  // 1. Create a Player and verify components are attached
  console.log("1. Creating player...");
  const player = EntityFactory.createPlayer(5, 5);
  console.log("Player name:", player.name);
  console.log("Player type:", player.type);

  // Check components
  const hasAP = player.hasComponent('ActionPoints');
  const hasSurvival = player.hasComponent('SurvivalStats');
  const hasSkills = player.hasComponent('PlayerSkills');
  console.log("Has ActionPoints Component:", hasAP);
  console.log("Has SurvivalStats Component:", hasSurvival);
  console.log("Has PlayerSkills Component:", hasSkills);

  if (!hasAP || !hasSurvival || !hasSkills) {
    throw new Error("Missing expected components on Player!");
  }

  // 2. Test AP functionality via facade
  console.log("\n2. Testing Action Points...");
  console.log("Initial AP:", player.ap); // 20
  console.log("Initial currentAP:", player.currentAP); // 20
  console.log("Initial maxAp:", player.maxAp); // 20
  console.log("Initial maxAP:", player.maxAP); // 20

  const used = player.useAP(5);
  console.log("Used 5 AP:", used, "| New AP:", player.ap, "| New currentAP:", player.currentAP);
  if (player.ap !== 15) throw new Error("AP depletion failed!");

  player.restoreAP(2);
  console.log("Restored 2 AP | New AP:", player.ap);
  if (player.ap !== 17) throw new Error("AP restoration failed!");

  // Try to use more AP than available
  const usedTooMuch = player.useAP(20);
  console.log("Try to use 20 AP (should be false):", usedTooMuch, "| Current AP:", player.ap);
  if (usedTooMuch) throw new Error("Used more AP than available!");

  // 3. Test Survival Stats via facade
  console.log("\n3. Testing Survival Stats...");
  console.log("Nutrition:", player.nutrition, "| isStarving:", player.isStarving);
  player.nutrition = 0;
  console.log("Nutrition set to 0 | isStarving:", player.isStarving);
  if (!player.isStarving) throw new Error("isStarving should be true!");

  player.nutrition = 10;
  console.log("Nutrition set to 10 | isStarving:", player.isStarving);
  if (player.isStarving) throw new Error("isStarving should be false!");

  console.log("Hydration:", player.hydration, "| isDehydrated:", player.isDehydrated);
  player.hydration = 0;
  console.log("Hydration set to 0 | isDehydrated:", player.isDehydrated);
  if (!player.isDehydrated) throw new Error("isDehydrated should be true!");

  console.log("Condition:", player.condition);
  player.isBleeding = true;
  console.log("isBleeding set to true | Condition:", player.condition);
  if (player.condition !== 'Bleeding') throw new Error("Condition should be 'Bleeding'!");

  player.isBleeding = false;
  player.sickness = 5;
  console.log("Sickness set to 5 | Condition:", player.condition);
  if (player.condition !== 'Diseased') throw new Error("Condition should be 'Diseased'!");

  player.cure();
  console.log("Cured | Sickness:", player.sickness, "| Condition:", player.condition);
  if (player.sickness !== 0 || player.condition !== 'Normal') throw new Error("Cure failed!");

  // 4. Test Player Skills via facade
  console.log("\n4. Testing Player Skills & Levels...");
  console.log("Melee level:", player.meleeLvl, "| Melee kills:", player.meleeKills);
  const killResult = player.recordKill('melee');
  console.log("Recorded melee kill. Level up returned:", killResult, "| New melee level:", player.meleeLvl, "| Melee kills:", player.meleeKills);

  // Level up threshold for level 0 is 5 * 2^0 = 5 kills. Let's record 4 more kills
  player.recordKill('melee');
  player.recordKill('melee');
  player.recordKill('melee');
  const levelUp = player.recordKill('melee');
  console.log("Recorded 4 more kills. Level up returned:", levelUp, "| New melee level:", player.meleeLvl, "| Melee kills:", player.meleeKills);
  if (player.meleeLvl !== 1) throw new Error("Melee level up failed!");

  // 5. Test JSON serialization / deserialization
  console.log("\n5. Testing Serialization / Deserialization...");
  const serialized = player.toJSON();
  console.log("Serialized JSON representation check: ActionPoints, SurvivalStats, PlayerSkills exist in components.");
  console.log("components in JSON:", Object.keys(serialized.components));

  const deserialized = Entity.fromJSON(serialized);
  console.log("Deserialized AP:", deserialized.ap, "| Max AP:", deserialized.maxAp);
  console.log("Deserialized Nutrition:", deserialized.nutrition, "| Bleeding:", deserialized.isBleeding);
  console.log("Deserialized Melee Level:", deserialized.meleeLvl, "| Melee Kills:", deserialized.meleeKills);

  if (deserialized.ap !== player.ap || deserialized.meleeLvl !== player.meleeLvl || deserialized.nutrition !== player.nutrition) {
    throw new Error("Serialization mismatch!");
  }

  // 6. Test Zombie creation with ActionPoints
  console.log("\n6. Testing Zombie creation...");
  const zombie = EntityFactory.createZombie(2, 2, 'basic');
  console.log("Zombie name:", zombie.name);
  console.log("Zombie AP:", zombie.ap, "| Max AP:", zombie.maxAp);
  if (!zombie.hasComponent('ActionPoints')) {
    throw new Error("Zombie should have ActionPoints component!");
  }

  console.log("\n--- All ECS Refactor Tests Passed! ---");
}

testECSRefactor().catch(e => {
  console.error("Test failed:", e);
  process.exit(1);
});
