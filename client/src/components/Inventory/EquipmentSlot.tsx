
import { cn } from "@/lib/utils";

interface EquipmentSlotProps {
  slotId: string;
  item?: any;
  isEquipped?: boolean;
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
  onClick,
  className
}: EquipmentSlotProps) {
  const slotInfo = SLOT_INFO[slotId] || { name: slotId, icon: '?' };
  
  // Build tooltip text
  const tooltipText = item ? item.name : slotInfo.name;

  return (
    <div
      className={cn(
        "w-12 h-12 bg-secondary border-2 border-border rounded-md",
        "flex flex-col items-center justify-center cursor-pointer",
        "hover:border-accent transition-colors",
        isEquipped && "border-accent bg-accent/10",
        className
      )}
      onClick={onClick}
      data-testid={`equipment-slot-${slotId}`}
      title={tooltipText}
    >
      {item && (
        <span className="text-base">
          {slotInfo.icon}
        </span>
      )}
      {!item && (
        <span className="text-base">{slotInfo.icon}</span>
      )}
      <span className="text-[0.5rem] text-muted-foreground text-center leading-none mt-0.5">
        {slotInfo.name}
      </span>
    </div>
  );
}
