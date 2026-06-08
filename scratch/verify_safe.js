import { ItemDefs } from '../client/src/game/inventory/ItemDefs.js';
import { Item } from '../client/src/game/inventory/Item.js';
import { Container } from '../client/src/game/inventory/Container.js';
import { InventoryManager } from '../client/src/game/inventory/InventoryManager.js';
import { LootGenerator } from '../client/src/game/map/LootGenerator.js';
import { ItemTrait, ItemCategory } from '../client/src/game/inventory/traits.js';

console.log('=== VERIFICATION: Safe Container Integration ===\n');

// 1. Verify Item Definition
const safeDef = ItemDefs['furniture.safe'];
if (safeDef) {
    console.log('✅ ItemDefs: furniture.safe definition found');
    console.log(`   - Name: ${safeDef.name}`);
    console.log(`   - Width: ${safeDef.width}, Height: ${safeDef.height}`);
    console.log(`   - Image: ${safeDef.imageId}`);
    console.log(`   - Traits: ${JSON.stringify(safeDef.traits)}`);
    console.log(`   - isLocked: ${safeDef.isLocked}`);
    console.log(`   - containerGrid: ${JSON.stringify(safeDef.containerGrid)}`);
    
    const correctWidth = safeDef.width === 3 && safeDef.height === 3;
    const correctTraits = safeDef.traits.includes(ItemTrait.GROUND_ONLY) && 
                          safeDef.traits.includes(ItemTrait.NO_DRAG) && 
                          safeDef.traits.includes(ItemTrait.CONTAINER) &&
                          safeDef.traits.includes(ItemTrait.FURNITURE);
    const correctLocked = safeDef.isLocked === true;
    const correctGrid = safeDef.containerGrid.width === 5 && safeDef.containerGrid.height === 4;

    if (correctWidth && correctTraits && correctLocked && correctGrid) {
        console.log('✅ ItemDefs details match requirements perfectly!');
    } else {
        console.log('❌ ItemDefs details do NOT match requirements!');
    }
} else {
    console.log('❌ ItemDefs: furniture.safe definition NOT found!');
}

// 2. Verify Instance Construction and Serialization
const safeInstance = new Item({ defId: 'furniture.safe' });
if (safeInstance.isLocked === true) {
    console.log('\n✅ Safe Instance: Inherits isLocked: true from def');
} else {
    console.log('\n❌ Safe Instance: Failed to inherit isLocked: true');
}

const serialized = safeInstance.toJSON();
if (serialized.isLocked === true) {
    console.log('✅ Serialization: isLocked is serialized correctly');
} else {
    console.log('❌ Serialization: isLocked not found in serialized data');
}

const deserialized = Item.fromJSON(serialized);
if (deserialized.isLocked === true) {
    console.log('✅ Deserialization: isLocked is restored correctly');
} else {
    console.log('❌ Deserialization: isLocked not restored from JSON');
}

// 3. Verify opening lock checking
const invManager = new InventoryManager();
// Mock ground container
const groundContainer = new Container({ id: 'ground', type: 'ground', width: 10, height: 10 });
invManager.containers.set('ground', groundContainer);
invManager.groundContainer = groundContainer;

// Test locked safe
const safeItem = new Item({ defId: 'furniture.safe' });
groundContainer.addItem(safeItem, 0, 0);

if (invManager.canOpenContainer(safeItem) === false) {
    console.log('\n✅ canOpenContainer: Blocks opening when safe is locked');
} else {
    console.log('\n❌ canOpenContainer: Allows opening a locked safe!');
}

safeItem.isLocked = false;
if (invManager.canOpenContainer(safeItem) === true) {
    console.log('✅ canOpenContainer: Allows opening when safe is unlocked');
} else {
    console.log('❌ canOpenContainer: Blocks opening an unlocked safe!');
}

// 4. Verify player inventory checking and consumption excluding ground
// Add lockpick to ground
const lockpickGround = new Item({ defId: 'tool.lockpick', traits: [ItemTrait.STACKABLE], stackCount: 1 });
groundContainer.addItem(lockpickGround, 4, 4);

