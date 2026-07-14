import React from 'react';
import type { GameEvent, EventStep, Condition, ConditionKind, PlacementKind, TriggerType, RepeatMode, StepType, CompareOp, QuestDef, QuestReward, QuestRewardType } from '@/game/quest/eventTypes';

// ─── Local style constants (match editor.tsx's dark theme) ────────────────
const inputStyle: React.CSSProperties = {
  background: '#222', border: '1px solid #444', color: '#ddd',
  padding: '4px 8px', borderRadius: 3, fontSize: 12,
};
function btnStyle(bg: string): React.CSSProperties {
  return { padding: '5px 10px', background: bg, color: '#eee', border: '1px solid #555', borderRadius: 3, cursor: 'pointer', fontSize: 12 };
}
const sectionLabelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 'bold', color: '#888', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 };
const rowStyle: React.CSSProperties = { display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 };
const stepBoxStyle: React.CSSProperties = { border: '1px solid #444', borderRadius: 4, padding: '8px 10px', marginBottom: 8, background: '#1e1e1e' };

const CONDITION_KIND_OPTIONS: { id: ConditionKind; label: string }[] = [
  { id: 'none', label: 'No condition' },
  { id: 'itemEquipped', label: 'Player has item equipped' },
  { id: 'itemInInventory', label: 'Player has item in inventory' },
  { id: 'flag', label: 'Flag is' },
  { id: 'var', label: 'Variable' },
  { id: 'ap', label: 'Player AP' },
];
const STEP_TYPE_OPTIONS: { id: StepType; label: string }[] = [
  { id: 'dialog', label: 'Dialog' },
  { id: 'speech', label: 'Speech bubble' },
  { id: 'give', label: 'Give item' },
  { id: 'setFlag', label: 'Set flag' },
  { id: 'setVar', label: 'Set variable' },
  { id: 'lockMovement', label: 'Lock movement' },
  { id: 'unlockMovement', label: 'Unlock movement' },
  { id: 'lockActions', label: 'Lock movement + interactions' },
  { id: 'unlockActions', label: 'Unlock movement + interactions' },
  { id: 'wait', label: 'Wait' },
  { id: 'chain', label: 'Chain to event' },
  { id: 'moveEntity', label: 'Move entity' },
  { id: 'setNpcAI', label: 'Enable/disable NPC AI' },
  { id: 'startQuest', label: 'Start quest' },
  { id: 'setQuestTask', label: 'Set quest task' },
];

function emptyStep(type: StepType): EventStep {
  switch (type) {
    case 'dialog': return { type, speaker: '', text: '' };
    case 'speech': return { type, text: '' };
    case 'give': return { type, defId: '', count: 1 };
    case 'setFlag': return { type, flag: '', value: true };
    case 'setVar': return { type, var: '', op: 'set', varValue: 0 };
    case 'lockMovement': return { type, until: [] };
    case 'unlockMovement': return { type };
    case 'lockActions': return { type, until: [] };
    case 'unlockActions': return { type };
    case 'wait': return { type, ms: 500 };
    case 'chain': return { type, eventId: '' };
    case 'moveEntity': return { type, entityTag: '', targetX: undefined, targetY: undefined };
    case 'setNpcAI': return { type, entityTag: '', enabled: false };
    case 'startQuest': return { type, questId: '' };
    case 'setQuestTask': return { type, questId: '', taskIndex: 0 };
    default: return { type };
  }
}

function emptyCondition(): Condition {
  return { kind: 'none' };
}

