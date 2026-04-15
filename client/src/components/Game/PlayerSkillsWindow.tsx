import React from 'react';
import PlayerSkillsUI from "./PlayerSkillsUI";
import { GridSizeProvider } from "@/contexts/GridSizeContext";

interface PlayerSkillsWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PlayerSkillsWindow({
  isOpen,
  onClose
}: PlayerSkillsWindowProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Backdrop covers only map area */}
      <div
        className="absolute left-0 w-1/2 bg-black/50 pointer-events-auto transition-opacity duration-300"
        style={{
          top: '48px',
          bottom: '72px',
          height: 'calc(100vh - 120px)'
        }}
        onClick={onClose}
      />

      {/* Skills panel container */}
      <GridSizeProvider>
        <div
          className="absolute left-0 w-1/2 bg-card border-r border-border flex flex-col p-4 overflow-hidden pointer-events-auto shadow-2xl"
          style={{
            top: '48px',
            bottom: '72px',
            height: 'calc(100vh - 120px)'
          }}
          data-testid="player-skills-window"
        >
          <PlayerSkillsUI />
        </div>
      </GridSizeProvider>
    </div>
  );
}
