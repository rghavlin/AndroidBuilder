import { GameMap } from '../client/src/game/map/GameMap.js';
import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { AISystem } from '../client/src/game/systems/AISystem.js';
import { MovementSystem } from '../client/src/game/systems/MovementSystem.js';
import { CombatSystem } from '../client/src/game/systems/CombatSystem.js';
import { Door } from '../client/src/game/entities/Door.js';
import engine from '../client/src/game/GameEngine.js';
import { VisionSystem } from '../client/src/game/systems/VisionSystem.js';
import { Pathfinding } from '../client/src/game/utils/Pathfinding.js';

// Wall along the y=4 / y=5 boundary spanning the map. ONE closed door at (5,4)
// edge 's' (between inside (5,4) and outside (5,5)). Player inside, two zombies
// outside. Goal: detect a zombie crossing to the inside (row<=4) while the door
// is still CLOSED (not open, not broken) — i.e. phasing.
function build({ withEdgeWalls }) {
  const gameMap = new GameMap(14, 14);
  for (let y = 0; y < 14; y++) for (let x = 0; x < 14; x++) gameMap.setTerrain(x, y, 'floor');
  engine.gameMap = gameMap;
  engine.worldManager = {};

  const player = EntityFactory.createPlayer(5, 2);
  gameMap.addEntity(player, 5, 2);

  // Two zombies stuck outside, both near the door.
  const zA = EntityFactory.createZombie(5, 6, 'basic', 'zA'); // cardinal to door
  const zB = EntityFactory.createZombie(4, 6, 'basic', 'zB'); // beside the door
  gameMap.addEntity(zA, 5, 6);
  gameMap.addEntity(zB, 4, 6);

  // Full wall along the whole boundary.
  for (let x = 0; x < 14; x++) {
    gameMap.getTile(x, 4).edgeWalls.s = true;
    gameMap.getTile(x, 5).edgeWalls.n = true;
  }
  // Optionally simulate a generator that placed the door WITHOUT setting its own
  // edge wall (leaving a bare gap at the door tile, surrounded by intact wall).
  if (!withEdgeWalls) {
    gameMap.getTile(5, 4).edgeWalls.s = false;
    gameMap.getTile(5, 5).edgeWalls.n = false;
  }

  const door = new Door('door-5-4-s', 5, 4, false, false, false, 's');
  door.maxHp = 999;
  door.hp = 999;
  gameMap.addEntity(door, 5, 4);

  return { gameMap, player, zA, zB, door };
}

function run({ withEdgeWalls }) {
  const { gameMap, player, zA, zB, door } = build({ withEdgeWalls });
  const ecs = [player, zA, zB];
  let phased = null;

  for (let t = 1; t <= 8 && !phased; t++) {
    [zA, zB].forEach(z => z.startTurn());
    zA.setTargetSighted(5,2); zB.setTargetSighted(5,2); let tick = 0;
    while ((zA.currentAP > 0.05 || zB.currentAP > 0.05) && tick < 40) {
      tick++;
      VisionSystem.process(ecs, engine.worldManager, engine);
      const before = { zA: `${zA.logicalX},${zA.logicalY}`, zB: `${zB.logicalX},${zB.logicalY}` };
      const n = AISystem.process(ecs, engine.worldManager, engine, []);
      if (n === 0) break;
      const intents = [zA, zB].map(z => z.hasComponent('DamageIntent') ? 'ATK' : (z.hasComponent('MoveIntent') ? 'MOV' : '-'));
      MovementSystem.process(ecs, engine.worldManager, engine, []);
      CombatSystem.process(ecs, engine.worldManager, engine, []);
      if (process.env.TRACE) console.error(`  T${t}.${tick} zA[${intents[0]}] ${before.zA}->${zA.logicalX},${zA.logicalY}  zB[${intents[1]}] ${before.zB}->${zB.logicalX},${zB.logicalY}  door(hp=${door.hp},open=${door.isOpen},broken=${!!door.isBroken})`);
      // Phasing check: a zombie crossed to the inside (row <= 4) while the door
      // was still impassable (NOT open, NOT damaged/broken). Doors track breakage
      // via isDamaged (windows use isBroken).
      const doorPassable = door.isOpen || door.isDamaged || door.isBroken;
      for (const z of [zA, zB]) {
        if (z.logicalY <= 4 && !doorPassable && !phased) {
          phased = { who: z.id, at: { x: z.logicalX, y: z.logicalY }, turn: t, tick,
                     doorHp: door.hp, isOpen: door.isOpen, isDamaged: door.isDamaged };
        }
      }
    }
  }

  return { phased, doorHp: door.hp, doorBroken: door.isBroken, doorOpen: door.isOpen,
           zA: { x: zA.logicalX, y: zA.logicalY }, zB: { x: zB.logicalX, y: zB.logicalY } };
}

for (const withEdgeWalls of [true, false]) {
  const r = run({ withEdgeWalls });
  console.error(`\n### withEdgeWalls=${withEdgeWalls} ###`);
  console.error(`door: hp=${r.doorHp} broken=${r.doorBroken} open=${r.doorOpen}`);
  console.error(`zA=(${r.zA.x},${r.zA.y}) zB=(${r.zB.x},${r.zB.y})`);
  if (r.phased) console.error(`!!! PHASED THROUGH CLOSED DOOR: ${r.phased.who} reached (${r.phased.at.x},${r.phased.at.y}) on turn ${r.phased.turn}, doorHp=${r.phased.doorHp}`);
  else console.error(`no phasing detected`);
}
