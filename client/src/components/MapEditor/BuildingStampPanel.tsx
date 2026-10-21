import React from 'react';
import { STAMP_GROUPS, getStampItem, measureStamp } from '@/game/editor/buildingStamp';

export interface StampSelection { key: string; frontage: string; mirror: boolean }
type Footprint = ReturnType<typeof measureStamp>;

const inputStyle: React.CSSProperties = {
  background: '#1a1a1a', border: '1px solid #444', color: '#eee', padding: '4px 6px', borderRadius: 4, fontSize: 12,
};
const btnStyle = (bg: string): React.CSSProperties => ({
  background: bg, color: '#eee', border: '1px solid rgba(255,255,255,0.15)', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12,
});
const FRONTAGE_LABEL: Record<string, string> = { south: 'South', west: 'West', north: 'North', east: 'East' };

/** Next allowed frontage for the selected stamp (the R hotkey and the Rotate button). */
export function rotateStamp(sel: StampSelection): StampSelection {
  const f = getStampItem(sel.key)?.frontages ?? ['south'];
  return { ...sel, frontage: f[(f.indexOf(sel.frontage) + 1) % f.length] };
}

/**
 * Ghost for the stamp at (x, y): dashed outline of everything the stamp touches
 * (sign, gas-station lot) and a solid outline of the building's walls.
 * Green = placeable, red = blocked.
 */
export function drawStampGhost(ctx: CanvasRenderingContext2D, fp: Footprint, x: number, y: number, cell: number, blocked: boolean) {
  const color = blocked ? '#f44336' : '#4caf50';
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect((x + fp.bounds.x) * cell, (y + fp.bounds.y) * cell, fp.bounds.w * cell, fp.bounds.h * cell);
  ctx.setLineDash([]);
  ctx.lineWidth = 2;
  ctx.fillStyle = blocked ? 'rgba(244,67,54,0.15)' : 'rgba(76,175,80,0.15)';
  ctx.fillRect((x + fp.building.x) * cell, (y + fp.building.y) * cell, fp.building.w * cell, fp.building.h * cell);
  ctx.strokeRect((x + fp.building.x) * cell, (y + fp.building.y) * cell, fp.building.w * cell, fp.building.h * cell);
  ctx.restore();
}

export const BuildingStampPanel: React.FC<{ selection: StampSelection; onChange: (s: StampSelection) => void; footprint: Footprint }> = ({ selection, onChange, footprint }) => {
  const item = getStampItem(selection.key);
  const pickItem = (key: string) => {
    const next = getStampItem(key);
    const frontage = next?.frontages.includes(selection.frontage) ? selection.frontage : (next?.frontages[0] ?? 'south');
    onChange({ key, frontage, mirror: next?.mirrorable ? selection.mirror : false });
  };

  return (
    <div>
      <label style={{ fontSize: 11, color: '#888' }}>Building / Layout</label>
      <select value={selection.key} onChange={e => pickItem(e.target.value)} style={{ ...inputStyle, width: '100%', marginTop: 4 }}>
        {STAMP_GROUPS.map(g => (
          <optgroup key={g.label} label={g.label}>
            {g.items.map(i => <option key={i.key} value={i.key}>{i.label}</option>)}
          </optgroup>
        ))}
      </select>
      <button onClick={() => onChange(rotateStamp(selection))} style={{ ...btnStyle('#555'), width: '100%', marginTop: 6 }}>
        Rotate [R]: front faces {FRONTAGE_LABEL[selection.frontage]} ({footprint.building.w}×{footprint.building.h})
      </button>
      {item?.mirrorable && (
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, color: '#ddd', marginTop: 6 }}>
          <input type="checkbox" checked={selection.mirror} onChange={e => onChange({ ...selection, mirror: e.target.checked })} />
          Mirror left-to-right
        </label>
      )}
      <p style={{ fontSize: 11, color: '#888', margin: '4px 0 0' }}>
        Click to stamp where the outline shows. Drawn by the map generator, so walls, doors,
        windows, signs and furniture match generated buildings. Door locks and windows are re-rolled on each stamp.
        Dashed outline = everything it touches; red = blocked. Ctrl+Z undoes.
      </p>
    </div>
  );
};
