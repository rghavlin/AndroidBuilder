import { useState } from "react";
import { useInventory } from "@/contexts/InventoryContext";
import ClothingContainerPanel from "./ClothingContainerPanel";

export default function BackpackGrid() {
  const { getEquippedBackpackContainer } = useInventory();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Get equipped backpack container (triggers re-render when inventoryVersion changes)
  const backpackContainer = getEquippedBackpackContainer();
  const containerId = backpackContainer?.id || null;

  return (
    <div className="w-1/2 border-r border-border flex flex-col h-full" data-testid="backpack-grid">
      <ClothingContainerPanel
        title="Backpack"
        containerId={containerId}
        emptyMessage="No backpack equipped"
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
        className="h-full"
      />
    </div>
  );
}