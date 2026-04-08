
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Bug, User, Shield, Flame, Skull, Zap } from "lucide-react";

interface DevConsoleProps {
    onClose: () => void;
    onLaunch: (config: any) => void;
    isLoading: boolean;
}

export default function DevConsole({ onClose, onLaunch, isLoading }: DevConsoleProps) {
    // COMPONENT LOG: This fires when React attempts to render the component
    console.log('[DevConsole] 🔩 Component mounting...');

    useEffect(() => {
        console.log('[DevConsole] ✅ Component rendered to DOM');
    }, []);
    
    // Zombie State
    const [zombies, setZombies] = useState({
        basicCount: 15,
        runnerCount: 5,
        crawlerMin: 2,
        crawlerMax: 4,
        acidMin: 1,
        acidMax: 3,
        swatMin: 1,
        swatMax: 2,
        firefighterMin: 1,
        firefighterMax: 2
    });

    // Player State
    const [player, setPlayer] = useState({
        meleeKills: 0,
        rangedKills: 0
    });

    const handleZombieChange = (field: string, value: string) => {
        const val = parseInt(value) || 0;
        setZombies(prev => ({ ...prev, [field]: val }));
    };

    const handlePlayerChange = (field: string, value: string) => {
        const val = parseInt(value) || 0;
        setPlayer(prev => ({ ...prev, [field]: val }));
    };

    const handleLaunch = () => {
        console.log('[DevConsole] 🚀 Preparing custom launch configuration...');
        const config = {
            zombieConfig: {
                basicCount: zombies.basicCount,
                runnerCount: zombies.runnerCount,
                crawlerRange: { min: zombies.crawlerMin, max: zombies.crawlerMax },
                acidRange: { min: zombies.acidMin, max: zombies.acidMax },
                swatRange: { min: zombies.swatMin, max: zombies.swatMax },
                firefighterRange: { min: zombies.firefighterMin, max: zombies.firefighterMax },
                fatRange: { min: 1, max: 2 } 
            },
            playerConfig: {
                meleeKills: player.meleeKills,
                rangedKills: player.rangedKills
            }
        };
        onLaunch(config);
    };

    return (
        <div 
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-background/90 backdrop-blur-md p-4 pointer-events-auto"
            style={{ display: 'flex' }}
        >
            <Card className="w-full max-w-2xl bg-card border-primary/20 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
                    <div className="flex items-center gap-2">
                        <Bug className="h-6 w-6 text-primary" />
                        <CardTitle className="text-2xl font-mono uppercase tracking-tighter">Dev Console</CardTitle>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                        <X className="h-5 w-5" />
                    </Button>
                </CardHeader>

                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Zombie Configuration */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary border-b border-primary/20 pb-1 mb-4">
                            <Skull className="h-4 w-4" />
                            <h3 className="font-bold text-sm uppercase">Zombie Population</h3>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground uppercase">Basic Count</Label>
                                <Input 
                                    type="number" 
                                    value={zombies.basicCount} 
                                    onChange={(e) => handleZombieChange('basicCount', e.target.value)}
                                    className="h-8 font-mono bg-secondary/50"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground uppercase">Runners</Label>
                                <Input 
                                    type="number" 
                                    value={zombies.runnerCount} 
                                    onChange={(e) => handleZombieChange('runnerCount', e.target.value)}
                                    className="h-8 font-mono bg-secondary/50"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground uppercase text-orange-400">Crawler Min/Max</Label>
                                <div className="flex gap-2">
                                    <Input type="number" value={zombies.crawlerMin} onChange={(e) => handleZombieChange('crawlerMin', e.target.value)} className="h-8 font-mono" />
                                    <Input type="number" value={zombies.crawlerMax} onChange={(e) => handleZombieChange('crawlerMax', e.target.value)} className="h-8 font-mono" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground uppercase text-green-400">Acid Min/Max</Label>
                                <div className="flex gap-2">
                                    <Input type="number" value={zombies.acidMin} onChange={(e) => handleZombieChange('acidMin', e.target.value)} className="h-8 font-mono" />
                                    <Input type="number" value={zombies.acidMax} onChange={(e) => handleZombieChange('acidMax', e.target.value)} className="h-8 font-mono" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground uppercase text-blue-400">SWAT Min/Max</Label>
                                <div className="flex gap-2">
                                    <Input type="number" value={zombies.swatMin} onChange={(e) => handleZombieChange('swatMin', e.target.value)} className="h-8 font-mono" />
                                    <Input type="number" value={zombies.swatMax} onChange={(e) => handleZombieChange('swatMax', e.target.value)} className="h-8 font-mono" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground uppercase text-red-500">Firefighter Min/Max</Label>
                                <div className="flex gap-2">
                                    <Input type="number" value={zombies.firefighterMin} onChange={(e) => handleZombieChange('firefighterMin', e.target.value)} className="h-8 font-mono" />
                                    <Input type="number" value={zombies.firefighterMax} onChange={(e) => handleZombieChange('firefighterMax', e.target.value)} className="h-8 font-mono" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Player Configuration */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary border-b border-primary/20 pb-1 mb-4">
                            <User className="h-4 w-4" />
                            <h3 className="font-bold text-sm uppercase">Player Mastery</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label className="text-xs text-muted-foreground uppercase flex items-center gap-2">
                                        <Zap className="h-3 w-3 text-yellow-500" /> Melee Kills
                                    </Label>
                                    <span className="text-[10px] font-mono text-primary/70">LVL {player.meleeKills < 5 ? 0 : Math.floor(Math.log2(player.meleeKills / 5)) + 1}</span>
                                </div>
                                <Input 
                                    type="number" 
                                    value={player.meleeKills} 
                                    onChange={(e) => handlePlayerChange('meleeKills', e.target.value)}
                                    className="h-10 font-mono bg-secondary/50 border-primary/20"
                                />
                                <p className="text-[10px] text-muted-foreground italic">Target: 5, 10, 20, 40, 80 kills for levels</p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label className="text-xs text-muted-foreground uppercase flex items-center gap-2">
                                        <Shield className="h-3 w-3 text-blue-500" /> Ranged Kills
                                    </Label>
                                    <span className="text-[10px] font-mono text-primary/70">LVL {player.rangedKills < 5 ? 0 : Math.floor(Math.log2(player.rangedKills / 5)) + 1}</span>
                                </div>
                                <Input 
                                    type="number" 
                                    value={player.rangedKills} 
                                    onChange={(e) => handlePlayerChange('rangedKills', e.target.value)}
                                    className="h-10 font-mono bg-secondary/50 border-primary/20"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="border-t border-border/50 pt-4 pb-4">
                    <Button 
                        onClick={handleLaunch} 
                        disabled={isLoading}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest"
                    >
                        {isLoading ? 'Booting Custom Environment...' : 'Initialize Custom Environment'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
