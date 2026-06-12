import { GameMap } from '../client/src/game/map/GameMap.js';
import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { VisionSystem } from '../client/src/game/systems/VisionSystem.js';
import { AISystem } from '../client/src/game/systems/AISystem.js';
import { Pathfinding } from '../client/src/game/utils/Pathfinding.js';
import { IntentQueue } from '../client/src/game/managers/IntentQueue.js';
import { SimulationManager } from '../client/src/game/managers/SimulationManager.js';
import { Vision } from '../client/src/game/components/Vision.js';
import { AIBehavior } from '../client/src/game/components/AIBehavior.js';
import { MoveIntent } from '../client/src/game/components/MoveIntent.js';
import { DamageIntent } from '../client/src/game/components/DamageIntent.js';

console.log("🧪 Starting Phase 2: Emergent Reaction Layer Verification...");

try {
  // =========================================================================
  // TEST 1: stateless Vision System, Bresenham LoS, transparent windows vs closed doors
  // =========================================================================
  console.log("\n--- Test 1: Vision System & LoS Blocking Rules ---");
  const map1 = new GameMap(10, 10);
  const player1 = EntityFactory.createPlayer(2, 2);
  const zombie1 = EntityFactory.createZombie(8, 2, 'basic');
  
  map1.addEntity(player1, 2, 2);
  map1.addEntity(zombie1, 8, 2);

  const entities1 = [player1, zombie1];
  const engine1 = { gameMap: map1, _uiDirty: false };

  // Vision component added by factory
  const z1Vision = zombie1.getComponent('Vision');
  console.log("Zombie sight range:", z1Vision.range);

  // Initial recalculation
  VisionSystem.process(entities1, null, engine1);
  console.log("Zombie visible entities:", z1Vision.visibleEntities);
  if (!z1Vision.visibleEntities.includes(player1.id)) {
    throw new Error("Zombie should see player on a clear flat map");
  }

  // Caching check: _visionDirty should be false after calculation
  console.log("Is _visionDirty false after process?", z1Vision._visionDirty === false);
  if (z1Vision._visionDirty !== false) {
    throw new Error("Vision system did not reset _visionDirty flag");
  }

  // Clear visible entities, check caching prevents recalculation
  z1Vision.visibleEntities = [];
  VisionSystem.process(entities1, null, engine1);
  console.log("With _visionDirty false, recalculation skipped?", z1Vision.visibleEntities.length === 0);
  if (z1Vision.visibleEntities.length !== 0) {
    throw new Error("Vision system recalculated even when _visionDirty was false");
  }

  // Move coordinate - should set dirty
  zombie1.moveTo(8, 3);
  console.log("Is _visionDirty true after moveTo?", z1Vision._visionDirty === true);
  if (z1Vision._visionDirty !== true) {
    throw new Error("moveTo did not dirty the vision flag");
  }

  // Test LoS blocked by wall terrain
  map1.setTerrain(5, 3, 'wall');
  VisionSystem.process(entities1, null, engine1);
  const canSeeThroughWall = z1Vision.visibleEntities.includes(player1.id);
  console.log("Can zombie see player through wall?", canSeeThroughWall);
  if (canSeeThroughWall) {
    throw new Error("Vision passed through solid wall terrain!");
  }

  // Test LoS blocked by closed door
  map1.setTerrain(5, 3, 'grass'); // remove wall
  const door = {
    id: 'door-1',
    type: 'door',
    isOpen: false,
    isBroken: false,
    x: 5,
    y: 3,
    blocksMovement: true,
    blocksSight: true,
    toJSON() { return { id: this.id }; }
  };
  map1.addEntity(door, 5, 3);
  z1Vision._visionDirty = true;
  VisionSystem.process(entities1, null, engine1);
  const canSeeThroughClosedDoor = z1Vision.visibleEntities.includes(player1.id);
  console.log("Can zombie see player through closed door?", canSeeThroughClosedDoor);
  if (canSeeThroughClosedDoor) {
    throw new Error("Vision passed through closed door!");
  }

  // Test LoS open door
  door.isOpen = true;
  door.blocksSight = false;
  z1Vision._visionDirty = true;
  VisionSystem.process(entities1, null, engine1);
  const canSeeThroughOpenDoor = z1Vision.visibleEntities.includes(player1.id);
  console.log("Can zombie see player through open door?", canSeeThroughOpenDoor);
  if (!canSeeThroughOpenDoor) {
    throw new Error("Vision blocked by open door!");
  }

  // Test LoS window
  door.isOpen = false; // block with door again
  door.blocksSight = true;
  map1.removeEntity('door-1');
  const windowEntity = {
    id: 'window-1',
    type: 'window',
    isOpen: false,
    isBroken: false,
    x: 5,
    y: 3,
    blocksMovement: true,
    blocksSight: false,
    toJSON() { return { id: this.id }; }
  };
  map1.addEntity(windowEntity, 5, 3);
  z1Vision._visionDirty = true;
  VisionSystem.process(entities1, null, engine1);
  const canSeeThroughClosedWindow = z1Vision.visibleEntities.includes(player1.id);
  console.log("Can zombie see player through closed window?", canSeeThroughClosedWindow);
  if (!canSeeThroughClosedWindow) {
    throw new Error("Vision blocked by transparent window!");
  }

  console.log("✅ TEST 1 PASSED!");

  // =========================================================================
  // TEST 2: AI State Machine and memory tracking transitions
  // =========================================================================
  console.log("\n--- Test 2: AI Memory Transitions & Direct Intent Queuing ---");
  const map2 = new GameMap(20, 20);
  const player2 = EntityFactory.createPlayer(2, 2);
  const zombie2 = EntityFactory.createZombie(5, 2, 'basic');
  
  map2.addEntity(player2, 2, 2);
  map2.addEntity(zombie2, 5, 2);

  const entities2 = [player2, zombie2];
  const engine2 = { gameMap: map2, _uiDirty: false, worldManager: null };
  const actionQueue2 = [];
  const intentQueue2 = new IntentQueue();

  const z2AI = zombie2.getComponent('AIBehavior');
  const z2Vision = zombie2.getComponent('Vision');
  console.log("Initial state:", z2AI.alertnessState); // Should be IDLE

  // Step 1: Run AI with player in LoS -> state becomes HUNTING
  VisionSystem.process(entities2, null, engine2);
  const generated1 = AISystem.process(entities2, null, engine2, actionQueue2, intentQueue2);
  console.log("Intents generated (Hunting):", generated1);
  console.log("New alertnessState:", z2AI.alertnessState);
  console.log("lastSeenPlayerCoords:", z2AI.lastSeenPlayerCoords);
  if (z2AI.alertnessState !== 'HUNTING' || !z2AI.lastSeenPlayerCoords) {
    throw new Error("Zombie did not transition to HUNTING when player visible");
  }

  // Step 2: Move player far away out of sight -> state becomes INVESTIGATING last seen
  map2.moveEntity(player2.id, 18, 18);
  z2Vision._visionDirty = true;
  VisionSystem.process(entities2, null, engine2);
  console.log("Can zombie see player now?", z2Vision.visibleEntities.includes(player2.id));

  // Run AI again
  const generated2 = AISystem.process(entities2, null, engine2, actionQueue2, intentQueue2);
  console.log("Intents generated (Investigating):", generated2);
  console.log("New alertnessState:", z2AI.alertnessState);
  console.log("Cached path length in AIBehavior:", z2AI.currentPath.length);
  if (z2AI.alertnessState !== 'INVESTIGATING' || z2AI.currentPath.length === 0) {
    throw new Error("Zombie did not transition to INVESTIGATING or cache path");
  }

  // Step 3: Verify subsequent cycles pop steps off path cache instead of recalculating
  const pathBefore = [...z2AI.currentPath];
  const generated3 = AISystem.process(entities2, null, engine2, actionQueue2, intentQueue2);
  console.log("Intents generated (popping path step):", generated3);
  console.log("Path after pop:", z2AI.currentPath.length, "vs before:", pathBefore.length);
  if (z2AI.currentPath.length !== pathBefore.length - 1) {
    throw new Error("AISystem did not shift step off currentPath cache");
  }

  console.log("✅ TEST 2 PASSED!");

  // =========================================================================
  // TEST 3: Path Caching Invalidation
  // =========================================================================
  console.log("\n--- Test 3: Path Invalidation ---");
  const nextStep = z2AI.currentPath[1];
  console.log("Next planned step coordinate:", nextStep);

  // Block the next step with a wall
  map2.setTerrain(nextStep.x, nextStep.y, 'wall');

  // AISystem should notice block, dump cached path, and recalculate A* path
  const oldPathLength = z2AI.currentPath.length;
  AISystem.process(entities2, null, engine2, actionQueue2, intentQueue2);
  console.log("New path calculated due to blockage?", z2AI.currentPath.length > 0);
  console.log("Is it a different path?", z2AI.currentPath[1]?.x !== nextStep.x || z2AI.currentPath[1]?.y !== nextStep.y);
  
  if (z2AI.currentPath.length === oldPathLength && z2AI.currentPath[1]?.x === nextStep.x && z2AI.currentPath[1]?.y === nextStep.y) {
    throw new Error("AI did not invalidate blocked path");
  }

  console.log("✅ TEST 3 PASSED!");

  // =========================================================================
  // TEST 4: Chunk Border Pathfinding Clamping
  // =========================================================================
  console.log("\n--- Test 4: Chunk Border Safety & Path Clamping ---");
  const map4 = new GameMap(10, 10);
  const zombie4 = EntityFactory.createZombie(2, 2, 'basic');
  map4.addEntity(zombie4, 2, 2);

  // Path to an inactive chunk (outside 10x10 bounds)
  const outOfBoundsTargetX = 15;
  const outOfBoundsTargetY = 15;

  console.log(`Pathfinding from (2, 2) to out-of-bounds target (${outOfBoundsTargetX}, ${outOfBoundsTargetY})...`);
  const path = Pathfinding.findPath(map4, 2, 2, outOfBoundsTargetX, outOfBoundsTargetY, { entity: zombie4, isZombie: true });
  
  console.log("Path calculated successfully without crashing. Path length:", path.length);
  if (path.length === 0) {
    throw new Error("Clamped border pathfinding returned empty path");
  }

  const finalStep = path[path.length - 1];
  console.log("Final path destination coordinate:", finalStep);
  if (finalStep.x >= 10 || finalStep.y >= 10) {
    throw new Error(`Path target should have been clamped to border (max 9, 9), but got (${finalStep.x}, ${finalStep.y})`);
  }

  console.log("✅ TEST 4 PASSED!");

  console.log("\n🎉 ALL PHASE 2 VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉");
} catch (error) {
  console.error("\n❌ Verification failed with error:", error);
  process.exit(1);
}
