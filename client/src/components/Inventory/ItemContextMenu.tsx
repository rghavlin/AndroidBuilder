import React, { useState } from 'react';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
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
                    <TooltipContent side="top" className="bg-popover text-popover-foreground border shadow-sm z-50">
                        {tooltipContent}
                    </TooltipContent>
                )}
            </Tooltip>

            {item && (
                <ContextMenuContent className="w-48 bg-[#1a1a1a] border-[#333] text-white z-50">
                    {canSplit && (
                        <ContextMenuItem
                            onClick={() => setIsSplitDialogOpen(true)}
                            className="hover:bg-accent focus:bg-accent focus:text-white"
                        >
                            Split Stack
                        </ContextMenuItem>
                    )}
                    {!canSplit && (
                        <ContextMenuItem disabled className="text-gray-500">
                            No actions available
                        </ContextMenuItem>
                    )}
                </ContextMenuContent>
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
