import React, { useState } from 'react';

interface ZombieGeneratorModalProps {
  initialDensity?: 'sparse' | 'normal' | 'dense';
  initialSeed?: string;
  isGenerating?: boolean;
  onGenerate: (density: 'sparse' | 'normal' | 'dense', seed: string) => void;
  onClose: () => void;
}

const btnStyle = (bg: string, disabled = false): React.CSSProperties => ({
  background: bg,
  color: '#eee',
  border: '1px solid rgba(255,255,255,0.15)',
  padding: '6px 12px',
  borderRadius: 4,
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontSize: 12,
  opacity: disabled ? 0.6 : 1,
});

const inputStyle: React.CSSProperties = {
  background: '#1a1a1a',
  border: '1px solid #444',
  color: '#eee',
  padding: '6px 10px',
  borderRadius: 4,
  fontSize: 12,
};

export const ZombieGeneratorModal: React.FC<ZombieGeneratorModalProps> = ({
  initialDensity = 'normal',
  initialSeed = '',
  isGenerating = false,
  onGenerate,
  onClose,
}) => {
  const [density, setDensity] = useState<'sparse' | 'normal' | 'dense'>(initialDensity);
  const [seed, setSeed] = useState(() => initialSeed || Math.floor(Math.random() * 1000000).toString());

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#222',
          border: '1px solid #555',
          borderRadius: 8,
          padding: 16,
          minWidth: 320,
          maxHeight: '80vh',
          overflow: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 12px', fontSize: 16, color: '#c070ff' }}>🧟 Spawn Ambient Zombies</h3>
        <p style={{ fontSize: 12, color: '#aaa', marginBottom: 16 }}>
          This will spawn random zombies both outdoors and inside buildings. They will be merged with any existing zombies on the map.
        </p>

        {/* Zombie Density Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: '#888', fontWeight: 'bold' }}>Zombie Density</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { id: 'sparse', label: 'Sparse' },
              { id: 'normal', label: 'Normal' },
              { id: 'dense', label: 'Dense' },
            ].map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setDensity(opt.id as any)}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  background: density === opt.id ? '#4a90d9' : '#333',
                  color: '#eee',
                  border: density === opt.id ? '2px solid #7bb8ff' : '1px solid #555',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: density === opt.id ? 'bold' : 'normal',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Seed Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: '#888', fontWeight: 'bold' }}>RNG Seed</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="text"
              value={seed}
              onChange={e => setSeed(e.target.value.replace(/[^0-9-]/g, ''))}
              placeholder="Enter number seed"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              type="button"
              onClick={() => setSeed(Math.floor(Math.random() * 10000000).toString())}
              style={btnStyle('#555')}
            >
              🎲 Random
            </button>
          </div>
        </div>

        {/* Confirm / Cancel Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onGenerate(density, seed)}
            disabled={isGenerating}
            style={{ ...btnStyle('#2b9a7a'), flex: 1, padding: '10px' }}
          >
            {isGenerating ? 'Spawning...' : 'Spawn'}
          </button>
          <button
            onClick={onClose}
            disabled={isGenerating}
            style={{ ...btnStyle('#555'), flex: 1, padding: '10px' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
