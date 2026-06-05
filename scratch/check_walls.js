import { TemplateMapGenerator } from '../client/src/game/map/TemplateMapGenerator.js';

async function checkWalls() {
    const generator = new TemplateMapGenerator();
    let totalGrassWithWalls = 0;
    
    for (let i = 0; i < 20; i++) {
        const mapData = generator.generateFromTemplate('mirrored_winding_road', {
            roadThickness: 5,
            sidewalkThickness: 1,
            mapNumber: 1
        });
        
        let grassWithWalls = 0;
        for (let y = 0; y < mapData.height; y++) {
            for (let x = 0; x < mapData.width; x++) {
                const tile = mapData.tiles[y][x];
                if (tile.terrain === 'grass') {
                    const hasWall = tile.edgeWalls && (tile.edgeWalls.n || tile.edgeWalls.e || tile.edgeWalls.s || tile.edgeWalls.w);
                    if (hasWall) {
                        grassWithWalls++;
                    }
                }
            }
        }
        totalGrassWithWalls += grassWithWalls;
        console.log(`Map ${i}: grass tiles with edge walls = ${grassWithWalls}`);
    }
    console.log(`Total grass tiles with edge walls across 20 maps: ${totalGrassWithWalls}`);
}

checkWalls().catch(console.error);
