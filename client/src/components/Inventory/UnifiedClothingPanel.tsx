
import { useState } from "react";
import { useInventory } from "@/contexts/InventoryContext";
import ClothingContainerPanel from "./ClothingContainerPanel";

export default function UnifiedClothingPanel() {
  const { getEquippedBackpackContainer, inventoryRef } = useInventory();
  
  // Independent collapse states for each section
  const [upperCollapsed, setUpperCollapsed] = useState(false);
  const [lowerCollapsed, setLowerCollapsed] = useState(false);
  const [backpackCollapsed, setBackpackCollapsed] = useState(false);

  // Get equipped items from inventory
  const equipment = inventoryRef.current?.equipment || {};
  const upperBodyItem = equipment.upper_body || null;
  const lowerBodyItem = equipment.lower_body || null;
  
  // Get backpack container
  const backpackContainer = getEquippedBackpackContainer();
  const backpackContainerId = backpackContainer?.id || null;

  // Get pocket containers for upper/lower body (Phase 6D will implement this)
  const upperBodyPockets: string[] = []; // TODO: Phase 6D - get from upperBodyItem.getPocketContainers()
  const lowerBodyPockets: string[] = []; // TODO: Phase 6D - get from lowerBodyItem.getPocketContainers()

  return (
    <div className="w-1/2 border-r border-border flex flex-col h-full overflow-hidden" data-testid="unified-clothing-panel">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Upper Body Section */}
        <ClothingContainerPanel
          title={upperBodyItem ? "Upper Body" : "Upper Body (none)"}
          containerId={null} // Phase 6D will handle pocket grids
          emptyMessage="none"
          isCollapsed={upperCollapsed}
          onToggle={() => setUpperCollapsed(!upperCollapsed)}
        />

        {/* Lower Body Section */}
        <ClothingContainerPanel
          title={lowerBodyItem ? "Lower Body" : "Lower Body (none)"}
          containerId={null} // Phase 6D will handle pocket grids
          emptyMessage="none"
          isCollapsed={lowerCollapsed}
          onToggle={() => setLowerCollapsed(!lowerCollapsed)}
        />

        {/* Backpack Section */}
        <ClothingContainerPanel
          title={backpackContainer ? "Backpack" : "Backpack (none)"}
          containerId={backpackContainerId}
          emptyMessage="none"
          isCollapsed={backpackCollapsed}
          onToggle={() => setBackpackCollapsed(!backpackCollapsed)}
          className="border-b-0" // Remove bottom border on last section
        />
      </div>
    </div>
  );
}
