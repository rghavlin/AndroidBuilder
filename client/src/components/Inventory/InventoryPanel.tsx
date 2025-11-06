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

        // Check if this is a backpack container (simplified logic)
        // If a backpack can only be opened when on ground, we just need to check if it's a backpack
        let isGroundBackpack = false;
        const groundContainer = getContainer('ground');
        
        if (groundContainer) {
          const allGroundItems = groundContainer.getAllItems();
          
          // Find the item that owns this container
          const ownerItem = allGroundItems.find(item => {
            // Initialize container if needed
            if (!item.containerGrid && item._containerGridData) {
              item.initializeContainerGrid();
            }
            
            // Match by container ID
            if (item.containerGrid?.id === containerId) return true;
            if (item.instanceId && containerId === `${item.instanceId}-container`) return true;
            
            return false;
          });
          
          // If the owner is a backpack, show the quick-move button
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