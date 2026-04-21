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

    return (
        <div className={cn("p-1", className)}>
            <div className="grid grid-cols-2 gap-1 justify-center">
                {weapon.attachmentSlots.filter((slot: any) => !slot.hidden).map((slot: any) => (
                    <div key={slot.id} className="flex flex-col items-center gap-1 min-w-[40px]">
                        <span className="text-[10px] font-semibold text-muted-foreground px-1.5 py-0.5 bg-muted/50 rounded truncate w-full text-center uppercase tracking-tighter">
                            {slot.name}
                        </span>
                        <AttachmentSlot weapon={weapon} slot={slot} />
                    </div>
                ))}
            </div>

        </div>
    );
}
