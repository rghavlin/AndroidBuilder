import { TemplateMapGenerator } from '../client/src/game/map/TemplateMapGenerator.js';
import { MirroredWindingRoadGenerator } from '../client/src/game/map/generators/MirroredWindingRoadGenerator.js';

// Define our new hasRoadFrontage helper
function hasRoadFrontage(builder, b, maxDist = 6) {
  const { frontage, x, y, width, height } = b;
  
  let hasRoadTile = false;
  
  if (frontage === 'north' || frontage === 'south') {
    const startY = (frontage === 'north') ? y - 1 : y + height;
    const dy = (frontage === 'north') ? -1 : 1;
    
    for (let tx = x; tx < x + width; tx++) {
      for (let step = 0; step < maxDist; step++) {
        const curY = startY + dy * step;
        if (curY < 0 || curY >= builder.height) break;
        
        const terrain = builder.getTerrain(tx, curY);
        if (terrain === 'wall' || terrain === 'floor' || terrain === 'fence') {
          return false; // Blocked!
        }
        if (terrain === 'sidewalk' || terrain === 'road') {
          hasRoadTile = true;
        }
      }
    }
  } else { // east or west
    const startX = (frontage === 'east') ? x + width : x - 1;
    const dx = (frontage === 'east') ? 1 : -1;
    
    for (let ty = y; ty < y + height; ty++) {
      for (let step = 0; step < maxDist; step++) {
        const curX = startX + dx * step;
        if (curX < 0 || curX >= builder.width) break;
        
        const terrain = builder.getTerrain(curX, ty);
        if (terrain === 'wall' || terrain === 'floor' || terrain === 'fence') {
          return false; // Blocked!
        }
        if (terrain === 'sidewalk' || terrain === 'road') {
          hasRoadTile = true;
        }
      }
    }
  }
  
  return hasRoadTile;
}

// Subclass MirroredWindingRoadGenerator to use the fix
class PatchedMirroredWindingRoadGenerator extends MirroredWindingRoadGenerator {
  passSpecialization(builder, context) {
    const { mapNumber, roadXMin, roadXMax, roadY } = context;
    const { width } = builder;
    const buildings = builder.metadata.buildings;
    
    const tentPool = buildings.filter(b => {
        if (b.type !== 'residential') return false;
        const isFarPerim = b.x < 20 || b.x > width - 20;
        const isNearCorner = Math.abs(b.y - 4) < 15 || Math.abs(b.y - 52) < 15 || Math.abs(b.y - 100) < 15;
        return isFarPerim && isNearCorner;
    });

    // Use our new hasRoadFrontage helper here!
    const specialPool = buildings.filter(b => {
        if (b.type !== 'residential') return false;
        if (tentPool.includes(b)) return false;
        return hasRoadFrontage(builder, b, 6);
    });

    const selected = [];
    const area = width * builder.height;
    const totalSpecials = Math.max(1, Math.floor(area / 5000));

    if (tentPool.length > 0) {
        const tentIdx = Math.floor(Math.random() * tentPool.length);
        selected.push({ building: tentPool[tentIdx], type: 'army_tent' });
    }

    if (totalSpecials > 0 && specialPool.length > 0) {
        const extraPool = this.getRandomSubarray(specialPool, totalSpecials);
        const extraTypes = this.getSpecialBuildingTypes(mapNumber, 'mirrored_winding_road', totalSpecials);
        extraPool.forEach((b, i) => {
            selected.push({ building: b, type: extraTypes[i] });
        });
    }

    selected.forEach(entry => {
        const { building: b, type } = entry;
        builder.clearArea(b.x, b.y, b.width, b.height);

        if (type === 'army_tent') {
            const isLeftSide = b.x < builder.width / 2;
            const tuckedX = isLeftSide ? 3 : builder.width - 13;
            const isFacingEast = isLeftSide;
            const tentW = 10, tentH = 6;
            
            builder.clearArea(tuckedX + 1, b.y + 1, tentW, tentH);
            builder.drawArmyTent(tuckedX, b.y, isFacingEast);
        } else {
            builder.drawSpecialBuilding(b, type);
        }
    });
  }
}

// Silence verbose logs
console.log = () => {};

function isInsideBuilding(x, y, buildings) {
  for (const b of buildings) {
    if (x >= b.x && x < b.x + b.width && y >= b.y && y < b.y + b.height) {
      return b;
    }
  }
  return null;
}

async function runTest() {
  const generator = new TemplateMapGenerator();
  // Register our patched generator
  generator.generators.set('mirrored_winding_road', new PatchedMirroredWindingRoadGenerator());
  
  let totalViolations = 0;
  const runs = 1000;
  
  for (let i = 0; i < runs; i++) {
    const mapData = generator.generateFromTemplate('mirrored_winding_road', {
      mapNumber: 5,
      roadThickness: 5,
      sidewalkThickness: 1
    });
    
    const buildings = mapData.metadata.buildings;
    const specialBuildings = mapData.metadata.specialBuildings || [];
    
    for (const b of specialBuildings) {
      const icons = mapData.metadata.placeIcons.filter(icon => icon.subtype === b.type || (b.type === 'gas_station' && icon.subtype === 'fuelpump'));
      
      for (const icon of icons) {
        const inside = isInsideBuilding(icon.x, icon.y, buildings);
        if (inside) {
          totalViolations++;
        }
      }
    }
  }
  
  process.stdout.write(`Total sign-inside-building violations across ${runs} runs with patch on Mirrored Winding Road: ${totalViolations}\n`);
}

runTest().catch(err => {
  process.stdout.write(err.stack + '\n');
});
