# Master System Architecture & Regression Prevention Guide

**CRITICAL RULE: DO NOT IMPLEMENT NEW FEATURES WITHOUT CONSULTING THIS DOCUMENT.**

This document provides the foundational architectural rules for the entire codebase. The goal is to prevent regressions caused by "quick fixes" that violate these paradigms. If a feature request conflicts with these rules, **refactor the feature to fit the rules, or propose an architectural shift first.**

---

## 1. Core Paradigm: Separation of Engine vs. React

The codebase is strictly divided into two halves: the **Vanilla JS Engine** (Math/Logic) and the **React UI** (Presentation). 
**Anti-Pattern (Regression Cause):** Trying to run game logic inside React components (e.g., calling `setTimeout` in a `useEffect` to move a zombie) or trying to render React elements from the engine (e.g., throwing an error that crashes the React tree from a background loop).

### The Engine (Source of Truth)
- Located in `client/src/game/`.
- Contains `GameMap`, `InventoryManager`, `Pathfinding`, and all Entities (`Zombie`, `Player`, `NPC`).
- **Rule:** The Engine is purely mathematical. It runs instantly. It does not know that the UI exists. It does not `await` CSS animations. It does not wait for a user to click a dialog button mid-function.

### The React UI (Presentation Layer)
- Located in `client/src/components/` and `client/src/contexts/`.
- **Rule:** The UI only *reads* the Engine's state and renders it. It sends user input (clicks, key presses) to the Engine. It does NOT calculate damage, pathfinding, or turn order.

---

## 2. Event-Driven Communication (`GameEvents`)

Because the Engine and the React UI are separated, they communicate via an Event Bus (`GameEvents.js`).
**Anti-Pattern (Regression Cause):** Emitting an event from the Engine and expecting the UI to return data synchronously to continue the Engine's loop.

- **Rule: Events are "Fire and Forget."**
  The Engine emits `GAME_EVENT.ZOMBIE_ATTACK`. It assumes the attack happened. It does not care if the UI successfully plays a sound or shows a blood splatter.
- **Rule: No Blocking Events.**
  Never use `GameEvents` to pause the game engine. If the engine needs to pause for player input (like an NPC Demand), it must yield via a State Machine, not by firing an event and halting a `while` loop.

---

## 3. The Turn System (Command Pattern & Action Queue)

The turn processing loop (`endTurn` in `GameContext`) orchestrates the AI.
**Anti-Pattern (Regression Cause):** Pausing the turn logic midway through calculating AI to wait for animations, or mutating game state asynchronously.

- **Rule: Zero-Time Simulation.**
  When "End Turn" is clicked, all AI (`ZombieAI`, `NPCAI`) calculates its math instantly and synchronously. It pushes `Action` objects (Move, Attack, Demand) into an `ActionQueue`.
- **Rule: Playback is Separate.**
  Animations, sounds, and UI popups only occur when the `ActionQueue` is played back. 
- **Rule: State Machine for Pauses.**
  If an Action requires user input (e.g., a `demand` action), the queue switches the global state to `PAUSED_FOR_EVENT` and stops playing. Once the user clicks a button, a callback resumes the queue.

---

## 4. Inventory System & Bartering

The `InventoryManager` handles items, slots, grids, and ownership.
**Anti-Pattern (Regression Cause):** Trusting the React UI `DragDropContext` as the source of truth, or allowing items to belong to two containers simultaneously.

- **Rule: The Engine Owns the Items.**
  The React UI simply visualizes the `Container` objects. When an item is dragged, the UI calls `inventoryManager.moveItem()`. The Engine decides if the move is legal (e.g., checking volume limits, weight limits, and ownership).
- **Rule: Strict NPC Segregation.**
  NPCs have their own isolated inventory systems. Bartering works by moving items to temporary "Offer" grids. The Engine must strictly validate that items returning to the player from the "You Offer" grid belong to the player, not the NPC.

---

## 5. Pathfinding, FOV, and AI Priority

**Anti-Pattern (Regression Cause):** Overloading the main thread with massive calculations, causing the UI to lock up.

- **Rule: Vision First.**
  AI logic always checks `LineOfSight` before attempting `Pathfinding`. A* pathfinding is expensive. Do not call `findPath` across the entire map for 200 zombies if they haven't seen the player.
- **Rule: Entity Filtering.**
  When an entity moves, `moveEntity` verifies the target tile using `isWalkable(entity)`. A tile might be Walkable for pathfinding but Blocked because another entity stepped there first. The AI must gracefully skip its action if its planned step becomes blocked.

---

## 6. AI Execution Models (Zombies vs. NPCs)

The codebase splits AI execution between a declarative ECS intent-component system (Zombies) and legacy imperative mutation (NPCs and Rabbits).

- **Rule: ECS-Intent for Swarms.** Swarm-like entities must queue intents (`MoveIntent`, `DamageIntent`) via the `AISystem` rather than mutating state directly.
- **Plan: Long-Term Unification.** For details on routing guidelines and the long-term plan to unify NPC behavior under the ECS model, refer to the [AI Architecture Guidelines](file:///c:/Games/AndroidBuilder/Architecture_AI.md).

---

## Checklist to Prevent Regressions Before Writing Code:
1. **Am I blurring the lines between Math and UI?** (e.g., adding `isAnimating` to a core AI script).
2. **Am I creating a race condition?** (e.g., relying on `setTimeout` to sync game state).
3. **Is my source of truth correct?** (e.g., reading a React `useState` array to calculate damage instead of checking the `Player` class).
4. **Does this break if the player clicks rapidly?** (e.g., overlapping `endTurn` calls).

If a feature violates any of these paradigms, redesign the feature or propose an architectural refactor.
