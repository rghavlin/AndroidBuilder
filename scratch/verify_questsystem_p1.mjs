import { migrateLegacyEvents, downconvertEvents, resolveMapEvents } from '../client/src/game/quest/migrateEvents.js';

let failures = 0;
function assert(cond, msg) {
  if (!cond) {
    failures++;
    console.error(`FAIL: ${msg}`);
  } else {
    console.log(`ok: ${msg}`);
  }
}
// Order-independent deep equality (key order shouldn't matter for object equivalence).
function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (typeof a === 'object') {
    const aKeys = Object.keys(a).sort();
    const bKeys = Object.keys(b).sort();
    if (aKeys.length !== bKeys.length || !aKeys.every((k, i) => k === bKeys[i])) return false;
    return aKeys.every(k => deepEqual(a[k], b[k]));
  }
  return false;
}

// --- Legacy fixture: one of each kind ---
const legacyMetadata = {
  eventTriggers: [
    // modal dialog, tile-placed, one-shot, with a grant and a chain
    {
      x: 12, y: 8, id: 'guard_intro', oneShot: true,
      steps: [{ speaker: 'Guard', text: "You'll need the key." }],
      grants: [{ defId: 'gate_key', count: 1, x: 12, y: 9 }],
      next: 'guard_thanks',
    },
    // chain-only dialog, everyTime, no grants/next
    {
      chainOnly: true, id: 'guard_thanks', oneShot: false,
      steps: [{ speaker: 'Guard', text: 'Thanks for that.' }],
    },
  ],
  bubbleEvents: [
    // tile speech bubble, one-shot
    {
      id: 'npc_mutter', oneShot: true,
      trigger: { type: 'tile', x: 3, y: 4 },
      lines: [{ x: 3, y: 4, speaker: 'Old man', text: 'Storms a-comin.' }],
    },
    // proximity speech bubble, everyTime, with a grant
    {
      id: 'radio_chatter', oneShot: false,
      trigger: { type: 'proximity', x: 20, y: 20, radius: 5 },
      lines: [{ x: 20, y: 20, text: '...static...' }],
      grants: [{ defId: 'battery', x: 20, y: 21 }],
    },
  ],
};

// --- migrateLegacyEvents up-converts every entry ---
const migrated = migrateLegacyEvents(legacyMetadata);
assert(migrated.length === 4, `migrated 4 events (got ${migrated.length})`);

const guardIntro = migrated.find(e => e.id === 'guard_intro');
assert(guardIntro.placement.kind === 'tile' && guardIntro.placement.x === 12 && guardIntro.placement.y === 8, 'guard_intro placement is tile(12,8)');
assert(guardIntro.repeat === 'once', 'guard_intro repeat is once (oneShot:true)');
assert(guardIntro.steps.some(s => s.type === 'dialog' && s.text === "You'll need the key."), 'guard_intro has dialog step');
assert(guardIntro.steps.some(s => s.type === 'give' && s.defId === 'gate_key' && s.x === 12 && s.y === 9), 'guard_intro has give step at its own tile');
assert(guardIntro.steps.some(s => s.type === 'chain' && s.eventId === 'guard_thanks'), 'guard_intro has chain step to guard_thanks');

const guardThanks = migrated.find(e => e.id === 'guard_thanks');
assert(guardThanks.placement.kind === 'chainOnly', 'guard_thanks placement is chainOnly');
assert(guardThanks.repeat === 'everyTime', 'guard_thanks repeat is everyTime (oneShot:false)');

const npcMutter = migrated.find(e => e.id === 'npc_mutter');
assert(npcMutter.placement.kind === 'tile' && npcMutter.placement.x === 3 && npcMutter.placement.y === 4, 'npc_mutter placement is tile(3,4)');
assert(npcMutter.steps.some(s => s.type === 'speech' && s.anchorX === 3 && s.anchorY === 4 && s.speaker === 'Old man'), 'npc_mutter has speech step with anchor + speaker');

const radioChatter = migrated.find(e => e.id === 'radio_chatter');
assert(radioChatter.placement.kind === 'proximity' && radioChatter.placement.radius === 5, 'radio_chatter placement is proximity radius 5');
assert(radioChatter.steps.some(s => s.type === 'give' && s.defId === 'battery'), 'radio_chatter has its own give step');

