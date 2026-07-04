import React from 'react';

interface NPCTooltipProps {
    npc: {
        name: string;
        hp: number;
        maxHp: number;
        stunnedTurns?: number;
        fireTurns?: number;
        typeId?: string;
        isShopkeeper?: boolean;
    };
}

/**
 * NPCTooltip - Minimalist premium tooltip for Survivors
 */
export function NPCTooltip({ npc }: NPCTooltipProps) {
    if (!npc) return null;

    const isShopkeeper = npc.typeId === 'shopkeeper' || npc.isShopkeeper;

    if (isShopkeeper) {
        return (
            <div className="p-3 min-w-[120px] bg-popover backdrop-blur-md border border-border rounded-lg shadow-2xl animate-in fade-in zoom-in duration-150">
                <div className="flex flex-col items-center gap-1">
                    <h4 className="font-black text-sm text-popover-foreground tracking-[0.2em] uppercase text-center w-full">
                        Survivor
                    </h4>
                </div>
            </div>
        );
    }

    const baseName = npc.name;
    const conditions: string[] = [];
    if (npc.stunnedTurns && npc.stunnedTurns > 0) {
        conditions.push('Stunned!');
    }
    if (npc.fireTurns && npc.fireTurns > 0) {
        conditions.push('On Fire!');
    }
    const displayName = conditions.length > 0 ? `${baseName} (${conditions.join(' ')})` : baseName;

    return (
        <div className="p-3 min-w-[120px] bg-popover backdrop-blur-md border border-border rounded-lg shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex flex-col items-center gap-1">
                <h4 className="font-black text-sm text-popover-foreground tracking-[0.2em] uppercase text-center border-b border-border pb-1 w-full mb-1">
                    {displayName}
                </h4>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Status</span>
                    <span className="text-[10px] text-green-400 font-black uppercase tracking-widest">Healthy</span>
                </div>
            </div>
        </div>
    );
}
