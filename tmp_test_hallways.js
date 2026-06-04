import { MapBuilder } from './client/src/game/map/MapBuilder.js';

// ASCII Visualizer for a building
function printHouse(builder, bx, by, bw, bh) {
  let output = '';
  // Print map grid with walls and doors
  for (let y = by; y < by + bh; y++) {
    let row1 = ''; // Top edges and corners
    let row2 = ''; // Center cell and side edges
    
    for (let x = bx; x < bx + bw; x++) {
      const tile = builder.layout[y][x];
      const hasDoorN = builder.metadata.doors.some(d => d.x === x && d.y === y && d.edge === 'n');
      const hasDoorW = builder.metadata.doors.some(d => d.x === x && d.y === y && d.edge === 'w');
      const hasDoorS = builder.metadata.doors.some(d => d.x === x && d.y === y && d.edge === 's');
      const hasDoorE = builder.metadata.doors.some(d => d.x === x && d.y === y && d.edge === 'e');

      // Row 1: North edge of tile
      if (tile.edgeWalls.n) {
        row1 += hasDoorN ? ' D ' : '---';
      } else {
        row1 += '   ';
      }
      
      // Row 2: West edge and cell center
      let cell = ' . ';
      if (tile.terrain === 'grass') cell = ' , ';
      
      if (tile.edgeWalls.w) {
        row2 += hasDoorW ? 'D' : '|';
      } else {
        row2 += ' ';
      }
      row2 += cell.trim();
      
      if (x === bx + bw - 1) {
        if (tile.edgeWalls.e) {
          row2 += hasDoorE ? 'D' : '|';
        } else {
          row2 += ' ';
        }
      }
    }
    output += row1 + '\n' + row2 + '\n';
    
    // Print bottom wall for last row
    if (y === by + bh - 1) {
      let row3 = '';
      for (let x = bx; x < bx + bw; x++) {
        const tile = builder.layout[y][x];
        const hasDoorS = builder.metadata.doors.some(d => d.x === x && d.y === y && d.edge === 's');
        if (tile.edgeWalls.s) {
          row3 += hasDoorS ? ' D ' : '---';
        } else {
          row3 += '   ';
        }
      }
      output += row3 + '\n';
    }
  }
  console.log(output);
}

// Custom layout implementations matching the MapBuilder context
class TestMapBuilder extends MapBuilder {
  constructor(w, h) {
    super(w, h);
  }

  // Override subdivideBuilding for testing our new logic
  subdivideBuilding(x, y, w, h, forceLayoutType = null) {
    const building = this.metadata.buildings.find(b => b.x === x && b.y === y);
    const frontage = building?.frontage || 'north';
    const entranceX = building?.entranceX || (x + Math.floor(w / 2));
    const entranceY = building?.entranceY || y;
    const backX = building?.backX || (x + Math.floor(w / 2));
    const backY = building?.backY || (y + h - 1);

    // Clear any existing interior walls and doors first
    for (let curY = y + 1; curY <= y + h - 2; curY++) {
      for (let curX = x + 1; curX <= x + w - 2; curX++) {
        this.layout[curY][curX].edgeWalls = { n: false, e: false, s: false, w: false };
      }
    }
    this.metadata.doors = this.metadata.doors.filter(d => {
      const isOuter = (d.x === x || d.x === x + w - 1 || d.y === y || d.y === y + h - 1);
      return isOuter;
    });

    const iw = w - 2;
    const ih = h - 2;

    const layoutType = forceLayoutType || ( (iw < 8 || ih < 8) ? 'fallback' : 'central' );
    console.log(`Subdividing House at (${x},${y}) size ${w}x${h} using [${layoutType}] layout`);

    if (layoutType === 'central') {
      this.generateCentralHallwayLayout(x, y, w, h, frontage, entranceX, entranceY, backX, backY);
    } else if (layoutType === 'hub') {
      this.generateLivingRoomHubLayout(x, y, w, h, frontage, entranceX, entranceY, backX, backY);
    } else if (layoutType === 'l_corridor') {
      this.generateLCorridorLayout(x, y, w, h, frontage, entranceX, entranceY, backX, backY);
    } else {
      this.generateDirectPartitionLayout(x, y, w, h, entranceX, entranceY, backX, backY);
    }
  }

