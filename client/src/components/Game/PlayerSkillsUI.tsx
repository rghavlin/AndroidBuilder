import React, { useMemo, useState, useEffect } from 'react';
import { usePlayer } from '@/contexts/PlayerContext';
import { useGame } from '@/contexts/GameContext';
import { Info, Crosshair, Sparkles, Hammer, Dumbbell, Wind, Eye, Heart, Dices, AlertTriangle, Shield, Swords, BookOpen } from 'lucide-react';
import { cn } from "@/lib/utils";
import { imageLoader } from '@/game/utils/ImageLoader';
import { CombatResolver } from '@/game/systems/CombatResolver';
import { AttributeProgressionManager } from '@/game/systems/AttributeProgressionManager';
import { PlayerSkills } from '@/game/components/PlayerSkills';
import { previewDerivedStats, TREATMENT_EFFECTS } from '@/game/utils/SurvivalCascade';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";


interface SkillProgressBarProps {
    current: number;
    next: number;
    prev: number;
    color?: string;
}

const SkillProgressBar = ({ current, next, prev, color = "bg-primary" }: SkillProgressBarProps) => {
    const progress = useMemo(() => {
        const totalNeeded = next - prev;
        const earned = current - prev;
        return Math.min(100, Math.max(0, (earned / totalNeeded) * 100));
    }, [current, next, prev]);

    return (
        <div className="w-full h-1 bg-[var(--track)] rounded-full overflow-hidden mt-1 border border-[var(--hairline)]">
            <div
                className={cn("h-full transition-all duration-500 ease-out", color)}
                style={{ width: `${progress}%` }}
            />
        </div>
    );
};

interface CompactSkillRowProps {
    title: string;
    level: number;
    progressLabel: string;
    current: number;
    next: number;
    prev: number;
    metrics: { icon: React.ReactNode; label: string; value: string; color: string }[];
}

