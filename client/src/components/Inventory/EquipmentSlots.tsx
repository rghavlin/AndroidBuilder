import { cn } from "@/lib/utils";
import EquipmentSlot from "./EquipmentSlot";

export default function EquipmentSlots() {
  const equipmentSlots = [
    { id: 'helmet', name: 'Helmet', icon: '🪖' },
    { id: 'backpack', name: 'Backpack', icon: '🎒' },
    { id: 'vest', name: 'Vest', icon: '🦺' },
    { id: 'gloves', name: 'Gloves', icon: '🧤' },
    { id: 'boots', name: 'Boots', icon: '🥾' },
    { id: 'flashlight', name: 'Flashlight', icon: '🔦' },
  ];

  return (
    <div className="border-b border-border p-3" data-testid="equipment-slots">
      <h2 className="text-sm font-semibold text-muted-foreground mb-3">EQUIPMENT</h2>
      <div className="flex gap-2 justify-start">
        {equipmentSlots.map((slot) => (
          <div
            key={slot.id}
            className="w-12 h-12 bg-secondary border-2 border-border rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-accent transition-colors"
            data-testid={`equipment-slot-${slot.id}`}
            title={slot.name}
          >
            <span className="text-sm mb-1">{slot.icon}</span>
            <span className="text-xs text-muted-foreground">{slot.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}