  generateCentralHallwayLayout(x, y, w, h, frontage, entranceX, entranceY, backX, backY) {
    const minInteriorSize = 3;
    if (frontage === 'north' || frontage === 'south') {
      // Vertical hallway (width 2)
      let hallX = Math.max(x + 3, Math.min(x + w - 5, entranceX - 1));
      
      // Prevent blocking back door
      if (hallX === backX) hallX += 1;
      else if (hallX + 1 === backX) hallX -= 1;
      // Re-bound check
      hallX = Math.max(x + 3, Math.min(x + w - 5, hallX));

      // Build vertical walls
      for (let curY = y; curY <= y + h - 1; curY++) {
        this.setEdgeWall(hallX, curY, 'w', true);
        this.setEdgeWall(hallX + 2, curY, 'w', true);
      }

      // Partition left side horizontally
      const leftW = hallX - (x + 1);
      if (leftW >= minInteriorSize && h - 2 >= (minInteriorSize * 2) + 1) {
        const splitLeftY = y + 1 + minInteriorSize + Math.floor(Math.random() * (h - 2 - minInteriorSize * 2 - 1));
        if (splitLeftY !== backY && splitLeftY !== entranceY) {
          for (let curX = x; curX <= hallX - 1; curX++) {
            this.setEdgeWall(curX, splitLeftY, 'n', true);
          }
          // Door in split
          const doorX = x + 1 + Math.floor(Math.random() * leftW);
          this.metadata.doors.push({ x: doorX, y: splitLeftY, isLocked: false, isOpen: false, edge: 'n' });
        }
      }

      // Partition right side horizontally
      const rightW = (x + w - 2) - (hallX + 2) + 1;
      if (rightW >= minInteriorSize && h - 2 >= (minInteriorSize * 2) + 1) {
        const splitRightY = y + 1 + minInteriorSize + Math.floor(Math.random() * (h - 2 - minInteriorSize * 2 - 1));
        if (splitRightY !== backY && splitRightY !== entranceY) {
          for (let curX = hallX + 2; curX <= x + w - 1; curX++) {
            this.setEdgeWall(curX, splitRightY, 'n', true);
          }
          // Door in split
          const doorX = hallX + 2 + Math.floor(Math.random() * rightW);
          this.metadata.doors.push({ x: doorX, y: splitRightY, isLocked: false, isOpen: false, edge: 'n' });
        }
      }

      // Add doors connecting rooms to vertical hallway
      // Left side room doors (into hallX column's 'w' wall, which is the hallway's left wall)
      const doorY1 = y + 1 + Math.floor(Math.random() * 2);
      this.metadata.doors.push({ x: hallX, y: doorY1, isLocked: false, isOpen: false, edge: 'w' });
      const doorY2 = y + h - 2 - Math.floor(Math.random() * 2);
      this.metadata.doors.push({ x: hallX, y: doorY2, isLocked: false, isOpen: false, edge: 'w' });

      // Right side room doors (into hallX+2 column's 'w' wall, which is the hallway's right wall)
      const doorY3 = y + 1 + Math.floor(Math.random() * 2);
      this.metadata.doors.push({ x: hallX + 2, y: doorY3, isLocked: false, isOpen: false, edge: 'w' });
      const doorY4 = y + h - 2 - Math.floor(Math.random() * 2);
      this.metadata.doors.push({ x: hallX + 2, y: doorY4, isLocked: false, isOpen: false, edge: 'w' });

    } else {
      // Horizontal hallway (height 2)
      let hallY = Math.max(y + 3, Math.min(y + h - 5, entranceY - 1));
      
      // Prevent blocking back door
      if (hallY === backY) hallY += 1;
      else if (hallY + 1 === backY) hallY -= 1;
      hallY = Math.max(y + 3, Math.min(y + h - 5, hallY));

      // Build horizontal walls
      for (let curX = x; curX <= x + w - 1; curX++) {
        this.setEdgeWall(curX, hallY, 'n', true);
        this.setEdgeWall(curX, hallY + 2, 'n', true);
      }

      // Partition top side vertically
      const topH = hallY - (y + 1);
      if (topH >= minInteriorSize && w - 2 >= (minInteriorSize * 2) + 1) {
        const splitTopX = x + 1 + minInteriorSize + Math.floor(Math.random() * (w - 2 - minInteriorSize * 2 - 1));
        if (splitTopX !== backX && splitTopX !== entranceX) {
          for (let curY = y; curY <= hallY - 1; curY++) {
            this.setEdgeWall(splitTopX, curY, 'w', true);
          }
          const doorY = y + 1 + Math.floor(Math.random() * topH);
          this.metadata.doors.push({ x: splitTopX, y: doorY, isLocked: false, isOpen: false, edge: 'w' });
        }
      }

      // Partition bottom side vertically
      const bottomH = (y + h - 2) - (hallY + 2) + 1;
      if (bottomH >= minInteriorSize && w - 2 >= (minInteriorSize * 2) + 1) {
        const splitBottomX = x + 1 + minInteriorSize + Math.floor(Math.random() * (w - 2 - minInteriorSize * 2 - 1));
        if (splitBottomX !== backX && splitBottomX !== entranceX) {
          for (let curY = hallY + 2; curY <= y + h - 1; curY++) {
            this.setEdgeWall(splitBottomX, curY, 'w', true);
          }
          const doorY = hallY + 2 + Math.floor(Math.random() * bottomH);
          this.metadata.doors.push({ x: splitBottomX, y: doorY, isLocked: false, isOpen: false, edge: 'w' });
        }
      }

      // Add doors connecting rooms to horizontal hallway
      // Top side room doors (into hallY row's 'n' wall)
      const doorX1 = x + 1 + Math.floor(Math.random() * 2);
      this.metadata.doors.push({ x: doorX1, y: hallY, isLocked: false, isOpen: false, edge: 'n' });
      const doorX2 = x + w - 2 - Math.floor(Math.random() * 2);
      this.metadata.doors.push({ x: doorX2, y: hallY, isLocked: false, isOpen: false, edge: 'n' });

      // Bottom side room doors (into hallY+2 row's 'n' wall)
      const doorX3 = x + 1 + Math.floor(Math.random() * 2);
      this.metadata.doors.push({ x: doorX3, y: hallY + 2, isLocked: false, isOpen: false, edge: 'n' });
      const doorX4 = x + w - 2 - Math.floor(Math.random() * 2);
      this.metadata.doors.push({ x: doorX4, y: hallY + 2, isLocked: false, isOpen: false, edge: 'n' });
    }
  }

