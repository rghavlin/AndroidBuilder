import { SPECIAL_BUILDING_LOOT } from '../LootTables.js';
import { createItemFromDef } from '../../inventory/ItemDefs.js';
import { Item } from '../../inventory/Item.js';
import { gameRandom } from '../../utils/SeededRandom.js';
import { LootGenerator } from '../LootGenerator.js';

/**
 * Spawns specialized loot and the Pharmaceutical Synthesizer for the Laboratory building (Map 7).
 *
 * @param {Object} gameMap - The GameMap instance
 * @param {Object} building - Building metadata ({ x, y, width, height, type })
 * @param {Object} buildingRules - Laboratory building rules from LootTables.js
 * @param {Object} lootGen - The LootGenerator instance (for helper methods like isNearDoor and getRandomSubarray)
 */
export function spawnLabBuildingLoot(gameMap, building, buildingRules, lootGen) {
    if (!buildingRules.roomLayout) return;

    const { x, y, width, height, type } = building;
    const layout = buildingRules.roomLayout;
    const nvgRoomIndex = Math.floor(gameRandom.next() * layout.roomsCount);
    const nvgDropIndex = Math.floor(gameRandom.next() * (buildingRules.dropsPerRoom?.min || 2));
    
    const wingWidth = layout.wingWidth;
    const roomHeight = layout.roomHeight;
    const leftX = x + 1;
    const rightX = x + (width - wingWidth - 1);
    const rooms = [];

    for (let ry = y + 1; ry < y + height - 1; ry += roomHeight) {
        const segmentH = Math.min(roomHeight - 1, (y + height - 1) - ry);
        if (segmentH < 3) break;
        rooms.push({ x: leftX, y: ry, w: wingWidth, h: segmentH });
        rooms.push({ x: rightX, y: ry, w: wingWidth, h: segmentH });
    }

    console.log(`[LabLootGenerator] Spawning loot for ${rooms.length} rooms using data-driven rules`);

    // 1. Spawn general room loot and uniques (e.g. Night Vision)
    rooms.forEach((room, rIdx) => {
        const roomFloorTiles = [];
        for (let ty = room.y; ty < room.y + room.h; ty++) {
            for (let tx = room.x; tx < room.x + room.w; tx++) {
                if (!lootGen.isNearDoor(gameMap, tx, ty)) roomFloorTiles.push({ x: tx, y: ty });
            }
        }
        if (roomFloorTiles.length === 0) return;

        const minD = buildingRules.dropsPerRoom?.min || 2;
        const maxD = buildingRules.dropsPerRoom?.max || 3;
        const roomDropCount = minD + Math.floor(gameRandom.next() * (maxD - minD + 1));
        const roomSelectedTiles = lootGen.getRandomSubarray(roomFloorTiles, roomDropCount);

        roomSelectedTiles.forEach((tilePos, dIdx) => {
            const roomItems = [];
            if (gameRandom.next() < 0.5) {
                const medPool = SPECIAL_BUILDING_LOOT[type].medical;
                const med = createItemFromDef(medPool[gameRandom.nextInt(0, medPool.length - 1)]);
                if (med) roomItems.push(med);
            }
            if (gameRandom.next() < 0.7) {
                const techPool = SPECIAL_BUILDING_LOOT[type].tech;
                const tech = createItemFromDef(techPool[gameRandom.nextInt(0, techPool.length - 1)]);
                if (tech) {
                    LootGenerator.applySpawnDefaults(tech, false);
                    roomItems.push(tech);
                }
            }
            
            // Uniques (NVGs etc)
            if (rIdx === nvgRoomIndex && dIdx === nvgDropIndex) {
                const unique = buildingRules.uniques?.[0];
                if (unique) {
                    const item = createItemFromDef(unique.defId);
                    if (item) roomItems.push(item);
                }
            }
            if (roomItems.length > 0) gameMap.setItemsOnTile(tilePos.x, tilePos.y, roomItems);
        });
    });

    // 2. Spawn the Pharmaceutical Synthesizer in a room off the main hall
    if (rooms.length > 0) {
        const synthRoomIdx = Math.floor(gameRandom.next() * rooms.length);
        const synthRoom = rooms[synthRoomIdx];
        const synthFloorTiles = [];
        for (let ty = synthRoom.y; ty < synthRoom.y + synthRoom.h; ty++) {
            for (let tx = synthRoom.x; tx < synthRoom.x + synthRoom.w; tx++) {
                if (!lootGen.isNearDoor(gameMap, tx, ty)) synthFloorTiles.push({ x: tx, y: ty });
            }
        }
        if (synthFloorTiles.length > 0) {
            const synthTile = synthFloorTiles[Math.floor(gameRandom.next() * synthFloorTiles.length)];
            const synthData = createItemFromDef('furniture.pharmaceutical_synthesizer');
            if (synthData) {
                const synthItem = Item.fromJSON(synthData);
                const existingItems = gameMap.getItemsOnTile(synthTile.x, synthTile.y) || [];
                gameMap.setItemsOnTile(synthTile.x, synthTile.y, [...existingItems, synthItem]);
                console.log(`[LabLootGenerator] Spawned Pharmaceutical Synthesizer at (${synthTile.x}, ${synthTile.y}) in room ${synthRoomIdx}`);
            }
        }
    }
}
