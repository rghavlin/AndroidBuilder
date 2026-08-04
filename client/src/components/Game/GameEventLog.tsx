import React, { useRef, useEffect, useState } from 'react';
import { useLog } from '../../contexts/LogContext';
import { cn, isLightTheme } from "@/lib/utils";
import { useTheme } from '../../contexts/ThemeContext';
import { Terminal, Minus, Maximize2 } from 'lucide-react';

interface GameEventLogProps {
    onMaximize: () => void;
    className?: string;
}

const getLogColor = (type: string, originalColor: string, theme: string) => {
    if (isLightTheme(theme)) {
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

export default function GameEventLog({ onMaximize, className }: GameEventLogProps) {
    const { logs } = useLog();
    const { theme } = useTheme();
    const scrollRef = useRef<HTMLDivElement>(null);

    const [isMinimized, setIsMinimized] = useState(() => {
        const saved = localStorage.getItem('game_log_minimized');
        return saved === 'true';
    });

    const [lastSeenLogCount, setLastSeenLogCount] = useState(logs.length);

    useEffect(() => {
        if (!isMinimized) {
            setLastSeenLogCount(logs.length);
        }
    }, [logs.length, isMinimized]);

    // Auto-scroll to bottom when new logs arrive or when expanded
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs.length, isMinimized]);

    const toggleMinimized = () => {
        setIsMinimized(prev => {
            const next = !prev;
            localStorage.setItem('game_log_minimized', String(next));
            return next;
        });
    };

    const preventPropagation = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const hasNewLogs = isMinimized && logs.length > lastSeenLogCount;
    // Show last 10 logs in the compact scrollable floating panel
    const displayLogs = logs.slice(-10);

    if (isMinimized) {
        return (
            <button
                onClick={(e) => {
                    preventPropagation(e);
                    toggleMinimized();
                }}
                onMouseDown={preventPropagation}
                onMouseUp={preventPropagation}
                onContextMenu={preventPropagation}
                className={cn(
                    "absolute bottom-4 left-4 z-30 px-2.5 py-1.5 rounded-md border shadow-md hover:scale-105 active:scale-95 transition-all select-none pointer-events-auto flex items-center gap-1.5 cursor-pointer",
                    isLightTheme(theme)
                        ? "bg-white/80 border-zinc-200 text-zinc-800 backdrop-blur-md hover:bg-zinc-100"
                        : "bg-black/60 border-white/10 text-white backdrop-blur-md hover:bg-black/80"
                )}
                title="Show activity log"
            >
                <div className="relative flex items-center justify-center">
                    <Terminal className="w-3 h-3" />
                    {hasNewLogs && (
                        <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse border border-background" />
                    )}
                </div>
                <span className="text-[8px] font-black uppercase tracking-wider">Log</span>
            </button>
        );
    }

    return (
        <div 
            onClick={preventPropagation}
            onMouseDown={preventPropagation}
            onMouseUp={preventPropagation}
            onContextMenu={preventPropagation}
            className={cn(
                "absolute bottom-4 left-4 z-30 w-48 h-[58px] flex flex-col rounded-md border shadow-lg backdrop-blur-md transition-all overflow-hidden select-none pointer-events-auto",
                isLightTheme(theme)
                    ? "bg-white/80 border-zinc-200 text-zinc-800"
                    : "bg-black/60 border-white/10 text-white",
                className
            )}
        >
            {/* Window Header */}
            <div className={cn(
                "flex items-center justify-between border-b px-2 py-0.5 shrink-0 h-[18px]",
                isLightTheme(theme) ? "border-zinc-200 bg-zinc-100/50" : "border-white/5 bg-black/30"
            )}>
                <div className="flex items-center gap-1">
                    <Terminal className={cn("w-2.5 h-2.5", isLightTheme(theme) ? "text-zinc-600" : "text-zinc-400")} />
                    <span className={cn("text-[8px] font-black uppercase tracking-wider", isLightTheme(theme) ? "text-zinc-700" : "text-zinc-300")}>
                        Log
                    </span>
                </div>
                <div className="flex items-center gap-0.5">
                    <button 
                        onClick={toggleMinimized}
                        className={cn(
                            "p-0.5 rounded transition-colors",
                            isLightTheme(theme) ? "hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900" : "hover:bg-white/10 text-zinc-400 hover:text-white"
                        )}
                        title="Minimize"
                    >
                        <Minus className="w-2.5 h-2.5" />
                    </button>
                    <button 
                        onClick={onMaximize}
                        className={cn(
                            "p-0.5 rounded transition-colors",
                            isLightTheme(theme) ? "hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900" : "hover:bg-white/10 text-zinc-400 hover:text-white"
                        )}
                        title="Maximize (View History)"
                    >
                        <Maximize2 className="w-2.5 h-2.5" />
                    </button>
                </div>
            </div>

            {/* Window Body */}
            <div 
                ref={scrollRef}
                className={cn(
                    "flex-1 overflow-y-auto px-2 py-1 scrollbar-hide space-y-0.5",
                    isLightTheme(theme) ? "scrollbar-thumb-zinc-300" : "scrollbar-thumb-zinc-700/50"
                )}
            >
                {displayLogs.length === 0 ? (
                    <div className={cn("text-[9px] italic mt-0.5", isLightTheme(theme) ? "text-zinc-400" : "text-zinc-500")}>
                        Waiting for events...
                    </div>
                ) : (
                    displayLogs.map((log) => (
                        <div 
                            key={log.id} 
                            className={cn(
                                "text-[9px] leading-tight break-words pb-0.5 border-b last:border-0",
                                isLightTheme(theme) ? "border-zinc-200/40" : "border-white/5"
                            )}
                            style={{ color: getLogColor(log.type, log.color, theme) }}
                        >
                            <span className={cn("font-mono mr-1 select-none text-[8px]", isLightTheme(theme) ? "text-zinc-400" : "opacity-40")}>
                                [{log.timestamp}]
                            </span>
                            <span className={cn("font-bold uppercase mr-1 text-[7.5px] select-none", isLightTheme(theme) ? "text-zinc-500" : "opacity-60")}>
                                {log.type}
                            </span>
                            <span className="font-semibold">{log.message}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