  generateLivingRoomHubLayout(x, y, w, h, frontage, entranceX, entranceY, backX, backY) {
    const minInteriorSize = 3;
    const iw = w - 2;
    const ih = h - 2;

    if (frontage === 'north' || frontage === 'south') {
      // Split horizontally to separate living room (hub) from bedrooms
      let splitY = y + 1 + Math.floor(ih * (frontage === 'north' ? 0.55 : 0.40));
      if (splitY === backY || splitY === entranceY) splitY += 1;
      splitY = Math.max(y + 1 + minInteriorSize, Math.min(y + h - 2 - minInteriorSize, splitY));

      // Draw horizontal partition
      for (let curX = x; curX <= x + w - 1; curX++) {
        this.setEdgeWall(curX, splitY, 'n', true);
      }

      const bedroomSide = frontage === 'north' ? 'bottom' : 'top';
      let splitX = x + 1 + Math.floor(iw * 0.5);
      if (splitX === backX || splitX === entranceX) splitX += 1;
      splitX = Math.max(x + 1 + minInteriorSize, Math.min(x + w - 2 - minInteriorSize, splitX));

      // Draw vertical partition separating two bedrooms
      if (bedroomSide === 'bottom') {
        for (let curY = splitY; curY <= y + h - 1; curY++) {
          this.setEdgeWall(splitX, curY, 'w', true);
        }
      } else {
        for (let curY = y; curY <= splitY - 1; curY++) {
          this.setEdgeWall(splitX, curY, 'w', true);
        }
      }

      // Add doors for both bedrooms into the living room hub (row splitY, edge 'n')
      const doorX1 = x + 1 + Math.floor(Math.random() * (splitX - x - 1));
      this.metadata.doors.push({ x: doorX1, y: splitY, isLocked: false, isOpen: false, edge: 'n' });

      const doorX2 = splitX + Math.floor(Math.random() * (x + w - 1 - splitX));
      this.metadata.doors.push({ x: doorX2, y: splitY, isLocked: false, isOpen: false, edge: 'n' });

    } else {
      // Split vertically to separate living room from bedrooms
      let splitX = x + 1 + Math.floor(iw * (frontage === 'west' ? 0.55 : 0.40));
      if (splitX === backX || splitX === entranceX) splitX += 1;
      splitX = Math.max(x + 1 + minInteriorSize, Math.min(x + w - 2 - minInteriorSize, splitX));

      // Draw vertical partition
      for (let curY = y; curY <= y + h - 1; curY++) {
        this.setEdgeWall(splitX, curY, 'w', true);
      }

      const bedroomSide = frontage === 'west' ? 'right' : 'left';
      let splitY = y + 1 + Math.floor(ih * 0.5);
      if (splitY === backY || splitY === entranceY) splitY += 1;
      splitY = Math.max(y + 1 + minInteriorSize, Math.min(y + h - 2 - minInteriorSize, splitY));

      // Draw horizontal partition separating two bedrooms
      if (bedroomSide === 'right') {
        for (let curX = splitX; curX <= x + w - 1; curX++) {
          this.setEdgeWall(curX, splitY, 'n', true);
        }
      } else {
        for (let curX = x; curX <= splitX - 1; curX++) {
          this.setEdgeWall(curX, splitY, 'n', true);
        }
      }

      // Add doors for both bedrooms into the living room (column splitX, edge 'w')
      const doorY1 = y + 1 + Math.floor(Math.random() * (splitY - y - 1));
      this.metadata.doors.push({ x: splitX, y: doorY1, isLocked: false, isOpen: false, edge: 'w' });

      const doorY2 = splitY + Math.floor(Math.random() * (y + h - 1 - splitY));
      this.metadata.doors.push({ x: splitX, y: doorY2, isLocked: false, isOpen: false, edge: 'w' });
    }
  }

