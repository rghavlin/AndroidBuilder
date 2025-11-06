
import { cn } from "@/lib/utils";

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
  
  // Build tooltip text - show item name if equipped, slot name if empty
  const tooltipText = item ? item.name : slotInfo.name;
  
  // Check if slot is occupied
  const hasItem = !!item;
  
  // Determine what to display
  const displayIcon = hasItem && item.name ? item.name.substring(0, 2).toUpperCase() : slotInfo.icon;
  const displayLabel = hasItem && item.name ? '' : slotInfo.name;

  return (
    <div
      className={cn(
        "w-12 h-12 bg-secondary border-2 border-border rounded-md",
        "flex flex-col items-center justify-center cursor-pointer",
        "hover:border-accent transition-colors",
        hasItem && "border-accent bg-accent/10",
        isSelected && "ring-2 ring-red-500 animate-pulse", // Phase 5H: Red highlight when selected
        className
      )}
      onClick={onClick}
      data-testid={`equipment-slot-${slotId}`}
      title={tooltipText}
    >
      {hasItem ? (
        <span className="text-xs font-bold text-accent">{displayIcon}</span>
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
