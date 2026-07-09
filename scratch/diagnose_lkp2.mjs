import { GameMap } from '../client/src/game/map/GameMap.js';
import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { SimulationManager } from '../client/src/game/managers/SimulationManager.js';
import { Door } from '../client/src/game/entities/Door.js';
import engine from '../client/src/game/GameEngine.js';
const realLog=console.log; console.log=()=>{}; const out=(...a)=>realLog(...a);
const gm=new GameMap(24,24);
for(let y=0;y<24;y++)for(let x=0;x<24;x++)gm.setTerrain(x,y,'floor');
engine.gameMap=gm; engine.worldManager={};
const player=EntityFactory.createPlayer(10,10); gm.addEntity(player,10,10); engine.player=player; player.hp=999; player.maxHp=999;
gm.getTile(10,10).edgeWalls.n=true; gm.getTile(10,9).edgeWalls.s=true;
const door=new Door('d',10,10,false,false,false,'n'); gm.addEntity(door,10,10);
gm.getTile(10,10).edgeWalls.n=false;
const z=EntityFactory.createZombie(10,9,'basic','z'); gm.addEntity(z,10,9);
z.setTargetSighted(10,10);
for(let t=1;t<=4;t++){
  gm.entityMap.forEach(e=>{if(e.gridX!==undefined){e.logicalX=e.gridX;e.logicalY=e.gridY;}});
  const aq=SimulationManager.runTurn(gm,{player,isSleeping:false,turn:t});
  const kinds={}; for(const a of aq){ if(a.entityId!==z.id)continue; kinds[a.type]=(kinds[a.type]||0)+1; }
  out(`T${t}: z@(${z.logicalX},${z.logicalY}) state=${z.behaviorState} doorHp=${door.hp} broken=${door.isBroken} actions=${JSON.stringify(kinds)}`);
}
