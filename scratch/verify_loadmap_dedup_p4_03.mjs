import { WorldManager } from '../client/src/game/WorldManager.js';
import { GameMap } from '../client/src/game/map/GameMap.js';
import { EntityFactory } from '../client/src/game/EntityFactory.js';

let passed = 0;
let failed = 0;
function assert(c, label) {
  if (c) { console.log(`✅ PASS: ${label}`); passed++; }
  else { console.error(`❌ FAIL: ${label}`); failed++; }
}
const players = (gm) => Array.from(gm.entityMap.values()).filter(e => e.type === 'player');
const zombies = (gm) => Array.from(gm.entityMap.values()).filter(e => e.type === 'zombie');

console.log('=== P4-03: loadMap / loadMapForTransition dedup ===\n');

// Build a map with a player and a zombie, then persist it.
const gm = new GameMap(12, 12);
gm.addEntity(EntityFactory.createPlayer(5, 5), 5, 5);
gm.addEntity(EntityFactory.createZombie(3, 3, 'basic', 'zombie-1'), 3, 3);

const wm = new WorldManager();
wm.saveCurrentMap(gm, 'map_001', 1, 'road');
if (wm.compressionLocks.has('map_001')) await wm.compressionLocks.get('map_001');

// Capture the distinct events each path emits.
let fullEvent = null;
let transitionEvent = null;
wm.addEventListener('mapLoaded', (d) => { fullEvent = d; });
wm.addEventListener('mapLoadedForTransition', (d) => { transitionEvent = d; });

// --- Full load: keeps the player ---
const full = await wm.loadMap('map_001', null);
assert(!!full.gameMap, 'loadMap returns a gameMap');
assert(players(full.gameMap).length === 1, `loadMap keeps the player (got ${players(full.gameMap).length})`);
assert(zombies(full.gameMap).length === 1, 'loadMap keeps the zombie');
assert(fullEvent && fullEvent.mapId === 'map_001', "loadMap emits 'mapLoaded'");
assert(transitionEvent === null, "loadMap does NOT emit 'mapLoadedForTransition'");

// --- Transition load: excludes the player, stamps mapNumber ---
const trans = await wm.loadMapForTransition('map_001', null);
assert(!!trans.gameMap, 'loadMapForTransition returns a gameMap');
assert(players(trans.gameMap).length === 0, `loadMapForTransition excludes the player (got ${players(trans.gameMap).length})`);
assert(zombies(trans.gameMap).length === 1, 'loadMapForTransition keeps the zombie');
assert(trans.gameMap.mapNumber === 1, `loadMapForTransition stamps mapNumber=1 (got ${trans.gameMap.mapNumber})`);
assert(transitionEvent && transitionEvent.mapId === 'map_001', "loadMapForTransition emits 'mapLoadedForTransition'");

// --- Error path keeps its context suffix ---
let fullErr = '', transErr = '';
try { await wm.loadMap('map_999', null); } catch (e) { fullErr = e.message; }
try { await wm.loadMapForTransition('map_999', null); } catch (e) { transErr = e.message; }
assert(/Failed to load map map_999:/.test(fullErr), `loadMap error has no transition suffix (${fullErr})`);
assert(/Failed to load map map_999 for transition:/.test(transErr), `loadMapForTransition error keeps suffix (${transErr})`);

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) { console.error('\n❌ SOME TESTS FAILED'); process.exit(1); }
else { console.log('\n🎉 All P4-03 loadMap dedup tests passed!'); }
