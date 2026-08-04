import { cn } from "@/lib/utils";
import EquipmentSlot from "./EquipmentSlot";
import { useInventory } from "@/contexts/InventoryContext";
import { useState } from 'react';
import { useGame } from "@/contexts/GameContext.jsx";
import { usePlayer } from "@/contexts/PlayerContext.jsx";
import { useSleep } from "@/contexts/SleepContext.jsx";
import { useAudio } from "@/contexts/AudioContext.jsx";
import { ItemTrait, ItemCategory } from "@/game/inventory/traits";
import { useLog } from "@/contexts/LogContext.jsx";

export default function EquipmentSlots() {
  const { inventoryRef, inventoryVersion, selectedItem, selectItem, clearSelected, equipSelectedItem, depositSelectedInto, attachSelectedInto, loadAmmoDirectly } = useInventory();
  const { isPlayerTurn, isAutosaving, igniteTorch, isModalBlocking } = useGame();
  const { playerStats, isMoving: isAnimatingMovement } = usePlayer();
  const { playSound } = useAudio();
  const { isSleeping } = useSleep();
  const { addLog } = useLog();


  // Match exact slots from InventoryManager.js (canonical seven slots)
  // TEMPORARY: 'armor' is parked here so it's equippable at all before the
  // Phase 6 Stats-tab UI exists. It belongs in the Stats tab (not this always
  // -visible bar) once that lands — move it there, don't leave it here.
  const equipmentSlots = [
    { id: 'backpack', name: 'Backpack', icon: '🎒' },
    { id: 'upper_body', name: 'Upper Body', icon: '👕' },
    { id: 'belt', name: 'Belt', icon: '🪢' },
    { id: 'lower_body', name: 'Lower Body', icon: '👖' },
    { id: 'melee', name: 'Melee', icon: '🔪' },
    { id: 'handgun', name: 'Handgun', icon: '🔫' },
    { id: 'long_gun', name: 'Long Gun', icon: '🔫' },
    { id: 'flashlight', name: 'Flashlight', icon: '🔦' },
    { id: 'phone', name: 'Phone', icon: '📱' },
    { id: 'armor', name: 'Armor', icon: '🛡️' },
  ];

  const handleSlotClick = (slotId: string) => {
    if (isModalBlocking) return;

    const equippedItem = inventoryRef.current?.equipment[slotId];

    // disallow selection/unequip if no AP
    if (playerStats.ap < 1 && (selectedItem || equippedItem)) {
      playSound('Fail');
      return;
    }

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
          if (result.reason !== 'Items inside') {
            playSound('Fail');
          }
          clearSelected();
        }
        return;
      }

      // Special Interaction: Igniting an ignitable equipped item (like a torch) with selected matches/lighter
      const isIgniterSelected = selectedItem.item.defId === 'tool.lighter' || selectedItem.item.defId === 'tool.matchbook' || selectedItem.item.defId === 'tool.bowdrill';
      const isIgnitableEquipped = equippedItem.hasTrait?.(ItemTrait.IGNITABLE);
      if (isIgniterSelected && isIgnitableEquipped) {
        if (!equippedItem.isLit) {
          igniteTorch(selectedItem.item);
          clearSelected();
          return;
        }
      }

      // Worn clothing can't be cut into rags — the player has to take it off first
      const isKnifeSelected = selectedItem.item.hasCategory?.(ItemCategory.KNIFE) || selectedItem.item.categories?.includes('knife') || selectedItem.item.categories?.includes(ItemCategory.KNIFE);
      const isClothingEquipped = equippedItem.hasCategory?.(ItemCategory.CLOTHING) || equippedItem.categories?.includes('clothing') || equippedItem.categories?.includes(ItemCategory.CLOTHING);

      if (isKnifeSelected && isClothingEquipped) {
        addLog(`Take off the ${equippedItem.name} before cutting it into rags.`, 'error');
        playSound('Fail');
        return;
      }

      // Slot is occupied, try loading ammo or adding attachment (if weapon)
      const isWeapon = equippedItem.hasCategory?.(ItemCategory.WEAPON) || equippedItem.hasCategory?.(ItemCategory.GUN) || (equippedItem.attachmentSlots && equippedItem.attachmentSlots.length > 0);
      if (isWeapon) {
        // AMMO LOADING: Direct-load guns use loadAmmoDirectly; magazine-based guns use attachSelectedInto
        const directLoadDefs = ['weapon.357Pistol', 'weapon.hunting_rifle', 'weapon.shotgun'];
        const isDirectLoadGun = directLoadDefs.includes(equippedItem.defId);
        // AMMO is an ItemCategory, not an ItemTrait — hasTrait(ItemTrait.AMMO)
        // read undefined and was always false, so direct-load guns never took
        // the loadAmmoDirectly path from an equipment slot.
        const isAmmoSelected = selectedItem.item.hasCategory?.(ItemCategory.AMMO)
          || selectedItem.item.categories?.includes(ItemCategory.AMMO);

        if (isDirectLoadGun && isAmmoSelected) {
          console.debug('[EquipmentSlots] Direct-loading ammo into equipped gun:', equippedItem.name);
          const loadResult = loadAmmoDirectly(equippedItem);
          if (loadResult.success) return;
        } else {
          console.debug('[EquipmentSlots] Attempting quick attach into equipped weapon:', equippedItem.name);
          const attachResult = attachSelectedInto(equippedItem);
          if (attachResult.success) return;
        }
      }

      // Try Deposit (if container/clothing)
      const isContainer = equippedItem.hasTrait?.(ItemTrait.CONTAINER) || (equippedItem.getPocketContainers && equippedItem.getPocketContainers().length > 0);
      if (isContainer) {
        console.debug('[EquipmentSlots] Attempting quick deposit into equipped container:', equippedItem.name);
        const depositResult = depositSelectedInto(equippedItem);
        if (depositResult.success) return;
      }

      // If all else fails, cancel selection and play fail sound
      playSound('Fail');
      clearSelected();
      return;
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
    <div className="flex items-center w-full h-full px-1 equipment-slots-parent justify-start" data-testid="equipment-slots">
      {/* Slots Row - Left-aligned to utilize all available space on the left */}
      <div className="flex items-center h-full flex-nowrap overflow-x-auto scrollbar-hide equipment-slots-row justify-start w-full">
        {equipmentSlots.map((slot) => {
          // Read equipped item from inventory manager (reactive to inventoryVersion)
          const equippedItem = inventoryRef.current?.equipment[slot.id] || null;

          // Check if this item is selected for unequipping
          const isSelected = selectedItem?.isEquipment &&
            selectedItem?.item?.instanceId === equippedItem?.instanceId;

          const isLight = document.documentElement.classList.contains('light2');
          return (
            <div key={slot.id} className={cn(
              "equipment-slot-size flex-shrink-0",
              equippedItem ? "rounded-full" : "rounded-lg",
              !isLight && "shadow-md"
            )}>
              <EquipmentSlot
                slotId={slot.id}
                item={equippedItem}
                isEquipped={!!equippedItem}
                isSelected={isSelected}
                onClick={() => handleSlotClick(slot.id)}
                className="w-full h-full"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}