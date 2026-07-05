import React, { useRef, useEffect } from 'react';
import { useLog } from '../../contexts/LogContext';
import { cn } from "@/lib/utils";
import { History, X, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useTheme } from '../../contexts/ThemeContext';

interface LogHistoryWindowProps {
    onClose: () => void;
}

const getLogColor = (type: string, originalColor: string, theme: string) => {
    if (theme !== 'dark') {
        switch (type) {
            case 'combat':
            case 'warning':
                return '#C15C5C'; // Coral Red
            case 'item':
                return '#639A88'; // Sage Green
            case 'world':
                return '#5C8AB3'; // Police Blue
            case 'system':
            default:
                return '#3f3f46'; // Dark charcoal text
        }
    }
    return originalColor;
};

export default function LogHistoryWindow({ onClose }: LogHistoryWindowProps) {
    const { logs } = useLog();
    const { theme } = useTheme();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom only if it was already at the bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className={cn(
            "flex flex-col h-full rounded-lg overflow-hidden border border-border",
            theme !== 'dark' ? "bg-background shadow-lg" : "bg-background/50"
        )}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-card/30 p-4">
                <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" />
                    <h2 className="text-sm font-bold uppercase tracking-wider">Event History</h2>
                </div>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={onClose}
                    className="h-8 w-8 hover:bg-card/80"
                >
                    <X className="w-4 h-4" />
                </Button>
            </div>

            {/* Content: List of logs */}
            <div 
                ref={scrollRef}
                className={cn(
                    "flex-1 overflow-y-auto p-4 custom-scrollbar",
                    theme !== 'dark' ? "bg-zinc-50" : "bg-black/20"
                )}
            >
                {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                        <Clock className="w-8 h-8 opacity-20" />
                        <p className="text-xs italic truncate">No history recorded yet.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {logs.map((log) => (
                            <div 
                                key={log.id} 
                                className={cn(
                                    "border-b pb-2 last:border-0",
                                    theme !== 'dark' ? "border-zinc-200/60" : "border-white/5"
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <span className={cn("text-[10px] font-mono pt-0.5 shrink-0", theme !== 'dark' ? "text-zinc-400" : "text-zinc-500")}>
                                        [{log.timestamp}]
                                    </span>
                                    <div 
                                        className="text-xs leading-relaxed break-words font-semibold"
                                        style={{ color: getLogColor(log.type, log.color, theme) }}
                                    >
                                        <span className={cn("text-[10px] uppercase font-black mr-2", theme !== 'dark' ? "opacity-90" : "opacity-60")}>
                                            {log.type}
                                        </span>
                                        <span>{log.message}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-border bg-secondary/5 text-right">
                <p className="text-[10px] text-muted-foreground italic truncate">
                    Showing last {logs.length} events
                </p>
            </div>
        </div>
    );
}
