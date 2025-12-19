Universal Development Guidelines

Do not make any code changes without expressly being told to. Do not change any UI layouts unless specifically instructed to do so. Especially do not change any inventory grid formating or layouts.


## 💥 Blast Radius Rules - Critical vs Non-Critical Systems

**Core Principle**: Non-critical systems MUST fail gracefully without breaking the game.

### Critical Systems (Cannot Break):
These systems are **essential** for the game to function. If any fail, the entire game should halt with a clear error:
- **Initialization**: GameInitializationManager, core game loop
- **Player**: Player entity, movement, stats, turn management
- **Map**: GameMap, WorldManager, tile system, camera
- **Turn Management**: Turn counter, turn transitions, AP system

### Non-Critical Systems (Must Fail Gracefully):
These systems enhance gameplay but are **not required** for basic operation. They must handle failures without crashing:
- **Inventory UI**: Grid rendering, drag/drop, equipment display
- **Sound**: Audio playback, music, sound effects
- **Achievements**: Tracking, notifications, unlocks
- **Visual Effects**: Particles, animations, UI polish

### Implementation Requirements:

**Non-critical providers MUST:**
1. **Validate dependencies** before mounting
2. **Provide fallback UI** when dependencies are missing
3. **Log warnings** in development mode (not errors)
4. **Never throw exceptions** that could crash the game
5. **Gracefully degrade** functionality when unavailable

**Example Pattern for Non-Critical Providers:**
```jsx
// ✅ CORRECT - Graceful degradation
export const InventoryProvider = ({ children, manager }) => {
  if (!manager) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[InventoryProvider] No manager provided - waiting for initialization');
    }
    // Return children without inventory context
    return <>{children}</>;
  }
  // ... normal provider logic
};

// ❌ WRONG - Throwing error crashes the game
export const InventoryProvider = ({ children, manager }) => {
  if (!manager) {
    throw new Error('Manager required!'); // This breaks everything!
  }
};
```

**Mounting Order Rule:**
Non-critical providers should be children of critical providers and gate on their dependencies:
```jsx
// ✅ CORRECT - Gated on dependency
<GameProvider>
  {inventoryManager && (
    <InventoryProvider manager={inventoryManager}>
      {children}
    </InventoryProvider>
  )}
  {!inventoryManager && children}
</GameProvider>
```

Core Principles - Apply to ALL Code Changes

🎯 Stay Focused

Implement ONLY what's explicitly requested - resist adding "helpful" extra features

Don't anticipate future needs - build for current requirements, design for future extensibility

One concern per file/function - clear separation of responsibilities

Question scope creep - if you're tempted to add something not requested, ask first

🧩 Maintain Modularity

Pure JavaScript game logic separate from React UI components

No direct coupling between major systems (map ↔ inventory, etc.)

Event-driven communication - systems talk through events, not direct function calls

Self-contained components - each module should work independently when possible

📡 Event-Driven Architecture

Systems emit events, React components listen and re-render

Data flows one direction - game state → events → UI updates

No circular dependencies - if System A needs data from System B, use events or shared state

Events over direct calls - prefer emit('playerMoved', data) over inventory.updateLocation()

💾 Keep It Serializable




📱 Responsive & Performant

Scale across target resolutions (1920x1080 down to 1366x768)

Efficient re-renders - only update what actually changed

CSS best practices - modern techniques, avoid fixed pixels where possible

Mouse-driven interface - left-click primary, right-click context menus

Before Writing Code - Ask Yourself:

"Am I implementing exactly what was asked, nothing more?"

"Are my modules loosely coupled with clear boundaries?"

"Can this game state be saved/loaded from JSON?"

"Will this work at 1366x768 and 1920x1080?"

"How will I test this works before integrating with React?"

Red Flags - Stop and Ask:

Adding features not explicitly requested

Directly calling methods between major systems (map → inventory)

Creating circular dependencies or tight coupling

Making assumptions about UI layout or interaction patterns

Implementing complex features in a single large change

Skipping console/demo testing for non-UI code

Code Style Consistency:

ES6+ modern JavaScript

Pure functions where possible

Extensive comments explaining system interactions

Descriptive variable names (prefer clarity over brevity)

Consistent error handling patterns

When In Doubt:

Ask before expanding scope - "Should I also implement X?"

Propose architecture - "I'm thinking of solving this with Y approach, does that fit the overall design?"

Request clarification - "Do you want me to integrate this now or keep it separate for testing?"

Remember: Working incrementally is more important than being comprehensive. Build one piece well, test it, then move to the next piece.

## 🖥️ Electron-Friendly Development

Keep the game compatible with both web and desktop electron builds.

### File Path Guidelines

