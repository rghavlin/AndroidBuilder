import { BaseMapGenerator } from './BaseMapGenerator.js';

const LAYOUT = {
    ROAD: { LEFT_X: 14, RIGHT_X: 53, TOP_Y: 4, BOTTOM_Y: 75, THICKNESS: 5 },
    ENTRY: { CENTER_X: 35, WIDTH: 5 },
    COMPOUND: { LEFT: 22, RIGHT: 49, TOP: 12, BOTTOM: 71 },
    BUILDING: { X: 27, Y: 17, WIDTH: 18, HEIGHT: 50 },
    TENTS: { OFFSET_X: 1, OFFSET_Y: 15, SPACING_Y: 24, COUNT: 3 }
};

export class LabMapGenerator extends BaseMapGenerator {
  generate(config, builder) {
    const context = { 
        mapNumber: config.mapNumber || 1,
        roadThickness: LAYOUT.ROAD.THICKNESS,
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
    const roadT = LAYOUT.ROAD.THICKNESS;

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
    const { LEFT_X: lX, RIGHT_X: rX, TOP_Y: tY, BOTTOM_Y: bY } = LAYOUT.ROAD;

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
    const centerX = LAYOUT.ENTRY.CENTER_X;
    const entryW = LAYOUT.ENTRY.WIDTH;
    const entryX = centerX - Math.floor(entryW / 2);

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
    const { LEFT: fL, RIGHT: fR, TOP: fT, BOTTOM: fB } = LAYOUT.COMPOUND;
    this._drawHollowRect(builder, fL, fR, fT, fB, 'fence');
    
    // Openings in compound fence (aligned with corridor)
    // Corridor center is at building center
    const buildingCenterX = LAYOUT.BUILDING.X + 9; // center of 18-wide building
    for (let x = buildingCenterX - 2; x <= buildingCenterX + 1; x++) {
        builder.setTerrain(x, fT, 'grass');
        builder.setTerrain(x, fB, 'grass');
    }

    // 6. Lab Building Shell
    const { X: bldgX, Y: bldgY, WIDTH: bldgW, HEIGHT: bldgH } = LAYOUT.BUILDING;
    this._drawLabBuilding(builder, bldgX, bldgY, bldgW, bldgH);
  }

  /**
   * PASS 2: Zoning - Placing ancillary structures
   */
  passZoning(builder, context) {
    const { width, height } = builder;
    const { OFFSET_X: ox, OFFSET_Y: oy, SPACING_Y: sy, COUNT: count } = LAYOUT.TENTS;

    // Army Tents
    for (let i = 0; i < count; i++) {
        const yPos = oy + (i * sy);
        
        // Left Wing
        const leftX = ox;
        builder.clearArea(leftX + 1, yPos + 1, 10, 6);
        builder.drawArmyTent(leftX, yPos, true);

        // Right Wing
        const rightX = width - ox - 11; // 11 is tent width? Let's check MapBuilder. 
        // Original was x=58 for width=70. 70-1-11 = 58. Correct.
        builder.clearArea(rightX + 1, yPos + 1, 10, 6);
        builder.drawArmyTent(rightX, yPos, false);
    }
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
    // Shell - set entire building footprint to floor
    for (let ty = y; ty < y + h; ty++) {
        for (let tx = x; tx < x + w; tx++) {
            builder.setTerrain(tx, ty, 'floor');
        }
    }

    // Outer walls as single edge walls
    for (let tx = x; tx < x + w; tx++) {
        builder.setEdgeWall(tx, y, 'n', true);
        builder.setEdgeWall(tx, y + h - 1, 's', true);
    }
    for (let ty = y; ty < y + h; ty++) {
        builder.setEdgeWall(x, ty, 'w', true);
        builder.setEdgeWall(x + w - 1, ty, 'e', true);
    }

    // Corridor calculations
    const hallXStart = x + 7;

    // Room Subdivisions: Left Wing (x to x+6)
    const roomH = 12;
    let lastWallY = y;
    const leftDoorYs = [];
    for (let ry = y + roomH; ry < y + h - 8; ry += roomH) {
        // Draw single edge wall for partition (South edge)
        // Span full length from outer wall (x) to corridor wall (x + 6)
        for (let tx = x; tx <= x + 6; tx++) {
            builder.setEdgeWall(tx, ry, 's', true);
        }
        
        // Calculate door Y for this left wing room
        const doorY = lastWallY + 1 + Math.floor((ry - (lastWallY + 1)) / 2);
        if (doorY > y && doorY < y + h - 1) {
            leftDoorYs.push(doorY);
        }
        lastWallY = ry;
    }
    // Door for the final left room (only if there's space)
    const finalDoorLY = lastWallY + 1 + Math.floor((y + h - 1 - (lastWallY + 1)) / 2);
    if (finalDoorLY > lastWallY && finalDoorLY < y + h - 1) {
        leftDoorYs.push(finalDoorLY);
    }

    // Room Subdivisions: Right Wing (x+11 to x+w-1)
    lastWallY = y;
    const rightDoorYs = [];
    for (let ry = y + roomH; ry < y + h - 8; ry += roomH) {
        // Draw single edge wall for partition (South edge)
        // Span full length from corridor wall (x + 11) to outer wall (x + w - 1)
        for (let tx = x + 11; tx <= x + w - 1; tx++) {
            builder.setEdgeWall(tx, ry, 's', true);
        }
        
        // Calculate door Y for this right wing room
        const doorY = lastWallY + 1 + Math.floor((ry - (lastWallY + 1)) / 2);
        if (doorY > y && doorY < y + h - 1) {
            rightDoorYs.push(doorY);
        }
        lastWallY = ry;
    }
    // Door for the final right room (only if there's space)
    const finalDoorRY = lastWallY + 1 + Math.floor((y + h - 1 - (lastWallY + 1)) / 2);
    if (finalDoorRY > lastWallY && finalDoorRY < y + h - 1) {
        rightDoorYs.push(finalDoorRY);
    }

    // Left Corridor Wall (Col 6: hallXStart - 1) as single edge wall on East ('e') side
    // Run full length from y to y + h - 1
    for (let ty = y; ty < y + h; ty++) {
        builder.setEdgeWall(hallXStart - 1, ty, 'e', true);
        if (leftDoorYs.includes(ty)) {
            builder.metadata.doors.push({ x: hallXStart - 1, y: ty, isLocked: false, isOpen: false, edge: 'e' });
        }
    }

    // Right Corridor Wall (Col 11: hallXStart + 4) as single edge wall on West ('w') side
    // Run full length from y to y + h - 1
    for (let ty = y; ty < y + h; ty++) {
        builder.setEdgeWall(hallXStart + 4, ty, 'w', true);
        if (rightDoorYs.includes(ty)) {
            builder.metadata.doors.push({ x: hallXStart + 4, y: ty, isLocked: false, isOpen: false, edge: 'w' });
        }
    }

    // Main Entrance Doors (Top and Bottom, 2 centered) - set as edge doors
    const doorCols = [hallXStart + 1, hallXStart + 2];
    const wallCols = [hallXStart, hallXStart + 3];

    doorCols.forEach(hx => {
        builder.metadata.doors.push({ x: hx, y: y, isLocked: false, isOpen: false, edge: 'n' });
        builder.metadata.doors.push({ x: hx, y: y + h - 1, isLocked: false, isOpen: false, edge: 's' });
    });

    // Windows
    builder.placeWindows(x, y, w, h);

    // Ensure no windows at the 2-tile entry walls (Top and Bottom)
    wallCols.forEach(hx => {
        builder.metadata.windows = builder.metadata.windows.filter(w => !(w.x === hx && (w.y === y || w.y === y + h - 1)));
    });

    // Register
    builder.registerBuilding('lab', x, y, w, h, { 
        frontage: 'south', 
        entranceX: hallXStart + 1, 
        entranceY: y + h - 1,
        hallXStart: hallXStart,
        hallWidth: 4
    });
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
