# Master System Architecture & Regression Prevention Guide

**CRITICAL RULE: DO NOT IMPLEMENT NEW FEATURES OR MODIFY GAME LOGIC WITHOUT CONSULTING THIS DOCUMENT.**

This document provides the foundational architectural rules for the entire codebase. The goal is to prevent regressions caused by "quick fixes" that violate these paradigms. If a feature request conflicts with these rules, **refactor the feature to fit the rules, or propose an architectural shift first.**

---

## 1. Core Paradigm: Separation of Engine vs. React

The codebase is strictly divided into two halves: the **Vanilla JS Engine** (Math/Logic) and the **React UI** (Presentation).

* **Anti-Pattern (Regression Cause):** Running game logic inside React components (e.g., calling `setTimeout` in a `useEffect` to move a zombie) or trying to render React elements from the engine (e.g., throwing an error that crashes the React tree from a background loop).

### The Engine (Source of Truth)
* Located in [client/src/game/](file:///c:/Games/AndroidBuilder/client/src/game/).
* Contains `GameMap`, `InventoryManager`, `Pathfinding`, and all Entities (`Zombie`, `Player`, `NPC`).
* **Rule:** The Engine is purely mathematical. It runs instantly. It does not know that the UI exists. It does not `await` CSS animations. It does not wait for a user to click a dialog button mid-function.

### The React UI (Presentation Layer)
* Located in [client/src/components/](file:///c:/Games/AndroidBuilder/client/src/components/) and [client/src/contexts/](file:///c:/Games/AndroidBuilder/client/src/contexts/).
* **Rule:** The UI only *reads* the Engine's state and renders it. It sends user input (clicks, key presses) to the Engine. It does NOT calculate damage, pathfinding, or turn order.

---

## 2. Event-Driven Communication (`GameEvents`)

Because the Engine and the React UI are separated, they communicate via an Event Bus (`GameEvents.js`).

* **Anti-Pattern (Regression Cause):** Emitting an event from the Engine and expecting the UI to return data synchronously to continue the Engine's loop.

* **Rule: Events are "Fire and Forget."**
  The Engine emits `GAME_EVENT.ZOMBIE_ATTACK`. It assumes the attack happened. It does not care if the UI successfully plays a sound or shows a blood splatter.
* **Rule: No Blocking Events.**
  Never use `GameEvents` to pause the game engine. If the engine needs to pause for player input (like an NPC Demand), it must yield via a State Machine, not by firing an event and halting a `while` loop.

---

## 3. The Turn System (Command Pattern & Action Queue)

The turn processing loop (`endTurn` in `GameContext`) orchestrates the AI.

* **Anti-Pattern (Regression Cause):** Pausing the turn logic midway through calculating AI to wait for animations, or mutating game state asynchronously.

* **Rule: Zero-Time Simulation.**
  When "End Turn" is clicked, all AI (`ZombieAI`, `NPCAI`) calculates its math instantly and synchronously. It pushes `Action` objects (Move, Attack, Demand) into an `ActionQueue`.
* **Rule: Playback is Separate.**
  Animations, sounds, and UI popups only occur when the `ActionQueue` is played back. 
* **Rule: State Machine for Pauses.**
  If an Action requires user input (e.g., a `demand` action), the queue switches the global state to `PAUSED_FOR_EVENT` and stops playing. Once the user clicks a button, a callback resumes the queue.

### The Turn Phase State Machine
The game loop exists in one of the following explicit states (managed by `turnPhase`):
* `PLAYER_TURN`: Awaiting human input.
* `SIMULATING`: Running A* pathfinding, math, and AI logic (takes 0ms of visual time).
* `ANIMATING`: Playing the visual results of the simulation to the player.
* `PAUSED_FOR_EVENT`: Playback is paused (e.g., waiting for an NPC demand dialog response).

### Interactive Interruptions
If an NPC or event requires player input *during* the AI turn (like an extortion demand):
1. **DO NOT** use `break` statements to abort the AI loop prematurely.
2. **DO NOT** emit a global event and hope the UI catches it in time to block movement.
3. **DO** push an interrupt action (e.g., `{ type: 'demand' }`) into the queue.
4. When the playback queue hits the interrupt action, it halts. Once the player clicks a button on the UI (e.g., "Surrender"), the UI callback fires a function to resume the queue from where it left off.

---

## 4. AI Execution Models

The engine supports two distinct execution models for entity AI during turn simulation:

```
                  Simulation Loop (SimulationManager.runTurn)
                                       |
           +----------------------------+----------------------------+
           |                                                         |
    [ECS Intent Cycle]                                      [Legacy Imperative]
    (Zombies via AISystem)                                  (NPCs / Rabbits via AI files)
           |                                                         |
    - Evaluates state and vision.                           - Evaluates state.
    - Mutates NO game state directly.                       - Mutates coordinates/map directly.
    - Pushes intents (MoveIntent, DamageIntent).            - Calls combat/map systems immediately.
           |                                                         |
           v                                                         v
    [IntentQueue.resolve]                                   [Simulation Complete]
    - Resolves cascading path collisions and breaches.      - Returns actionQueue to playback.
```

### ECS Intent-Component System (Zombies)
* **Mechanic:** Swarm-like entities do not perform actions directly. During the turn cycle, `AISystem.process` inspects each active entity and queues declarative component intents (like `MoveIntent` or `DamageIntent`) into the `IntentQueue`.
* **Resolution:** The `IntentQueue` resolves these intents sequentially. For instance, if two zombies attempt to walk onto the same tile, the first one succeeds, and the second one's intent is blocked, prompting a path recalculation or fallback action.
* **Benefit:** Swarm/collision resolution is deterministic and handled in a single centralized loop.

### Legacy Imperative Mutation (NPCs & Rabbits)
* **Mechanic:** NPCs and rabbits are processed individually after the intent cycle. `NPCAI.executeNPCTurn()` directly alters the entity's coordinates, runs pathfinding, and mutates target structures/entities immediately.
* **Constraint:** NPCs often involve complex dialogues or player interruptions (like shopkeeper interactions and extortion demands) that freeze playback. These are handled using legacy call paths.

### Routing Guidelines for New Entity Types
To prevent further architectural fragmentation, new entity types must follow these routing rules:
1. **Swarms & Physics-Collision Entities (e.g., Animals, Hordes, Sentries)**:
   * **Route:** **ECS-Intent System**.
   * **Rule:** Do NOT write direct state-mutating AI loops. Instead, create an AI behavior component (e.g., `AnimalBehavior`) and register their decision tree in `AISystem.js`.
   * **Intents:** Queue existing intents (`MoveIntent`, `DamageIntent`) or introduce clean new intent classes in `client/src/game/components/` (like `FleeIntent`).
2. **Interactive/Dialog-Driven Entities (e.g., Quest Givers, Companions)**:
   * **Route:** **Legacy Imperative / Dedicated Controller**.
   * **Rule:** If the entity requires multi-step dialog prompt interruptions that pause turn playback or require synchronous player response UI, implement them alongside the NPC model until the long-term unification is complete.

### Long-Term Unification Plan
The goal is to migrate NPCs and Rabbits into the ECS Intent/Component model. This should be executed in phases:
* **Phase A: Component Migration:** Extract NPC-specific logic (e.g., `heardNoise`, `fleeRecoverChance`, NPC behavior states) from the flat `Entity` prototype and wrap them in a clean `NPCBehavior` component (similar to `AIBehavior` used for zombies).
* **Phase B: Introduce Dialog/Interaction Intents:** Introduce an `InteractIntent` (or `DemandIntent`) that encapsulates player interactions. Instead of pausing during the simulation phase, `AISystem` should queue these intents.
* **Phase C: Decentralize Resolution:** Integrate NPC and Rabbit decision-making loops into `AISystem.process`. Extend `IntentQueue.resolve` to process NPC/Rabbit actions. All movement and combat conflict resolution will then happen in a single pass, eliminating potential race conditions between NPCs and zombies.

---

## 5. Inventory System & Bartering

The `InventoryManager` handles items, slots, grids, and ownership.

* **Anti-Pattern (Regression Cause):** Trusting the React UI `DragDropContext` as the source of truth, or allowing items to belong to two containers simultaneously.

* **Rule: The Engine Owns the Items.**
  The React UI simply visualizes the `Container` objects. When an item is dragged, the UI calls `inventoryManager.moveItem()`. The Engine decides if the move is legal (e.g., checking volume limits, weight limits, and ownership).
* **Rule: Strict NPC Segregation.**
  NPCs have their own isolated inventory systems. Bartering works by moving items to temporary "Offer" grids. The Engine must strictly validate that items returning to the player from the "You Offer" grid belong to the player, not the NPC.

---

## 6. Pathfinding, FOV, and AI Priority

* **Anti-Pattern (Regression Cause):** Overloading the main thread with massive calculations, causing the UI to lock up.

* **Rule: Vision First.**
  AI logic always checks `LineOfSight` before attempting `Pathfinding`. A* pathfinding is expensive. Do not call `findPath` across the entire map for 200 zombies if they haven't seen the player.
* **Rule: Entity Filtering.**
  When an entity moves, `moveEntity` verifies the target tile using `isWalkable(entity)`. A tile might be Walkable for pathfinding but Blocked because another entity stepped there first. The AI must gracefully skip its action if its planned step becomes blocked.

---

## 7. Context & State Management Rules

### State Machine (GameInitializationManager)
* Pure JavaScript — no React hooks, no context imports.
* Each phase must fully complete before the next begins (no scattered `if (!gridPreloaded)` checks).
* Phases:
  * **PRELOADING**: Grid calculations, asset/config loading.
  * **CORE_SETUP**: `WorldManager`, map generation, player creation, camera setup.
  * **WORLD_POPULATION**: Entity spawning, FOV calculation, event listeners.
  * **COMPLETE**: Initialization complete, ready for player interaction.

### Context Refactoring & `useGame()` Deprecation
* The monolithic `GameContext` has been split into smaller contexts:
  * [PlayerContext.jsx](file:///c:/Games/AndroidBuilder/client/src/contexts/PlayerContext.jsx) -> Player refs and stats.
  * [GameMapContext.jsx](file:///c:/Games/AndroidBuilder/client/src/contexts/GameMapContext.jsx) -> Map refs and methods.
  * [CameraContext.jsx](file:///c:/Games/AndroidBuilder/client/src/contexts/CameraContext.jsx) -> Camera ref and methods.
* **Rule:** Components must access these contexts directly rather than through the legacy `useGame()` aggregation hook where possible. Keep aggregation hooks only for global orchestrations.
* **Avoid Phantom Imports:** Only import sub-contexts that the component explicitly uses.

### Context & State Guardrails ("What NOT to Do")
* ❌ **Don't patch the existing initialization inline** — delegate completely to `GameInitializationManager`.
* ❌ **Don't create circular dependencies** via React `useCallback` dependency arrays.
* ❌ **Don't make the initialization state machine depend on React state or hooks.**
* ❌ **Don't split contexts all at once** — do it file by file, verifying after each step.
* ❌ **Don't scatter preloading checks** like `if (!gridPreloaded)` across components; handle preloading entirely in the manager.

---

## Checklist to Prevent Regressions Before Writing Code:
1. **Am I blurring the lines between Math and UI?** (e.g., adding `isAnimating` to a core AI script).
2. **Am I creating a race condition?** (e.g., relying on `setTimeout` to sync game state).
3. **Is my source of truth correct?** (e.g., reading a React `useState` array to calculate damage instead of checking the `Player` class).
4. **Does this break if the player clicks rapidly?** (e.g., overlapping `endTurn` calls).
5. **Does this action require player input during the turn?** If so, did I push an interrupt action to the playback queue instead of halting mid-simulation?

---

## 8. UI Theming and Styling (Light/Dark Mode)

The UI is currently designed with a dark, skeuomorphic aesthetic (hardcoded hex colors, gradients, and custom CSS classes). A plan exists to support a dynamic Light/Dark theme toggle. When working on UI components, adhere to the following rules to prevent compounding technical debt:

* **Rule: Use Semantic Tailwind Classes.**
  Avoid hardcoding utility colors like `bg-zinc-950`, `bg-[#1a1a1a]`, or `border-[#333]` directly in React components. Instead, use semantic CSS variables defined in `client/src/index.css` via Tailwind (e.g., `bg-background`, `bg-card`, `border-border`).
* **Rule: Abstract Custom CSS for Themes.**
  If creating custom CSS classes (e.g., `.metal-panel`, `.inset-slot`), do not assume a strictly dark context. Structure them so they can be overridden when a `.light` class is applied to the root document.
* **Rule: Canvas Rendering Colors must be Configurable.**
  When adding new entities, terrains, or visual effects to `TileRenderer.js` or `EntityRenderer.js`, avoid hardcoding colors like `ctx.fillStyle = '#1a3c1a'`. Reference a palette object (like `TERRAIN_COLORS`) so that colors can dynamically swap when the application theme changes.

For the full implementation plan to transition to a toggleable Light/Dark theme, see [UI_THEMING_PLAN.md](file:///c:/Games/AndroidBuilder/UI_THEMING_PLAN.md).
