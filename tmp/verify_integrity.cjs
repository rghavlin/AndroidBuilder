
const fs = require('fs');

const content = fs.readFileSync('c:/Games/AndroidBuilder/client/src/game/map/TemplateMapGenerator.js', 'utf8');

let success = true;

if (content.includes('this.subdivideBuilding(') && content.includes('subdivideBuilding(layout, x, y, w, h, mapData)')) {
    console.log('SUCCESS: subdivideBuilding method and call found.');
} else {
    console.log('FAILURE: subdivideBuilding method or call missing.');
    success = false;
}

if (content.includes('maxBuildingWidth = 15')) {
    console.log('SUCCESS: Map width and building size updates found.');
} else {
    console.log('FAILURE: Map width or building size updates missing.');
    success = false;
}

// Check for extra braces
const lines = content.split('\n');
let extraBracesFound = false;
for (let i = 0; i < lines.length - 3; i++) {
    if (lines[i].trim() === '}' && lines[i+1].trim() === '}' && lines[i+2]?.trim() === '}' && lines[i+3]?.trim() === '}') {
        console.log(`WARNING: Potential extra braces found around line ${i+1}`);
        extraBracesFound = true;
        success = false;
    }
}
if (!extraBracesFound) console.log('Check: No obvious 4-consecutive-braces clusters found.');

if (success) {
    console.log('OVERALL: PASS');
} else {
    console.log('OVERALL: FAIL');
    process.exit(1);
}
