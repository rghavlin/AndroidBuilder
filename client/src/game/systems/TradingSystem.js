import { Rarity, ItemCategory, EquipmentSlot } from '../inventory/traits.js';
import { Container } from '../inventory/Container.js';
import engine from '../GameEngine.js';

/**
 * TradingSystem
 * Handles the logic for atomic item transfers, point calculation, and session management.
 * Isolates UI from business logic by maintaining the "Transaction State".
 */
class TradingSystem {
  constructor() {
    this.activeTrade = null;

    // Internal event bindings
    this._handleInventoryChange = this._handleInventoryChange.bind(this);
    
    // Legacy support (to be phased out once UI is fully refactored)
    this.handleTradeRequested = this.handleTradeRequested.bind(this);
    this.handleTradeCanceled = this.handleTradeCanceled.bind(this);
    engine.on('TRADE_REQUESTED', this.handleTradeRequested);
    engine.on('TRADE_CANCELED', this.handleTradeCanceled);
  }

  /**
   * Start a new trade session
   * @param {Object} npc - The NPC entity to trade with
   */
  startTrade(npc) {
    if (this.activeTrade) {
      console.warn('[TradingSystem] A trade is already in progress. Canceling old trade...');
      this.cancelTrade();
    }

    console.log(`[TradingSystem] Starting trade with ${npc.name} (${npc.id})`);

    // Create temporary offer containers
    const youOffer = new Container({
      id: 'barter_you_offer',
      name: 'You offer:',
      width: 5,
      height: 15
    });

    const theyOffer = new Container({
      id: 'barter_they_offer',
      name: 'They offer:',
      width: 5,
      height: 15
    });

    this.activeTrade = {
      npc,
      youOffer,
      theyOffer,
      playerInventoryId: 'player_inventory', // Assuming default
      npcInventoryId: `${npc.id}_inventory`
    };

    // Register containers with InventoryManager
    if (engine.inventoryManager) {
      engine.inventoryManager.registerContainer(youOffer);
      engine.inventoryManager.registerContainer(theyOffer);
      
      // Ensure NPC inventory is registered
      if (npc.inventory) {
        engine.inventoryManager.registerContainer(npc.inventory);
      }
    }

    // Subscribe to inventory changes to notify UI of point updates
    engine.inventoryManager.on('inventoryChanged', this._handleInventoryChange);

    return this.activeTrade;
  }

  /**
   * End the current trade session and cleanup
   */
  _cleanupSession() {
    if (!this.activeTrade) return;

    const { youOffer, theyOffer, npc } = this.activeTrade;

    if (engine.inventoryManager) {
      engine.inventoryManager.unregisterContainer(youOffer.id);
      engine.inventoryManager.unregisterContainer(theyOffer.id);
      engine.inventoryManager.off('inventoryChanged', this._handleInventoryChange);
    }

    this.activeTrade = null;
  }

  /**
   * Execute the trade atomically
   */
  executeTrade() {
    if (!this.activeTrade) return { success: false, reason: 'No active trade' };

    const { youOffer, theyOffer, npc } = this.activeTrade;
    const state = this.getTradeState();

    if (!state.canTrade) {
      return { success: false, reason: 'Trade is not fair' };
    }

    // Dry Run / Validation: Ensure target spaces are potentially available
    // (Actual placement happens sequentially, but we could do more complex checks here if needed)

    const npcX = npc.x;
    const npcY = npc.y;

    // 1. Move "They offer" items to Player
    const theyOfferItems = theyOffer.getAllItems();
    theyOfferItems.forEach(item => {
      theyOffer.removeItem(item.instanceId);
      const result = engine.inventoryManager.addItem(item);
      if (!result.success) {
        // Fallback: drop at player feet
        engine.inventoryManager.dropItemAtLocation(item, engine.player.x, engine.player.y, engine.gameMap);
      }
    });

    // 2. Move "You offer" items to NPC
    const youOfferItems = youOffer.getAllItems();
    const npcContainer = engine.inventoryManager.getContainer(this.activeTrade.npcInventoryId);

    youOfferItems.forEach(item => {
      youOffer.removeItem(item.instanceId);
      if (npcContainer) {
        const result = npcContainer.addItem(item);
        if (!result) {
          // Fallback: drop at NPC feet
          engine.inventoryManager.dropItemAtLocation(item, npcX, npcY, engine.gameMap);
        }
      } else {
        engine.inventoryManager.dropItemAtLocation(item, npcX, npcY, engine.gameMap);
      }
    });

    this._cleanupSession();
    
    engine.emit('TRADE_COMPLETED', { success: true });
    engine.notifyUpdate();

    return { success: true };
  }

  /**
   * Cancel the trade and return all items
   */
  cancelTrade() {
    if (!this.activeTrade) return;

    const { youOffer, theyOffer, npc } = this.activeTrade;

    // Return your items
    const youOfferItems = youOffer.getAllItems();
    youOfferItems.forEach(item => {
      youOffer.removeItem(item.instanceId);
      const result = engine.inventoryManager.addItem(item);
      if (!result.success) {
        engine.inventoryManager.dropItemAtLocation(item, engine.player.x, engine.player.y, engine.gameMap);
      }
    });

    // Return NPC items
    const theyOfferItems = theyOffer.getAllItems();
    const npcContainer = engine.inventoryManager.getContainer(this.activeTrade.npcInventoryId);
    
    theyOfferItems.forEach(item => {
      theyOffer.removeItem(item.instanceId);
      if (npcContainer) {
        npcContainer.addItem(item);
      } else {
        engine.inventoryManager.dropItemAtLocation(item, npc.x, npc.y, engine.gameMap);
      }
    });

    this._cleanupSession();
    
    engine.emit('TRADE_CANCELED_SUCCESS');
    engine.notifyUpdate();
  }

