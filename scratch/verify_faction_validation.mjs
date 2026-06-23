import { FactionRegistry } from '../client/src/game/ai/FactionRegistry.js';
import assert from 'assert';

// Mock console.warn to count calls and intercept messages.
let warnCalls = [];
const originalWarn = console.warn;
console.warn = (...args) => {
  warnCalls.push(args.join(' '));
};

function runTest() {
  console.log("Starting FactionRegistry validation verification...");

  // Test 1: Valid factions do not produce warnings
  const stance1 = FactionRegistry.stance('player', 'zombies');
  assert.strictEqual(stance1, 'hostile');
  assert.strictEqual(warnCalls.length, 0, "Expected no warnings for valid factions 'player' and 'zombies'");

  // Test 2: Invalid from faction produces warning
  warnCalls = [];
  const stance2 = FactionRegistry.stance('player_typo', 'zombies');
  assert.strictEqual(stance2, 'neutral');
  assert.strictEqual(warnCalls.length, 1, "Expected 1 warning for invalid 'from' faction");
  assert.ok(warnCalls[0].includes("Unrecognized 'from' faction ID: \"player_typo\""));

  // Test 3: Invalid to faction produces warning
  warnCalls = [];
  const stance3 = FactionRegistry.stance('player', 'zombiez');
  assert.strictEqual(stance3, 'neutral');
  assert.strictEqual(warnCalls.length, 1, "Expected 1 warning for invalid 'to' faction");
  assert.ok(warnCalls[0].includes("Unrecognized 'to' faction ID: \"zombiez\""));

  // Test 4: Both invalid produces two warnings
  warnCalls = [];
  const stance4 = FactionRegistry.stance('player_typo', 'zombiez');
  assert.strictEqual(stance4, 'neutral');
  assert.strictEqual(warnCalls.length, 2, "Expected 2 warnings for both invalid factions");

  // Test 5: Falsy values do not produce warnings (since they are expected/ignored)
  warnCalls = [];
  const stance5 = FactionRegistry.stance(null, 'zombies');
  assert.strictEqual(stance5, 'neutral');
  assert.strictEqual(warnCalls.length, 0, "Expected no warnings when 'from' is null");

  const stance6 = FactionRegistry.stance('player', undefined);
  assert.strictEqual(stance6, 'neutral');
  assert.strictEqual(warnCalls.length, 0, "Expected no warnings when 'to' is undefined");

  // Test 6: isHostile and isAlly trigger validation warnings
  warnCalls = [];
  const hostileCheck = FactionRegistry.isHostile('invalid_from', 'invalid_to');
  assert.strictEqual(hostileCheck, false);
  assert.strictEqual(warnCalls.length, 2, "Expected 2 warnings for both invalid in isHostile");

  warnCalls = [];
  const allyCheck = FactionRegistry.isAlly('invalid_from', 'invalid_to');
  assert.strictEqual(allyCheck, false);
  assert.strictEqual(warnCalls.length, 2, "Expected 2 warnings for both invalid in isAlly");

  console.log("✅ All FactionRegistry validation tests passed successfully!");
}

try {
  runTest();
} finally {
  console.warn = originalWarn;
}
