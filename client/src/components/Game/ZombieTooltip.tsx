import React from 'react';
import { cn } from "@/lib/utils";

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

    let name = 'Zombie';
    if (zombie.subtype === 'crawler') name = 'Crawler';
    else if (zombie.subtype === 'firefighter') name = 'Firefighter Zombie';
    else if (zombie.subtype === 'swat') name = 'Swat Zombie';
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
            <div className="flex justify-between text-[10px] font-medium mb-2">
                <span className="text-zinc-400 font-bold uppercase tracking-tighter">HP</span>
                <span className="text-white font-black">{zombie.hp.toFixed(1)} / {zombie.maxHp.toFixed(1)}</span>
            </div>

            {/* AP Section */}
            <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">AP</span>
                </div>
                <span className="text-sm font-bold text-blue-400">{zombie.currentAP} <span className="text-[10px] text-zinc-600 font-normal">/ {zombie.maxAP}</span></span>
            </div>
        </div>
    );
}
