
import { LabMapGenerator } from './client/src/game/map/generators/LabMapGenerator.js';
import { MapBuilder } from './client/src/game/map/MapBuilder.js';

async function testLabGen() {
    console.log("Testing LabMapGenerator...");
    try {
        const width = 70;
        const height = 84;
        const builder = new MapBuilder(width, height);
        const gen = new LabMapGenerator();
        
        const config = { mapNumber: 10 };
        gen.generate(config, builder);
        
        const mapData = builder.getFinalMapData('lab', config);
        console.log("Map generated successfully!");
        console.log("Buildings count:", mapData.metadata.buildings.length);
        console.log("Doors count:", mapData.metadata.doors.length);
    } catch (error) {
        console.error("GENERATION ERROR:", error);
    }
}

testLabGen();
