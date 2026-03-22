import React, { useRef, useEffect } from 'react';
import { useLog } from '../../contexts/LogContext';
import { cn } from "@/lib/utils";

interface GameEventLogProps {
    onClick: () => void;
    className?: string;
}

export default function GameEventLog({ onClick, className }: GameEventLogProps) {
    const { logs } = useLog();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new logs arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    // Show only last 3 logs in mini-view
    const displayLogs = logs.slice(-3);

    return (
        <div 
            onClick={onClick}
            className={cn(
                "flex-1 mx-4 h-9 bg-black/40 border border-white/10 rounded-md px-3 py-1 cursor-pointer hover:bg-black/60 transition-colors overflow-hidden group relative",
                className
            )}
            title="Click to view full log history"
        >
            <div 
                ref={scrollRef}
                className="h-full overflow-y-auto no-scrollbar pointer-events-none"
            >
                {displayLogs.length === 0 ? (
                    <div className="text-[10px] text-zinc-500 italic mt-0.5">
                        Waiting for events...
                    </div>
                ) : (
                    displayLogs.map((log) => (
                        <div 
                            key={log.id} 
                            className="text-[10px] leading-tight truncate animate-in fade-in slide-in-from-bottom-1 duration-300"
                            style={{ color: log.color }}
                        >
                            <span className="opacity-40 font-mono mr-1.5">{log.timestamp}</span>
                            <span>{log.message}</span>
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
