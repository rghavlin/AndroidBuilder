Goal

Replace the current ad-hoc loading system with a proper initialization state machine, then divide the monolithic GameContext into smaller context files, and finally integrate preloading in a controlled way — all while preventing dependency cycles and scattered checks.

Key Requirements
1. State Machine (GameInitializationManager)

Create src/game/GameInitializationManager.js.

Pure JavaScript — no React hooks, no context imports.

Define clear states:

const INIT_STATES = {
  IDLE: 'idle',
  PRELOADING: 'preloading',
  CORE_SETUP: 'core_setup', 
  WORLD_POPULATION: 'world_population',
  COMPLETE: 'complete',
  ERROR: 'error'
};


Each phase must fully complete before the next begins (no scattered if (!gridPreloaded) checks).

Phases:

Preloading: grid calculations, asset/config loading.

Core Setup: WorldManager, map generation, player creation, camera setup.

World Population: entity spawning, FOV calculation, event listeners.

2. Integration with GameContext

GameContext should keep a simple initializationState in React state.

Only expose a single initializeGame() method that delegates to GameInitializationManager.

GameInitializationManager emits events (stateChanged, initializationComplete, initializationError), and GameContext listens/updates state accordingly.

Remove gridPreloaded flags and inline checks from GameContext — sequencing belongs to the state machine.

3. Context Refactoring (After State Machine is Working)

Split the monolithic GameContext into smaller contexts incrementally:

PlayerContext.jsx → player refs and stats.

GameMapContext.jsx → map refs and methods.

CameraContext.jsx → camera ref and methods.

Each context must provide its own provider + hook (usePlayer, useGameMap, useCamera).

Update imports step by step, verifying game runs after each split.

Avoid phantom imports — only create new context files when splitting intentionally.

4. Preloading Integration

Preloading logic runs only inside the state machine’s PRELOADING phase.

No React checks like if (!gridPreloaded) scattered across components.

The manager handles grid calculations and emits a preloadComplete event before moving to CORE_SETUP.

GameContext just reflects the current initializationState for UI purposes.

What NOT to Do

❌ Don’t patch the existing initializeNewGame inline — replace it with delegation.

❌ Don’t create circular dependencies via useCallback arrays.

❌ Don’t make the state machine depend on React state/hooks.

❌ Don’t split contexts all at once — do it file by file, verifying each step.

Implementation Approach

Rollback to stable monolithic GameContext.

Create GameInitializationManager with states + event system.

Move init logic from GameContext into the manager’s phases.

Replace initializeNewGame with a call to manager.startInitialization().

Test that init runs in correct sequence, no dependency cycles.

Split contexts incrementally (Player, GameMap, Camera).

Implement preloading strictly inside the manager.

Critical Principle

The state machine is the single source of truth for initialization sequencing.

GameContext = thin React wrapper.

Context files = organized access to refs/state.

No React logic leaks into the state machine.

✅ This plan ensures:

Initialization is clean, testable, and event-driven.

Context files are modular and easy to maintain.

Preloading is centralized and cannot scatter back into UI code.


usegame() Migration:
Recommendation
YES, it would improve the code to deprecate useGame() and use direct sub-context access, but with a gradual migration strategy:

Phase 1: Update new components to use direct access
Phase 2: Refactor existing components one by one
Phase 3: Remove useGame() when no longer used

This aligns perfectly with Universal Goals:

✅ Stay Focused: Components only import what they need
✅ Maintain Modularity: Clear separation of concerns
✅ Better Architecture: Explicit dependencies make the system easier to understand
The current useGame() hook has served its purpose as a migration bridge and can now be phased out in favor of the cleaner, more modular direct access pattern.

Example of improved MapCanvas pattern:

// Instead of: const { gameMap, player, camera, handleTileClick } = useGame();
const { gameMap, handleTileClick } = useGameMap();
const { player, playerFieldOfView } = usePlayer();
const { camera } = useCamera();
This would make MapCanvas's dependencies explicit and align with the modular architecture goals outlined in both documents.

PHASE 4 and PHASE 5:

Based on the comprehensive analysis and the current state of the State Machine Project, here's a detailed plan for implementing Phase 4 and Phase 5:

Phase 4: Complete useGame() Deprecation
Step 1: Identify Remaining useGame() Usage
Objective: Audit the codebase to find all remaining components using the useGame() aggregation pattern.

Implementation Plan:

Search Strategy: Scan all .jsx, .tsx, and .ts files for useGame() imports and usage
Expected Remaining Files:
Components in /components/Game/ directory that haven't been migrated yet
Any utility functions or hooks that might still use aggregated access
Test files that might be using the old pattern
Files to Check:

