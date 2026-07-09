import { GameMap } from '../client/src/game/map/GameMap.js';
import { EntityFactory } from '../client/src/game/EntityFactory.js';
import { SimulationManager } from '../client/src/game/managers/SimulationManager.js';
import { ScentTrail } from '../client/src/game/utils/ScentTrail.js';
import engine from '../client/src/game/GameEngine.js';
const realLog = console.log; console.log = () => {}; const out = (...a) => realLog(...a);

const gm = new GameMap(24, 24);
for (let y=0;y<24;y++) for (let x=0;x<24;x++) gm.setTerrain(x,y,'floor');
engine.gameMap = gm; engine.worldManager = {};
// Sealed 1-wide corridor along row 12, x=4..14 (walls N and S the whole length; ends sealed by surrounding floor being blocked via walls at x=3/15 too)
for (let x=3;x<=15;x++){ gm.getTile(x,12).edgeWalls.n=true; gm.getTile(x,11).edgeWalls.s=true; gm.getTile(x,12).edgeWalls.s=true; gm.getTile(x,13).edgeWalls.n=true; }
gm.getTile(4,12).edgeWalls.w=true; gm.getTile(3,12).edgeWalls.e=true;
const player = EntityFactory.createPlayer(6,12); gm.addEntity(player,6,12); engine.player=player; player.hp=999; player.maxHp=999;
const lead = EntityFactory.createZombie(7,12,'basic','LEAD'); gm.addEntity(lead,7,12);
const trail = EntityFactory.createZombie(8,12,'basic','TRAIL'); gm.addEntity(trail,8,12);
const zs=[lead,trail];
const cheb=(ax,ay,bx,by)=>Math.max(Math.abs(ax-bx),Math.abs(ay-by));
for(let t=1;t<=4;t++){
  gm.entityMap.forEach(e=>{if(e.gridX!==undefined){e.logicalX=e.gridX;e.logicalY=e.gridY;}});
  ScentTrail.dropScent(gm,player.logicalX,player.logicalY); ScentTrail.decayScents(gm);
  const aq=SimulationManager.runTurn(gm,{player,isSleeping:false,turn:t});
  const s={}; for(const a of aq){const z=zs.find(zz=>zz.id===a.entityId); if(!z)continue; s[z.id]=s[z.id]||{m:0,atk:0}; if(a.type==='MOVE')s[z.id].m++; else if(a.type==='ATTACK')s[z.id].atk++;}
  out(`T${t}: `+zs.map(z=>`${z.id}@(${z.logicalX},${z.logicalY}) ${(s[z.id]||{m:0}).m||0}mv ${(s[z.id]||{atk:0}).atk||0}atk`).join(' | '));
}
