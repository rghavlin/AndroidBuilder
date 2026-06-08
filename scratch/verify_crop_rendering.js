import { EntityRenderer } from '../client/src/game/renderer/EntityRenderer.js';
import { ItemDefs } from '../client/src/game/inventory/ItemDefs.js';

class MockCtx {
  constructor() {
    this.calls = [];
    this.fillStyle = '';
    this.strokeStyle = '';
    this.lineWidth = 0;
  }
  save() { this.calls.push('save'); }
  restore() { this.calls.push('restore'); }
  beginPath() { this.calls.push('beginPath'); }
  clip() { this.calls.push('clip'); }
  arc(x, y, r, sa, ea) { this.calls.push(`arc(${x},${y},${r})`); }
  fill() { this.calls.push(`fill:${this.fillStyle}`); }
  stroke() { this.calls.push(`stroke:${this.strokeStyle}:lw=${this.lineWidth}`); }
  strokeRect(x, y, w, h) { this.calls.push(`strokeRect(${x},${y},${w},${h})`); }
  fillRect(x, y, w, h) { this.calls.push(`fillRect(${x},${y},${w},${h})`); }
  drawImage(img, ...args) { this.calls.push(`drawImage:${img}`); }
}

const mockEngine = {
  gameMap: {
    getItemsOnTile(x, y) {
      if (x === 0 && y === 0) {
        // Plant crop
        return [{ defId: 'provision.corn_plant' }];
      } else if (x === 1 && y === 1) {
        // Harvestable crop
        return [{ defId: 'provision.harvestable_tomato' }];
      } else if (x === 2 && y === 2) {
        // Wild crop
        return [{ defId: 'provision.harvestable_carrot', isWild: true }];
      } else if (x === 3 && y === 3) {
        // Standard item
        return [{ defId: 'crafting.rope' }];
      } else if (x === 4 && y === 4) {
        // Furniture
        return [{ defId: 'furniture.planter_box' }];
      } else if (x === 5 && y === 5) {
        // Vehicle
        return [{ defId: 'vehicle.toy_wagon' }];
      } else if (x === 6 && y === 6) {
        // Bed (starts with placeable but has furniture traits)
        return [{ defId: 'placeable.bed' }];
      }
      return [];
    }
  }
};

const mockSprites = {
  item: 'item_sprite_img'
};

const visibilitySet = new Set(['0,0', '1,1', '2,2', '3,3', '4,4', '5,5', '6,6']);

console.log('Testing Crop & Furniture/Vehicle Rendering Custom Checks:');

// 1. Plant Crop
{
  const ctx = new MockCtx();
  const entity = { type: 'item', subtype: 'cornplant', x: 0, y: 0 };
  EntityRenderer.renderEntity(ctx, entity, 48, mockSprites, visibilitySet, true, mockEngine);
  const fillCall = ctx.calls.find(c => c.startsWith('fill:'));
  console.log(`- provision.corn_plant: bg fill color = ${fillCall}`);
  if (fillCall === 'fill:#006B18') {
    console.log('  ✅ SUCCESS: Background is green food-color.');
  } else {
    console.error('  ❌ FAILURE: Background is not green.');
  }
}

// 2. Harvestable Crop
{
  const ctx = new MockCtx();
  const entity = { type: 'item', subtype: 'harvestabletomato', x: 1, y: 1 };
  EntityRenderer.renderEntity(ctx, entity, 48, mockSprites, visibilitySet, true, mockEngine);
  const fillCall = ctx.calls.find(c => c.startsWith('fill:'));
  console.log(`- provision.harvestable_tomato: bg fill color = ${fillCall}`);
  if (fillCall === 'fill:#006B18') {
    console.log('  ✅ SUCCESS: Background is green food-color.');
  } else {
    console.error('  ❌ FAILURE: Background is not green.');
  }
}

// 3. Furniture (Planter Box)
{
  const ctx = new MockCtx();
  const entity = { type: 'item', subtype: 'planterbox', x: 4, y: 4 };
  EntityRenderer.renderEntity(ctx, entity, 48, mockSprites, visibilitySet, true, mockEngine);
  const fillCall = ctx.calls.find(c => c.startsWith('fill:'));
  console.log(`- furniture.planter_box: bg fill color = ${fillCall}`);
  if (fillCall === 'fill:#36454F') {
    console.log('  ✅ SUCCESS: Background is charcoal.');
  } else {
    console.error('  ❌ FAILURE: Background is not charcoal.');
  }
}

// 4. Vehicle (Toy Wagon)
{
  const ctx = new MockCtx();
  const entity = { type: 'item', subtype: 'toywagon', x: 5, y: 5 };
  EntityRenderer.renderEntity(ctx, entity, 48, mockSprites, visibilitySet, true, mockEngine);
  const fillCall = ctx.calls.find(c => c.startsWith('fill:'));
  console.log(`- vehicle.toy_wagon: bg fill color = ${fillCall}`);
  if (fillCall === 'fill:#36454F') {
    console.log('  ✅ SUCCESS: Background is charcoal.');
  } else {
    console.error('  ❌ FAILURE: Background is not charcoal.');
  }
}

// 5. Placeable Bed (Furniture)
{
  const ctx = new MockCtx();
  const entity = { type: 'item', subtype: 'bed', x: 6, y: 6 };
  EntityRenderer.renderEntity(ctx, entity, 48, mockSprites, visibilitySet, true, mockEngine);
  const fillCall = ctx.calls.find(c => c.startsWith('fill:'));
  console.log(`- placeable.bed: bg fill color = ${fillCall}`);
  if (fillCall === 'fill:#36454F') {
    console.log('  ✅ SUCCESS: Background is charcoal.');
  } else {
    console.error('  ❌ FAILURE: Background is not charcoal.');
  }
}
