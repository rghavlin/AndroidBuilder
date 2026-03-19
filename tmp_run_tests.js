
import { runContainerTests } from './client/src/game/inventory/__tests__/Container.test.js';

console.log('--- STARTING TESTS ---');
const results = runContainerTests();
console.log('--- TEST RESULTS ---');
results.forEach(r => console.log(r));
console.log('--- END TESTS ---');
