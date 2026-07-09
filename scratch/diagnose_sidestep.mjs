// Diagnose: adjacent zombie "sidestep out of attack position" + backsteps on approach.
// Drives the REAL SimulationManager.runTurn and logs every action per turn.
import { GameMap } from '../client/src/game/map/GameMap.js';
import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { SimulationManager } from '../client/src/game/managers/SimulationManager.js';
import { ScentTrail } from '../client/src/game/utils/ScentTrail.js';
import { Door } from '../client/src/game/entities/Door.js';
import engine from '../client/src/game/GameEngine.js';

// Silence the noisy console.log from game internals but keep our output.
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

function runTurns(gameMap, player, zombies, nTurns, { scentEachTurn = false } = {}) {
  const traces = new Map(zombies.map(z => [z.id, [{ x: z.logicalX, y: z.logicalY }]]));
  const events = [];
  for (let t = 1; t <= nTurns; t++) {
    // emulate GameContext.simulateTurn preamble
    gameMap.entityMap.forEach(e => {
      if (e.gridX !== undefined) { e.logicalX = e.gridX; e.logicalY = e.gridY; }
      else { e.logicalX = e.x; e.logicalY = e.y; }
    });
    if (scentEachTurn) ScentTrail.dropScent(gameMap, player.logicalX, player.logicalY);
    ScentTrail.decayScents(gameMap);

    const aq = SimulationManager.runTurn(gameMap, { player, isSleeping: false, turn: t });
    for (const a of aq) {
      const z = zombies.find(zz => zz.id === a.entityId);
      if (!z) continue;
      if (a.type === 'MOVE') {
        const tr = traces.get(z.id);
        const prev = tr[tr.length - 1];
        const dBefore = cheb(a.data.from.x, a.data.from.y, player.logicalX, player.logicalY);
        const dAfter = cheb(a.data.to.x, a.data.to.y, player.logicalX, player.logicalY);
        tr.push({ x: a.data.to.x, y: a.data.to.y });
        const tag = dAfter > dBefore ? '  <<< AWAY-STEP' : (dAfter === dBefore ? '  <<< LATERAL' : '');
        events.push(`T${t} ${z.id} MOVE (${a.data.from.x},${a.data.from.y})->(${a.data.to.x},${a.data.to.y}) distToP ${dBefore}->${dAfter} state=${z.behaviorState}${tag}`);
      } else if (a.type === 'ATTACK') {
        events.push(`T${t} ${z.id} ATTACK ${a.data.targetType} hit=${a.data.success} dmg=${a.data.damage}`);
      } else if (a.type === 'STRUCTURE_INTERACT') {
        events.push(`T${t} ${z.id} BANG ${a.data.targetType ?? 'structure'} broken=${a.data.broken}`);
      } else {
        events.push(`T${t} ${z.id} ${a.type}`);
      }
    }
  }
  return { traces, events };
}

// ---------- Scenario 1: adjacent zombie, open field, stationary player ----------
out('=== S1: adjacent zombie, open field, 8 turns ===');
{
  const gameMap = buildField();
  const player = addPlayer(gameMap, 12, 12);
  const z = EntityFactory.createZombie(12, 11, 'basic', 'zA');
  gameMap.addEntity(z, 12, 11);
  const { events } = runTurns(gameMap, player, [z], 8);
  const moves = events.filter(e => e.includes('MOVE'));
  out(moves.length === 0 ? `no moves; ${events.length} actions, all attacks — OK` : moves.join('\n'));
}

// ---------- Scenario 2: adjacent zombie + scent trail + distant door-banger ----------
out('\n=== S2: adjacent zombie + player scent trail behind it + door-banging zombie ===');
{
  const gameMap = buildField();
  const player = addPlayer(gameMap, 12, 12);
  // player walked in from the west: breadcrumbs 6..11 on row 12 (freshest at 11,12)
  for (let x = 6; x <= 11; x++) ScentTrail.dropScent(gameMap, x, 12);
  const z = EntityFactory.createZombie(12, 11, 'basic', 'zA');
  gameMap.addEntity(z, 12, 11);
  // door-banger: zombie behind a closed door 7 tiles away with LOS to nothing
  gameMap.getTile(18, 12).edgeWalls.w = true;
  gameMap.getTile(18, 11).edgeWalls.w = true;
  gameMap.getTile(18, 13).edgeWalls.w = true;
  const door = new Door('d1', 18, 12, false, false, 'w');
  door.hp = 999; // never breaks — keeps banging
  gameMap.addEntity(door, 18, 12);
  // clear the door's edge wall like the map loader does
  gameMap.getTile(18, 12).edgeWalls.w = false;
  const z2 = EntityFactory.createZombie(19, 12, 'basic', 'zBANG');
  gameMap.addEntity(z2, 19, 12);
  const { events } = runTurns(gameMap, player, [z, z2], 8, { scentEachTurn: true });
  const zAmoves = events.filter(e => e.includes('zA MOVE'));
  out(zAmoves.length === 0 ? 'zA never moved — OK' : zAmoves.join('\n'));
  out(events.filter(e => e.includes('zBANG')).slice(0, 3).join('\n'));
}

// ---------- Scenario 3: swarm approach, open field ----------
out('\n=== S3: 5-zombie swarm approach from 6-9 tiles, open field ===');
{
  const gameMap = buildField();
  const player = addPlayer(gameMap, 12, 12);
  const zs = [];
  const starts = [[6, 12], [6, 11], [6, 13], [5, 12], [7, 12]];
  starts.forEach(([x, y], i) => {
    const z = EntityFactory.createZombie(x, y, 'basic', 'z' + i);
    gameMap.addEntity(z, x, y);
    zs.push(z);
  });
  const { events } = runTurns(gameMap, player, zs, 6);
  const bad = events.filter(e => e.includes('AWAY-STEP'));
  out(`away-steps: ${bad.length}`);
  out(bad.slice(0, 12).join('\n'));
}

// ---------- Scenario 4: corner approach (LOS flicker) with live scent ----------
out('\n=== S4: zombie rounds a wall corner; player stationary behind it ===');
{
  const gameMap = buildField();
  // vertical wall x=11/12 boundary from y=6..12, player hides west of it
  const player = addPlayer(gameMap, 10, 8);
  for (let y = 6; y <= 12; y++) {
    gameMap.getTile(11, y).edgeWalls.e = true;
    gameMap.getTile(12, y).edgeWalls.w = true;
  }
  // player's incoming trail around the corner (came from the east side, around y=13)
  const trail = [[14, 13], [13, 13], [12, 13], [11, 13], [10, 13], [10, 12], [10, 11], [10, 10], [10, 9]];
  trail.forEach(([x, y]) => ScentTrail.dropScent(gameMap, x, y));
  const z = EntityFactory.createZombie(14, 8, 'basic', 'zC');
  gameMap.addEntity(z, 14, 8);
  const { events } = runTurns(gameMap, player, [z], 8, { scentEachTurn: true });
  out(events.join('\n'));
}
