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

        // Check if this is a backpack from the ground
        // Find the item that owns this container by checking ground items
        let isGroundBackpack = false;
        const groundContainer = getContainer('ground');
        if (groundContainer) {
          const allGroundItems = groundContainer.getAllItems();
          console.debug('[InventoryPanel] Checking for ground backpack owner of container:', containerId);
          console.debug('[InventoryPanel] Ground items:', allGroundItems.map(i => ({
            name: i.name,
            instanceId: i.instanceId,
            equippableSlot: i.equippableSlot,
            hasContainer: !!i.containerGrid,
            containerGridId: i.containerGrid?.id,
            expectedContainerId: `${i.instanceId}-container`,
            matches: containerId === `${i.instanceId}-container`
          })));
          
          const ownerItem = allGroundItems.find(item => {
            // Only check items that are backpacks
            if (item.equippableSlot !== 'backpack') {
              return false;
            }

            // Initialize container if not already done
            if (!item.containerGrid && item._containerGridData) {
              item.initializeContainerGrid();
            }
            
            // Check if container ID matches directly
            if (item.containerGrid && item.containerGrid.id === containerId) {
              return true;
            }
            
            // For backpacks, the container ID pattern is: {instanceId}-container
            // Example: backpack.standard-1762408941075-p9guz-container
            if (item.instanceId && containerId === `${item.instanceId}-container`) {
              return true;
            }
            
            // Also try checking if the containerId starts with instanceId
            if (item.instanceId && containerId.startsWith(item.instanceId)) {
              return true;
            }
            
            return false;
          });
          
          console.debug('[InventoryPanel] Owner item found:', ownerItem?.name, 'equippableSlot:', ownerItem?.equippableSlot);
          
          if (ownerItem && ownerItem.equippableSlot === 'backpack') {
            isGroundBackpack = true;
            console.debug('[InventoryPanel] ✅ Container identified as ground backpack:', containerId);
          }
        }

        console.debug('[InventoryPanel] Rendering FloatingContainer:', containerId, 'isGroundBackpack:', isGroundBackpack);

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