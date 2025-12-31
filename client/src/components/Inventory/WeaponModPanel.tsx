import React from 'react';
import { useInventory } from '@/contexts/InventoryContext';
import { cn } from "@/lib/utils";
import UniversalGrid from "./UniversalGrid";

interface WeaponModPanelProps {
    weapon: any;
    className?: string;
}

export default function WeaponModPanel({
    weapon,
    className = "",
}: WeaponModPanelProps) {
    const { getContainer } = useInventory();

    if (!weapon || !weapon.attachmentSlots) {
        return null;
    }

    // Ensure containers are initialized
    const attachmentContainers = weapon.getAttachmentContainers?.() || [];

    return (
        <div className={cn("p-4 bg-background/95 border rounded-lg shadow-xl", className)}>
            <div className="mb-4">
                <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                    <span>Modify {weapon.name}</span>
                </h3>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Weapon Attachments
                </p>
            </div>

            <div className="flex flex-wrap gap-6 justify-center">
                {weapon.attachmentSlots.map((slot: any) => {
                    const container = weapon.getAttachmentContainerById?.(slot.id);
                    if (!container) return null;

                    return (
                        <div key={slot.id} className="flex flex-col items-center gap-2">
                            <span className="text-xs font-semibold text-muted-foreground px-2 py-0.5 bg-muted rounded">
                                {slot.name}
                            </span>
                            <div className="relative group">
                                <UniversalGrid
                                    containerId={container.id}
                                    width={1}
                                    height={1}
                                    gridType="fixed"
                                    enableScroll={false}
                                    className="border-primary/30 group-hover:border-primary/60 transition-colors"
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 pt-3 border-t border-border/50 text-[10px] text-muted-foreground italic text-center">
                Drag compatible attachments into specific slots
            </div>
        </div>
    );
}
