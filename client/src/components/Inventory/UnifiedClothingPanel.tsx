import { useState } from "react";
import { useInventory } from "@/contexts/InventoryContext";
import ClothingContainerPanel from "./ClothingContainerPanel";

export default function UnifiedClothingPanel() {
  const { getEquippedBackpackContainer, inventoryRef, inventoryVersion } = useInventory();

  // Independent collapse states for each section
  const [upperCollapsed, setUpperCollapsed] = useState(false);
  const [lowerCollapsed, setLowerCollapsed] = useState(false);
  const [backpackCollapsed, setBackpackCollapsed] = useState(false);

  // Get equipped items from inventory context
  const upperBodyItem = inventoryRef.current?.equipment?.upper_body || null;
  const lowerBodyItem = inventoryRef.current?.equipment?.lower_body || null;
  const backpackItem = inventoryRef.current?.equipment?.backpack || null;

  console.debug('[UnifiedClothingPanel] Render:', {
    hasUpperBody: !!upperBodyItem,
    hasLowerBody: !!lowerBodyItem,
    hasBackpack: !!backpackItem,
    upperBodyName: upperBodyItem?.name,
    lowerBodyName: lowerBodyItem?.name,
    backpackName: backpackItem?.name
  });

  // Get backpack container
  const backpackContainer = getEquippedBackpackContainer();
  const backpackContainerId = backpackContainer?.id || null;

  // Extract pocket container IDs for upper and lower body
  const upperBodyPocketIds = upperBodyItem?.isContainer?.() 
    ? (upperBodyItem.getPocketContainerIds?.() || [])
    : [];

  const lowerBodyPocketIds = lowerBodyItem?.isContainer?.() 
    ? (lowerBodyItem.getPocketContainerIds?.() || [])
    : [];

  console.debug('[UnifiedClothingPanel] ===== POCKET DIAGNOSTIC =====');
  console.debug('[UnifiedClothingPanel] Upper body item:', upperBodyItem?.name || 'none');
  console.debug('[UnifiedClothingPanel] - isContainer():', upperBodyItem?.isContainer?.());
  console.debug('[UnifiedClothingPanel] - getPocketContainerIds():', upperBodyPocketIds);
  console.debug('[UnifiedClothingPanel] - _pocketGridsData:', upperBodyItem?._pocketGridsData);
  console.debug('[UnifiedClothingPanel] - pocketGrids.length:', upperBodyItem?.pocketGrids?.length);
  
  console.debug('[UnifiedClothingPanel] Lower body item:', lowerBodyItem?.name || 'none');
  console.debug('[UnifiedClothingPanel] - isContainer():', lowerBodyItem?.isContainer?.());
  console.debug('[UnifiedClothingPanel] - getPocketContainerIds():', lowerBodyPocketIds);
  console.debug('[UnifiedClothingPanel] - _pocketGridsData:', lowerBodyItem?._pocketGridsData);
  console.debug('[UnifiedClothingPanel] - pocketGrids.length:', lowerBodyItem?.pocketGrids?.length);

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