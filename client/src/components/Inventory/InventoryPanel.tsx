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

export default function InventoryPanel() {
  console.log('[InventoryPanel] ===== COMPONENT MOUNT/RENDER =====');

  const { openContainers, closeContainer, getContainer, inventoryVersion, dragState } = useInventory();

  console.log('[InventoryPanel] Context values:', {
    openContainersCount: openContainers.size,
    hasGetContainer: !!getContainer,
    inventoryVersion
  });

  // Clean up containers that no longer exist
  useEffect(() => {
    openContainers.forEach(containerId => {
      // Skip cleanup for virtual clothing containers
      if (containerId.startsWith('clothing:')) return;

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

          {/* Inventory Grid Areas (Backpack/Clothing + Ground Items) - HORIZONTAL LAYOUT */}
          <div className="flex-1 flex min-h-0">
            {console.log('[InventoryPanel] About to render UnifiedClothingPanel')}
            <UnifiedClothingPanel />
            <GroundItemsGrid />
          </div>
        </div>

        {/* Floating Container Panels */}
        {Array.from(openContainers).map(containerId => {
          // Case 1: Clothing Item (Virtual Container)
          if (containerId.startsWith('clothing:')) {
            const itemId = containerId.split(':')[1];
            const ground = getContainer('ground');
            // We only check ground for now as per "open on ground" rule, but could expand search if needed
            const item = ground?.items?.get(itemId);

            if (!item) return null;

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
                  {item.getPocketContainers().map((pocket: any, index: number) => {
                    return (
                      <div key={pocket.id} className="space-y-1">
                        <UniversalGrid
                          containerId={pocket.id} // ID still needed for key/events
                          container={pocket}      // Pass direct object for rendering
                          width={pocket.width}
                          height={pocket.height}
                          gridType="fixed"
                          enableScroll={false}
                          className="mx-auto"
                        />
                      </div>
                    );
                  })}
                </div>
              </FloatingContainer>
            );
          }

          // Case 2: Standard Container
          const container = getContainer(containerId);
          if (!container) return null;

          // ... standard container rendering ...
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