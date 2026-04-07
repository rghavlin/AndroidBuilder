import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { imageLoader } from '../../game/utils/ImageLoader';
import { TooltipProvider } from "@/components/ui/tooltip";
import { ItemContextMenu } from "./ItemContextMenu";
import { ItemTooltip } from "./ItemTooltip";

interface EquipmentSlotProps {
  slotId: string;
  item?: any;
  isEquipped?: boolean;
  isSelected?: boolean;
  onClick?: (event: React.MouseEvent) => void;
  className?: string;
}

// Slot display names and default icons
const SLOT_INFO: Record<string, { name: string; icon: string; imageId: string }> = {
  backpack: { name: 'Backpack', icon: '🎒', imageId: 'standardBackpack' },
  upper_body: { name: 'Upper Body', icon: '👕', imageId: 'workshirt' },
  lower_body: { name: 'Lower Body', icon: '👖', imageId: 'sweatpants' },
  melee: { name: 'Melee', icon: '🔪', imageId: 'knife' },
  handgun: { name: 'Handgun', icon: '🔫', imageId: '9mm pistol' },
  long_gun: { name: 'Long Gun', icon: '🔫', imageId: 'huntingrifle' },
  flashlight: { name: 'Flashlight', icon: '🔦', imageId: 'flashlight' },
};

export default function EquipmentSlot({
  slotId,
  item,
  isSelected = false,
  onClick,
  className
}: EquipmentSlotProps) {
  const slotInfo = SLOT_INFO[slotId] || { name: slotId, icon: '?' };
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // Build tooltip text - show item name if equipped, slot name if empty
  const tooltipText = item ? item.name : slotInfo.name;

  // Check if slot is occupied
  const hasItem = !!item;

  // Load image when item changes OR when looking for slot icon
  useEffect(() => {
    let isMounted = true;

    const loadImages = async () => {
      const imageId = item ? (item.imageId || item.image || item.id) : slotInfo.imageId;
      
      if (!imageId) {
        if (isMounted) setImageSrc(null);
        return;
      }

      try {
        const imgElement = await imageLoader.getItemImage(imageId);

        if (isMounted) {
          if (imgElement && imgElement.src) {
            setImageSrc(imgElement.src);
          } else {
            setImageSrc(null);
          }
        }
      } catch (err) {
        console.warn(`[EquipmentSlot] Failed to load image for ${imageId}`, err);
        if (isMounted) setImageSrc(null);
      }
    };

    loadImages();

    return () => {
      isMounted = false;
    };
  }, [item, slotId]);

  // Determine text fallback
  const displayIcon = hasItem && item.name ? item.name.substring(0, 2).toUpperCase() : slotInfo.icon;
  const displayLabel = hasItem && item.name ? '' : slotInfo.name;

    // Default to white/gray for empty slots to match inverted icon, 
    // or black for occupied slots as previously implemented.
    const getSlotBgColor = () => {
        if (!hasItem) return '#ffffff'; // White background for empty inverted icons
        
        // Special case for clothing with blue backgrounds
        if (item.id?.includes('police') || item.id?.includes('paramedic')) {
            return '#0a2e5c'; // Dark Blue from screenshot
        }
        
        // Default to black for most occupied items
        return '#000000';
    };

    const occupiedBgColor = getSlotBgColor();

  return (
    <TooltipProvider delayDuration={300}>
      <ItemContextMenu
        item={item}
        tooltipContent={item ? <ItemTooltip item={item} /> : <p className="font-medium text-xs">{tooltipText}</p>}
      >
        <div
          className={cn(
            "w-12 h-12 bg-secondary border-2 border-border rounded-md",
            "flex flex-col items-center justify-center cursor-pointer",
            "hover:border-accent transition-colors",
            "relative overflow-hidden", // Clip image to rounded corners
            hasItem && "border-accent", // Background handled by style
            isSelected && "ring-2 ring-red-500 animate-pulse", // Phase 5H: Red highlight when selected
            className
          )}
          style={{
            backgroundColor: occupiedBgColor
          }}
          onClick={onClick}
          data-testid={`equipment-slot-${slotId}`}
        >
          {imageSrc ? (
            <div className={cn(
              "w-full h-full p-1.5 flex items-center justify-center transition-opacity duration-300",
              !hasItem && "opacity-25" // Ghostly silhouette
            )}>
              <img
                src={imageSrc}
                alt={item?.name || slotInfo.name}
                className={cn(
                  "w-full h-full object-contain pointer-events-none transition-transform",
                  !hasItem && "invert" // Invert to black-on-white silhouette
                )}
                style={{
                  transform: (hasItem && typeof item.shouldRotateToFit === 'function' && item.shouldRotateToFit()) ? 'rotate(-45deg)' : 'none'
                }}
              />
            </div>
          ) : (
            <>
              <span className="text-xl mb-0.5 opacity-40">{displayIcon}</span>
              <span className="text-[9px] uppercase font-bold tracking-tighter opacity-40">{displayLabel}</span>
            </>
          )}

          {/* Ammo count indicator (for magazines and weapons with magazine slots) */}
          {item && typeof item.getDisplayAmmoCount === 'function' && item.getDisplayAmmoCount() !== null && (
            <div className="absolute inset-0 pointer-events-none z-20">
              <span className="absolute bottom-0.5 right-0.5 text-[0.6rem] leading-none font-bold text-white bg-black/85 px-[2px] py-[1px] rounded-tl-sm shadow-sm border-t border-l border-white/20">
                {item.getDisplayAmmoCount()}
              </span>
            </div>
          )}
        </div>
      </ItemContextMenu>
    </TooltipProvider>
  );
}
