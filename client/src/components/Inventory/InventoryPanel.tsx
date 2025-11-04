import { useEffect } from 'react';
import { useInventory } from '@/contexts/InventoryContext';
import EquipmentSlots from './EquipmentSlots';
import BackpackGrid from './BackpackGrid';
import GroundItemsGrid from './GroundItemsGrid';
import FloatingContainer from "./FloatingContainer";
import ContainerGrid from "./ContainerGrid";
import DragPreviewLayer from "./DragPreviewLayer";

export default function InventoryPanel() {
  const { openContainers, closeContainer, getContainer, inventoryVersion } = useInventory();

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

      {/* Floating Containers */}
      {Array.from(openContainers).map((containerId, index) => {
        const container = getContainer(containerId);
        if (!container) return null;

        return (
          <FloatingContainer
            key={containerId}
            id={containerId}
            title={container.name}
            isOpen={true}
            onClose={() => closeContainer(containerId)}
            initialPosition={{ x: 100 + index * 30, y: 100 + index * 30 }}
            minWidth={250}
            minHeight={200}
          >
            <ContainerGrid
              containerId={containerId}
              enableScroll={true}
              maxHeight="400px"
            />
          </FloatingContainer>
        );
      })}

      {/* Phase 5G: Cursor-following drag preview */}
      <DragPreviewLayer />
    </div>
  );
}