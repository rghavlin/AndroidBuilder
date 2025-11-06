import { useEffect } from 'react';
import { useInventory } from '@/contexts/InventoryContext';
import EquipmentSlots from './EquipmentSlots';
import BackpackGrid from './BackpackGrid';
import GroundItemsGrid from './GroundItemsGrid';
import FloatingContainer from "./FloatingContainer";
import ContainerGrid from "./ContainerGrid";
import DragPreviewLayer from "./DragPreviewLayer";

export default function InventoryPanel() {
  const { openContainers, closeContainer, getContainer, inventoryVersion, dragState } = useInventory();

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
    <>
      <div className="w-full h-full flex flex-col bg-card border-l border-border">
        {/* Equipment Section */}
        <div className="border-b border-border p-3 flex-shrink-0">
          <EquipmentSlots />
        </div>

        {/* Main Inventory Grid Section */}
        <div className="flex-1 min-h-0 flex flex-col border-b border-border">
          <BackpackGrid />
        </div>

        {/* Ground Items Section */}
        <div className="flex-1 min-h-0 flex flex-col">
          <GroundItemsGrid />
        </div>
      </div>

      {/* Floating Container Panels */}
      {Array.from(openContainers).map(containerId => {
        const container = getContainer(containerId);
        if (!container) return null;

        // Check if this container belongs to a backpack
        // Since backpacks can only open when on ground, if it's open it must be a ground backpack
        const groundContainer = getContainer('ground');
        let isGroundBackpack = false;
        
        if (groundContainer) {
          const ownerItem = groundContainer.getAllItems().find(item => {
            const itemContainer = item.containerGrid || item.getContainerGrid?.();
            return itemContainer?.id === containerId;
          });
          
          // If owner is a backpack, it's a ground backpack (backpacks only open when on ground)
          if (ownerItem?.equippableSlot === 'backpack') {
            isGroundBackpack = true;
          }
        }

        return (
          <FloatingContainer
            key={containerId}
            id={containerId}
            title={container.name || 'Container'}
            isOpen={true}
            onClose={() => closeContainer(containerId)}
            isGroundBackpack={isGroundBackpack}
          >
            <ContainerGrid containerId={containerId} />
          </FloatingContainer>
        );
      })}

      {/* Cursor-following drag preview */}
      {/* Removed DragPreviewLayer component */}
    </div>
  );
}