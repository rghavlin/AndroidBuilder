globalThis.window = {
  gameInitInstances: new Set(),
  dispatchEvent: () => {}
};

import GameInitializationManager from '../client/src/game/GameInitializationManager.js';

const initManager = new GameInitializationManager();
const success = await initManager.startInitialization(null, { easyStart: true });
console.log("Initialization success:", success);

if (success) {
  const inv = initManager.gameObjects.inventoryManager;
  console.log("\n--- PLAYER EQUIPMENT ---");
  for (const [slot, item] of Object.entries(inv.equipment)) {
    if (item) {
      console.log(`Slot [${slot}]: ${item.name} (${item.defId})`);
      const grid = item.getContainerGrid();
      if (grid) {
        console.log(`  -> Contains:`);
        grid.getAllItems().forEach(subItem => {
          console.log(`     - ${subItem.name} (${subItem.defId}) x${subItem.stackCount} [ammoCount/charges: ${subItem.ammoCount}]`);
        });
      }
    } else {
      console.log(`Slot [${slot}]: <empty>`);
    }
  }
}
