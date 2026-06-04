import { TemplateMapGenerator } from './client/src/game/map/TemplateMapGenerator.js';

// Mock GameMap to avoid all the dependencies
class MockGameMap {
    constructor(w, h) {
        this.width = w;
        this.height = h;
        this.entities = [];
        this.tiles = Array(h).fill().map((_, y) => Array(w).fill().map((_, x) => ({
            x,
            y,
            terrain: 'grass',
            edgeWalls: { n: false, e: false, s: false, w: false }
        })));
    }
    initializeMap() {
        this.tiles = Array(this.height).fill().map((_, y) => Array(this.width).fill().map((_, x) => ({
            x,
            y,
            terrain: 'grass',
            edgeWalls: { n: false, e: false, s: false, w: false }
        })));
    }
    setTerrain(x, y, terrain) {
        if (this.tiles[y] && this.tiles[y][x]) {
            this.tiles[y][x].terrain = terrain;
        }
    }
    setItemsOnTile(x, y, items) {
        if (this.tiles[y] && this.tiles[y][x]) {
            this.tiles[y][x].inventoryItems = items;
        }
    }
    addEntity(e, x, y) { 
        this.entities.push({ entity: e, x, y }); 
    }
    getTile(x, y) {
        if (this.tiles[y] && this.tiles[y][x]) {
            return this.tiles[y][x];
        }
        return null;
    }
}

async function testGeneration() {
    console.log("Starting TemplateMapGenerator test...");
    const generator = new TemplateMapGenerator();
    
    // Generate a road map which spawns buildings
    const mapData = generator.generateFromTemplate('road', {
        width: 35,
        height: 125,
        roadThickness: 5,
        sidewalkThickness: 1
    });

    console.log("Map metadata summary:");
    console.log("- Special Buildings:", mapData.metadata.specialBuildings?.length || 0);
    console.log("- Doors:", mapData.metadata.doors?.length || 0);
    console.log("- Place Icons:", mapData.metadata.placeIcons?.length || 0);

    if (mapData.metadata.specialBuildings && mapData.metadata.specialBuildings.length === 1) {
        const b = mapData.metadata.specialBuildings[0];
        console.log(`SUCCESS: Specialized building found: ${b.type} at (${b.x}, ${b.y})`);
        
        // Check for icons related to this building
        const icons = mapData.metadata.placeIcons || [];
        const hasRelatedIcon = icons.some(icon => {
            if (b.type === 'gas_station') return icon.subtype === 'fuelpump';
            return icon.subtype === (b.type === 'grocer' ? 'grocer' : (b.type === 'police' ? 'police' : 'firestation'));
        });
        
        if (hasRelatedIcon) {
            console.log("SUCCESS: Related icon found in metadata.");
        } else {
            console.error("FAILURE: No related icon found for", b.type);
        }
    } else {
        console.error("FAILURE: Special building count mismatch:", mapData.metadata.specialBuildings?.length);
    }
    
    console.log("Testing applyToGameMap...");
    const mockMap = new MockGameMap(35, 125);
    await generator.applyToGameMap(mockMap, mapData);
    console.log(`Entities added to GameMap: ${mockMap.entities.length}`);

    // Verify that edge walls are transferred to the gameMap tiles
    let edgeWallsCount = 0;
    for (let y = 0; y < mockMap.height; y++) {
        for (let x = 0; x < mockMap.width; x++) {
            const tile = mockMap.tiles[y][x];
            if (tile.edgeWalls && (tile.edgeWalls.n || tile.edgeWalls.e || tile.edgeWalls.s || tile.edgeWalls.w)) {
                edgeWallsCount++;
            }
        }
    }
    console.log(`Tiles with edgeWalls on mock GameMap: ${edgeWallsCount}`);
    
    // Check if special buildings were stored on gameMap
    if (mockMap.specialBuildings && mockMap.specialBuildings.length === 1) {
        console.log("SUCCESS: Special buildings metadata stored on GameMap.");
    } else {
        console.error("FAILURE: Special buildings metadata NOT stored on GameMap.");
    }

    console.log("Test completed.");
}

testGeneration().catch(err => {
    console.error("TEST FAILED:");
    console.error(err);
    process.exit(1);
});
