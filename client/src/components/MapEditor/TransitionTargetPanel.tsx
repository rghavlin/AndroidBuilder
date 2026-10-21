import React from 'react';

/**
 * Where an exit arrow or stairs item leads (the transition fields in
 * game/inventory/transitionFields.js). One panel for both, used by the Item
 * tool, the Transition tool and the tile inspector's Edit dialog.
 */
export interface TransitionTarget {
  transitionTargetType?: string;
  transitionTargetId?: string;
  transitionTargetX?: number;
  transitionTargetY?: number;
  transitionLevel?: number;
}

const TYPE_OPTIONS: { id: string; label: string }[] = [
  { id: 'next', label: 'Next map (road chain)' },
  { id: 'previous', label: 'Previous map (road chain)' },
  { id: 'scenario', label: 'Scenario' },
  { id: 'generator', label: 'Generator' },
  { id: 'tutorial_end', label: 'Tutorial end' },
];

const inputStyle: React.CSSProperties = {
  background: '#1a1a1a', border: '1px solid #444', color: '#eee', padding: '4px 6px', borderRadius: 4, fontSize: 12,
};
const label: React.CSSProperties = { fontSize: 11, color: '#888' };
const num = (v: string) => (v === '' ? undefined : Number(v));

interface Props {
  value: TransitionTarget;
  onChange: (v: TransitionTarget) => void;
  scenarios: { name: string }[];
  generators: readonly string[];
}

export const TransitionTargetPanel: React.FC<Props> = ({ value, onChange, scenarios, generators }) => {
  const type = value.transitionTargetType || 'scenario';
  const set = (patch: TransitionTarget) => onChange({ ...value, ...patch });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ ...label, color: '#7bb8ff', fontWeight: 'bold' }}>Leads to</label>
      <select
        value={type}
        onChange={e => onChange({ transitionTargetType: e.target.value, transitionTargetX: value.transitionTargetX, transitionTargetY: value.transitionTargetY })}
        style={{ ...inputStyle, width: '100%' }}
      >
        {TYPE_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>

      {(type === 'scenario' || type === 'generator') && (
        <select value={value.transitionTargetId || ''} onChange={e => set({ transitionTargetId: e.target.value || undefined })} style={{ ...inputStyle, width: '100%' }}>
          <option value="">— Select {type} —</option>
          {type === 'scenario'
            ? scenarios.map(s => <option key={s.name} value={s.name}>{s.name}</option>)
            : generators.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      )}

      {type === 'generator' && (
        <>
          <label style={label}>Level (scaling)</label>
          <input type="number" min={1} value={value.transitionLevel ?? 1} onChange={e => set({ transitionLevel: num(e.target.value) })} style={inputStyle} />
        </>
      )}

      {type !== 'tutorial_end' && (
        <div style={{ display: 'flex', gap: 6 }}>
          {(['transitionTargetX', 'transitionTargetY'] as const).map(k => (
            <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
              <label style={label}>Arrive at {k === 'transitionTargetX' ? 'X' : 'Y'}</label>
              <input type="number" min={0} placeholder="default" value={value[k] ?? ''} onChange={e => set({ [k]: num(e.target.value) })} style={{ ...inputStyle, width: '100%' }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