// ─── Condition row editor (reused for preconditions / endWhen / lockMovement.until) ───
function ConditionRow({
  cond, onChange, onRemove, itemOptions, knownFlags, knownVars,
}: {
  cond: Condition;
  onChange: (c: Condition) => void;
  onRemove: () => void;
  itemOptions: { id: string; name: string }[];
  knownFlags: string[];
  knownVars: string[];
}) {
  return (
    <div style={rowStyle}>
      <select
        style={{ ...inputStyle, flex: 1 }}
        value={cond.kind}
        onChange={e => {
          const kind = e.target.value as ConditionKind;
          if (kind === 'itemEquipped' || kind === 'itemInInventory') onChange({ kind, defId: cond.defId || '', count: kind === 'itemInInventory' ? (cond.count || 1) : undefined });
          else if (kind === 'flag') onChange({ kind, flag: cond.flag || '', value: true });
          else if (kind === 'var') onChange({ kind, var: cond.var || '', op: '>=', value: 0 });
          else if (kind === 'ap') onChange({ kind, op: '<', value: 1 });
          else onChange({ kind: 'none' });
        }}
      >
        {CONDITION_KIND_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>

      {(cond.kind === 'itemEquipped' || cond.kind === 'itemInInventory') && (
        <select style={{ ...inputStyle, flex: 1 }} value={cond.defId || ''} onChange={e => onChange({ ...cond, defId: e.target.value })}>
          <option value="">select item…</option>
          {itemOptions.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
        </select>
      )}
      {cond.kind === 'itemInInventory' && (
        <input type="number" min={1} style={{ ...inputStyle, width: 56 }} value={cond.count ?? 1}
          onChange={e => onChange({ ...cond, count: Math.max(1, Number(e.target.value) || 1) })} />
      )}

      {cond.kind === 'flag' && (
        <>
          <select style={{ ...inputStyle, width: 130 }} value={cond.flag || ''} onChange={e => onChange({ ...cond, flag: e.target.value })}>
            <option value="">select flag…</option>
            {knownFlags.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <select style={{ ...inputStyle, width: 70 }} value={String(cond.value ?? true)} onChange={e => onChange({ ...cond, value: e.target.value === 'true' })}>
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        </>
      )}

      {cond.kind === 'var' && (
        <>
          <select style={{ ...inputStyle, width: 110 }} value={cond.var || ''} onChange={e => onChange({ ...cond, var: e.target.value })}>
            <option value="">select variable…</option>
            {knownVars.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <select style={{ ...inputStyle, width: 56 }} value={cond.op || '>='} onChange={e => onChange({ ...cond, op: e.target.value as CompareOp })}>
            {['==', '!=', '>=', '<=', '>', '<'].map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <input type="number" style={{ ...inputStyle, width: 64 }} value={Number(cond.value ?? 0)} onChange={e => onChange({ ...cond, value: Number(e.target.value) || 0 })} />
        </>
      )}

      {cond.kind === 'ap' && (
        <>
          <select style={{ ...inputStyle, width: 56 }} value={cond.op || '<'} onChange={e => onChange({ ...cond, op: e.target.value as CompareOp })}>
            {['==', '!=', '>=', '<=', '>', '<'].map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <input type="number" min={0} style={{ ...inputStyle, width: 64 }} value={Number(cond.value ?? 0)} onChange={e => onChange({ ...cond, value: Number(e.target.value) || 0 })} />
        </>
      )}

      <button onClick={onRemove} style={{ ...btnStyle('#552222'), padding: '4px 8px' }} aria-label="Remove condition">✕</button>
    </div>
  );
}

export function ConditionListEditor({
  conds, onChange, itemOptions, knownFlags, knownVars,
}: {
  conds: Condition[];
  onChange: (c: Condition[]) => void;
  itemOptions: { id: string; name: string }[];
  knownFlags: string[];
  knownVars: string[];
}) {
  return (
    <div>
      {(conds.some(c => c.kind === 'flag') && knownFlags.length === 0) || (conds.some(c => c.kind === 'var') && knownVars.length === 0) ? (
        <p style={{ fontSize: 10, color: '#c96', margin: '0 0 6px' }}>No flags/variables defined yet — add them via the "Switches &amp; Variables" button in the left panel.</p>
      ) : null}
      {conds.map((c, i) => (
        <ConditionRow
          key={i}
          cond={c}
          itemOptions={itemOptions}
          knownFlags={knownFlags}
          knownVars={knownVars}
          onChange={next => onChange(conds.map((x, j) => (j === i ? next : x)))}
          onRemove={() => onChange(conds.filter((_, j) => j !== i))}
        />
      ))}
      <button onClick={() => onChange([...conds, emptyCondition()])} style={{ ...btnStyle('#333'), fontSize: 11 }}>+ Add condition</button>
    </div>
  );
}

// ─── Quest onComplete reward editor (give item / set flag / set var) ──────
// Deliberately separate from StepEditor: rewards fire on quest completion,
// not at an authored map location, so 'give' has no "drop at" tile — it goes
// straight into the player's inventory (see QuestState._applyRewards). Kept
// as its own small type (QuestRewardType) rather than the full StepType so
// this list can't accidentally end up with a dialog/lockMovement/etc step.
const REWARD_TYPE_OPTIONS: { id: QuestRewardType; label: string }[] = [
  { id: 'give', label: 'Give item' },
  { id: 'setFlag', label: 'Set flag' },
  { id: 'setVar', label: 'Set variable' },
];

function emptyReward(type: QuestRewardType): QuestReward {
  switch (type) {
    case 'give': return { type, defId: '', count: 1 };
    case 'setFlag': return { type, flag: '', value: true };
    case 'setVar': return { type, var: '', op: 'set', varValue: 0 };
    default: return { type };
  }
}

function QuestRewardRow({
  reward, onChange, onRemove, itemOptions, knownFlags, knownVars,
}: {
  reward: QuestReward;
  onChange: (r: QuestReward) => void;
  onRemove: () => void;
  itemOptions: { id: string; name: string }[];
  knownFlags: string[];
  knownVars: string[];
}) {
  return (
    <div style={rowStyle}>
      <select
        style={{ ...inputStyle, width: 110 }}
        value={reward.type}
        onChange={e => onChange(emptyReward(e.target.value as QuestRewardType))}
      >
        {REWARD_TYPE_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>

      {reward.type === 'give' && (
        <>
          <select style={{ ...inputStyle, flex: 1 }} value={reward.defId || ''} onChange={e => onChange({ ...reward, defId: e.target.value })}>
            <option value="">select item…</option>
            {itemOptions.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
          </select>
          <input type="number" min={1} style={{ ...inputStyle, width: 56 }} value={reward.count ?? 1} onChange={e => onChange({ ...reward, count: Math.max(1, Number(e.target.value) || 1) })} />
        </>
      )}

      {reward.type === 'setFlag' && (
        <>
          <select style={{ ...inputStyle, flex: 1 }} value={reward.flag || ''} onChange={e => onChange({ ...reward, flag: e.target.value })}>
            <option value="">select flag…</option>
            {knownFlags.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <span style={{ fontSize: 11, color: '#888' }}>=</span>
          <select style={{ ...inputStyle, width: 70 }} value={String(reward.value ?? true)} onChange={e => onChange({ ...reward, value: e.target.value === 'true' })}>
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        </>
      )}

      {reward.type === 'setVar' && (
        <>
          <select style={{ ...inputStyle, flex: 1 }} value={reward.var || ''} onChange={e => onChange({ ...reward, var: e.target.value })}>
            <option value="">select variable…</option>
            {knownVars.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <select style={{ ...inputStyle, width: 70 }} value={reward.op || 'set'} onChange={e => onChange({ ...reward, op: e.target.value as 'set' | 'add' })}>
            <option value="set">set</option>
            <option value="add">add</option>
          </select>
          <input type="number" style={{ ...inputStyle, width: 70 }} value={reward.varValue ?? 0} onChange={e => onChange({ ...reward, varValue: Number(e.target.value) || 0 })} />
        </>
      )}

      <button onClick={onRemove} style={{ ...btnStyle('#552222'), padding: '4px 8px' }} aria-label="Remove reward">✕</button>
    </div>
  );
}

export function QuestRewardEditor({
  rewards, onChange, itemOptions, knownFlags, knownVars,
}: {
  rewards: QuestReward[];
  onChange: (r: QuestReward[]) => void;
  itemOptions: { id: string; name: string }[];
  knownFlags: string[];
  knownVars: string[];
}) {
  return (
    <div>
      {rewards.map((r, i) => (
        <QuestRewardRow
          key={i}
          reward={r}
          itemOptions={itemOptions}
          knownFlags={knownFlags}
          knownVars={knownVars}
          onChange={next => onChange(rewards.map((x, j) => (j === i ? next : x)))}
          onRemove={() => onChange(rewards.filter((_, j) => j !== i))}
        />
      ))}
      <button onClick={() => onChange([...rewards, emptyReward('give')])} style={{ ...btnStyle('#333'), fontSize: 11 }}>+ Add reward</button>
    </div>
  );
}

// ─── One step's own editor section ─────────────────────────────────────────
function StepEditor({
  step, index, total, onChange, onRemove, onMoveUp, onMoveDown, onPickCoord, itemOptions, knownEventIds, knownFlags, knownVars, knownEntities, knownQuests,
}: {
  step: EventStep;
  index: number;
  total: number;
  onChange: (s: EventStep) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onPickCoord: () => void;
  itemOptions: { id: string; name: string }[];
  knownEventIds: string[];
  knownFlags: string[];
  knownVars: string[];
  knownEntities: { tag: string; label: string }[];
  knownQuests: QuestDef[];
}) {
  const badgeColors: Partial<Record<StepType, string>> = {
    dialog: '#1d4f8a', speech: '#1d4f8a', give: '#1d6b3a', setFlag: '#7a5a12', setVar: '#7a5a12',
    lockMovement: '#7a1e1e', unlockMovement: '#7a1e1e', lockActions: '#8a1e3a', unlockActions: '#8a1e3a', wait: '#444', chain: '#5a3a7a',
    moveEntity: '#2b6b3a', setNpcAI: '#2b6b3a', startQuest: '#4a2582', setQuestTask: '#4a2582',
  };
  const label = STEP_TYPE_OPTIONS.find(o => o.id === step.type)?.label || step.type;

  return (
    <div style={stepBoxStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 'bold', background: badgeColors[step.type] || '#333', color: '#eee', padding: '2px 8px', borderRadius: 3 }}>
          {index + 1} · {label}
        </span>
        <span style={{ flex: 1 }} />
        <button onClick={onMoveUp} disabled={index === 0} style={{ ...btnStyle('#333'), padding: '2px 6px', opacity: index === 0 ? 0.4 : 1 }}>↑</button>
        <button onClick={onMoveDown} disabled={index === total - 1} style={{ ...btnStyle('#333'), padding: '2px 6px', opacity: index === total - 1 ? 0.4 : 1 }}>↓</button>
        <button onClick={onRemove} style={{ ...btnStyle('#552222'), padding: '2px 6px' }}>✕</button>
      </div>

      {step.type === 'dialog' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={rowStyle}>
            <input style={{ ...inputStyle, width: 110 }} placeholder="speaker" value={step.speaker || ''} onChange={e => onChange({ ...step, speaker: e.target.value })} />
            <input style={{ ...inputStyle, flex: 1 }} placeholder="line of dialog" value={step.text || ''} onChange={e => onChange({ ...step, text: e.target.value })} />
          </div>
          <input style={{ ...inputStyle, width: '100%' }} placeholder="video filename (optional, e.g. movement.webm)" value={step.video || ''} onChange={e => onChange({ ...step, video: e.target.value || undefined })} />
        </div>
      )}

      {step.type === 'speech' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={rowStyle}>
            <input style={{ ...inputStyle, width: 110 }} placeholder="speaker (optional)" value={step.speaker || ''} onChange={e => onChange({ ...step, speaker: e.target.value })} />
            <input style={{ ...inputStyle, flex: 1 }} placeholder="line of speech" value={step.text || ''} onChange={e => onChange({ ...step, text: e.target.value })} />
          </div>
          <div style={rowStyle}>
            <span style={{ fontSize: 11, color: '#888' }}>Anchor tile:</span>
            <span style={{ fontSize: 11, color: step.anchorX !== undefined ? '#9c6' : '#888' }}>
              {step.anchorX !== undefined ? `(${step.anchorX}, ${step.anchorY})` : 'not set'}
            </span>
            <button onClick={onPickCoord} style={{ ...btnStyle('#333'), fontSize: 11 }}>Pick on map</button>
          </div>
        </div>
      )}

      {step.type === 'give' && (
        <div style={rowStyle}>
          <select style={{ ...inputStyle, flex: 1 }} value={step.defId || ''} onChange={e => onChange({ ...step, defId: e.target.value })}>
            <option value="">select item…</option>
            {itemOptions.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
          </select>
          <input type="number" min={1} style={{ ...inputStyle, width: 56 }} value={step.count ?? 1} onChange={e => onChange({ ...step, count: Math.max(1, Number(e.target.value) || 1) })} />
          <span style={{ fontSize: 11, color: '#888' }}>drop at</span>
          <span style={{ fontSize: 11, color: step.x !== undefined ? '#9c6' : '#888' }}>
            {step.x !== undefined ? `(${step.x}, ${step.y})` : 'not set'}
          </span>
          <button onClick={onPickCoord} style={{ ...btnStyle('#333'), fontSize: 11 }}>Pick on map</button>
        </div>
      )}

      {step.type === 'setFlag' && (
        <div>
          {knownFlags.length === 0 && <p style={{ fontSize: 10, color: '#c96', margin: '0 0 6px' }}>No flags defined yet — add one via "Switches &amp; Variables" in the left panel.</p>}
          <div style={rowStyle}>
            <select style={{ ...inputStyle, flex: 1 }} value={step.flag || ''} onChange={e => onChange({ ...step, flag: e.target.value })}>
              <option value="">select flag…</option>
              {knownFlags.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <span style={{ fontSize: 11, color: '#888' }}>=</span>
            <select style={{ ...inputStyle, width: 70 }} value={String(step.value ?? true)} onChange={e => onChange({ ...step, value: e.target.value === 'true' })}>
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </div>
        </div>
      )}

      {step.type === 'setVar' && (
        <div>
          {knownVars.length === 0 && <p style={{ fontSize: 10, color: '#c96', margin: '0 0 6px' }}>No variables defined yet — add one via "Switches &amp; Variables" in the left panel.</p>}
          <div style={rowStyle}>
            <select style={{ ...inputStyle, flex: 1 }} value={step.var || ''} onChange={e => onChange({ ...step, var: e.target.value })}>
              <option value="">select variable…</option>
              {knownVars.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <select style={{ ...inputStyle, width: 70 }} value={step.op || 'set'} onChange={e => onChange({ ...step, op: e.target.value as 'set' | 'add' })}>
              <option value="set">set</option>
              <option value="add">add</option>
            </select>
            <input type="number" style={{ ...inputStyle, width: 70 }} value={step.varValue ?? 0} onChange={e => onChange({ ...step, varValue: Number(e.target.value) || 0 })} />
          </div>
        </div>
      )}

      {step.type === 'lockMovement' && (
        <div>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Unlocks when all pass:</div>
          <ConditionListEditor conds={step.until || []} onChange={c => onChange({ ...step, until: c })} itemOptions={itemOptions} knownFlags={knownFlags} knownVars={knownVars} />
        </div>
      )}

      {step.type === 'unlockMovement' && (
        <div style={{ fontSize: 11, color: '#666' }}>No options.</div>
      )}

      {step.type === 'lockActions' && (
        <div>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>
            Blocks movement AND map interactions (doors, windows, NPCs, combat) — End Turn still works.
            Unlocks when all pass:
          </div>
          <ConditionListEditor conds={step.until || []} onChange={c => onChange({ ...step, until: c })} itemOptions={itemOptions} knownFlags={knownFlags} knownVars={knownVars} />
        </div>
      )}

      {step.type === 'unlockActions' && (
        <div style={{ fontSize: 11, color: '#666' }}>No options.</div>
      )}

      {step.type === 'wait' && (
        <div style={rowStyle}>
          <input type="number" min={0} step={100} style={{ ...inputStyle, width: 90 }} value={step.ms ?? 500} onChange={e => onChange({ ...step, ms: Math.max(0, Number(e.target.value) || 0) })} />
          <span style={{ fontSize: 11, color: '#888' }}>ms</span>
        </div>
      )}

      {step.type === 'chain' && (
        <div style={rowStyle}>
          <input style={{ ...inputStyle, flex: 1 }} list="event-window-known-ids" placeholder="event id to fire next" value={step.eventId || ''} onChange={e => onChange({ ...step, eventId: e.target.value })} />
          <datalist id="event-window-known-ids">
            {knownEventIds.map(id => <option key={id} value={id} />)}
          </datalist>
        </div>
      )}

      {step.type === 'moveEntity' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={rowStyle}>
            <span style={{ fontSize: 11, color: '#888' }}>Target entity:</span>
            <select style={{ ...inputStyle, flex: 1 }} value={step.entityTag || ''} onChange={e => onChange({ ...step, entityTag: e.target.value })}>
              <option value="">select entity…</option>
              {knownEntities.map(ent => <option key={ent.tag} value={ent.tag}>{ent.label}</option>)}
            </select>
          </div>
          <div style={rowStyle}>
            <span style={{ fontSize: 11, color: '#888' }}>Destination tile:</span>
            <span style={{ fontSize: 11, color: step.targetX !== undefined ? '#9c6' : '#888' }}>
              {step.targetX !== undefined ? `(${step.targetX}, ${step.targetY})` : 'not set'}
            </span>
            <button onClick={onPickCoord} style={{ ...btnStyle('#333'), fontSize: 11 }}>Pick on map</button>
          </div>
        </div>
      )}

      {step.type === 'setNpcAI' && (
        <div style={rowStyle}>
          <span style={{ fontSize: 11, color: '#888' }}>NPC:</span>
          <select style={{ ...inputStyle, flex: 1 }} value={step.entityTag || ''} onChange={e => onChange({ ...step, entityTag: e.target.value })}>
            <option value="">select entity…</option>
            {knownEntities.map(ent => <option key={ent.tag} value={ent.tag}>{ent.label}</option>)}
          </select>
          <select style={{ ...inputStyle, width: 130 }} value={String(step.enabled ?? false)} onChange={e => onChange({ ...step, enabled: e.target.value === 'true' })}>
            <option value="false">Disable AI (stay put)</option>
            <option value="true">Enable AI (resume normal behavior)</option>
          </select>
        </div>
      )}

      {step.type === 'startQuest' && (
        <div style={rowStyle}>
          <span style={{ fontSize: 11, color: '#888' }}>Quest:</span>
          <select style={{ ...inputStyle, flex: 1 }} value={step.questId || ''} onChange={e => onChange({ ...step, questId: e.target.value })}>
            <option value="">select quest…</option>
            {(knownQuests || []).map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
          </select>
        </div>
      )}

      {step.type === 'setQuestTask' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={rowStyle}>
            <span style={{ fontSize: 11, color: '#888' }}>Quest:</span>
            <select style={{ ...inputStyle, flex: 1 }} value={step.questId || ''} onChange={e => onChange({ ...step, questId: e.target.value, taskIndex: 0 })}>
              <option value="">select quest…</option>
              {(knownQuests || []).map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
            </select>
          </div>
          {step.questId && (
            <div style={rowStyle}>
              <span style={{ fontSize: 11, color: '#888' }}>Set task to:</span>
              <select style={{ ...inputStyle, flex: 1 }} value={step.taskIndex ?? 0} onChange={e => onChange({ ...step, taskIndex: Number(e.target.value) || 0 })}>
                {((knownQuests || []).find(q => q.id === step.questId)?.tasks || []).map((t, idx) => (
                  <option key={t.id || idx} value={idx}>{idx}: {t.text}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── The Event Window itself ───────────────────────────────────────────────
export interface EventWindowProps {
  event: GameEvent;
  onChange: (event: GameEvent) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
  onPickPlacement: () => void;
  onPickStepCoord: (stepIndex: number) => void;
  itemOptions: { id: string; name: string }[];
  knownEventIds: string[];
  knownFlags: string[];
  knownVars: string[];
  knownEntities: { tag: string; label: string }[];
  knownQuests: QuestDef[];
}

export default function EventWindow({
  event, onChange, onSave, onCancel, onDelete, onPickPlacement, onPickStepCoord, itemOptions, knownEventIds, knownFlags, knownVars, knownEntities, knownQuests,
}: EventWindowProps) {
  const setSteps = (steps: EventStep[]) => onChange({ ...event, steps });
  const showEndCondition = event.trigger === 'auto' || event.trigger === 'parallel';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 150, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '5vh' }}
      onClick={onCancel}>
      <div style={{ background: '#1a1a1a', border: '1px solid #555', borderRadius: 8, width: 560, maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid #333' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: '#888' }}>Editing event</div>
            <input
              style={{ ...inputStyle, fontSize: 15, fontWeight: 'bold', width: '100%', marginTop: 2 }}
              value={event.id}
              onChange={e => onChange({ ...event, id: e.target.value })}
            />
          </div>
          <button onClick={onCancel} style={{ ...btnStyle('#333'), padding: '4px 10px' }} aria-label="Close">✕</button>
        </div>

        <div style={{ padding: '12px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div>
            <div style={sectionLabelStyle}>Preconditions <span style={{ color: '#666', fontWeight: 'normal' }}>— all must pass</span></div>
            <ConditionListEditor conds={event.preconditions} onChange={c => onChange({ ...event, preconditions: c })} itemOptions={itemOptions} knownFlags={knownFlags} knownVars={knownVars} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <label style={{ fontSize: 11, color: '#888' }}>Placement
              <select style={{ ...inputStyle, width: '100%', marginTop: 4 }} value={event.placement.kind}
                onChange={e => {
                  const kind = e.target.value as PlacementKind;
                  onChange({ ...event, placement: kind === 'chainOnly' ? { kind } : { kind, x: event.placement.x, y: event.placement.y, ...(kind === 'proximity' ? { radius: event.placement.radius ?? 2 } : {}) } });
                }}>
                  <option value="tile">Tile</option>
                  <option value="proximity">Proximity</option>
                  <option value="chainOnly">Chain-only (no tile)</option>
              </select>
            </label>
            <label style={{ fontSize: 11, color: '#888' }}>Trigger
              <select style={{ ...inputStyle, width: '100%', marginTop: 4 }} value={event.trigger} onChange={e => onChange({ ...event, trigger: e.target.value as TriggerType })}>
                <option value="onEnter">On enter</option>
                <option value="onInteract">On interact</option>
                <option value="auto">Auto</option>
                <option value="parallel">Parallel</option>
              </select>
            </label>
            <label style={{ fontSize: 11, color: '#888' }}>Repeat
              <select style={{ ...inputStyle, width: '100%', marginTop: 4 }} value={event.repeat} onChange={e => onChange({ ...event, repeat: e.target.value as RepeatMode })}>
                <option value="once">Once</option>
                <option value="everyTime">Every time</option>
                <option value="whileConditions">While conditions</option>
              </select>
            </label>
          </div>

          {event.placement.kind !== 'chainOnly' && (
            <div style={rowStyle}>
              <span style={{ fontSize: 11, color: '#888' }}>{event.placement.kind === 'proximity' ? 'Center tile:' : 'Tile:'}</span>
              <span style={{ fontSize: 11, color: event.placement.x !== undefined ? '#9c6' : '#888' }}>
                {event.placement.x !== undefined ? `(${event.placement.x}, ${event.placement.y})` : 'not set'}
              </span>
              <button onClick={onPickPlacement} style={{ ...btnStyle('#333'), fontSize: 11 }}>Pick on map</button>
              {event.placement.kind === 'proximity' && (
                <>
                  <span style={{ fontSize: 11, color: '#888' }}>radius</span>
                  <input type="number" min={1} max={30} style={{ ...inputStyle, width: 56 }} value={event.placement.radius ?? 2}
                    onChange={e => onChange({ ...event, placement: { ...event.placement, radius: Math.max(1, Number(e.target.value) || 1) } })} />
                </>
              )}
            </div>
          )}

          {showEndCondition && (
            <div>
              <div style={sectionLabelStyle}>End condition <span style={{ color: '#666', fontWeight: 'normal' }}>— once true, this event stops firing for good</span></div>
              <ConditionListEditor conds={event.endWhen || []} onChange={c => onChange({ ...event, endWhen: c })} itemOptions={itemOptions} knownFlags={knownFlags} knownVars={knownVars} />
            </div>
          )}

          <div>
            <div style={sectionLabelStyle}>Steps <span style={{ color: '#666', fontWeight: 'normal' }}>— run top to bottom</span></div>
            {event.steps.map((step, i) => (
              <StepEditor
                key={i}
                step={step}
                index={i}
                total={event.steps.length}
                itemOptions={itemOptions}
                knownEventIds={knownEventIds}
                knownFlags={knownFlags}
                knownVars={knownVars}
                knownEntities={knownEntities}
                knownQuests={knownQuests}
                onChange={s => setSteps(event.steps.map((x, j) => (j === i ? s : x)))}
                onRemove={() => setSteps(event.steps.filter((_, j) => j !== i))}
                onMoveUp={() => { if (i === 0) return; const s = [...event.steps]; [s[i - 1], s[i]] = [s[i], s[i - 1]]; setSteps(s); }}
                onMoveDown={() => { if (i === event.steps.length - 1) return; const s = [...event.steps]; [s[i + 1], s[i]] = [s[i], s[i + 1]]; setSteps(s); }}
                onPickCoord={() => onPickStepCoord(i)}
              />
            ))}
            <select
              style={{ ...inputStyle, width: '100%' }}
              value=""
              onChange={e => {
                const t = e.target.value as StepType;
                if (t) setSteps([...event.steps, emptyStep(t)]);
              }}
            >
              <option value="">+ Add step…</option>
              {STEP_TYPE_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '12px 16px', borderTop: '1px solid #333' }}>
          <div>
            {onDelete && <button onClick={onDelete} style={btnStyle('#552222')}>Delete event</button>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onCancel} style={btnStyle('#333')}>Cancel</button>
            <button onClick={onSave} style={btnStyle('#2b6b3a')}>Save event</button>
          </div>
        </div>
      </div>
    </div>
  );
}
