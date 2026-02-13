import { TemplateMapGenerator } from './client/src/game/map/TemplateMapGenerator.js';

const originalLog = console.log;
console.log = () => { }; // Mute internal logs

const generator = new TemplateMapGenerator();
let waterMaps = 0;
const totalMaps = 50;

for (let i = 0; i < totalMaps; i++) {
    const mapData = generator.generateFromTemplate('road');
    let hasWater = false;
    for (let y = 0; y < mapData.height; y++) {
        for (let x = 0; x < mapData.width; x++) {
            if (mapData.tiles[y][x].terrain === 'water') {
                hasWater = true;
                break;
            }
        }
        if (hasWater) break;
    }
    if (hasWater) waterMaps++;
}

originalLog(`Generated ${totalMaps} maps.`);
originalLog(`Maps with water: ${waterMaps} (${(waterMaps / totalMaps * 100).toFixed(1)}%)`);
