import { GameMap } from '../client/src/game/map/GameMap.js';
import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { PlayerZombieTracker } from '../client/src/game/ai/PlayerZombieTracker.js';
import { ZombieAI } from '../client/src/game/ai/ZombieAI.js';

const map = new GameMap(45, 125);
map.fill('grass');

const player = EntityFactory.createPlayer(22, 106);
player.id = 'player-1';
map.addEntity(player, player.x, player.y);

// Spawn a zombie at the top
const zombie = EntityFactory.createZombie(22, 0, 'basic', 'z-top');
map.addEntity(zombie, zombie.x, zombie.y);

console.log("Distance to player:", zombie.getDistanceTo(player.x, player.y));
console.log("Zombie sight range:", zombie.sightRange);
console.log("Can see player?", zombie.canSeeEntity(map, player));

const tracker = new PlayerZombieTracker();
tracker.updateTracking(map, player, { x: 22, y: 106 });

console.log("Tracker tracking count:", tracker.trackedZombies.size);

// Try executing zombie turn
ZombieAI.executeZombieTurn(zombie, map);
console.log("Zombie intent:", zombie.components.get('MoveIntent') || zombie.components.get('DamageIntent'));
console.log("Zombie state:", zombie.behaviorState);
console.log("Zombie lastSeen:", zombie.lastSeen);
console.log("Zombie heardNoise:", zombie.heardNoise);
