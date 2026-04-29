import React from 'react';

interface NPCTooltipProps {
    npc: {
        name: string;
        hp: number;
        maxHp: number;
    };
}

/**
 * NPCTooltip - Minimalist premium tooltip for Survivors
 */
export function NPCTooltip({ npc }: NPCTooltipProps) {
    if (!npc) return null;

    return (
        <div className="p-3 min-w-[120px] bg-black/85 backdrop-blur-md border border-white/20 rounded-lg shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex flex-col items-center gap-1">
                <h4 className="font-black text-sm text-white tracking-[0.2em] uppercase text-center border-b border-white/10 pb-1 w-full mb-1">
                    {npc.name}
                </h4>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Status</span>
                    <span className="text-[10px] text-green-400 font-black uppercase tracking-widest">Healthy</span>
                </div>
            </div>
        </div>
    );
}
