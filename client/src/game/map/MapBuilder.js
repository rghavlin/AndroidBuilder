import { isSpecialBuilding } from './BuildingTypes.js';
import { MAP_GEN_CONFIG } from '../config/MapGenConfig.js';
import { makeLayoutGrid, findRooms, assignRoles, toSlimRoom } from './RoomGraph.js';
import { pickFloorplan, orientFloorplan, FLOORPLAN_FOOTPRINTS } from './FloorplanRegistry.js';

import { gameRandom } from '../utils/SeededRandom.js';
/**
 * MapBuilder - Utility for geometric drawing and building placement
 * Decouples map geometry from high-level generation logic
 */
export class MapBuilder {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.layout = Array(height).fill().map(() => Array(width).fill().map(() => ({
        terrain: 'grass',
        edgeWalls: { n: false, e: false, s: false, w: false }
    })));
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
        this.layout[y][x].terrain = terrain;
      }
    }
  }

  /**
   * Clear an area and its metadata
   */
  clearArea(x, y, w, h) {
    this.fill('grass', x, y, x + w - 1, y + h - 1);
    
    // Reset edge walls for all tiles in the cleared area
    for (let ty = Math.max(0, y); ty <= Math.min(this.height - 1, y + h - 1); ty++) {
      for (let tx = Math.max(0, x); tx <= Math.min(this.width - 1, x + w - 1); tx++) {
        this.layout[ty][tx].edgeWalls = { n: false, e: false, s: false, w: false };
      }
    }

    const inArea = (mx, my) => (mx >= x && mx < x + w && my >= y && my < y + h);
    
    this.metadata.doors = this.metadata.doors.filter(d => !inArea(d.x, d.y));
    this.metadata.windows = this.metadata.windows.filter(win => !inArea(win.x, win.y));
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
      this.layout[y][x].terrain = terrain;
    }
  }

  /**
   * Get terrain at a specific tile
   */
  getTerrain(x, y) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      return this.layout[y][x].terrain;
    }
    return null;
  }

  /**
   * Set edge wall
   */
  setEdgeWall(x, y, edge, value) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.layout[y][x].edgeWalls[edge] = value;
    }
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
    // Standardized floorplans: for residential lots, try to snap the footprint
    // down to an authored floorplan (oriented to the frontage) and stamp it.
    // Falls back to procedural subdivision when nothing fits (see below).
    let orientedPlan = null;
    if (type === 'residential' || type === 'starting_home') {
      const picked = pickFloorplan(w, h, frontage);
      if (picked) {
        orientedPlan = orientFloorplan(picked.plan, frontage);
        w = orientedPlan.width;
        h = orientedPlan.height;
      }
    }

    for (let ty = y; ty < y + h; ty++) {
      for (let tx = x; tx < x + w; tx++) {
        this.setTerrain(tx, ty, 'floor');
        if (ty === y) this.setEdgeWall(tx, ty, 'n', true);
        if (ty === y + h - 1) this.setEdgeWall(tx, ty, 's', true);
        if (tx === x) this.setEdgeWall(tx, ty, 'w', true);
        if (tx === x + w - 1) this.setEdgeWall(tx, ty, 'e', true);
      }
    }

    // Entrance logic
    let entranceX, entranceY, entranceEdge;
    if (frontage === 'east') { entranceX = x + w - 1; entranceY = y + 2 + Math.floor(gameRandom.next() * (h - 4)); entranceEdge = 'e'; }
    else if (frontage === 'west') { entranceX = x; entranceY = y + 2 + Math.floor(gameRandom.next() * (h - 4)); entranceEdge = 'w'; }
    else if (frontage === 'south') { entranceX = x + 2 + Math.floor(gameRandom.next() * (w - 4)); entranceY = y + h - 1; entranceEdge = 's'; }
    else { entranceX = x + 2 + Math.floor(gameRandom.next() * (w - 4)); entranceY = y; entranceEdge = 'n'; }

    // For authored floorplans, keep exterior doors off bathrooms/closets (a
    // bathroom must never open to the outside; a closet is a poor front door).
    if (orientedPlan) {
      const nudged = this._doorOffPrivateRoom(orientedPlan, x, y, entranceEdge, entranceX, entranceY);
      entranceX = nudged.x; entranceY = nudged.y;
    }

    this.setTerrain(entranceX, entranceY, 'floor');
    const entranceDoor = {
      x: entranceX,
      y: entranceY,
      isLocked: gameRandom.next() < 0.2,
      isOpen: false,
      edge: entranceEdge
    };
    this.metadata.doors.push(entranceDoor);

    // Back door logic: Place on the opposite wall of the frontage
    let backX, backY, backEdge;
    if (frontage === 'east') { backX = x; backY = y + 2 + Math.floor(gameRandom.next() * (h - 4)); backEdge = 'w'; }
    else if (frontage === 'west') { backX = x + w - 1; backY = y + 2 + Math.floor(gameRandom.next() * (h - 4)); backEdge = 'e'; }
    else if (frontage === 'south') { backX = x + 2 + Math.floor(gameRandom.next() * (w - 4)); backY = y; backEdge = 'n'; }
    else { backX = x + 2 + Math.floor(gameRandom.next() * (w - 4)); backY = y + h - 1; backEdge = 's'; }

    if (orientedPlan) {
      const nudged = this._doorOffPrivateRoom(orientedPlan, x, y, backEdge, backX, backY);
      backX = nudged.x; backY = nudged.y;
    }

    this.setTerrain(backX, backY, 'floor');
    const backDoor = {
      x: backX,
      y: backY,
      isLocked: gameRandom.next() < 0.4, // Back doors are slightly more likely to be locked
      isOpen: false,
      edge: backEdge
    };
    this.metadata.doors.push(backDoor);

    this.registerBuilding(type, x, y, w, h, { entranceX, entranceY, backX, backY, frontage });

    // Subdivide and add windows (if residential or starting_home)
    if (type === 'residential' || type === 'starting_home') {
      if (orientedPlan) {
        this.stampFloorplan(x, y, orientedPlan);
      } else {
        this.subdivideBuilding(x, y, w, h);
        this.designateRooms(x, y);
      }

      // Bathrooms and closets should never open directly to the outside.
      const building = this.metadata.buildings.find(b => b.x === x && b.y === y);
      if (building) {
        this.relocateExteriorDoor(entranceDoor, building, backDoor);
        this.relocateExteriorDoor(backDoor, building, entranceDoor);
        building.entranceX = entranceDoor.x;
        building.entranceY = entranceDoor.y;
        building.backX = backDoor.x;
        building.backY = backDoor.y;
      }

      this.placeWindows(x, y, w, h);
    }
  }

  /**
   * Return the role of the room that contains (x,y) according to the building's
   * authoritative room list. Authoritative rooms are rectangular in current
   * layouts, so a bounding-box test is sufficient.
   */
  getRoomRoleAt(building, x, y) {
    if (!building.rooms) return null;
    const room = building.rooms.find(r => x >= r.minX && x <= r.maxX && y >= r.minY && y <= r.maxY);
    return room ? room.role : null;
  }

  /**
   * If an exterior door sits in a bathroom or closet, slide it along its wall
   * to the nearest tile that is not one of those roles.
   */
  relocateExteriorDoor(door, building, otherDoor) {
    const excluded = new Set(['bathroom', 'closet']);
    const role = this.getRoomRoleAt(building, door.x, door.y);
    if (!excluded.has(role)) return;

    const horizontal = door.edge === 'n' || door.edge === 's';
    const min = horizontal ? building.x + 2 : building.y + 2;
    const max = horizontal
      ? building.x + building.width - 1 - 2
      : building.y + building.height - 1 - 2;
    const current = horizontal ? door.x : door.y;

    const candidates = [];
    for (let v = min; v <= max; v++) candidates.push(v);
    candidates.sort((a, b) => Math.abs(a - current) - Math.abs(b - current));

    for (const v of candidates) {
      const cx = horizontal ? v : door.x;
      const cy = horizontal ? door.y : v;
      if (otherDoor && cx === otherDoor.x && cy === otherDoor.y) continue;
      const r = this.getRoomRoleAt(building, cx, cy);
      if (!excluded.has(r)) {
        door.x = cx;
        door.y = cy;
        return;
      }
    }
  }

  /**
   * Slide an exterior door along its edge to the nearest tile whose floorplan
   * role isn't 'bathroom' or 'closet'. Deterministic (no RNG) so map seeds stay
   * stable. (px,py) is the door tile in map coords; returns adjusted map coords.
   */
  _doorOffPrivateRoom(plan, bx, by, edge, px, py) {
    const roleAt = (lx, ly) =>
      (plan.grid[ly] && plan.grid[ly][lx] ? plan.legend[plan.grid[ly][lx]] : undefined);
    const isPrivate = (r) => r === 'bathroom' || r === 'closet';
    const horizontal = (edge === 'n' || edge === 's');
    const fixed = horizontal ? (py - by) : (px - bx); // the constant local coord
    const start = horizontal ? (px - bx) : (py - by);  // local coord we slide
    const len = horizontal ? plan.width : plan.height;
    const roleFor = (v) => (horizontal ? roleAt(v, fixed) : roleAt(fixed, v));

    if (!isPrivate(roleFor(start))) return { x: px, y: py };
    for (let d = 1; d < len; d++) {
      for (const v of [start - d, start + d]) {
        if (v < 1 || v >= len - 1) continue; // keep off the very corners
        if (!isPrivate(roleFor(v))) {
          return horizontal ? { x: bx + v, y: py } : { x: px, y: by + v };
        }
      }
    }
    return { x: px, y: py }; // nothing better; leave as-is
  }

  /**
   * Stamp an authored, frontage-oriented floorplan at building origin (x,y):
   * interior partition walls (between differing room chars), interior doors,
   * authoritative room roles (building.rooms), and baked furniture
   * (building.furniturePlan, consumed later by FurniturePlanner). The building
   * shell (perimeter walls, entrance, back door) is already drawn.
   */
  stampFloorplan(x, y, plan) {
    const charAt = (px, py) => (plan.grid[py] ? plan.grid[py][px] : undefined);

    // Interior partition walls: a wall sits between two adjacent cells whose
    // room char differs. Set both sides so rendering/queries agree.
    for (let py = 0; py < plan.height; py++) {
      for (let px = 0; px < plan.width; px++) {
        const c = charAt(px, py);
        if (px + 1 < plan.width && charAt(px + 1, py) !== c) {
          this.setEdgeWall(x + px, y + py, 'e', true);
          this.setEdgeWall(x + px + 1, y + py, 'w', true);
        }
        if (py + 1 < plan.height && charAt(px, py + 1) !== c) {
          this.setEdgeWall(x + px, y + py, 's', true);
          this.setEdgeWall(x + px, y + py + 1, 'n', true);
        }
      }
    }

    // Interior doors (carve the partition edge and record door metadata).
    for (const d of plan.doors) {
      this.metadata.doors.push({ x: x + d.x, y: y + d.y, isLocked: false, isOpen: false, edge: d.edge });
    }

    // Room roles: group cells by char (each char = one room instance).
    const groups = new Map();
    for (let py = 0; py < plan.height; py++) {
      for (let px = 0; px < plan.width; px++) {
        const c = charAt(px, py);
        if (!groups.has(c)) groups.set(c, []);
        groups.get(c).push({ x: x + px, y: y + py });
      }
    }
    const rooms = [];
    for (const [c, cells] of groups) {
      const role = (plan.legend && plan.legend[c]) || 'bedroom';
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, sx = 0, sy = 0;
      for (const cell of cells) {
        minX = Math.min(minX, cell.x); maxX = Math.max(maxX, cell.x);
        minY = Math.min(minY, cell.y); maxY = Math.max(maxY, cell.y);
        sx += cell.x; sy += cell.y;
      }
      const cx = sx / cells.length, cy = sy / cells.length;
      let seed = cells[0], bestD = Infinity;
      for (const cell of cells) {
        const d = (cell.x - cx) ** 2 + (cell.y - cy) ** 2;
        if (d < bestD) { bestD = d; seed = cell; }
      }
      rooms.push({ role, minX, minY, maxX, maxY, area: cells.length, seedX: seed.x, seedY: seed.y });
    }
    const building = this.metadata.buildings.find(b => b.x === x && b.y === y);
    if (building) {
      building.rooms = rooms;
      building.furniturePlan = plan.furniture.map(f => {
        const base = FLOORPLAN_FOOTPRINTS[f.type] || { w: 1, h: 1 };
        const fw = (f.rot % 2) ? base.h : base.w;
        const fh = (f.rot % 2) ? base.w : base.h;
        return { type: f.type, x: x + f.x, y: y + f.y, w: fw, h: fh, rot: f.rot };
      });
    }
  }

  /**
   * Flood-fill a just-subdivided residential building into rooms and tag each
   * with an authoritative role (living/bedroom/bathroom/kitchen/hall). Stored
   * as a slim descriptor on building.rooms so downstream systems (furniture,
   * loot, spawns) share one source of truth instead of re-guessing.
   */
  designateRooms(x, y) {
    const building = this.metadata.buildings.find(b => b.x === x && b.y === y);
    if (!building) return;
    const grid = makeLayoutGrid(this.layout, this.metadata.doors);
    const rooms = findRooms(grid, building);
    assignRoles(building, rooms);
    building.rooms = rooms.map(toSlimRoom);
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
    const wallOffset = isHorizontal ? Math.floor(width * 0.6) : Math.floor(height * 0.6);
    
    // 1. Build the structure
    for (let ty = y; ty < y + height; ty++) {
      for (let tx = x; tx < x + width; tx++) {
        const isInternalWall = type === 'firestation' && (isHorizontal ? tx === x + wallOffset : ty === y + wallOffset);

        this.setTerrain(tx, ty, 'floor');
        
        if (ty === y) this.setEdgeWall(tx, ty, 'n', true);
        if (ty === y + height - 1) this.setEdgeWall(tx, ty, 's', true);
        if (tx === x) this.setEdgeWall(tx, ty, 'w', true);
        if (tx === x + width - 1) this.setEdgeWall(tx, ty, 'e', true);

        if (isInternalWall) {
          if (isHorizontal) this.setEdgeWall(tx, ty, 'w', true);
          else this.setEdgeWall(tx, ty, 'n', true);
        }
      }
    }

    // 2. Entrance Logic
    let entranceX, entranceY, entranceEdge;
    if (frontage === 'east') { entranceX = x + width - 1; entranceY = y + Math.floor(height / 2); entranceEdge = 'e'; }
    else if (frontage === 'west') { entranceX = x; entranceY = y + Math.floor(height / 2); entranceEdge = 'w'; }
    else if (frontage === 'south') { entranceX = x + Math.floor(width / 2); entranceY = y + height - 1; entranceEdge = 's'; }
    else { entranceX = x + Math.floor(width / 2); entranceY = y; entranceEdge = 'n'; }

    if (type === 'firestation') {
        const appSize = 4;
        const appOffset = Math.floor(wallOffset / 2) - 2;
        
        for (let i = 0; i < appSize; i++) {
            let ax = entranceX, ay = entranceY;
            if (isHorizontal) ax = x + appOffset + i; else ay = y + appOffset + i;
            this.setTerrain(ax, ay, 'floor');
            this.metadata.doors.push({ x: ax, y: ay, isOpening: true, isOpen: true, edge: entranceEdge });
        }

        let sx = entranceX, sy = entranceY;
        if (isHorizontal) sx = x + width - 3; else sy = y + height - 3;
        this.setTerrain(sx, sy, 'floor');
        this.metadata.doors.push({ x: sx, y: sy, isLocked: gameRandom.next() < 0.2, isOpen: false, edge: entranceEdge });

        let ix, iy, iEdge;
        if (isHorizontal) { ix = x + wallOffset; iy = y + Math.floor(height / 2); iEdge = 'w'; }
        else { ix = x + Math.floor(width / 2); iy = y + wallOffset; iEdge = 'n'; }
        this.setTerrain(ix, iy, 'floor');
        this.metadata.doors.push({ x: ix, y: iy, isLocked: false, isOpen: false, edge: iEdge });
        
        entranceX = sx; entranceY = sy; 
    } else {
        this.setTerrain(entranceX, entranceY, 'floor');
        this.metadata.doors.push({ x: entranceX, y: entranceY, isLocked: gameRandom.next() < 0.1, isOpen: false, edge: entranceEdge });
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
        if (frontage === 'east') signX += 3;
        else if (frontage === 'west') signX -= 3;
        else if (frontage === 'south') signY += 3;
        else signY -= 3; // frontage === 'north'
        this.metadata.placeIcons.push({ subtype: type, x: signX, y: signY });
    }

    // 5. Place windows on the frontage (front wall) of the special building
    const frontTiles = [];
    let dx = 0, dy = 0, wEdge;
    if (frontage === 'east') {
      dx = -1; wEdge = 'e';
      for (let cy = y + 1; cy < y + height - 1; cy++) {
        frontTiles.push({ x: x + width - 1, y: cy });
      }
    } else if (frontage === 'west') {
      dx = 1; wEdge = 'w';
      for (let cy = y + 1; cy < y + height - 1; cy++) {
        frontTiles.push({ x: x, y: cy });
      }
    } else if (frontage === 'south') {
      dy = -1; wEdge = 's';
      for (let cx = x + 1; cx < x + width - 1; cx++) {
        frontTiles.push({ x: cx, y: y + height - 1 });
      }
    } else if (frontage === 'north') {
      dy = 1; wEdge = 'n';
      for (let cx = x + 1; cx < x + width - 1; cx++) {
        frontTiles.push({ x: cx, y: y });
      }
    }

    let candidates = frontTiles.filter(t => {
      if (!this.layout[t.y][t.x].edgeWalls[wEdge]) return false;
      // Must not be a door
      if (this.metadata.doors.some(d => d.x === t.x && d.y === t.y)) return false;
      // Must not overlap with place icons (like signs)
      if (this.metadata.placeIcons.some(pi => pi.x === t.x && pi.y === t.y)) return false;
      
      return true;
    });

    if (candidates.length > 0) {
      let numRequested = gameRandom.nextInt(0, 1) + 1; // 1 or 2 windows
      const selected = [];

      for (let i = 0; i < numRequested; i++) {
        if (candidates.length === 0) break;
        const idx = gameRandom.nextInt(0, candidates.length - 1);
        const pick = candidates[idx];
        selected.push(pick);
        candidates = candidates.filter(c => Math.abs(c.x - pick.x) + Math.abs(c.y - pick.y) > 1);
      }

      selected.forEach(t => {
        this.metadata.windows.push({
          x: t.x,
          y: t.y,
          isLocked: gameRandom.next() < 0.7,
          isOpen: false,
          edge: wEdge
        });
      });
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
        this.setTerrain(curX, curY, 'floor');
        if (curY === y + 1) this.setEdgeWall(curX, curY, 'n', true);
        if (curY === y + tentHeight) this.setEdgeWall(curX, curY, 's', true);
        if (curX === startX + 1) this.setEdgeWall(curX, curY, 'w', true);
        if (curX === startX + tentWidth) this.setEdgeWall(curX, curY, 'e', true);
      }
    }

    const entranceX = isFacingEast ? startX + tentWidth : startX + 1;
    const entranceEdge = isFacingEast ? 'e' : 'w';
    const entranceYStart = y + Math.floor(tentHeight / 2);
    for (let ey = entranceYStart; ey < entranceYStart + 2; ey++) {
      this.setTerrain(entranceX, ey, 'floor');
      this.metadata.doors.push({ x: entranceX, y: ey, isOpening: true, isOpen: true, edge: entranceEdge });
    }

    this.registerBuilding('army_tent', startX + 1, y + 1, tentWidth, tentHeight);
  }

  /**
   * Register building metadata
   */
  registerBuilding(type, x, y, width, height, extra = {}) {
    const buildingData = { type, x, y, width, height, ...extra };
    this.metadata.buildings.push(buildingData);
    
    if (isSpecialBuilding(type)) {
      this.metadata.specialBuildings.push(buildingData);
    }
  }

  /**
   * Place windows around a building
   */
  placeWindows(x, y, w, h) {
    const walls = [
      { name: 'top', tiles: [], dx: 0, dy: 1, edge: 'n' },
      { name: 'bottom', tiles: [], dx: 0, dy: -1, edge: 's' },
      { name: 'left', tiles: [], dx: 1, dy: 0, edge: 'w' },
      { name: 'right', tiles: [], dx: -1, dy: 0, edge: 'e' }
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
        if (!this.layout[t.y][t.x].edgeWalls[wall.edge]) return false;
        if (this.metadata.doors.some(d => d.x === t.x && d.y === t.y)) return false;
        
        return true;
      });

      if (candidates.length === 0) return;

      let numRequested = gameRandom.next() < 0.2 ? 0 : (gameRandom.next() < 0.7 ? 1 : 2);
      const selected = [];

      for (let i = 0; i < numRequested; i++) {
        if (candidates.length === 0) break;
        const idx = gameRandom.nextInt(0, candidates.length - 1);
        const pick = candidates[idx];
        selected.push(pick);
        candidates = candidates.filter(c => Math.abs(c.x - pick.x) + Math.abs(c.y - pick.y) > 1);
      }

      selected.forEach(t => {
        this.metadata.windows.push({
          x: t.x,
          y: t.y,
          isLocked: gameRandom.next() < 0.7,
          isOpen: false,
          edge: wall.edge
        });
      });
    });
  }

  /**
   * Subdivide a building into rooms
   */
  subdivideBuilding(x, y, w, h) {
    const building = this.metadata.buildings.find(b => b.x === x && b.y === y);
    const frontage = building?.frontage || 'north';
    const entranceX = building?.entranceX || (x + Math.floor(w / 2));
    const entranceY = building?.entranceY || y;
    const backX = building?.backX || (x + Math.floor(w / 2));
    const backY = building?.backY || (y + h - 1);

    const iw = w - 2;
    const ih = h - 2;

    if (iw < 8 || ih < 8) {
      this.generateDirectPartitionLayout(x, y, w, h, entranceX, entranceY, backX, backY);
    } else {
      const roll = gameRandom.next();
      if (roll < 0.5) {
        this.generateCentralHallwayLayout(x, y, w, h, frontage, entranceX, entranceY, backX, backY);
      } else if (roll < 0.8) {
        this.generateLivingRoomHubLayout(x, y, w, h, frontage, entranceX, entranceY, backX, backY);
      } else {
        this.generateLCorridorLayout(x, y, w, h, frontage, entranceX, entranceY, backX, backY);
      }
    }
  }

  generateCentralHallwayLayout(x, y, w, h, frontage, entranceX, entranceY, backX, backY) {
    const minInteriorSize = MAP_GEN_CONFIG.minInteriorSize;
    if (frontage === 'north' || frontage === 'south') {
      // Vertical hallway (width 2)
      let hallX = Math.max(x + 3, Math.min(x + w - 5, entranceX - 1));
      
      // Prevent blocking back door
      if (hallX === backX) {
        if (hallX + 1 <= x + w - 5) hallX += 1;
        else hallX -= 1;
      } else if (hallX + 2 === backX) {
        if (hallX - 1 >= x + 3) hallX -= 1;
        else hallX += 1;
      }
      hallX = Math.max(x + 3, Math.min(x + w - 5, hallX));

      // Build vertical walls
      for (let curY = y; curY <= y + h - 1; curY++) {
        this.setEdgeWall(hallX, curY, 'w', true);
        this.setEdgeWall(hallX + 2, curY, 'w', true);
      }

      // Partition left side horizontally
      const leftW = hallX - (x + 1);
      if (leftW >= minInteriorSize && h - 2 >= (minInteriorSize * 2) + 1) {
        const splitLeftY = y + 1 + minInteriorSize + Math.floor(gameRandom.next() * (h - 2 - minInteriorSize * 2 - 1));
        if (splitLeftY !== backY && splitLeftY !== entranceY) {
          for (let curX = x; curX <= hallX - 1; curX++) {
            this.setEdgeWall(curX, splitLeftY, 'n', true);
          }
          const doorX = x + 1 + Math.floor(gameRandom.next() * leftW);
          this.metadata.doors.push({ x: doorX, y: splitLeftY, isLocked: false, isOpen: false, edge: 'n' });
        }
      }

      // Partition right side horizontally
      const rightW = (x + w - 2) - (hallX + 2) + 1;
      if (rightW >= minInteriorSize && h - 2 >= (minInteriorSize * 2) + 1) {
        const splitRightY = y + 1 + minInteriorSize + Math.floor(gameRandom.next() * (h - 2 - minInteriorSize * 2 - 1));
        if (splitRightY !== backY && splitRightY !== entranceY) {
          for (let curX = hallX + 2; curX <= x + w - 1; curX++) {
            this.setEdgeWall(curX, splitRightY, 'n', true);
          }
          const doorX = hallX + 2 + Math.floor(gameRandom.next() * rightW);
          this.metadata.doors.push({ x: doorX, y: splitRightY, isLocked: false, isOpen: false, edge: 'n' });
        }
      }

      // Add doors connecting rooms to vertical hallway
      const doorY1 = y + 1 + gameRandom.nextInt(0, 1);
      this.metadata.doors.push({ x: hallX, y: doorY1, isLocked: false, isOpen: false, edge: 'w' });
      const doorY2 = y + h - 2 - gameRandom.nextInt(0, 1);
      this.metadata.doors.push({ x: hallX, y: doorY2, isLocked: false, isOpen: false, edge: 'w' });

      const doorY3 = y + 1 + gameRandom.nextInt(0, 1);
      this.metadata.doors.push({ x: hallX + 2, y: doorY3, isLocked: false, isOpen: false, edge: 'w' });
      const doorY4 = y + h - 2 - gameRandom.nextInt(0, 1);
      this.metadata.doors.push({ x: hallX + 2, y: doorY4, isLocked: false, isOpen: false, edge: 'w' });

    } else {
      // Horizontal hallway (height 2)
      let hallY = Math.max(y + 3, Math.min(y + h - 5, entranceY - 1));
      
      // Prevent blocking back door
      if (hallY === backY) {
        if (hallY + 1 <= y + h - 5) hallY += 1;
        else hallY -= 1;
      } else if (hallY + 2 === backY) {
        if (hallY - 1 >= y + 3) hallY -= 1;
        else hallY += 1;
      }
      hallY = Math.max(y + 3, Math.min(y + h - 5, hallY));

      // Build horizontal walls
      for (let curX = x; curX <= x + w - 1; curX++) {
        this.setEdgeWall(curX, hallY, 'n', true);
        this.setEdgeWall(curX, hallY + 2, 'n', true);
      }

      // Partition top side vertically
      const topH = hallY - (y + 1);
      if (topH >= minInteriorSize && w - 2 >= (minInteriorSize * 2) + 1) {
        const splitTopX = x + 1 + minInteriorSize + Math.floor(gameRandom.next() * (w - 2 - minInteriorSize * 2 - 1));
        if (splitTopX !== backX && splitTopX !== entranceX) {
          for (let curY = y; curY <= hallY - 1; curY++) {
            this.setEdgeWall(splitTopX, curY, 'w', true);
          }
          const doorY = y + 1 + Math.floor(gameRandom.next() * topH);
          this.metadata.doors.push({ x: splitTopX, y: doorY, isLocked: false, isOpen: false, edge: 'w' });
        }
      }

      // Partition bottom side vertically
      const bottomH = (y + h - 2) - (hallY + 2) + 1;
      if (bottomH >= minInteriorSize && w - 2 >= (minInteriorSize * 2) + 1) {
        const splitBottomX = x + 1 + minInteriorSize + Math.floor(gameRandom.next() * (w - 2 - minInteriorSize * 2 - 1));
        if (splitBottomX !== backX && splitBottomX !== entranceX) {
          for (let curY = hallY + 2; curY <= y + h - 1; curY++) {
            this.setEdgeWall(splitBottomX, curY, 'w', true);
          }
          const doorY = hallY + 2 + Math.floor(gameRandom.next() * bottomH);
          this.metadata.doors.push({ x: splitBottomX, y: doorY, isLocked: false, isOpen: false, edge: 'w' });
        }
      }

      // Add doors connecting rooms to horizontal hallway
      const doorX1 = x + 1 + gameRandom.nextInt(0, 1);
      this.metadata.doors.push({ x: doorX1, y: hallY, isLocked: false, isOpen: false, edge: 'n' });
      const doorX2 = x + w - 2 - gameRandom.nextInt(0, 1);
      this.metadata.doors.push({ x: doorX2, y: hallY, isLocked: false, isOpen: false, edge: 'n' });

      const doorX3 = x + 1 + gameRandom.nextInt(0, 1);
      this.metadata.doors.push({ x: doorX3, y: hallY + 2, isLocked: false, isOpen: false, edge: 'n' });
      const doorX4 = x + w - 2 - gameRandom.nextInt(0, 1);
      this.metadata.doors.push({ x: doorX4, y: hallY + 2, isLocked: false, isOpen: false, edge: 'n' });
    }
  }

  generateLivingRoomHubLayout(x, y, w, h, frontage, entranceX, entranceY, backX, backY) {
    const minInteriorSize = MAP_GEN_CONFIG.minInteriorSize;
    const iw = w - 2;
    const ih = h - 2;

    if (frontage === 'north' || frontage === 'south') {
      let splitY = y + 1 + Math.floor(ih * (frontage === 'north' ? 0.55 : 0.40));
      
      // Shift splitY if it coincides with any door Y position
      if (splitY === backY || splitY === entranceY) {
        if (splitY + 1 <= y + h - 2 - minInteriorSize) splitY += 1;
        else splitY -= 1;
      }
      splitY = Math.max(y + 1 + minInteriorSize, Math.min(y + h - 2 - minInteriorSize, splitY));

      // Draw horizontal partition separating hub from bedrooms
      for (let curX = x; curX <= x + w - 1; curX++) {
        this.setEdgeWall(curX, splitY, 'n', true);
      }

      const bedroomSide = frontage === 'north' ? 'bottom' : 'top';
      let splitX = x + 1 + Math.floor(iw * 0.5);
      
      if (splitX === backX || splitX === entranceX) {
        if (splitX + 1 <= x + w - 2 - minInteriorSize) splitX += 1;
        else splitX -= 1;
      }
      splitX = Math.max(x + 1 + minInteriorSize, Math.min(x + w - 2 - minInteriorSize, splitX));

      // Draw vertical partition separating bedrooms
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
      const doorX1 = x + 1 + Math.floor(gameRandom.next() * (splitX - x - 1));
      this.metadata.doors.push({ x: doorX1, y: splitY, isLocked: false, isOpen: false, edge: 'n' });

      const doorX2 = splitX + Math.floor(gameRandom.next() * (x + w - 1 - splitX));
      this.metadata.doors.push({ x: doorX2, y: splitY, isLocked: false, isOpen: false, edge: 'n' });

    } else {
      let splitX = x + 1 + Math.floor(iw * (frontage === 'west' ? 0.55 : 0.40));
      
      if (splitX === backX || splitX === entranceX) {
        if (splitX + 1 <= x + w - 2 - minInteriorSize) splitX += 1;
        else splitX -= 1;
      }
      splitX = Math.max(x + 1 + minInteriorSize, Math.min(x + w - 2 - minInteriorSize, splitX));

      // Draw vertical partition separating hub from bedrooms
      for (let curY = y; curY <= y + h - 1; curY++) {
        this.setEdgeWall(splitX, curY, 'w', true);
      }

      const bedroomSide = frontage === 'west' ? 'right' : 'left';
      let splitY = y + 1 + Math.floor(ih * 0.5);
      
      if (splitY === backY || splitY === entranceY) {
        if (splitY + 1 <= y + h - 2 - minInteriorSize) splitY += 1;
        else splitY -= 1;
      }
      splitY = Math.max(y + 1 + minInteriorSize, Math.min(y + h - 2 - minInteriorSize, splitY));

      // Draw horizontal partition separating bedrooms
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
      const doorY1 = y + 1 + Math.floor(gameRandom.next() * (splitY - y - 1));
      this.metadata.doors.push({ x: splitX, y: doorY1, isLocked: false, isOpen: false, edge: 'w' });

      const doorY2 = splitY + Math.floor(gameRandom.next() * (y + h - 1 - splitY));
      this.metadata.doors.push({ x: splitX, y: doorY2, isLocked: false, isOpen: false, edge: 'w' });
    }
  }

  generateLCorridorLayout(x, y, w, h, frontage, entranceX, entranceY, backX, backY) {
    const minInteriorSize = MAP_GEN_CONFIG.minInteriorSize;
    const iw = w - 2;
    const ih = h - 2;

    let hallX = Math.max(x + 3, Math.min(x + w - 5, entranceX - 1));
    let hallY = y + 1 + Math.floor(ih / 2) - 1;
    
    // Prevent blocking back door
    if (hallX === backX) {
      if (hallX + 1 <= x + w - 5) hallX += 1;
      else hallX -= 1;
    } else if (hallX + 2 === backX) {
      if (hallX - 1 >= x + 3) hallX -= 1;
      else hallX += 1;
    }
    hallX = Math.max(x + 3, Math.min(x + w - 5, hallX));

    if (hallY === backY) {
      if (hallY + 1 <= y + h - 5) hallY += 1;
      else hallY -= 1;
    } else if (hallY + 1 === backY) {
      if (hallY - 1 >= y + 3) hallY -= 1;
      else hallY += 1;
    }
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

    // 2. Draw vertical segment of the hallway and place doors
    if (frontage === 'north') {
      for (let curY = y; curY <= hallY - 1; curY++) {
        this.setEdgeWall(hallX, curY, 'w', true);
        this.setEdgeWall(hallX + 2, curY, 'w', true);
      }
      
      const doorY1 = y + 1 + Math.floor(gameRandom.next() * (hallY - y - 1));
      this.metadata.doors.push({ x: hallX, y: doorY1, isLocked: false, isOpen: false, edge: 'w' });
      
      const doorY2 = y + 1 + Math.floor(gameRandom.next() * (hallY - y - 1));
      this.metadata.doors.push({ x: hallX + 2, y: doorY2, isLocked: false, isOpen: false, edge: 'w' });

      // Bottom space: split vertically
      let splitX = x + 1 + Math.floor(iw * 0.5);
      if (splitX === backX) {
        if (splitX + 1 <= x + w - 2 - minInteriorSize) splitX += 1;
        else splitX -= 1;
      }
      splitX = Math.max(x + 1 + minInteriorSize, Math.min(x + w - 2 - minInteriorSize, splitX));

      for (let curY = hallY + 2; curY <= y + h - 1; curY++) {
        this.setEdgeWall(splitX, curY, 'w', true);
      }

      const doorY3 = hallY + 2 + Math.floor(gameRandom.next() * (y + h - 1 - (hallY + 2)));
      this.metadata.doors.push({ x: splitX, y: doorY3, isLocked: false, isOpen: false, edge: 'w' });

      const doorX1 = x + 1 + Math.floor(gameRandom.next() * (splitX - x - 1));
      this.metadata.doors.push({ x: doorX1, y: hallY + 2, isLocked: false, isOpen: false, edge: 'n' });

      const doorX2 = splitX + Math.floor(gameRandom.next() * (x + w - 1 - splitX));
      this.metadata.doors.push({ x: doorX2, y: hallY + 2, isLocked: false, isOpen: false, edge: 'n' });

    } else { // south or default
      for (let curY = hallY + 2; curY <= y + h - 1; curY++) {
        this.setEdgeWall(hallX, curY, 'w', true);
        this.setEdgeWall(hallX + 2, curY, 'w', true);
      }

      const doorY1 = hallY + 2 + Math.floor(gameRandom.next() * (y + h - 1 - (hallY + 2)));
      this.metadata.doors.push({ x: hallX, y: doorY1, isLocked: false, isOpen: false, edge: 'w' });

      const doorY2 = hallY + 2 + Math.floor(gameRandom.next() * (y + h - 1 - (hallY + 2)));
      this.metadata.doors.push({ x: hallX + 2, y: doorY2, isLocked: false, isOpen: false, edge: 'w' });

      // Top space: split vertically
      let splitX = x + 1 + Math.floor(iw * 0.5);
      if (splitX === backX) {
        if (splitX + 1 <= x + w - 2 - minInteriorSize) splitX += 1;
        else splitX -= 1;
      }
      splitX = Math.max(x + 1 + minInteriorSize, Math.min(x + w - 2 - minInteriorSize, splitX));

      for (let curY = y; curY <= hallY - 1; curY++) {
        this.setEdgeWall(splitX, curY, 'w', true);
      }

      const doorY3 = y + 1 + Math.floor(gameRandom.next() * (hallY - y - 1));
      this.metadata.doors.push({ x: splitX, y: doorY3, isLocked: false, isOpen: false, edge: 'w' });

      const doorX1 = x + 1 + Math.floor(gameRandom.next() * (splitX - x - 1));
      this.metadata.doors.push({ x: doorX1, y: hallY, isLocked: false, isOpen: false, edge: 'n' });

      const doorX2 = splitX + Math.floor(gameRandom.next() * (x + w - 1 - splitX));
      this.metadata.doors.push({ x: doorX2, y: hallY, isLocked: false, isOpen: false, edge: 'n' });
    }
  }

  generateDirectPartitionLayout(x, y, w, h, entranceX, entranceY, backX, backY) {
    const minInteriorSize = MAP_GEN_CONFIG.minInteriorSize;
    const iw = w - 2;
    const ih = h - 2;

    // Direct simple partition - choose splitting based on aspect ratio
    const splitVertical = iw >= ih;
    if (splitVertical) {
      let splitX = x + 1 + Math.floor(iw * 0.5);
      if (splitX === backX || splitX === entranceX) {
        if (splitX + 1 <= x + w - 2 - minInteriorSize) splitX += 1;
        else splitX -= 1;
      }
      splitX = Math.max(x + 1 + minInteriorSize, Math.min(x + w - 2 - minInteriorSize, splitX));

      for (let curY = y; curY <= y + h - 1; curY++) {
        this.setEdgeWall(splitX, curY, 'w', true);
      }
      const doorY = y + 1 + Math.floor(gameRandom.next() * ih);
      this.metadata.doors.push({ x: splitX, y: doorY, isLocked: false, isOpen: false, edge: 'w' });
    } else {
      let splitY = y + 1 + Math.floor(ih * 0.5);
      if (splitY === backY || splitY === entranceY) {
        if (splitY + 1 <= y + h - 2 - minInteriorSize) splitY += 1;
        else splitY -= 1;
      }
      splitY = Math.max(y + 1 + minInteriorSize, Math.min(y + h - 2 - minInteriorSize, splitY));

      for (let curX = x; curX <= x + w - 1; curX++) {
        this.setEdgeWall(curX, splitY, 'n', true);
      }
      const doorX = x + 1 + Math.floor(gameRandom.next() * iw);
      this.metadata.doors.push({ x: doorX, y: splitY, isLocked: false, isOpen: false, edge: 'n' });
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
      maxBuildings = 10,
      // Optional clamp of the row to a road's extent along the growth axis, so
      // buildings only sit beside the actual road and never overshoot its end
      // into open grass. Default unbounded (legacy behavior).
      runStart = -Infinity,
      runEnd = Infinity
    } = options;

    const horizontalGrowth = (growthDir === 'east' || growthDir === 'west');

    let currentX = anchorX;
    let currentY = anchorY;
    let placedCount = 0;
    let attempts = 0;
    const maxAttempts = 500;

    while (placedCount < maxBuildings && attempts < maxAttempts) {
      attempts++;

      // Stop once we've grown past the road's extent.
      if (growthDir === 'east' && currentX > runEnd) break;
      if (growthDir === 'west' && currentX < runStart) break;
      if (growthDir === 'south' && currentY > runEnd) break;
      if (growthDir === 'north' && currentY < runStart) break;

      const bW = minW + Math.floor(gameRandom.next() * (maxW - minW + 1));
      const bH = minH + Math.floor(gameRandom.next() * (maxH - minH + 1));

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

      // Keep the building's along-axis footprint within the road's extent.
      const runLo = horizontalGrowth ? bX : bY;
      const runHi = horizontalGrowth ? bX + bW - 1 : bY + bH - 1;
      const outsideRun = runLo < runStart || runHi > runEnd;

      const margin = MAP_GEN_CONFIG.buildingBorderMargin;
      if (outsideRun || bX < margin || bX + bW >= this.width - margin || bY < margin || bY + bH >= this.height - margin) {
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
        row.map((cell, x) => {
          const tile = { x, y, terrain: cell.terrain, edgeWalls: cell.edgeWalls, contents: [] };
          if (cell.inventoryItems) tile.inventoryItems = cell.inventoryItems;
          return tile;
        })
      ),
      template: templateName,
      config: config,
      metadata: this.metadata
    };
  }
}
