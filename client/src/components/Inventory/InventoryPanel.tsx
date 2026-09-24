import { useEffect } from 'react';
import { useInventory } from '@/contexts/InventoryContext';
import { GridSizeProvider } from "@/contexts/GridSizeContext";
import EquipmentSlots from './EquipmentSlots';
import UnifiedClothingPanel from "./UnifiedClothingPanel";
import GroundItemsGrid from './GroundItemsGrid';
import FloatingContainer from "./FloatingContainer";
import ContainerGrid from "./ContainerGrid";
import UniversalGrid from "./UniversalGrid";
import WeaponModPanel from "./WeaponModPanel";
import CampfireUI from "./CampfireUI";
import { isDroneInReach } from "../../game/remote/RemoteDeviceKinds.js";

export default function InventoryPanel() {
  console.log('[InventoryPanel] ===== COMPONENT MOUNT/RENDER =====');

  const { openContainers, closeContainer, getContainer, inventoryVersion, inventoryManager } = useInventory();

  // Clean up containers that no longer exist
  useEffect(() => {
    openContainers.forEach(containerId => {
      // A mod panel closes once its item is gone or out of reach — e.g. a drone
      // launched from the player's tile — so its battery can't be swapped from
      // a distance through a window left open.
      if (containerId.startsWith('mod:')) {
        const item = inventoryManager?.findItem(containerId.split(':')[1])?.item;
        if (!item || !isDroneInReach(item, inventoryManager?.groundContainer)) {
          closeContainer(containerId);
        }
        return;
      }

      // Skip cleanup for virtual containers
      if (containerId.startsWith('clothing:') ||
          containerId.startsWith('item-mod-') || 
          containerId.startsWith('mod-overlay:')) return;

      const container = getContainer(containerId);
      if (!container) {
        closeContainer(containerId);
        console.log('[InventoryPanel] Closed container (no longer exists):', containerId);
      }
    });
  }, [inventoryVersion, openContainers, getContainer, closeContainer]);

  return (
    <GridSizeProvider>
      <>
        <div className="w-full h-full flex flex-col metal-panel" data-testid="inventory-panel" data-inventory-ui="true">
          {/* Expanded HUD Header (80px) - Cleans up icons and prevents scrollbar overlap */}
          <div 
            className="unified-header flex items-center bg-zinc-950/20 shadow-inner shrink-0" 
            style={{ height: 'var(--header-height)' }}
            data-equipment-area="true"
          >
            <EquipmentSlots />
          </div>

          {/* Inventory Grid Areas - HORIZONTAL LAYOUT */}
          <div className="flex-1 flex min-h-0">
            <UnifiedClothingPanel />
            <GroundItemsGrid />
          </div>
        </div>

        {/* Floating Container Panels */}
        {Array.from(openContainers).map((containerId: any) => {
          // Case 1: Clothing Item (Virtual Container)
          if (containerId.startsWith('clothing:')) {
            const itemId = containerId.split(':')[1];
            // Try ground first, then everywhere via manager
            const found = inventoryManager?.findItem(itemId);
            const item = found?.item;

            if (!item || !item.getPocketContainers) return null;

            const pocketIds = item.getPocketContainerIds ? item.getPocketContainerIds() : [];
            if (pocketIds.length === 0) return null;

            return (
              <FloatingContainer
                key={containerId}
                id={containerId}
                title={item.name}
                isOpen={true}
                onClose={() => closeContainer(containerId)}
              >
                <div className="p-2 space-y-2">
                  {item.getPocketContainers().map((pocket: any) => (
                    <div key={pocket.id} className="space-y-1">
                      <UniversalGrid
                        containerId={pocket.id}
                        container={pocket}
                        width={pocket.width}
                        height={pocket.height}
                        gridType="fixed"
                        enableScroll={false}
                        className="mx-auto"
                      />
                    </div>
                  ))}
                </div>
              </FloatingContainer>
            );
          }

          // Case 2: Item Modification (Virtual Container)
          if (containerId.startsWith('mod:')) {
            const itemId = containerId.split(':')[1];
            const found = inventoryManager?.findItem(itemId);
            const item = found?.item;

            if (!item || !item.attachmentSlots || !isDroneInReach(item, inventoryManager?.groundContainer)) return null;

            return (
              <FloatingContainer
                key={containerId}
                id={containerId}
                title={""}
                isOpen={true}
                onClose={() => closeContainer(containerId)}
                minWidth={140}
                minHeight={100}
              >
                <WeaponModPanel weapon={item} />
              </FloatingContainer>
            );
          }

          // Case 3: Standard Container
          const container = getContainer(containerId);
          if (!container) return null;

          // SPECIAL CASE: Campfire UI
          if (containerId.endsWith('-container')) {
            const instanceId = containerId.replace('-container', '');
            const found = inventoryManager?.findItem(instanceId);
            if (found && found.item && found.item.defId === 'placeable.campfire') {
              return (
                <FloatingContainer
                  key={containerId}
                  id={containerId}
                  title={container.name}
                  isOpen={true}
                  onClose={() => closeContainer(containerId)}
                >
                  <CampfireUI campfire={found.item} container={container} />
                </FloatingContainer>
              );
            }
          }

          return (
            <FloatingContainer
              key={containerId}
              id={containerId}
              title={container.name || 'Backpack'}
              isOpen={true}
              onClose={() => closeContainer(containerId)}
            >
              <ContainerGrid containerId={containerId} />
            </FloatingContainer>
          );
        })}
      </>
    </GridSizeProvider>
  );
}