  generateLCorridorLayout(x, y, w, h, frontage, entranceX, entranceY, backX, backY) {
    const minInteriorSize = 3;
    const iw = w - 2;
    const ih = h - 2;

    // Horizontal hallway height is 2, Vertical hallway width is 2
    let hallX = Math.max(x + 3, Math.min(x + w - 5, entranceX - 1));
    let hallY = y + 1 + Math.floor(ih / 2) - 1;
    
    // Prevent blocking back door
    if (hallX === backX) hallX += 1;
    else if (hallX + 1 === backX) hallX -= 1;
    hallX = Math.max(x + 3, Math.min(x + w - 5, hallX));

    if (hallY === backY) hallY += 1;
    else if (hallY + 1 === backY) hallY -= 1;
    hallY = Math.max(y + 3, Math.min(y + h - 5, hallY));

    // 1. Draw horizontal segment of the hallway (rows hallY and hallY + 2, n wall)
    for (let curX = x; curX <= x + w - 1; curX++) {
      if (frontage === 'north') {
        if (curX < hallX || curX > hallX + 1) {
          this.setEdgeWall(curX, hallY, 'n', true);
        }
        this.setEdgeWall(curX, hallY + 2, 'n', true);
      } else {
        this.setEdgeWall(curX, hallY, 'n', true);
        if (curX < hallX || curX > hallX + 1) {
          this.setEdgeWall(curX, hallY + 2, 'n', true);
        }
      }
    }

    // 2. Draw vertical segment of the hallway
    if (frontage === 'north') {
      for (let curY = y; curY <= hallY - 1; curY++) {
        this.setEdgeWall(hallX, curY, 'w', true);
        this.setEdgeWall(hallX + 2, curY, 'w', true);
      }
      
      // Top rooms: left and right of vertical corridor
      const doorY1 = y + 1 + Math.floor(Math.random() * (hallY - y - 1));
      this.metadata.doors.push({ x: hallX, y: doorY1, isLocked: false, isOpen: false, edge: 'w' });
      
      const doorY2 = y + 1 + Math.floor(Math.random() * (hallY - y - 1));
      this.metadata.doors.push({ x: hallX + 2, y: doorY2, isLocked: false, isOpen: false, edge: 'w' });

      // Bottom space: split vertically
      let splitX = x + 1 + Math.floor(iw * 0.5);
      if (splitX === backX) splitX += 1;
      splitX = Math.max(x + 1 + minInteriorSize, Math.min(x + w - 2 - minInteriorSize, splitX));

      for (let curY = hallY + 2; curY <= y + h - 1; curY++) {
        this.setEdgeWall(splitX, curY, 'w', true);
      }

      // Add door in split
      const doorY3 = hallY + 2 + Math.floor(Math.random() * (y + h - 1 - (hallY + 2)));
      this.metadata.doors.push({ x: splitX, y: doorY3, isLocked: false, isOpen: false, edge: 'w' });

      // Doors from bottom rooms into corridor (at row hallY+2)
      const doorX1 = x + 1 + Math.floor(Math.random() * (splitX - x - 1));
      this.metadata.doors.push({ x: doorX1, y: hallY + 2, isLocked: false, isOpen: false, edge: 'n' });

      const doorX2 = splitX + Math.floor(Math.random() * (x + w - 1 - splitX));
      this.metadata.doors.push({ x: doorX2, y: hallY + 2, isLocked: false, isOpen: false, edge: 'n' });

    } else { // south or default
      for (let curY = hallY + 2; curY <= y + h - 1; curY++) {
        this.setEdgeWall(hallX, curY, 'w', true);
        this.setEdgeWall(hallX + 2, curY, 'w', true);
      }

      // Bottom rooms: left and right of vertical corridor
      const doorY1 = hallY + 2 + Math.floor(Math.random() * (y + h - 1 - (hallY + 2)));
      this.metadata.doors.push({ x: hallX, y: doorY1, isLocked: false, isOpen: false, edge: 'w' });

      const doorY2 = hallY + 2 + Math.floor(Math.random() * (y + h - 1 - (hallY + 2)));
      this.metadata.doors.push({ x: hallX + 2, y: doorY2, isLocked: false, isOpen: false, edge: 'w' });

      // Top space: split vertically
      let splitX = x + 1 + Math.floor(iw * 0.5);
      if (splitX === backX) splitX += 1;
      splitX = Math.max(x + 1 + minInteriorSize, Math.min(x + w - 2 - minInteriorSize, splitX));

      for (let curY = y; curY <= hallY - 1; curY++) {
        this.setEdgeWall(splitX, curY, 'w', true);
      }

      // Add door in split
      const doorY3 = y + 1 + Math.floor(Math.random() * (hallY - y - 1));
      this.metadata.doors.push({ x: splitX, y: doorY3, isLocked: false, isOpen: false, edge: 'w' });

      // Doors from top rooms into corridor (at row hallY)
      const doorX1 = x + 1 + Math.floor(Math.random() * (splitX - x - 1));
      this.metadata.doors.push({ x: doorX1, y: hallY, isLocked: false, isOpen: false, edge: 'n' });

      const doorX2 = splitX + Math.floor(Math.random() * (x + w - 1 - splitX));
      this.metadata.doors.push({ x: doorX2, y: hallY, isLocked: false, isOpen: false, edge: 'n' });
    }
  }

