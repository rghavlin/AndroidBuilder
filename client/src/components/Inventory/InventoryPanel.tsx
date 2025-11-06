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
        const isGroundBackpack = containerId.includes('backpack') &&
                                 container.type !== 'equipped-backpack' &&
                                 containerId !== 'backpack-container';

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