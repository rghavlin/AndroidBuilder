
import { runContainerTests } from './client/src/game/inventory/__tests__/Container.test.js';

console.log('--- STARTING TESTS ---');
try {
  const results = runContainerTests();
  console.log('--- TEST RESULTS ---');
  for (const result of results) {
    console.log(result);
  }
} catch (err) {
  console.error('CRITICAL TEST RUNNER ERROR:', err);
}
console.log('--- END TESTS ---');
