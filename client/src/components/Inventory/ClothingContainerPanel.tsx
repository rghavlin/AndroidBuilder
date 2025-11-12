
import { useState } from "react";
import { useInventory } from "@/contexts/InventoryContext";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import UniversalGrid from "./UniversalGrid";

interface ClothingContainerPanelProps {
  title: string;
  containerId?: string | null;
  equippedItem?: any;
  pocketContainerIds?: string[];
  emptyMessage?: string;
  isCollapsed?: boolean;
  onToggle?: () => void;
  className?: string;
}

export default function ClothingContainerPanel({
  title,
  containerId,
  equippedItem,
  pocketContainerIds = [],
  emptyMessage = "None equipped",
  isCollapsed: controlledIsCollapsed,
  onToggle,
  className = "",
}: ClothingContainerPanelProps) {
  const { getContainer } = useInventory();
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false);

  const isCollapsed = controlledIsCollapsed !== undefined ? controlledIsCollapsed : internalIsCollapsed;
  const handleToggle = onToggle || (() => setInternalIsCollapsed(!internalIsCollapsed));

  // Get the main container (for backpacks)
  const container = containerId ? getContainer(containerId) : null;
  
  // Check if we have pockets to display
  const hasPockets = pocketContainerIds.length > 0;
  
  // Check if we have any content to show
  const hasContent = container || hasPockets || equippedItem;

  console.debug('[ClothingContainerPanel]', title, {
    hasContainer: !!container,
    hasPockets,
    pocketCount: pocketContainerIds.length,
    pocketIds: pocketContainerIds,
    equippedItemName: equippedItem?.name
  });

  return (
    <div className={cn("border-b border-border", className)}>
      {/* Header */}
      <button
        onClick={handleToggle}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-accent/50 transition-colors"
      >
        <span className="text-sm font-medium">
          {title}
          {equippedItem && <span className="text-muted-foreground ml-2">({equippedItem.name})</span>}
          {!equippedItem && !hasContent && <span className="text-muted-foreground ml-2">({emptyMessage})</span>}
        </span>
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-3 space-y-3">
          {/* Show main container grid (for backpacks) */}
          {container && (
            <UniversalGrid
              containerId={container.id}
              width={container.width}
              height={container.height}
              gridType="fixed"
              enableScroll={false}
              className="mx-auto"
            />
          )}

          {/* Show pocket grids (for clothing with pockets) */}
          {hasPockets && pocketContainerIds.map((pocketId, index) => {
            const pocketContainer = getContainer(pocketId);
            
            if (!pocketContainer) {
              console.warn('[ClothingContainerPanel] Pocket container not found:', pocketId);
              return null;
            }

            console.debug('[ClothingContainerPanel] Rendering pocket:', {
              pocketId,
              index,
              width: pocketContainer.width,
              height: pocketContainer.height
            });

            return (
              <div key={pocketId} className="space-y-1">
                <div className="text-xs text-muted-foreground text-center">
                  Pocket {index + 1}
                </div>
                <UniversalGrid
                  containerId={pocketId}
                  width={pocketContainer.width}
                  height={pocketContainer.height}
                  gridType="fixed"
                  enableScroll={false}
                  className="mx-auto"
                />
              </div>
            );
          })}

          {/* Show empty message if no content */}
          {!hasContent && (
            <div className="text-sm text-muted-foreground text-center py-4">
              {emptyMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
