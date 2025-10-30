
# Testing Protocol

**Project:** Zombie Road  
**Date:** 2025-01-28  
**Status:** Active - All inventory testing uses in-game console

---

## Golden Rule: In-Game Console Only

**ALL inventory and game system testing MUST use the in-game Dev Console (`~` key).**

### Why This Matters

**Browser Console Problems:**
- ❌ Triggers Vite hot module reloads
- ❌ Causes timing issues with module loading
- ❌ Breaks the controlled test environment
- ❌ Can chain into worse issues requiring significant debugging time
- ❌ Does not have access to game context properly

**In-Game Console Benefits:**
- ✅ Isolated from Vite's HMR (Hot Module Replacement)
- ✅ Direct access to game state and managers
- ✅ Controlled test environment
- ✅ Predefined test commands that verify specific functionality
- ✅ Automatic UI refresh triggers
- ✅ Consistent results across test runs

---

## Test Command Architecture

### Command Types

**Verification Commands** - Test that features are working correctly:
- `phase5`, `phase5b`, `phase5c`, `phase5d`, `phase5e` - Automated test suites
- Each outputs clear pass/fail indicators
- Shows exactly what's being tested and why

**Manual Test Commands** - Interactive testing:
- `equip backpack`, `unequip backpack` - Equipment testing
- `create toolbox`, `create lunchbox` - Item creation
- `spawn <type> [count]` - General item spawning

**Utility Commands**:
- `help` - Show all available commands
- `clear` - Clear console output
- `game status` - Show current game state

### Adding New Test Commands

When implementing new features that need testing:

1. **Add a `phaseX` command** to DevConsole.jsx
2. **Document the command** in this file
3. **Make the test comprehensive** - check all edge cases
4. **Provide clear output** - use ✅/❌ indicators
5. **Auto-refresh UI** if needed with `window.inv?.refresh()`

Example pattern:
```javascript
case 'phase5x':
  try {
    addToConsole('=== Phase 5X Verification ===', 'info');
    
    // Test 1: Feature exists
    addToConsole('Test 1: Checking feature...', 'info');
    const result = window.inventoryManager.someMethod();
    if (result) {
      addToConsole('  ✅ Feature working', 'success');
    } else {
      addToConsole('  ❌ Feature broken', 'error');
    }
    
    // Summary
    addToConsole('--- Phase 5X Status ---', 'info');
    addToConsole('✅ Phase 5X Complete', 'success');
    
  } catch (error) {
    addToConsole(`Error in Phase 5X: ${error.message}`, 'error');
  }
  break;
```

---

## Testing Workflow

### For New Features (Pre-Merge)

1. **Implement the feature**
2. **Add a test command** to DevConsole.jsx
3. **Run the test command** in in-game console
4. **Verify all checks pass** (look for ✅ indicators)
5. **Test edge cases** manually if needed
6. **Document in InventoryPlan.md** acceptance criteria

### For Bug Fixes

1. **Reproduce the bug** using test commands
2. **Fix the issue**
3. **Re-run test commands** to verify fix
4. **Check no regressions** by running related test commands

### For Refactoring

1. **Run all relevant test commands** before changes
2. **Capture output** (screenshot or notes)
3. **Make refactoring changes**
4. **Re-run same test commands** and compare output
5. **Ensure identical behavior**

---

## Current Test Commands

### Phase 5A - Foundation
**Command:** `phase5`

**Tests:**
- ✅ InventoryManager created during initialization
- ✅ Ground container accessible
- ✅ Manager instance consistency across contexts
- ✅ Equipment system initialized

**Expected Output:**
```
✅ window.inventoryManager exists
✅ Ground container accessible
✅ Same instance across all access methods
✅ Equipment object exists with 7 slots
✅ Phase 5A appears COMPLETE
```

### Phase 5B - Equipment Display
**Command:** `phase5b`

