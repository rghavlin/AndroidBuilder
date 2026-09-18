import React from 'react';
import { cn } from "@/lib/utils";
import { ItemTrait, ItemCategory } from '@/game/inventory/traits';
import { ItemDefs } from '@/game/inventory/ItemDefs';
import { CombatResolver } from '@/game/systems/CombatResolver.js';
import { useOptionalPlayer } from '@/contexts/PlayerContext';

interface ItemTooltipProps {
    item: any;
}

// Distances (tiles) the ranged hit-chance table samples.
const HIT_TABLE_DISTANCES = [2, 5, 10, 15, 20];
// Search limit for the effective 100%-hit range; reaching it shows as "N+".
const MAX_RANGE_SEARCH = 60;

// Gun mods listed on the tooltip (ammo/magazine slots are deliberately excluded).
const SHOWN_MOD_CATEGORIES: string[] = [ItemCategory.SUPPRESSOR, ItemCategory.LASER_SIGHT, ItemCategory.RIFLE_SCOPE];

const pct = (chance: number) => `${Math.round(Math.max(0, Math.min(1, chance)) * 100)}%`;

export function ItemTooltip({ item }: ItemTooltipProps) {
    const playerStats = useOptionalPlayer()?.playerStats;
    if (!item) return null;

    const isTorch = item.defId === 'tool.torch' || item.id === 'tool.torch' || item.categories?.includes('torch');
    const isDegradable = item.traits?.includes('degradable') && !isTorch;
    const condition = isDegradable && item.condition !== null ? Math.round(item.condition) : null;

    // Combat stats
    const combat = item.combat || (item.defId && item.defId.startsWith('weapon.') ? item.combat : null);
    const rangedStats = item.rangedStats;

    // Mod slots this gun has, and what (if anything) is mounted in them.
    const modSlots: any[] = (item.attachmentSlots || [])
        .filter((slot: any) => slot.allowedCategories?.some((c: string) => SHOWN_MOD_CATEGORIES.includes(c)));
    const mountedMods: string[] = modSlots
        .map((slot: any) => item.attachments?.[slot.id])
        .filter((mod: any) => mod && mod.categories?.some((c: string) => SHOWN_MOD_CATEGORIES.includes(c)))
        .map((mod: any) => mod.name);

    // Real player hit chance, from the same formula the shot roll uses.
    let rangedAim: { skillLvl: number; fullRange: number; rows: { d: number; hit: number; crit: number }[] } | null = null;
    if (rangedStats) {
        const { hasScope, hasLaserSight } = CombatResolver.rangedSightFlags(item);
        const skillLvl = CombatResolver.playerRangedSkill(playerStats?.rangedLvl);
        const hitAt = (squaresAway: number) => CombatResolver.playerRangedHitChance({
            stats: rangedStats, skillLvl, squaresAway, hasScope, hasLaserSight,
            drunkenness: playerStats?.drunkenness || 0,
            currentAgility: playerStats?.currentAgility ?? 20,
            currentPerception: playerStats?.currentPerception ?? 20
        });
        let fullRange = 0;
        while (fullRange < MAX_RANGE_SEARCH && hitAt(fullRange + 1) >= 1) fullRange++;
        const rows = HIT_TABLE_DISTANCES
            .filter(d => !rangedStats.minRange || d >= rangedStats.minRange)
            .map(d => ({ d, hit: hitAt(d), crit: CombatResolver.critChanceFor(hitAt(d)) }));
        rangedAim = { skillLvl, fullRange, rows };
    }

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
                    {modSlots.length > 0 && (
                        <div className="flex justify-between gap-3">
                            <span className="text-muted-foreground">Attachments</span>
                            <span className={cn("text-right", mountedMods.length ? "text-foreground" : "text-muted-foreground italic")}>
                                {mountedMods.length ? mountedMods.join(', ') : 'none'}
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">100% hit range</span>
                        <span className="text-foreground">
                            {rangedAim!.fullRange === 0 ? 'none'
                                : `${rangedAim!.fullRange}${rangedAim!.fullRange >= MAX_RANGE_SEARCH ? '+' : ''} tiles`}
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
                    <div className="grid grid-cols-3 gap-x-3 pt-1">
                        <span className="text-muted-foreground">Range</span>
                        <span className="text-muted-foreground text-right">Hit</span>
                        <span className="text-muted-foreground text-right">Crit</span>
                        {rangedAim!.rows.map(({ d, hit, crit }) => (
                            <React.Fragment key={d}>
                                <span className="text-foreground">{d} tiles</span>
                                <span className="text-foreground text-right">{pct(hit)}</span>
                                <span className="text-foreground text-right">{pct(crit)}</span>
                            </React.Fragment>
                        ))}
                    </div>
                    <div className="text-muted-foreground italic">
                        With your Ranged skill ({rangedAim!.skillLvl}), before the target's dodge
                    </div>
                </div>
            )}

            {/* Ammo/Capacity/Water */}
            {(item.ammoCount > 0 || item.capacity > 0) && !item.hasTrait?.(ItemTrait.WATER_SOURCE) && !item.noTooltipUnits && (
                <div className="text-[10px] text-muted-foreground flex justify-between">
                    <span>
                        {item.hasTrait?.(ItemTrait.WATER_CONTAINER) ? 'Water' : 
                         (item.hasTrait?.(ItemTrait.FUEL_CONTAINER) ? 'Fuel' :
                         (item.hasTrait?.(ItemTrait.CHARGE_BASED) || item.hasTrait?.(ItemTrait.BATTERY) ? 'Charges' : (item.hasCategory?.(ItemCategory.AMMO) ? 'Count' : 'Ammo')))}
                    </span>
                    <span className="text-foreground">{item.ammoCount}{item.capacity ? ` / ${item.capacity}` : ''}</span>
                </div>
            )}

            {/* Consumable Effects */}
            {item.consumptionEffects && !item.hasTrait?.(ItemTrait.WATER_CONTAINER) && (
                <div className="border-t border-border pt-1.5 mt-1.5 space-y-1 text-[10px]">
                    {Object.entries(item.consumptionEffects as Record<string, any>)
                    .filter(([stat]) => stat !== 'treat_effects')
                    .map(([stat, value]) => ({ stat, value }))
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
