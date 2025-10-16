import EquipmentSlots from "@/components/Inventory/EquipmentSlots";
import BackpackGrid from "@/components/Inventory/BackpackGrid";
import GroundItemsGrid from "@/components/Inventory/GroundItemsGrid";
import { GridSizeProvider } from "@/contexts/GridSizeContext";

export default function InventoryPanel() {
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
      </div>  {/* ✅ close the div */}
    </GridSizeProvider>
  );
}
