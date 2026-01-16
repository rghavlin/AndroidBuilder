import { cn } from "@/lib/utils";
import EquipmentSlot from "./EquipmentSlot";
import { useInventory } from "@/contexts/InventoryContext";

export default function EquipmentSlots() {
  const { inventoryRef, inventoryVersion, selectedItem, selectItem, clearSelected, equipSelectedItem, depositSelectedInto, attachSelectedInto } = useInventory();

  // Match exact slots from InventoryManager.js (canonical seven slots)
  const equipmentSlots = [
    { id: 'backpack', name: 'Backpack', icon: '🎒' },
    { id: 'upper_body', name: 'Upper Body', icon: '👕' },
    { id: 'lower_body', name: 'Lower Body', icon: '👖' },
    { id: 'melee', name: 'Melee', icon: '🔪' },
    { id: 'handgun', name: 'Handgun', icon: '🔫' },
    { id: 'long_gun', name: 'Long Gun', icon: '🔫' },
    { id: 'flashlight', name: 'Flashlight', icon: '🔦' },
  ];

  const handleSlotClick = (slotId: string) => {
    const equippedItem = inventoryRef.current?.equipment[slotId];

    console.log('[EquipmentSlots] handleSlotClick', {
      slotId,
      equippedItem,
      selectedItem,
      isEquipment: selectedItem?.isEquipment
    });

    // Case 1: We are already carrying an item (from grid or other slot)
    if (selectedItem && !selectedItem.isEquipment) {
      // If clicking same item (just in case), deselect
      if (equippedItem && equippedItem.instanceId === selectedItem.item.instanceId) {
        clearSelected();
        return;
      }

      // If slot is empty, try to equip
      if (!equippedItem) {
        const result = equipSelectedItem(slotId);
        if (!result.success) {
          console.warn('[EquipmentSlots] Failed to equip item:', result.reason);
        }
        return;
      }

      // Slot is occupied, try Attachment (if weapon)
      const isWeapon = equippedItem.isWeapon?.() || (equippedItem.attachmentSlots && equippedItem.attachmentSlots.length > 0);
      if (isWeapon) {
        console.debug('[EquipmentSlots] Attempting quick attach into equipped weapon:', equippedItem.name);
        const attachResult = attachSelectedInto(equippedItem);
        if (attachResult.success) return;
      }

      // Try Deposit (if container/clothing)
      const isContainer = equippedItem.isContainer?.() || (equippedItem.getPocketContainers && equippedItem.getPocketContainers().length > 0);
      if (isContainer) {
        console.debug('[EquipmentSlots] Attempting quick deposit into equipped container:', equippedItem.name);
        const depositResult = depositSelectedInto(equippedItem);
        if (depositResult.success) return;
      }

      // If all else fails, fall through to default behavior (switching selection)
    }

    // Case 2: Standard selection/deselection
    if (equippedItem) {
      // If this item is already selected, deselect it (cancel)
      if (selectedItem?.item?.instanceId === equippedItem.instanceId) {
        clearSelected();
      } else {
        // Select equipment item for unequipping (Phase 5H)
        selectItem(equippedItem, `equipment-${slotId}`, 0, 0, true);
      }
    }
  };

  return (
    <div className="border-b border-border p-3" data-testid="equipment-slots">
      <h2 className="text-sm font-semibold text-muted-foreground mb-3">EQUIPMENT</h2>
      <div className="flex gap-1.5 justify-start flex-nowrap overflow-x-auto">
        {equipmentSlots.map((slot) => {
          // Read equipped item from inventory manager (reactive to inventoryVersion)
          const equippedItem = inventoryRef.current?.equipment[slot.id] || null;

          // Check if this item is selected for unequipping
          const isSelected = selectedItem?.isEquipment &&
            selectedItem?.item?.instanceId === equippedItem?.instanceId;

          return (
            <EquipmentSlot
              key={slot.id}
              slotId={slot.id}
              item={equippedItem}
              isEquipped={!!equippedItem}
              isSelected={isSelected}
              onClick={() => handleSlotClick(slot.id)}
            />
          );
        })}
      </div>
    </div>
  );
}