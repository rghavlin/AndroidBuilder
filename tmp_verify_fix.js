import { TemplateMapGenerator } from './client/src/game/map/TemplateMapGenerator.js';

// Mock MapData
const mapData = {
    width: 35,
    height: 125,
    tiles: [],
    metadata: {
        doors: [],
        placeIcons: [],
        specialBuildings: []
    }
};

// Mock layout
const layout = Array(125).fill().map(() => Array(35).fill('grass'));

const generator = new TemplateMapGenerator();

// Force specific parameters for testing right side
const width = 35;
const height = 125;
const rightBuildingZoneStart = 25; // Example
const specialBuildingY = 50;
const specialBuildingHeight = 12;
const buildingBuffer = 2;

console.log('Running building placement test...');

// Simulate placeBuildingsOnRoad logic for right side
const rightEndY = specialBuildingY - 2;
generator.placeBuildingsInZone(layout, rightBuildingZoneStart, width - 2, buildingBuffer, rightEndY,
    6, 10, 8, 12, 2, 10, mapData);

const rightStartY = specialBuildingY + specialBuildingHeight + 2;
// The fix was adding width - 2 here
generator.placeBuildingsInZone(layout, rightBuildingZoneStart, width - 2, rightStartY, height - buildingBuffer,
    6, 10, 8, 12, 2, 10, mapData);

// Check if any buildings exist after the special building (Y > 64)
let buildingsAfter = 0;
for (let y = rightStartY; y < height - buildingBuffer; y++) {
    for (let x = rightBuildingZoneStart; x < width - 1; x++) {
        if (layout[y][x] === 'building') {
            buildingsAfter++;
        }
    }
}

console.log(`Buildings after special building: ${buildingsAfter}`);

if (buildingsAfter > 0) {
    console.log('SUCCESS: Buildings generated successfully after special building.');
} else {
    console.log('FAILURE: No buildings generated after special building.');
    process.exit(1);
}
