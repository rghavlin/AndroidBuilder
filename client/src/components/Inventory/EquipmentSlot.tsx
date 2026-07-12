import { memo } from 'react';
import { cn } from "@/lib/utils";
import { ItemContextMenu } from "./ItemContextMenu";
import { ItemTooltip } from "./ItemTooltip";
import { useItemImage } from '../../hooks/useItemImage';
import { useInventory } from "@/contexts/InventoryContext";
import { useTheme } from "../../contexts/ThemeContext";

const getAdjustedBgColor = (bgColor: string | null, theme: string) => {
  if (!bgColor) return theme === 'light2' ? 'rgba(255, 255, 255, 0.15)' : undefined;
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
  }
  return bgColor;
};

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
  belt: { name: 'Belt', icon: '🪢', imageId: 'leatherbelt' },
  melee: { name: 'Melee', icon: '🔪', imageId: 'knife' },
  handgun: { name: 'Handgun', icon: '🔫', imageId: '9mm pistol' },
  long_gun: { name: 'Long Gun', icon: '🔫', imageId: 'huntingrifle' },
  flashlight: { name: 'Flashlight', icon: '🔦', imageId: 'flashlight' },
  armor: { name: 'Armor', icon: '🛡️', imageId: 'paddedarmor' },
};

const EquipmentSlot = memo(({
  slotId,
  item,
  isSelected = false,
  onClick,
  className
}: EquipmentSlotProps) => {
  const { selectedItem } = useInventory();
  const { theme } = useTheme();
  const slotInfo = SLOT_INFO[slotId] || { name: slotId, icon: '?' };
  const imageId = item ? (item.imageId || item.image || item.id) : slotInfo.imageId;
  const imageSrc = useItemImage(imageId);

  // Build tooltip text - show item name if equipped, slot name if empty
  const tooltipText = item ? item.name : slotInfo.name;

  // Check if slot is occupied
  const hasItem = !!item;

  // Shading feedback when hovering with an item selected
  const showPlacementFeedback = !!selectedItem && !hasItem;
  const canEquip = showPlacementFeedback && selectedItem.item && (
    typeof selectedItem.item.canEquipIn === 'function' 
      ? selectedItem.item.canEquipIn(slotId) 
      : false
  );

  // Determine text fallback
  const displayIcon = hasItem && item.name ? item.name.substring(0, 2).toUpperCase() : slotInfo.icon;
  const displayLabel = hasItem && item.name ? '' : slotInfo.name;

  return (
    <ItemContextMenu
        item={item}
        tooltipContent={item ? <ItemTooltip item={item} /> : <p className="font-medium text-xs">{tooltipText}</p>}
      >
        <div className={cn("relative w-12 h-12", className)} data-testid={`equipment-slot-wrapper-${slotId}`}>
          <div
            className={cn(
              "w-full h-full",
              hasItem ? "inset-slot rounded-full" : "empty-slot rounded-lg text-zinc-500",
              "flex flex-col items-center justify-center cursor-pointer",
              "hover:brightness-110 transition-all",
              "relative overflow-hidden isolate", // Clip image to rounded corners
              isSelected && "active selected-item-overlay",
              showPlacementFeedback && (
                canEquip
                  ? "hover:!bg-[radial-gradient(circle_at_center,_#bbf7d0_0%,_#22c55e_100%)] hover:!border-green-600 hover:!shadow-[0_0_10px_rgba(34,197,94,0.4)] hover:!text-white"
                  : "hover:!bg-[radial-gradient(circle_at_center,_#fecaca_0%,_#ef4444_100%)] hover:!border-red-600 hover:!shadow-[0_0_10px_rgba(239,68,68,0.4)] hover:!text-white"
              )
            )}
            style={{
              background: hasItem ? getAdjustedBgColor(item.backgroundColor, theme) : undefined,
              ...(hasItem && item.borderColor ? {
                borderColor: item.borderColor,
                borderWidth: '1px',
                borderStyle: 'solid',
                boxShadow: `0 0 4px ${item.borderColor}`
              } : {})
            }}
            onClick={onClick}
            data-testid={`equipment-slot-${slotId}`}
          >
            {imageSrc && imageSrc !== 'failed' ? (
              <div className="w-full h-full p-1.5 flex items-center justify-center transition-opacity duration-300">
                <img
                  key={`${slotId}:${theme}`}
                  src={imageSrc}
                  alt={item?.name || slotInfo.name}
                  className={cn(
                    "w-full h-full object-contain pointer-events-none transition-transform",
                    hasItem && "rounded-full",
                    hasItem 
                      ? (!item?.backgroundColor && (theme !== 'dark' ? "mix-blend-multiply" : "mix-blend-screen")) 
                      : (theme !== 'dark' ? "mix-blend-multiply opacity-[0.35]" : "mix-blend-screen opacity-[0.35]")
                  )}
                  style={{
                    filter: !hasItem 
                      ? (theme === 'light2' ? "invert(0.6)" : theme === 'light' ? "invert(1)" : "none")
                      : (!item?.backgroundColor ? (theme === 'light2' ? "invert(0.75)" : theme === 'light' ? "invert(1) contrast(300%)" : "brightness(2) contrast(300%)") : undefined)
                  }}
                />
              </div>
            ) : (
              <>
                <span className="text-xl mb-0.5 opacity-70">{displayIcon}</span>
                <span className="text-[9px] uppercase font-bold tracking-tighter opacity-80">{displayLabel}</span>
              </>
            )}

            {/* Recessed shadow overlay if occupied */}
            {hasItem && (
              <div className="absolute inset-0 pointer-events-none shadow-[inset_0_3px_6px_rgba(0,0,0,0.85)] rounded-full z-10" />
            )}
          </div>

          {/* Ammo count indicator (for magazines and weapons with magazine slots) - OUTSIDE the overflow-hidden div */}
          {item && typeof item.getDisplayAmmoCount === 'function' && item.getDisplayAmmoCount() !== null && (
            <div className="absolute inset-0 pointer-events-none z-20">
              <span className="absolute bottom-0 right-0 text-[0.6rem] leading-none font-bold text-white bg-black/85 px-[2px] py-[1px] rounded-tl-sm shadow-sm border-t border-l border-white/20">
                {item.getDisplayAmmoCount()}
              </span>
            </div>
          )}
        </div>
      </ItemContextMenu>
    );
});

export default EquipmentSlot;
