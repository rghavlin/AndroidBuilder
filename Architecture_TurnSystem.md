# Turn System Architecture Guidelines

**CRITICAL RULE: DO NOT MODIFY TURN PROCESSING WITHOUT READING THIS DOCUMENT.**

This document exists to prevent the accrual of technical debt via "quick patches." The turn system is the heart of the engine. Hacking `if` statements into the main turn loop to accommodate edge cases (like NPC dialogs, complex animations, or special UI pauses) breaks the game state and causes race conditions.

## The Problem (The "Wrong Way")
Historically, features were added by throwing boolean flags (e.g., `isAnimating`, `demandTriggered`) into the `endTurn` function, emitting events midway through calculations, and using `await` to pause the math thread until a CSS animation finished. 

**Why this fails:**
1. **Race Conditions:** Yielding a React hook (`async`/`await`) allows React to flush state updates unpredictably. A zombie might visually hit the player before the player's health mathematically updates.
2. **UI Freezes:** If an animation fails to fire or a path array is empty, the `await` promise hangs forever, freezing the game.
3. **Spaghetti State:** It becomes impossible to trace whether an event is triggered by math, a UI callback, or an animation completing.

## The Solution (The "Right Way")
The turn engine must adhere to a strict **Command Pattern** / **Action Queue** running atop a defined **State Machine**.

### 1. The State Machine
The game loop exists in one of the following explicit states (managed by `turnPhase`):
- `PLAYER_TURN`: Awaiting human input.
- `SIMULATING`: Running A* pathfinding, math, and AI logic. (Takes 0ms of visual time).
- `ANIMATING`: Playing the visual results of the simulation to the player.
- `PAUSED_FOR_EVENT`: Playback is paused (e.g., waiting for an NPC demand dialog response).

### 2. Phase 1: Simulation (Math Only)
When a turn ends, the engine calculates the **entire** round for all entities instantly.
- **Rule:** AI logic (Zombies, Rabbits, NPCs) MUST NOT emit visual events, play sounds, trigger dialogs, or `await` anything.
- **Rule:** Entities calculate their math and push `Action` objects into a master `actionQueue`.
- Example Action: `{ type: 'move', entityId: 'zombie_1', to: {x: 5, y: 10} }`
- Example Action: `{ type: 'demand', entityId: 'npc_2' }`
- **AI Execution Models Split:** Zombies currently use a declarative ECS Intent-Component model (`AISystem`), while NPCs and Rabbits use legacy imperative mutation. For details on routing guidelines and the long-term unification plan, refer to the [AI Architecture Guidelines](file:///c:/Games/AndroidBuilder/Architecture_AI.md).

### 3. Phase 2: Playback (Visuals & Side-Effects)
Once `simulateTurn()` generates the queue, it hands it to `playbackTurn()`.
- **Rule:** Animations, sounds, and UI popups ONLY happen during this phase.
- The queue is processed chronologically.
- If the playback system encounters a `demand` action, it switches the global state to `PAUSED_FOR_EVENT`, renders the Dialog UI, and completely suspends queue playback.

### 4. Interactive Interruptions
If an NPC or event requires player input *during* the AI turn (like an extortion demand):
1. **DO NOT** use `break` statements to abort the AI loop prematurely.
2. **DO NOT** emit a global event and hope the UI catches it in time to block movement.
3. **DO** push an interrupt action (e.g., `{ type: 'demand' }`) into the queue.
4. When the playback queue hits the interrupt action, it halts. Once the player clicks a button on the UI (e.g., "Surrender"), the UI callback fires a function to resume the queue from where it left off.

## Summary Checklist for New Turn Features
- [ ] Does my feature calculate its outcome instantly without waiting on the UI?
- [ ] Is my feature implemented as an `Action` pushed to the queue?
- [ ] Does my feature rely on the playback engine to handle its animations and sounds?
- [ ] If my feature pauses the game, does it explicitly shift the `turnPhase` state machine instead of adding a new boolean flag?

If you answered "No" to any of these, **STOP**. You are doing it the wrong way. Redesign the feature to fit the Command Pattern queue.
