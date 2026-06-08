
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
import { X, Settings, Gamepad2, Monitor, Volume2, Music, Volume1, Save, Upload, Download, Trash2 } from "lucide-react";
import { imageLoader } from '@/game/utils/ImageLoader';
import { configManager } from '@/game/utils/ConfigManager';
import audioManager from '@/game/utils/AudioManager';
import musicManager from '@/game/utils/MusicManager';
import { Slider } from "@/components/ui/slider";
import { useGame } from '../../contexts/GameContext.jsx';
import { GameSaveSystem } from '@/game/GameSaveSystem';

interface OptionsWindowProps {
    onClose: () => void;
}

export default function OptionsWindow({ onClose }: OptionsWindowProps) {
    const { isGameReady, exportGame, loadGameFromStateData, getSerializedSaveData } = useGame();
    const [activeTab, setActiveTab] = useState('audio');
    const [tempTileSet, setTempTileSet] = useState(imageLoader.tileSet);
    const [scaleToFit, setScaleToFit] = useState(() => {
        const saved = localStorage.getItem('scale_to_fit');
        return saved === null ? true : saved === 'true';
    });
    const [savesList, setSavesList] = useState<any[]>([]);

    const [saveTextToCopy, setSaveTextToCopy] = useState<string | null>(null);
    const [importText, setImportText] = useState('');
    const [showTextImport, setShowTextImport] = useState(false);

    const handleTextExport = () => {
        if (!isGameReady || !getSerializedSaveData) return;
        const textData = getSerializedSaveData();
        if (textData) {
            setSaveTextToCopy(textData);
            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                navigator.clipboard.writeText(textData).catch(err => {
                    console.warn('[OptionsWindow] Clipboard write failed:', err);
                });
            }
        } else {
            alert('Failed to generate save text.');
        }
    };

    const handleTextImportSubmit = async () => {
        if (!importText.trim()) return;
        try {
            const data = JSON.parse(importText);
            if (!data.version || !data.gameMap) {
                alert('Invalid save text format. Ensure it has "version" and "gameMap" fields.');
                return;
            }
            const success = await loadGameFromStateData(data);
            if (success) {
                onClose();
            } else {
                alert('Failed to load the save data.');
            }
        } catch (err: any) {
            alert('Error parsing save text: ' + err.message);
        }
    };

    const refreshSaves = async () => {
        try {
            const list = await GameSaveSystem.listSaveSlots();
            setSavesList(list);
        } catch (err) {
            console.error('Failed to list saves:', err);
        }
    };

    React.useEffect(() => {
        if (activeTab === 'saves') {
            refreshSaves();
        }
    }, [activeTab]);

    const handleExport = () => {
        if (!isGameReady) return;
        exportGame('zombie_road_save.json');
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target?.result as string;
                const data = JSON.parse(text);
                if (!data.version || !data.gameMap) {
                    alert('Invalid save file format. Ensure it has "version" and "gameMap" fields.');
                    return;
                }
                const success = await loadGameFromStateData(data);
                if (success) {
                    onClose();
                } else {
                    alert('Failed to load the save data.');
                }
            } catch (err: any) {
                alert('Error parsing save file: ' + err.message);
            }
        };
        reader.readAsText(file);
    };

    const handleDeleteSave = async (slotName: string) => {
        if (window.confirm(`Are you sure you want to delete the save slot "${slotName}"?`)) {
            const success = await GameSaveSystem.deleteSaveSlot(slotName);
            if (success) {
                refreshSaves();
            } else {
                alert('Failed to delete save slot.');
            }
        }
    };

    const handleToggleScale = (val: boolean) => {
        setScaleToFit(val);
        localStorage.setItem('scale_to_fit', String(val));
        window.dispatchEvent(new CustomEvent('toggle-scale-to-fit', { detail: val }));
    };

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
                                                    <SelectItem value="standard">Color</SelectItem>
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
                                                : tempTileSet === 'spritesheet'
                                                ? "Textures will be loaded from the master sprite sheet: ./images/tiles/tileset2.png"
                                                : `Textures will be loaded from: ./images/tiles/${tempTileSet === 'standard' ? '' : tempTileSet + '/'}`}
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Screen Scaling</label>
                                        <div className="flex gap-2">
                                            <Select value={scaleToFit ? "fit" : "responsive"} onValueChange={(val) => handleToggleScale(val === "fit")}>
                                                <SelectTrigger className="flex-1 bg-muted/40 border-primary/10 hover:border-primary/30 transition-colors">
                                                    <SelectValue placeholder="Select scaling mode" />
                                                </SelectTrigger>
                                                <SelectContent className="z-[120]">
                                                    <SelectItem value="fit">Scale to Fit (Recommended)</SelectItem>
                                                    <SelectItem value="responsive">Responsive (Fill Screen)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground/60 italic px-1">
                                            Scale to Fit locks the aspect ratio to 16:9 and scales the interface to fit the viewport. Responsive stretches elements to fill the window.
                                        </p>
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

                            <TabsContent value="saves" className="mt-0 w-full animate-in slide-in-from-bottom-2 duration-300">
                                <div className="space-y-6">
                                    <div className="flex flex-col gap-3">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">File Actions</label>
                                        <div className="flex gap-4">
                                            <Button
                                                onClick={handleExport}
                                                disabled={!isGameReady}
                                                className="flex-1 bg-primary hover:bg-primary/90 font-bold py-3 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                                            >
                                                <Download className="w-4 h-4" />
                                                Export Save
                                            </Button>

                                            <div className="flex-1 relative">
                                                <input
                                                    type="file"
                                                    accept=".json"
                                                    onChange={handleImport}
                                                    className="hidden"
                                                    id="save-import-input"
                                                />
                                                <label
                                                    htmlFor="save-import-input"
                                                    className="w-full h-full min-h-[40px] px-4 py-2 bg-muted/40 border border-primary/10 hover:border-primary/30 rounded-md font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors text-foreground select-none"
                                                >
                                                    <Upload className="w-4 h-4" />
                                                    Import Save
                                                </label>
                                            </div>
                                        </div>
                                        {!isGameReady && (
                                            <p className="text-[10px] text-muted-foreground/60 italic px-1 text-center">
                                                Start or load a game to enable Export Save.
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Text-based Backup (Backup for itch.io/Electron)</label>
                                        <div className="flex gap-4">
                                            <Button
                                                onClick={handleTextExport}
                                                disabled={!isGameReady}
                                                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 flex items-center justify-center gap-2 border border-white/10"
                                            >
                                                <Save className="w-4 h-4" />
                                                Export to Text
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    setShowTextImport(prev => !prev);
                                                    setImportText('');
                                                }}
                                                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 flex items-center justify-center gap-2 border border-white/10"
                                            >
                                                <Upload className="w-4 h-4" />
                                                Import from Text
                                            </Button>
                                        </div>
                                    </div>

                                    {showTextImport && (
                                        <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-xl border border-border/40 animate-in slide-in-from-top-2 duration-200">
                                            <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Paste Save Data JSON:</label>
                                            <textarea
                                                value={importText}
                                                onChange={(e) => setImportText(e.target.value)}
                                                placeholder="Paste your JSON save data here..."
                                                className="w-full h-24 p-2 bg-black border border-white/10 text-green-400 font-mono text-[10px] rounded focus:border-primary/50 focus:outline-none"
                                            />
                                            <div className="flex gap-2 justify-end">
                                                <Button
                                                    onClick={() => setShowTextImport(false)}
                                                    variant="ghost"
                                                    className="text-xs h-8"
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    onClick={handleTextImportSubmit}
                                                    disabled={!importText.trim()}
                                                    className="bg-primary hover:bg-primary/90 text-xs h-8 font-bold"
                                                >
                                                    Load Save Data
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-3">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Local Browser Saves</label>
                                        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                                            {savesList.length === 0 ? (
                                                <p className="text-sm text-muted-foreground/60 italic text-center py-4">
                                                    No local save slots found.
                                                </p>
                                            ) : (
                                                savesList.map((save) => (
                                                    <div 
                                                        key={save.slotName} 
                                                        className="flex justify-between items-center bg-muted/30 p-3 rounded-lg border border-border/40 hover:border-border/80 transition-colors"
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold capitalize text-foreground">{save.slotName}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                Turn {save.turn} • {new Date(save.timestamp).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <Button
                                                            onClick={() => handleDeleteSave(save.slotName)}
                                                            variant="ghost"
                                                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                            title="Delete Save Slot"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </CardContent>
            </Card>

            {saveTextToCopy && (
                <div className="absolute inset-0 z-50 bg-black/95 flex flex-col p-6 animate-in fade-in duration-200 justify-between">
                    <div className="flex flex-col gap-3 flex-1 overflow-hidden">
                        <h3 className="text-lg font-bold text-white uppercase tracking-wider">Exported Save Data</h3>
                        <p className="text-[10px] text-zinc-400 uppercase">
                            Copy the text below to backup your progress. 
                            {navigator.clipboard ? " It has also been copied to your clipboard automatically!" : ""}
                        </p>
                        <textarea
                            readOnly
                            value={saveTextToCopy}
                            onClick={(e) => (e.target as any).select()}
                            className="w-full flex-1 p-3 bg-zinc-950 border border-white/10 text-green-400 font-mono text-[9px] rounded-lg resize-none focus:outline-none overflow-y-auto"
                        />
                    </div>
                    <div className="flex gap-4 mt-4 shrink-0">
                        <Button
                            onClick={() => {
                                navigator.clipboard.writeText(saveTextToCopy);
                                alert('Copied to clipboard!');
                            }}
                            className="flex-1 bg-primary hover:bg-primary/90 font-bold"
                        >
                            Copy Again
                        </Button>
                        <Button
                            onClick={() => setSaveTextToCopy(null)}
                            variant="ghost"
                            className="flex-1 border border-white/10 hover:bg-zinc-800"
                        >
                            Close
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
