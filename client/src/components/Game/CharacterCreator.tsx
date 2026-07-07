import { useState, useMemo, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dumbbell, Wind, Eye, Heart, Plus, Minus, Info } from "lucide-react";
import { CombatResolver } from '../../game/systems/CombatResolver.js';

interface CharacterCreatorProps {
    onConfirm: (stats: { strength: number; agility: number; perception: number; constitution: number; name: string }) => void;
    onCancel: () => void;
    confirmLabel?: string;
}

export default function CharacterCreator({ onConfirm, onCancel, confirmLabel }: CharacterCreatorProps) {
    const [name, setName] = useState('Nameless');
    const [stats, setStats] = useState({
        strength: 10,
        agility: 10,
        perception: 10,
        constitution: 10
    });

    const maxPoints = 80;
    const statFloor = 10;

    const pointsSpent = useMemo(() => {
        return (stats.strength - statFloor) +
               (stats.agility - statFloor) +
               (stats.perception - statFloor) +
               (stats.constitution - statFloor);
    }, [stats]);

    const pointsRemaining = maxPoints - pointsSpent;

    const derivedStats = useMemo(() => {
        // HP uses Constitution
        const conBonus = Math.max(0, Math.floor(stats.constitution * 0.2));
        const maxHp = 10 + conBonus;

        // AP uses Agility + Perception
        const apAttrBonus = Math.floor((stats.agility + stats.perception) / 6);
        const maxAp = 10 + apAttrBonus; // Assuming no exhaustion at start

        // Attribute effects matching PlayerSkillsUI / CombatResolver formulas
        const meleeDamageBonus = CombatResolver.strengthDamageBonus(stats.strength);
        const wagonPullBonus = Math.floor(stats.strength / 20);
        const dodgeChance = stats.agility;
        const meleeAimBonus = Math.round(CombatResolver.meleeAimBonus(stats.agility) * 100);
        const critBonus = Math.round(CombatResolver.perceptionCritBonus(stats.perception) * 100);
        const rangedAimBonus = Math.round(CombatResolver.perceptionAimBonus(stats.perception) * 100);
        const sightRangeBonus = Math.floor(stats.perception / 20);
        const sickResistPct = Math.round(CombatResolver.sicknessResistFraction(stats.constitution) * 100);

        return {
            maxHp,
            maxAp,
            strengthEffects: [
                `Melee damage +${meleeDamageBonus}`,
                `Wagon-pull AP bonus: +${wagonPullBonus} AP`
            ],
            agilityEffects: [
                `Dodge chance ~${dodgeChance}% (1st this turn)`,
                `Melee hit +${meleeAimBonus}%`
            ],
            perceptionEffects: [
                `Crit chance +${critBonus}%`,
                `Ranged hit +${rangedAimBonus}%`,
                `Sight range bonus: +${sightRangeBonus}`
            ],
            constitutionEffects: [
                `Max HP ${maxHp}`,
                `Sickness resist −${sickResistPct}%`
            ]
        };
    }, [stats]);

    const handleAdjust = (statName: keyof typeof stats, amount: number) => {
        const currentVal = stats[statName];
        let targetAmount = amount;

        if (targetAmount > 0) {
            targetAmount = Math.min(targetAmount, pointsRemaining);
        } else if (targetAmount < 0) {
            targetAmount = Math.max(targetAmount, statFloor - currentVal);
        }

        if (targetAmount === 0) return;

        setStats(prev => ({
            ...prev,
            [statName]: currentVal + targetAmount
        }));
    };

    const handleDirectChange = (statName: keyof typeof stats, newValue: number) => {
        const currentVal = stats[statName];
        const maxVal = currentVal + pointsRemaining;
        const clampedVal = Math.min(maxVal, Math.max(statFloor, newValue));

        setStats(prev => ({
            ...prev,
            [statName]: clampedVal
        }));
    };

    const isConfirmDisabled = pointsRemaining !== 0;

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-background/95 backdrop-blur-md p-4 pointer-events-auto shadow-2xl">
            <Card className="w-full max-w-4xl bg-card border-primary/20 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 metal-panel">
                {/* Header */}
                <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Info className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-mono uppercase tracking-tighter text-foreground">Character Creation</CardTitle>
                        </div>
                    </div>

                    {/* Name Input Container */}
                    <div className="flex items-center gap-2 max-w-[240px] w-full px-3 py-1.5 rounded-md bg-secondary/40 border border-primary/20 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all duration-300">
                        <span className="text-xs text-muted-foreground uppercase font-mono tracking-wider shrink-0">Name:</span>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={20}
                            className="bg-transparent border-none outline-none text-xs font-mono font-bold text-foreground w-full placeholder:text-muted-foreground/30 focus:outline-none"
                            placeholder="Nameless"
                        />
                    </div>
                    
                    {/* Points remaining badge */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary/40 border border-primary/20">
                        <span className="text-xs text-muted-foreground uppercase font-mono tracking-wider">Points Pool:</span>
                        <span className={`font-mono text-lg font-bold tabular-nums ${pointsRemaining > 0 ? 'text-primary animate-pulse' : 'text-emerald-400'}`}>
                            {pointsRemaining}
                        </span>
                    </div>
                </CardHeader>

                <CardContent className="p-6 flex flex-col md:flex-row gap-6">
                    {/* Left Column - Attributes */}
                    <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2 pb-1 border-b border-border/30 justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/80">Attributes</h3>
                            <span className="text-[9px] text-muted-foreground font-mono">
                                Shift+Click = 10 | Type or Scroll to adjust
                            </span>
                        </div>

                        {/* STRENGTH */}
                        <StatAdjusterCard
                            icon={<Dumbbell className="w-3.5 h-3.5 text-orange-400" />}
                            name="Strength"
                            value={stats.strength}
                            effects={derivedStats.strengthEffects}
                            onDecrement={(amount) => handleAdjust('strength', -(amount ?? 1))}
                            onIncrement={(amount) => handleAdjust('strength', amount ?? 1)}
                            onChange={(newValue) => handleDirectChange('strength', newValue)}
                            canDecrement={stats.strength > statFloor}
                            canIncrement={pointsRemaining > 0}
                            pointsRemaining={pointsRemaining}
                            statFloor={statFloor}
                        />

                        {/* AGILITY */}
                        <StatAdjusterCard
                            icon={<Wind className="w-3.5 h-3.5 text-sky-400" />}
                            name="Agility"
                            value={stats.agility}
                            effects={derivedStats.agilityEffects}
                            onDecrement={(amount) => handleAdjust('agility', -(amount ?? 1))}
                            onIncrement={(amount) => handleAdjust('agility', amount ?? 1)}
                            onChange={(newValue) => handleDirectChange('agility', newValue)}
                            canDecrement={stats.agility > statFloor}
                            canIncrement={pointsRemaining > 0}
                            pointsRemaining={pointsRemaining}
                            statFloor={statFloor}
                        />

                        {/* PERCEPTION */}
                        <StatAdjusterCard
                            icon={<Eye className="w-3.5 h-3.5 text-violet-400" />}
                            name="Perception"
                            value={stats.perception}
                            effects={derivedStats.perceptionEffects}
                            onDecrement={(amount) => handleAdjust('perception', -(amount ?? 1))}
                            onIncrement={(amount) => handleAdjust('perception', amount ?? 1)}
                            onChange={(newValue) => handleDirectChange('perception', newValue)}
                            canDecrement={stats.perception > statFloor}
                            canIncrement={pointsRemaining > 0}
                            pointsRemaining={pointsRemaining}
                            statFloor={statFloor}
                        />

                        {/* CONSTITUTION */}
                        <StatAdjusterCard
                            icon={<Heart className="w-3.5 h-3.5 text-rose-400" />}
                            name="Constitution"
                            value={stats.constitution}
                            effects={derivedStats.constitutionEffects}
                            onDecrement={(amount) => handleAdjust('constitution', -(amount ?? 1))}
                            onIncrement={(amount) => handleAdjust('constitution', amount ?? 1)}
                            onChange={(newValue) => handleDirectChange('constitution', newValue)}
                            canDecrement={stats.constitution > statFloor}
                            canIncrement={pointsRemaining > 0}
                            pointsRemaining={pointsRemaining}
                            statFloor={statFloor}
                        />
                    </div>

                    {/* Right Column - Derived Vitals */}
                    <div className="w-full md:w-[320px] shrink-0 flex flex-col gap-4">
                        <div className="flex items-center gap-2 pb-1 border-b border-border/30">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/80">Derived Vitals</h3>
                        </div>

                        <div className="flex-1 flex flex-col justify-center gap-5 p-5 border border-border/50 rounded-xl bg-muted/30 relative overflow-hidden">
                            {/* HP Display */}
                            <div className="flex items-center justify-between p-4 bg-red-500/5 dark:bg-red-950/10 border border-red-500/20 dark:border-red-500/10 rounded-lg">
                                <div className="space-y-0.5">
                                    <h4 className="text-xs font-bold uppercase text-red-500/80 dark:text-red-400/80 tracking-wider">Starting Health</h4>
                                    <p className="text-[10px] text-muted-foreground">Derived from Constitution</p>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-4xl font-mono font-black text-red-500 dark:text-red-400 tracking-tighter tabular-nums">{derivedStats.maxHp}</span>
                                    <span className="text-[9px] uppercase font-bold text-red-500/70 dark:text-red-400/70 tracking-widest mt-0.5">Max HP</span>
                                </div>
                            </div>

                            {/* AP Display */}
                            <div className="flex items-center justify-between p-4 bg-blue-500/5 dark:bg-blue-950/10 border border-blue-500/20 dark:border-blue-500/10 rounded-lg">
                                <div className="space-y-0.5">
                                    <h4 className="text-xs font-bold uppercase text-blue-500/80 dark:text-blue-400/80 tracking-wider">Starting Action Points</h4>
                                    <p className="text-[10px] text-muted-foreground">Derived from Agility + Perception</p>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-4xl font-mono font-black text-blue-500 dark:text-blue-400 tracking-tighter tabular-nums">{derivedStats.maxAp}</span>
                                    <span className="text-[9px] uppercase font-bold text-blue-500/70 dark:text-blue-400/70 tracking-widest mt-0.5">Max AP</span>
                                </div>
                            </div>
                        </div>

                        {/* Decision Buttons */}
                        <div className="flex gap-3">
                            <Button
                                onClick={onCancel}
                                className="flex-1 py-5 text-sm font-bold metal-button uppercase tracking-wider"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => onConfirm({ ...stats, name: name.trim() || 'Nameless' })}
                                disabled={isConfirmDisabled}
                                className={`flex-1 py-5 text-sm font-bold uppercase tracking-wider ${isConfirmDisabled ? 'opacity-40 cursor-not-allowed' : 'metal-button-green'}`}
                            >
                                {confirmLabel || 'Confirm'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Adjuster stat card
interface StatAdjusterCardProps {
    icon: React.ReactNode;
    name: string;
    value: number;
    effects: string[];
    onDecrement: (amount?: number) => void;
    onIncrement: (amount?: number) => void;
    onChange: (newValue: number) => void;
    canDecrement: boolean;
    canIncrement: boolean;
    pointsRemaining: number;
    statFloor: number;
}

function StatAdjusterCard({
    icon,
    name,
    value,
    effects,
    onDecrement,
    onIncrement,
    onChange,
    canDecrement,
    canIncrement,
    pointsRemaining,
    statFloor
}: StatAdjusterCardProps) {
    const ratio = (value - 10) / 80;
    
    // Tone down colors: color outline / faint backgrounds stand out with increase in value
    const dynamicStyle = useMemo(() => {
        const rgb = name === 'Strength' ? '249, 115, 22' :
                    name === 'Agility' ? '14, 165, 233' :
                    name === 'Perception' ? '139, 92, 246' :
                                            '244, 63, 94'; // Constitution
        return {
            borderColor: `rgba(${rgb}, ${0.12 + ratio * 0.38})`,
            backgroundColor: `rgba(${rgb}, ${0.005 + ratio * 0.075})`,
            // Outer glow effect as stat scales
            boxShadow: ratio > 0 ? `0 0 ${Math.round(ratio * 8)}px rgba(${rgb}, ${ratio * 0.12})` : 'none'
        };
    }, [name, ratio]);

    const iconBorderColor = name === 'Strength' ? 'border-orange-500/30' :
                            name === 'Agility' ? 'border-sky-500/30' :
                            name === 'Perception' ? 'border-violet-500/30' :
                                                    'border-rose-500/30';

    const iconBgColor = name === 'Strength' ? 'bg-orange-500/10' :
                        name === 'Agility' ? 'bg-sky-500/10' :
                        name === 'Perception' ? 'bg-violet-500/10' :
                                                'bg-rose-500/10';

    // Direct numeric input local state
    const [inputValue, setInputValue] = useState(value.toString());

    // Keep local input in sync with external value changes (e.g. from increment/decrement buttons)
    useEffect(() => {
        setInputValue(value.toString());
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawVal = e.target.value;
        const cleanVal = rawVal.replace(/\D/g, ''); // Digits only
        setInputValue(cleanVal);

        if (cleanVal !== '') {
            const parsedVal = parseInt(cleanVal, 10);
            const maxVal = value + pointsRemaining;
            // Only update parent if it's within the safe range [statFloor, maxVal]
            if (parsedVal >= statFloor && parsedVal <= maxVal) {
                onChange(parsedVal);
            }
        }
    };

    const handleBlur = () => {
        let parsedVal = parseInt(inputValue, 10);
        if (isNaN(parsedVal) || parsedVal < statFloor) {
            parsedVal = statFloor;
        } else {
            const maxVal = value + pointsRemaining;
            if (parsedVal > maxVal) {
                parsedVal = maxVal;
            }
        }
        onChange(parsedVal);
        setInputValue(parsedVal.toString());
    };

    // Auto-repeat timers on button hold
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const decrementRef = useRef(onDecrement);
    const incrementRef = useRef(onIncrement);
    const canDecrementRef = useRef(canDecrement);
    const canIncrementRef = useRef(canIncrement);

    useEffect(() => {
        decrementRef.current = onDecrement;
        incrementRef.current = onIncrement;
        canDecrementRef.current = canDecrement;
        canIncrementRef.current = canIncrement;
    });

    const startRepeat = (isIncrement: boolean, step: number) => {
        stopRepeat();

        const action = () => {
            if (isIncrement) {
                if (canIncrementRef.current) {
                    incrementRef.current(step);
                } else {
                    stopRepeat();
                }
            } else {
                if (canDecrementRef.current) {
                    decrementRef.current(step);
                } else {
                    stopRepeat();
                }
            }
        };

        action();

        timerRef.current = setTimeout(() => {
            intervalRef.current = setInterval(() => {
                action();
            }, 80);
        }, 400);
    };

    const stopRepeat = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    // Clean up timers on unmount
    useEffect(() => {
        return () => stopRepeat();
    }, []);

    const handleWheel = (e: React.WheelEvent) => {
        const step = e.shiftKey || e.ctrlKey ? 10 : 1;
        if (e.deltaY < 0) {
            if (canIncrement) onIncrement(step);
        } else {
            if (canDecrement) onDecrement(step);
        }
    };

    return (
        <div 
            className="p-2.5 border rounded-lg flex flex-col transition-all duration-300 ease-out bg-card/40"
            style={dynamicStyle}
        >
            <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center border ${iconBgColor} ${iconBorderColor}`}>
                        {icon}
                    </div>
                    <span className="text-[11px] font-bold text-foreground uppercase tracking-wide">{name}</span>
                </div>
                
                {/* Spinbox controls */}
                <div 
                    className="flex items-center gap-1.5 bg-background/60 p-1 rounded-md border border-white/5"
                    onWheel={handleWheel}
                >
                    <Button
                        variant="ghost"
                        size="icon"
                        onMouseDown={(e) => {
                            if (e.button !== 0) return;
                            const step = e.shiftKey || e.ctrlKey ? 10 : 1;
                            startRepeat(false, step);
                        }}
                        onMouseUp={stopRepeat}
                        onMouseLeave={stopRepeat}
                        disabled={!canDecrement}
                        className="h-6 w-6 rounded bg-secondary/50 hover:bg-red-500/20 text-muted-foreground hover:text-red-400 disabled:opacity-30 disabled:hover:bg-transparent transition-colors select-none"
                    >
                        <Minus className="w-3 h-3" />
                    </Button>
                    
                    <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={inputValue}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleBlur();
                                e.currentTarget.blur();
                            }
                        }}
                        className="w-8 text-center font-mono text-xs font-bold text-foreground bg-transparent border-none outline-none focus:ring-1 focus:ring-primary/40 focus:bg-background/80 rounded tabular-nums select-all"
                    />

                    <Button
                        variant="ghost"
                        size="icon"
                        onMouseDown={(e) => {
                            if (e.button !== 0) return;
                            const step = e.shiftKey || e.ctrlKey ? 10 : 1;
                            startRepeat(true, step);
                        }}
                        onMouseUp={stopRepeat}
                        onMouseLeave={stopRepeat}
                        disabled={!canIncrement}
                        className="h-6 w-6 rounded bg-secondary/50 hover:bg-emerald-500/20 text-muted-foreground hover:text-emerald-400 disabled:opacity-30 disabled:hover:bg-transparent transition-colors select-none"
                    >
                        <Plus className="w-3 h-3" />
                    </Button>
                </div>
            </div>

            {/* Effects */}
            <div className="space-y-0.5 pl-1 border-l border-white/5">
                {effects.map((line, i) => (
                    <div key={i} className="text-[9.5px] leading-tight text-muted-foreground pl-1.5">{line}</div>
                ))}
            </div>
        </div>
    );
}
