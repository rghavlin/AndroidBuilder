import { EntityFactory } from '../client/src/game/EntityFactory.js';

console.log("Running Entity Status Methods verification...");

const player = EntityFactory.createPlayer(5, 5);

console.log(`Initial status:
  isBleeding: ${player.isBleeding}
  sickness: ${player.sickness}
  condition: ${player.condition}
`);

console.log("Inflicting bleeding (true)...");
player.setBleeding(true);
console.log(`After bleeding set:
  isBleeding: ${player.isBleeding}
  condition: ${player.condition} (Expected: Bleeding)
`);

console.log("Stopping bleeding (false)...");
player.setBleeding(false);
console.log(`After bleeding stopped:
  isBleeding: ${player.isBleeding}
  condition: ${player.condition} (Expected: Normal)
`);

console.log("Inflicting sickness (5)...");
player.inflictSickness(5);
console.log(`After sickness set:
  sickness: ${player.sickness} (Expected: 5)
  condition: ${player.condition} (Expected: Diseased)
`);

console.log("Curing player...");
player.cure();
console.log(`After cure:
  sickness: ${player.sickness} (Expected: 0)
  condition: ${player.condition} (Expected: Normal)
`);

console.log("Verification successful!");
