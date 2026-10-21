import React, { useState } from 'react';
import { EDITOR_TEMPLATE_CHOICES } from '@/game/config/TemplateConfig';

interface GenerateTemplateModalProps {
  onGenerate: (templateId: string, keepEvents: boolean) => void;
  onClose: () => void;
}

const btnStyle = (bg: string): React.CSSProperties => ({
  background: bg,
  color: '#eee',
  border: '1px solid rgba(255,255,255,0.15)',
  padding: '6px 12px',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 12,
});

export const GenerateTemplateModal: React.FC<GenerateTemplateModalProps> = ({ onGenerate, onClose }) => {
  const [keepEvents, setKeepEvents] = useState(true);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}>
      <div style={{ background: '#222', border: '1px solid #555', borderRadius: 8, padding: 16, minWidth: 320, maxHeight: '80vh', overflow: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16, color: '#7bb8ff' }}>Generate Map Template</h3>
        <p style={{ fontSize: 12, color: '#aaa', marginBottom: 12 }}>Select a map template to procedurally generate. This will overwrite the current map layout!</p>
        <label style={{ display: 'flex', gap: 6, alignItems: 'flex-start', fontSize: 12, color: '#ddd', marginBottom: 12 }}>
          <input type="checkbox" checked={keepEvents} onChange={e => setKeepEvents(e.target.checked)} />
          <span>
            Keep this map's name, events, quests, entities and settings
            <span style={{ display: 'block', color: '#888', fontSize: 11 }}>
              Player, NPCs, triggers, transitions and event items stay at their coordinates; ordinary loot and signs come from the new layout.
            </span>
          </span>
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {EDITOR_TEMPLATE_CHOICES.map(t => (
            <button
              key={t.id}
              onClick={() => onGenerate(t.id, keepEvents)}
              style={{
                padding: '8px 12px',
                background: '#333',
                border: '1px solid #555',
                borderRadius: 4,
                color: '#ddd',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: 13,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#444')}
              onMouseLeave={e => (e.currentTarget.style.background = '#333')}
            >
              <span>{t.name}</span>
              <span style={{ color: '#888', fontSize: 10 }}>{t.id}</span>
            </button>
          ))}
        </div>
        <button onClick={onClose}
          style={{ ...btnStyle('#555'), marginTop: 16, width: '100%' }}>Cancel</button>
      </div>
    </div>
  );
};
