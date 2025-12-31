import { useEffect } from 'react';
import { useInventory } from '@/contexts/InventoryContext';
import { GridSizeProvider } from "@/contexts/GridSizeContext";
import EquipmentSlots from './EquipmentSlots';
import UnifiedClothingPanel from "./UnifiedClothingPanel";
import GroundItemsGrid from './GroundItemsGrid';
import FloatingContainer from "./FloatingContainer";
import ContainerGrid from "./ContainerGrid";
import DragPreviewLayer from "./DragPreviewLayer";
import UniversalGrid from "./UniversalGrid";
import WeaponModPanel from "./WeaponModPanel";

export default function InventoryPanel() {
  console.log('[InventoryPanel] ===== COMPONENT MOUNT/RENDER =====');

  const { openContainers, closeContainer, getContainer, inventoryVersion, inventoryRef } = useInventory();

  // Clean up containers that no longer exist
  useEffect(() => {
    openContainers.forEach(containerId => {
      // Skip cleanup for virtual containers
      if (containerId.startsWith('clothing:') || containerId.startsWith('weapon:')) return;

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
        <div className="w-1/2 h-full flex flex-col bg-card border-l border-border" data-testid="inventory-panel" data-inventory-ui="true">
          {/* Equipment Section */}
          <div className="border-b border-border p-3 flex-shrink-0" data-equipment-area="true">
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
            const found = inventoryRef.current?.findItem(itemId);
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

          // Case 2: Weapon Modification (Virtual Container)
          if (containerId.startsWith('weapon:')) {
            const itemId = containerId.split(':')[1];
            const found = inventoryRef.current?.findItem(itemId);
            const item = found?.item;

            if (!item || !item.attachmentSlots) return null;

            return (
              <FloatingContainer
                key={containerId}
                id={containerId}
                title={`Modify ${item.name}`}
                isOpen={true}
                onClose={() => closeContainer(containerId)}
              >
                <WeaponModPanel weapon={item} />
              </FloatingContainer>
            );
          }

          // Case 3: Standard Container
          const container = getContainer(containerId);
          if (!container) return null;

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