**✅ DO:**
- Use relative paths starting with `./` or `../` for electron compatibility
- Test both web and electron builds when adding new assets
- Use path patterns that work in both environments:
  ```javascript
  const basePaths = [
    '/images/assets/',           // Web mode
    './images/assets/',          // Electron mode
    '../images/assets/',         // Electron fallback
    './client/public/images/assets/', // Development fallback
  ];
  ```

**❌ DON'T:**
- Use absolute paths like `/images/` only - these fail in electron
- Assume `window.electronAPI` is always available (preload script can fail)
- Hard-code single path without fallbacks

### Module System Compatibility

**✅ DO:**
- Use CommonJS (`require()`) in electron scripts (main.js, preload.js)
- Use ES6 modules (`import/export`) in React/game code
- Check if `window.electronAPI` exists before using it

**❌ DON'T:**
- Mix module systems in the same file
- Use ES6 imports in electron main process files

### Asset Loading Strategy

**✅ DO:**
- Create unified asset loaders that try multiple paths
- Fall back gracefully when assets don't load
- Test asset loading in both web and electron builds
- Use the same path logic for similar asset types (entities, UI, sounds)

**❌ DON'T:**
- Create separate loaders for web vs electron
- Assume assets exist - always handle loading failures
- Skip testing in both environments

### Build Configuration

**✅ DO:**
- Keep `extraFiles` in package.json up to date when adding new asset folders
- Test both `npm run dev` (web) and `npm run electron-dev` during development
- Rebuild electron app when making asset or path changes

**❌ DON'T:**
- Only test in web mode during development
- Forget to update build configuration when adding new asset types

### Debugging in Electron

**✅ DO:**
- Use `console.log()` for debugging - it appears in electron dev tools
- Add keyboard shortcuts for dev tools access (F12, Ctrl+Shift+I)
- Test with dev tools auto-open during development if needed

**❌ DON'T:**
- Rely on browser dev tools shortcuts working by default in packaged apps
- Ship with dev tools auto-opening in production builds

### Quick Electron Compatibility Checklist

Before adding new features with assets or file access:

1. **Test both environments**: Run `npm run dev` AND `npm run electron-dev`
2. **Check asset paths**: Ensure new assets use multi-path loading strategy
3. **Verify packaging**: Update `extraFiles` in package.json if adding new folders
4. **Test packaged build**: Build and test the actual .exe when making path changes
5. **Handle failures gracefully**: All asset loading should have fallbacks

### Common Electron Issues to Avoid

- **Preload script failures**: Always check `window.electronAPI` exists before using
- **Path resolution**: Use `./` and `../` patterns that work in both environments  
- **Menu removal side effects**: Add manual keyboard shortcuts when removing default menu
- **Asset packaging**: Ensure all assets are included in `extraFiles` configuration

## 🖼️ Item Image Orientation Standard

**All rectangular item images MUST be landscape/horizontal orientation (width > height).**

### Rules:
- **Square items (1×1, 2×2)**: No orientation constraint
- **Rectangular items**: Image width MUST be greater than image height
- **All images**: Should be square canvas with transparent padding as needed

### Examples:
```
✅ CORRECT:
- 9mm Pistol (2×2): Image is square
- Rifle (4×1): Image is landscape/horizontal  
- Small Flashlight (2×1): Image is landscape/horizontal
- Baseball bat (3×1): Image is landscape/horizontal

❌ WRONG:
- Knife (1×2): Image is portrait/vertical
- Rifle (1×4): Image is portrait/vertical
```

### Why This Matters:
- **Consistency**: All rectangular items follow the same visual pattern
- **Rotation Logic**: Items rotate from horizontal (default) to vertical (90°)
- **Asset Creation**: Artists have one clear rule: make rectangular items wider than tall
- **Code Simplification**: Item definitions align with image orientation

### Implementation:
- Item definitions use `width` and `height` matching the image orientation
- When rotated 90°, `getActualWidth()` and `getActualHeight()` swap dimensions
- A 2×1 item becomes 1×2 when rotated (horizontal → vertical)

Model for Future Objects: Serializtion/Deserialization for game saving
Follow This Pattern:
Only save persistent state - data that defines the object's current condition
Avoid saving behavior - methods, event handlers, temporary calculations
Include position data for anything that has a location
Use type/subtype pattern for variants of the same object class
Implement both toJSON() and static fromJSON(data)
Store IDs for relationships rather than object references
Example for Future Inventory Items:
// Item serialization would include:
{
  id: "item-pistol-1",
  type: "item",
  subtype: "weapon",
  x: tileX,
  y: tileY,
  name: "9mm Pistol",
  durability: 85,
  ammoCount: 12,
  maxAmmo: 15,
  damage: 25,
  isEquipped: false
}
// What we DON'T save:
// - UI hover states
// - Temporary drag/drop positions
// - Calculated DPS values
// - Event listeners
This model ensures everything can be perfectly restored to its exact state while keeping save files compact and avoiding serialization of non-essential runtime data.