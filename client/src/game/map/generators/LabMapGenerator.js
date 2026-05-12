import { BaseMapGenerator } from './BaseMapGenerator.js';

/**
 * LabMapGenerator - Procedural generation for the Map 10 Laboratory facility
 * Features a split-road loop, perimeter fencing, and a large central lab building.
 * Refined 70x84 compact layout with 4-wide corridor and 5-wide side rooms.
 */
export class LabMapGenerator extends BaseMapGenerator {
  generate(config, builder) {
    const context = { 
        mapNumber: config.mapNumber || 1,
        roadThickness: 5,
        sidewalkThickness: 1
    };

    this.passTopology(builder, context);
    this.passZoning(builder, context);
    this.passSpecialization(builder, context);
    this.passDetails(builder, context);
  }

  /**
   * PASS 1: Topology - Basic layout and structures
   */
  passTopology(builder, context) {
    const { width, height } = builder;
    const roadT = context.roadThickness;

    builder.fill('grass');

    // 1. Perimeter Fence (All four sides)
    for (let x = 0; x < width; x++) {
      builder.setTerrain(x, 0, 'fence');
      builder.setTerrain(x, height - 1, 'fence');
    }
    for (let y = 0; y < height; y++) {
      builder.setTerrain(0, y, 'fence');
      builder.setTerrain(width - 1, y, 'fence');
    }

    // 2. Road Loop (Closed Rectangle)
    // Vertical: x=14-18, 53-57. Horizontal: y=4-8, 75-79.
    const lX = 14, rX = 53, tY = 4, bY = 75;

    // Vertical Legs
    for (let y = tY; y <= bY + roadT - 1; y++) {
        for (let tx = lX; tx < lX + roadT; tx++) builder.setTerrain(tx, y, 'road');
        for (let tx = rX; tx < rX + roadT; tx++) builder.setTerrain(tx, y, 'road');
    }

    // Horizontal Legs
    for (let x = lX; x <= rX + roadT - 1; x++) {
        for (let ty = tY; ty < tY + roadT; ty++) builder.setTerrain(x, ty, 'road');
        for (let ty = bY; ty < bY + roadT; ty++) builder.setTerrain(x, ty, 'road');
    }

    // 3. Entry/Exit Strips (North and South)
    const centerX = 35;
    const entryX = 33;
    const entryW = 5;
    for (let x = entryX; x < entryX + entryW; x++) {
        for (let y = 0; y < tY; y++) builder.setTerrain(x, y, 'road');
        for (let y = bY + roadT; y < height; y++) builder.setTerrain(x, y, 'road');
    }

    // 4. Sidewalks (Clean logic: only draw if tile is currently grass)
    const setSW = (x, y) => {
        if (x < 0 || x >= width || y < 0 || y >= height) return;
        if (builder.getTerrain(x, y) === 'grass') builder.setTerrain(x, y, 'sidewalk');
    };

    // Main Loop Sidewalks
    for (let y = tY - 1; y <= bY + roadT; y++) {
        setSW(lX - 1, y); setSW(lX + roadT, y); // Left Road
        setSW(rX - 1, y); setSW(rX + roadT, y); // Right Road
    }
    for (let x = lX - 1; x <= rX + roadT; x++) {
        setSW(x, tY - 1); setSW(x, tY + roadT); // Top Road
        setSW(x, bY - 1); setSW(x, bY + roadT); // Bottom Road
    }

    // Entry Road Sidewalks (Side strips)
    for (let y = 0; y < tY; y++) {
        setSW(entryX - 1, y);
        setSW(entryX + entryW, y);
    }
    for (let y = bY + roadT; y < height; y++) {
        setSW(entryX - 1, y);
        setSW(entryX + entryW, y);
    }

    // 5. Compound Fence (Inner ring)
    const fL = 22, fR = 49, fT = 12, fB = 71;
    this._drawHollowRect(builder, fL, fR, fT, fB, 'fence');
    
    // Openings in compound fence (aligned with 4-wide corridor center cols 34-37)
    for (let x = 34; x <= 37; x++) {
        builder.setTerrain(x, fT, 'grass');
        builder.setTerrain(x, fB, 'grass');
    }

    // 6. Lab Building Shell (Width 18, Height 50)
    this._drawLabBuilding(builder, 27, 17, 18, 50);
  }

  /**
   * PASS 2: Zoning - Placing ancillary structures
   */
  passZoning(builder, context) {
    const { width, height } = builder;

    // 1. Army Tents (3 on each wing, evenly spaced)
    const tentPositions = [
        // Left Wing (x=1)
        { x: 1, y: 15, facing: true },
        { x: 1, y: 39, facing: true },
        { x: 1, y: 63, facing: true },
        // Right Wing (x=58)
        { x: 58, y: 15, facing: false },
        { x: 58, y: 39, facing: false },
        { x: 58, y: 63, facing: false }
    ];

    tentPositions.forEach(pos => {
        builder.clearArea(pos.x + 1, pos.y + 1, 10, 6);
        builder.drawArmyTent(pos.x, pos.y, pos.facing);
    });
  }

  passSpecialization(builder, context) {
  }

  /**
   * PASS 4: Details - Metadata and final touches
   */
  passDetails(builder, context) {
    const { width, height } = builder;
    const startX = 35;

    // Transition points
    builder.setTerrain(startX, 0, 'transition');
    builder.setTerrain(startX, height - 1, 'transition');

    // Metadata
    builder.metadata.spawnZones = {
        roadStart: [{ x: startX, y: height - 2 }],
        transitionPoints: {
            north: { x: startX, y: 0 },
            south: { x: startX, y: height - 1 }
        }
    };
  }

