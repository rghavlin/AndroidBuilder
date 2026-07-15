import React, { useRef, useEffect } from 'react';
import { useLog } from '../../contexts/LogContext';
import { cn } from "@/lib/utils";
import { useTheme } from '../../contexts/ThemeContext';

interface GameEventLogProps {
    onClick: () => void;
    className?: string;
}

const getLogColor = (type: string, originalColor: string, theme: string) => {
    if (!theme.startsWith('dark')) {
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

export default function GameEventLog({ onClick, className }: GameEventLogProps) {
    const { logs } = useLog();
    const { theme } = useTheme();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new logs arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    // Show only last 4 logs in mini-view
    const displayLogs = logs.slice(-4);

    return (
        <div 
            onClick={onClick}
            className={cn(
                "w-[180px] min-w-[120px] shrink ml-4 mr-2 h-[52px] rounded-md px-3 py-1.5 cursor-pointer transition-colors overflow-hidden group relative flex items-center shadow-inner",
                !theme.startsWith('dark')
                    ? "bg-zinc-100 hover:bg-zinc-200/90 border border-zinc-200 text-zinc-800"
                    : "bg-black/60 hover:bg-black/80 border border-white/5 text-white",
                className
            )}
            title="Click to view full log history"
        >
            <div 
                ref={scrollRef}
                className="h-full w-full overflow-y-auto scrollbar-hide pointer-events-none"
            >
                {displayLogs.length === 0 ? (
                    <div className="text-[10px] text-zinc-500 italic mt-0.5">
                        Waiting for events...
                    </div>
                ) : (
                    displayLogs.map((log) => (
                        <div 
                            key={log.id} 
                            className="text-[10px] leading-tight truncate animate-in fade-in slide-in-from-bottom-1 duration-300 flex items-center"
                            style={{ color: getLogColor(log.type, log.color, theme) }}
                        >
                            <span className={cn("font-mono mr-1.5 shrink-0", !theme.startsWith('dark') ? "text-zinc-500" : "opacity-40")}>[{log.timestamp}]</span>
                            <span className={cn("font-bold uppercase mr-1.5 text-[9px] shrink-0", !theme.startsWith('dark') ? "opacity-90" : "opacity-60")}>{log.type}</span>
                            <span className="truncate font-semibold">{log.message}</span>
                        </div>
                    ))
                )}
            </div>
            
            {/* Hover indicator */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] text-zinc-400 font-bold">HISTORY</span>
            </div>
        </div>
    );
}
