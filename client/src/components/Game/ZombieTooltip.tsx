import React from 'react';
import { cn } from "@/lib/utils";
import { ZombieTypes } from '../../game/entities/ZombieTypes';

interface ZombieTooltipProps {
    zombie: {
        subtype: string;
        hp: number;
        maxHp: number;
        currentAP: number;
        maxAP: number;
        stunnedTurns?: number;
        fireTurns?: number;
    };
}

/**
 * ZombieTooltip - Premium styled tooltip for zombies on the map
 * Displays name, HP bar, and AP status
 */
export function ZombieTooltip({ zombie }: ZombieTooltipProps) {
    if (!zombie) return null;

    const baseName = ZombieTypes[zombie.subtype]?.name || 'Zombie';
    
    const conditions: string[] = [];
    if (zombie.stunnedTurns && zombie.stunnedTurns > 0) {
        conditions.push('Stunned!');
    }
    if (zombie.fireTurns && zombie.fireTurns > 0) {
        conditions.push('On Fire!');
    }
    const name = conditions.length > 0 ? `${baseName} (${conditions.join(' ')})` : baseName;
    const hpPercent = Math.max(0, Math.min(100, (zombie.hp / zombie.maxHp) * 100));
    
    // Color coded by health
    let hpColorClass = "bg-green-500";
    if (hpPercent < 25) hpColorClass = "bg-red-500";
    else if (hpPercent < 60) hpColorClass = "bg-amber-500";

    return (
        <div className="p-3 min-w-[150px] bg-popover backdrop-blur-md border border-border rounded-lg shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="mb-2">
                <h4 className="font-bold text-sm text-popover-foreground letter-spacing-tight uppercase tracking-wider">
                    {name}
                </h4>
            </div>

            {/* HP Section */}
            <div className="flex justify-between text-[10px] font-medium mb-1">
                <span className="text-muted-foreground font-bold uppercase tracking-tighter">HP</span>
                <span className="text-popover-foreground font-black">{zombie.hp.toFixed(1)} / {zombie.maxHp.toFixed(1)}</span>
            </div>
        </div>
    );
}
