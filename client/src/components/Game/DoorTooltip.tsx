import React from 'react';

interface DoorTooltipProps {
    door: {
        hp: number;
        maxHp: number;
        isDamaged: boolean;
        isOpen: boolean;
    };
}

/**
 * DoorTooltip - Minimalist black and white tooltip for doors
 */
export function DoorTooltip({ door }: DoorTooltipProps) {
    if (!door) return null;

    const status = door.isDamaged ? 'Broken' : (door.isOpen ? 'Open' : 'Closed');
    
    return (
        <div className="p-2.5 min-w-[120px] bg-popover border border-border rounded-sm shadow-xl animate-in fade-in zoom-in duration-150 text-center">
            <h4 className="font-bold text-[11px] text-popover-foreground uppercase tracking-widest mb-1.5 border-b border-border pb-1">
                Door
            </h4>
            <div className="text-[10px] text-muted-foreground uppercase font-medium mb-1">
                Status: <span className="text-popover-foreground font-bold">{status}</span>
            </div>
            <div className="text-[10px] text-muted-foreground uppercase font-medium">
                Integrity: <span className="text-popover-foreground font-bold">{Math.ceil(door.hp)}/{door.maxHp}</span>
            </div>
        </div>
    );
}
