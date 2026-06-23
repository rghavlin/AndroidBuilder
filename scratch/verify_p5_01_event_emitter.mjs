// P5-01: verify GameMap + WorldManager migrated to SafeEventEmitter cleanly.
// Checks: addEventListener alias works, emit enriches payload, handler errors
// are guarded (don't throw in non-dev), and removeAllListeners/off work.
import { GameMap } from '../client/src/game/map/GameMap.js';
import { WorldManager } from '../client/src/game/WorldManager.js';
import { SafeEventEmitter } from '../client/src/game/utils/SafeEventEmitter.js';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.error('FAIL:', msg); } };

// --- GameMap ---
const gm = new GameMap(10, 12);
ok(gm instanceof SafeEventEmitter, 'GameMap is a SafeEventEmitter');
ok(gm.listeners === undefined, 'GameMap no longer has raw .listeners');

let gmGot = null;
gm.addEventListener('terrainChanged', (d) => { gmGot = d; });
gm.emit('terrainChanged', { x: 3, y: 4 });
ok(gmGot && gmGot.x === 3 && gmGot.y === 4, 'GameMap delivers payload');
ok(gmGot && gmGot.map && gmGot.map.width === 10 && gmGot.map.height === 12, 'GameMap enriches with map dims');
ok(gmGot && typeof gmGot.timestamp === 'number', 'GameMap enriches with timestamp');

// error in one handler must not stop dispatch / throw (non-dev)
let gmSecond = false;
gm.on('boom', () => { throw new Error('handler blew up'); });
gm.on('boom', () => { gmSecond = true; });
let threw = false;
try { gm.emit('boom', {}); } catch { threw = true; }
ok(!threw, 'GameMap emit does not throw when a handler errors (non-dev)');

// off works
const fn = () => { gmGot = 'should-not-fire'; };
gm.on('toggle', fn);
gm.off('toggle', fn);
gmGot = null;
gm.emit('toggle', {});
ok(gmGot === null, 'GameMap off() removes the listener');

// --- WorldManager ---
const wm = new WorldManager();
ok(wm instanceof SafeEventEmitter, 'WorldManager is a SafeEventEmitter');
ok(wm.listeners === undefined, 'WorldManager no longer has raw .listeners');

let wmGot = null;
wm.addEventListener('mapGenerated', (d) => { wmGot = d; });
wm.currentMapId = 'map_007';
wm.emit('mapGenerated', { foo: 'bar' });
ok(wmGot && wmGot.foo === 'bar', 'WorldManager delivers payload');
ok(wmGot && wmGot.worldManager && wmGot.worldManager.currentMapId === 'map_007', 'WorldManager enriches with world state');

// cleanup clears listeners
wmGot = null;
wm.cleanup();
wm.emit('mapGenerated', { foo: 'baz' });
ok(wmGot === null, 'WorldManager cleanup() removes listeners');

console.log(`\n${fail === 0 ? 'ALL PASS' : 'SOME FAILED'} — ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
