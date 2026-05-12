/**
 * MapBuilder - Utility for geometric drawing and building placement
 * Decouples map geometry from high-level generation logic
 */
export class MapBuilder {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.layout = Array(height).fill().map(() => Array(width).fill('grass'));
    this.metadata = {
      generated: new Date().toISOString(),
      buildings: [],
      specialBuildings: [],
      doors: [],
      windows: [],
      placeIcons: [],
      spawnZones: {}
    };
  }

  /**
   * Fill a region with terrain
   */
  fill(terrain, x1 = 0, y1 = 0, x2 = this.width - 1, y2 = this.height - 1) {
    for (let y = Math.max(0, y1); y <= Math.min(this.height - 1, y2); y++) {
      for (let x = Math.max(0, x1); x <= Math.min(this.width - 1, x2); x++) {
        this.layout[y][x] = terrain;
      }
    }
  }

  /**
   * Clear an area and its metadata
   */
  clearArea(x, y, w, h) {
    this.fill('grass', x, y, x + w - 1, y + h - 1);
    const inArea = (mx, my) => (mx >= x && mx < x + w && my >= y && my < y + h);
    
    this.metadata.doors = this.metadata.doors.filter(d => !inArea(d.x, d.y));
    this.metadata.windows = this.metadata.windows.filter(w => !inArea(w.x, w.y));
    this.metadata.placeIcons = this.metadata.placeIcons.filter(i => !inArea(i.x, i.y));
    // Filter buildings that intersect the area
    this.metadata.buildings = this.metadata.buildings.filter(b => {
        const intersects = (b.x < x + w && b.x + b.width > x && b.y < y + h && b.y + b.height > y);
        return !intersects;
    });
  }

  /**
   * Set terrain at a specific tile
   */
  setTerrain(x, y, terrain) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.layout[y][x] = terrain;
    }
  }

  /**
   * Get terrain at a specific tile
   */
  getTerrain(x, y) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      return this.layout[y][x];
    }
    return null;
  }

  /**
   * Draw road with sidewalks
   */
  drawRoad(p1, p2, thickness, sidewalkThickness) {
    const half = Math.floor(thickness / 2);
    const sHalf = half + sidewalkThickness;
    
    const x1 = Math.min(p1.x, p2.x);
    const x2 = Math.max(p1.x, p2.x);
    const y1 = Math.min(p1.y, p2.y);
    const y2 = Math.max(p1.y, p2.y);

    // Draw Sidewalk First
    for (let y = y1 - sHalf; y <= y2 + sHalf; y++) {
      for (let x = x1 - sHalf; x <= x2 + sHalf; x++) {
        if (this.getTerrain(x, y) === 'grass') {
          this.setTerrain(x, y, 'sidewalk');
        }
      }
    }

    // Draw Road
    for (let y = y1 - half; y <= y2 + half; y++) {
      for (let x = x1 - half; x <= x2 + half; x++) {
        this.setTerrain(x, y, 'road');
      }
    }
  }

  /**
   * Place a building footprint
   */
  drawBuilding(x, y, w, h, frontage, type = 'residential') {
    for (let ty = y; ty < y + h; ty++) {
      for (let tx = x; tx < x + w; tx++) {
        const isPerimeter = (ty === y || ty === y + h - 1 || tx === x || tx === x + w - 1);
        this.setTerrain(tx, ty, isPerimeter ? 'building' : 'floor');
      }
    }

    // Entrance logic
    let entranceX, entranceY;
    if (frontage === 'east') { entranceX = x + w - 1; entranceY = y + 2 + Math.floor(Math.random() * (h - 4)); }
    else if (frontage === 'west') { entranceX = x; entranceY = y + 2 + Math.floor(Math.random() * (h - 4)); }
    else if (frontage === 'south') { entranceX = x + 2 + Math.floor(Math.random() * (w - 4)); entranceY = y + h - 1; }
    else { entranceX = x + 2 + Math.floor(Math.random() * (w - 4)); entranceY = y; }

    this.setTerrain(entranceX, entranceY, 'floor');
    this.metadata.doors.push({ 
      x: entranceX, 
      y: entranceY, 
      isLocked: Math.random() < 0.2, 
      isOpen: false 
    });

    // Back door logic: Place on the opposite wall of the frontage
    let backX, backY;
    if (frontage === 'east') { backX = x; backY = y + 2 + Math.floor(Math.random() * (h - 4)); }
    else if (frontage === 'west') { backX = x + w - 1; backY = y + 2 + Math.floor(Math.random() * (h - 4)); }
    else if (frontage === 'south') { backX = x + 2 + Math.floor(Math.random() * (w - 4)); backY = y; }
    else { backX = x + 2 + Math.floor(Math.random() * (w - 4)); backY = y + h - 1; }

    this.setTerrain(backX, backY, 'floor');
    this.metadata.doors.push({
      x: backX,
      y: backY,
      isLocked: Math.random() < 0.4, // Back doors are slightly more likely to be locked
      isOpen: false
    });

    this.registerBuilding(type, x, y, w, h, { entranceX, entranceY, backX, backY, frontage });
    
    // Subdivide and add windows (if residential)
    if (type === 'residential') {
      this.subdivideBuilding(x, y, w, h);
      this.placeWindows(x, y, w, h);
    }
  }

  /**
   * Draw a special building with unique internal rules (Firestation, Police, etc)
   */
  drawSpecialBuilding(b, type) {
    let { x, y, width, height, frontage } = b;

    // Phase: Gas Station Custom Setback, Size & Parking Lot
    if (type === 'gas_station') {
        // Force smaller size for gas stations
        const oldW = width, oldH = height;
        width = 10;
        height = 10;
        
        // Re-center or align based on frontage
        if (frontage === 'east' || frontage === 'west') {
            y += Math.floor((oldH - height) / 2);
            if (frontage === 'east') x += (oldW - width);
        } else {
            x += Math.floor((oldW - width) / 2);
            if (frontage === 'south') y += (oldH - height);
        }

        // Shift building to be 1 tile further AWAY from the road (if bounds allow)
        if (frontage === 'east' && x > 0) x -= 1;
        else if (frontage === 'west' && x + width < this.width) x += 1;
        else if (frontage === 'south' && y > 0) y -= 1;
        else if (frontage === 'north' && y + height < this.height) y += 1;
        
        // Clear the newly calculated parking lot area before drawing it
        if (frontage === 'east') this.clearArea(x + width, y, 4, height);
        else if (frontage === 'west') this.clearArea(x - 4, y, 4, height);
        else if (frontage === 'south') this.clearArea(x, y + height, width, 4);
        else if (frontage === 'north') this.clearArea(x, y - 4, width, 4);

        // Fill parking lot area (3 tiles in front of building)
        if (frontage === 'east') this.fill('road', x + width, y, x + width + 3, y + height - 1);
        else if (frontage === 'west') this.fill('road', x - 4, y, x - 1, y + height - 1);
        else if (frontage === 'south') this.fill('road', x, y + height, x + width - 1, y + height + 3);
        else if (frontage === 'north') this.fill('road', x, y - 4, x + width - 1, y - 1);
    }

    const isHorizontal = (frontage === 'north' || frontage === 'south');
    
    // 1. Build the structure
    for (let ty = y; ty < y + height; ty++) {
      for (let tx = x; tx < x + width; tx++) {
        const isPerimeter = (ty === y || ty === y + height - 1 || tx === x || tx === x + width - 1);
        
        // Firestation internal wall
        const wallOffset = isHorizontal ? Math.floor(width * 0.6) : Math.floor(height * 0.6);
        const isInternalWall = type === 'firestation' && (isHorizontal ? tx === x + wallOffset : ty === y + wallOffset);

        if (isPerimeter || isInternalWall) {
          this.setTerrain(tx, ty, 'building');
        } else {
          this.setTerrain(tx, ty, 'floor');
        }
      }
    }

    // 2. Entrance Logic
    let entranceX, entranceY;
    if (frontage === 'east') { entranceX = x + width - 1; entranceY = y + Math.floor(height / 2); }
    else if (frontage === 'west') { entranceX = x; entranceY = y + Math.floor(height / 2); }
    else if (frontage === 'south') { entranceX = x + Math.floor(width / 2); entranceY = y + height - 1; }
    else { entranceX = x + Math.floor(width / 2); entranceY = y; }

    if (type === 'firestation') {
        const wallOffset = isHorizontal ? Math.floor(width * 0.6) : Math.floor(height * 0.6);
        const appSize = 4;
        const appOffset = Math.floor(wallOffset / 2) - 2;
        
        for (let i = 0; i < appSize; i++) {
            let ax = entranceX, ay = entranceY;
            if (isHorizontal) ax = x + appOffset + i; else ay = y + appOffset + i;
            this.setTerrain(ax, ay, 'floor');
            this.metadata.doors.push({ x: ax, y: ay, isOpening: true, isOpen: true });
        }

        let sx = entranceX, sy = entranceY;
        if (isHorizontal) sx = x + width - 3; else sy = y + height - 3;
        this.setTerrain(sx, sy, 'floor');
        this.metadata.doors.push({ x: sx, y: sy, isLocked: Math.random() < 0.2, isOpen: false });

        let ix, iy;
        if (isHorizontal) { ix = x + wallOffset; iy = y + Math.floor(height / 2); }
        else { ix = x + Math.floor(width / 2); iy = y + wallOffset; }
        this.setTerrain(ix, iy, 'floor');
        this.metadata.doors.push({ x: ix, y: iy, isLocked: false, isOpen: false });
        
        entranceX = sx; entranceY = sy; 
    } else {
        this.setTerrain(entranceX, entranceY, 'floor');
        this.metadata.doors.push({ x: entranceX, y: entranceY, isLocked: Math.random() < 0.1, isOpen: false });
    }

    // 3. Register Building
    this.registerBuilding(type, x, y, width, height, { frontage, entranceX, entranceY });

    // 4. Place Icons
    if (type === 'gas_station') {
        let pumpX = entranceX, pumpY = entranceY;
        if (frontage === 'east') pumpX += 2; else if (frontage === 'west') pumpX -= 2;
        else if (frontage === 'south') pumpY += 2; else pumpY -= 2;
        this.metadata.placeIcons.push({ subtype: 'fuelpump', x: pumpX, y: pumpY });
    } else {
        let signX = entranceX, signY = entranceY;
        if (frontage === 'east' || frontage === 'west') signY--; 
        else if (frontage === 'north' || frontage === 'south') signX--;
        this.metadata.placeIcons.push({ subtype: type, x: signX, y: signY });
    }
  }

  /**
   * Draw an Army Tent
   */
  drawArmyTent(startX, y, isFacingEast) {
    const tentWidth = 10;
    const tentHeight = 6;

    for (let curY = y + 1; curY < y + 1 + tentHeight; curY++) {
      for (let curX = startX + 1; curX < startX + 1 + tentWidth; curX++) {
        const isPerimeter = (curY === y + 1 || curY === y + tentHeight || curX === startX + 1 || curX === startX + tentWidth);
        this.setTerrain(curX, curY, isPerimeter ? 'tent_wall' : 'floor');
      }
    }

    const entranceX = isFacingEast ? startX + tentWidth : startX + 1;
    const entranceYStart = y + Math.floor(tentHeight / 2);
    for (let ey = entranceYStart; ey < entranceYStart + 2; ey++) {
      this.setTerrain(entranceX, ey, 'floor');
      this.metadata.doors.push({ x: entranceX, y: ey, isOpening: true, isOpen: true });
    }

    this.registerBuilding('army_tent', startX + 1, y + 1, tentWidth, tentHeight);
  }

  /**
   * Register building metadata
   */
  registerBuilding(type, x, y, width, height, extra = {}) {
    const buildingData = { type, x, y, width, height, ...extra };
    this.metadata.buildings.push(buildingData);
    
    if (['police', 'firestation', 'grocer', 'gas_station', 'army_tent', 'hardware_store', 'lab'].includes(type)) {
      this.metadata.specialBuildings.push(buildingData);
    }
  }

  /**
   * Place windows around a building
   */
  placeWindows(x, y, w, h) {
    const walls = [
      { name: 'top', tiles: [], dx: 0, dy: 1 },
      { name: 'bottom', tiles: [], dx: 0, dy: -1 },
      { name: 'left', tiles: [], dx: 1, dy: 0 },
      { name: 'right', tiles: [], dx: -1, dy: 0 }
    ];

    for (let cx = x + 1; cx < x + w - 1; cx++) {
      walls[0].tiles.push({ x: cx, y: y });
      walls[1].tiles.push({ x: cx, y: y + h - 1 });
    }
    for (let cy = y + 1; cy < y + h - 1; cy++) {
      walls[2].tiles.push({ x: x, y: cy });
      walls[3].tiles.push({ x: x + w - 1, y: cy });
    }

    walls.forEach(wall => {
      let candidates = wall.tiles.filter(t => {
        if (this.getTerrain(t.x, t.y) !== 'building') return false;
        if (this.metadata.doors.some(d => d.x === t.x && d.y === t.y)) return false;
        
        const inwardX = t.x + wall.dx;
        const inwardY = t.y + wall.dy;
        if (this.getTerrain(inwardX, inwardY) === 'building') return false;

        return true;
      });

      if (candidates.length === 0) return;

      let numRequested = Math.random() < 0.2 ? 0 : (Math.random() < 0.7 ? 1 : 2);
      const selected = [];

      for (let i = 0; i < numRequested; i++) {
        if (candidates.length === 0) break;
        const idx = Math.floor(Math.random() * candidates.length);
        const pick = candidates[idx];
        selected.push(pick);
        candidates = candidates.filter(c => Math.abs(c.x - pick.x) + Math.abs(c.y - pick.y) > 1);
      }

      selected.forEach(t => {
        this.setTerrain(t.x, t.y, 'window');
        this.metadata.windows.push({
          x: t.x,
          y: t.y,
          isLocked: Math.random() < 0.7,
          isOpen: false
        });
      });
    });
  }

  /**
   * Subdivide a building into rooms
   */
  subdivideBuilding(x, y, w, h) {
    const minInteriorSize = 4;
    const rooms = [{ x: x + 1, y: y + 1, w: w - 2, h: h - 2 }];
    const targetRooms = Math.random() < 0.4 ? 3 : 2;

    for (let i = 0; i < targetRooms - 1; i++) {
      rooms.sort((a, b) => (b.w * b.h) - (a.w * a.h));
      const room = rooms[0];
      
      const possibleX = [];
      if (room.w >= (minInteriorSize * 2) + 1) {
        for (let sx = room.x + minInteriorSize; sx <= room.x + room.w - minInteriorSize - 1; sx++) {
          if (!this.metadata.doors.some(d => Math.abs(d.x - sx) <= 1)) possibleX.push(sx);
        }
      }

      const possibleY = [];
      if (room.h >= (minInteriorSize * 2) + 1) {
        for (let sy = room.y + minInteriorSize; sy <= room.y + room.h - minInteriorSize - 1; sy++) {
          if (!this.metadata.doors.some(d => Math.abs(d.y - sy) <= 1)) possibleY.push(sy);
        }
      }

      if (possibleX.length === 0 && possibleY.length === 0) break;
      
      let splitVertical = (possibleX.length > 0 && possibleY.length > 0) ? 
        (room.w > room.h ? true : (room.h > room.w ? false : Math.random() < 0.5)) : 
        possibleX.length > 0;
      
      if (splitVertical) {
        const splitX = possibleX[Math.floor(Math.random() * possibleX.length)];
        for (let curY = room.y; curY < room.y + room.h; curY++) this.setTerrain(splitX, curY, 'building');
        
        const potentialDoorYs = [];
        for (let dy = room.y + 1; dy <= room.y + room.h - 2; dy++) {
          if (!this.metadata.doors.some(d => Math.abs(d.x - splitX) + Math.abs(d.y - dy) <= 1)) potentialDoorYs.push(dy);
        }
        
        const doorY = potentialDoorYs.length > 0 ? 
          potentialDoorYs[Math.floor(Math.random() * potentialDoorYs.length)] : 
          room.y + 1 + Math.floor(Math.random() * Math.max(1, room.h - 2));

        this.setTerrain(splitX, doorY, 'floor');
        this.metadata.doors.push({ x: splitX, y: doorY, isLocked: false, isOpen: false });
        
        const oldWidth = room.w;
        rooms.push({ x: splitX + 1, y: room.y, w: oldWidth - (splitX - room.x) - 1, h: room.h });
        room.w = splitX - room.x;
      } else {
        const splitY = possibleY[Math.floor(Math.random() * possibleY.length)];
        for (let curX = room.x; curX < room.x + room.w; curX++) this.setTerrain(curX, splitY, 'building');
        
        const potentialDoorXs = [];
        for (let dx = room.x + 1; dx <= room.x + room.w - 2; dx++) {
          if (!this.metadata.doors.some(d => Math.abs(d.x - dx) + Math.abs(d.y - splitY) <= 1)) potentialDoorXs.push(dx);
        }
        
        const doorX = potentialDoorXs.length > 0 ? 
          potentialDoorXs[Math.floor(Math.random() * potentialDoorXs.length)] : 
          room.x + 1 + Math.floor(Math.random() * Math.max(1, room.w - 2));

        this.setTerrain(doorX, splitY, 'floor');
        this.metadata.doors.push({ x: doorX, y: splitY, isLocked: false, isOpen: false });
        
        const oldHeight = room.h;
        rooms.push({ x: room.x, y: splitY + 1, w: room.w, h: oldHeight - (splitY - room.y) - 1 });
        room.h = splitY - room.y;
      }
    }
  }

  /**
   * Anchor-based building placement
   */
  placeBuildingsFromAnchor(anchorX, anchorY, growthDir, frontage, options = {}) {
    const {
      minW = 14, maxW = 22,
      minH = 14, maxH = 18,
      gap = 4,
      setback = 2,
      maxBuildings = 10
    } = options;

    let currentX = anchorX;
    let currentY = anchorY;
    let placedCount = 0;
    let attempts = 0;
    const maxAttempts = 500;

    while (placedCount < maxBuildings && attempts < maxAttempts) {
      attempts++;
      const bW = minW + Math.floor(Math.random() * (maxW - minW + 1));
      const bH = minH + Math.floor(Math.random() * (maxH - minH + 1));

      let bX, bY;
      if (frontage === 'north') {
        bY = anchorY + setback + 1;
        bX = (growthDir === 'west') ? currentX - bW : currentX;
      } else if (frontage === 'south') {
        bY = anchorY - setback - bH;
        bX = (growthDir === 'west') ? currentX - bW : currentX;
      } else if (frontage === 'east') {
        bX = anchorX - setback - bW;
        bY = (growthDir === 'north') ? currentY - bH : currentY;
      } else if (frontage === 'west') {
        bX = anchorX + setback + 1;
        bY = (growthDir === 'north') ? currentY - bH : currentY;
      }

      if (bX < 2 || bX + bW >= this.width - 2 || bY < 2 || bY + bH >= this.height - 2) {
        if (growthDir === 'west') currentX--;
        else if (growthDir === 'east') currentX++;
        else if (growthDir === 'north') currentY--;
        else if (growthDir === 'south') currentY++;
        continue;
      }
      
      let canPlace = true;
      const buffer = Math.max(1, Math.floor(gap / 2)); 
      for (let ty = bY - buffer; ty < bY + bH + buffer; ty++) {
        for (let tx = bX - buffer; tx < bX + bW + buffer; tx++) {
          if (this.getTerrain(tx, ty) !== 'grass') {
            canPlace = false;
            break;
          }
        }
        if (!canPlace) break;
      }

      if (canPlace) {
        this.drawBuilding(bX, bY, bW, bH, frontage);
        placedCount++;
        attempts = 0;
        if (growthDir === 'west') currentX -= (bW + gap);
        else if (growthDir === 'east') currentX += (bW + gap);
        else if (growthDir === 'north') currentY -= (bH + gap);
        else if (growthDir === 'south') currentY += (bH + gap);
      } else {
        if (growthDir === 'west') currentX--;
        else if (growthDir === 'east') currentX++;
        else if (growthDir === 'north') currentY--;
        else if (growthDir === 'south') currentY++;
      }
    }
  }

  /**
   * Finalize map data
   */
  getFinalMapData(templateName, config) {
    return {
      width: this.width,
      height: this.height,
      tiles: this.layout.map((row, y) =>
        row.map((terrain, x) => ({ x, y, terrain, contents: [] }))
      ),
      template: templateName,
      config: config,
      metadata: this.metadata
    };
  }
}
