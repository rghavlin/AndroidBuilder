import { GameMap } from './client/src/game/map/GameMap.js';
import { TemplateMapGenerator } from './client/src/game/map/TemplateMapGenerator.js';

async function runTest() {
    console.log("=== Running Map Decoration Verification Test ===");

    // 1. Generate a template-based map
    console.log("Generating procedural map using TemplateMapGenerator...");
    const generator = new TemplateMapGenerator();
    // Use the default 'outdoor_area' template to generate a map layout
    const templateMapData = generator.generateFromTemplate('outdoor_area');
    
    // Create an actual GameMap instance and apply the template data
    const map = new GameMap(templateMapData.width, templateMapData.height);
    await generator.applyToGameMap(map, templateMapData);

    // 2. Count placed decorations
    let decorationCount = 0;
    const decorCounts = {};
    const grassTiles = [];

    for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
            const tile = map.getTile(x, y);
            if (tile.terrain === 'grass') {
                grassTiles.push(tile);
            }
            if (tile.decoration) {
                decorationCount++;
                decorCounts[tile.decoration] = (decorCounts[tile.decoration] || 0) + 1;
            }
        }
    }

    console.log(`Total tiles on map: ${map.width * map.height}`);
    console.log(`Grass tiles on map: ${grassTiles.length}`);
    console.log(`Total decorations placed: ${decorationCount} (expected around 8% of grass tiles)`);
    console.log("Decoration distribution:", decorCounts);

    if (decorationCount === 0 && grassTiles.length > 0) {
        throw new Error("FAIL: No decorations were placed on grass tiles!");
    }
    console.log("✅ Placement verification passed.");

    // 3. Serialize and Deserialize Map
    console.log("Serializing map to JSON...");
    const mapJSON = map.toJSON();

    console.log("Deserializing map from JSON...");
    const restoredMap = await GameMap.fromJSON(mapJSON);

    // Verify properties match
    let restoredDecorationCount = 0;
    for (let y = 0; y < restoredMap.height; y++) {
        for (let x = 0; x < restoredMap.width; x++) {
            const originalTile = map.getTile(x, y);
            const restoredTile = restoredMap.getTile(x, y);

            if (originalTile.decoration !== restoredTile.decoration) {
                throw new Error(`FAIL: Decoration desync at (${x}, ${y})! Expected ${originalTile.decoration}, got ${restoredTile.decoration}`);
            }
            if (restoredTile.decoration) {
                restoredDecorationCount++;
            }
        }
    }

    console.log(`Restored decorations count: ${restoredDecorationCount}`);
    if (restoredDecorationCount !== decorationCount) {
        throw new Error(`FAIL: Decoration count mismatch after load! Original: ${decorationCount}, Restored: ${restoredDecorationCount}`);
    }

    console.log("✅ Save/Load serialization verification passed.");
    console.log("=== All Map Decoration Tests PASSED ===");
}

runTest().catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});
