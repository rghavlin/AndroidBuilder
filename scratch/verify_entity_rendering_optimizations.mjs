// Mock localStorage and other global variables BEFORE any imports/execution
const mockLocalStorage = {
  getItem() { return null; },
  setItem() {}
};
global.localStorage = mockLocalStorage;
globalThis.localStorage = mockLocalStorage;

if (typeof global.document === 'undefined') {
  global.document = {
    createElement(tag) {
      if (tag === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext(ctxId) {
            return {
              clearRect() {},
              drawImage() {},
              fillRect() {},
              restore() {},
              save() {}
            };
          }
        };
      }
      return {};
    }
  };
}

// Dynamic imports to prevent ESM hoisting from running before global mocks are established
const { Item } = await import('../client/src/game/inventory/Item.js');
const { Entity } = await import('../client/src/game/entities/Entity.js');
const { EntityFactory } = await import('../client/src/game/EntityFactory.js');
const { GameMap } = await import('../client/src/game/map/GameMap.js');
const { EntityRenderer } = await import('../client/src/game/renderer/EntityRenderer.js');
const { BlueprintRegistry } = await import('../client/src/game/BlueprintRegistry.js');
const assert = (await import('assert')).default;

// Mock Canvas Context
class MockCanvasContext {
  constructor() {
    this.fillStyle = '';
    this.strokeStyle = '';
    this.lineWidth = 0;
    this.rects = [];
    this.images = [];
    this.arcs = [];
    this.clipped = false;
    this.savedStates = 0;
  }
  fillRect(x, y, w, h) {
    this.rects.push({ action: 'fill', x, y, w, h, style: this.fillStyle });
  }
  strokeRect(x, y, w, h) {
    this.rects.push({ action: 'stroke', x, y, w, h, style: this.strokeStyle, width: this.lineWidth });
  }
  drawImage(image, ...args) {
    this.images.push({ image, args });
  }
  save() {
    this.savedStates++;
  }
  restore() {
    this.savedStates--;
  }
  beginPath() {}
  arc(x, y, r, s, e) {
    this.arcs.push({ x, y, r, s, e, fillStyle: this.fillStyle });
  }
  fill() {}
  stroke() {}
  clip() {
    this.clipped = true;
  }
}

// Mock Sprites
const mockSprites = {
  'item': 'mock-item-sprite',
  'item_default': 'mock-default-sprite'
};

// Mock Visibility Set
const mockVisibilitySet = new Set(['2,2']);

let currentTestEntity = null;

// Mock Engine and GameMap
const mockEngine = {
  gameMap: {
    getItemsOnTile(x, y) {
      return currentTestEntity ? [currentTestEntity] : [];
    }
  }
};

