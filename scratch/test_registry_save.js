import { CharacterRegistry } from '../client/src/game/CharacterRegistry.js';
import { GameSaveSystem } from '../client/src/game/GameSaveSystem.js';

// Mock localStorage
let store = {};
global.window = {
  localStorage: {
    getItem(key) {
      return store[key] || null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    },
    key(i) {
      return Object.keys(store)[i] || null;
    },
    get length() {
      return Object.keys(store).length;
    },
    clear() {
      store = {};
    }
  },
  confirm(msg) {
    console.log("Mock window.confirm prompt shown:", msg);
    return true; // Simulate user accepting the delete prompt
  }
};

async function testRegistry() {
  console.log("=== Running Updated Character Registry & Save Conflict Test ===");

  // 1. Reset storage
  window.localStorage.clear();

  // 2. SCENARIO A: Selecting an existing character from the registry
  console.log("\n--- Scenario A: Selected Existing Character ---");
  // Simulating a character already in the registry
  const originalRegistryChar = {
    id: 'char-registered-uuid-1',
    name: 'Survivalist Bob',
    strength: 20
  };
  CharacterRegistry.addCharacter(originalRegistryChar);
  console.log("Registry initially:", CharacterRegistry.getCharacters());

  // Simulate starting the game: player.id is set to the registry character's ID.
  const playerEntityBob = {
    id: originalRegistryChar.id,
    name: 'Survivalist Bob',
    baseStrength: 24, 
    currentStrength: 10, // Debuffed, should not be saved
    baseAgility: 40,
    currentAgility: 30, // Debuffed, should not be saved
    basePerception: 20,
    currentPerception: 20,
    baseConstitution: 20,
    currentConstitution: 20,
    earbucks: 350
  };

  // Simulate saving the game to the registry
  CharacterRegistry.saveCharacterFromPlayer(playerEntityBob);
  
  let currentRegistry = CharacterRegistry.getCharacters();
  console.log("Registry after gameplay save:");
  console.log(currentRegistry);
  
  if (currentRegistry.length !== 1) {
    throw new Error(`Expected exactly 1 character, but found ${currentRegistry.length}!`);
  }
  
  const savedBob = currentRegistry[0];
  if (savedBob.strength !== 24) {
    throw new Error(`Expected Bob's strength to be updated to baseStrength 24, but got ${savedBob.strength}`);
  }
  if ('baseStrength' in savedBob || 'currentStrength' in savedBob) {
    throw new Error(`Expected legacy baseStrength/currentStrength keys to be absent, but they exist!`);
  }
  console.log("✅ Scenario A passed: Existing character overwritten successfully.");

  // 3. SCENARIO B: Game started with character creator (new character, not in registry yet)
  console.log("\n--- Scenario B: Creator-Interception Character ---");
  const newCreatorStats = {
    id: 'char-creator-uuid-2',
    name: 'Newbie Alice',
    strength: 15
  };
  const playerEntityAlice = {
    id: newCreatorStats.id,
    name: 'Newbie Alice',
    baseStrength: 15,
    currentStrength: 15,
    earbucks: 100
  };

  CharacterRegistry.saveCharacterFromPlayer(playerEntityAlice);
  currentRegistry = CharacterRegistry.getCharacters();
  console.log("Registry after initial save of Alice:");
  
  if (currentRegistry.length !== 2) {
    throw new Error(`Expected 2 characters in registry, but found ${currentRegistry.length}`);
  }
  console.log("✅ Alice added to registry on first save.");

  // 4. SCENARIO C: Deleting a character from the registry
  console.log("\n--- Scenario C: Deleting a Character ---");
  CharacterRegistry.deleteCharacter('char-creator-uuid-2');
  currentRegistry = CharacterRegistry.getCharacters();
  
  if (currentRegistry.length !== 1) {
    throw new Error(`Expected 1 character remaining in registry, but found ${currentRegistry.length}`);
  }
  console.log("✅ Scenario C passed: Character deleted successfully from the registry.");

  // 5. SCENARIO D: Migrating legacy data (with baseStrength and currentStrength keys)
  console.log("\n--- Scenario D: Migration of Legacy Format ---");
  const legacyRegistryData = [
    {
      id: 'char-legacy-1',
      name: 'Old Survivor',
      baseStrength: 22,
      currentStrength: 18,
      earbucks: 500
    }
  ];
  window.localStorage.setItem('zombie_road_character_registry', JSON.stringify(legacyRegistryData));
  const migratedCharacters = CharacterRegistry.getCharacters();
  const migratedChar = migratedCharacters[0];
  if (migratedChar.strength !== 22 || 'baseStrength' in migratedChar) {
    throw new Error("Migration failed!");
  }
  console.log("✅ Scenario D passed: Legacy format migrated successfully.");

  // 6. SCENARIO E: Save Conflict Scan and Deletion Flow
  console.log("\n--- Scenario E: Save Conflict Scan & Deletion Flow ---");
  
  // Create a mock gameState with a player using character 'char-registered-uuid-1'
  const mockGameState = {
    turn: 12,
    player: {
      id: 'char-registered-uuid-1',
      name: 'Survivalist Bob',
      hp: 80,
      maxHp: 100,
      ap: 10,
      maxAp: 12
    }
  };

  // Serialize the game state
  const saveData = GameSaveSystem.saveGameState(mockGameState);
  console.log("Serialized saveData top level keys:", Object.keys(saveData));
  if (saveData.characterId !== 'char-registered-uuid-1') {
    throw new Error(`Expected saveData.characterId to be 'char-registered-uuid-1', but got: ${saveData.characterId}`);
  }
  console.log("✅ saveData contains the player characterId.");

  // Save it to a localStorage slot (mocked)
  // GameSaveSystem.saveToStorage is async and falls back to localStorage because IndexedDB isn't fully mocked
  await GameSaveSystem.saveToStorage(mockGameState, 'slot_bob_active');
  console.log("Game saved to slot 'slot_bob_active'.");

  // Retrieve save slots list
  const slots = await GameSaveSystem.listSaveSlots();
  console.log("Save slots listed:", slots);
  const targetSlot = slots.find(s => s.slotName === 'slot_bob_active');
  if (!targetSlot || targetSlot.characterId !== 'char-registered-uuid-1') {
    throw new Error(`Expected listed save slot to contain characterId 'char-registered-uuid-1', but got: ${JSON.stringify(targetSlot)}`);
  }
  console.log("✅ listSaveSlots successfully returned characterId.");

  // Simulate selecting Bob to start a new game (analogous to handleSelectCharacter in StartMenu.tsx)
  console.log("Simulating selecting Bob for a new game...");
  const selectedChar = { id: 'char-registered-uuid-1', name: 'Survivalist Bob' };
  
  // Scan saves
  const conflictingSlots = slots.filter(s => s.characterId === selectedChar.id);
  console.log("Conflicting slots found for Bob:", conflictingSlots.map(s => s.slotName));
  
  if (conflictingSlots.length > 0) {
    const confirmDelete = window.confirm(
      `Warning: The character "${selectedChar.name}" is already in use in active save(s). Deleting saves...`
    );
    if (confirmDelete) {
      for (const slot of conflictingSlots) {
        await GameSaveSystem.deleteSaveSlot(slot.slotName);
      }
      console.log("Conflicting saves deleted.");
    }
  }

  // Re-list save slots
  const remainingSlots = await GameSaveSystem.listSaveSlots();
  console.log("Remaining save slots:", remainingSlots);
  if (remainingSlots.some(s => s.slotName === 'slot_bob_active')) {
    throw new Error("Expected 'slot_bob_active' to be deleted, but it still exists!");
  }
  console.log("✅ Scenario E passed: Save conflicts detected, user prompted, and conflicting saves deleted successfully.");

  console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉");
}

testRegistry().catch(err => {
  console.error("\n❌ TEST FAILED:", err.message);
  process.exit(1);
});