DevConsole.jsx - likely uses game state for debugging
GameControls.tsx - may need player stats and turn management
StartMenu.tsx - might use initialization functions
Any remaining inventory components that interact with game state
Step 2: Migrate Legacy Components
Objective: Convert remaining components to direct sub-context access pattern.

Migration Pattern (based on successful MapCanvas migration):

// OLD PATTERN (to be removed):
const { gameMap, player, camera, handleTileClick, turn, endTurn } = useGame();
// NEW PATTERN (direct access):
const { playerRef, playerStats, isMoving } = usePlayer();
const { gameMapRef, handleTileClick, hoveredTile } = useGameMap();
const { cameraRef } = useCamera();
const { turn, endTurn, isInitialized } = useGame(); // Only initialization/orchestration
Per-Component Strategy:

GameControls.tsx: Migrate to usePlayer() for stats, useGame() only for turn management
DevConsole.jsx: Direct access to specific contexts for debugging data
StartMenu.tsx: Keep useGame() only for initializeGame() function
Step 3: Remove useGame() Aggregation
Objective: Clean up the legacy aggregation system once no longer needed.

Implementation Steps:

Remove aggregation logic from GameContext.jsx
Simplify the useGame() hook to only expose orchestration functions
Update context value to remove sub-context data aggregation
Clean up any unused imports or dependencies
Phase 5: Advanced Features
Step 1: Enhanced Error Boundaries
Objective: Implement context-specific error handling with graceful degradation.

Implementation Plan:

// PlayerErrorBoundary.tsx - wraps player-specific operations
// GameMapErrorBoundary.tsx - handles map rendering/interaction errors  
// CameraErrorBoundary.tsx - manages viewport/rendering issues
Features:

Context-specific error recovery strategies
Fallback UI components for each context type
Error reporting with context information
Automatic retry mechanisms for transient failures
Step 2: Performance Optimization
Objective: Implement selective re-render patterns to minimize unnecessary updates.

Optimization Strategies:

Context Splitting: Further split contexts if needed

// Split PlayerContext into:
// - PlayerDataContext (stats, position - changes frequently)
// - PlayerConfigContext (static data - rarely changes)
Memoization Patterns:

Memoize expensive calculations in context providers
Use React.memo() for component optimization
Implement custom comparison functions for complex objects
Selective Subscriptions:

// Allow components to subscribe to specific data slices
const { playerStats } = usePlayerData(['hp', 'ap']); // Only re-render on HP/AP changes
const { position } = usePlayerData(['x', 'y']); // Only re-render on position changes
Step 3: Feature Expansion Framework
Objective: Establish patterns for cleanly integrating new game systems.

New Context Integration Pattern:

// Example: InventoryContext.jsx (if/when needed)
// - Follows established provider + hook pattern
// - Integrates with existing event system
// - Maintains serialization compatibility
// - No direct coupling with other contexts
Expansion Areas:

Sound System Context: Audio management and spatial sound
UI State Context: Modal management, notifications, tooltips
Network Context: Multiplayer communication (if planned)
Settings Context: User preferences and configuration
Implementation Timeline
Phase 4 (Immediate Priority)
Estimated Time: 2-3 development sessions

Session 1: Audit and identify remaining useGame() usage
Session 2: Migrate 2-3 components to direct access pattern
Session 3: Remove aggregation logic and clean up
Phase 5 (Medium-term Enhancement)
Estimated Time: 4-6 development sessions

Sessions 1-2: Implement enhanced error boundaries
Sessions 3-4: Performance optimization and selective subscriptions
Sessions 5-6: Feature expansion framework and first new context
Success Criteria
Phase 4 Complete When:
✅ Zero remaining useGame() aggregation calls in components
✅ GameContext only exposes orchestration functions
✅ All components use direct sub-context access
✅ No breaking changes to existing functionality
Phase 5 Complete When:
✅ Error boundaries provide graceful failure handling
✅ Performance metrics show reduced unnecessary re-renders
✅ Framework established for future context additions
✅ At least one new game system successfully integrated
Risk Mitigation
Incremental Migration: Migrate one component at a time to avoid breaking changes
Testing Strategy: Verify game functionality after each component migration
Rollback Plan: Keep git commits focused on single component migrations
Performance Monitoring: Track re-render counts during optimization phase
This plan builds on the excellent foundation already established and maintains alignment with Universal Goals while preparing the architecture for future expansion.