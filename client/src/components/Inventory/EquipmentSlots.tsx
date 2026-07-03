import { cn } from "@/lib/utils";
import EquipmentSlot from "./EquipmentSlot";
import { useInventory } from "@/contexts/InventoryContext";
import { Button } from "@/components/ui/button";
import { useState } from 'react';
import { useGame } from "@/contexts/GameContext.jsx";
import { usePlayer } from "@/contexts/PlayerContext.jsx";
import { useSleep } from "@/contexts/SleepContext.jsx";
import { useAudio } from "@/contexts/AudioContext.jsx";
import { ItemTrait, ItemCategory } from "@/game/inventory/traits";
import { Item, createItemFromDef } from "@/game/inventory/index";
import { useLog } from "@/contexts/LogContext.jsx";
import engine from "@/game/GameEngine";

export default function EquipmentSlots() {
  const { inventoryRef, inventoryVersion, selectedItem, selectItem, clearSelected, equipSelectedItem, depositSelectedInto, attachSelectedInto, loadAmmoDirectly } = useInventory();
  const { isPlayerTurn, isAutosaving, igniteTorch, isModalBlocking } = useGame();
  const { playerStats, isMoving: isAnimatingMovement } = usePlayer();
  const { playSound } = useAudio();
  const { isSleeping } = useSleep();
  const { addLog } = useLog();

  const buttonsDisabled = !isPlayerTurn || isAutosaving || isAnimatingMovement || isSleeping || isModalBlocking;

  // Match exact slots from InventoryManager.js (canonical seven slots)
  const equipmentSlots = [
    { id: 'backpack', name: 'Backpack', icon: '🎒' },
    { id: 'upper_body', name: 'Upper Body', icon: '👕' },
    { id: 'belt', name: 'Belt', icon: '🪢' },
    { id: 'lower_body', name: 'Lower Body', icon: '👖' },
    { id: 'melee', name: 'Melee', icon: '🔪' },
    { id: 'handgun', name: 'Handgun', icon: '🔫' },
    { id: 'long_gun', name: 'Long Gun', icon: '🔫' },
    { id: 'flashlight', name: 'Flashlight', icon: '🔦' },
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
      const isIgniterSelected = selectedItem.item.defId === 'tool.lighter' || selectedItem.item.defId === 'tool.matchbook';
      const isIgnitableEquipped = equippedItem.hasTrait?.(ItemTrait.IGNITABLE);
      if (isIgniterSelected && isIgnitableEquipped) {
        if (!equippedItem.isLit) {
          igniteTorch(selectedItem.item);
          clearSelected();
          return;
        }
      }

      // Special Interaction: Cutting equipped clothing into rags using selected knife
      const isKnifeSelected = selectedItem.item.hasCategory?.(ItemCategory.KNIFE) || selectedItem.item.categories?.includes('knife') || selectedItem.item.categories?.includes(ItemCategory.KNIFE);
      const isClothingEquipped = equippedItem.hasCategory?.(ItemCategory.CLOTHING) || equippedItem.categories?.includes('clothing') || equippedItem.categories?.includes(ItemCategory.CLOTHING);
      
      if (isKnifeSelected && isClothingEquipped) {
        if (playerStats.ap < 1) {
          addLog('Not enough AP to cut clothing into rags (1 required)', 'error');
          playSound('Fail');
          return;
        }

        // Check if clothing has items inside pockets/container grid
        const pockets = equippedItem.getPocketContainers?.() || [];
        const internalGrid = equippedItem.getContainerGrid?.();
        let hasItemsInside = false;
        if (internalGrid && internalGrid.items && internalGrid.items.size > 0) {
          hasItemsInside = true;
        }
        for (const pocket of pockets) {
          if (pocket.items && pocket.items.size > 0) {
            hasItemsInside = true;
          }
        }

        if (hasItemsInside) {
          addLog('Empty the pockets of the clothing before cutting it.', 'error');
          playSound('Fail');
          return;
        }

        // Proceed with cutting
        engine.player.useAP(1);
        playSound('Click');

        // Create the rag item
        const ragData = createItemFromDef('crafting.rag');
        const ragItem = new Item(ragData);

        // Unequip/remove the clothing from slot
        inventoryRef.current.equipment[slotId] = null;
        equippedItem.isEquipped = false;

        // Try to add/stack the rag
        engine.inventoryManager.addItem(ragItem);

        addLog(`You cut ${equippedItem.name} into a rag.`, 'item');
        clearSelected();
        return;
      }

      // Slot is occupied, try loading ammo or adding attachment (if weapon)
      const isWeapon = equippedItem.hasCategory?.(ItemCategory.WEAPON) || equippedItem.hasCategory?.(ItemCategory.GUN) || (equippedItem.attachmentSlots && equippedItem.attachmentSlots.length > 0);
      if (isWeapon) {
        // AMMO LOADING: Direct-load guns use loadAmmoDirectly; magazine-based guns use attachSelectedInto
        const directLoadDefs = ['weapon.357Pistol', 'weapon.hunting_rifle', 'weapon.shotgun'];
        const isDirectLoadGun = directLoadDefs.includes(equippedItem.defId);
        const isAmmoSelected = selectedItem.item.hasTrait?.(ItemTrait.AMMO);

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
    <div className="flex items-center gap-2 w-full h-full px-1" data-testid="equipment-slots">
      {/* Label and Tucked Dev Button - vertically centered, shifted left */}
      <div className="flex flex-col justify-center min-w-[50px] shrink-0 pl-1">
        {import.meta.env.DEV && (
          <Button
            onClick={() => (window as any).toggleDevConsole?.(true)}
            disabled={buttonsDisabled}
            className="bg-zinc-800/60 hover:bg-zinc-700/80 text-zinc-400 h-3.5 px-1 text-[7px] font-mono border border-white/5 leading-none transition-all mb-1 w-fit shadow-sm"
            data-testid="button-dev-console"
          >
            DEV
          </Button>
        )}
        <h2 className="text-[8px] font-black text-zinc-400 uppercase tracking-wider pl-0.5">
          EQUIPMENT
        </h2>
      </div>

      {/* Slots Row - Shifting left by using smaller gap and minimal padding */}
      <div className="flex gap-1.5 items-center h-full flex-nowrap overflow-x-auto scrollbar-hide">
        {equipmentSlots.map((slot) => {
          // Read equipped item from inventory manager (reactive to inventoryVersion)
          const equippedItem = inventoryRef.current?.equipment[slot.id] || null;

          // Check if this item is selected for unequipping
          const isSelected = selectedItem?.isEquipment &&
            selectedItem?.item?.instanceId === equippedItem?.instanceId;

          return (
            <div key={slot.id} className="w-12 h-12 flex-shrink-0 shadow-md">
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