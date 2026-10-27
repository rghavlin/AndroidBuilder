import React, { useMemo, useState } from 'react';

/**
 * Edits what an authored container (a safe) holds. Items are added with the
 * editor's shared item controls, passed in as renderItemControls/draftItem —
 * the caller parks the item brush while this is open, since those controls
 * drive the same selection state.
 */
interface Props<T extends { defId: string }> {
  title: string;
  description: string;
  initialItems: T[];
  /** Indices of items that will not fit the container (size or category). */
  findRejected: (items: T[]) => number[];
  describeItem: (item: T) => string;
  renderItemControls: () => React.ReactNode;
  draftItem: () => T | null;
  onSave: (items: T[]) => void;
  onCancel: () => void;
}

const btn = (bg: string): React.CSSProperties => ({
  background: bg, border: 'none', color: '#fff', padding: '6px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12,
});

export default function ContainerContentsModal<T extends { defId: string }>(props: Props<T>) {
  const { title, description, initialItems, findRejected, describeItem, renderItemControls, draftItem, onSave, onCancel } = props;
  const [items, setItems] = useState<T[]>(initialItems);
  const rejected = useMemo(() => new Set(findRejected(items)), [items, findRejected]);
  const draft = draftItem();

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onCancel}>
      <div style={{ background: '#222', border: '1px solid #555', borderRadius: 8, padding: 16, width: 460, maxHeight: '85vh', overflow: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 4px', fontSize: 16, color: '#7bb8ff' }}>🔒 {title} Contents</h3>
        <p style={{ fontSize: 12, color: '#aaa', margin: '0 0 12px' }}>{description}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#888', fontWeight: 'bold' }}>Inside ({items.length})</label>
          {items.length === 0 && (
            <div style={{ fontSize: 11, color: '#666', fontStyle: 'italic' }}>Empty.</div>
          )}
          {items.map((it, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#2a2a2a', border: `1px solid ${rejected.has(i) ? '#c44' : '#444'}`, borderRadius: 4, padding: '4px 8px' }}>
              <span style={{ flex: 1, fontSize: 12, color: rejected.has(i) ? '#e88' : '#ddd' }}>
                {describeItem(it)}{rejected.has(i) ? ' — won\'t fit' : ''}
              </span>
              <button
                onClick={() => setItems(prev => prev.filter((_, j) => j !== i))}
                style={{ background: 'none', border: 'none', color: '#c44', cursor: 'pointer', fontSize: 11, padding: '2px 6px' }}
              >
                Remove
              </button>
            </div>
          ))}
          {rejected.size > 0 && (
            <div style={{ fontSize: 11, color: '#e0a070' }}>
              ⚠ Items marked "won't fit" are too big for the remaining space or not allowed in this container, and will be left out of the map.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, borderTop: '1px solid #444', paddingTop: 10 }}>
          <label style={{ fontSize: 12, color: '#888', fontWeight: 'bold' }}>Add item</label>
          {renderItemControls()}
          <button
            disabled={!draft}
            onClick={() => { if (draft) setItems(prev => [...prev, draft]); }}
            style={{ ...btn(draft ? '#3a7a3a' : '#333'), width: '100%', marginTop: 6, cursor: draft ? 'pointer' : 'not-allowed' }}
          >
            + Add to {title.toLowerCase()}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button onClick={() => onSave(items)} style={{ ...btn('#4a90d9'), flex: 1 }}>Save</button>
          <button onClick={onCancel} style={{ ...btn('#555'), flex: 1 }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