if (invManager.hasItemInPlayerInventory('tool.lockpick') === false) {
    console.log('\n✅ hasItemInPlayerInventory: Correctly reports false when item is only on ground');
} else {
    console.log('\n❌ hasItemInPlayerInventory: Erroneously reports true for items on the ground!');
}

// Add backpack to player long_gun or backpack slot
const backpack = new Item({ defId: 'backpack.school', traits: [ItemTrait.EQUIPPABLE, ItemTrait.CONTAINER], equippableSlot: 'backpack' });
invManager.equipment.backpack = backpack;
const backpackGrid = backpack.getContainerGrid();
invManager.containers.set(backpackGrid.id, backpackGrid);

// Add lockpick to backpack
const lockpickPlayer = new Item({ defId: 'tool.lockpick', traits: [ItemTrait.STACKABLE], stackCount: 2 });
backpackGrid.addItem(lockpickPlayer);

if (invManager.hasItemInPlayerInventory('tool.lockpick') === true) {
    console.log('✅ hasItemInPlayerInventory: Correctly reports true when item is in player inventory');
} else {
    console.log('❌ hasItemInPlayerInventory: Failed to find item in player inventory!');
}

// Consume lockpick
const consumed = invManager.consumeItemFromPlayerInventory('tool.lockpick', 1);
if (consumed && lockpickPlayer.stackCount === 1) {
    console.log('✅ consumeItemFromPlayerInventory: Successfully consumed 1 from player inventory stack');
} else {
    console.log(`❌ consumeItemFromPlayerInventory failed: consumed=${consumed}, stackCount=${lockpickPlayer.stackCount}`);
}

// Verify ground lockpick was NOT consumed
if (groundContainer.items.has(lockpickGround.instanceId)) {
    console.log('✅ consumeItemFromPlayerInventory: Ground item was untouched');
} else {
    console.log('❌ consumeItemFromPlayerInventory: Ground item was erroneously consumed!');
}

// Verify hasItemByDefId (which includes ground)
if (invManager.hasItemByDefId('tool.lockpick') === true) {
    console.log('✅ hasItemByDefId: Correctly reports true when items exist on ground or inventory');
} else {
    console.log('❌ hasItemByDefId: Failed to find item on ground or inventory!');
}

// Consume from ground using consumeItemByDefId
// At this stage, lockpickPlayer has stackCount = 1, lockpickGround has stackCount = 1.
// Since consumeItemByDefId prioritizes ground, consuming 1 lockpick should consume the ground one first.
const consumedFromGround = invManager.consumeItemByDefId('tool.lockpick', 1);
if (consumedFromGround && !groundContainer.items.has(lockpickGround.instanceId)) {
    console.log('✅ consumeItemByDefId: Successfully consumed 1 from ground container (prioritized)');
} else {
    console.log('❌ consumeItemByDefId: Failed to prioritize/consume ground lockpick!');
}

// And verify player lockpick is still there
if (backpackGrid.items.has(lockpickPlayer.instanceId) && lockpickPlayer.stackCount === 1) {
    console.log('✅ consumeItemByDefId: Player inventory lockpick was untouched when ground was available');
} else {
    console.log('❌ consumeItemByDefId: Player inventory lockpick was incorrectly modified!');
}

// 5. Verify Safe Loot Spawning
const lootGen = new LootGenerator();
const safeItemToPopulate = new Item({ defId: 'furniture.safe' });
lootGen.populateSafe(safeItemToPopulate);
const itemsInside = safeItemToPopulate.getContainerGrid().getAllItems();
console.log(`\n✅ Safe Loot Spawning: Populated safe with ${itemsInside.length} items`);
itemsInside.forEach(item => {
    console.log(`   - Item: ${item.name} (${item.defId}) size: ${item.width}x${item.height} stack: ${item.stackCount || 1}`);
    if (item.attachments && Object.keys(item.attachments).length > 0) {
        Object.keys(item.attachments).forEach(slotId => {
            const att = item.attachments[slotId];
            console.log(`     -> Attachment in '${slotId}' slot: ${att.name} (${att.defId}) ammoCount=${att.ammoCount || 'N/A'} stackCount=${att.stackCount || 'N/A'}`);
        });
    }
});