  /**
   * Get the current state of the trade for UI consumption
   */
  getTradeState() {
    if (!this.activeTrade) return null;

    const { youOffer, theyOffer } = this.activeTrade;
    const youPoints = this.calculateContainerPoints(youOffer);
    const theyPoints = this.calculateContainerPoints(theyOffer);

    const acceptancePercent = theyPoints > 0 
      ? Math.min(100, (youPoints / theyPoints) * 100) 
      : (youPoints > 0 ? 100 : 0);
    
    const canTrade = (youPoints >= theyPoints && theyPoints > 0) || (youPoints > 0 && theyPoints === 0);

    return {
      youPoints,
      theyPoints,
      acceptancePercent,
      canTrade,
      npcName: this.activeTrade.npc.name,
      youOfferContainerId: youOffer.id,
      theyOfferContainerId: theyOffer.id,
      npcInventoryId: this.activeTrade.npcInventoryId
    };
  }

  /**
   * Internal handler for inventory changes during a trade
   */
  _handleInventoryChange() {
    // Notify engine that a "trade update" occurred
    // This will trigger the UI to re-read getTradeState via the engine pulse
    engine.notifyUpdate();
  }

  /**
   * Drag & Drop Validation Logic (Isolates UI from "fairness" rules)
   */
  validateMove(itemId, fromId, toId) {
    if (!this.activeTrade) return true;

    const { npcInventoryId } = this.activeTrade;

    // Rule: You cannot drop NPC items into your inventory directly during a trade
    // Rule: You can only move NPC items into the 'theyOffer' grid

    if (toId === 'barter_you_offer') {
      // Player can offer anything that doesn't belong to the NPC.
      return fromId !== npcInventoryId && fromId !== 'barter_they_offer';
    }

    if (toId === 'barter_they_offer') {
      // Only items from the NPC's stock can be requested
      return fromId === npcInventoryId || fromId === 'barter_they_offer';
    }

    if (toId === npcInventoryId) {
      // Only items originally from the NPC can be returned to their stock
      return fromId === npcInventoryId || fromId === 'barter_they_offer';
    }

    return true;
  }

  /**
   * Determine the point value of a single item instance
   */
  getItemValue(item) {
    if (!item) return 0;

    // 1. Ammo: 1 point per 1 unit (rounds in stack)
    if (item.hasCategory(ItemCategory.AMMO)) {
      return item.stackCount || 1;
    }

    // 2. Food & Drinks: Value based on nutrition and hydration
    // Nutrition: 1 pt per point
    // Hydration: 1 pt per 2 points (round down)
    const nutrition = item.getNutritionValue?.() || 0;
    const hydration = item.getHydrationValue?.() || 0;
    
    if (nutrition > 0 || hydration > 0) {
      let totalValue = nutrition + Math.floor(hydration / 2);
      
      // Handle liquid containers (water bottles, sodas) that use ammoCount for units
      if (item.isWaterBottle?.() || item.capacity > 0) {
        // total hydration = hydration per unit * number of units
        // But the rule is 1 point per 2 points of TOTAL hydration.
        const totalHydration = (item.ammoCount || 0) * hydration;
        const totalNutrition = (item.ammoCount || 0) * nutrition; // Some liquids might have nutrition
        return totalNutrition + Math.floor(totalHydration / 2);
      }

      // Standard stackable food (chips, beans)
      return totalValue * (item.stackCount || 1);
    }

    // 3. Premium Items: Guns, Tools, and Backpacks (+5 pts)
    const isGun = item.hasCategory(ItemCategory.GUN) || item.hasCategory(ItemCategory.WEAPON);
    const isTool = item.hasCategory(ItemCategory.TOOL);
    const isBackpack = item.hasCategory(ItemCategory.CONTAINER) && item.equippableSlot === EquipmentSlot.BACKPACK;

    let baseValue = this.getRarityValue(item.rarity);
    if (isGun || isTool || isBackpack) {
      baseValue += 5;
    }

    return baseValue * (item.stackCount || 1);
  }

  /**
   * Determine the base point value of an item based on rarity
   */
  getRarityValue(rarity) {
    switch (rarity) {
      case Rarity.COMMON: return 1;
      case Rarity.UNCOMMON: return 2;
      case Rarity.RARE: return 5;
      case Rarity.EXTREMELY_RARE: return 10;
      default: return 1;
    }
  }

  /**
   * Calculate total points for a given container
   */
  calculateContainerPoints(container) {
    if (!container) return 0;
    let total = 0;
    container.getAllItems().forEach(item => {
      total += this.getItemValue(item);
    });
    return total;
  }

  // --- Legacy Compatibility Handlers ---
  handleTradeRequested(data) {
    // If the UI is still using events, we adapt
    if (this.activeTrade) {
      this.executeTrade();
    }
  }

  handleTradeCanceled(data) {
    if (this.activeTrade) {
      this.cancelTrade();
    }
  }
}

// Singleton instance
const tradingSystem = new TradingSystem();
export default tradingSystem;

