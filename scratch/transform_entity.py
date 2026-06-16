import re
import os

filepath = 'c:/Games/AndroidBuilder/client/src/game/entities/Entity.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
if 'import { AIState }' not in content:
    content = content.replace(
        "import { Container } from '../inventory/Container.js';",
        "import { Container } from '../inventory/Container.js';\nimport { AIState } from '../components/AIState.js';"
    )

# 2. COMPONENT_CLASSES
if 'AIState,' not in content:
    content = content.replace(
        "PlayerSkills,",
        "PlayerSkills,\n  AIState,"
    )

# 3. Constructor
props_to_remove = [
    'this.behaviorState = \'idle\';',
    'this.currentTarget = null;',
    'this.hasDemanded = false;',
    'this.hasExtorted = false;',
    'this.heardNoise = false;',
    'this.noiseCoords = { x: 0, y: 0 };',
    'this.noiseBlacklist = [];',
    'this.recentThreats = [];',
    'this.goalTarget = null;',
    'this.currentPath = null;',
    'this.stunnedTurns = 0;',
    'this.lastSeen = false;',
    'this.targetSightedCoords = { x: 0, y: 0 };',
    'this.lastScentSequence = 0;',
    'this.isAlerted = false;'
]

for prop in props_to_remove:
    # Use regex to remove the line with optional leading spaces and trailing newline
    content = re.sub(r'^[ \t]*' + re.escape(prop) + r'\r?\n', '', content, flags=re.MULTILINE)

# 4. Facades
facades = """
  // AIState Facades
  get behaviorState() { const ai = this.getComponent('AIState'); return ai ? ai.behaviorState : 'idle'; }
  set behaviorState(val) { const ai = this.getComponent('AIState'); if (ai) { ai.behaviorState = val; this.notifyChange(); } else { this.addComponent(new AIState({behaviorState: val})); } }

  get currentTarget() { const ai = this.getComponent('AIState'); return ai ? ai.currentTarget : null; }
  set currentTarget(val) { const ai = this.getComponent('AIState'); if (ai) { ai.currentTarget = val; this.notifyChange(); } }

  get heardNoise() { const ai = this.getComponent('AIState'); return ai ? ai.heardNoise : false; }
  set heardNoise(val) { const ai = this.getComponent('AIState'); if (ai) { ai.heardNoise = val; this.notifyChange(); } }

  get noiseCoords() { const ai = this.getComponent('AIState'); return ai ? ai.noiseCoords : { x: 0, y: 0 }; }
  set noiseCoords(val) { const ai = this.getComponent('AIState'); if (ai) { ai.noiseCoords = val; this.notifyChange(); } }

  get noiseBlacklist() { const ai = this.getComponent('AIState'); return ai ? ai.noiseBlacklist : []; }
  set noiseBlacklist(val) { const ai = this.getComponent('AIState'); if (ai) { ai.noiseBlacklist = val; this.notifyChange(); } }

  get recentThreats() { const ai = this.getComponent('AIState'); return ai ? ai.recentThreats : []; }
  set recentThreats(val) { const ai = this.getComponent('AIState'); if (ai) { ai.recentThreats = val; this.notifyChange(); } }

  get goalTarget() { const ai = this.getComponent('AIState'); return ai ? ai.goalTarget : null; }
  set goalTarget(val) { const ai = this.getComponent('AIState'); if (ai) { ai.goalTarget = val; this.notifyChange(); } }

  get lastSeen() { const ai = this.getComponent('AIState'); return ai ? ai.lastSeen : false; }
  set lastSeen(val) { const ai = this.getComponent('AIState'); if (ai) { ai.lastSeen = val; this.notifyChange(); } }

  get targetSightedCoords() { const ai = this.getComponent('AIState'); return ai ? ai.targetSightedCoords : { x: 0, y: 0 }; }
  set targetSightedCoords(val) { const ai = this.getComponent('AIState'); if (ai) { ai.targetSightedCoords = val; this.notifyChange(); } }

  get lastScentSequence() { const ai = this.getComponent('AIState'); return ai ? ai.lastScentSequence : 0; }
  set lastScentSequence(val) { const ai = this.getComponent('AIState'); if (ai) { ai.lastScentSequence = val; this.notifyChange(); } }

  get isAlerted() { const ai = this.getComponent('AIState'); return ai ? ai.isAlerted : false; }
  set isAlerted(val) { const ai = this.getComponent('AIState'); if (ai) { ai.isAlerted = val; this.notifyChange(); } }

  get currentPath() { const ai = this.getComponent('AIState'); return ai ? ai.currentPath : null; }
  set currentPath(val) { const ai = this.getComponent('AIState'); if (ai) { ai.currentPath = val; this.notifyChange(); } }

  get hasDemanded() { const ai = this.getComponent('AIState'); return ai ? ai.hasDemanded : false; }
  set hasDemanded(val) { const ai = this.getComponent('AIState'); if (ai) { ai.hasDemanded = val; this.notifyChange(); } }

  get hasExtorted() { const ai = this.getComponent('AIState'); return ai ? ai.hasExtorted : false; }
  set hasExtorted(val) { const ai = this.getComponent('AIState'); if (ai) { ai.hasExtorted = val; this.notifyChange(); } }

  get fleeRecoverChance() { const ai = this.getComponent('AIState'); return ai ? ai.fleeRecoverChance : 0; }
  set fleeRecoverChance(val) { const ai = this.getComponent('AIState'); if (ai) { ai.fleeRecoverChance = val; this.notifyChange(); } }

  get stunnedTurns() { const ai = this.getComponent('AIState'); return ai ? ai.stunnedTurns : 0; }
  set stunnedTurns(val) { const ai = this.getComponent('AIState'); if (ai) { ai.stunnedTurns = val; this.notifyChange(); } }
"""

