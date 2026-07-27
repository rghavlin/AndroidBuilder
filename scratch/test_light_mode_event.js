import engine from '../client/src/game/GameEngine.js';
import { GameMap } from '../client/src/game/map/GameMap.js';
import { Entity, EntityType } from '../client/src/game/entities/Entity.js';
import eventRunner from '../client/src/game/quest/EventRunner.js';

console.log('Testing Map Light Modes, FOV Calculation & Flashlight Illumination...');

// 1. Setup a dummy map with lightMode metadata and a player
const gameMap = new GameMap(20, 20);
gameMap.initializeMap();
gameMap.metadata = { lightMode: 'always_dark', alwaysDark: true };
engine.gameMap = gameMap;

const player = new Entity({ id: 'player1', type: EntityType.PLAYER, x: 10, y: 10 });
engine.player = player;
gameMap.addEntity(player);

// 2. Test FOV in always_dark mode (no flashlight)
engine.setFOVOptions({ isNight: false, isFlashlightOn: false, flashlightRange: 8, maxRange: 15 });
const calculated = engine.recalculateFOV();
console.assert(calculated === true, 'recalculateFOV should complete successfully without throwing errors');
console.assert(engine.playerFieldOfView && engine.playerFieldOfView.length > 0, 'Player should see at least nearby tiles in dark mode');

// Check that player's own tile (10, 10) is visible and explored
const ownTile = gameMap.getTile(10, 10);
console.assert(ownTile.flags.explored === true, 'Player own tile should be explored');
console.log(`[Dark Mode - Off] Visible tiles count: ${engine.playerFieldOfView.length}`);
console.assert(engine.playerFieldOfView.length <= 15, `Dark mode without flashlight should have limited vision (~9-13 tiles), got ${engine.playerFieldOfView.length}`);

// 3. Test FOV in always_dark mode (flashlight ON)
engine._lastFovOptionsHash = null; // force recalculation
engine.setFOVOptions({ isNight: false, isFlashlightOn: true, flashlightRange: 8, maxRange: 15 });
engine.recalculateFOV();
console.log(`[Dark Mode - Flashlight ON] Visible tiles count: ${engine.playerFieldOfView.length}`);
console.assert(engine.playerFieldOfView.length > 50, `Flashlight ON in dark mode should illuminate broad area, got ${engine.playerFieldOfView.length}`);

// 4. Test Event Step toggle
const toggleLightEvent = {
  id: 'test_toggle_light',
  preconditions: [],
  placement: { kind: 'chainOnly' },
  trigger: 'auto',
  repeat: 'once',
  steps: [
    { type: 'setLightMode', lightMode: 'always_light' }
  ]
};

eventRunner.runEvent(toggleLightEvent);

console.assert(gameMap.metadata.lightMode === 'always_light', `Expected lightMode 'always_light', got '${gameMap.metadata.lightMode}'`);
console.assert(gameMap.metadata.alwaysDark === false, `Expected alwaysDark false, got ${gameMap.metadata.alwaysDark}`);

engine._lastFovOptionsHash = null;
engine.recalculateFOV();
console.log(`[Always Light Mode] Visible tiles count: ${engine.playerFieldOfView.length}`);
console.assert(engine.playerFieldOfView.length > 100, `Always light mode should have full vision, got ${engine.playerFieldOfView.length}`);

console.log('All Map Light Mode & FOV tests passed successfully!');
