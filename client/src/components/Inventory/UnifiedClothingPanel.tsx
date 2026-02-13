import { useState } from "react";
import { useInventory } from "@/contexts/InventoryContext";
import ClothingContainerPanel from "./ClothingContainerPanel";

export default function UnifiedClothingPanel() {
  console.log('[UnifiedClothingPanel] ===== COMPONENT MOUNT/RENDER =====');

  const { getEquippedBackpackContainer, inventoryRef, inventoryVersion } = useInventory();

  console.log('[UnifiedClothingPanel] Context values received:', {
    hasInventoryRef: !!inventoryRef,
    hasGetEquippedBackpack: !!getEquippedBackpackContainer,
    inventoryVersion
  });

  // Independent collapse states for each section
  const [upperCollapsed, setUpperCollapsed] = useState(false);
  const [lowerCollapsed, setLowerCollapsed] = useState(false);
  const [backpackCollapsed, setBackpackCollapsed] = useState(false);

  // Get equipped items from inventory context
  const upperBodyItem = inventoryRef.current?.equipment?.upper_body || null;
  const lowerBodyItem = inventoryRef.current?.equipment?.lower_body || null;
  const backpackItem = inventoryRef.current?.equipment?.backpack || null;

  console.debug('[UnifiedClothingPanel] ===== FULL DIAGNOSTIC =====');
  console.debug('[UnifiedClothingPanel] inventoryRef.current exists:', !!inventoryRef.current);
  console.debug('[UnifiedClothingPanel] inventoryRef.current.equipment:', inventoryRef.current?.equipment);
  console.debug('[UnifiedClothingPanel] All equipment slots:', {
    backpack: inventoryRef.current?.equipment?.backpack?.name || 'none',
    upper_body: inventoryRef.current?.equipment?.upper_body?.name || 'none',
    lower_body: inventoryRef.current?.equipment?.lower_body?.name || 'none',
    melee: inventoryRef.current?.equipment?.melee?.name || 'none',
    handgun: inventoryRef.current?.equipment?.handgun?.name || 'none',
    long_gun: inventoryRef.current?.equipment?.long_gun?.name || 'none',
    flashlight: inventoryRef.current?.equipment?.flashlight?.name || 'none'
  });
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

  console.log('[UnifiedClothingPanel] ===== POCKET DIAGNOSTIC =====');
  console.log('[UnifiedClothingPanel] Upper body item:', upperBodyItem?.name || 'none');
  console.log('[UnifiedClothingPanel] - isContainer():', upperBodyItem?.isContainer?.());
  console.log('[UnifiedClothingPanel] - getPocketContainerIds():', upperBodyPocketIds);
  console.log('[UnifiedClothingPanel] - _pocketGridsData:', upperBodyItem?._pocketGridsData);
  console.log('[UnifiedClothingPanel] - pocketGrids:', upperBodyItem?.pocketGrids);
  console.log('[UnifiedClothingPanel] - pocketGrids.length:', upperBodyItem?.pocketGrids?.length);

  console.log('[UnifiedClothingPanel] Lower body item:', lowerBodyItem?.name || 'none');
  console.log('[UnifiedClothingPanel] - isContainer():', lowerBodyItem?.isContainer?.());
  console.log('[UnifiedClothingPanel] - getPocketContainerIds():', lowerBodyPocketIds);
  console.log('[UnifiedClothingPanel] - _pocketGridsData:', lowerBodyItem?._pocketGridsData);
  console.log('[UnifiedClothingPanel] - pocketGrids:', lowerBodyItem?.pocketGrids);
  console.log('[UnifiedClothingPanel] - pocketGrids.length:', lowerBodyItem?.pocketGrids?.length);

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
      <div className="flex-1 overflow-y-auto custom-scrollbar">
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
          equippedItem={backpackItem}
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