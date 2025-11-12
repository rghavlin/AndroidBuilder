import { useEffect } from 'react';
import { useInventory } from '@/contexts/InventoryContext';
import { GridSizeProvider } from "@/contexts/GridSizeContext";
import EquipmentSlots from './EquipmentSlots';
import UnifiedClothingPanel from "./UnifiedClothingPanel";
import GroundItemsGrid from './GroundItemsGrid';
import FloatingContainer from "./FloatingContainer";
import ContainerGrid from "./ContainerGrid";
import DragPreviewLayer from "./DragPreviewLayer";

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
        <div className="w-full h-full flex flex-col bg-card border-l border-border" data-testid="inventory-panel" data-inventory-ui="true">
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
          const container = getContainer(containerId);
          if (!container) return null;

          return (
            <FloatingContainer
              key={containerId}
              id={containerId}
              title={container.name || 'Container'}
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