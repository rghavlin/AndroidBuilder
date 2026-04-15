import { cn } from "@/lib/utils";
import EquipmentSlot from "./EquipmentSlot";
import { useInventory } from "@/contexts/InventoryContext";
import { Button } from "@/components/ui/button";
import { useState } from 'react';
import DevConsole from '../Game/DevConsole.jsx';
import { useGame } from "@/contexts/GameContext.jsx";
import { usePlayer } from "@/contexts/PlayerContext.jsx";
import { useSleep } from "@/contexts/SleepContext.jsx";
import { useAudio } from "@/contexts/AudioContext.jsx";

export default function EquipmentSlots() {
  const { inventoryRef, inventoryVersion, selectedItem, selectItem, clearSelected, equipSelectedItem, depositSelectedInto, attachSelectedInto, loadAmmoDirectly } = useInventory();
  const { isPlayerTurn, isAutosaving } = useGame();
  const { playerStats, isMoving: isAnimatingMovement } = usePlayer();
  const { playSound } = useAudio();
  const { isSleeping } = useSleep();
  const [showDevConsole, setShowDevConsole] = useState(false);

  const buttonsDisabled = !isPlayerTurn || isAutosaving || isAnimatingMovement || isSleeping;

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
        }
        return;
      }

      // Slot is occupied, try loading ammo or adding attachment (if weapon)
      const isWeapon = equippedItem.isWeapon?.() || (equippedItem.attachmentSlots && equippedItem.attachmentSlots.length > 0);
      if (isWeapon) {
        // AMMO LOADING: Direct-load guns use loadAmmoDirectly; magazine-based guns use attachSelectedInto
        const directLoadDefs = ['weapon.357Pistol', 'weapon.hunting_rifle', 'weapon.shotgun'];
        const isDirectLoadGun = directLoadDefs.includes(equippedItem.defId);
        const isAmmoSelected = selectedItem.item.isAmmo && selectedItem.item.isAmmo();

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
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-sm font-semibold text-muted-foreground">EQUIPMENT</h2>
        
        {/* Dev Console Button - Relocated from bottom bar */}
        <Button
          onClick={() => setShowDevConsole(true)}
          disabled={buttonsDisabled}
          className="bg-secondary/50 hover:bg-secondary/70 text-secondary-foreground h-6 px-2 text-[10px] font-mono border border-white/5"
          data-testid="button-dev-console"
        >
          DEV
        </Button>
      </div>

      {/* Dev Console Window */}
      {showDevConsole && (
        <DevConsole
          isOpen={showDevConsole}
          onClose={() => setShowDevConsole(false)}
        />
      )}

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