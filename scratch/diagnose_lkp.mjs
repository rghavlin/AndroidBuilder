import { GameMap } from '../client/src/game/map/GameMap.js';
import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { SimulationManager } from '../client/src/game/managers/SimulationManager.js';
import { ScentTrail } from '../client/src/game/utils/ScentTrail.js';
import { Door } from '../client/src/game/entities/Door.js';
import engine from '../client/src/game/GameEngine.js';
const realLog=console.log; console.log=()=>{}; const out=(...a)=>realLog(...a);
const cheb=(ax,ay,bx,by)=>Math.max(Math.abs(ax-bx),Math.abs(ay-by));

// Player in a closed room; zombie saw the player then player closed a door / broke LOS.
// We seed the zombie's LKP = player's CURRENT tile, no live LOS, and watch for churn
// (wander ping-pong) right next to the player.
function run(label, build){
  const gm=new GameMap(24,24);
  for(let y=0;y<24;y++)for(let x=0;x<24;x++)gm.setTerrain(x,y,'floor');
  engine.gameMap=gm; engine.worldManager={};
  const {player,z}=build(gm);
  engine.player=player; player.hp=999; player.maxHp=999;
  // seed LKP on player's tile, clear vision so it investigates not hunts
  z.setTargetSighted(player.logicalX, player.logicalY);
  const zs=[z]; const trail=[{x:z.logicalX,y:z.logicalY}]; let churn=0;
  for(let t=1;t<=6;t++){
    gm.entityMap.forEach(e=>{if(e.gridX!==undefined){e.logicalX=e.gridX;e.logicalY=e.gridY;}});
    const aq=SimulationManager.runTurn(gm,{player,isSleeping:false,turn:t});
    for(const a of aq){ if(a.entityId!==z.id)continue;
      if(a.type==='MOVE'){ const p={x:a.data.to.x,y:a.data.to.y};
        if(trail.some(q=>q.x===p.x&&q.y===p.y))churn++; trail.push(p);
      }
    }
  }
  out(`${label}: finalZ=(${z.logicalX},${z.logicalY}) distToP=${cheb(z.logicalX,z.logicalY,player.logicalX,player.logicalY)} state=${z.behaviorState} revisit-churn=${churn}`);
}

// A) player behind a CLOSED DOOR, zombie adjacent on other side
run('closed-door', (gm)=>{
  const player=EntityFactory.createPlayer(10,10); gm.addEntity(player,10,10);
  gm.getTile(10,10).edgeWalls.n=true; gm.getTile(10,9).edgeWalls.s=true;
  const door=new Door('d',10,10,false,false,'n'); gm.addEntity(door,10,10);
  gm.getTile(10,10).edgeWalls.n=false; // loader clears wall flag on door edge
  const z=EntityFactory.createZombie(10,9,'basic','z'); gm.addEntity(z,10,9);
  return {player,z};
});

// B) player behind a SOLID WALL, zombie cardinally adjacent
run('solid-wall', (gm)=>{
  const player=EntityFactory.createPlayer(10,10); gm.addEntity(player,10,10);
  gm.getTile(10,10).edgeWalls.n=true; gm.getTile(10,9).edgeWalls.s=true;
  const z=EntityFactory.createZombie(10,9,'basic','z'); gm.addEntity(z,10,9);
  return {player,z};
});

// C) player in open, zombie diagonally adjacent (should just HUNT/hold, sanity)
run('open-diagonal', (gm)=>{
  const player=EntityFactory.createPlayer(10,10); gm.addEntity(player,10,10);
  const z=EntityFactory.createZombie(11,9,'basic','z'); gm.addEntity(z,11,9);
  return {player,z};
});
