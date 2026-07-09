// Round 3: realistic fight — cornered player, two attackers, one extra zombie.
// Kill one attacker at turn 3; watch the extra zombie's dance and slot-claim.
import { GameMap } from '../client/src/game/map/GameMap.js';
import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { SimulationManager } from '../client/src/game/managers/SimulationManager.js';
import { ScentTrail } from '../client/src/game/utils/ScentTrail.js';
import engine from '../client/src/game/GameEngine.js';

const realLog = console.log;
console.log = () => {};
const out = (...a) => realLog(...a);

const gameMap = new GameMap(24, 24);
for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) gameMap.setTerrain(x, y, 'floor');
engine.gameMap = gameMap;
engine.worldManager = {};

// Player in a corner: walls south and west
const player = EntityFactory.createPlayer(12, 12);
gameMap.addEntity(player, 12, 12);
engine.player = player;
player.hp = 500; player.maxHp = 500; // survive the beating
gameMap.getTile(12, 12).edgeWalls.s = true;
gameMap.getTile(12, 13).edgeWalls.n = true;
gameMap.getTile(12, 12).edgeWalls.w = true;
gameMap.getTile(11, 12).edgeWalls.e = true;

// Open cardinal slots: N (12,11) and E (13,12) — fill both with attackers.
const zN = EntityFactory.createZombie(12, 11, 'basic', 'zN');
gameMap.addEntity(zN, 12, 11);
const zE = EntityFactory.createZombie(13, 12, 'basic', 'zE');
gameMap.addEntity(zE, 13, 12);
// The extra: starts a few tiles out, arrives, then has nowhere to attack from.
const zX = EntityFactory.createZombie(16, 9, 'basic', 'zX');
gameMap.addEntity(zX, 16, 9);

const zs = [zN, zE, zX];
function cheb(ax, ay, bx, by) { return Math.max(Math.abs(ax - bx), Math.abs(ay - by)); }

for (let t = 1; t <= 6; t++) {
  gameMap.entityMap.forEach(e => {
    if (e.gridX !== undefined) { e.logicalX = e.gridX; e.logicalY = e.gridY; }
  });
  ScentTrail.dropScent(gameMap, player.logicalX, player.logicalY);
  ScentTrail.decayScents(gameMap);
  if (t === 4) { zN.hp = 0; out('--- zN killed by player before turn 4 ---'); }
  const aq = SimulationManager.runTurn(gameMap, { player, isSleeping: false, turn: t });
  const summary = {};
  for (const a of aq) {
    const z = zs.find(zz => zz.id === a.entityId);
    if (!z) continue;
    summary[z.id] = summary[z.id] || { moves: [], attacks: 0 };
    if (a.type === 'MOVE') {
      const dA = cheb(a.data.to.x, a.data.to.y, player.logicalX, player.logicalY);
      summary[z.id].moves.push(`(${a.data.to.x},${a.data.to.y})d${dA}`);
    } else if (a.type === 'ATTACK') summary[z.id].attacks++;
  }
  out(`T${t}: ` + zs.map(z => {
    const s = summary[z.id];
    if (!s) return `${z.id}: idle@(${z.logicalX},${z.logicalY})`;
    return `${z.id}: ${s.attacks} atk, ${s.moves.length} moves ${s.moves.join(' ')}`;
  }).join(' | '));
}
