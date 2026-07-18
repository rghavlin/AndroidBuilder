
import React, { useState, useEffect, memo, useRef, useMemo } from 'react';
import { cn, isLightTheme } from "@/lib/utils";
import { imageLoader } from '../../game/utils/ImageLoader';
import { ItemContextMenu } from "./ItemContextMenu";
import { ItemTooltip } from "./ItemTooltip";
import { useInventory } from "@/contexts/InventoryContext";
import { useTheme } from "../../contexts/ThemeContext";

const getAdjustedBgColor = (bgColor: string | null, theme: string) => {
    if (!bgColor) return theme === 'metallic' ? 'var(--metallic-slab)' : undefined;
    const lower = bgColor.toLowerCase();
    if (theme === 'light2') {
        if (lower === '#006b18') return '#7BA899';
        if (lower === '#8a0303') return '#D48989';
        if (lower === '#0a2e5c') return '#6B9BC3';
        if (lower === '#5c653a') return '#8B956C';
        if (lower === '#1e1b4b') return '#A5B4FC';
    } else if (theme === 'light') {
        if (lower === '#006b18') return '#639A88';
        if (lower === '#8a0303') return '#C15C5C';
        if (lower === '#0a2e5c') return '#5C8AB3';
        if (lower === '#1e1b4b') return '#C7D2FE';
    } else if (theme === 'steampunk') {
        if (lower === '#006b18') return '#2e9e4f';
        if (lower === '#8a0303') return '#c0392b';
        if (lower === '#0a2e5c') return '#3a6ea5';
        if (lower === '#5c653a') return '#7a8450';
        if (lower === '#1e1b4b') return '#5c5a8a';
    }
    return bgColor;
};

interface WorkspaceSlotProps {
    containerId: string;
    slotIndex: number;
    label: string;
    icon?: string;
    className?: string;
}

const WorkspaceSlot = memo(({
    containerId,
    slotIndex,
    label,
    icon,
    className
}: WorkspaceSlotProps) => {
    const { getContainer, selectItem, selectedItem, placeSelected, inventoryVersion } = useInventory();
    const { theme } = useTheme();
    const isLight = isLightTheme(theme);
    const [imageSrc, setImageSrc] = useState<string | null>(null);

    const container = getContainer(containerId);
    const item = container?.getItemAt(slotIndex, 0); // Workspace tool slots are 1x1 in a 2x1 container usually

    // Request sequence ID to prevent stale updates
    const activeLoadIdRef = useRef(0);

    const itemKey = useMemo(() => {
        return item ? `${item.instanceId}:${item.imageId || item.id}` : '';
    }, [item, inventoryVersion]);

    useEffect(() => {
        if (!item) {
            setImageSrc(null);
            return;
        }

        const imageId = item.imageId || item.id;
        
        // Try synchronous cache lookup first
        const cachedSrc = imageLoader.getCachedItemSrc(imageId);
        if (cachedSrc) {
            setImageSrc(cachedSrc);
            return;
        }

        const loadId = ++activeLoadIdRef.current;
        const load = async () => {
            try {
                const imgElement = await imageLoader.getItemImage(imageId);
                if (loadId === activeLoadIdRef.current) {
                    setImageSrc(imgElement?.src || null);
                }
            } catch (err) {
                if (loadId === activeLoadIdRef.current) {
                    setImageSrc(null);
                }
            }
        };
        load();
    }, [itemKey]);

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
        <ItemContextMenu
                item={item}
                tooltipContent={item ? <ItemTooltip item={item} /> : <p className="font-medium text-xs">{label}</p>}
            >
                <div
                    className={cn(
                        "w-14 h-14 bg-secondary border-2 border-border rounded-md",
                        "flex flex-col items-center justify-center cursor-pointer",
                        "hover:border-accent transition-colors relative overflow-hidden",
                        item && "border-accent bg-accent/10",
                        className
                    )}
                    style={item ? {
                        background: getAdjustedBgColor(item.backgroundColor, theme),
                        ...(item.borderColor ? {
                            borderColor: item.borderColor,
                            borderWidth: '2px',
                            borderStyle: 'solid',
                            boxShadow: `0 0 4px ${item.borderColor}`
                        } : {})
                    } : undefined}
                    onClick={handleClick}
                    data-inventory-ui="true"
                >
                    {item ? (
                        <>
                            {imageSrc ? (
                                <img 
                                    key={`${item.instanceId}:${theme}`}
                                    src={imageSrc} 
                                    alt={item.name}                                        
                                    className={cn(
                                        "w-full h-full object-contain p-1", 
                                        !item?.backgroundColor && (isLight ? "mix-blend-multiply" : "mix-blend-screen")
                                    )}
                                     style={{
                                         filter: theme === 'steampunk' ? 'var(--sp-icon-filter)' : theme === 'metallic' ? 'var(--metallic-icon-filter)' : theme === 'light2' ? 'invert(0.75)' : theme === 'light' ? 'invert(1)' : undefined
                                     }}
                                />
                            ) : (
                                <span className="text-[0.6rem] font-bold text-accent text-center px-1 truncate">{item.name}</span>
                            )}

                            {/* Charges Overlay (Consistent with UniversalGrid ammo style) */}
                            {item && typeof item.getDisplayAmmoCount === 'function' && item.getDisplayAmmoCount() !== null && (
                                <div className="absolute inset-0 pointer-events-none z-20">
                                    <span className="absolute bottom-1 right-1 text-[0.65rem] leading-none font-bold text-amber-400 bg-black/85 px-[2px] py-[1px] rounded-tl-sm shadow-sm border-t border-l border-white/20 whitespace-nowrap">
                                        {item.getDisplayAmmoCount()}
                                    </span>
                                </div>
                            )}
                        </>
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
        );
});

export default WorkspaceSlot;
