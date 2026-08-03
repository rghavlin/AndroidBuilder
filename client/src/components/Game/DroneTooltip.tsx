import React from 'react';

interface DroneTooltipProps {
    drone: {
        hp: number;
        maxHp: number;
        charges: number;
        maxCharges: number;
        isControlled?: boolean;
    };
}

/**
 * DroneTooltip - map tooltip for an airborne remote device.
 * Battery level is the reading that actually drives decisions: it's what
 * keeps the drone aloft (1/turn) and what pays for movement (0.5/tile), so
 * it doubles as the "how far can I still go" gauge.
 */
export function DroneTooltip({ drone }: DroneTooltipProps) {
    if (!drone) return null;

    const pct = drone.maxCharges > 0
        ? Math.max(0, Math.min(1, drone.charges / drone.maxCharges))
        : 0;
    const barColor = pct > 0.5 ? '#22c55e' : pct > 0.25 ? '#eab308' : '#ef4444';

    // At 1 charge/turn hovering plus 0.5/tile moving, remaining charges are
    // also the number of turns it can stay up if it holds position.
    const turnsAloft = Math.floor(drone.charges);

    return (
        <div className="p-3 min-w-[170px] bg-popover backdrop-blur-md border border-border rounded-lg shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="mb-2">
                <h4 className="font-bold text-sm text-popover-foreground letter-spacing-tight uppercase tracking-wider">
                    Recon Drone{drone.isControlled ? ' (Linked)' : ''}
                </h4>
            </div>

            {/* Battery Section */}
            <div className="flex justify-between text-[10px] font-medium mb-1">
                <span className="text-muted-foreground font-bold uppercase tracking-tighter">Battery</span>
                <span className="text-popover-foreground font-black">{drone.charges} / {drone.maxCharges}</span>
            </div>
            <div className="w-full h-1.5 bg-black/40 rounded-sm overflow-hidden mb-2">
                <div className="h-full rounded-sm" style={{ width: `${pct * 100}%`, backgroundColor: barColor }} />
            </div>

            {/* HP Section */}
            <div className="flex justify-between text-[10px] font-medium mb-1">
                <span className="text-muted-foreground font-bold uppercase tracking-tighter">HP</span>
                <span className="text-popover-foreground font-black">{drone.hp.toFixed(1)} / {drone.maxHp.toFixed(1)}</span>
            </div>

            <div className="text-[10px] text-muted-foreground italic mt-2 border-t border-border pt-1">
                {drone.charges > 0
                    ? `~${turnsAloft} turn${turnsAloft === 1 ? '' : 's'} aloft if it holds position`
                    : 'Out of power — landing'}
            </div>
        </div>
    );
}
