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
    };
}

/**
 * ZombieTooltip - Premium styled tooltip for zombies on the map
 * Displays name, HP bar, and AP status
 */
export function ZombieTooltip({ zombie }: ZombieTooltipProps) {
    if (!zombie) return null;

    const name = ZombieTypes[zombie.subtype]?.name || 'Zombie';
    const hpPercent = Math.max(0, Math.min(100, (zombie.hp / zombie.maxHp) * 100));
    
    // Color coded by health
    let hpColorClass = "bg-green-500";
    if (hpPercent < 25) hpColorClass = "bg-red-500";
    else if (hpPercent < 60) hpColorClass = "bg-amber-500";

    return (
        <div className="p-3 min-w-[150px] bg-black/80 backdrop-blur-md border border-white/20 rounded-lg shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="mb-2">
                <h4 className="font-bold text-sm text-white letter-spacing-tight uppercase tracking-wider">
                    {name}
                </h4>
            </div>

            {/* HP Section */}
            <div className="flex justify-between text-[10px] font-medium mb-1">
                <span className="text-zinc-400 font-bold uppercase tracking-tighter">HP</span>
                <span className="text-white font-black">{zombie.hp.toFixed(1)} / {zombie.maxHp.toFixed(1)}</span>
            </div>
        </div>
    );
}
