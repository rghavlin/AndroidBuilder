import React from 'react';

const inputStyle: React.CSSProperties = {
  background: '#1a1a1a', border: '1px solid #444', color: '#eee', padding: '4px 6px', borderRadius: 4, fontSize: 12,
};
const btnStyle = (bg: string): React.CSSProperties => ({
  background: bg, color: '#eee', border: '1px solid rgba(255,255,255,0.15)', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12,
});
const VEHICLES = ['car', 'pickup', 'van'];

interface FurnitureStampPanelProps {
  types: { id: string; label: string }[];
  furnitureType: string;
  onTypeChange: (type: string) => void;
  onRotate: () => void;
  footprint: { w: number; h: number }; // rotated dims of the current piece
  stampedCount: number;
}

/** Side panel for the loose furniture/vehicle outline stamp tool. */
export const FurnitureStampPanel: React.FC<FurnitureStampPanelProps> = ({ types, furnitureType, onTypeChange, onRotate, footprint, stampedCount }) => (
  <div>
    <label style={{ fontSize: 11, color: '#888' }}>Outline / Stamp Type</label>
    <select value={furnitureType} onChange={e => onTypeChange(e.target.value)} style={{ ...inputStyle, width: '100%', marginTop: 4 }}>
      <optgroup label="Furniture">
        {types.filter(ft => !VEHICLES.includes(ft.id)).map(ft => <option key={ft.id} value={ft.id}>{ft.label}</option>)}
      </optgroup>
      <optgroup label="Vehicles (Roads)">
        {types.filter(ft => VEHICLES.includes(ft.id)).map(ft => <option key={ft.id} value={ft.id}>{ft.label}</option>)}
      </optgroup>
    </select>
    <button onClick={onRotate} style={{ ...btnStyle('#555'), width: '100%', marginTop: 6 }}>
      Rotate 90° [R] (now {footprint.w}×{footprint.h})
    </button>
    <p style={{ fontSize: 11, color: '#888', margin: '4px 0 0' }}>
      Click to stamp the outlined piece. Red outline = blocked. Use Eraser or right-click to remove.
      {' '}<span style={{ color: '#8fd0c8' }}>{stampedCount} stamped</span>.
    </p>
  </div>
);
