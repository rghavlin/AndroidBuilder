import { describe, it, expect, beforeEach } from 'vitest';
import engine from '../../client/src/game/GameEngine.js';
import { GameMap } from '../../client/src/game/map/GameMap.js';
import { TemplateMapGenerator } from '../../client/src/game/map/TemplateMapGenerator.js';
import { LootGenerator } from '../../client/src/game/map/LootGenerator.js';
import { createItemFromDef } from '../../client/src/game/inventory/ItemDefs.js';
import { Item } from '../../client/src/game/inventory/Item.js';
import { Container } from '../../client/src/game/inventory/Container.js';
import { synthesizeZombieVirusCure } from '../../client/src/game/inventory/PharmaceuticalSynthesizer.js';

describe('Pharmaceutical Synthesizer Spawning & Synthesis', () => {
  beforeEach(() => {
    engine.reset();
  });

  describe('Lab Map (Map 7) Spawning', () => {
    it('spawns a pharmaceutical synthesizer inside a room of the lab building', async () => {
      const templateGen = new TemplateMapGenerator();
      const mapData = templateGen.generateFromTemplate('lab', { width: 70, height: 120 });
      const gameMap = new GameMap(70, 120, 'lab');
      await templateGen.applyToGameMap(gameMap, mapData);
      gameMap.mapNumber = 7;

      const lootGen = new LootGenerator();
      lootGen.spawnLoot(gameMap, 7);

      // Find the pharmaceutical synthesizer on the map
      let foundSynthesizer = null;
      let synthX = -1;
      let synthY = -1;

      for (let y = 0; y < gameMap.height; y++) {
        for (let x = 0; x < gameMap.width; x++) {
          const items = gameMap.getItemsOnTile(x, y);
          const synth = items.find(i => (i.defId || i.id) === 'furniture.pharmaceutical_synthesizer');
          if (synth) {
            foundSynthesizer = synth;
            synthX = x;
            synthY = y;
            break;
          }
        }
        if (foundSynthesizer) break;
      }

      expect(foundSynthesizer).not.toBeNull();
      expect(foundSynthesizer.name).toBe('Pharmaceutical Synthesizer');

      // Verify it is inside the lab building
      const labBuilding = (gameMap.buildings || []).find(b => b.type === 'lab');
      expect(labBuilding).toBeDefined();
      expect(synthX).toBeGreaterThanOrEqual(labBuilding.x);
      expect(synthX).toBeLessThan(labBuilding.x + labBuilding.width);
      expect(synthY).toBeGreaterThanOrEqual(labBuilding.y);
      expect(synthY).toBeLessThan(labBuilding.y + labBuilding.height);
    });
  });

  describe('Cure Synthesis Logic', () => {
    it('deletes Patient Zero Head and spawns Zombie Virus Cure on the ground', () => {
      const gameMap = new GameMap(20, 20);
      engine.gameMap = gameMap;

      const player = { x: 5, y: 5, ap: 10 };
      engine.player = player;
      engine.inventoryManager.lastSyncedX = 5;
      engine.inventoryManager.lastSyncedY = 5;

      const groundContainer = new Container({ id: 'ground', type: 'ground', width: 20, height: 20 });
      engine.inventoryManager.containers.set('ground', groundContainer);

      const backpack = new Container({ id: 'backpack', type: 'backpack', width: 10, height: 10 });
      engine.inventoryManager.containers.set('backpack', backpack);

      // Create Patient Zero Head in backpack
      const headData = createItemFromDef('zombie.patient_zero_head');
      const headItem = new Item(headData);
      backpack.addItem(headItem, 0, 0);
      expect(backpack.items.has(headItem.instanceId)).toBe(true);

      // Create Pharmaceutical Synthesizer on the ground at (5, 5)
      const synthData = createItemFromDef('furniture.pharmaceutical_synthesizer');
      const synthItem = new Item(synthData);
      synthItem.worldX = 5;
      synthItem.worldY = 5;
      groundContainer.addItem(synthItem, 0, 0);
      gameMap.setItemsOnTile(5, 5, [synthItem]);

      // Perform synthesis
      const result = synthesizeZombieVirusCure(engine, headItem, synthItem);
      expect(result.success).toBe(true);
      expect(result.cureItem).toBeDefined();
      expect(result.cureItem.defId).toBe('medical.zombie_virus_cure');

      // Patient Zero Head is deleted
      expect(backpack.items.has(headItem.instanceId)).toBe(false);
      expect(headItem.stackCount).toBe(0);

      // Zombie Virus Cure is on the ground
      const groundItems = gameMap.getItemsOnTile(5, 5);
      const cureOnGround = groundItems.find(i => (i.defId || i.id) === 'medical.zombie_virus_cure');
      expect(cureOnGround).toBeDefined();
      expect(cureOnGround.name).toBe('Zombie Virus Cure');
    });

    it('rejects synthesis with invalid ingredients', () => {
      const gameMap = new GameMap(20, 20);
      engine.gameMap = gameMap;

      const brainstemData = createItemFromDef('zombie.brainstem');
      const brainstemItem = new Item(brainstemData);

      const synthData = createItemFromDef('furniture.pharmaceutical_synthesizer');
      const synthItem = new Item(synthData);

      const result = synthesizeZombieVirusCure(engine, brainstemItem, synthItem);
      expect(result.success).toBe(false);
      expect(result.reason).toContain('Patient Zero');
    });
  });
});
