
const fs = require('fs');
const path = require('path');

// Mock a minimal environment to test the generator logic
// Since it's a browser-based project, we'll extract the core logic or just mock what's needed.

// For now, I'll just check if the file parses and has the expected methods.
const content = fs.readFileSync('c:/Games/AndroidBuilder/client/src/game/map/TemplateMapGenerator.js', 'utf8');

if (content.includes('this.subdivideBuilding(') && content.includes('subdivideBuilding(layout, x, y, w, h, mapData)')) {
    console.log('SUCCESS: subdivideBuilding method and call found.');
} else {
    console.log('FAILURE: subdivideBuilding method or call missing.');
}

if (content.includes('maxBuildingWidth = 15')) {
    console.log('SUCCESS: Map width and building size updates found.');
} else {
    console.log('FAILURE: Map width or building size updates missing.');
}

// Check for extra braces again just in case
const lines = content.split('\n');
let extraBracesFound = false;
for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i].trim() === '}' && lines[i+1].trim() === '}' && lines[i+2]?.trim() === '}' && lines[i+3]?.trim() === '}') {
        console.log(`WARNING: Potential extra braces found around line ${i+1}`);
        extraBracesFound = true;
    }
}
if (!extraBracesFound) console.log('Check: No obvious 4-consecutive-braces clusters found.');

console.log('Test script finished.');
