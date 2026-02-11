
import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { imageLoader } from '../../game/utils/ImageLoader';
import { TooltipProvider } from "@/components/ui/tooltip";
import { ItemContextMenu } from "./ItemContextMenu";
import { useInventory } from "@/contexts/InventoryContext";

interface WorkspaceSlotProps {
    containerId: string;
    slotIndex: number;
    label: string;
    icon?: string;
    className?: string;
}

export default function WorkspaceSlot({
    containerId,
    slotIndex,
    label,
    icon,
    className
}: WorkspaceSlotProps) {
    const { getContainer, selectItem, selectedItem, placeSelected, inventoryVersion } = useInventory();
    const [imageSrc, setImageSrc] = useState<string | null>(null);

    const container = getContainer(containerId);
    const item = container?.getItemAt(slotIndex, 0); // Workspace tool slots are 1x1 in a 2x1 container usually

    useEffect(() => {
        let isMounted = true;
        const loadItemImage = async () => {
            if (!item) {
                if (isMounted) setImageSrc(null);
                return;
            }
            try {
                const imageId = item.imageId || item.id;
                const imgElement = await imageLoader.getItemImage(imageId);
                if (isMounted) {
                    setImageSrc(imgElement?.src || null);
                }
            } catch (err) {
                if (isMounted) setImageSrc(null);
            }
        };
        loadItemImage();
        return () => { isMounted = false; };
    }, [item, inventoryVersion]);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (selectedItem) {
            // Try to place selected item into this slot
            placeSelected(containerId, slotIndex, 0);
        } else if (item) {
            // Select the item in this slot
            selectItem(item, containerId, slotIndex, 0);
        }
    };

    return (
        <TooltipProvider delayDuration={300}>
            <ItemContextMenu
                item={item}
                tooltipContent={<p className="font-medium text-xs">{item ? item.name : label}</p>}
            >
                <div
                    className={cn(
                        "w-14 h-14 bg-secondary border-2 border-border rounded-md",
                        "flex flex-col items-center justify-center cursor-pointer",
                        "hover:border-accent transition-colors relative overflow-hidden",
                        item && "border-accent bg-accent/10",
                        className
                    )}
                    onClick={handleClick}
                >
                    {item ? (
                        imageSrc ? (
                            <img src={imageSrc} alt={item.name} className="w-full h-full object-contain p-1" />
                        ) : (
                            <span className="text-[0.6rem] font-bold text-accent text-center px-1 truncate">{item.name}</span>
                        )
                    ) : (
                        <>
                            {icon && <span className="text-xl mb-1 opacity-50">{icon}</span>}
                            <span className="text-[0.6rem] text-muted-foreground text-center leading-tight px-1">
                                {label}
                            </span>
                        </>
                    )}
                </div>
            </ItemContextMenu>
        </TooltipProvider>
    );
}
