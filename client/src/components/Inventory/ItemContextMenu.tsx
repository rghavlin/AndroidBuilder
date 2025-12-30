import React, { useState } from 'react';
// @ts-ignore
import { useInventory } from "@/contexts/InventoryContext";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    ContextMenuPortal,
} from "@/components/ui/context-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { SplitDialog } from "./SplitDialog";

interface ItemContextMenuProps {
    children: React.ReactNode;
    item?: any;
    tooltipContent?: React.ReactNode;
}

/**
 * ItemContextMenu manages the interaction stack for an inventory item slot.
 * It ensures that ContextMenus and Tooltips are correctly nested so that
 * event listeners (hover, right-click, etc.) all reach the underlying DOM element.
 */
export function ItemContextMenu({
    children,
    item,
    tooltipContent = null
}: ItemContextMenuProps) {
    const { openContainer, canOpenContainer } = useInventory();
    const [isSplitDialogOpen, setIsSplitDialogOpen] = useState(false);

    // If there's no item and no tooltip, just render children
    if (!item && !tooltipContent) {
        return <>{children}</>;
    }

    const canSplit = item?.isStackable?.() && item?.stackCount > 1;

    // The core of the fix: Radix triggers MUST be nested as direct parents of the DOM element
    // order: ContextMenu -> Tooltip -> TooltipTrigger -> ContextMenuTrigger -> DOM child
    return (
        <ContextMenu>
            <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                    <ContextMenuTrigger asChild>
                        {children}
                    </ContextMenuTrigger>
                </TooltipTrigger>
                {tooltipContent && (
                    <TooltipContent side="top" className="bg-popover text-popover-foreground border shadow-sm z-[10001]">
                        {tooltipContent}
                    </TooltipContent>
                )}
            </Tooltip>

            {item && (
                <ContextMenuPortal>
                    <ContextMenuContent className="w-48 bg-[#1a1a1a] border-[#333] text-white z-[10001]">
                        {canOpenContainer(item) && (
                            <ContextMenuItem
                                onClick={() => {
                                    console.log('[ItemContextMenu] Open container requested for:', item.name);
                                    // 1. Use existing getContainerGrid() if available (Backpacks, toolboxes, etc.)
                                    const containerGrid = item.getContainerGrid?.();
                                    if (containerGrid) {
                                        openContainer(containerGrid); // Pass the full object for registration
                                        return;
                                    }

                                    // 2. Fallback to clothing pockets
                                    if (item.getPocketContainerIds) {
                                        const pocketIds = item.getPocketContainerIds();
                                        if (pocketIds && pocketIds.length > 0) {
                                            openContainer(item); // Pass the item object for pocket registration
                                            return;
                                        }
                                    }

                                    console.warn('[ItemContextMenu] canOpenContainer was true but no grid/pockets found for:', item.name);
                                }}
                                className="hover:bg-accent focus:bg-accent focus:text-white"
                            >
                                Open
                            </ContextMenuItem>
                        )}
                        {canSplit && (
                            <ContextMenuItem
                                onClick={() => setIsSplitDialogOpen(true)}
                                className="hover:bg-accent focus:bg-accent focus:text-white"
                            >
                                Split Stack
                            </ContextMenuItem>
                        )}
                        {!canSplit && !canOpenContainer(item) && (
                            <ContextMenuItem disabled className="text-gray-500">
                                No actions available
                            </ContextMenuItem>
                        )}
                    </ContextMenuContent>
                </ContextMenuPortal>
            )}

            {item && (
                <SplitDialog
                    isOpen={isSplitDialogOpen}
                    onClose={() => setIsSplitDialogOpen(false)}
                    item={item}
                />
            )}
        </ContextMenu>
    );
}
