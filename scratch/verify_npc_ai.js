import { GameMap } from '../client/src/game/map/GameMap.js';
import { NPC } from '../client/src/game/entities/NPC.js';
import { Zombie } from '../client/src/game/entities/Zombie.js';
import { NPCAI } from '../client/src/game/ai/NPCAI.js';
import { Door } from '../client/src/game/entities/Door.js';
import { Window } from '../client/src/game/entities/Window.js';
import engine from '../client/src/game/GameEngine.js';
import { Pathfinding } from '../client/src/game/utils/Pathfinding.js';

console.log('--- STARTING NPC AI VERIFICATION TESTS ---');

let testResults = [];

function runTest(testName, testFn) {
  try {
    testFn();
    testResults.push(`   ${testName}: PASSED`);
    console.log(`✅ ${testName}: PASSED`);
  } catch (error) {
    testResults.push(`❌ ${testName}: FAILED - ${error.message}`);
    console.error(`❌ ${testName}: FAILED`, error);
  }
}

// Case 1: NPC spawns and moves South using path caching
runTest('NPC Travel South and Path Caching', () => {
  const gameMap = new GameMap(10, 20);
  
  // Set bottom edge tile (5, 19) to transition.
  gameMap.setTerrain(5, 19, 'transition');
  
  const npc = new NPC('npc-traveler', 'Bob', 5, 2);
  gameMap.addEntity(npc, 5, 2);
  
  // Player at (1, 1) far away
  const player = { logicalX: 1, logicalY: 1, x: 1, y: 1 };
  
  // Run first turn. This should find the exit at (5, 19) and cache the path.
  npc.startTurn();
  npc.ap = 2; // Only 2 moves to prevent exiting immediately
  const turnResult1 = NPCAI.executeNPCTurn(npc, gameMap, player, []);
  
  if (!npc.goalTarget) {
    throw new Error('NPC failed to set goalTarget');
  }
  if (npc.goalTarget.x !== 5 || npc.goalTarget.y !== 19) {
    throw new Error(`Expected goalTarget at (5, 19), got (${npc.goalTarget.x}, ${npc.goalTarget.y})`);
  }
  if (!npc.currentPath || npc.currentPath.length === 0) {
    throw new Error('NPC failed to cache path');
  }
  
  console.log(`   - Path cached: length ${npc.currentPath.length}. Initial step towards exit.`);
  
  // Restore AP and run more steps to verify it pops from cache
  const cachedLengthBefore = npc.currentPath.length;
  npc.startTurn();
  npc.ap = 1;
  NPCAI.executeNPCTurn(npc, gameMap, player, []);
  
  if (npc.currentPath.length !== cachedLengthBefore - 1) {
    throw new Error(`Expected currentPath length to decrease by 1, got ${npc.currentPath.length}`);
  }
  console.log('   - Cache popping verified successfully.');
});

// Case 2: NPC avoids/flees from zombies using influence vectors
runTest('Zombie Avoidance with Influence Vectors', () => {
  const gameMap = new GameMap(15, 15);
  const npc = new NPC('npc-flee', 'Fleeing Bob', 7, 7);
  gameMap.addEntity(npc, 7, 7);
  
  // Place zombie at (7, 9) - south of NPC
  const zombie = new Zombie('zombie-threat', 7, 9, 'basic');
  gameMap.addEntity(zombie, 7, 9);
  
  const player = { logicalX: 0, logicalY: 0, x: 0, y: 0 };
  
  npc.startTurn();
  const result = NPCAI.executeNPCTurn(npc, gameMap, player, [zombie]);
  
  // NPC should have moved North (y coordinate decreases)
  if (npc.logicalY >= 7) {
    throw new Error(`NPC failed to flee North. Current position: (${npc.logicalX}, ${npc.logicalY})`);
  }
  console.log(`   - Flee success: NPC moved from (7, 7) to (${npc.logicalX}, ${npc.logicalY})`);
});

