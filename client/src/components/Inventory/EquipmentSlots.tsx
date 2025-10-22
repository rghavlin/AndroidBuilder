import { cn } from "@/lib/utils";
import EquipmentSlot from "./EquipmentSlot";

export default function EquipmentSlots() {
  // Match exact slots from InventoryManager.js
  const equipmentSlots = [
    { id: 'backpack', name: 'Backpack', icon: '🎒' },
    { id: 'upper_body', name: 'Upper Body', icon: '👕' },
    { id: 'lower_body', name: 'Lower Body', icon: '👖' },
    { id: 'melee', name: 'Melee', icon: '🔪' },
    { id: 'handgun', name: 'Handgun', icon: '🔫' },
    { id: 'long_gun', name: 'Long Gun', icon: '🔫' },
    { id: 'flashlight', name: 'Flashlight', icon: '🔦' },
  ];

  return (
    <div className="border-b border-border p-3" data-testid="equipment-slots">
      <h2 className="text-sm font-semibold text-muted-foreground mb-3">EQUIPMENT</h2>
      <div className="flex gap-2 justify-start flex-wrap">
        {equipmentSlots.map((slot) => (
          <div
            key={slot.id}
            className="w-16 h-16 bg-secondary border-2 border-border rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-accent transition-colors"
            data-testid={`equipment-slot-${slot.id}`}
            title={slot.name}
          >
            <span className="text-lg mb-1">{slot.icon}</span>
            <span className="text-xs text-muted-foreground text-center leading-tight">{slot.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}