import { useState } from "react";
import { useInventory } from "@/contexts/InventoryContext";
import ClothingContainerPanel from "./ClothingContainerPanel";
import Logger from "@/game/utils/Logger.js";

const logger = Logger.scope('UnifiedClothingPanel');

export default function UnifiedClothingPanel() {
  logger.debug('===== COMPONENT MOUNT/RENDER =====');

  const { getEquippedBackpackContainer, inventoryRef, inventoryVersion } = useInventory();

  logger.debug('Context values received:', {
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

  logger.debug('===== FULL DIAGNOSTIC =====');
  logger.debug('inventoryRef.current exists:', !!inventoryRef.current);
  logger.debug('inventoryRef.current.equipment:', inventoryRef.current?.equipment);
  logger.debug('All equipment slots:', {
    backpack: inventoryRef.current?.equipment?.backpack?.name || 'none',
    upper_body: inventoryRef.current?.equipment?.upper_body?.name || 'none',
    lower_body: inventoryRef.current?.equipment?.lower_body?.name || 'none',
    melee: inventoryRef.current?.equipment?.melee?.name || 'none',
    handgun: inventoryRef.current?.equipment?.handgun?.name || 'none',
    long_gun: inventoryRef.current?.equipment?.long_gun?.name || 'none',
    flashlight: inventoryRef.current?.equipment?.flashlight?.name || 'none'
  });
  logger.debug('Render:', {
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

  logger.debug('===== POCKET DIAGNOSTIC =====');
  logger.debug('Upper body item:', upperBodyItem?.name || 'none');
  logger.debug('- isContainer():', upperBodyItem?.isContainer?.());
  logger.debug('- getPocketContainerIds():', upperBodyPocketIds);
  logger.debug('- _pocketGridsData:', upperBodyItem?._pocketGridsData);
  logger.debug('- pocketGrids:', upperBodyItem?.pocketGrids);
  logger.debug('- pocketGrids.length:', upperBodyItem?.pocketGrids?.length);

  logger.debug('Lower body item:', lowerBodyItem?.name || 'none');
  logger.debug('- isContainer():', lowerBodyItem?.isContainer?.());
  logger.debug('- getPocketContainerIds():', lowerBodyPocketIds);
  logger.debug('- _pocketGridsData:', lowerBodyItem?._pocketGridsData);
  logger.debug('- pocketGrids:', lowerBodyItem?.pocketGrids);
  logger.debug('- pocketGrids.length:', lowerBodyItem?.pocketGrids?.length);

  logger.debug('Rendering sections:', {
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