**Tests:**
- ✅ Items can be equipped to slots
- ✅ Equipment slots show equipped items
- ✅ Tooltips display item names
- ✅ Slots are read-only (console.debug on click)

**Expected Output:**
```
✅ Test items equipped successfully
✅ melee: "Combat Knife" (should show on hover)
✅ flashlight: "LED Flashlight" (should show on hover)
✅ Phase 5B Implementation Complete
```

### Phase 5C - Backpack Visibility
**Command:** `phase5c`

**Tests:**
- ✅ No backpack shows placeholder message
- ✅ Equipping backpack displays grid
- ✅ Grid dimensions match container size
- ✅ Unequipping hides grid

**Expected Output:**
```
✅ No backpack equipped - should show "No backpack equipped"
✅ Backpack equipped successfully
✅ Equipped backpack container accessible
✅ Backpack unequipped successfully
✅ Phase 5C Implementation Complete
```

### Phase 5D - Specialty Containers
**Command:** `phase5d`

**Tests:**
- ✅ Specialty containers can be created
- ✅ `canOpenContainer` returns correct values
- ✅ Toolbox/lunchbox can open inline
- ✅ Backpacks prevented from inline opening

**Expected Output:**
```
✅ Created toolbox and lunchbox on ground
✅ Toolbox can open: YES
✅ Lunchbox can open: YES
✅ Backpack (unequipped) can open: NO (CORRECT)
✅ Phase 5D Implementation Complete
```

### Phase 5E - Item Movement (NEW)
**Command:** `phase5e`

**Tests:**
- ✅ Items can move ground → backpack
- ✅ Items can move backpack → ground
- ✅ Invalid placements rejected
- ✅ UI updates after moves
- ✅ Stack splitting works correctly

**Expected Output:**
```
✅ Created test items on ground
✅ Moved item from ground to backpack
✅ Moved item from backpack to ground
✅ Invalid placement correctly rejected
✅ UI refreshed after moves
✅ Phase 5E Implementation Complete
```

---

## Troubleshooting

### "Command not found"
- Make sure you're using the **in-game console** (`~` key)
- Type `help` to see available commands
- Check for typos in command name

### "window.inventoryManager is undefined"
- Game may still be initializing
- Wait for start menu to appear
- Try command again after starting a new game

### Test command shows errors
- Read the error message carefully
- Check which specific test failed
- Refer to InventoryPlan.md for implementation details
- Fix the feature, then re-run the test

### UI doesn't update after test
- Some tests auto-refresh UI
- Manual refresh: Close and reopen inventory panel
- Or use `window.inv?.refresh()` in console

---

## Anti-Patterns to Avoid

❌ **Never do this:**
```javascript
// DON'T use browser console for game testing
// This is in the browser console (F12) - WRONG!
window.inventoryManager.getContainer('ground');
```

✅ **Always do this:**
```
# Press ~ key to open in-game console
# Then type predefined commands:
phase5
phase5b
spawn knife 5
```

❌ **Never do this:**
```javascript
// DON'T type raw JavaScript in in-game console
const item = new Item({...});
window.inventoryManager.addItem(item);
```

✅ **Always do this:**
```
# Use predefined commands that handle the complexity:
spawn knife
create toolbox
equip backpack
```

---

## Command Reference Quick Sheet

| Command | Purpose | Example |
|---------|---------|---------|
| `help` | Show all commands | `help` |
| `phase5` | Test foundation | `phase5` |
| `phase5b` | Test equipment | `phase5b` |
| `phase5c` | Test backpack | `phase5c` |
| `phase5d` | Test containers | `phase5d` |
| `phase5e` | Test item moves | `phase5e` |
| `spawn <type>` | Create items | `spawn knife 3` |
| `equip backpack` | Equip test backpack | `equip backpack` |
| `create toolbox` | Create toolbox | `create toolbox` |
| `game status` | Show game state | `game status` |
| `clear` | Clear console | `clear` |

---

**Remember: If you're tempted to use the browser console for testing, STOP and use the in-game console instead.**
