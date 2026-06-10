import { TemplateMapGenerator } from '../client/src/game/map/TemplateMapGenerator.js';

// Silence console.log
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
  let totalViolations = 0;
  const runs = 1000;
  
  // Test winding_road (map 4)
  for (let i = 0; i < runs; i++) {
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
          process.stdout.write(`[VIOLATION Winding] Run ${i}: ${b.type} sign at (${icon.x}, ${icon.y}) inside ${inside.type} at (${inside.x}, ${inside.y})\n`);
        }
      }
    }
  }
  
  // Test mirrored_winding_road (map 5)
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
          process.stdout.write(`[VIOLATION Mirrored] Run ${i}: ${b.type} sign at (${icon.x}, ${icon.y}) inside ${inside.type} at (${inside.x}, ${inside.y})\n`);
        }
      }
    }
  }
  
  process.stdout.write(`Total production code violations across ${runs * 2} runs: ${totalViolations}\n`);
}

runTest().catch(err => {
  process.stdout.write(err.stack + '\n');
});