// --- downconvertEvents inverts migrateLegacyEvents for the representable subset ---
const { eventTriggers, bubbleEvents } = downconvertEvents(migrated);
assert(eventTriggers.length === 2, `down-convert produced 2 eventTriggers (got ${eventTriggers.length})`);
assert(bubbleEvents.length === 2, `down-convert produced 2 bubbleEvents (got ${bubbleEvents.length})`);

const dcGuardIntro = eventTriggers.find(e => e.id === 'guard_intro');
assert(dcGuardIntro.x === 12 && dcGuardIntro.y === 8, 'down-converted guard_intro keeps tile coords');
assert(dcGuardIntro.oneShot === true, 'down-converted guard_intro oneShot true');
assert(dcGuardIntro.grants[0].defId === 'gate_key' && dcGuardIntro.grants[0].x === 12 && dcGuardIntro.grants[0].y === 9, 'down-converted guard_intro grant preserved with own tile');
assert(dcGuardIntro.next === 'guard_thanks', 'down-converted guard_intro next preserved');

const dcGuardThanks = eventTriggers.find(e => e.id === 'guard_thanks');
assert(dcGuardThanks.chainOnly === true, 'down-converted guard_thanks is chainOnly');
assert(dcGuardThanks.oneShot === false, 'down-converted guard_thanks oneShot false');

const dcNpcMutter = bubbleEvents.find(e => e.id === 'npc_mutter');
assert(dcNpcMutter.trigger.type === 'tile' && dcNpcMutter.trigger.x === 3 && dcNpcMutter.trigger.y === 4, 'down-converted npc_mutter trigger preserved');
assert(dcNpcMutter.lines[0].speaker === 'Old man' && dcNpcMutter.lines[0].text === 'Storms a-comin.', 'down-converted npc_mutter line preserved');

const dcRadioChatter = bubbleEvents.find(e => e.id === 'radio_chatter');
assert(dcRadioChatter.trigger.type === 'proximity' && dcRadioChatter.trigger.radius === 5, 'down-converted radio_chatter proximity trigger preserved');
assert(dcRadioChatter.grants[0].defId === 'battery', 'down-converted radio_chatter grant preserved');

// --- full round trip equivalence (order-independent) ---
function byId(arr) { return Object.fromEntries(arr.map(e => [e.id, e])); }
assert(deepEqual(byId(eventTriggers), byId(legacyMetadata.eventTriggers)), 'eventTriggers round-trip exactly (legacy -> unified -> legacy)');
assert(deepEqual(byId(bubbleEvents), byId(legacyMetadata.bubbleEvents)), 'bubbleEvents round-trip exactly (legacy -> unified -> legacy)');

// --- dropped step types produce a warning but don't throw ---
const eventsWithUnsupportedStep = [
  { id: 'flag_only', placement: { kind: 'tile', x: 1, y: 1 }, trigger: 'onEnter', preconditions: [], repeat: 'once', steps: [{ type: 'setFlag', flag: 'met_x', value: true }] },
];
let warned = false;
const originalWarn = console.warn;
console.warn = (...args) => { warned = true; originalWarn(...args); };
const { eventTriggers: dcTriggers2 } = downconvertEvents(eventsWithUnsupportedStep);
console.warn = originalWarn;
assert(warned, 'downconvertEvents warns when dropping an unrepresentable step type');
assert(dcTriggers2[0].steps.length === 0, 'unrepresentable-step event down-converts to an empty dialog steps array (grant-less, step-less)');

// --- resolveMapEvents prefers an already-unified events[] ---
const alreadyUnified = { events: [{ id: 'x', placement: { kind: 'tile', x: 0, y: 0 }, trigger: 'onEnter', preconditions: [], repeat: 'once', steps: [] }], eventTriggers: [{ x: 9, y: 9, id: 'should_be_ignored', steps: [], oneShot: true }] };
const resolved = resolveMapEvents(alreadyUnified);
assert(resolved.length === 1 && resolved[0].id === 'x', 'resolveMapEvents prefers metadata.events over legacy arrays when both present');

const legacyOnly = resolveMapEvents(legacyMetadata);
assert(legacyOnly.length === 4, 'resolveMapEvents falls back to migrateLegacyEvents when no metadata.events');

const empty = resolveMapEvents({});
assert(Array.isArray(empty) && empty.length === 0, 'resolveMapEvents on empty metadata returns empty array');

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
