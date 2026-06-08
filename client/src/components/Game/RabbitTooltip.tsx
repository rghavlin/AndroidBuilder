import React from 'react';

interface RabbitTooltipProps {
    rabbit: {
        hp: number;
        maxHp: number;
    };
}

/**
 * RabbitTooltip - Premium styled tooltip for rabbits on the map
 * Displays name and HP status
 */
export function RabbitTooltip({ rabbit }: RabbitTooltipProps) {
    if (!rabbit) return null;

    return (
        <div className="p-3 min-w-[150px] bg-black/80 backdrop-blur-md border border-white/20 rounded-lg shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="mb-2">
                <h4 className="font-bold text-sm text-white letter-spacing-tight uppercase tracking-wider">
                    Rabbit
                </h4>
            </div>

            {/* HP Section */}
            <div className="flex justify-between text-[10px] font-medium mb-1">
                <span className="text-zinc-400 font-bold uppercase tracking-tighter">HP</span>
                <span className="text-white font-black">{rabbit.hp.toFixed(1)} / {rabbit.maxHp.toFixed(1)}</span>
            </div>

            <div className="text-[10px] text-zinc-500 italic mt-2 border-t border-white/5 pt-1">
                Wild animal
            </div>
        </div>
    );
}