async function runTest() {
  console.log("Starting EntityRenderer optimizations verification...");

  // Register mock blueprints
  BlueprintRegistry.register({
    id: 'placeable.auto_turret',
    type: 'item',
    name: 'Auto turret',
    components: {
      Item: { name: 'Auto turret', weight: 5 },
      Renderable: { spriteId: 'turret' }
    }
  });

  BlueprintRegistry.register({
    id: 'placeable.bed',
    type: 'item',
    name: 'Bed',
    components: {
      Item: { name: 'Bed', weight: 15 },
      Renderable: { spriteId: 'bed' }
    }
  });

  // --- Test 1: Item constructor precomputes flags correctly ---
  console.log("Running Test 1: Item constructor precomputed flags...");
  const foodItem = new Item({ defId: 'food.beans', name: 'Canned Beans', categories: ['food'] });
  assert.strictEqual(foodItem.isFood, true, "isFood flag should be precomputed as true");
  assert.strictEqual(foodItem.isMedical, false, "isMedical flag should be precomputed as false");

  const medicalItem = new Item({ defId: 'medical.first_aid_kit', name: 'First Aid Kit', categories: ['medical'] });
  assert.strictEqual(medicalItem.isFood, false, "isFood flag should be precomputed as false");
  assert.strictEqual(medicalItem.isMedical, true, "isMedical flag should be precomputed as true");

  const cropItem = new Item({ defId: 'provision.tomato_plant', name: 'Tomato Plant' });
  assert.strictEqual(cropItem.isCrop, true, "isCrop flag should be precomputed as true");

  const furnitureItem = new Item({ defId: 'placeable.bed', name: 'Wooden Bed', traits: ['furniture'] });
  assert.strictEqual(furnitureItem.isFurnitureOrVehicle, true, "isFurnitureOrVehicle flag should be precomputed as true");
  console.log("✅ Test 1 passed.");

  // --- Test 2: Item updateFromDef correctly recomputes flags ---
  console.log("Running Test 2: Item.updateFromDef flag recomputation...");
  const seedsItem = new Item({ defId: 'food.carrotseeds', name: 'Carrot Seeds' });
  assert.strictEqual(seedsItem.isCrop, false, "Seeds should not be a crop");
  
  seedsItem.updateFromDef('provision.carrot_plant');
  assert.strictEqual(seedsItem.isCrop, true, "Carrot plant should be a crop");
  console.log("✅ Test 2 passed.");

  // --- Test 3: Entity.fromJSON precomputes flags correctly ---
  console.log("Running Test 3: Entity.fromJSON precomputation...");
  const serializedFood = {
    id: 'item-food-1',
    type: 'item',
    defId: 'food.beans',
    categories: ['food']
  };
  const foodEntity = Entity.fromJSON(serializedFood);
  assert.strictEqual(foodEntity.isFood, true, "isFood flag should be restored/computed as true");
  assert.strictEqual(foodEntity.isMedical, false, "isMedical flag should be restored/computed as false");

  // Verify serialization of flags
  const backToJSON = foodEntity.toJSON();
  assert.strictEqual(backToJSON.isFood, true, "isFood flag should be in serialized JSON");
  assert.strictEqual(backToJSON.isMedical, false, "isMedical flag should be in serialized JSON");
  console.log("✅ Test 3 passed.");

  // --- Test 4: GameMap convertLegacyItemToECS precomputes flags correctly ---
  console.log("Running Test 4: GameMap.convertLegacyItemToECS precomputation...");
  const map = new GameMap(10, 10);
  const legacyMedical = {
    instanceId: 'legacy-med-1',
    defId: 'medical.first_aid_kit',
    categories: ['medical']
  };
  const ecsEntity = map.convertLegacyItemToECS(legacyMedical);
  assert.strictEqual(ecsEntity.isMedical, true, "convertLegacyItemToECS should precompute isMedical as true");
  console.log("✅ Test 4 passed.");

  // --- Test 5: EntityFactory assembleFromBlueprint / createFlashlight precomputes flags correctly ---
  console.log("Running Test 5: EntityFactory precomputation...");
  const flashlight = EntityFactory.createFlashlight(0, 0);
  assert.strictEqual(flashlight.isCrop, false, "Flashlight is not a crop");
  assert.strictEqual(flashlight.isFurnitureOrVehicle, false, "Flashlight is not furniture");
  
  const autoTurret = EntityFactory.assembleFromBlueprint('placeable.auto_turret');
  assert.strictEqual(autoTurret.isFurnitureOrVehicle, false, "Auto turret is not a furniture/vehicle");

  const bedEntity = EntityFactory.assembleFromBlueprint('placeable.bed');
  assert.strictEqual(bedEntity.isFurnitureOrVehicle, true, "Bed should be precomputed as furniture/vehicle since placeable.bed has furniture trait in ItemDefs");
  console.log("✅ Test 5 passed.");

  // --- Test 6: EntityRenderer background colors and rendering paths ---
  console.log("Running Test 6: EntityRenderer background colors using precomputed flags...");
  
  // 1. Food Entity
  const foodEnt = Entity.fromJSON({
    id: 'food-entity',
    type: 'item',
    defId: 'food.beans',
    x: 2,
    y: 2
  });
  currentTestEntity = foodEnt;
  const ctxColorFood = new MockCanvasContext();
  EntityRenderer.renderEntity(ctxColorFood, foodEnt, 48, mockSprites, mockVisibilitySet, true, mockEngine);
  const foodArc = ctxColorFood.arcs.find(a => a.fillStyle === '#006B18');
  assert.ok(foodArc, "Food items should have #006B18 background color");

  // 2. Medical Entity
  const medEnt = Entity.fromJSON({
    id: 'med-entity',
    type: 'item',
    defId: 'medical.first_aid_kit',
    x: 2,
    y: 2
  });
  currentTestEntity = medEnt;
  const ctxColorMed = new MockCanvasContext();
  EntityRenderer.renderEntity(ctxColorMed, medEnt, 48, mockSprites, mockVisibilitySet, true, mockEngine);
  const medArc = ctxColorMed.arcs.find(a => a.fillStyle === '#8a0303');
  assert.ok(medArc, "Medical items should have #8a0303 background color");

  // 3. Crop Entity
  const cropEnt = Entity.fromJSON({
    id: 'crop-entity',
    type: 'item',
    defId: 'provision.tomato_plant',
    x: 2,
    y: 2
  });
  currentTestEntity = cropEnt;
  const ctxColorCrop = new MockCanvasContext();
  EntityRenderer.renderEntity(ctxColorCrop, cropEnt, 48, mockSprites, mockVisibilitySet, true, mockEngine);
  const cropArc = ctxColorCrop.arcs.find(a => a.fillStyle === '#006B18');
  assert.ok(cropArc, "Crop items should have #006B18 background color");

  // 4. Furniture Entity
  const furnEnt = Entity.fromJSON({
    id: 'furniture-entity',
    type: 'item',
    defId: 'placeable.bed',
    x: 2,
    y: 2
  });
  currentTestEntity = furnEnt;
  const ctxColorFurniture = new MockCanvasContext();
  EntityRenderer.renderEntity(ctxColorFurniture, furnEnt, 48, mockSprites, mockVisibilitySet, true, mockEngine);
  const furnArc = ctxColorFurniture.arcs.find(a => a.fillStyle === '#36454F');
  assert.ok(furnArc, "Furniture items should have #36454F background color");

  console.log("✅ Test 6 passed.");

  console.log("✅ All EntityRenderer precomputation optimization tests passed successfully!");
}

runTest().catch(err => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
