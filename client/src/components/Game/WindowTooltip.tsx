import React from 'react';

interface WindowTooltipProps {
    windowEntity: {
        isOpen: boolean;
        isBroken: boolean;
        isReinforced?: boolean;
        reinforcementHp?: number;
        maxReinforcementHp?: number;
    };
}

/**
 * WindowTooltip - Minimalist black and white tooltip for windows
 */
export function WindowTooltip({ windowEntity }: WindowTooltipProps) {
    if (!windowEntity) return null;

    let status = windowEntity.isBroken ? 'Broken' : (windowEntity.isOpen ? 'Open' : 'Closed');

    return (
        <div className="p-2.5 min-w-[120px] bg-black border border-white/40 rounded-sm shadow-xl animate-in fade-in zoom-in duration-150 text-center">
            <h4 className="font-bold text-[11px] text-zinc-400 uppercase tracking-widest mb-1.5 border-b border-white/10 pb-1">
                Window
            </h4>
            <div className="text-[10px] text-zinc-400 uppercase font-medium">
                Status: <span className="text-white font-bold">{status}</span>
            </div>
            {windowEntity.isReinforced && (
                <div className="text-[10px] text-zinc-400 uppercase font-medium mt-1 pt-1 border-t border-white/5">
                    Integrity: <span className="text-blue-400 font-bold">{windowEntity.reinforcementHp}/{windowEntity.maxReinforcementHp}</span>
                </div>
            )}
        </div>
    );
}
