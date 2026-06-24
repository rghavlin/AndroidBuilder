import { GameMap } from '../client/src/game/map/GameMap.js';
import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { AISystem } from '../client/src/game/systems/AISystem.js';
import { MovementSystem } from '../client/src/game/systems/MovementSystem.js';
import { CombatSystem } from '../client/src/game/systems/CombatSystem.js';
import { Window } from '../client/src/game/entities/Window.js';
import engine from '../client/src/game/GameEngine.js';
import { VisionSystem } from '../client/src/game/systems/VisionSystem.js';

// Build a fresh open field with a single horizontal wall (edge walls along the
// y=PY+? boundary) and ONE window, player inside, zombie outside. Mirrors the
// canonical "player visible at a diagonal through a window" case.
function buildScenario(zx, zy, px, py, winX, winRow) {
  const gameMap = new GameMap(16, 16);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) gameMap.setTerrain(x, y, 'floor');
  engine.gameMap = gameMap;
  engine.worldManager = {};

  const player = EntityFactory.createPlayer(px, py);
  gameMap.addEntity(player, px, py);

  const zombie = EntityFactory.createZombie(zx, zy, 'basic', 'z1');
  gameMap.addEntity(zombie, zx, zy);

  // Wall along the boundary between winRow (inside) and winRow+1 (outside).
  for (let x = 0; x < 16; x++) {
    gameMap.getTile(x, winRow).edgeWalls.s = true;
    gameMap.getTile(x, winRow + 1).edgeWalls.n = true;
  }
  // Single window on the south edge of (winX, winRow).
  const win = new Window('w1', winX, winRow, false, false, false, 's');
  gameMap.addEntity(win, winX, winRow);

  return { gameMap, player, zombie, win };
}

function dist(a, b) { return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)); }

function runOne(zx, zy, px, py, winX, winRow, turns = 12) {
  const { gameMap, player, zombie, win } = buildScenario(zx, zy, px, py, winX, winRow);
  const ecs = [player, zombie];
  const trail = [{ x: zombie.logicalX, y: zombie.logicalY }];
  let reached = false;

  const states = new Set();
  for (let t = 0; t < turns && !reached; t++) {
    zombie.startTurn();
    let tick = 0;
    const aq = [];
    while (zombie.currentAP > 0.05 && tick < 30) {
      tick++;
      VisionSystem.process(ecs, engine.worldManager, engine);
      const n = AISystem.process(ecs, engine.worldManager, engine, aq);
      states.add(zombie.behaviorState);
      if (n === 0) break;
      MovementSystem.process(ecs, engine.worldManager, engine, aq);
      CombatSystem.process(ecs, engine.worldManager, engine, aq);
      const pos = { x: zombie.logicalX, y: zombie.logicalY };
      if (pos.x !== trail[trail.length - 1].x || pos.y !== trail[trail.length - 1].y) trail.push(pos);
      if (dist(pos, { x: px, y: py }) === 1) { reached = true; break; }
    }
  }

  // Oscillation/backtrack detection: count revisited tiles and net progress.
  const seen = new Map();
  let revisits = 0;
  for (const p of trail) {
    const k = `${p.x},${p.y}`;
    seen.set(k, (seen.get(k) || 0) + 1);
    if (seen.get(k) > 1) revisits++;
  }
  const finalDist = dist(trail[trail.length - 1], { x: px, y: py });
  return { reached, finalDist, revisits, steps: trail.length - 1, broken: win.isBroken, trail, states: [...states] };
}

console.log('=== Greedy hunting fallback verification ===');

// Mix of cases: close (A* solves), and OFFSET/FAR where the window is far off the
// straight line to the player so the beeline fails while LOS persists — the
// regime that previously fell to random wander.
const cases = [];
// Close band (window near player).
for (const [px, py, winX, winRow] of [[5, 4, 5, 4], [4, 4, 5, 4]]) {
  for (let zx = 2; zx <= 8; zx++) for (const zy of [5, 6]) cases.push({ zx, zy, px, py, winX, winRow });
}
// Offset band: player laterally far from the only window, zombie south at angles.
for (const [px, py, winX, winRow] of [[2, 2, 8, 5], [11, 2, 5, 5], [3, 1, 9, 6]]) {
  for (let zx = 4; zx <= 12; zx += 2) for (const zy of [7, 9, 11]) cases.push({ zx, zy, px, py, winX, winRow });
}

let stuck = 0, reachedCount = 0, totalRevisits = 0;
for (const c of cases) {
  const r = runOne(c.zx, c.zy, c.px, c.py, c.winX, c.winRow);
  const tag = r.reached ? 'REACHED' : (r.finalDist <= 1 ? 'ADJACENT' : 'STUCK');
  if (r.reached) reachedCount++;
  if (!r.reached && r.finalDist > 1) stuck++;
  totalRevisits += r.revisits;
  if (!r.reached) {
    console.log(`Z(${c.zx},${c.zy})->P(${c.px},${c.py}) win@${c.winX} row${c.winRow}: ${tag} finalDist=${r.finalDist} steps=${r.steps} revisits=${r.revisits} states=[${r.states.join(',')}]`);
  }
}
console.log(`\nTotal=${cases.length}  reached=${reachedCount}  stuck(finalDist>1)=${stuck}  totalRevisits=${totalRevisits}`);
