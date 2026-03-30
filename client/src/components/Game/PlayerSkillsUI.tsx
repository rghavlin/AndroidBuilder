import React, { useMemo, useState, useEffect } from 'react';
import { usePlayer } from '@/contexts/PlayerContext';
import { Target, Hammer, Info, Crosshair, Sparkles } from 'lucide-react';
import { cn } from "@/lib/utils";
import { imageLoader } from '@/game/utils/ImageLoader';

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

export default function PlayerSkillsUI() {
    const { playerStats } = usePlayer();
    const [playerIcon, setPlayerIcon] = useState<string | null>(null);

    useEffect(() => {
        const loadIcon = async () => {
            const img = await imageLoader.getImage('player');
            if (img) setPlayerIcon(img.src);
        };
        loadIcon();
    }, []);

    const combatSkills = useMemo(() => {
        const meleeLvl = playerStats.meleeLvl || 1;
        const meleeKills = playerStats.meleeKills || 0;
        const meleeNext = 5 * Math.pow(2, meleeLvl - 1);
        const meleePrev = meleeLvl === 1 ? 0 : 5 * Math.pow(2, meleeLvl - 2);

        const rangedLvl = playerStats.rangedLvl || 1;
        const rangedKills = playerStats.rangedKills || 0;
        const rangedNext = 5 * Math.pow(2, rangedLvl - 1);
        const rangedPrev = rangedLvl === 1 ? 0 : 5 * Math.pow(2, rangedLvl - 2);

        return {
            melee: { 
                level: meleeLvl, 
                kills: meleeKills, 
                next: meleeNext, 
                prev: meleePrev,
                crit: 5 + (meleeLvl - 1) * 5,
                acc: meleeLvl
            },
            ranged: { 
                level: rangedLvl, 
                kills: rangedKills, 
                next: rangedNext, 
                prev: rangedPrev,
                crit: 5 + (rangedLvl - 1) * 5,
                acc: rangedLvl
            }
        };
    }, [playerStats]);

    return (
        <div className="flex flex-col h-full bg-background/40 rounded-lg overflow-hidden border border-border/50 backdrop-blur-sm">
            {/* Header */}
            <div className="p-4 border-b border-border bg-card/30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
                    {playerIcon ? (
                        <img src={playerIcon} alt="Player" className="w-full h-full object-contain p-1" />
                    ) : (
                        <Info className="w-5 h-5 text-primary" />
                    )}
                </div>
                <div>
                    <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">Character Skills</h2>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                
                {/* Combat Section */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 pb-1 border-b border-border/30">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-red-200">Combat Proficiency</h3>
                    </div>

                    {/* Melee Skill */}
                    <div className="bg-card/40 p-3 rounded-lg border border-border/40 hover:border-primary/30 transition-colors">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[11px] font-bold text-foreground">Melee Combat</span>
                            <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-mono border border-primary/20">
                                LVL {combatSkills.melee.level}
                            </span>
                        </div>
                        
                        <div className="flex gap-4">
                            {/* Progression Side */}
                            <div className="flex-1 space-y-1">
                                <div className="flex justify-between items-end">
                                    <span className="text-[8px] text-muted-foreground uppercase tracking-tight">KILLS</span>
                                    <span className="text-[9px] font-mono text-foreground/80">
                                        {combatSkills.melee.kills} <span className="text-muted-foreground">/</span> {combatSkills.melee.next}
                                    </span>
                                </div>
                                <SkillProgressBar 
                                    current={combatSkills.melee.kills} 
                                    next={combatSkills.melee.next} 
                                    prev={combatSkills.melee.prev}
                                    color="bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                                />
                            </div>

                            {/* Stats Side */}
                            <div className="flex-1 grid grid-cols-2 gap-2 border-l border-white/5 pl-4">
                                <div className="flex flex-col">
                                    <span className="text-[8px] text-muted-foreground uppercase">Crit Chance</span>
                                    <div className="flex items-center gap-1">
                                        <Sparkles className="w-2.5 h-2.5 text-yellow-500" />
                                        <span className="text-[10px] font-bold text-yellow-500/90">{combatSkills.melee.crit}%</span>
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] text-muted-foreground uppercase">Accuracy</span>
                                    <div className="flex items-center gap-1">
                                        <Crosshair className="w-2.5 h-2.5 text-green-500" />
                                        <span className="text-[10px] font-bold text-green-500/90">+{combatSkills.melee.acc}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ranged Skill */}
                    <div className="bg-card/40 p-3 rounded-lg border border-border/40 hover:border-primary/30 transition-colors">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[11px] font-bold text-foreground">Ranged Combat</span>
                            <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-mono border border-primary/20">
                                LVL {combatSkills.ranged.level}
                            </span>
                        </div>

                        <div className="flex gap-4">
                            {/* Progression Side */}
                            <div className="flex-1 space-y-1">
                                <div className="flex justify-between items-end">
                                    <span className="text-[8px] text-muted-foreground uppercase tracking-tight">KILLS</span>
                                    <span className="text-[9px] font-mono text-foreground/80">
                                        {combatSkills.ranged.kills} <span className="text-muted-foreground">/</span> {combatSkills.ranged.next}
                                    </span>
                                </div>
                                <SkillProgressBar 
                                    current={combatSkills.ranged.kills} 
                                    next={combatSkills.ranged.next} 
                                    prev={combatSkills.ranged.prev}
                                    color="bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                                />
                            </div>

                            {/* Stats Side */}
                            <div className="flex-1 grid grid-cols-2 gap-2 border-l border-white/5 pl-4">
                                <div className="flex flex-col">
                                    <span className="text-[8px] text-muted-foreground uppercase">Crit Chance</span>
                                    <div className="flex items-center gap-1">
                                        <Sparkles className="w-2.5 h-2.5 text-yellow-500" />
                                        <span className="text-[10px] font-bold text-yellow-500/90">{combatSkills.ranged.crit}%</span>
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] text-muted-foreground uppercase">Accuracy</span>
                                    <div className="flex items-center gap-1">
                                        <Crosshair className="w-2.5 h-2.5 text-green-500" />
                                        <span className="text-[10px] font-bold text-green-500/90">+{combatSkills.ranged.acc}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Crafting Section */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 pb-1 border-b border-border/30">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-orange-200">Technical Skills</h3>
                    </div>

                    {/* Placeholder for Crafting */}
                    <div className="bg-card/40 p-3 rounded-lg border border-border/40 opacity-60 grayscale-[0.2]">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[11px] font-bold text-foreground/80">General Crafting</span>
                            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono border border-zinc-700">
                                LVL 1
                            </span>
                        </div>
                        <p className="text-[9px] text-muted-foreground italic mb-2">Training required to unlock higher tier recipes.</p>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <SkillProgressBar 
                                    current={0} 
                                    next={100} 
                                    prev={0}
                                    color="bg-orange-500/50"
                                />
                            </div>
                            <div className="flex-1 border-l border-white/5 pl-4 text-[9px] text-muted-foreground flex items-center">
                                No bonuses yet
                            </div>
                        </div>
                    </div>
                </section>

            </div>

        </div>
    );
}
