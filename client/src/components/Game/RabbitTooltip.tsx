import React from 'react';

interface RabbitTooltipProps {
    rabbit: {
        hp: number;
        maxHp: number;
        stunnedTurns?: number;
        fireTurns?: number;
    };
}

/**
 * RabbitTooltip - Premium styled tooltip for rabbits on the map
 * Displays name and HP status
 */
export function RabbitTooltip({ rabbit }: RabbitTooltipProps) {
    if (!rabbit) return null;

    const conditions: string[] = [];
    if (rabbit.stunnedTurns && rabbit.stunnedTurns > 0) {
        conditions.push('Stunned!');
    }
    if (rabbit.fireTurns && rabbit.fireTurns > 0) {
        conditions.push('On Fire!');
    }
    const displayName = conditions.length > 0 ? `Rabbit (${conditions.join(' ')})` : 'Rabbit';

    return (
        <div className="p-3 min-w-[150px] bg-popover backdrop-blur-md border border-border rounded-lg shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="mb-2">
                <h4 className="font-bold text-sm text-popover-foreground letter-spacing-tight uppercase tracking-wider">
                    {displayName}
                </h4>
            </div>

            {/* HP Section */}
            <div className="flex justify-between text-[10px] font-medium mb-1">
                <span className="text-muted-foreground font-bold uppercase tracking-tighter">HP</span>
                <span className="text-popover-foreground font-black">{rabbit.hp.toFixed(1)} / {rabbit.maxHp.toFixed(1)}</span>
            </div>

            <div className="text-[10px] text-muted-foreground italic mt-2 border-t border-border pt-1">
                Wild animal
            </div>
        </div>
    );
}
