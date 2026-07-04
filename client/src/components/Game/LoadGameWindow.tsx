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
    const [slots, setSlots] = useState<SaveSlot[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingSlot, setLoadingSlot] = useState<string | null>(null);
    const { theme } = useTheme();
    const isLight = theme === 'light';

    useEffect(() => {
        let cancelled = false;
        const loadSlots = async () => {
            try {
                const allSlots: SaveSlot[] = await GameSaveSystem.listSaveSlots();

                const autosave = allSlots.find(s => s.slotName === 'autosave') || null;
                const backups = allSlots
                    .filter(s => s.slotName.startsWith('autosave_backup_'))
                    .sort((a, b) => b.timestamp - a.timestamp);

                const ordered: SaveSlot[] = [];
                if (autosave) ordered.push(autosave);
                ordered.push(...backups);

                if (!cancelled) setSlots(ordered);
            } catch (e) {
                console.warn('[LoadGameWindow] Failed to list save slots:', e);
                if (!cancelled) setSlots([]);
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

    const labelFor = (slot: SaveSlot) =>
        slot.slotName === 'autosave' ? 'Most Recent Save' : 'Backup';

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
                    {slots.length === 0 ? (
                        <div className={`text-center text-sm py-4 ${isLight ? 'text-zinc-600' : 'text-slate-300 opacity-80'}`}>
                            No saved games found.
                        </div>
                    ) : (
                        slots.map((slot) => (
                            <Button
                                key={slot.slotName}
                                onClick={() => handleLoad(slot.slotName)}
                                disabled={isLoading}
                                className="w-full py-4 text-sm font-bold metal-button uppercase tracking-wide flex-col items-center justify-center gap-1 h-auto opacity-90 hover:opacity-100"
                                data-testid={`button-load-slot-${slot.slotName}`}
                            >
                                <div>{loadingSlot === slot.slotName ? 'Loading...' : labelFor(slot)}</div>
                                <div className={`text-xs font-normal normal-case tracking-normal ${isLight ? 'text-zinc-500' : 'text-slate-400'}`}>
                                    {formatTimestamp(slot.timestamp)}
                                    {slot.turn ? ` • Turn ${slot.turn}` : ''}
                                </div>
                            </Button>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
