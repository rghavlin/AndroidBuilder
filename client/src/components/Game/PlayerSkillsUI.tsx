import React, { useMemo, useState, useEffect } from 'react';
import { usePlayer } from '@/contexts/PlayerContext';
import { Info, Crosshair, Sparkles, Hammer, Dumbbell, Wind, Eye, Heart, Dices } from 'lucide-react';
import { cn } from "@/lib/utils";
import { imageLoader } from '@/game/utils/ImageLoader';
import { CombatResolver } from '@/game/systems/CombatResolver';
import { AttributeProgressionManager } from '@/game/systems/AttributeProgressionManager';

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
        <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mt-1 border border-white/5">
            <div
                className={cn("h-full transition-all duration-500 ease-out", color)}
                style={{ width: `${progress}%` }}
            />
        </div>
    );
};

interface CompactSkillCardProps {
    title: string;
    level: number;
    progressLabel: string;
    current: number;
    next: number;
    prev: number;
    metrics: { icon: React.ReactNode; label: string; value: string; color: string }[];
}

// Condensed skill card: title/level on one line, progress bar with inline
// count, then metrics packed into a single row beneath — about half the
// vertical footprint of the old card so several can stack in a narrow column.
const CompactSkillCard = ({ title, level, progressLabel, current, next, prev, metrics }: CompactSkillCardProps) => {
    return (
        <div className="bg-card/40 p-2.5 rounded-lg border border-border/40 hover:border-primary/30 transition-colors">
            <div className="flex justify-between items-center mb-1.5">
                <span className="text-[11px] font-bold text-foreground">{title}</span>
                <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-mono border border-primary/20">
                    LVL {level}
                </span>
            </div>

            <div className="flex justify-between items-end">
                <span className="text-[7px] text-muted-foreground uppercase tracking-tight">{progressLabel}</span>
                <span className="text-[8px] font-mono text-foreground/80">
                    {current} <span className="text-muted-foreground">/</span> {next}
                </span>
            </div>
            <SkillProgressBar
                current={current}
                next={next}
                prev={prev}
                color="bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
            />

            <div className={cn("flex gap-3 mt-2 pt-1.5 border-t border-white/5", metrics.length > 1 ? "justify-between" : "")}>
                {metrics.map((m, i) => (
                    <div key={i} className="flex items-center gap-1">
                        {m.icon}
                        <span className={cn("text-[9px] font-bold", m.color)}>{m.value}</span>
                        <span className="text-[7px] text-muted-foreground uppercase">{m.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

interface StatCardProps {
    icon: React.ReactNode;
    name: string;
    current: number;
    base: number;
    accentColor: string;
    effects: string[];
    totalXP: number;
    spentXP: number;
    requiredXP: number;
    onRoll: () => void;
}

// Roomy attribute card — deliberately more generous than the skill cards, with
// space for additional effect lines as more systems (hearing, sight, etc.) tie
// into these stats later. Now includes attribute XP progress bars and interactive dice upgrades.
const StatCard = ({ icon, name, current, base, accentColor, effects, totalXP, spentXP, requiredXP, onRoll }: StatCardProps) => {
    const isDebuffed = current < base;
    const progressXP = totalXP - spentXP;
    const progress = Math.min(100, Math.max(0, (progressXP / requiredXP) * 100));
    const isRollReady = progressXP >= requiredXP;

    return (
        <div className="bg-card/40 p-2.5 rounded-lg border border-border/40 hover:border-primary/30 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                    <div className={cn("w-6 h-6 rounded-md flex items-center justify-center border", accentColor)}>
                        {icon}
                    </div>
                    <span className="text-[11px] font-bold text-foreground uppercase tracking-wide">{name}</span>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-base font-black text-foreground tabular-nums">{Math.round(current)}</span>
                    {isDebuffed && (
                        <span className="text-[8px] text-red-400/80 font-mono">(base {base})</span>
                    )}
                </div>
            </div>
            <div className="space-y-0.5 pl-1 border-l border-white/5 mb-2.5">
                {effects.map((line, i) => (
                    <div key={i} className="text-[9.5px] leading-tight text-muted-foreground pl-1.5">{line}</div>
                ))}
            </div>

            {/* XP progress bar and dice roll button */}
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
                <div className="flex-grow space-y-0.5">
                    <div className="flex justify-between text-[8px] text-muted-foreground font-mono">
                        <span>TOTAL: {Math.round(totalXP)}</span>
                        <span>{Math.round(progressXP)} / {Math.round(requiredXP)}</span>
                    </div>
                    <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden border border-white/5">
                        <div
                            className={cn("h-full transition-all duration-500 ease-out", 
                                isRollReady ? "bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.4)] animate-pulse" : "bg-primary"
                            )}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
                
                <button
                    onClick={onRoll}
                    disabled={!isRollReady}
                    className={cn(
                        "w-7 h-7 shrink-0 rounded flex items-center justify-center border transition-all duration-300",
                        isRollReady 
                            ? "bg-emerald-500/25 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/35 hover:text-emerald-300 cursor-pointer animate-bounce" 
                            : "bg-secondary/20 border-white/5 text-muted-foreground/30 opacity-50 cursor-not-allowed"
                    )}
                    title={isRollReady ? "Click to roll for an upgrade!" : "Not enough XP to roll"}
                >
                    <Dices className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
};

export default function PlayerSkillsUI() {
    const { player, playerStats } = usePlayer();
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
        const meleeKills = playerStats.meleeKills || 0;
        const meleeNext = 5 * Math.pow(2, meleeLvl);
        const meleePrev = meleeLvl === 0 ? 0 : 5 * Math.pow(2, meleeLvl - 1);

        const rangedLvl = (playerStats.rangedLvl !== undefined ? playerStats.rangedLvl : 0);
        const rangedKills = playerStats.rangedKills || 0;
        const rangedNext = 5 * Math.pow(2, rangedLvl);
        const rangedPrev = rangedLvl === 0 ? 0 : 5 * Math.pow(2, rangedLvl - 1);

        return {
            melee: {
                level: meleeLvl,
                kills: meleeKills,
                next: meleeNext,
                prev: meleePrev,
                crit: 5 * meleeLvl, // Starting at 0% at level 0, 5% at level 1
                acc: meleeLvl // Starting at 0% at level 0, 1% at level 1
            },
            ranged: {
                level: rangedLvl,
                kills: rangedKills,
                next: rangedNext,
                prev: rangedPrev,
                crit: 5 * rangedLvl, // Starting at 0% at level 0, 5% at level 1
                acc: rangedLvl // Starting at 0% at level 0, 1% at level 1
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

        const meleeDamageBonus = CombatResolver.strengthDamageBonus(currentStrength);
        const armorPenalty = CombatResolver.armorWeightPenalty(currentStrength, playerStats.armorWeightRequirement || 0);
        const wagonPullBonus = Math.floor(currentStrength / 20);
        const dodgeChance = Math.max(0, Math.round(currentAgility - armorPenalty));
        const critBonus = Math.round(CombatResolver.perceptionCritBonus(currentPerception) * 100);
        const meleeAimBonus = Math.round(CombatResolver.meleeAimBonus(currentAgility) * 100);
        const rangedAimBonus = Math.round(CombatResolver.perceptionAimBonus(currentPerception) * 100);
        const sightRangeBonus = Math.floor(currentPerception / 20);
        // maxHp is now derived from Constitution by recalcCharacter and lives on the
        // player, so display the real value; fall back to the formula only if absent.
        const maxHp = playerStats.maxHp ?? (10 + Math.max(0, Math.floor(currentConstitution * 0.5)));
        const sickResistPct = Math.round(CombatResolver.sicknessResistFraction(currentConstitution) * 100);

        const reqStrXP = AttributeProgressionManager.getRequiredXP(baseStrength);
        const reqAgiXP = AttributeProgressionManager.getRequiredXP(baseAgility);
        const reqPerXP = AttributeProgressionManager.getRequiredXP(basePerception);
        const reqConXP = AttributeProgressionManager.getRequiredXP(baseConstitution);

        const isInfected = playerStats.isInfected;
        const isTreated = isInfected && (playerStats.treatmentTicksRemaining > 0);
        const treatmentSubtype = playerStats.treatmentSubtype?.toLowerCase();

        const getInfectionEffects = (statName) => {
            const lines = [];
            if (isInfected && !isTreated) {
                lines.push("Infection: -10% to attributes");
            } else if (isTreated) {
                if (treatmentSubtype === 'mutant') {
                    lines.push("Mutant Treatment: +20% & Decay Immune");
                } else if (statName === 'Strength') {
                    if (treatmentSubtype === 'basic' || treatmentSubtype === 'zombie') {
                        lines.push("Zombie Treatment: Strength is Decay Immune");
                    } else if (treatmentSubtype === 'fat') {
                        lines.push("Fat Zombie Treatment: +5% Strength & Decay Immune");
                    }
                } else if (statName === 'Agility') {
                    if (treatmentSubtype === 'runner') {
                        lines.push("Runner Treatment: +10% Agility & Decay Immune");
                    } else if (treatmentSubtype === 'spitter') {
                        lines.push("Spitter Treatment: +5% Agility & Decay Immune");
                    }
                } else if (statName === 'Perception') {
                    if (treatmentSubtype === 'peeper') {
                        lines.push("Peeper Treatment: +10% Perception & Decay Immune");
                    }
                } else if (statName === 'Constitution') {
                    if (treatmentSubtype === 'acid') {
                        lines.push("Acid Treatment: +10% Constitution & Decay Immune");
                    } else if (treatmentSubtype === 'fat') {
                        lines.push("Fat Zombie Treatment: +5% Constitution & Decay Immune");
                    } else if (treatmentSubtype === 'spitter') {
                        lines.push("Spitter Treatment: +5% Constitution & Decay Immune");
                    }
                }
            }
            return lines;
        };

        return {
            strength: { current: currentStrength, base: baseStrength, meleeDamageBonus, armorPenalty, wagonPullBonus, totalXP: playerStats.strengthXP || 0, spentXP: playerStats.strengthXpSpent || 0, requiredXP: reqStrXP, infectionEffects: getInfectionEffects('Strength') },
            agility: { current: currentAgility, base: baseAgility, dodgeChance, meleeAimBonus, armorPenalty, totalXP: playerStats.agilityXP || 0, spentXP: playerStats.agilityXpSpent || 0, requiredXP: reqAgiXP, infectionEffects: getInfectionEffects('Agility') },
            perception: { current: currentPerception, base: basePerception, critBonus, rangedAimBonus, sightRangeBonus, totalXP: playerStats.perceptionXP || 0, spentXP: playerStats.perceptionXpSpent || 0, requiredXP: reqPerXP, infectionEffects: getInfectionEffects('Perception') },
            constitution: { current: currentConstitution, base: baseConstitution, maxHp, sickResistPct, totalXP: playerStats.constitutionXP || 0, spentXP: playerStats.constitutionXpSpent || 0, requiredXP: reqConXP, infectionEffects: getInfectionEffects('Constitution') }
        };
    }, [playerStats]);

    return (
        <div className="flex flex-col h-full bg-background/40 rounded-lg overflow-hidden border border-border/50 backdrop-blur-sm">
            {/* Header */}
            <div className="p-2 px-3 border-b border-border bg-card/30 flex items-center justify-between gap-2.5">
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
                </div>

                {/* Name Label */}
                <div className="px-2.5 py-1 rounded bg-secondary/40 border border-primary/20 flex items-center max-w-[180px] overflow-hidden shrink-0">
                    <span className="text-xs font-mono font-bold text-primary tracking-wide truncate" title={player?.name || 'Nameless'}>
                        {player?.name || 'Nameless'}
                    </span>
                </div>
            </div>

            {/* Scrollable Content: attributes on the left with room to grow, skills compact on the right */}
            <div className="flex-1 overflow-y-auto p-2.5 custom-scrollbar">
                <div className="flex gap-3 items-start">

                    {/* Attributes */}
                    <div className="flex-1 min-w-[220px] space-y-2">
                        <div className="flex items-center gap-2 pb-1 border-b border-border/30">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Attributes</h3>
                        </div>

                        <StatCard
                            icon={<Dumbbell className="w-3.5 h-3.5 text-orange-400" />}
                            name="Strength"
                            current={attributes.strength.current}
                            base={attributes.strength.base}
                            accentColor="bg-orange-500/10 border-orange-500/30"
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

                        <StatCard
                            icon={<Wind className="w-3.5 h-3.5 text-sky-400" />}
                            name="Agility"
                            current={attributes.agility.current}
                            base={attributes.agility.base}
                            accentColor="bg-sky-500/10 border-sky-500/30"
                            effects={[
                                `Dodge chance ~${attributes.agility.dodgeChance}% (1st this turn)`,
                                'Repeat dodges the same turn are weaker',
                                `Melee hit +${attributes.agility.meleeAimBonus}%`,
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

                        <StatCard
                            icon={<Eye className="w-3.5 h-3.5 text-violet-400" />}
                            name="Perception"
                            current={attributes.perception.current}
                            base={attributes.perception.base}
                            accentColor="bg-violet-500/10 border-violet-500/30"
                            effects={[
                                `Crit chance +${attributes.perception.critBonus}%`,
                                `Ranged hit +${attributes.perception.rangedAimBonus}%`,
                                `Sight range bonus: +${attributes.perception.sightRangeBonus}`,
                                ...attributes.perception.infectionEffects
                            ]}
                            totalXP={attributes.perception.totalXP}
                            spentXP={attributes.perception.spentXP}
                            requiredXP={attributes.perception.requiredXP}
                            onRoll={() => AttributeProgressionManager.rollAttribute(player, 'perception')}
                        />

                        <StatCard
                            icon={<Heart className="w-3.5 h-3.5 text-rose-400" />}
                            name="Constitution"
                            current={attributes.constitution.current}
                            base={attributes.constitution.base}
                            accentColor="bg-rose-500/10 border-rose-500/30"
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

                    {/* Skills */}
                    <div className="w-[180px] shrink-0 space-y-2">
                        <div className="flex items-center gap-2 pb-1 border-b border-border/30">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Skills</h3>
                        </div>

                        <CompactSkillCard
                            title="Melee Combat"
                            level={combatSkills.melee.level}
                            progressLabel="Kills"
                            current={combatSkills.melee.kills}
                            next={combatSkills.melee.next}
                            prev={combatSkills.melee.prev}
                            metrics={[
                                { icon: <Sparkles className="w-2.5 h-2.5 text-yellow-500" />, label: 'Crit', value: `${combatSkills.melee.crit}%`, color: 'text-yellow-500/90' },
                                { icon: <Crosshair className="w-2.5 h-2.5 text-green-500" />, label: 'Acc', value: `+${combatSkills.melee.acc}%`, color: 'text-green-500/90' }
                            ]}
                        />

                        <CompactSkillCard
                            title="Ranged Combat"
                            level={combatSkills.ranged.level}
                            progressLabel="Kills"
                            current={combatSkills.ranged.kills}
                            next={combatSkills.ranged.next}
                            prev={combatSkills.ranged.prev}
                            metrics={[
                                { icon: <Sparkles className="w-2.5 h-2.5 text-yellow-500" />, label: 'Crit', value: `${combatSkills.ranged.crit}%`, color: 'text-yellow-500/90' },
                                { icon: <Crosshair className="w-2.5 h-2.5 text-green-500" />, label: 'Acc', value: `+${combatSkills.ranged.acc}%`, color: 'text-green-500/90' }
                            ]}
                        />

                        <CompactSkillCard
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
            </div>

        </div>
    );
}
