// Define window before imports run
globalThis.window = {
  gameInitInstances: new Set()
};
globalThis.document = {
  createElement: () => ({})
};

import engine from './client/src/game/GameEngine.js';
import { Player } from './client/src/game/entities/Player.js';
import { WorldManager } from './client/src/game/WorldManager.js';
import { GameMap } from './client/src/game/map/GameMap.js';
import { Tile } from './client/src/game/map/Tile.js';
import GameInitializationManager from './client/src/game/GameInitializationManager.js';

// Hook into Tile flags to intercept explored writes globally
Object.defineProperty(Tile.prototype, 'flags', {
  get() {
    return this._flags || {};
  },
  set(val) {
    const tile = this;
    this._flags = new Proxy(val || {}, {
      set(target, prop, newVal) {
        if (prop === 'explored' && newVal === true && !target.explored) {
          // Log target coordinates: (22, 0), (0, 124), (44, 124)
          const targetCoords = [
            { x: 22, y: 0 },
            { x: 0, y: 124 },
            { x: 44, y: 124 }
          ];
          const isTarget = targetCoords.some(c => c.x === tile.x && c.y === tile.y);
          if (isTarget) {
            console.log(`\n[ALERT-WATCH] Target tile (${tile.x}, ${tile.y}) set to EXPLORED!`);
          } else {
            console.log(`[EXPLORED-MUTATION] (${tile.x}, ${tile.y})`);
          }
          // Log trace if we want
          // console.log(new Error().stack.split('\n').slice(1, 6).join('\n'));
        }
        target[prop] = newVal;
        return true;
      }
    });
  },
  configurable: true
});

async function runDebug() {
  console.log('--- STARTING INITIAL GAME LOAD DEBUGGING ---');
  const initManager = new GameInitializationManager();
  
  // Trigger core initialization steps
  console.log('Running initialization...');
  await initManager.startInitialization();
  
  console.log('--- INITIALIZATION COMPLETE ---');
  console.log('Running engine.recalculateFOV()...');
  engine.recalculateFOV();
  console.log('Done.');
}

runDebug().catch(console.error);
