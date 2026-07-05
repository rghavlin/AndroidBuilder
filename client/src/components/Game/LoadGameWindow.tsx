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

interface DisplaySlot {
    slotId: string;
    label: string;
    description: string;
    saveData: SaveSlot | null;
}

interface LoadGameWindowProps {
    onClose: () => void;
    // Invoked with the chosen slot name. Should return a promise that resolves
    // when the load attempt is complete (used to drive the loading state).
    onLoad: (slotName: string) => void | Promise<void>;
}

const formatTimestamp = (ts: number) =>
    new Date(ts).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });

export default function LoadGameWindow({ onClose, onLoad }: LoadGameWindowProps) {
    const { theme } = useTheme();
    const isLight = theme !== 'dark';

    const defaultSlots: DisplaySlot[] = [
        { slotId: 'autosave', label: 'Slot 1: Autosave', description: 'Most Recent Save', saveData: null },
        { slotId: 'autosave_backup', label: 'Slot 2: Autosave Backup', description: 'Backup', saveData: null },
        { slotId: 'manual_1', label: 'Manual Slot 1', description: 'Manual Save', saveData: null },
        { slotId: 'manual_2', label: 'Manual Slot 2', description: 'Manual Save', saveData: null }
    ];

    const [slots, setSlots] = useState<DisplaySlot[]>(defaultSlots);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingSlot, setLoadingSlot] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const loadSlots = async () => {
            try {
                const allSlots: SaveSlot[] = await GameSaveSystem.listSaveSlots();

                const autosave = allSlots.find(s => s.slotName === 'autosave') || null;
                
                // Fallback search for legacy backups if 'autosave_backup' doesn't exist
                const backup = allSlots.find(s => s.slotName === 'autosave_backup') || 
                               allSlots.find(s => s.slotName === 'autosave_backup_1') || 
                               allSlots.find(s => s.slotName === 'autosave_backup_2') || 
                               allSlots.find(s => s.slotName === 'autosave_backup_3') || 
                               null;
                
                const manual1 = allSlots.find(s => s.slotName === 'manual_1') || null;
                const manual2 = allSlots.find(s => s.slotName === 'manual_2') || null;

                const displaySlots: DisplaySlot[] = [
                    { slotId: 'autosave', label: 'Slot 1: Autosave', description: 'Most Recent Save', saveData: autosave },
                    { slotId: 'autosave_backup', label: 'Slot 2: Autosave Backup', description: 'Backup', saveData: backup },
                    { slotId: 'manual_1', label: 'Manual Slot 1', description: 'Manual Save', saveData: manual1 },
                    { slotId: 'manual_2', label: 'Manual Slot 2', description: 'Manual Save', saveData: manual2 }
                ];

                if (!cancelled) setSlots(displaySlots);
            } catch (e) {
                console.warn('[LoadGameWindow] Failed to list save slots:', e);
                if (!cancelled) setSlots(defaultSlots);
            }
        };
        loadSlots();
        return () => { cancelled = true; };
    }, []);

    const handleLoad = async (slotName: string) => {
        if (isLoading) return;
        setIsLoading(true);
        setLoadingSlot(slotName);
        try {
            await onLoad(slotName);
        } finally {
            // Parent typically unmounts this window on success; reset state in case it doesn't.
            setIsLoading(false);
            setLoadingSlot(null);
        }
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
                        Load Game
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 pb-8">
                    {slots.map((slot) => {
                        const hasSave = slot.saveData !== null;
                        const actualSlotName = slot.saveData?.slotName || slot.slotId;
                        return (
                            <Button
                                key={slot.slotId}
                                onClick={() => hasSave && handleLoad(actualSlotName)}
                                disabled={isLoading || !hasSave}
                                className={`w-full py-4 text-sm font-bold metal-button uppercase tracking-wide flex-col items-center justify-center gap-1 h-auto ${
                                    hasSave ? 'opacity-90 hover:opacity-100' : 'opacity-40 cursor-not-allowed'
                                }`}
                                data-testid={`button-load-slot-${slot.slotId}`}
                            >
                                <div>
                                    {loadingSlot === actualSlotName ? 'Loading...' : slot.label}
                                </div>
                                <div className={`text-xs font-normal normal-case tracking-normal ${isLight ? 'text-zinc-500' : 'text-slate-400'}`}>
                                    {hasSave && slot.saveData ? (
                                        <>
                                            {formatTimestamp(slot.saveData.timestamp)}
                                            {slot.saveData.turn ? ` • Turn ${slot.saveData.turn}` : ''}
                                            {` (${slot.description})`}
                                        </>
                                    ) : (
                                        `Empty (${slot.description})`
                                    )}
                                </div>
                            </Button>
                        );
                    })}
                </CardContent>
            </Card>
        </div>
    );
}
