import React from 'react';

interface BuildingTooltipProps {
    type: string;
}

/**
 * BuildingTooltip - Minimalist black and white tooltip for landmarks
 */
export function BuildingTooltip({ type }: BuildingTooltipProps) {
    if (!type) return null;

    let displayName = "Building";

    switch (type) {
        case 'grocer':
            displayName = "Grocery Store";
            break;
        case 'police':
            displayName = "Police Station";
            break;
        case 'firestation':
            displayName = "Fire Station";
            break;
        case 'fuelpump':
            displayName = "Fuel pump";
            break;
        default:
            displayName = type.charAt(0).toUpperCase() + type.slice(1);
            break;
    }

    return (
        <div className="p-2.5 min-w-[120px] bg-black border border-white/40 rounded-sm shadow-xl animate-in fade-in zoom-in duration-150">
            <h4 className="font-bold text-[11px] text-white uppercase tracking-widest text-center">
                {displayName}
            </h4>
        </div>
    );
}
