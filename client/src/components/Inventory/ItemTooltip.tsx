import React from 'react';
import { cn } from "@/lib/utils";

interface ItemTooltipProps {
    item: any;
}

export function ItemTooltip({ item }: ItemTooltipProps) {
    if (!item) return null;

    const isDegradable = item.traits?.includes('degradable');
    const condition = isDegradable && item.condition !== null ? Math.round(item.condition) : null;

    // Combat stats
    const combat = item.combat || (item.defId && item.defId.startsWith('weapon.') ? item.combat : null);
    const rangedStats = item.rangedStats;

    return (
        <div className="p-2 min-w-[150px] space-y-1.5">
            <div className="flex justify-between items-start gap-4">
                <h4 className="font-bold text-sm text-white leading-tight">
                    {item.name}
                    {item.waterQuality === 'dirty' && <span className="text-amber-600 ml-1">(Dirty water)</span>}
                </h4>
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
                        <span className="text-zinc-500">Damage</span>
                        <span className="text-zinc-200">
                            {rangedStats.damage.min === rangedStats.damage.max 
                                ? rangedStats.damage.min 
                                : `${rangedStats.damage.min}-${rangedStats.damage.max}`
                            }
                        </span>
                    </div>
                    {/* 100% hit range Info */}
                    <div className="flex justify-between">
                        <span className="text-zinc-500">100% hit range</span>
                        <span className="text-zinc-200">
                            {rangedStats.isShotgun 
                                ? (rangedStats.accuracyMaxRange || 5) 
                                : (item.attachments && Object.values(item.attachments).some((a: any) => a?.categories?.includes('rifle_scope')) ? 15 : 1)
                            } tiles
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-zinc-500">
                            {rangedStats.isShotgun ? "Damage Dropoff" : "Accuracy Falloff"}
                        </span>
                        <span className="text-zinc-200">
                            -{Math.round((rangedStats.isShotgun ? (rangedStats.damageFalloff || 0.1) : rangedStats.accuracyFalloff) * 100)}%/tile
                        </span>
                    </div>
                </div>
            )}

            {/* Ammo/Capacity */}
            {(item.ammoCount > 0 || item.capacity > 0) && !item.isWaterBottle?.() && (
                <div className="text-[10px] text-zinc-400 flex justify-between">
                    <span>{item.isChargeBased?.() ? 'Charges' : (item.isAmmo?.() ? 'Count' : 'Ammo')}</span>
                    <span>{item.ammoCount}{item.capacity ? ` / ${item.capacity}` : ''}</span>
                </div>
            )}

            {/* Consumable Effects */}
            {item.consumptionEffects && !item.isWaterBottle?.() && (
                <div className="border-t border-zinc-800 pt-1.5 mt-1.5 space-y-1 text-[10px]">
                    {(Array.isArray(item.consumptionEffects)
                        ? (item.consumptionEffects as any[]).map((e: any) => ({ stat: e.type || e.id, value: e.value }))
                        : Object.entries(item.consumptionEffects as Record<string, any>).map(([stat, value]) => ({ stat, value }))
                    ).map(({ stat, value }: { stat: string; value: any }) => (
                        <div key={stat} className="flex justify-between">
                            <span className="text-zinc-500 capitalize">{stat.replace(/_/g, ' ')}</span>
                            <span className="text-green-400 font-medium">
                                {typeof value === 'object' && value !== null && 'min' in value && 'max' in value
                                    ? `+${value.min}-${value.max}`
                                    : (typeof value === 'number' ? `+${value}` : String(value))}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Spoilage Info */}
            {item.traits?.includes('spoilable') && (
                <div className="border-t border-zinc-800 pt-1.5 mt-1.5 space-y-1 text-[10px]">
                    <div className="flex justify-between">
                        <span className="text-zinc-500">Spoils in</span>
                        <span className={cn(
                            "font-bold",
                            item.shelfLife <= 0 ? "text-red-500" : (item.shelfLife <= 12 ? "text-amber-500" : "text-zinc-200")
                        )}>
                            {item.shelfLife <= 0 ? 'SPOILED' : `${item.shelfLife}h`}
                        </span>
                    </div>
                </div>
            )}

            {/* Harvest Info */}
            {item.lifetimeTurns !== null && item.defId?.endsWith('_plant') && (
                <div className="border-t border-zinc-800 pt-1.5 mt-1.5 space-y-1 text-[10px]">
                    <div className="flex justify-between">
                        <span className="text-zinc-500">Ready in</span>
                        <span className="text-indigo-400 font-bold">
                            {item.lifetimeTurns}h
                        </span>
                    </div>
                </div>
            )}

        </div>
    );
}
