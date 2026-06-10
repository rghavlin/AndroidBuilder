import React from 'react';
import { cn } from "@/lib/utils";
import AttachmentSlot from './AttachmentSlot';

interface WeaponModPanelProps {
    weapon: any;
    className?: string;
}

export default function WeaponModPanel({
    weapon,
    className = "",
}: WeaponModPanelProps) {
    if (!weapon || !weapon.attachmentSlots) {
        return (
            <div className="p-4 text-center text-muted-foreground italic">
                This item cannot be modified.
            </div>
        );
    }

    const visibleSlots = weapon.attachmentSlots.filter((slot: any) => !slot.hidden);

    return (
        <div className={cn("p-0.5 w-full", className)}>
            <div className={cn(
                "grid gap-0.5 justify-center",
                visibleSlots.length > 1 ? "grid-cols-2" : "grid-cols-1"
            )}>
                {visibleSlots.map((slot: any) => (
                    <div key={slot.id} className="flex flex-col items-center gap-0.5 min-w-[40px]">
                        {weapon.defId !== 'tool.battery_powered_hotplate' && (
                            <span className="text-[9px] font-semibold text-muted-foreground px-1 py-0 bg-muted/50 rounded truncate w-full text-center uppercase tracking-tighter">
                                {slot.name}
                            </span>
                        )}
                        <AttachmentSlot weapon={weapon} slot={slot} />
                    </div>
                ))}
            </div>
        </div>
    );
}