  /**
   * Helper: Draw the complex Lab building interior
   */
  _drawLabBuilding(builder, x, y, w, h) {
    // Shell
    for (let ty = y; ty < y + h; ty++) {
        for (let tx = x; tx < x + w; tx++) {
            const isPerim = (ty === y || ty === y + h - 1 || tx === x || tx === x + w - 1);
            builder.setTerrain(tx, ty, isPerim ? 'building' : 'floor');
        }
    }

    // Central Corridor (4 wide)
    // Wall: x+6. Hall: x+7 to x+10. Wall: x+11.
    // Rooms Left: x+1 to x+5 (5 wide). Rooms Right: x+12 to x+16 (5 wide).
    const hallXStart = x + 7;
    for (let ty = y + 1; ty < y + h - 1; ty++) {
        builder.setTerrain(hallXStart - 1, ty, 'building'); // Col 6 (Left wall)
        for (let hx = hallXStart; hx < hallXStart + 4; hx++) builder.setTerrain(hx, ty, 'floor'); // Col 7-10 (Hall)
        builder.setTerrain(hallXStart + 4, ty, 'building'); // Col 11 (Right wall)
    }

    // Room Subdivisions: Left Wing (x+1 to x+5)
    const wingL = x + 1, wingR = x + 5;
    const roomH = 12;
    let lastWallY = y;
    for (let ry = y + roomH; ry < y + h - 8; ry += roomH) {
        for (let tx = wingL; tx <= wingR; tx++) builder.setTerrain(tx, ry, 'building');
        const doorY = lastWallY + 1 + Math.floor((ry - (lastWallY + 1)) / 2);
        if (doorY > y && doorY < y + h - 1) {
            builder.setTerrain(hallXStart - 1, doorY, 'floor');
            builder.metadata.doors.push({ x: hallXStart - 1, y: doorY, isLocked: false, isOpen: false });
        }
        lastWallY = ry;
    }
    // Door for the final left room (only if there's space)
    const finalDoorLY = lastWallY + 1 + Math.floor((y + h - 1 - (lastWallY + 1)) / 2);
    if (finalDoorLY > lastWallY && finalDoorLY < y + h - 1) {
        builder.setTerrain(hallXStart - 1, finalDoorLY, 'floor');
        builder.metadata.doors.push({ x: hallXStart - 1, y: finalDoorLY, isLocked: false, isOpen: false });
    }

    // Room Subdivisions: Right Wing (x+12 to x+16)
    const rWingL = x + 12, rWingR = x + 16;
    lastWallY = y;
    for (let ry = y + roomH; ry < y + h - 8; ry += roomH) {
        for (let tx = rWingL; tx <= rWingR; tx++) builder.setTerrain(tx, ry, 'building');
        const doorY = lastWallY + 1 + Math.floor((ry - (lastWallY + 1)) / 2);
        if (doorY > y && doorY < y + h - 1) {
            builder.setTerrain(hallXStart + 4, doorY, 'floor');
            builder.metadata.doors.push({ x: hallXStart + 4, y: doorY, isLocked: false, isOpen: false });
        }
        lastWallY = ry;
    }
    // Door for the final right room (only if there's space)
    const finalDoorRY = lastWallY + 1 + Math.floor((y + h - 1 - (lastWallY + 1)) / 2);
    if (finalDoorRY > lastWallY && finalDoorRY < y + h - 1) {
        builder.setTerrain(hallXStart + 4, finalDoorRY, 'floor');
        builder.metadata.doors.push({ x: hallXStart + 4, y: finalDoorRY, isLocked: false, isOpen: false });
    }

    // Main Entrance Doors (Top and Bottom, 2 centered)
    const doorCols = [hallXStart + 1, hallXStart + 2];
    const wallCols = [hallXStart, hallXStart + 3];

    doorCols.forEach(hx => {
        builder.setTerrain(hx, y, 'floor');
        builder.setTerrain(hx, y + h - 1, 'floor');
        builder.metadata.doors.push({ x: hx, y: y, isLocked: false, isOpen: false });
        builder.metadata.doors.push({ x: hx, y: y + h - 1, isLocked: false, isOpen: false });
    });

    wallCols.forEach(hx => {
        builder.setTerrain(hx, y, 'building');
        builder.setTerrain(hx, y + h - 1, 'building');
    });

    // Windows
    builder.placeWindows(x, y, w, h);

    // Ensure no windows at the 2-tile entry walls (Top and Bottom)
    wallCols.forEach(hx => {
        builder.metadata.windows = builder.metadata.windows.filter(w => !(w.x === hx && (w.y === y || w.y === y + h - 1)));
        // Re-enforce building terrain just in case
        builder.setTerrain(hx, y, 'building');
        builder.setTerrain(hx, y + h - 1, 'building');
    });

    // Register
    builder.registerBuilding('lab', x, y, w, h, { frontage: 'south', entranceX: hallXStart + 1, entranceY: y + h - 1 });
  }

  _drawHollowRect(builder, x1, x2, y1, y2, terrain) {
    for (let x = x1; x <= x2; x++) {
        builder.setTerrain(x, y1, terrain);
        builder.setTerrain(x, y2, terrain);
    }
    for (let y = y1; y <= y2; y++) {
        builder.setTerrain(x1, y, terrain);
        builder.setTerrain(x2, y, terrain);
    }
  }

  getStartPosition(width, height) {
    return { x: 35, y: height - 2 };
  }
}
