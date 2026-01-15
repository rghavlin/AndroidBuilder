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
        <div className={cn("p-4 bg-background border rounded-lg shadow-xl", className)}>
            <div className="mb-4">
                <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                    <span>Modify {weapon.name}</span>
                </h3>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Weapon Attachments
                </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 justify-center">
                {weapon.attachmentSlots.map((slot: any) => (
                    <div key={slot.id} className="flex flex-col items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground px-2 py-0.5 bg-muted rounded truncate w-full text-center">
                            {slot.name}
                        </span>
                        <AttachmentSlot weapon={weapon} slot={slot} />
                    </div>
                ))}
            </div>

            {weapon.attachmentSlots.length === 0 && (
                <div className="py-4 text-center text-xs text-muted-foreground border-2 border-dashed border-muted/20 rounded-lg">
                    No available slots
                </div>
            )}

            <div className="mt-4 pt-3 border-t border-border/50 text-[10px] text-muted-foreground italic text-center">
                Click an empty slot with an attachment selected to install. Click an installed mod to remove.
            </div>
        </div>
    );
}
