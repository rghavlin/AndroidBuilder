import React, { useRef, useEffect } from 'react';
import { useLog } from '../../contexts/LogContext';
import { cn } from "@/lib/utils";
import { History, X, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface LogHistoryWindowProps {
    onClose: () => void;
}

export default function LogHistoryWindow({ onClose }: LogHistoryWindowProps) {
    const { logs } = useLog();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom only if it was already at the bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="flex flex-col h-full bg-background/50 rounded-lg overflow-hidden border border-border">
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
                className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-black/20"
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
                                className="border-b border-white/5 pb-2 last:border-0"
                            >
                                <div className="flex items-start gap-3">
                                    <span className="text-[10px] font-mono text-zinc-500 pt-0.5 shrink-0">
                                        [{log.timestamp}]
                                    </span>
                                    <div 
                                        className="text-xs leading-relaxed break-words font-medium"
                                        style={{ color: log.color }}
                                    >
                                        <span className="opacity-60 text-[10px] uppercase font-bold mr-2">
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
