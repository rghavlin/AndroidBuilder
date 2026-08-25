import React, { useState } from 'react';

export interface DecorationGeneratorConfig {
  outdoor: boolean;
  indoor: boolean;
  road: boolean;
  density: 'sparse' | 'normal' | 'dense';
  clearExisting: boolean;
  seed: number;
}

interface DecorationGeneratorModalProps {
  initialSeed?: string;
  isGenerating?: boolean;
  onGenerate: (config: DecorationGeneratorConfig) => void;
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

export const DecorationGeneratorModal: React.FC<DecorationGeneratorModalProps> = ({
  initialSeed = '',
  isGenerating = false,
  onGenerate,
  onClose,
}) => {
  const [outdoor, setOutdoor] = useState(true);
  const [indoor, setIndoor] = useState(true);
  const [road, setRoad] = useState(true);
  const [density, setDensity] = useState<'sparse' | 'normal' | 'dense'>('normal');
  const [clearExisting, setClearExisting] = useState(true);
  const [seedInput, setSeedInput] = useState(() =>
    initialSeed !== '' ? initialSeed : Math.floor(Math.random() * 10000000).toString()
  );

  const handleGenerate = () => {
    let finalSeed = parseInt(seedInput, 10);
    if (isNaN(finalSeed)) {
      finalSeed = (Math.random() * 0xffffffff) >>> 0;
    }
    onGenerate({
      outdoor,
      indoor,
      road,
      density,
      clearExisting,
      seed: finalSeed,
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        zIndex: 110,
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
          padding: 20,
          width: 360,
          maxHeight: '85vh',
          overflow: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 10px', fontSize: 16, color: '#e5a84b' }}>
          🎨 Generate Ambient Decorations
        </h3>
        <p style={{ fontSize: 12, color: '#aaa', marginBottom: 16, lineHeight: 1.4 }}>
          Populate outdoor grass, indoor floors, and roads with random atmospheric details (debris, cracks, foliage, and marks).
        </p>

        {/* Decoration Categories */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: '#888', fontWeight: 'bold' }}>Categories</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: '#1a1a1a', padding: 8, borderRadius: 4, border: '1px solid #333' }}>
            <label style={{ fontSize: 12, color: '#ddd', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={outdoor} onChange={e => setOutdoor(e.target.checked)} />
              🌿 Outdoor Grass (Foliage, stones & weeds)
            </label>
            <label style={{ fontSize: 12, color: '#ddd', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={indoor} onChange={e => setIndoor(e.target.checked)} />
              🏠 Indoor Floors (Cracks, debris & broken furniture)
            </label>
            <label style={{ fontSize: 12, color: '#ddd', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={road} onChange={e => setRoad(e.target.checked)} />
              🛣️ Roads & Sidewalks (Asphalt cracks & stains)
            </label>
          </div>
        </div>

        {/* Density Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: '#888', fontWeight: 'bold' }}>Density</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { id: 'sparse', label: 'Sparse (2%)' },
              { id: 'normal', label: 'Normal (5%)' },
              { id: 'dense', label: 'Dense (10%)' },
            ].map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setDensity(opt.id as any)}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  background: density === opt.id ? '#b8860b' : '#333',
                  color: '#eee',
                  border: density === opt.id ? '2px solid #e5a84b' : '1px solid #555',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: density === opt.id ? 'bold' : 'normal',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: '#ddd', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={clearExisting}
              onChange={e => setClearExisting(e.target.checked)}
            />
            Clear existing decorations before generating
          </label>
        </div>

        {/* Seed Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: '#888', fontWeight: 'bold' }}>RNG Seed</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="text"
              value={seedInput}
              onChange={e => setSeedInput(e.target.value.replace(/[^0-9-]/g, ''))}
              placeholder="Enter number seed"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              type="button"
              onClick={() => setSeedInput(Math.floor(Math.random() * 10000000).toString())}
              style={btnStyle('#555')}
            >
              🎲 Random
            </button>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || (!outdoor && !indoor && !road)}
            style={{ ...btnStyle('#b8860b', isGenerating || (!outdoor && !indoor && !road)), flex: 1, padding: '10px', fontWeight: 'bold' }}
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
          <button
            onClick={onClose}
            disabled={isGenerating}
            style={{ ...btnStyle('#555', isGenerating), flex: 1, padding: '10px' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