if 'get behaviorState()' not in content:
    # insert before get x()
    content = content.replace(
        "  // Getters/setters for dual-coordinate rendering system",
        facades + "\n  // Getters/setters for dual-coordinate rendering system"
    )

# 5. toJSON
props_to_remove_json = [
    '      behaviorState: this.behaviorState,\n',
    '      currentTarget: this.currentTarget,\n',
    '      hasDemanded: this.hasDemanded,\n',
    '      hasExtorted: this.hasExtorted,\n',
    '      heardNoise: this.heardNoise,\n',
    '      noiseCoords: this.noiseCoords,\n',
    '      noiseBlacklist: this.noiseBlacklist,\n',
    '      recentThreats: this.recentThreats,\n',
    '      goalTarget: this.goalTarget,\n',
    '      currentPath: this.currentPath,\n',
    '      stunnedTurns: this.stunnedTurns,\n',
    '      lastSeen: this.lastSeen,\n',
    '      targetSightedCoords: this.targetSightedCoords,\n',
    '      lastScentSequence: this.lastScentSequence,\n',
    '      isAlerted: this.isAlerted,\n'
]
for p in props_to_remove_json:
    content = content.replace(p, '')

# 6. fromJSON
props_to_remove_fromjson = [
    '    if (data.behaviorState !== undefined) entity.behaviorState = data.behaviorState;\n',
    '    if (data.currentTarget !== undefined) entity.currentTarget = data.currentTarget;\n',
    '    if (data.hasDemanded !== undefined) entity.hasDemanded = data.hasDemanded;\n',
    '    if (data.hasExtorted !== undefined) entity.hasExtorted = data.hasExtorted;\n',
    '    if (data.heardNoise !== undefined) entity.heardNoise = data.heardNoise;\n',
    '    if (data.noiseCoords !== undefined) entity.noiseCoords = data.noiseCoords;\n',
    '    if (data.noiseBlacklist !== undefined) entity.noiseBlacklist = data.noiseBlacklist;\n',
    '    if (data.recentThreats !== undefined) entity.recentThreats = data.recentThreats;\n',
    '    if (data.goalTarget !== undefined) entity.goalTarget = data.goalTarget;\n',
    '    if (data.currentPath !== undefined) entity.currentPath = data.currentPath;\n',
    '    if (data.stunnedTurns !== undefined) entity.stunnedTurns = data.stunnedTurns;\n',
    '    if (data.lastSeen !== undefined) entity.lastSeen = data.lastSeen;\n',
    '    if (data.targetSightedCoords !== undefined) entity.targetSightedCoords = data.targetSightedCoords;\n',
    '    if (data.lastScentSequence !== undefined) entity.lastScentSequence = data.lastScentSequence;\n',
    '    if (data.isAlerted !== undefined) entity.isAlerted = data.isAlerted;\n'
]
for p in props_to_remove_fromjson:
    content = content.replace(p, '')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done transforming Entity.js")
