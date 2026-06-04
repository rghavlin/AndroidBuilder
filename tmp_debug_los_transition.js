import engine from './client/src/game/GameEngine.js';
import { Player } from './client/src/game/entities/Player.js';
import { WorldManager } from './client/src/game/WorldManager.js';
import { GameMap } from './client/src/game/map/GameMap.js';
import { Tile } from './client/src/game/map/Tile.js';

// Hook into Tile flags to intercept explored writes globally
const originalTileConstructor = Tile;
Object.defineProperty(Tile.prototype, 'flags', {
  get() {
    return this._flags || {};
  },
  set(val) {
    const tile = this;
    this._flags = new Proxy(val || {}, {
      set(target, prop, newVal) {
        if (prop === 'explored' && newVal === true && !target.explored) {
          console.log(`[WATCH] Tile (${tile.x}, ${tile.y}) set to EXPLORED!`);
          console.log(new Error().stack.split('\n').slice(1, 5).join('\n')); // print partial stack trace
        }
        target[prop] = newVal;
        return true;
      }
    });
  },
  configurable: true
});

async function runDebug() {
  console.log('--- STARTING GLOBAL LOS TRANSITION DEBUGGING ---');

  const worldManager = new WorldManager();
  engine.worldManager = worldManager;

  console.log('Generating maps...');
  await worldManager.generateNextMap('road', 1); // map 1
  await worldManager.generateNextMap('road', 1); // map 2
  const map3Result = await worldManager.generateNextMap('road', 1); // map 3

  const map3 = map3Result.gameMap;
  engine.gameMap = map3;

  const player = new Player('player-1', 'Player', 22, 0);
  player.logicalX = 22;
  player.logicalY = 0;
  player.gridX = 22;
  player.gridY = 0;
  engine.player = player;

  map3.addEntity(player, 22, 0);

  // Recalculate FOV on map 3
  console.log('\n--- Initial FOV Recalculation on Map 3 (Player at 22, 0) ---');
  engine.invalidateFOV();
  engine.recalculateFOV();

  // Create Map 4 winding_road
  await worldManager.generateNextMap('winding_road', 1);

  // Let's mimic executeMapTransition in GameMapContext.jsx
  console.log('\n--- SIMULATING TRANSITION TO MAP 4 ---');
  
  // 1. Save old map
  worldManager.saveCurrentMap(engine.gameMap, worldManager.currentMapId, 1);

  // 2. Perform transition
  const transitionInfo = { nextMapId: 'map_004', spawnPosition: { x: 22, y: 123 } };
  
  console.log('Calling executeTransition...');
  const result = await worldManager.executeTransition(transitionInfo.nextMapId, transitionInfo.spawnPosition, 1);
  const newMap = result.gameMap;

  // 3. Update player reference and position
  console.log('Removing player from map 3...');
  engine.gameMap.removeEntity(player.id);
  
  console.log('Adding player to map 4...');
  newMap.addEntity(player, result.spawnPosition.x, result.spawnPosition.y);
  
  console.log('Updating player coordinates...');
  player.x = result.spawnPosition.x;
  player.y = result.spawnPosition.y;
  player.logicalX = result.spawnPosition.x;
  player.logicalY = result.spawnPosition.y;
  player.gridX = result.spawnPosition.x;
  player.gridY = result.spawnPosition.y;

  // 4. Update Engine
  console.log('Setting engine.gameMap to newMap...');
  engine.gameMap = newMap;

  // 5. Syncing
  console.log('Triggering engine.notifySync()...');
  engine.notifySync();

  console.log('--- SIMULATING TRANSITION COMPLETE ---\n');
}

runDebug().catch(console.error);
