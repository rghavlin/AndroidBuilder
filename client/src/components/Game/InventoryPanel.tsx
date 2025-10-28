import { useInventory } from "@/contexts/InventoryContext";
import EquipmentSlots from "@/components/Inventory/EquipmentSlots";
import BackpackGrid from "@/components/Inventory/BackpackGrid";
import GroundItemsGrid from "@/components/Inventory/GroundItemsGrid";
import FloatingContainer from "@/components/Inventory/FloatingContainer";
import ContainerGrid from "@/components/Inventory/ContainerGrid";
import { GridSizeProvider } from "@/contexts/GridSizeContext";

export default function InventoryPanel() {
  const { openContainers, closeContainer, getContainer } = useInventory();

  return (
    <GridSizeProvider>
      <div
        className="w-1/2 bg-card flex flex-col h-full"
        data-testid="inventory-panel"
      >
        <div className="flex-shrink-0">
          <EquipmentSlots />
        </div>

        {/* Inventory Grid Areas (Backpack + Ground Items) */}
        <div className="flex-1 flex min-h-0">
          <BackpackGrid />
          <GroundItemsGrid />
        </div>
      </div>

      {/* Floating Containers - rendered outside main panel for proper z-index */}
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
    </GridSizeProvider>
  );
}
