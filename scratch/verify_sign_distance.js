import { TemplateMapGenerator } from '../client/src/game/map/TemplateMapGenerator.js';

async function verifyDistance() {
    const generator = new TemplateMapGenerator();
    let foundGasStation = false;
    let foundOther = false;
    let attempts = 0;
    
    while ((!foundGasStation || !foundOther) && attempts < 50) {
        attempts++;
        const mapData = generator.generateFromTemplate('road', {
            width: 35,
            height: 125,
            roadThickness: 5,
            sidewalkThickness: 1
        });
        
        for (const b of mapData.metadata.specialBuildings) {
            if (b.type === 'gas_station') {
                foundGasStation = true;
            } else {
                foundOther = true;
            }
            
            const icons = mapData.metadata.placeIcons.filter(icon => icon.subtype === b.type || (b.type === 'gas_station' && icon.subtype === 'fuelpump'));
            if (icons.length > 0) {
                console.log(`Building: ${b.type}, frontage: ${b.frontage}, door: (${b.entranceX}, ${b.entranceY})`);
                for (const icon of icons) {
                    const dx = Math.abs(icon.x - b.entranceX);
                    const dy = Math.abs(icon.y - b.entranceY);
                    console.log(`  Icon: ${icon.subtype} at (${icon.x}, ${icon.y}), distance: dx=${dx}, dy=${dy}`);
                }
            }
        }
    }
}

verifyDistance().catch(console.error);
