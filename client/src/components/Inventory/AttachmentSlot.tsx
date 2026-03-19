import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { imageLoader } from '../../game/utils/ImageLoader';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useInventory } from "@/contexts/InventoryContext";

interface AttachmentSlotProps {
    weapon: any;
    slot: { id: string; name: string; allowedCategories?: string[] };
    className?: string;
}

export default function AttachmentSlot({
    weapon,
    slot,
    className
}: AttachmentSlotProps) {
    const { attachSelectedItemToWeapon, detachItemFromWeapon, selectedItem, inventoryVersion } = useInventory();
    const [imageSrc, setImageSrc] = useState<string | null>(null);

    // Get currently attached item (reactive to inventoryVersion)
    const attachedItem = weapon.getAttachment?.(slot.id);

    const hasItem = !!attachedItem;
    const tooltipText = attachedItem ? attachedItem.name : slot.name;

    useEffect(() => {
        let isMounted = true;
        const loadItemImage = async () => {
            if (!attachedItem) {
                if (isMounted) setImageSrc(null);
                return;
            }

            try {
                const imageId = attachedItem.imageId || attachedItem.id;
                const imgElement = await imageLoader.getItemImage(imageId);
                if (isMounted && imgElement) {
                    setImageSrc(imgElement.src);
                }
            } catch (err) {
                console.warn(`[AttachmentSlot] Failed to load image`, err);
                if (isMounted) setImageSrc(null);
            }
        };

        loadItemImage();
        return () => { isMounted = false; };
    }, [attachedItem]);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (hasItem) {
            // Detach existing item
            detachItemFromWeapon(weapon, slot.id);
        } else if (selectedItem) {
            // Try to attach selected item
            console.log('[AttachmentSlot] Attempting to attach:', selectedItem.item.name, 'to', slot.id);
            attachSelectedItemToWeapon(weapon, slot.id);
        }
    };

    return (
        <TooltipProvider delayDuration={300}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className={cn(
                            "w-12 h-12 bg-secondary border-2 border-border rounded-md",
                            "flex flex-col items-center justify-center cursor-pointer",
                            "hover:border-accent transition-colors",
                            "relative overflow-hidden",
                            hasItem && "border-accent bg-accent/10",
                            className
                        )}
                        onClick={handleClick}
                    >
                        {hasItem ? (
                            <>
                                {imageSrc ? (
                                    <img
                                        src={imageSrc}
                                        alt={attachedItem.name}
                                        className={cn(
                                            "w-full h-full object-cover p-1 transition-opacity",
                                            selectedItem?.item?.instanceId === attachedItem.instanceId && "opacity-40 grayscale-[50%]"
                                        )}
                                    />
                                ) : (
                                    <span className={cn(
                                        "text-[0.65rem] font-bold text-accent text-center px-1 transition-opacity",
                                        selectedItem?.item?.instanceId === attachedItem.instanceId && "opacity-40"
                                    )}>
                                        {attachedItem.name.substring(0, 3).toUpperCase()}
                                    </span>
                                )}

                                {/* Ammo/Stack count indicator */}
                                {(attachedItem.stackCount > 1 || (typeof attachedItem.getDisplayAmmoCount === 'function' && attachedItem.getDisplayAmmoCount() !== null)) && (
                                    <div className="absolute inset-0 pointer-events-none z-20">
                                        <span className="absolute bottom-0.5 right-0.5 text-[0.6rem] leading-none font-bold text-white bg-black/85 px-[2px] py-[1px] rounded-tl-sm shadow-sm border-t border-l border-white/20">
                                            {attachedItem.getDisplayAmmoCount ? attachedItem.getDisplayAmmoCount() : attachedItem.stackCount}
                                        </span>
                                    </div>
                                )}
                            </>
                        ) : (
                            <span className="text-[0.5rem] text-muted-foreground text-center leading-none px-1 uppercase font-bold">
                                {slot.name}
                            </span>
                        )}
                    </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                    <p className="text-xs">{tooltipText}</p>
                    {!hasItem && slot.allowedCategories && (
                        <p className="text-[0.6rem] text-muted-foreground mt-0.5 italic">
                            Fits: {slot.allowedCategories.join(', ')}
                        </p>
                    )}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
