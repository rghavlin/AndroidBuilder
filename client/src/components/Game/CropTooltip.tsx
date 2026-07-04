import React from 'react';

interface CropTooltipProps {
    cropInfo: {
        shortestTime: number;
    };
}

/**
 * CropTooltip - Premium styled tooltip for crops on the map
 * Matches the ZombieTooltip aesthetic for visual consistency
 */
export function CropTooltip({ cropInfo }: CropTooltipProps) {
    if (!cropInfo) return null;

    return (
        <div className="p-3 min-w-[150px] bg-popover backdrop-blur-md border border-border rounded-lg shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="mb-2">
                <h4 className="font-bold text-sm text-popover-foreground uppercase tracking-wider">
                    Crops
                </h4>
            </div>

            {/* Growth Section */}
            <div className="flex justify-between text-[10px] font-medium mb-1">
                <span className="text-muted-foreground font-bold uppercase tracking-tighter">Ready in</span>
                <span className="text-emerald-400 font-black">{cropInfo.shortestTime}h</span>
            </div>
            
            <div className="text-[10px] text-muted-foreground italic mt-2 border-t border-border pt-2">
                Shortest growth time on tile
            </div>
        </div>
    );
}
