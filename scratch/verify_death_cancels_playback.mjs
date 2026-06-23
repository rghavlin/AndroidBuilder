import turnManager from '../client/src/game/managers/TurnManager.js';

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

const delay = (ms) => new Promise(r => setTimeout(r, ms));

console.log('=== Death must stop in-flight turn playback (cancelPlayback) ===\n');

// Instrument executeAction to count how many actions actually run, with a small
// per-action cost so we can interrupt mid-queue. Honor shouldCancel like the real one.
let executed = 0;
turnManager.executeAction = async () => {
  if (turnManager.shouldCancel) return;
  executed++;
  await delay(15);
};

// A long queue of harmless GLOBAL actions (no entity required, no-op default case).
const TOTAL = 100;
const queue = Array.from({ length: TOTAL }, (_, i) => ({ type: 'GLOBAL', entityId: `g${i}` }));

// Start playback WITHOUT awaiting — simulates a turn animating behind the UI.
const playback = turnManager.processQueue(queue, { gameMap: {}, player: {} });

assert(turnManager.isProcessing === true, 'processQueue is running (isProcessing=true)');

// Let a few actions play, then the player "dies" -> cancelPlayback().
await delay(80);
const executedAtCancel = executed;
turnManager.cancelPlayback();
assert(turnManager.shouldCancel === true, 'cancelPlayback set shouldCancel');

// Wait for the loop to unwind.
await playback;

assert(turnManager.isProcessing === false, 'processQueue stopped (isProcessing=false) after cancel');
assert(executed < TOTAL, `not all ${TOTAL} actions ran — playback was interrupted (ran ${executed})`);
assert(executed <= executedAtCancel + 2,
  `playback stopped promptly after cancel (ran ${executed}, was ${executedAtCancel} at cancel)`);

// A fresh queue must still process normally after a cancellation (no stuck flag).
executed = 0;
await turnManager.processQueue(
  Array.from({ length: 5 }, (_, i) => ({ type: 'GLOBAL', entityId: `n${i}` })),
  { gameMap: {}, player: {} }
);
assert(executed === 5, `subsequent turn processes fully after a prior cancel (ran ${executed}/5)`);
assert(turnManager.isProcessing === false, 'isProcessing false after the clean follow-up turn');

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
  console.error('\n❌ SOME TESTS FAILED');
  process.exit(1);
} else {
  console.log('\n🎉 Death-cancels-playback mechanism verified!');
}
