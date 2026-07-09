// Round 2: focused scenarios for the sidestep/backstep reports.
import { GameMap } from '../client/src/game/map/GameMap.js';
import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { SimulationManager } from '../client/src/game/managers/SimulationManager.js';
import { ScentTrail } from '../client/src/game/utils/ScentTrail.js';
import engine from '../client/src/game/GameEngine.js';

const realLog = console.log;
console.log = () => {};
const out = (...a) => realLog(...a);

function buildField(w = 24, h = 24) {
  const gameMap = new GameMap(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) gameMap.setTerrain(x, y, 'floor');
  engine.gameMap = gameMap;
  engine.worldManager = {};
  return gameMap;
}
function addPlayer(gameMap, x, y) {
  const player = EntityFactory.createPlayer(x, y);
  gameMap.addEntity(player, x, y);
  engine.player = player;
  return player;
}
function cheb(ax, ay, bx, by) { return Math.max(Math.abs(ax - bx), Math.abs(ay - by)); }

function runTurns(gameMap, player, zombies, nTurns, opts = {}) {
  const events = [];
  for (let t = 1; t <= nTurns; t++) {
    gameMap.entityMap.forEach(e => {
      if (e.gridX !== undefined) { e.logicalX = e.gridX; e.logicalY = e.gridY; }
      else { e.logicalX = e.x; e.logicalY = e.y; }
    });
    ScentTrail.dropScent(gameMap, player.logicalX, player.logicalY);
    ScentTrail.decayScents(gameMap);
    if (opts.beforeTurn) opts.beforeTurn(t);
    const aq = SimulationManager.runTurn(gameMap, { player, isSleeping: false, turn: t });
    for (const a of aq) {
      const z = zombies.find(zz => zz.id === a.entityId);
      if (!z) continue;
      if (a.type === 'MOVE') {
        const dB = cheb(a.data.from.x, a.data.from.y, player.logicalX, player.logicalY);
        const dA = cheb(a.data.to.x, a.data.to.y, player.logicalX, player.logicalY);
        const tag = dA > dB ? ' AWAY' : (dA === dB ? ' LAT' : '');
        events.push(`T${t} ${z.id} MOVE (${a.data.from.x},${a.data.from.y})->(${a.data.to.x},${a.data.to.y}) d${dB}->${dA}${tag} [${z.behaviorState}]`);
      } else if (a.type === 'ATTACK') {
        events.push(`T${t} ${z.id} ATTACK hit=${a.data.success}`);
      } else if (a.type === 'STRUCTURE_INTERACT') {
        events.push(`T${t} ${z.id} BANG`);
      }
    }
  }
  return events;
}

// ---- S2': adjacent zombie, then a loud noise elsewhere (priority check) ----
out('=== S2b: adjacent attacker; noise injected at turn 3 ===');
{
  const gameMap = buildField();
  const player = addPlayer(gameMap, 12, 12);
  const z = EntityFactory.createZombie(12, 11, 'basic', 'zA');
  gameMap.addEntity(z, 12, 11);
  const ev = runTurns(gameMap, player, [z], 6, {
    beforeTurn: (t) => { if (t === 3) z.setNoiseHeard(20, 4); }
  });
  const moves = ev.filter(e => e.includes('MOVE'));
  out(moves.length === 0 ? 'never moved — hunt priority holds over noise' : moves.join('\n'));
}

// ---- S5: player backed against wall; 1 cardinal attacker + 1 diagonal zombie ----
out('\n=== S5: player against south wall; zombie E-cardinal, zombie NE-diagonal ===');
{
  const gameMap = buildField();
  const player = addPlayer(gameMap, 12, 12);
  // wall south of player; and west of player is also wall (corner position)
  gameMap.getTile(12, 12).edgeWalls.s = true;
  gameMap.getTile(12, 13).edgeWalls.n = true;
  gameMap.getTile(12, 12).edgeWalls.w = true;
  gameMap.getTile(11, 12).edgeWalls.e = true;
  const zc = EntityFactory.createZombie(13, 12, 'basic', 'zCARD'); // east slot, attacking
  gameMap.addEntity(zc, 13, 12);
  const zd = EntityFactory.createZombie(13, 11, 'basic', 'zDIAG'); // NE diagonal
  gameMap.addEntity(zd, 13, 11);
  const ev = runTurns(gameMap, player, [zc, zd], 4);
  out(ev.filter(e => e.includes('zCARD MOVE')).length + ' zCARD moves (expect 0)');
  const dm = ev.filter(e => e.includes('zDIAG'));
  out(`zDIAG actions (${dm.length}):`);
  out(dm.slice(0, 16).join('\n'));
}

// ---- S6: water pond between zombie and player (visible, unwalkable) ----
out('\n=== S6: 3-wide water strip between zombie and player, symmetric detours ===');
{
  const gameMap = buildField();
  const player = addPlayer(gameMap, 8, 12);
  // vertical water strip x=10..12, y=8..16 (see-through, unwalkable)
  for (let x = 10; x <= 12; x++) for (let y = 8; y <= 16; y++) gameMap.setTerrain(x, y, 'water');
  const z = EntityFactory.createZombie(14, 12, 'basic', 'zW');
  gameMap.addEntity(z, 14, 12);
  const ev = runTurns(gameMap, player, [z], 8);
  out(ev.join('\n'));
}

// ---- S7: corridor queue — trailing zombie behind an attacker in a doorway ----
out('\n=== S7: 1-wide corridor; front zombie attacks, trailing zombie behind it ===');
{
  const gameMap = buildField();
  // corridor along row 12: walls above and below x=10..16
  for (let x = 10; x <= 16; x++) {
    gameMap.getTile(x, 12).edgeWalls.n = true;
    gameMap.getTile(x, 11).edgeWalls.s = true;
    gameMap.getTile(x, 12).edgeWalls.s = true;
    gameMap.getTile(x, 13).edgeWalls.n = true;
  }
  const player = addPlayer(gameMap, 10, 12); // player in corridor
  const zf = EntityFactory.createZombie(11, 12, 'basic', 'zFRONT');
  gameMap.addEntity(zf, 11, 12);
  const zt = EntityFactory.createZombie(12, 12, 'basic', 'zTRAIL');
  gameMap.addEntity(zt, 12, 12);
  const ev = runTurns(gameMap, player, [zf, zt], 4);
  out(ev.filter(e => e.includes('zFRONT MOVE')).length + ' zFRONT moves (expect 0)');
  const tm = ev.filter(e => e.includes('zTRAIL'));
  out(`zTRAIL actions (${tm.length}):`);
  out(tm.slice(0, 16).join('\n'));
}
