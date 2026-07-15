import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";
import { GameSaveSystem } from '@/game/GameSaveSystem';
import { useTheme } from '../../contexts/ThemeContext';

interface SaveSlot {
    slotName: string;
    timestamp: number;
    turn?: number;
    version?: string;
}

interface SaveGameWindowProps {
    onClose: () => void;
    onSave: (slotName: string) => void | Promise<void>;
}

const formatTimestamp = (ts: number) =>
    new Date(ts).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });

export default function SaveGameWindow({ onClose, onSave }: SaveGameWindowProps) {
    const [manual1Save, setManual1Save] = useState<SaveSlot | null>(null);
    const [manual2Save, setManual2Save] = useState<SaveSlot | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [savingSlot, setSavingSlot] = useState<string | null>(null);
    const { theme } = useTheme();
    const isLight = !theme.startsWith('dark');

    const loadSlots = async () => {
        try {
            const allSlots: SaveSlot[] = await GameSaveSystem.listSaveSlots();
            const m1 = allSlots.find(s => s.slotName === 'manual_1') || null;
            const m2 = allSlots.find(s => s.slotName === 'manual_2') || null;
            setManual1Save(m1);
            setManual2Save(m2);
        } catch (e) {
            console.warn('[SaveGameWindow] Failed to list save slots:', e);
        }
    };

    useEffect(() => {
        loadSlots();
    }, []);

    const handleSave = async (slotName: string) => {
        if (isLoading) return;
        setIsLoading(true);
        setSavingSlot(slotName);
        try {
            await onSave(slotName);
            onClose();
        } catch (error) {
            console.error('[SaveGameWindow] Save error:', error);
        } finally {
            setIsLoading(false);
            setSavingSlot(null);
        }
    };

    const renderSlotButton = (slotName: string, slotLabel: string, saveInfo: SaveSlot | null) => {
        return (
            <Button
                onClick={() => handleSave(slotName)}
                disabled={isLoading}
                className="w-full py-5 text-sm font-bold metal-button uppercase tracking-wide flex-col items-center justify-center gap-1 h-auto opacity-90 hover:opacity-100"
                data-testid={`button-save-slot-${slotName}`}
            >
                <div>
                    {savingSlot === slotName ? 'Saving...' : slotLabel}
                </div>
                <div className={`text-xs font-normal normal-case tracking-normal ${isLight ? 'text-zinc-500' : 'text-slate-400'}`}>
                    {saveInfo ? (
                        <>
                            {formatTimestamp(saveInfo.timestamp)}
                            {saveInfo.turn ? ` • Turn ${saveInfo.turn}` : ''}
                        </>
                    ) : (
                        'Empty / New Save'
                    )}
                </div>
            </Button>
        );
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-auto">
            <Card className="w-96 metal-panel border-border shadow-2xl relative">
                <Button
                    className="absolute right-2 top-2 h-6 w-6 p-0 rounded-full"
                    variant="ghost"
                    onClick={onClose}
                    disabled={isLoading}
                    title="Close"
                >
                    <X className="h-4 w-4" />
                </Button>
                <CardHeader className="text-center pt-8 pb-2">
                    <CardTitle className="text-3xl font-black text-foreground drop-shadow-md tracking-wider uppercase">
                        Save Game
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 pb-8">
                    {renderSlotButton('manual_1', 'Manual Slot 1', manual1Save)}
                    {renderSlotButton('manual_2', 'Manual Slot 2', manual2Save)}
                </CardContent>
            </Card>
        </div>
    );
}
