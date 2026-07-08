import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { X, Dumbbell, Wind, Eye, Heart, Plus, UserPlus, Award, Trash2, AlertTriangle } from "lucide-react";
import { CharacterRegistry } from '@/game/CharacterRegistry';
import CharacterCreator from './CharacterCreator';

interface CharacterRegistryWindowProps {
    onClose: () => void;
    onSelect?: (character: any) => void;
    mode: 'select' | 'manage';
}

export default function CharacterRegistryWindow({ onClose, onSelect, mode }: CharacterRegistryWindowProps) {
    const [characters, setCharacters] = useState<any[]>([]);
    const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
    const [showCreator, setShowCreator] = useState(false);

    useEffect(() => {
        setCharacters(CharacterRegistry.getCharacters());
    }, []);

    const handleConfirmSelection = () => {
        if (!onSelect) return;
        const selected = characters.find(c => c.id === selectedCharId);
        if (selected) {
            onSelect(selected);
        }
    };

    const handleCreateCharacter = (stats: any) => {
        const newChar = CharacterRegistry.addCharacter(stats);
        const updated = CharacterRegistry.getCharacters();
        setCharacters(updated);
        setSelectedCharId(newChar.id);
        setShowCreator(false);
    };

    const handleDeleteCharacter = (id: string) => {
        if (!window.confirm("Are you sure you want to delete this character? This action cannot be undone.")) return;
        CharacterRegistry.deleteCharacter(id);
        const updated = CharacterRegistry.getCharacters();
        setCharacters(updated);
        if (selectedCharId === id) {
            setSelectedCharId(null);
        }
    };

    const selectedChar = characters.find(c => c.id === selectedCharId);

    return (
        <div className="fixed inset-0 z-[8888] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 pointer-events-auto shadow-2xl">
            <Card className="relative w-full max-w-2xl bg-card border-primary/20 shadow-2xl overflow-hidden metal-panel max-h-[85vh] flex flex-col">
                {/* Header */}
                <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4 shrink-0">
                    <CardTitle className="text-2xl font-mono uppercase tracking-tighter text-foreground">
                        {mode === 'select' ? 'Select Character' : 'Character Registry'}
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-8 w-8 rounded-md bg-secondary/20 hover:bg-red-500/20 text-muted-foreground hover:text-red-400 border border-[var(--hairline)] transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>

                <CardContent className="p-6 flex-grow overflow-y-auto flex flex-col md:flex-row gap-6 min-h-0">
                    {/* Left side: list of characters */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Available Characters</span>
                            <Button 
                                size="sm" 
                                className="metal-button-green text-xs flex items-center gap-1 py-1"
                                onClick={() => setShowCreator(true)}
                            >
                                <UserPlus className="w-3.5 h-3.5" />
                                Create New
                            </Button>
                        </div>

                        {characters.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-border/50 rounded-lg p-6 bg-muted/10">
                                <p className="text-muted-foreground text-sm font-mono text-center">No characters found.</p>
                                <Button 
                                    className="mt-4 metal-button text-sm"
                                    onClick={() => setShowCreator(true)}
                                >
                                    Create First Character
                                </Button>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto space-y-2.5 pr-2 custom-scrollbar min-h-0">
                                {characters.map((char) => {
                                    const isSelected = selectedCharId === char.id;
                                    return (
                                        <div
                                            key={char.id}
                                            onClick={() => setSelectedCharId(char.id)}
                                            className={`p-3.5 rounded-lg border transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                                                isSelected 
                                                    ? 'bg-primary/10 border-primary/60 shadow-[0_0_12px_rgba(249,115,22,0.15)]' 
                                                    : 'bg-card/40 border-border/40 hover:border-primary/30 hover:bg-card/60'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className={`font-mono text-base font-black tracking-wide ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                                        {char.name}
                                                    </span>
                                                    {char.isInfected && (
                                                         <span className="inline-flex items-center gap-1 text-[10px] text-destructive font-bold uppercase tracking-wider bg-destructive/10 border border-destructive/20 px-1.5 py-0.5 rounded w-fit">
                                                             <AlertTriangle className="w-2.5 h-2.5" />
                                                             Infected
                                                         </span>
                                                     )}
                                                </div>
                                                <span className="text-[10px] text-muted-foreground font-mono opacity-50 select-none">
                                                    ID: {char.id.substring(0, 8)}...
                                                </span>
                                            </div>

                                            {/* Attribute list */}
                                             <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-muted-foreground border-t border-[var(--hairline)] pt-2">
                                                <div className="flex items-center gap-1">
                                                    <Dumbbell className="w-3 h-3 text-orange-400/80" />
                                                    <span>STR {char.strength ?? 10}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Wind className="w-3 h-3 text-sky-400/80" />
                                                    <span>AGI {char.agility ?? 10}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Eye className="w-3 h-3 text-violet-400/80" />
                                                    <span>PER {char.perception ?? 10}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Heart className="w-3 h-3 text-rose-400/80" />
                                                    <span>CON {char.constitution ?? 10}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right side: Detailed Stats View */}
                    <div className="w-full md:w-[260px] shrink-0 border border-border/50 rounded-xl bg-muted/20 p-4 flex flex-col justify-between">
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border/30 pb-2 flex items-center gap-1.5">
                                <Award className="w-4 h-4 text-primary" />
                                Character Details
                            </h4>

                            {selectedChar ? (
                                <div className="space-y-3.5 font-mono text-xs">
                                    <div>
                                        <span className="text-[10px] uppercase text-muted-foreground block">Name</span>
                                        <span className="text-sm font-bold text-foreground">{selectedChar.name}</span>
                                    </div>

                                    <div>
                                        <span className="text-[10px] uppercase text-muted-foreground block">Infection Status</span>
                                        {selectedChar.isInfected ? (
                                             <span className="inline-flex items-center gap-1 text-[11px] font-bold text-destructive bg-destructive/15 border border-destructive/30 px-2 py-1 rounded mt-1 select-none animate-pulse">
                                                 <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
                                                 VIRAL INFECTION (Lethal)
                                             </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500 bg-emerald-950/20 border border-emerald-500/10 px-2 py-1 rounded mt-1 select-none">
                                                Healthy
                                            </span>
                                        )}
                                    </div>

                                    {/* Progression details */}
                                    <div className="space-y-1.5">
                                        <span className="text-[10px] uppercase text-muted-foreground block">Combat Skills</span>
                                         <div className="bg-background/40 p-2 rounded border border-[var(--hairline)] space-y-1 text-[11px]">
                                            <div className="flex justify-between">
                                                <span>Melee Lvl</span>
                                                <span className="font-bold text-emerald-400">{selectedChar.meleeLvl ?? 0}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Ranged Lvl</span>
                                                <span className="font-bold text-emerald-400">{selectedChar.rangedLvl ?? 0}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Crafting Lvl</span>
                                                <span className="font-bold text-emerald-400">{selectedChar.craftingLvl ?? 0}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Delete Character Button */}
                                    <Button
                                        onClick={() => handleDeleteCharacter(selectedChar.id)}
                                        className="w-full py-2.5 text-xs font-bold uppercase tracking-wider mt-4 bg-red-950/40 hover:bg-red-900 border border-red-500/30 hover:border-red-500 text-red-400 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Delete Character
                                    </Button>
                                </div>
                            ) : (
                                <div className="h-32 flex items-center justify-center text-center">
                                    <p className="text-muted-foreground/60 text-xs italic">Select a character from the registry to view details.</p>
                                </div>
                            )}
                        </div>

                        {mode === 'select' && (
                            <Button
                                disabled={!selectedChar}
                                onClick={handleConfirmSelection}
                                className={`w-full py-4 text-sm font-bold uppercase tracking-wider mt-4 ${
                                    selectedChar ? 'metal-button-green' : 'opacity-40 cursor-not-allowed'
                                }`}
                            >
                                Confirm & Start
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Character Creator Modal Overlay */}
            {showCreator && (
                <CharacterCreator
                    onConfirm={handleCreateCharacter}
                    onCancel={() => setShowCreator(false)}
                    confirmLabel="Create"
                />
            )}
        </div>
    );
}
