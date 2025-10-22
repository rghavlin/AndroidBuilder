Zombie Road – Inventory Implementation Guide (Revised)
Version: 0.3 (Aligned with current codebase)
Scope: Phased UI integration of existing inventory system

1) Core Principles (Unchanged)
Small, reversible diffs per phase
No scope creep
Global grid size fixed at startup (snapped to [24, 32, 40, 48, 56, 64])
Seven equipment slots only: backpack, upper_body, lower_body, melee, handgun, long_gun, flashlight
Backpacks open only when equipped; specialty containers with OPENABLE_WHEN_NESTED trait can open inline
Order of operations: Save/Load after world/player initialization
Dev-console validation before merging
2) Terminology (Updated)
Item Definition (defId): Blueprint in ItemDefs.js describing traits, size, stackability
Item Instance (instanceId): Concrete instance with instanceId, stackCount, condition, rotation state
Container: Grid-based storage (Container class) with collision detection
Equipment Slot: One of seven slots in InventoryManager.equipment
Grid Slot Size: Pixel size from GridSizeContext.scalableSlotSize or fixedSlotSize
3) Data Model (Current Implementation)
// Item Instance (from Item.js)
interface ItemInstance {
  instanceId: string;           // Unique ID per instance
  defId: string;                // Links to definition
  name: string;
  width: number;                // Grid slots
  height: number;
  rotation: 0 | 90 | 180 | 270;
  x: number;                    // Position in container
  y: number;
  traits: string[];             // ['STACKABLE', 'CONTAINER', etc.]
  stackCount: number;
  stackMax: number;
  condition: number | null;     // For degradable items
  equippableSlot: string | null; // 'backpack', 'melee', etc.
  isEquipped: boolean;
  encumbranceTier: 'light' | 'medium' | 'heavy' | null;
  _containerGridData: object | null; // Serialized container data
}
// Container (from Container.js)
interface Container {
  id: string;                   // containerId
  type: string;                 // 'ground', 'backpack', 'dynamic-pocket', etc.
  name: string;
  width: number;
  height: number;
  autoExpand: boolean;
  autoSort: boolean;
  items: Map<string, Item>;     // instanceId -> Item
  grid: (string | null)[][];    // 2D collision grid
}
// Equipment (from InventoryManager.js)
interface Equipment {
  backpack: Item | null;
  upper_body: Item | null;
  lower_body: Item | null;
  melee: Item | null;
  handgun: Item | null;
  long_gun: Item | null;
  flashlight: Item | null;
}
4) InventoryContext API (To Be Implemented)
Current state: Basic context exists but needs these methods exposed:

// Read operations
getContainer(containerId: string): Container | null;
getEquippedBackpackContainer(): Container | null;
getEncumbranceModifiers(): { evade: number; ap: number };
canOpenContainer(item: Item): boolean;  // Checks backpack equipped or OPENABLE_WHEN_NESTED trait
// Mutation operations
equipItem(item: Item, slot?: string): { success: boolean; reason?: string };
unequipItem(slot: string): { success: boolean; reason?: string };
moveItem(itemId: string, fromContainerId: string, toContainerId: string, x?: number, y?: number): { success: boolean; reason?: string };
dropItemToGround(item: Item, x?: number, y?: number): boolean;
// Ground operations
organizeGroundItems(): boolean;
quickPickupByCategory(category: string): { success: boolean; collected: number; failed: number };
5) Grid Size Contract (Implemented)
✅ Already implemented in GridSizeContext:

Single global slot size computed at startup
Exposed as scalableSlotSize and fixedSlotSize
No recalculation on resize
Action needed: Verify all inventory UIs use GridSizeContext consistently.

6) Equipment Slots (Already Correct)
✅ Already implemented correctly in InventoryManager:

this.equipment = {
  backpack: null,
  upper_body: null,
  lower_body: null,
  melee: null,
  handgun: null,
  long_gun: null,
  flashlight: null
};
Action needed: Update EquipmentSlots.tsx to match these exact slots (currently shows incorrect slots: helmet, vest, gloves, boots).

7) Phased Implementation Plan
Phase 1: Fix Equipment Slot UI ✅ Ready to implement
Goal: Match UI to actual equipment slots

Files to change:

client/src/components/Inventory/EquipmentSlots.tsx
Tasks:

Replace placeholder slots with actual seven slots
Connect to InventoryContext for equipped state
Add click handlers for equip/unequip actions
Validation:

UI shows exactly 7 slots with correct names
No helmet, vest, gloves, boots displayed
Phase 2: Connect InventoryContext to InventoryManager ✅ Ready to implement
Goal: Expose InventoryManager methods through context

Files to change:

client/src/contexts/InventoryContext.jsx
Tasks:

Add methods: getContainer, getEquippedBackpackContainer, canOpenContainer
Add mutation methods: equipItem, unequipItem, moveItem, dropItemToGround
Increment inventoryVersion on mutations to trigger re-renders
Validation:

All methods callable from components
Version increments trigger UI updates
No direct InventoryManager imports in components
Phase 3: Wire Backpack Grid ✅ Ready to implement
Goal: Display equipped backpack contents

