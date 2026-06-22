import { TemplateMapGenerator } from '../client/src/game/map/TemplateMapGenerator.js';
import { ZombieSpawner } from '../client/src/game/utils/ZombieSpawner.js';
import { LootGenerator } from '../client/src/game/map/LootGenerator.js';
import { GameMap } from '../client/src/game/map/GameMap.js';

async function runVerification() {
  console.log("Initializing TemplateMapGenerator...");
  const generator = new TemplateMapGenerator();

  console.log("Generating branching_road map...");
  const mapData = generator.generateFromTemplate('branching_road', { seed: 12345 });

  console.log(`Generated map dimensions: ${mapData.width}x${mapData.height}`);

  const ts = mapData.metadata.townSquare;
  const compound = mapData.metadata.townSquareCompound;

  if (!ts) {
    throw new Error("FAIL: townSquare metadata not found!");
  }
  if (!compound) {
    throw new Error("FAIL: townSquareCompound metadata not found!");
  }

  console.log("Town Square bounds:", ts);
  console.log("Compound bounds:", compound);

  // 1. Verify top and bottom sidewalk tiles ( boulevard crossing )
  const mapCenterX = Math.floor(mapData.width / 2);
  const STREET_HALF = 3;
  
  // plaza.top = ts.y - STREET_HALF - 1 = ts.y - 4
  // plaza.bottom = ts.y + ts.height + STREET_HALF + 1 = ts.y + ts.height + 4
  const plazaTop = ts.y - 4;
  const plazaBottom = ts.y + ts.height + 4;

  const topCrossingY = plazaTop + STREET_HALF;      // ts.y - 1 = 109
  const bottomCrossingY = plazaBottom - STREET_HALF;  // ts.y + ts.height + 1 = 151
  
  const outerTopCrossingY = plazaTop - STREET_HALF;      // ts.y - 7 = 103
  const outerBottomCrossingY = plazaBottom + STREET_HALF;  // ts.y + ts.height + 7 = 157

  console.log(`Verifying sidewalk crossings at top (y=${topCrossingY}) and bottom (y=${bottomCrossingY})...`);
  for (let x = mapCenterX - 5; x <= mapCenterX + 5; x++) {
    const topCrossingTile = mapData.tiles[topCrossingY][x];
    const bottomCrossingTile = mapData.tiles[bottomCrossingY][x];
    if (topCrossingTile.terrain !== 'sidewalk') {
      throw new Error(`FAIL: Top inner crossing tile at (${x}, ${topCrossingY}) should be sidewalk but is ${topCrossingTile.terrain}`);
    }
    if (bottomCrossingTile.terrain !== 'sidewalk') {
      throw new Error(`FAIL: Bottom inner crossing tile at (${x}, ${bottomCrossingY}) should be sidewalk but is ${bottomCrossingTile.terrain}`);
    }
  }

  // Verify outer crossings are road (not sidewalk) inside the road lane width
  for (let x = mapCenterX - 4; x <= mapCenterX + 4; x++) {
    const outerTopTile = mapData.tiles[outerTopCrossingY][x];
    const outerBottomTile = mapData.tiles[outerBottomCrossingY][x];
    if (outerTopTile.terrain === 'sidewalk') {
      throw new Error(`FAIL: Outer top crossing at (${x}, ${outerTopCrossingY}) should be road/other, but is sidewalk`);
    }
    if (outerBottomTile.terrain === 'sidewalk') {
      throw new Error(`FAIL: Outer bottom crossing at (${x}, ${outerBottomCrossingY}) should be road/other, but is sidewalk`);
    }
  }
  console.log("SUCCESS: Sidewalk crossings verified!");

  // 2. Verify fence bounds
  const { x1, y1, x2, y2 } = compound.fenceBounds;
  if (x1 !== ts.x || y1 !== ts.y || x2 !== ts.x + ts.width - 1 || y2 !== ts.y + ts.height - 1) {
    throw new Error("FAIL: fence bounds don't match townSquare bounds.");
  }

  // 3. Verify fence is drawn (except at the gate)
  for (let x = x1; x <= x2; x++) {
    const tileTop = mapData.tiles[y1][x];
    const tileBottom = mapData.tiles[y2][x];

    if (tileTop.terrain !== 'fence') {
      throw new Error(`FAIL: Top edge tile at (${x}, ${y1}) should be fence but is ${tileTop.terrain}`);
    }

    // Bottom edge contains the gate at mapCenterX - 1 to mapCenterX + 1 (which are paved with sidewalk)
    if (x >= mapCenterX - 1 && x <= mapCenterX + 1) {
      if (tileBottom.terrain !== 'sidewalk') {
        throw new Error(`FAIL: Gate tile at (${x}, ${y2}) should be sidewalk but is ${tileBottom.terrain}`);
      }
    } else {
      if (tileBottom.terrain !== 'fence') {
        throw new Error(`FAIL: Bottom edge tile at (${x}, ${y2}) should be fence but is ${tileBottom.terrain} (centerX=${mapCenterX})`);
      }
    }
  }
  console.log("SUCCESS: Fence and gate correctly verified!");

  // 4. Verify no windows inside the compound building
  const windowsInBuilding = mapData.metadata.windows.filter(w => 
    w.x >= compound.x && w.x < compound.x + compound.width &&
    w.y >= compound.y && w.y < compound.y + compound.height
  );
  if (windowsInBuilding.length > 0) {
    throw new Error(`FAIL: Windows found in central building metadata: ${JSON.stringify(windowsInBuilding)}`);
  }
  console.log("SUCCESS: Zero windows in building verified!");

  // 5. Verify only double doors at the center of the south wall
  const doorsInBuilding = mapData.metadata.doors.filter(d =>
    d.x >= compound.x && d.x < compound.x + compound.width &&
    d.y >= compound.y && d.y < compound.y + compound.height
  );
  
  if (doorsInBuilding.length !== 2) {
    throw new Error(`FAIL: Expected exactly 2 doors in building, but found ${doorsInBuilding.length}: ${JSON.stringify(doorsInBuilding)}`);
  }

  const southY = compound.y + compound.height - 1;
  const doorX1 = mapCenterX - 1;
  const doorX2 = mapCenterX;

  const hasDoor1 = doorsInBuilding.some(d => d.x === doorX1 && d.y === southY && d.edge === 's');
  const hasDoor2 = doorsInBuilding.some(d => d.x === doorX2 && d.y === southY && d.edge === 's');

  if (!hasDoor1 || !hasDoor2) {
    throw new Error(`FAIL: Double doors should be at (${doorX1}, ${southY}) and (${doorX2}, ${southY}) with edge 's'. Found: ${JSON.stringify(doorsInBuilding)}`);
  }
  console.log("SUCCESS: Double doors verified!");

  // 6. Verify building interior is completely empty (no interior walls)
  for (let y = compound.y + 1; y < compound.y + compound.height - 1; y++) {
    for (let x = compound.x + 1; x < compound.x + compound.width - 1; x++) {
      const tile = mapData.tiles[y][x];
      if (tile.edgeWalls && (tile.edgeWalls.n || tile.edgeWalls.s || tile.edgeWalls.w || tile.edgeWalls.e)) {
        throw new Error(`FAIL: Interior tile at (${x}, ${y}) has edge walls: ${JSON.stringify(tile.edgeWalls)}`);
      }
      if (tile.terrain !== 'floor') {
        throw new Error(`FAIL: Interior tile at (${x}, ${y}) has terrain ${tile.terrain} instead of floor.`);
      }
    }
  }
  console.log("SUCCESS: No interior walls/windows verified!");

  // 7. Verify no zombie or loot spawns inside the walls of the compound
  console.log("Instantiating GameMap and applying template...");
  const gameMap = new GameMap(mapData.width, mapData.height);
  
  await generator.applyToGameMap(gameMap, mapData);
  console.log("Template successfully applied to GameMap!");

  // Verify barriers exist and are unwalkable
  console.log("Verifying barrier entities at fence opening...");
  const leftBarrierTile = gameMap.getTile(109, 149);
  const rightBarrierTile = gameMap.getTile(111, 149);

  const leftBarrier = leftBarrierTile.contents.find(e => e.type === 'place_icon' && e.subtype === 'barrier');
  const rightBarrier = rightBarrierTile.contents.find(e => e.type === 'place_icon' && e.subtype === 'barrier');

  if (!leftBarrier) {
    throw new Error("FAIL: Left barrier not found at (109, 149)");
  }
  if (!rightBarrier) {
    throw new Error("FAIL: Right barrier not found at (111, 149)");
  }
  if (!leftBarrier.blocksMovement || !rightBarrier.blocksMovement) {
    throw new Error("FAIL: Barriers should block movement!");
  }
  console.log("SUCCESS: Barriers verified!");

  // Verify harvestable crops exist
  console.log("Verifying harvestable crops...");
  const expectedCrops = [
    { x: 103, defId: 'provision.harvestable_tomato' },
    { x: 105, defId: 'provision.harvestable_carrot' },
    { x: 107, defId: 'provision.harvestable_corn' }
  ];

  expectedCrops.forEach(cropType => {
    for (let cy = 144; cy <= 147; cy++) {
      const tile = gameMap.getTile(cropType.x, cy);
      const cropItem = tile.contents.find(e => e.type === 'item' && e.defId === cropType.defId);
      if (!cropItem) {
        throw new Error(`FAIL: Expected crop ${cropType.defId} at (${cropType.x}, ${cy})`);
      }
    }
  });
  console.log("SUCCESS: All 12 harvestable crops verified!");

  // Verify rain catchers exist
  console.log("Verifying rain catchers...");
  const rcCols = [113, 115];
  const rcRows = [144, 146, 148];

  rcCols.forEach(cx => {
    rcRows.forEach(cy => {
      const tile = gameMap.getTile(cx, cy);
      const rcItem = tile.contents.find(e => e.type === 'item' && e.defId === 'provision.rain_collector');
      if (!rcItem) {
        throw new Error(`FAIL: Expected rain collector at (${cx}, ${cy})`);
      }
    });
  });
  console.log("SUCCESS: All 6 rain catchers verified!");

  // Run zombie spawning
  console.log("Running ZombieSpawner...");
  ZombieSpawner.spawnZombies(gameMap, null, { basicCount: 100, maxTotal: 200 });

  // Run loot generation
  console.log("Running LootGenerator...");
  const lootGenerator = new LootGenerator();
  lootGenerator.spawnLoot(gameMap, 1, {});

  // Check if any zombie or item was spawned inside the compound
  console.log("Verifying no random spawns inside compound...");
  let spawnsCount = 0;
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      const tile = gameMap.getTile(x, y);
      if (tile.contents.length > 0) {
        const invalidContents = tile.contents.filter(e => {
          if (e.type === 'zombie') return true;
          if (e.type === 'item') {
            if (e.defId === 'placeable.exit') return false;
            if (e.defId === 'provision.harvestable_tomato' ||
                e.defId === 'provision.harvestable_carrot' ||
                e.defId === 'provision.harvestable_corn' ||
                e.defId === 'provision.rain_collector') {
              return false;
            }
            return true;
          }
          return false;
        });

        if (invalidContents.length > 0) {
          console.error(`FAIL: Found illegal spawn at (${x}, ${y}):`, invalidContents.map(e => `${e.type}:${e.id || e.name || e.defId}`));
          spawnsCount += invalidContents.length;
        }
      }
    }
  }

  if (spawnsCount > 0) {
    throw new Error(`FAIL: Found ${spawnsCount} illegal spawns inside compound walls.`);
  }

  console.log("SUCCESS: No random spawns found inside compound walls!");
  console.log("ALL VERIFICATIONS PASSED SUCCESSFULLY!");
}

runVerification().catch(e => {
  console.error(e.stack || e.message);
  process.exit(1);
});
