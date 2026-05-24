
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { X, Settings, Gamepad2, Monitor, Volume2, Music, Volume1 } from "lucide-react";
import { imageLoader } from '@/game/utils/ImageLoader';
import { configManager } from '@/game/utils/ConfigManager';
import audioManager from '@/game/utils/AudioManager';
import musicManager from '@/game/utils/MusicManager';
import { Slider } from "@/components/ui/slider";

interface OptionsWindowProps {
    onClose: () => void;
}

export default function OptionsWindow({ onClose }: OptionsWindowProps) {
    const [activeTab, setActiveTab] = useState('audio');
    const [tempTileSet, setTempTileSet] = useState(imageLoader.tileSet);

    const handleApplyTiles = () => {
        imageLoader.setTileSet(tempTileSet);
        configManager.set('tileSet', tempTileSet);
    };

    const [masterVol, setMasterVol] = useState(configManager.get('masterVolume') ?? 0.8);
    const [musicVol, setMusicVol] = useState(configManager.get('musicVolume') ?? 0.5);
    const [sfxVol, setSfxVol] = useState(configManager.get('sfxVolume') ?? 1.0);

    const handleMasterVolChange = (vals: number[]) => {
        const val = vals[0];
        setMasterVol(val);
        configManager.set('masterVolume', val);
        audioManager.setVolume(val);
        musicManager.updateVolume();
    };

    const handleMusicVolChange = (vals: number[]) => {
        const val = vals[0];
        setMusicVol(val);
        configManager.set('musicVolume', val);
        musicManager.updateVolume();
    };

    const handleSfxVolChange = (vals: number[]) => {
        const val = vals[0];
        setSfxVol(val);
        configManager.set('sfxVolume', val);
        audioManager.setSfxVolume(val);
        // Play a test sound to give feedback
        audioManager.playOneShot('Click', { volume: 0.5 });
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-background/90 backdrop-blur-md pointer-events-auto animate-in fade-in zoom-in duration-200">
            <Card className="w-[500px] bg-card border-2 border-primary/20 shadow-2xl relative overflow-hidden">
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                <Button
                    className="absolute right-3 top-3 h-8 w-8 p-0 rounded-full hover:bg-destructive hover:text-destructive-foreground transition-all duration-200 z-10"
                    variant="ghost"
                    onClick={onClose}
                    title="Close Options"
                >
                    <X className="h-5 w-5" />
                </Button>

                <CardHeader className="border-b border-border/50 bg-muted/30 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Settings className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-bold tracking-tight">System Options</CardTitle>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pt-6">
                    <Tabs defaultValue="audio" className="w-full" onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50 p-1 rounded-xl">
                            <TabsTrigger value="audio" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all py-2">
                                <Volume2 className="w-4 h-4" />
                                <span className="font-semibold">Audio</span>
                            </TabsTrigger>
                            <TabsTrigger value="graphics" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all py-2">
                                <Monitor className="w-4 h-4" />
                                <span className="font-semibold">Graphics</span>
                            </TabsTrigger>
                        </TabsList>

                        <div className="min-h-[200px] flex items-center justify-center p-8 bg-muted/20 rounded-2xl border border-dashed border-border/50">

                            <TabsContent value="graphics" className="mt-0 w-full animate-in slide-in-from-bottom-2 duration-300">
                                <div className="space-y-6">
                                    <div className="flex flex-col gap-3">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Map Tile Set</label>
                                        <div className="flex gap-2">
                                            <Select value={tempTileSet} onValueChange={setTempTileSet}>
                                                <SelectTrigger className="flex-1 bg-muted/40 border-primary/10 hover:border-primary/30 transition-colors">
                                                    <SelectValue placeholder="Select tile set" />
                                                </SelectTrigger>
                                                <SelectContent className="z-[120]">
                                                    <SelectItem value="standard">Standard</SelectItem>
                                                    <SelectItem value="b&w">Black and White</SelectItem>
                                                    <SelectItem value="custom">Custom</SelectItem>
                                                    <SelectItem value="none">None (Colors Only)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button 
                                                onClick={handleApplyTiles}
                                                className="bg-primary hover:bg-primary/90 font-bold px-6 shadow-lg shadow-primary/20"
                                            >
                                                Apply
                                            </Button>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground/60 italic px-1">
                                            {tempTileSet === 'none' 
                                                ? "Textures disabled. Rendering with base terrain colors." 
                                                : `Textures will be loaded from: /images/tiles/${tempTileSet === 'standard' ? '' : tempTileSet + '/'}`}
                                        </p>
                                    </div>

                                    <div className="text-center pt-8 border-t border-border/20 opacity-40">
                                        <Monitor className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                                        <p className="text-[10px] font-medium uppercase tracking-tighter">Advanced graphics coming soon</p>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="audio" className="mt-0 w-full animate-in slide-in-from-bottom-2 duration-300">
                                <div className="space-y-6">
                                    <div className="flex flex-col gap-4">
                                        
                                        <div className="space-y-3 bg-muted/30 p-4 rounded-xl border border-border/40">
                                            <div className="flex justify-between items-center px-1">
                                                <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wider">
                                                    <Volume2 className="w-4 h-4" /> Master Volume
                                                </div>
                                                <span className="text-xs font-mono text-muted-foreground bg-background px-2 py-1 rounded-md">
                                                    {Math.round(masterVol * 100)}%
                                                </span>
                                            </div>
                                            <Slider 
                                                value={[masterVol]} 
                                                max={1.0} 
                                                step={0.01} 
                                                onValueChange={handleMasterVolChange} 
                                            />
                                        </div>

                                        <div className="space-y-3 bg-muted/30 p-4 rounded-xl border border-border/40">
                                            <div className="flex justify-between items-center px-1">
                                                <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wider">
                                                    <Music className="w-4 h-4" /> Music Volume
                                                </div>
                                                <span className="text-xs font-mono text-muted-foreground bg-background px-2 py-1 rounded-md">
                                                    {Math.round(musicVol * 100)}%
                                                </span>
                                            </div>
                                            <Slider 
                                                value={[musicVol]} 
                                                max={1.0} 
                                                step={0.01} 
                                                onValueChange={handleMusicVolChange} 
                                            />
                                        </div>

                                        <div className="space-y-3 bg-muted/30 p-4 rounded-xl border border-border/40">
                                            <div className="flex justify-between items-center px-1">
                                                <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wider">
                                                    <Volume1 className="w-4 h-4" /> SFX Volume
                                                </div>
                                                <span className="text-xs font-mono text-muted-foreground bg-background px-2 py-1 rounded-md">
                                                    {Math.round(sfxVol * 100)}%
                                                </span>
                                            </div>
                                            <Slider 
                                                value={[sfxVol]} 
                                                max={1.0} 
                                                step={0.01} 
                                                onValueChange={handleSfxVolChange} 
                                            />
                                        </div>

                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