// Case 3: Structure interaction (opening/climbing doors and windows) with AP costs
runTest('Structure Interaction and AP Costs', () => {
  const gameMap = new GameMap(10, 10);
  const player = { logicalX: 0, logicalY: 0, x: 0, y: 0 };
  
  // Test 1: Unlocked door toggle (1 AP)
  {
    const npc = new NPC('npc-door-open', 'Bob Door', 5, 2);
    gameMap.addEntity(npc, 5, 2);
    
    // South exit at (5, 9)
    gameMap.setTerrain(5, 9, 'transition');
    
    // Closed unlocked door at (5, 3)
    const door = new Door('door-unlocked', 5, 3, false, false);
    gameMap.addEntity(door, 5, 3);
    
    // Block sides to force going through door
    gameMap.setTerrain(4, 2, 'wall');
    gameMap.setTerrain(6, 2, 'wall');
    gameMap.setTerrain(4, 3, 'wall');
    gameMap.setTerrain(6, 3, 'wall');
    
    npc.startTurn();
    npc.ap = 2; // 1 AP open + 1 AP move
    NPCAI.executeNPCTurn(npc, gameMap, player, []);
    
    if (!door.isOpen) {
      throw new Error('NPC failed to open the unlocked door');
    }
    console.log(`   - Unlocked door opened successfully. NPC AP remaining: ${npc.ap}`);
    
    // Cleanup
    gameMap.removeEntity(npc.id);
    gameMap.removeEntity(door.id);
    gameMap.setTerrain(4, 2, 'grass');
    gameMap.setTerrain(6, 2, 'grass');
    gameMap.setTerrain(4, 3, 'grass');
    gameMap.setTerrain(6, 3, 'grass');
  }

  // Test 2: Locked window smash (2 AP)
  {
    const npc = new NPC('npc-window-smash', 'Bob Window', 5, 2);
    gameMap.addEntity(npc, 5, 2);
    
    // South exit at (5, 9)
    gameMap.setTerrain(5, 9, 'transition');
    
    // Closed locked window at (5, 3)
    const window = new Window('window-locked', 5, 3, true, false);
    gameMap.addEntity(window, 5, 3);
    
    // Block sides
    gameMap.setTerrain(4, 2, 'wall');
    gameMap.setTerrain(6, 2, 'wall');
    gameMap.setTerrain(4, 3, 'wall');
    gameMap.setTerrain(6, 3, 'wall');
    
    npc.startTurn();
    npc.ap = 2; // Only enough to smash (2 AP), not enough to climb (requires another 2 AP)
    NPCAI.executeNPCTurn(npc, gameMap, player, []);
    
    if (!window.isBroken) {
      throw new Error('NPC failed to smash the locked window');
    }
    if (npc.logicalX !== 5 || npc.logicalY !== 2) {
      throw new Error(`Expected NPC to remain at (5, 2) after breaking window, but moved to (${npc.logicalX}, ${npc.logicalY})`);
    }
    console.log(`   - Locked window smashed successfully. NPC AP remaining: ${npc.ap}`);
    
    // Cleanup
    gameMap.removeEntity(npc.id);
    gameMap.removeEntity(window.id);
    gameMap.setTerrain(4, 2, 'grass');
    gameMap.setTerrain(6, 2, 'grass');
    gameMap.setTerrain(4, 3, 'grass');
    gameMap.setTerrain(6, 3, 'grass');
  }
});

// Case 4: Safety look-ahead check (sufficient AP check near zombies)
runTest('AP Economy and Safety Look-Ahead Check', () => {
  const gameMap = new GameMap(10, 10);
  const player = { logicalX: 0, logicalY: 0, x: 0, y: 0 };
  
  const npc = new NPC('npc-safety', 'Bob Safety', 5, 2);
  gameMap.addEntity(npc, 5, 2);
  
  const door = new Door('door-locked-safety', 5, 3, true, false);
  gameMap.addEntity(door, 5, 3);
  
  const zombie = new Zombie('zombie-threat-safety', 4, 2, 'basic');
  gameMap.addEntity(zombie, 4, 2);
  
  npc.startTurn();
  npc.ap = 1; // set AP to 1
  
  NPCAI.executeNPCTurn(npc, gameMap, player, [zombie]);
  
  if (door.isOpen || door.hp < door.maxHp) {
    throw new Error('NPC interacted with the door despite insufficient AP and zombie nearby!');
  }
  console.log(`   - Safety check passed: NPC did not interact with door due to low AP and zombie proximity.`);
});

