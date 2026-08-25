import React, { useState } from 'react';

export type LootGeneratorMode = 'standard' | 'corridor';
export type LootAmount = 'lots' | 'some' | 'little';

interface LootGeneratorModalProps {
  initialAmount?: LootAmount;
  initialMode?: LootGeneratorMode;
  initialSeed?: string;
  isGenerating?: boolean;
  onGenerate: (amount: LootAmount, seed: string, mode: LootGeneratorMode) => void;
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

export const LootGeneratorModal: React.FC<LootGeneratorModalProps> = ({
  initialAmount = 'some',
  initialMode = 'standard',
  initialSeed = '',
  isGenerating = false,
  onGenerate,
  onClose,
}) => {
  const [mode, setMode] = useState<LootGeneratorMode>(initialMode);
  const [amount, setAmount] = useState<LootAmount>(initialAmount);
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
          minWidth: 340,
          maxWidth: 420,
          maxHeight: '85vh',
          overflow: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 12px', fontSize: 16, color: '#7bb8ff' }}>🎲 Generate Ambient Loot</h3>
        <p style={{ fontSize: 12, color: '#aaa', marginBottom: 16, lineHeight: 1.4 }}>
          {mode === 'corridor'
            ? 'Special loot generator for corridor travel roads. Spawns sparse items (mostly sticks & stones). Food, water, and weapons are extremely rare. No wild crops, mowers, generators, or wagons.'
            : 'Populates buildings and outdoor areas with standard survival items. Items will be merged with any existing loot on the tiles.'}
        </p>

        {/* Generator Profile / Map Type Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: '#888', fontWeight: 'bold' }}>Map Type</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { id: 'standard', label: '🏘️ Standard Map' },
              { id: 'corridor', label: '🛣️ Corridor Map' },
            ].map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setMode(opt.id as LootGeneratorMode)}
                style={{
                  flex: 1,
                  padding: '8px 6px',
                  background: mode === opt.id ? '#316999' : '#333',
                  color: '#eee',
                  border: mode === opt.id ? '2px solid #7bb8ff' : '1px solid #555',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: mode === opt.id ? 'bold' : 'normal',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loot Amount Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: '#888', fontWeight: 'bold' }}>Loot Amount</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { id: 'lots', label: 'Lots' },
              { id: 'some', label: 'Some' },
              { id: 'little', label: 'A Little' },
            ].map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setAmount(opt.id as LootAmount)}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  background: amount === opt.id ? '#4a90d9' : '#333',
                  color: '#eee',
                  border: amount === opt.id ? '2px solid #7bb8ff' : '1px solid #555',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: amount === opt.id ? 'bold' : 'normal',
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
            onClick={() => onGenerate(amount, seed, mode)}
            disabled={isGenerating}
            style={{ ...btnStyle('#2b9a7a'), flex: 1, padding: '10px', fontWeight: 'bold' }}
          >
            {isGenerating ? 'Generating...' : 'Generate'}
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