Files to change:

client/src/components/Inventory/BackpackGrid.tsx
Tasks:

Use useInventory() to get equipped backpack container
Pass container data to UniversalGrid
Implement click/drag handlers calling moveItem
Show "No backpack equipped" state
Validation:

Empty when no backpack equipped
Shows container grid when backpack equipped
Items render at correct positions
Drag-drop calls moveItem correctly
Phase 4: Wire Ground Grid ✅ Ready to implement
Goal: Display and interact with ground items

Files to change:

client/src/components/Inventory/GroundItemsGrid.tsx
Tasks:

Get ground container via getContainer('ground')
Pass to UniversalGrid
Implement drop handler for items
Add "Organize" and "Quick Pickup" buttons
Validation:

Ground items display correctly
Drop from backpack to ground works
Organize button triggers category sorting
Quick pickup collects items to backpack
Phase 5: Equipment Slot Interactions ✅ Ready to implement
Goal: Equip/unequip items via drag or click

Files to change:

client/src/components/Inventory/EquipmentSlot.tsx
client/src/components/Inventory/EquipmentSlots.tsx
Tasks:

Show equipped item icon/name in slot
Right-click to unequip
Drag item from backpack to slot to equip
Validate item can equip in that slot
Validation:

Can equip backpack from ground/backpack
Can equip weapons in correct slots
Unequip returns to backpack or ground
Invalid slot assignments rejected
Phase 6: Floating Container Panels 🔄 Partially implemented
Goal: Open specialty containers inline

Files to change:

client/src/components/Inventory/FloatingContainer.tsx (exists but unused)
Add container-open logic to grid click handlers
Tasks:

Click container item with OPENABLE_WHEN_NESTED trait
Show floating panel with container's grid
Allow moves in/out of nested container
Prevent backpack from opening inline
Validation:

Lunchbox/toolbox opens inline when clicked
Backpack does NOT open inline
Nested container items visible and movable
Closing panel persists container state
Phase 7: Save/Load Integration ✅ Already exists
Goal: Verify inventory persists correctly

Files to verify:

client/src/game/GameSaveSystem.js
client/src/game/inventory/InventoryManager.js (toJSON/fromJSON)
Tasks:

Confirm InventoryManager.toJSON() called in save
Confirm InventoryManager.fromJSON() called in load
Test save with equipped items + containers
Test load restores exact state
Validation:

Save includes all containers and equipment
Load restores items to correct positions
Equipped backpack remains equipped
Ground items persist
Phase 8: Encumbrance Display ✅ Ready to implement
Goal: Show encumbrance modifiers in UI

Files to change:

client/src/components/Game/GameControls.tsx (or player stats display)
Tasks:

Call getEncumbranceModifiers() from context
Display evade/AP modifiers near player stats
Update when equipment changes
Validation:

Light clothing shows +2 evade
Heavy clothing shows -2 evade, -2 AP
Modifiers update on equip/unequip
8) Interaction Rules (Implemented in Container.js)
✅ Already implemented:

Placement: Rectangular regions, collision detection
Stacking: Automatic merging via attemptStacking()
Rotation: Items can rotate 0/90/180/270 degrees
Auto-expansion: Ground container expands automatically
Validation: validatePlacement() checks bounds and collisions
9) Developer Console Test Matrix
Use DevConsole.jsx to validate each phase:

A. Grid Size Discipline

// Check slot size consistency
console.log('Slot size:', GridSizeContext.scalableSlotSize);
// Resize window → verify no change
B. Equipment Slots

// List all slots
console.log(inventoryRef.current.equipment);
// Should show exactly 7 slots
C. Backpack Wiring

// Create and equip backpack
const backpack = createItem('container', 'backpack', { /* */ });
inventoryRef.current.equipItem(backpack, 'backpack');
// Verify equipped and container accessible
D. Ground ↔ Backpack Moves

// Add items to ground, move to backpack
const result = inventoryRef.current.moveItem(itemId, 'ground', backpackContainerId, 0, 0);
console.log(result); // { success: true }
E. Specialty Container Inline

// Check if lunchbox can open inline
console.log(inventoryRef.current.canOpenContainer(lunchboxItem)); // true
console.log(inventoryRef.current.canOpenContainer(backpackItem)); // false (unless equipped)
F. Save/Load

// Save
const saveData = GameSaveSystem.saveGameState(gameState);
// Load
const loaded = await GameSaveSystem.loadGameState(saveData);
// Verify inventory matches
10) Critical Differences from Original Plan
✅ Equipment slots already correct - no changes needed to backend
✅ Save/Load already implemented - just needs testing
✅ GroundManager already advanced - has categorization, smart placement, quick pickup
⚠️ UI components exist but disconnected - BackpackGrid, GroundItemsGrid need wiring
⚠️ EquipmentSlots.tsx shows wrong slots - needs immediate fix
⚠️ InventoryContext incomplete - needs method exposure
11) Next Immediate Action
Start with Phase 1: Fix EquipmentSlots.tsx to show the correct 7 slots and remove helmet/vest/gloves/boots.

This is the smallest, safest change that aligns UI with the backend model.