// Case 5: Noise investigation and prevent looping via blacklist
runTest('Noise Investigation and Loop Prevention', () => {
  const gameMap = new GameMap(10, 10);
  const player = { logicalX: 0, logicalY: 0, x: 0, y: 0 };
  
  const npc = new NPC('npc-noise', 'Bob Noise', 5, 2);
  gameMap.addEntity(npc, 5, 2);
  
  // Set current turn on engine
  engine.turn = 10;
  
  // Emit noise at (5, 4)
  npc.setNoiseHeard(5, 4);
  
  // Limit AP to 1 so Bob only takes one step per turn
  npc.startTurn();
  npc.ap = 1;
  NPCAI.executeNPCTurn(npc, gameMap, player, []);
  
  // NPC should move towards noise (5, 4)
  if (npc.logicalX !== 5 || npc.logicalY !== 3) {
    throw new Error(`NPC failed to investigate noise. Expected pos (5, 3), got (${npc.logicalX}, ${npc.logicalY})`);
  }
  
  // Run next turn to arrive at (5, 4)
  npc.startTurn();
  npc.ap = 1;
  NPCAI.executeNPCTurn(npc, gameMap, player, []);
  
  if (npc.logicalX !== 5 || npc.logicalY !== 4) {
    throw new Error(`NPC did not arrive at noise location. Got (${npc.logicalX}, ${npc.logicalY})`);
  }
  
  // Run a third turn to process the arrival at the noise spot
  npc.startTurn();
  npc.ap = 1;
  NPCAI.executeNPCTurn(npc, gameMap, player, []);

  if (npc.heardNoise) {
    throw new Error('NPC noise flag was not cleared upon arrival processing');
  }
  
  const inBlacklist = npc.noiseBlacklist.some(b => b.x === 5 && b.y === 4 && b.turn === 10);
  if (!inBlacklist) {
    throw new Error('Noise location was not added to blacklist');
  }
  
  console.log('   - Arrived at noise, blacklisted coordinate successfully.');
  
  // Try to set noise at (5, 4) again on turn 11 (within 5 turns)
  engine.turn = 11;
  npc.setNoiseHeard(5, 4);
  
  npc.startTurn();
  npc.ap = 1;
  NPCAI.executeNPCTurn(npc, gameMap, player, []);
  
  if (npc.heardNoise) {
    throw new Error('Blacklisted noise was not cleared');
  }
  console.log('   - Loop prevention successfully ignored blacklisted noise.');
});

// Case 6: Save and Load serialization
runTest('Save/Load Serialization', () => {
  const npc = new NPC('npc-serial', 'Serial Bob', 3, 4);
  npc.goalTarget = { x: 3, y: 19 };
  npc.currentPath = [{ x: 3, y: 5 }, { x: 3, y: 6 }];
  npc.noiseBlacklist = [{ x: 2, y: 2, turn: 5 }];
  
  const serialized = npc.toJSON();
  const restored = NPC.fromJSON(serialized);
  
  if (restored.id !== 'npc-serial' || restored.name !== 'Serial Bob') {
    throw new Error('Basic properties not restored correctly');
  }
  if (!restored.goalTarget || restored.goalTarget.x !== 3 || restored.goalTarget.y !== 19) {
    throw new Error('goalTarget not restored correctly');
  }
  if (!restored.currentPath || restored.currentPath.length !== 2 || restored.currentPath[0].y !== 5) {
    throw new Error('currentPath not restored correctly');
  }
  if (!restored.noiseBlacklist || restored.noiseBlacklist.length !== 1 || restored.noiseBlacklist[0].turn !== 5) {
    throw new Error('noiseBlacklist not restored correctly');
  }
  console.log('   - All custom NPC properties successfully serialized and restored.');
});

// Case 7: Memory Threat Clearing
runTest('Memory Threat Clearing', () => {
  const gameMap = new GameMap(10, 10);
  const npc = new NPC('npc-mem-clear', 'Bob memory', 5, 2);
  gameMap.addEntity(npc, 5, 2);
  
  // Set memory threat at (5, 4) on turn 10
  engine.turn = 10;
  npc.recentThreats = [{ x: 5, y: 4, turn: 10 }];
  
  // Run evaluateZombieThreats. NPC should see tile (5, 4) is empty (no zombie added to map)
  // and clear it from memory.
  const threats = NPCAI.evaluateZombieThreats(npc, gameMap, []);
  
  if (npc.recentThreats.length !== 0) {
    throw new Error(`Expected recentThreats to be empty, got: ${JSON.stringify(npc.recentThreats)}`);
  }
  console.log('   - Memory threat cleared successfully when tile is empty and in LOS.');
});

