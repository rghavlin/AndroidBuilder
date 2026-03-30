
const width = 9;
const height = 12;
const type = process.argv[2] || 'police';
const isLeft = true;
const startX = 0;
const y = 0;

const entranceY = y + Math.floor(height / 2);
const entranceX = isLeft ? startX + width - 1 : startX;

console.log(`Testing type: ${type}, entranceX: ${entranceX}, entranceY: ${entranceY}`);

const layout = Array(height).fill().map(() => Array(width).fill('.'));

for (let curY = y; curY < y + height; curY++) {
  for (let curX = startX; curX < startX + width; curX++) {
    const isPerimeter = (curY === y || curY === y + height - 1 || curX === startX || curX === startX + width - 1);
    const isCorner = (curY === y || curY === y + height - 1) && (curX === startX || curX === startX + width - 1);
    
    if (isPerimeter) {
      let canHaveWindow = !isCorner;
      
      if (type === 'police') {
        canHaveWindow = false;
      }
      
      if (type === 'grocer' || type === 'gas_station') {
        if (curX !== entranceX) {
          canHaveWindow = false;
        }
      }
      
      if (curX === entranceX) {
        if (type === 'firestation') {
          if (curY >= y + 4 && curY < y + 8) {
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

// Print layout
console.log(layout.map(row => row.join('')).join('\n'));
