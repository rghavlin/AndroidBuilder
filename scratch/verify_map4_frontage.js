import { TemplateMapGenerator } from '../client/src/game/map/TemplateMapGenerator.js';

// Silence console.log to keep output clean
const originalLog = console.log;
console.log = () => {};

function isInsideBuilding(x, y, buildings) {
  for (const b of buildings) {
    if (x >= b.x && x < b.x + b.width && y >= b.y && y < b.y + b.height) {
      return b;
    }
  }
  return null;
}

async function verifyMap4() {
  const generator = new TemplateMapGenerator();
  
  let totalViolations = 0;
  
  for (let i = 0; i < 200; i++) {
    const mapData = generator.generateFromTemplate('winding_road', {
      mapNumber: 4,
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
          originalLog(`[VIOLATION] Iteration ${i}: Special building ${b.type} at (${b.x}, ${b.y}) faces ${b.frontage}. Door at (${b.entranceX}, ${b.entranceY}).`);
          originalLog(`  Sign is at (${icon.x}, ${icon.y}), which is INSIDE building of type ${inside.type} at (${inside.x}, ${inside.y}, size ${inside.width}x${inside.height})!`);
        }
      }
    }
  }
  
  originalLog(`Total sign-inside-building violations across 200 runs: ${totalViolations}`);
}

verifyMap4().catch(originalLog);