// Case 8: Threat Avoidance Pathfinding Detour
runTest('Threat Avoidance Pathfinding Detour', () => {
  const gameMap = new Map(); // Simple mock map, or let's use the actual GameMap
  const actualGameMap = new GameMap(10, 10);
  
  // Exit goal at (5, 9)
  actualGameMap.setTerrain(5, 9, 'transition');
  
  const npc = new NPC('npc-detour', 'Bob detour', 5, 2);
  actualGameMap.addEntity(npc, 5, 2);
  
  // Add a known threat in memory at (5, 4)
  npc.recentThreats = [{ x: 5, y: 4, turn: 10 }];
  
  // Pathfind to (5, 9). The direct path is down the 5-column (5,3)->(5,4)->(5,5).
  // But (5,4) is the threat tile, and (5,3)/(5,5) are within dangerRadius (8).
  // With the penalty, A* should detour to columns 4 or 6.
  const path = Pathfinding.findPath(actualGameMap, 5, 2, 5, 9, { entity: npc });
  
  if (!path || path.length === 0) {
    throw new Error('Failed to find path');
  }
  
  // Verify path does not go through (5, 4)
  const goesThroughThreat = path.some(node => node.x === 5 && node.y === 4);
  if (goesThroughThreat) {
    throw new Error('Path went straight through the known threat coordinate!');
  }
  
  console.log(`   - Pathfinder successfully detoured around known threat: path = ${JSON.stringify(path)}`);
});

// Case 9: Safe Travel Step Check
runTest('Safe Travel Step Check', () => {
  const gameMap = new GameMap(10, 15);
  gameMap.setTerrain(5, 14, 'transition');
  
  const npc = new NPC('npc-safe-step', 'Bob safe', 5, 2);
  gameMap.addEntity(npc, 5, 2);
  
  // Place a real zombie at (5, 8) to prevent the empty-tile memory clearing logic from running on it.
  // Distance from NPC (5,2) to zombie (5,8) is 6, which is outside dangerRadius (5) so NPC won't flee.
  const zombie = new Zombie('zombie-safe', 5, 8, 'basic');
  gameMap.addEntity(zombie, 5, 8);
  
  // Set goal target
  npc.goalTarget = { x: 5, y: 14 };
  // Add step to path
  npc.currentPath = [{ x: 5, y: 3 }, { x: 5, y: 4 }];
  
  // Memory threat is at (5, 8) - next step (5, 3) is distance 5 from zombie, which enters danger zone
  npc.recentThreats = [{ x: 5, y: 8, turn: 10 }];
  
  npc.startTurn();
  npc.ap = 2;
  
  const turnResult = NPCAI.executeNPCTurn(npc, gameMap, { logicalX: 1, logicalY: 1, x: 1, y: 1 }, [zombie]);
  
  // NPC should have aborted travel, so position is still (5, 2)
  if (npc.logicalX !== 5 || npc.logicalY !== 2) {
    throw new Error(`Expected NPC to remain at (5, 2), got (${npc.logicalX}, ${npc.logicalY})`);
  }
  
  if (npc.currentPath !== null) {
    throw new Error('Expected path cache to be cleared/invalidated');
  }
  
  console.log('   - Safe travel step check successfully aborted step entering threat danger zone.');
});

// Case 10: Out-of-Sight Memory Threat Damping
runTest('Memory Threat Damping (Less Sensitive Out of Sight)', () => {
  const gameMap = new GameMap(10, 10);
  const npc = new NPC('npc-damped', 'Bob damped', 5, 2);
  gameMap.addEntity(npc, 5, 2);
  
  // Set wall at (5, 4) to block line of sight between (5, 2) and (5, 6)/(5, 7)
  gameMap.setTerrain(5, 4, 'wall');
  
  // Set current turn
  engine.turn = 10;
  
  // Test A: Out of sight memory threat at distance 5 (x: 5, y: 7)
  // Since dangerRadius is 5, a visible threat at distance 5 would trigger.
  // But since it is out of sight, it should use memoryDangerRadius = 4, so it should NOT trigger.
  npc.recentThreats = [{ x: 5, y: 7, turn: 10 }];
  let threats = NPCAI.evaluateZombieThreats(npc, gameMap, []);
  if (threats.length !== 0) {
    throw new Error(`Expected no threats for out-of-sight memory threat at distance 5, got: ${threats.length}`);
  }
  
  // Test B: Out of sight memory threat at distance 4 (x: 5, y: 6)
  // Distance is 4, which is <= memoryDangerRadius (4), so it should trigger.
  npc.recentThreats = [{ x: 5, y: 6, turn: 10 }];
  threats = NPCAI.evaluateZombieThreats(npc, gameMap, []);
  if (threats.length !== 1) {
    throw new Error(`Expected 1 threat for out-of-sight memory threat at distance 4, got: ${threats.length}`);
  }
  
  console.log('   - Memory threat damping verified: distance 5 ignored, distance 4 triggered.');
});

console.log('\n=== NPC AI TEST RESULTS SUMMARY ===');
testResults.forEach(r => console.log(r));
const failed = testResults.filter(r => r.includes('FAILED')).length;
if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 All tests passed successfully!');
  process.exit(0);
}
