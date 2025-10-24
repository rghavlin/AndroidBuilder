import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EquipmentSlot from "@/components/Inventory/EquipmentSlot";
import ContainerGrid from "@/components/Inventory/ContainerGrid";
import CraftingPanel from "@/components/Inventory/CraftingPanel";
import { GridSizeProvider } from "@/contexts/GridSizeContext";
import { useInventory } from "@/contexts/InventoryContext";

interface InventoryExtensionWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InventoryExtensionWindow({ 
  isOpen, 
  onClose 
}: InventoryExtensionWindowProps) {
  const { inventoryRef } = useInventory();
  
  if (!isOpen) return null;

  // Read equipped items for upper_body and lower_body
  const upperBodyItem = inventoryRef.current?.equipment.upper_body || null;
  const lowerBodyItem = inventoryRef.current?.equipment.lower_body || null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop covers only map area */}
      <div 
        className="absolute left-0 w-1/2 h-full bg-black/50" 
        onClick={onClose}
      />

      {/* Extension panel */}
      <GridSizeProvider>
        <div 
          className="absolute left-0 w-1/2 bg-card border-r border-border flex flex-col" 
          style={{ 
            top: '48px',
            bottom: '72px',
            height: 'calc(100vh - 120px)'
          }}
          data-testid="inventory-extension-window"
        >
          {/* Equipment Section - minimal height */}
          <div className="flex-shrink-0 p-2 border-b border-border">
            <div className="flex justify-center gap-6">
              <EquipmentSlot 
                slotId="upper_body" 
                item={upperBodyItem}
                isEquipped={!!upperBodyItem}
              />
              <EquipmentSlot 
                slotId="lower_body" 
                item={lowerBodyItem}
                isEquipped={!!lowerBodyItem}
              />
            </div>
          </div>

          {/* Pockets Section - content-sized */}
          <div className="flex-shrink-0 p-3 border-b border-border">
            <div className="flex justify-center gap-8">
              {/* Body Pockets */}
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-3 text-center">
                  BODY POCKETS
                </h4>
                <div className="grid grid-cols-2 gap-3 justify-items-center">
                  <ContainerGrid
                    containerId="body-pocket-1"
                    width={2}
                    height={2}
                    enableScroll={false}
                  />
                  <ContainerGrid
                    containerId="body-pocket-2"
                    width={2}
                    height={2}
                    enableScroll={false}
                  />
                  <ContainerGrid
                    containerId="body-pocket-3"
                    width={2}
                    height={2}
                    enableScroll={false}
                  />
                  <ContainerGrid
                    containerId="body-pocket-4"
                    width={2}
                    height={2}
                    enableScroll={false}
                  />
                </div>
              </div>

              {/* Legs Pockets */}
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-3 text-center">
                  LEG POCKETS
                </h4>
                <div className="grid grid-cols-2 gap-3 justify-items-center">
                  <ContainerGrid
                    containerId="legs-pocket-1"
                    width={2}
                    height={2}
                    enableScroll={false}
                  />
                  <ContainerGrid
                    containerId="legs-pocket-2"
                    width={2}
                    height={2}
                    enableScroll={false}
                  />
                  <ContainerGrid
                    containerId="legs-pocket-3"
                    width={2}
                    height={2}
                    enableScroll={false}
                  />
                  <ContainerGrid
                    containerId="legs-pocket-4"
                    width={2}
                    height={2}
                    enableScroll={false}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Crafting Section - takes remaining space */}
          <div className="flex-1 min-h-0">
            <CraftingPanel />
          </div>
        </div>
      </GridSizeProvider>
    </div>
  );
}
