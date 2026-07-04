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

    let status = windowEntity.isOpen ? 'Open' : (windowEntity.isBroken ? 'Broken' : 'Closed');

    return (
        <div className="p-2.5 min-w-[120px] bg-popover border border-border rounded-sm shadow-xl animate-in fade-in zoom-in duration-150 text-center">
            <h4 className="font-bold text-[11px] text-muted-foreground uppercase tracking-widest mb-1.5 border-b border-border pb-1">
                Window
            </h4>
            <div className="text-[10px] text-muted-foreground uppercase font-medium">
                Status: <span className="text-popover-foreground font-bold">{status}</span>
            </div>
            {windowEntity.isReinforced && (
                <div className="text-[10px] text-muted-foreground uppercase font-medium mt-1 pt-1 border-t border-border">
                    Integrity: <span className="text-blue-400 font-bold">{windowEntity.reinforcementHp}/{windowEntity.maxReinforcementHp}</span>
                </div>
            )}
        </div>
    );
}
