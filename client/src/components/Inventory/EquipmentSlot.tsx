import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { imageLoader } from '../../game/utils/ImageLoader';

interface EquipmentSlotProps {
  slotId: string;
  item?: any;
  isEquipped?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

// Slot display names and default icons
const SLOT_INFO: Record<string, { name: string; icon: string }> = {
  backpack: { name: 'Backpack', icon: '🎒' },
  upper_body: { name: 'Upper Body', icon: '👕' },
  lower_body: { name: 'Lower Body', icon: '👖' },
  melee: { name: 'Melee', icon: '🔪' },
  handgun: { name: 'Handgun', icon: '🔫' },
  long_gun: { name: 'Long Gun', icon: '🔫' },
  flashlight: { name: 'Flashlight', icon: '🔦' },
};

export default function EquipmentSlot({
  slotId,
  item,
  isEquipped = false,
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

  // Load image when item changes
  useEffect(() => {
    let isMounted = true;

    const loadItemImage = async () => {
      // Clear image if no item
      if (!item) {
        if (isMounted) setImageSrc(null);
        return;
      }

      try {
        // UniversalGrid uses item.image or item.id to find the image
        // We really need to check item.imageId which is used in ItemDefs
        const imageId = item.imageId || item.image || item.id;

        // ImageLoader returns an HTMLImageElement object, NOT a string
        const imgElement = await imageLoader.getItemImage(imageId);

        if (isMounted) {
          if (imgElement && imgElement.src) {
            setImageSrc(imgElement.src);
          } else {
            // If valid image object but no src (rare) or null returned
            setImageSrc(null);
          }
        }
      } catch (err) {
        console.warn(`[EquipmentSlot] Failed to load image for ${item.id}`, err);
        if (isMounted) setImageSrc(null);
      }
    };

    loadItemImage();

    return () => {
      isMounted = false;
    };
  }, [item]);

  // Determine text fallback
  const displayIcon = hasItem && item.name ? item.name.substring(0, 2).toUpperCase() : slotInfo.icon;
  const displayLabel = hasItem && item.name ? '' : slotInfo.name;

  return (
    <div
      className={cn(
        "w-12 h-12 bg-secondary border-2 border-border rounded-md",
        "flex flex-col items-center justify-center cursor-pointer",
        "hover:border-accent transition-colors",
        "relative overflow-hidden", // Clip image to rounded corners
        hasItem && "border-accent bg-accent/10",
        isSelected && "ring-2 ring-red-500 animate-pulse", // Phase 5H: Red highlight when selected
        className
      )}
      onClick={onClick}
      data-testid={`equipment-slot-${slotId}`}
      title={tooltipText}
    >
      {hasItem ? (
        imageSrc ? (
          <img
            src={imageSrc}
            alt={item.name}
            className="w-full h-full object-contain p-1"
          />
        ) : (
          <span className="text-xs font-bold text-accent">{displayIcon}</span>
        )
      ) : (
        <>
          <span className="text-base">{slotInfo.icon}</span>
          <span className="text-[0.5rem] text-muted-foreground text-center leading-none mt-0.5">
            {displayLabel}
          </span>
        </>
      )}
    </div>
  );
}
