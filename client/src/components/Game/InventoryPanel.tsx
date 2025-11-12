import EquipmentSlots from "@/components/Inventory/EquipmentSlots";
import { UnifiedClothingPanel } from '@/components/Inventory/UnifiedClothingPanel';
import GroundItemsGrid from "@/components/Inventory/GroundItemsGrid";
import { GridSizeProvider } from "@/contexts/GridSizeContext";
import FloatingContainer from "@/components/Inventory/FloatingContainer";
import ContainerGrid from "@/components/Inventory/ContainerGrid";
import { useInventory } from "@/contexts/InventoryContext";
import { useEffect } from "react";

export default function InventoryPanel() {
  const { openContainers, getContainer, closeContainer, clearSelected, selectedItem } = useInventory();

  // Add a global click listener to clear item selection when clicking outside the inventory UI
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click is outside the inventory UI
      const inventoryUI = event.target.closest('[data-inventory-ui="true"]');
      if (!inventoryUI) {
        clearSelected();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [clearSelected]);


  // Handle clicks on inventory panel - cancel selection if clicking outside grids
  const handlePanelClick = (event) => {
    // Only process if there's a selected item
    if (!selectedItem) return;

    // Check if the click is on a grid (grids have data-inventory-ui and specific grid classes)
    const clickedGrid = event.target.closest('[data-testid*="grid-"]');

    // If not clicking on a grid, cancel the selection
    if (!clickedGrid) {
      console.debug('[InventoryPanel] Clicked outside grid while item selected - canceling');
      clearSelected();
    }
  };

  return (
    <GridSizeProvider>
      <div
        className="w-1/2 bg-card flex flex-col h-full"
        data-testid="inventory-panel"
        data-inventory-ui="true" // Mark this div as part of the inventory UI
        data-inventory-panel="true" // Mark as panel background
        onClick={handlePanelClick}
      >
        <div className="flex-shrink-0" data-equipment-area="true">
          <EquipmentSlots />
        </div>

        {/* Inventory Grid Areas (Unified Clothing Panel + Ground Items) */}
        <div className="flex-1 flex min-h-0">
          <UnifiedClothingPanel />
          <GroundItemsGrid />
        </div>

        {/* Floating Containers - FloatingContainer uses Portal internally */}
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
      </div>
    </GridSizeProvider>
  );
}