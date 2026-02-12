import React from 'react';
import { cn } from "@/lib/utils";

interface ItemTooltipProps {
    item: any;
}

export function ItemTooltip({ item }: ItemTooltipProps) {
    if (!item) return null;

    const isDegradable = item.traits?.includes('degradable') || item.condition !== null;
    const condition = item.condition !== null ? Math.round(item.condition) : null;

    // Combat stats
    const combat = item.combat || (item.defId && item.defId.startsWith('weapon.') ? item.combat : null);
    const rangedStats = item.rangedStats;

    return (
        <div className="p-2 min-w-[150px] space-y-1.5">
            <div className="flex justify-between items-start gap-4">
                <h4 className="font-bold text-sm text-white leading-tight">{item.name}</h4>
                {item.rarity && (
                    <span className={cn(
                        "text-[10px] uppercase font-bold px-1 rounded",
                        item.rarity === 'common' && "bg-zinc-500 text-white",
                        item.rarity === 'uncommon' && "bg-green-600 text-white",
                        item.rarity === 'rare' && "bg-blue-600 text-white",
                        item.rarity === 'extremely_rare' && "bg-purple-600 text-white",
                    )}>
                        {item.rarity}
                    </span>
                )}
            </div>

            {/* Condition Bar */}
            {isDegradable && (
                <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-zinc-400">
                        <span>Condition</span>
                        <span className={cn(
                            condition! > 50 ? "text-green-400" : (condition! > 20 ? "text-yellow-400" : "text-red-400")
                        )}>
                            {condition}%
                        </span>
                    </div>
                    <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full transition-all duration-300",
                                condition! > 50 ? "bg-green-500" : (condition! > 20 ? "bg-yellow-500" : "bg-red-500")
                            )}
                            style={{ width: `${condition}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Combat Stats */}
            {combat && (
                <div className="border-t border-zinc-800 pt-1.5 mt-1.5 space-y-1 text-[10px]">
                    <div className="flex justify-between">
                        <span className="text-zinc-500">Damage</span>
                        <span className="text-zinc-200">{combat.damage.min}-{combat.damage.max}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-zinc-500">Hit Chance</span>
                        <span className="text-zinc-200">{Math.round(combat.hitChance * 100)}%</span>
                    </div>
                </div>
            )}

            {/* Ranged Stats */}
            {rangedStats && (
                <div className="border-t border-zinc-800 pt-1.5 mt-1.5 space-y-1 text-[10px]">
                    <div className="flex justify-between">
                        <span className="text-zinc-500">Dmg</span>
                        <span className="text-zinc-200">{rangedStats.damage.min}-{rangedStats.damage.max}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-zinc-500">Accuracy Falloff</span>
                        <span className="text-zinc-200">-{Math.round(rangedStats.accuracyFalloff * 100)}%/tile</span>
                    </div>
                </div>
            )}

            {/* Ammo/Capacity */}
            {(item.ammoCount > 0 || item.capacity > 0) && !item.isWaterBottle?.() && (
                <div className="text-[10px] text-zinc-400 flex justify-between">
                    <span>{item.isAmmo?.() ? 'Count' : 'Ammo'}</span>
                    <span>{item.ammoCount}{item.capacity ? ` / ${item.capacity}` : ''}</span>
                </div>
            )}
        </div>
    );
}
