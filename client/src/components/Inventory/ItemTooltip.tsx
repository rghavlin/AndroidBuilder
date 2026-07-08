import React from 'react';
import { cn } from "@/lib/utils";
import { ItemTrait } from '@/game/inventory/traits';
import { ItemDefs } from '@/game/inventory/ItemDefs';

interface ItemTooltipProps {
    item: any;
}

export function ItemTooltip({ item }: ItemTooltipProps) {
    if (!item) return null;

    const isTorch = item.defId === 'tool.torch' || item.id === 'tool.torch' || item.categories?.includes('torch');
    const isDegradable = item.traits?.includes('degradable') && !isTorch;
    const condition = isDegradable && item.condition !== null ? Math.round(item.condition) : null;

    // Combat stats
    const combat = item.combat || (item.defId && item.defId.startsWith('weapon.') ? item.combat : null);
    const rangedStats = item.rangedStats;

    let displayName = item.name;
    if (item.defId === 'zombie.corpse') {
        const hasSpecialColor = !!item.backgroundColor;
        const hasSpecialImage = !!item.imageId && item.imageId !== 'zombiecorpse';
        if (!hasSpecialColor && !hasSpecialImage) {
            displayName = 'Zombie Corpse';
        }
        const earbucksVal = item.earbucksValue !== undefined ? item.earbucksValue : 1;
        if (earbucksVal > 0) {
            displayName += ' (earbuck)';
        }
    }

    return (
        <div className="p-2 min-w-[150px] space-y-1.5">
            <div className="flex justify-between items-start gap-4">
                <h4 className="font-bold text-sm text-foreground leading-tight">
                    {displayName}
                    {item.waterQuality === 'dirty' && item.ammoCount > 0 && <span className="text-amber-600 ml-1">(Dirty water)</span>}
                </h4>
            </div>

            {/* Condition Bar */}
            {isDegradable && (
                <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Condition</span>
                        <span className={cn(
                             condition! > 50 ? "text-green-500" : (condition! > 20 ? "text-yellow-500" : "text-red-500")
                        )}>
                            {condition}%
                        </span>
                    </div>
                    <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
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
                <div className="border-t border-border pt-1.5 mt-1.5 space-y-1 text-[10px]">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Damage</span>
                        <span className="text-foreground">{combat.damage.min}-{combat.damage.max}</span>
                    </div>
                    {combat.range && combat.range > 1.5 && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Extended range</span>
                            <span className="text-foreground">Yes</span>
                        </div>
                    )}
                </div>
            )}

            {/* Ranged Stats */}
            {rangedStats && (
                <div className="border-t border-border pt-1.5 mt-1.5 space-y-1 text-[10px]">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Damage</span>
                        <span className="text-foreground">
                            {rangedStats.damage.min === rangedStats.damage.max 
                                ? rangedStats.damage.min 
                                : `${rangedStats.damage.min}-${rangedStats.damage.max}`
                            }
                        </span>
                    </div>
                    {/* 100% hit range Info */}
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">100% hit range</span>
                        <span className="text-foreground">
                            {rangedStats.isShotgun 
                                ? (rangedStats.accuracyMaxRange || 5) 
                                : (item.attachments && Object.values(item.attachments).some((a: any) => a?.categories?.includes('rifle_scope')) 
                                    ? 15 
                                    : (item.attachments && Object.values(item.attachments).some((a: any) => a?.categories?.includes('laser_sight')) ? 10 : 1)
                                  )
                            } tiles
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">
                            {rangedStats.isShotgun ? "Damage Dropoff" : "Accuracy Falloff"}
                        </span>
                        <span className="text-foreground">
                            -{Math.round((rangedStats.isShotgun ? (rangedStats.damageFalloff || 0.1) : rangedStats.accuracyFalloff) * 100)}%/tile
                        </span>
                    </div>
                </div>
            )}

            {/* Ammo/Capacity/Water */}
            {(item.ammoCount > 0 || item.capacity > 0) && !item.hasTrait?.(ItemTrait.WATER_SOURCE) && !item.noTooltipUnits && (
                <div className="text-[10px] text-muted-foreground flex justify-between">
                    <span>
                        {item.hasTrait?.(ItemTrait.WATER_CONTAINER) ? 'Water' : 
                         (item.hasTrait?.(ItemTrait.FUEL_CONTAINER) ? 'Fuel' :
                         (item.hasTrait?.(ItemTrait.CHARGE_BASED) ? 'Charges' : (item.hasTrait?.(ItemTrait.AMMO) ? 'Count' : 'Ammo')))}
                    </span>
                    <span className="text-foreground">{item.ammoCount}{item.capacity ? ` / ${item.capacity}` : ''}</span>
                </div>
            )}

            {/* Consumable Effects */}
            {item.consumptionEffects && !item.hasTrait?.(ItemTrait.WATER_CONTAINER) && (
                <div className="border-t border-border pt-1.5 mt-1.5 space-y-1 text-[10px]">
                    {Object.entries(item.consumptionEffects as Record<string, any>).map(([stat, value]) => ({ stat, value }))
                    .map(({ stat, value }: { stat: string; value: any }) => (
                        <div key={stat} className="flex justify-between">
                            <span className="text-muted-foreground capitalize">{stat.replace(/_/g, ' ')}</span>
                            <span className={cn(
                                "font-medium",
                                (typeof value === 'number' && value < 0) || (typeof value === 'object' && value !== null && 'min' in value && value.min < 0) ? "text-orange-500" : "text-green-500"
                            )}>
                                {typeof value === 'object' && value !== null && 'min' in value && 'max' in value
                                    ? (value.min >= 0 ? `+${value.min}-${value.max}` : `${value.min}-${value.max}`)
                                    : (value === true ? 'Yes' : (typeof value === 'number' ? (value >= 0 ? `+${value}` : `${value}`) : String(value)))}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Spoilage Info */}
            {item.traits?.includes('spoilable') && (
                <div className="border-t border-border pt-1.5 mt-1.5 space-y-1 text-[10px]">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Spoils in</span>
                        <span className={cn(
                            "font-bold",
                            item.shelfLife <= 0 ? "text-red-500" : (item.shelfLife <= 12 ? "text-amber-500" : "text-foreground")
                        )}>
                            {item.shelfLife <= 0 ? 'SPOILED' : `${item.shelfLife}h`}
                        </span>
                    </div>
                </div>
            )}

            {/* Harvest Info */}
            {item.lifetimeTurns !== null && item.defId?.endsWith('_plant') && (
                <div className="border-t border-border pt-1.5 mt-1.5 space-y-1 text-[10px]">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Ready in</span>
                        <span className="text-indigo-400 font-bold">
                            {item.lifetimeTurns}h
                        </span>
                    </div>
                </div>
            )}
            {/* Armor Info */}
            {(() => {
                const armorDef = item.armor || (item.defId && ItemDefs[item.defId]?.armor);
                if (!armorDef) return null;
                return (
                    <div className="border-t border-border pt-1.5 mt-1.5 space-y-1 text-[10px]">
                        {armorDef.maxAbsorption !== undefined && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Armor Protection</span>
                                <span className="text-foreground">+{armorDef.maxAbsorption}</span>
                            </div>
                        )}
                        {armorDef.weightRequirement !== undefined && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Recommended Strength</span>
                                <span className="text-foreground">{armorDef.weightRequirement}</span>
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* Description */}
            {item.description && item.defId !== 'food.stew' && (
                <div className="border-t border-border pt-1.5 mt-1.5 text-[10px] text-muted-foreground italic max-w-[200px] break-words whitespace-normal">
                    {item.description}
                </div>
            )}

        </div>
    );
}