// Condensed skill row: title/level, metric value on the top line, with a thin green progress bar underneath
const CompactSkillRow = ({ title, level, progressLabel, current, next, prev, metrics }: CompactSkillRowProps) => {
    return (
        <div className="bg-card/35 p-2 rounded-lg border border-border/40 hover:border-primary/20 transition-all duration-300 hover:bg-card/50 skill-row">
            {/* Top row: Title/LVL and metrics */}
            <div className="flex justify-between items-center mb-1 gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[9.5px] font-black text-foreground truncate uppercase tracking-wider">{title}</span>
                    <span className="text-[7.5px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-mono font-bold border border-primary/20 shrink-0 lvl-pill">
                        LVL {level}
                    </span>
                </div>
                
                <div className="flex items-center gap-2.5 shrink-0">
                    {metrics.map((m, i) => (
                        <div key={i} className="flex items-center gap-1">
                            {m.icon}
                            <span className={cn("text-[9px] font-extrabold", m.color)}>{m.value}</span>
                            <span className="text-[7.5px] text-muted-foreground uppercase tracking-tight">{m.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom row: progress bar */}
            <SkillProgressBar
                current={current}
                next={next}
                prev={prev}
                color="bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.3)]"
            />
        </div>
    );
};

interface AttributeCardProps {
    name: string;
    current: number;
    base: number;
    effects: string[];
    totalXP: number;
    spentXP: number;
    requiredXP: number;
    onRoll: () => void;
}

// Vertical Card for horizontal attributes: Name, Value, and XP progress bar with inline Upgrade roll button. Hovering displays derived effects inside an opaque tooltip.
const AttributeCard = ({ name, current, base, effects, totalXP, spentXP, requiredXP, onRoll }: AttributeCardProps) => {
    const isDebuffed = current < base;
    const isBuffed = current > base;
    const progressXP = totalXP - spentXP;
    const progress = Math.min(100, Math.max(0, (progressXP / requiredXP) * 100));
    const isRollReady = progressXP >= requiredXP;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="flex-1 min-w-[110px] bg-card/35 p-3 rounded-xl border border-border/40 hover:border-primary/40 transition-all duration-300 flex flex-col justify-between items-center text-center relative group hover:bg-card/50 attr-card">
                    
                    {/* Top: Name */}
                    <div className="flex flex-col items-center gap-1 w-full shrink-0 select-none">
                        <span className="text-[10px] font-black text-foreground/85 uppercase tracking-widest leading-none mt-1">{name}</span>
                    </div>

                    {/* Middle: Large Value & Base */}
                    <div className="my-2.5 flex flex-col items-center justify-center select-none">
                        <span className={cn(
                            "text-3xl font-black tabular-nums tracking-tighter leading-none attr-value",
                            isBuffed ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]" :
                            isDebuffed ? "text-red-400" : "text-foreground"
                        )}>
                            {Math.round(current)}
                        </span>
                        {(isBuffed || isDebuffed) && (
                            <span className={cn(
                                "text-[7.5px] font-mono font-extrabold uppercase leading-none mt-1 bg-secondary/50 px-1 py-0.5 rounded border border-[var(--hairline)]",
                                isBuffed ? "text-emerald-400/80" : "text-red-400/80"
                            )}>
                                Base {base}
                            </span>
                        )}
                    </div>

                    {/* Bottom: XP Bar & Upgrade Roll Button (Inline) */}
                    <div className="w-full mt-auto pt-2 border-t border-[var(--hairline)]/30 shrink-0 flex items-center gap-2 select-none">
                        {/* XP Progress bar */}
                        <div className="flex-1 space-y-1">
                            <div className="w-full h-1 bg-[var(--track)] rounded-full overflow-hidden border border-[var(--hairline)]">
                                <div
                                    className={cn("h-full transition-all duration-500 ease-out", 
                                        isRollReady ? "bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.4)] animate-pulse" : "bg-primary"
                                    )}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[6.5px] text-muted-foreground/75 font-mono font-bold tracking-tighter leading-none">
                                <span>XP</span>
                                <span>{Math.round(progressXP)}/{Math.round(requiredXP)}</span>
                            </div>
                        </div>

                        {/* Inline Upgrade Roll Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onRoll();
                            }}
                            disabled={!isRollReady}
                            className={cn(
                                "w-6 h-6 shrink-0 rounded flex items-center justify-center border transition-all duration-300",
                                isRollReady 
                                    ? "bg-emerald-500/25 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/35 hover:text-emerald-300 cursor-pointer animate-bounce" 
                                    : "bg-secondary/20 border-[var(--hairline)] text-muted-foreground/30 opacity-40 cursor-not-allowed"
                            )}
                            title={isRollReady ? "Click to upgrade attribute!" : `Progress to upgrade: ${Math.round(progressXP)}/${Math.round(requiredXP)} XP`}
                        >
                            <Dices className={cn("w-3 h-3", isRollReady ? "animate-bounce" : "")} />
                        </button>
                    </div>

                </div>
            </TooltipTrigger>
            
            <TooltipContent side="bottom" align="center" className="bg-popover border border-border text-foreground p-2 rounded-lg shadow-xl max-w-[220px] select-none">
                <div className="space-y-1">
                    <div className="text-[10px] font-black text-foreground uppercase tracking-widest border-b border-border/40 pb-1 mb-1 flex items-center gap-1.5">
                        <span>{name} Bonuses</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                        {effects.map((line, i) => (
                            <div key={i} className="text-[9px] leading-tight text-muted-foreground font-medium flex items-center gap-1">
                                <span className="text-primary font-mono text-[7px] select-none">•</span>
                                <span>{line}</span>
                            </div>
                        ))}
                    </div>
                    <div className="text-[7.5px] text-muted-foreground/60 font-mono mt-1 pt-1 border-t border-border/30">
                        Total XP earned: {Math.round(totalXP)}
                    </div>
                </div>
            </TooltipContent>
        </Tooltip>
    );
};


export default function PlayerSkillsUI() {
    const { player, playerStats } = usePlayer();
    const { openJournalAndCloseSkills } = useGame();
    const [playerIcon, setPlayerIcon] = useState<string | null>(null);

    useEffect(() => {
        const loadIcon = async () => {
            const img = await imageLoader.getImage('player');
            if (img) setPlayerIcon(img.src);
        };
        loadIcon();
    }, []);

    const combatSkills = useMemo(() => {
        const meleeLvl = (playerStats.meleeLvl !== undefined ? playerStats.meleeLvl : 0);
        const meleeHits = playerStats.meleeHits || 0;
        const meleeNext = PlayerSkills.getNextHitMilestone(meleeLvl);
        const meleePrev = meleeLvl === 0 ? 0 : PlayerSkills.getNextHitMilestone(meleeLvl - 1);

        const rangedLvl = (playerStats.rangedLvl !== undefined ? playerStats.rangedLvl : 0);
        const rangedHits = playerStats.rangedHits || 0;
        const rangedNext = PlayerSkills.getNextHitMilestone(rangedLvl);
        const rangedPrev = rangedLvl === 0 ? 0 : PlayerSkills.getNextHitMilestone(rangedLvl - 1);

        const defenseLvl = (playerStats.defenseLvl !== undefined ? playerStats.defenseLvl : 0);
        const defenseHits = playerStats.defenseHits || 0;
        const defenseNext = PlayerSkills.getNextHitMilestone(defenseLvl);
        const defensePrev = defenseLvl === 0 ? 0 : PlayerSkills.getNextHitMilestone(defenseLvl - 1);

        return {
            melee: {
                level: meleeLvl,
                hits: meleeHits,
                next: meleeNext,
                prev: meleePrev,
                acc: meleeLvl
            },
            ranged: {
                level: rangedLvl,
                hits: rangedHits,
                next: rangedNext,
                prev: rangedPrev,
                acc: rangedLvl
            },
            defense: {
                level: defenseLvl,
                hits: defenseHits,
                next: defenseNext,
                prev: defensePrev,
                acc: defenseLvl
            }
        };
    }, [playerStats]);

    const craftingSkills = useMemo(() => {
        const craftingLvl = (playerStats.craftingLvl !== undefined ? playerStats.craftingLvl : 0);
        const craftingApUsed = playerStats.craftingApUsed || 0;
        const next = 10 * Math.pow(2, craftingLvl);
        const prev = craftingLvl === 0 ? 0 : 10 * Math.pow(2, craftingLvl - 1);

        return {
            level: craftingLvl,
            craftingApUsed,
            next,
            prev,
            apBonus: craftingLvl
        };
    }, [playerStats]);

    const attributes = useMemo(() => {
        const currentStrength = playerStats.currentStrength ?? 20;
        const baseStrength = playerStats.baseStrength ?? currentStrength;
        const currentAgility = playerStats.currentAgility ?? 20;
        const baseAgility = playerStats.baseAgility ?? currentAgility;
        const currentPerception = playerStats.currentPerception ?? 20;
        const basePerception = playerStats.basePerception ?? currentPerception;
        const currentConstitution = playerStats.currentConstitution ?? 20;
        const baseConstitution = playerStats.baseConstitution ?? currentConstitution;

        const meleeDamageBonus = Math.round(CombatResolver.strengthDamageBonus(currentStrength));
        const armorPenalty = CombatResolver.armorWeightPenalty(currentStrength, playerStats.armorWeightRequirement || 0);
        const wagonPullBonus = Math.floor(currentStrength / 20);
        const defenseChance = Math.round(CombatResolver.totalDefenseChance({
            defenseLvl: playerStats.defenseLvl || 0,
            currentAgility,
            currentPerception,
            currentStrength,
            weightRequirement: playerStats.armorWeightRequirement || 0
        }) * 100);
        const meleeAimBonus = Math.round(CombatResolver.meleeAimBonus(currentStrength, currentAgility) * 100);
        const rangedAimBonus = Math.round(CombatResolver.perceptionAimBonus(currentAgility, currentPerception) * 100);
        const sightRangeBonus = Math.floor(currentPerception / 20);
        const derivedFallback = previewDerivedStats({
            constitution: currentConstitution,
            agility: currentAgility,
            perception: currentPerception
        });
        const maxHp = playerStats.maxHp ?? derivedFallback.maxHp;
        const sickResistPct = Math.round(CombatResolver.sicknessResistFraction(currentConstitution) * 100);

        const reqStrXP = AttributeProgressionManager.getRequiredXP(baseStrength);
        const reqAgiXP = AttributeProgressionManager.getRequiredXP(baseAgility);
        const reqPerXP = AttributeProgressionManager.getRequiredXP(basePerception);
        const reqConXP = AttributeProgressionManager.getRequiredXP(baseConstitution);

        const isInfected = playerStats.isInfected;
        const isTreated = isInfected && (playerStats.treatmentTicksRemaining > 0);
        const treatmentSubtype = playerStats.treatmentSubtype?.toLowerCase();

        const getInfectionEffects = (statName: string) => {
            const lines = [];
            const attr = statName.toLowerCase();
            if (isInfected && !isTreated) {
                lines.push("Infection: -10% to attributes");
            } else if (isTreated && playerStats.treatmentEffects) {
                // Brainstem stew: precomputed combined buffs.
                const effect = playerStats.treatmentEffects[attr];
                if (effect) {
                    const pct = Math.round(((effect.multiplier ?? 1) - 1) * 100);
                    const parts = [];
                    if (pct > 0) parts.push(`+${pct}%`);
                    if (effect.immune) parts.push('Decay Immune');
                    if (parts.length) lines.push(`Brainstem Stew: ${parts.join(' & ')}`);
                }
            } else if (isTreated && treatmentSubtype) {
                const sub = treatmentSubtype.toLowerCase();
                const config = TREATMENT_EFFECTS[sub];
                const effect = config?.effects?.[attr];
                if (effect) {
                    if (sub === 'mutant') {
                        lines.push("Mutant Treatment: +20% & Decay Immune");
                    } else {
                        lines.push(`${config.label}: ${effect.label}`);
                    }
                }
            }
            return lines;
        };

        const formatBonus = (val: number) => (val >= 0 ? `+${val}%` : `${val}%`);

        const combatModifiers = [
            { label: 'Melee Hit', value: formatBonus(meleeAimBonus), attrs: 'Strength + Agility' },
            { label: 'Ranged Hit', value: formatBonus(rangedAimBonus), attrs: 'Agility + Perception' },
            { label: 'Defense', value: `~${defenseChance}%`, attrs: 'Agility + Perception + Defense skill' }
        ];

        return {
            strength: { current: currentStrength, base: baseStrength, meleeDamageBonus, armorPenalty, wagonPullBonus, totalXP: playerStats.strengthXP || 0, spentXP: playerStats.strengthXpSpent || 0, requiredXP: reqStrXP, infectionEffects: getInfectionEffects('Strength') },
            agility: { current: currentAgility, base: baseAgility, armorPenalty, totalXP: playerStats.agilityXP || 0, spentXP: playerStats.agilityXpSpent || 0, requiredXP: reqAgiXP, infectionEffects: getInfectionEffects('Agility') },
            perception: { current: currentPerception, base: basePerception, sightRangeBonus, totalXP: playerStats.perceptionXP || 0, spentXP: playerStats.perceptionXpSpent || 0, requiredXP: reqPerXP, infectionEffects: getInfectionEffects('Perception') },
            constitution: { current: currentConstitution, base: baseConstitution, maxHp, sickResistPct, totalXP: playerStats.constitutionXP || 0, spentXP: playerStats.constitutionXpSpent || 0, requiredXP: reqConXP, infectionEffects: getInfectionEffects('Constitution') },
            combatModifiers
        };
    }, [playerStats]);

    return (
        <TooltipProvider delayDuration={150}>
            <div className="flex flex-col h-full bg-background/40 rounded-lg overflow-hidden border border-border/50 backdrop-blur-sm abilities-window">
                {/* Header */}
                <div className="p-2 px-3 border-b border-border bg-card/30 flex items-center justify-between gap-2.5 shrink-0 select-none abilities-header">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
                            {playerIcon ? (
                                <img src={playerIcon} alt="Player" className="w-full h-full object-cover" />
                            ) : (
                                <Info className="w-4 h-4 text-primary" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">Character Abilities</h2>
                        </div>
                        {playerStats?.isInfected && (
                            <div className="ml-2 px-2 py-0.5 rounded bg-red-950/80 border border-red-500/50 flex items-center gap-1 select-none animate-pulse">
                                <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
                                <span className="text-[9px] font-mono font-black text-red-400 uppercase tracking-wider">
                                    Infected
                                </span>
                            </div>
                        )}
                        <button
                            onClick={openJournalAndCloseSkills}
                            className="ml-3 px-2 py-0.5 rounded bg-primary/10 border border-primary/20 hover:bg-primary/20 flex items-center gap-1.5 transition-colors font-mono text-[9px] font-bold text-primary uppercase tracking-wider cursor-pointer journal-btn"
                        >
                            <BookOpen className="w-3 h-3 text-primary" />
                            Journal
                        </button>
                    </div>

                    {/* Name Label */}
                    <div className="px-2.5 py-1 rounded bg-secondary/40 border border-primary/20 flex items-center max-w-[180px] overflow-hidden shrink-0 char-name-label">
                        <span className="text-xs font-mono font-bold text-primary tracking-wide truncate" title={player?.name || 'Nameless'}>
                            {player?.name || 'Nameless'}
                        </span>
                    </div>
                </div>

                {/* Main non-scrollable dashboard layout */}
                <div className="flex-1 p-3 flex flex-col gap-3 h-full overflow-hidden select-none">
                    
                    {/* Top Row: Horizontal Attributes Grid */}
                    <div className="grid grid-cols-4 gap-2.5 shrink-0">
                        <AttributeCard
                            name="Strength"
                            current={attributes.strength.current}
                            base={attributes.strength.base}
                            effects={[
                                `Melee damage +${attributes.strength.meleeDamageBonus}`,
                                `Wagon-pull AP bonus: +${attributes.strength.wagonPullBonus} AP`,
                                ...attributes.strength.infectionEffects
                            ]}
                            totalXP={attributes.strength.totalXP}
                            spentXP={attributes.strength.spentXP}
                            requiredXP={attributes.strength.requiredXP}
                            onRoll={() => AttributeProgressionManager.rollAttribute(player, 'strength')}
                        />

                        <AttributeCard
                            name="Agility"
                            current={attributes.agility.current}
                            base={attributes.agility.base}
                            effects={[
                                ...(attributes.agility.armorPenalty > 0
                                    ? [`Armor agility penalty: -${attributes.agility.armorPenalty}`]
                                    : []),
                                ...attributes.agility.infectionEffects
                            ]}
                            totalXP={attributes.agility.totalXP}
                            spentXP={attributes.agility.spentXP}
                            requiredXP={attributes.agility.requiredXP}
                            onRoll={() => AttributeProgressionManager.rollAttribute(player, 'agility')}
                        />

                        <AttributeCard
                            name="Perception"
                            current={attributes.perception.current}
                            base={attributes.perception.base}
                            effects={[
                                `Sight range bonus: +${attributes.perception.sightRangeBonus}`,
                                ...attributes.perception.infectionEffects
                            ]}
                            totalXP={attributes.perception.totalXP}
                            spentXP={attributes.perception.spentXP}
                            requiredXP={attributes.perception.requiredXP}
                            onRoll={() => AttributeProgressionManager.rollAttribute(player, 'perception')}
                        />

                        <AttributeCard
                            name="Constitution"
                            current={attributes.constitution.current}
                            base={attributes.constitution.base}
                            effects={[
                                `Max HP ${attributes.constitution.maxHp}`,
                                `Sickness resist −${attributes.constitution.sickResistPct}%`,
                                ...attributes.constitution.infectionEffects
                            ]}
                            totalXP={attributes.constitution.totalXP}
                            spentXP={attributes.constitution.spentXP}
                            requiredXP={attributes.constitution.requiredXP}
                            onRoll={() => AttributeProgressionManager.rollAttribute(player, 'constitution')}
                        />
                    </div>

                    {/* Bottom Row: Skills & Modifiers side-by-side */}
                    <div className="flex-1 flex gap-3 min-h-0">
                        
                        {/* Skills column */}
                        <div className="flex-1 flex flex-col bg-card/25 border border-border/30 rounded-xl p-3 min-h-0 abilities-section">
                            <div className="flex items-center gap-2 pb-2 mb-2 border-b border-border/30 shrink-0">
                                <Dumbbell className="w-3.5 h-3.5 text-primary" />
                                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Skills</h3>
                            </div>

                            <div className="flex-1 flex flex-col justify-between gap-2 min-h-0">
                                <CompactSkillRow
                                    title="Melee Combat"
                                    level={combatSkills.melee.level}
                                    progressLabel="Hits"
                                    current={combatSkills.melee.hits}
                                    next={combatSkills.melee.next}
                                    prev={combatSkills.melee.prev}
                                    metrics={[
                                        { icon: <Crosshair className="w-2.5 h-2.5 text-green-500" />, label: 'Accuracy', value: `+${combatSkills.melee.acc}%`, color: 'text-green-500/90' }
                                    ]}
                                />

                                <CompactSkillRow
                                    title="Ranged Combat"
                                    level={combatSkills.ranged.level}
                                    progressLabel="Hits"
                                    current={combatSkills.ranged.hits}
                                    next={combatSkills.ranged.next}
                                    prev={combatSkills.ranged.prev}
                                    metrics={[
                                        { icon: <Crosshair className="w-2.5 h-2.5 text-green-500" />, label: 'Accuracy', value: `+${combatSkills.ranged.acc}%`, color: 'text-green-500/90' }
                                    ]}
                                />

                                <CompactSkillRow
                                    title="Defense"
                                    level={combatSkills.defense.level}
                                    progressLabel="Hits"
                                    current={combatSkills.defense.hits}
                                    next={combatSkills.defense.next}
                                    prev={combatSkills.defense.prev}
                                    metrics={[
                                        { icon: <Shield className="w-2.5 h-2.5 text-green-500" />, label: 'Bonus', value: `+${combatSkills.defense.acc}%`, color: 'text-green-500/90' }
                                    ]}
                                />

                                <CompactSkillRow
                                    title="Crafting"
                                    level={craftingSkills.level}
                                    progressLabel="AP Used"
                                    current={craftingSkills.craftingApUsed}
                                    next={craftingSkills.next}
                                    prev={craftingSkills.prev}
                                    metrics={[
                                        { icon: <Hammer className="w-2.5 h-2.5 text-green-500" />, label: 'AP Bonus', value: `-${craftingSkills.apBonus}`, color: 'text-green-500/90' }
                                    ]}
                                />
                            </div>
                        </div>

                        {/* Combat Modifiers column */}
                        <div className="flex-1 flex flex-col bg-card/25 border border-border/30 rounded-xl p-3 min-h-0 abilities-section">
                            <div className="flex items-center gap-2 pb-2 mb-2 border-b border-border/30 shrink-0">
                                <Swords className="w-3.5 h-3.5 text-amber-400" />
                                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Combat Modifiers</h3>
                            </div>
                            <div className="flex-1 flex flex-col justify-between gap-2 min-h-0">
                                {attributes.combatModifiers.map((mod, i) => (
                                    <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-border/40 bg-card/35 hover:bg-card/50 transition-colors gap-2 flex-1 skill-row">
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[9.5px] font-black text-foreground uppercase tracking-wide truncate">{mod.label}</span>
                                            <span className="text-[7.5px] text-muted-foreground font-mono truncate leading-none">{mod.attrs}</span>
                                        </div>
                                        <span className="text-xs font-mono font-black text-amber-400 tabular-nums shrink-0">{mod.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                </div>

            </div>
        </TooltipProvider>
    );
}

