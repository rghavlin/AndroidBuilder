import React from 'react';

interface LootTooltipProps {
    items: Array<any>;
}

/**
 * LootTooltip - Premium styled tooltip for items on the map
 * Matches the ZombieTooltip aesthetic for visual consistency
 */
export function LootTooltip({ items }: LootTooltipProps) {
    if (!items || items.length === 0) return null;

    // Filter out invalid items
    const validItems = items.filter(item => item && item.name);
    if (validItems.length === 0) return null;

    // Map items to names with stack counts
    const itemStrings = validItems.map(item => {
        let name = item.name;
        if (item.defId === 'zombie.corpse') {
            const hasSpecialColor = !!item.backgroundColor;
            const hasSpecialImage = !!item.imageId && item.imageId !== 'zombiecorpse';
            if (!hasSpecialColor && !hasSpecialImage) {
                name = 'Zombie Corpse';
            }
        }
        if (item.stackCount && item.stackCount > 1) {
            return `${name} (${item.stackCount})`;
        }
        return name;
    });

    return (
        <div className="p-3 min-w-[150px] bg-popover backdrop-blur-md border border-border rounded-lg shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col gap-1.5">
                {itemStrings.map((itemStr, index) => (
                    <div key={index} className="flex items-center justify-between text-[11px] font-medium">
                        <span className="text-popover-foreground font-bold tracking-tight">{itemStr}</span>
                    </div>
                ))}
            </div>
            
            {items.length > 5 && (
                <div className="text-[9px] text-muted-foreground italic mt-2 text-center">
                    + {items.length - 5} more items...
                </div>
            )}
        </div>
    );
}
