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
        <div className="p-2.5 min-w-[120px] bg-black border border-white/40 rounded-sm shadow-xl animate-in fade-in zoom-in duration-150 text-center">
            <h4 className="font-bold text-[11px] text-white uppercase tracking-widest mb-1.5 border-b border-white/10 pb-1">
                Door
            </h4>
            <div className="text-[10px] text-zinc-400 uppercase font-medium mb-1">
                Status: <span className="text-white font-bold">{status}</span>
            </div>
            <div className="text-[10px] text-zinc-400 uppercase font-medium">
                Integrity: <span className="text-white font-bold">{Math.ceil(door.hp)}/{door.maxHp}</span>
            </div>
        </div>
    );
}
