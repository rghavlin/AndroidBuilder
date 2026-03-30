
const type = 'firestation';
const width = type === 'firestation' ? 10 : 9;
const height = type === 'firestation' ? 17 : 12;
const isLeft = true;
const startX = 0;
const y = 0;

const entranceY = type === 'firestation' ? y + 14 : y + Math.floor(height / 2);
const entranceX = isLeft ? startX + width - 1 : startX;

console.log(`Testing type: ${type}, width: ${width}, height: ${height}, entranceX: ${entranceX}, entranceY: ${entranceY}`);

const layout = Array(height).fill().map(() => Array(width).fill('.'));

for (let curY = y; curY < y + height; curY++) {
  for (let curX = startX; curX < startX + width; curX++) {
    const isPerimeter = (curY === y || curY === y + height - 1 || curX === startX || curX === startX + width - 1);
    const isCorner = (curY === y || curY === y + height - 1) && (curX === startX || curX === startX + width - 1);
    
    // Internal separation wall for fire station
    const isInternalWall = type === 'firestation' && curY === y + 11 && curX > startX && curX < startX + width - 1;

    if (isPerimeter || isInternalWall) {
      let canHaveWindow = !isCorner && !isInternalWall;
      
      // Rule 1: Police stations and fire stations have no windows
      if (type === 'police' || type === 'firestation') {
        canHaveWindow = false;
      }
      
      // Rule 2: Grocer and Gas Station only have windows on the street-facing side
      if (type === 'grocer' || type === 'gas_station') {
        if (curX !== entranceX) {
          canHaveWindow = false;
        }
      }
      
      // Rule 3: No window on door or firestation opening
      if (curX === entranceX) {
        if (type === 'firestation') {
          // Apparatus opening y+4 to y+7 and support door y+14
          if ((curY >= y + 4 && curY < y + 8) || curY === y + 14) {
            canHaveWindow = false;
          }
        } else if (curY === entranceY) {
          canHaveWindow = false;
        }
      }

      if (canHaveWindow) {
        layout[curY][curX] = 'W';
      } else {
        layout[curY][curX] = 'B';
      }
    } else {
      layout[curY][curX] = 'f';
    }
  }
}

// Add firestation openings/doors to the test layout to verify them
if (type === 'firestation') {
    // Apparatus opening
    for (let fy = y + 4; fy < y + 8; fy++) {
        layout[fy][entranceX] = 'd'; // door/opening
    }
    // Support room door
    layout[y + 14][entranceX] = 'D'; // regular door
    // Internal door
    layout[y + 11][startX + 5] = 'i'; // internal door
}

// Print layout
console.log(layout.map(row => row.join('')).join('\n'));
