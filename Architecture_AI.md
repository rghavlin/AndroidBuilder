# AI Execution Model Architecture Guidelines

This document details the split between the two active AI execution models in the engine, establishes routing guidelines for new entity types, and outlines the long-term plan for unifying them under a single architecture.

---

## 1. The Present Split: ECS-Intent vs. Legacy Imperative

Currently, the engine uses two completely different execution models for entity AI during the turn simulation:

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
* **Files**: [AISystem.js](file:///c:/Games/AndroidBuilder/client/src/game/systems/AISystem.js), [IntentQueue.js](file:///c:/Games/AndroidBuilder/client/src/game/managers/IntentQueue.js)
* **Mechanic**: Zombies do not perform any actions directly. During the turn cycle, `AISystem.process` inspects each active zombie and queues declarative component intents (like `MoveIntent` or `DamageIntent`) into the `IntentQueue`.
* **Resolution**: The `IntentQueue` resolves these intents sequentially. For instance, if two zombies attempt to walk onto the same tile, the first one succeeds, and the second one's intent is blocked, prompting a path recalculation or fallback action.
* **Benefit**: Swarm/collision resolution is deterministic and handled in a single centralized loop.

### Legacy Imperative Mutation (NPCs & Rabbits)
* **Files**: [NPCAI.js](file:///c:/Games/AndroidBuilder/client/src/game/ai/NPCAI.js), [RabbitAI.js](file:///c:/Games/AndroidBuilder/client/src/game/ai/RabbitAI.js)
* **Mechanic**: NPCs and rabbits are processed individually after the intent cycle. `NPCAI.executeNPCTurn()` directly alters the entity's coordinates, runs pathfinding, and mutates target structures/entities immediately.
* **Benefit/Constraint**: NPCs often involve complex dialogues or player interruptions (like shopkeeper interactions and extortion demands) that freeze playback. These are handled using legacy call paths.

---

## 2. Routing Guidelines for New Entity Types

To prevent further architectural fragmentation, new entity types must follow these routing rules:

1. **Swarms & Physics-Collision Entities (e.g., Animals, Hordes, Sentries)**:
   * **Route**: **ECS-Intent System**.
   * **Rule**: Do NOT write direct state-mutating AI loops. Instead, create an AI behavior component (e.g. `AnimalBehavior`) and register their decision tree in `AISystem.js`.
   * **Intents**: Queue existing intents (`MoveIntent`, `DamageIntent`) or introduce clean new intent classes in `client/src/game/components/` (like `FleeIntent`).

2. **Interactive/Dialog-Driven Entities (e.g., Quest Givers, Companions)**:
   * **Route**: **Legacy Imperative / Dedicated Controller**.
   * **Rule**: If the entity requires multi-step dialog prompt interruptions that pause turn playback or require synchronous player response UI, implement them alongside the NPC model until the long-term unification is complete.

---

## 3. Long-Term Unification Plan

The goal is to migrate NPCs and Rabbits into the ECS Intent/Component model. This should be executed in phases:

### Phase A: Component Migration
* Extract NPC-specific logic (e.g. `heardNoise`, `fleeRecoverChance`, NPC behavior states) from the flat `Entity` prototype and wrap them in a clean `NPCBehavior` component (similar to `AIBehavior` used for zombies).

### Phase B: Introduce Dialog/Interaction Intents
* Introduce an `InteractIntent` (or `DemandIntent`) that encapsulates player interactions. 
* Instead of pausing during the simulation phase, `AISystem` should queue these intents.

### Phase C: Decentralize Resolution
* Integrate NPC and Rabbit decision-making loops into `AISystem.process`.
* Extend `IntentQueue.resolve` to process NPC/Rabbit actions. All movement and combat conflict resolution will then happen in a single pass, eliminating potential race conditions between NPCs and zombies.
