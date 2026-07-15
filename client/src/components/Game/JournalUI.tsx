import React, { useState, useEffect } from 'react';
import engine from '@/game/GameEngine';
import { BookOpen, CheckCircle, ChevronDown, ChevronUp, AlertCircle, Circle, X } from 'lucide-react';
import { cn } from "@/lib/utils";

export const JournalUI = ({ onClose }: { onClose: () => void }) => {
  const [expandedQuestId, setExpandedQuestId] = useState<string | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const forceUpdate = () => setTick(t => t + 1);
    engine.on('update', forceUpdate);
    engine.on('sync', forceUpdate);
    if (engine.questState) {
      engine.questState.on('questStateChanged', forceUpdate);
    }
    return () => {
      engine.off('update', forceUpdate);
      engine.off('sync', forceUpdate);
      if (engine.questState) {
        engine.questState.off('questStateChanged', forceUpdate);
      }
    };
  }, []);

  const quests = engine.gameMap?.metadata?.questRegistry?.quests || [];
  const activeQuests = Object.values(engine.questState?.activeQuests || {});
  const completedQuestIds = engine.questState?.completedQuests || [];

  const toggleExpand = (questId: string) => {
    setExpandedQuestId(prev => prev === questId ? null : questId);
  };

  return (
    <div className="flex flex-col h-full bg-background/40 rounded-lg overflow-hidden border border-border/50 backdrop-blur-sm">
      {/* Header */}
      <div className="p-2 px-3 border-b border-border bg-card/30 flex items-center justify-between gap-2.5 shrink-0 select-none">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
            <BookOpen className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">Survivor's Journal</h2>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-md bg-secondary/40 border border-primary/20 hover:bg-primary/15 transition-colors"
          title="Close Journal"
        >
          <X className="w-4 h-4 text-primary" />
        </button>
      </div>

      {/* Main scrollable list */}
      <div className="flex-1 p-3 flex flex-col gap-3 h-full overflow-y-auto select-none">
        {activeQuests.length === 0 && completedQuestIds.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
            <AlertCircle className="w-8 h-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm font-semibold text-foreground/80">No Quests Active</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {/* Active Quests Section */}
            {activeQuests.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary/80 px-1">Active Objectives</h3>
                {activeQuests.map((active: any) => {
                  const def = quests.find(q => q.id === active.questId);
                  if (!def) return null;
                  const isExpanded = expandedQuestId === def.id;
                  const currentTask = def.tasks?.[active.currentTaskIndex];
                  const completedTasks = def.tasks?.slice(0, active.currentTaskIndex) || [];

                  return (
                    <div key={def.id} className="bg-card/35 rounded-lg border border-border/40 overflow-hidden transition-all duration-300">
                      {/* Accordion Header */}
                      <div
                        onClick={() => toggleExpand(def.id)}
                        className="p-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-card/60 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-foreground truncate">{def.title}</h4>
                          {!isExpanded && currentTask && (
                            <p className="text-[10px] text-primary/90 mt-0.5 flex items-center gap-1.5 font-medium">
                              <Circle className="w-2.5 h-2.5 text-primary shrink-0 animate-pulse" />
                              <span className="truncate">{currentTask.text}</span>
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 text-muted-foreground">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>

                      {/* Accordion Content */}
                      {isExpanded && (
                        <div className="p-3 pt-0 border-t border-border/20 bg-card/10 flex flex-col gap-2.5">
                          {def.description && (
                            <p className="text-xs text-muted-foreground italic leading-relaxed pt-2.5">
                              {def.description}
                            </p>
                          )}
                          
                          <div className={cn("flex flex-col gap-1.5", def.description && "pt-1")}>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80">Tasks Checklist:</span>
                            
                            {/* Completed tasks list */}
                            {completedTasks.map((t: any, idx: number) => (
                              <div key={t.id || idx} className="flex items-start gap-2 text-xs text-muted-foreground/70 line-through">
                                <CheckCircle className="w-3.5 h-3.5 text-green-500/70 shrink-0 mt-0.5" />
                                <span>{t.text}</span>
                              </div>
                            ))}

                            {/* Current active task */}
                            {currentTask ? (
                              <div className="flex items-start gap-2 text-xs text-foreground font-semibold">
                                <Circle className="w-3.5 h-3.5 text-primary animate-pulse shrink-0 mt-0.5" />
                                <span className="text-primary">{currentTask.text}</span>
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground italic">No current tasks.</div>
                            )}

                            {/* Future tasks (not started yet) */}
                            {(def.tasks || []).slice(active.currentTaskIndex + 1).map((t: any, idx: number) => (
                              <div key={t.id || idx + active.currentTaskIndex + 1} className="flex items-start gap-2 text-xs text-muted-foreground/40">
                                <Circle className="w-3.5 h-3.5 text-muted-foreground/20 shrink-0 mt-0.5" />
                                <span>{t.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Completed Quests Section */}
            {completedQuestIds.length > 0 && (
              <div className="flex flex-col gap-2 mt-2">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-green-500/80 px-1">Completed Quests</h3>
                {completedQuestIds.map((questId: string) => {
                  const def = quests.find(q => q.id === questId);
                  const title = def ? def.title : questId;
                  const isExpanded = expandedQuestId === questId;

                  return (
                    <div key={questId} className="bg-card/10 rounded-lg border border-border/20 overflow-hidden transition-all duration-300 opacity-75">
                      <div
                        onClick={() => toggleExpand(questId)}
                        className="p-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-card/20 transition-colors"
                      >
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                          <h4 className="text-xs font-bold text-muted-foreground line-through truncate">{title}</h4>
                        </div>
                        <div className="shrink-0 text-muted-foreground">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>

                      {isExpanded && def && (
                        <div className="p-3 pt-0 border-t border-border/20 bg-card/5">
                          {def.description && (
                            <p className="text-xs text-muted-foreground italic leading-relaxed pt-2.5 mb-2">
                              {def.description}
                            </p>
                          )}
                          <div className="flex flex-col gap-1.5 pt-1">
                            {def.tasks?.map((t: any, idx: number) => (
                              <div key={t.id || idx} className="flex items-start gap-2 text-xs text-muted-foreground/60 line-through">
                                <CheckCircle className="w-3.5 h-3.5 text-green-500/50 shrink-0 mt-0.5" />
                                <span>{t.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
