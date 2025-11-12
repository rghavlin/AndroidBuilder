
import { useState } from "react";
import { useInventory } from "@/contexts/InventoryContext";
import ClothingContainerPanel from "./ClothingContainerPanel";

export default function UnifiedClothingPanel() {
  const { getEquippedBackpackContainer, inventoryRef, inventoryVersion } = useInventory();
  
  // Independent collapse states for each section
  const [upperCollapsed, setUpperCollapsed] = useState(false);
  const [lowerCollapsed, setLowerCollapsed] = useState(false);
  const [backpackCollapsed, setBackpackCollapsed] = useState(false);

  // Get equipped items from inventory (re-render when inventoryVersion changes)
  const equipment = inventoryRef.current?.equipment || {};
  const upperBodyItem = equipment.upper_body || null;
  const lowerBodyItem = equipment.lower_body || null;
  
  // Get backpack container
  const backpackContainer = getEquippedBackpackContainer();
  const backpackContainerId = backpackContainer?.id || null;

  // Get pocket container IDs for upper/lower body clothing
  const upperBodyPocketIds = upperBodyItem?.isContainer?.() 
    ? (upperBodyItem.getPocketContainerIds?.() || [])
    : [];
  const lowerBodyPocketIds = lowerBodyItem?.isContainer?.() 
    ? (lowerBodyItem.getPocketContainerIds?.() || [])
    : [];

  console.log('DEBUG: UnifiedClothingPanel', {
    upperBodyItem,
    lowerBodyItem,
    upperBodyPocketIds,
    lowerBodyPocketIds,
  });

  console.log('[UnifiedClothingPanel] Rendering sections:', {
    upperBodyItem: upperBodyItem?.name || 'none',
    upperBodyPockets: upperBodyPocketIds.length,
    lowerBodyItem: lowerBodyItem?.name || 'none',
    lowerBodyPockets: lowerBodyPocketIds.length,
    backpackContainer: backpackContainer?.id || 'none',
    inventoryVersion
  });

  return (
    <div className="w-1/2 border-r border-border flex flex-col h-full" data-testid="unified-clothing-panel">
      <div className="flex-1 overflow-y-auto">
        {/* Upper Body Section */}
        <ClothingContainerPanel
          title="Upper Body"
          equippedItem={upperBodyItem}
          pocketContainerIds={upperBodyPocketIds}
          emptyMessage="No item equipped"
          isCollapsed={upperCollapsed}
          onToggle={() => setUpperCollapsed(!upperCollapsed)}
        />

        {/* Lower Body Section */}
        <ClothingContainerPanel
          title="Lower Body"
          equippedItem={lowerBodyItem}
          pocketContainerIds={lowerBodyPocketIds}
          emptyMessage="No item equipped"
          isCollapsed={lowerCollapsed}
          onToggle={() => setLowerCollapsed(!lowerCollapsed)}
        />

        {/* Backpack Section */}
        <ClothingContainerPanel
          title="Backpack"
          containerId={backpackContainerId}
          emptyMessage="No backpack equipped"
          isCollapsed={backpackCollapsed}
          onToggle={() => setBackpackCollapsed(!backpackCollapsed)}
          className="border-b-0"
        />
      </div>
    </div>
  );
}
