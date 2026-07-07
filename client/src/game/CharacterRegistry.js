/**
 * Character Registry utility
 * Manages persisted character progression data in localStorage.
 */
export const CharacterRegistry = {
  getCharacters() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return [];
      const data = window.localStorage.getItem('zombie_road_character_registry');
      if (!data) return [];
      const characters = JSON.parse(data);
      if (Array.isArray(characters)) {
        characters.forEach(c => {
          if (c) {
            if ('earbucks' in c) {
              delete c.earbucks;
            }
            // Migrate legacy attributes to simple base attributes if needed
            if (c.strength === undefined) {
              c.strength = c.baseStrength ?? c.currentStrength ?? 20;
            }
            if (c.agility === undefined) {
              c.agility = c.baseAgility ?? c.currentAgility ?? 40;
            }
            if (c.perception === undefined) {
              c.perception = c.basePerception ?? c.currentPerception ?? 20;
            }
            if (c.constitution === undefined) {
              c.constitution = c.baseConstitution ?? c.currentConstitution ?? 20;
            }
            if (c.isInfected === undefined) {
              c.isInfected = false;
            }
            // Purge legacy properties
            delete c.baseStrength;
            delete c.currentStrength;
            delete c.baseAgility;
            delete c.currentAgility;
            delete c.basePerception;
            delete c.currentPerception;
            delete c.baseConstitution;
            delete c.currentConstitution;
          }
        });
      }
      return characters;
    } catch (e) {
      console.error('[CharacterRegistry] Failed to load character registry:', e);
      return [];
    }
  },
  
  saveCharacters(characters) {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      window.localStorage.setItem('zombie_road_character_registry', JSON.stringify(characters));
    } catch (e) {
      console.error('[CharacterRegistry] Failed to save character registry:', e);
    }
  },

  addCharacter(character) {
    const characters = this.getCharacters();
    if (!character.id) {
      character.id = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : 'char_' + Math.random().toString(36).substring(2, 15);
    }
    // Remove existing entry with the same ID
    const filtered = characters.filter(c => c.id !== character.id);
    filtered.push(character);
    this.saveCharacters(filtered);
    return character;
  },

  deleteCharacter(id) {
    const characters = this.getCharacters();
    const filtered = characters.filter(c => c.id !== id);
    this.saveCharacters(filtered);
  },

  saveCharacterFromPlayer(playerEntity) {
    if (!playerEntity) return;
    const characters = this.getCharacters();
    
    let character = characters.find(c => c.id === playerEntity.id);
    if (!character) {
      // Create new registry entry if player doesn't exist in registry
      character = { id: playerEntity.id };
    }
    
    // Core details
    character.name = playerEntity.name || 'Nameless';
    
    // RPG Stats - Save base attributes only
    character.strength = playerEntity.baseStrength ?? 20;
    character.agility = playerEntity.baseAgility ?? 40;
    character.perception = playerEntity.basePerception ?? 20;
    character.constitution = playerEntity.baseConstitution ?? 20;
    character.isInfected = !!playerEntity.isInfected;
    
    // Purge legacy attributes from the object being saved
    delete character.baseStrength;
    delete character.currentStrength;
    delete character.baseAgility;
    delete character.currentAgility;
    delete character.basePerception;
    delete character.currentPerception;
    delete character.baseConstitution;
    delete character.currentConstitution;
    
    // Player Skills
    character.meleeLvl = playerEntity.meleeLvl ?? 0;
    character.meleeKills = playerEntity.meleeKills ?? 0;
    character.rangedLvl = playerEntity.rangedLvl ?? 0;
    character.rangedKills = playerEntity.rangedKills ?? 0;
    character.craftingLvl = playerEntity.craftingLvl ?? 0;
    character.craftingApUsed = playerEntity.craftingApUsed ?? 0;
    
    // Do not save earbucks, ensure it is removed
    delete character.earbucks;
    
    this.addCharacter(character);
    console.log(`[CharacterRegistry] Auto-saved stats for character "${character.name}" (ID: ${character.id}) to registry.`);
  }
};