  generateDirectPartitionLayout(x, y, w, h, entranceX, entranceY, backX, backY) {
    // Simple vertical bisection
    const minInteriorSize = 3;
    const splitX = x + 1 + Math.floor((w - 2) / 2);
    if (splitX !== backX && splitX !== entranceX) {
      for (let curY = y; curY <= y + h - 1; curY++) {
        this.setEdgeWall(splitX, curY, 'w', true);
      }
      const doorY = y + 1 + Math.floor(Math.random() * (h - 2));
      this.metadata.doors.push({ x: splitX, y: doorY, isLocked: false, isOpen: false, edge: 'w' });
    }
  }
}

// Run Test
async function runTests() {
  console.log('=== TEST 1: CENTRAL HALLWAY LAYOUT ===');
  const builder1 = new TestMapBuilder(30, 20);
  builder1.registerBuilding('residential', 2, 2, 18, 14, { frontage: 'north', entranceX: 10, entranceY: 2, backX: 11, backY: 15 });
  builder1.drawBuilding(2, 2, 18, 14, 'north'); // drawBuilding clear & set edge walls
  
  builder1.metadata.doors = []; // Reset doors set by drawBuilding to set them cleanly
  builder1.metadata.doors.push({ x: 10, y: 2, isLocked: false, isOpen: false, edge: 'n' }); // Front door
  builder1.metadata.doors.push({ x: 11, y: 15, isLocked: false, isOpen: false, edge: 's' }); // Back door
  
  builder1.subdivideBuilding(2, 2, 18, 14, 'central');
  printHouse(builder1, 2, 2, 18, 14);

  console.log('=== TEST 2: LIVING ROOM HUB LAYOUT ===');
  const builder2 = new TestMapBuilder(30, 20);
  builder2.registerBuilding('residential', 2, 2, 16, 12, { frontage: 'north', entranceX: 8, entranceY: 2, backX: 9, backY: 13 });
  builder2.drawBuilding(2, 2, 16, 12, 'north');
  builder2.metadata.doors = [];
  builder2.metadata.doors.push({ x: 8, y: 2, isLocked: false, isOpen: false, edge: 'n' });
  builder2.metadata.doors.push({ x: 9, y: 13, isLocked: false, isOpen: false, edge: 's' });
  builder2.subdivideBuilding(2, 2, 16, 12, 'hub');
  printHouse(builder2, 2, 2, 16, 12);

  console.log('=== TEST 3: L-CORRIDOR LAYOUT ===');
  const builder3 = new TestMapBuilder(30, 20);
  builder3.registerBuilding('residential', 2, 2, 16, 14, { frontage: 'north', entranceX: 8, entranceY: 2, backX: 9, backY: 15 });
  builder3.drawBuilding(2, 2, 16, 14, 'north');
  builder3.metadata.doors = [];
  builder3.metadata.doors.push({ x: 8, y: 2, isLocked: false, isOpen: false, edge: 'n' });
  builder3.metadata.doors.push({ x: 9, y: 15, isLocked: false, isOpen: false, edge: 's' });
  builder3.subdivideBuilding(2, 2, 16, 14, 'l_corridor');
  printHouse(builder3, 2, 2, 16, 14);
}

runTests().catch(console.error);
