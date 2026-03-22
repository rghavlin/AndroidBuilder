import { TemplateMapGenerator } from './client/src/game/map/TemplateMapGenerator.js';

async function verifyRandomBuildings() {
  const generator = new TemplateMapGenerator();
  const results = {};
  
  console.log('Generating 10 maps to verify special building randomization:');
  
  for (let i = 0; i < 10; i++) {
    const mapData = generator.generateFromTemplate('road', {});
    const specialBuilding = mapData.metadata.specialBuildings[0];
    const type = specialBuilding ? specialBuilding.type : 'none';
    
    results[type] = (results[type] || 0) + 1;
    console.log(`Map ${i + 1}: ${type}`);
  }
  
  console.log('\nSummary of building types:');
  console.log(JSON.stringify(results, null, 2));
  
  const uniqueTypes = Object.keys(results).filter(t => t !== 'none');
  if (uniqueTypes.length > 1) {
    console.log('\n✅ PASS: Multiple unique building types detected!');
  } else if (uniqueTypes.length === 1) {
    console.log('\n⚠️ WARNING: Only one building type detected. If this is "police", it might still be hardcoded, or just lucky (1 in 4^10 chance of same type in 10 runs).');
  } else {
    console.log('\n❌ FAIL: No special buildings detected.');
  }
}

verifyRandomBuildings().catch(console.error);
