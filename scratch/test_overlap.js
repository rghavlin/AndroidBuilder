import { TemplateMapGenerator } from '../client/src/game/map/TemplateMapGenerator.js';

async function testOverlap() {
    const generator = new TemplateMapGenerator();
    
    // Let's generate 100 maps and check for overlaps
    for (let i = 0; i < 100; i++) {
        const mapData = generator.generateFromTemplate('mirrored_winding_road', {
            roadThickness: 5,
            sidewalkThickness: 1,
            mapNumber: 1
        });
        
        const buildings = mapData.metadata.buildings || [];
        const tiles = mapData.tiles;
        
        for (const b of buildings) {
            // Check if any tile inside the building (b.x to b.x + b.width - 1, b.y to b.y + b.height - 1)
            // has terrain 'road' or 'sidewalk'
            let overlapRoad = false;
            let overlapTile = null;
            
            for (let y = b.y; y < b.y + b.height; y++) {
                for (let x = b.x; x < b.x + b.width; x++) {
                    const tile = tiles[y] && tiles[y][x];
                    if (tile && (tile.terrain === 'road' || tile.terrain === 'sidewalk')) {
                        overlapRoad = true;
                        overlapTile = { x, y, terrain: tile.terrain };
                        break;
                    }
                }
                if (overlapRoad) break;
            }
            
            if (overlapRoad) {
                console.log(`OVERLAP DETECTED in map iteration ${i}!`);
                console.log(`Building of type ${b.type} at x=${b.x}, y=${b.y}, w=${b.width}, h=${b.height}, frontage=${b.frontage}`);
                console.log(`Overlapped tile at (${overlapTile.x}, ${overlapTile.y}) with terrain '${overlapTile.terrain}'`);
                return;
            }
        }
    }
    console.log("No overlaps found in 100 maps!");
}

testOverlap().catch(console.error);
