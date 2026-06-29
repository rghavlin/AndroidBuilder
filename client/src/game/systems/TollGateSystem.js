import engine from '../GameEngine.js';
import { getItemPrice } from '../inventory/ItemPricing.js';
import { TOLL_TARGET } from '../config/ProgressionConfig.js';


class TollGateSystem {
  constructor() {
    this.activeGuard = null;
    this._reregisteringDeposit = false;
    this._handleInventoryChange = this._handleInventoryChange.bind(this);
  }

  /** The guard's deposit container (its NPC inventory). */
  _deposit(guard = this.activeGuard) {
    return guard?.inventory || null;
  }

  /**
   * Begin a toll session with a gatekeeper NPC. Registers the deposit container
   * so the inventory UI can resolve it, and subscribes for live value updates.
   * @returns {{containerId:string}|null}
   */
  startToll(guard) {
    if (!guard) return null;
    if (this.activeGuard && this.activeGuard !== guard) this.cancel();

    this.activeGuard = guard;
    const deposit = this._deposit(guard);
    if (deposit && engine.inventoryManager) {
      engine.inventoryManager.registerContainer(deposit);
      engine.inventoryManager.on('inventoryChanged', this._handleInventoryChange);
    }
    return { containerId: deposit?.id || null };
  }

  /** Total Earbucks value currently deposited. */
  getValue(guard = this.activeGuard) {
    const deposit = this._deposit(guard);
    if (!deposit || typeof deposit.getAllItems !== 'function') return 0;
    let total = 0;
    for (const item of deposit.getAllItems()) total += getItemPrice(item);
    return total;
  }

  /**
   * UI state. The target is deliberately NOT exposed — only how close the player
   * is (clamped) and whether they can pay.
   */
  getState() {
    if (!this.activeGuard) return null;
    const deposit = this._deposit();
    const value = this.getValue();
    const target = this.target();
    return {
      containerId: deposit?.id || null,
      progressPercent: target > 0 ? Math.min(100, (value / target) * 100) : 0,
      canPay: value >= target,
      paid: !!this.activeGuard.tollPaid
    };
  }

  /** Toll target for the active guard (per-guard override falls back to default). */
  target(guard = this.activeGuard) {
    return guard?.tollTarget ?? TOLL_TARGET;
  }

  /**
   * Pay the toll: consume the deposit, mark the guard paid, and step it aside so
   * the exit path opens. No-op (returns failure) if the value is short.
   */
  pay() {
    const guard = this.activeGuard;
    if (!guard) return { success: false, reason: 'No active toll' };
    if (this.getValue() < this.target()) {
      return { success: false, reason: 'Not enough value' };
    }

    // Consume the deposited items (the toll is collected).
    const deposit = this._deposit(guard);
    if (deposit && typeof deposit.clear === 'function') deposit.clear();

    guard.tollPaid = true;

    // Step the guard aside into its reserved alcove so the gap opens.
    const step = guard.tollSidestep;
    const gameMap = engine.gameMap || engine.worldManager?.getCurrentMap?.();
    if (step && gameMap && typeof gameMap.moveEntity === 'function') {
      const moved = gameMap.moveEntity(guard.id, step.x, step.y);
      if (!moved) {
        console.warn(`[TollGateSystem] Guard ${guard.id} could not step to alcove (${step.x},${step.y}).`);
      }
    }

    this._cleanup();
    engine.addLog?.('The gatekeeper takes your toll and steps aside.', 'info');
    engine.notifyUpdate();
    return { success: true };
  }

  /**
   * Close the session without paying. Deposited items stay in the guard's
   * inventory (persisted with the entity) so the player can return with more.
   */
  cancel() {
    this._cleanup();
    engine.notifyUpdate();
  }

  _cleanup() {
    const deposit = this._deposit();
    if (engine.inventoryManager) {
      engine.inventoryManager.off('inventoryChanged', this._handleInventoryChange);
      // Unregister the deposit from the live registry. The items remain on the
      // guard's `inventory` Container (and persist with the entity); the next
      // startToll re-registers it.
      if (deposit?.id) engine.inventoryManager.unregisterContainer(deposit.id);
    }
    this.activeGuard = null;
  }

  _handleInventoryChange() {
    // updateDynamicContainers() wipes all non-protected containers whenever
    // the inventory changes (e.g. when an item is equipped from the toll grid).
    // Re-register the deposit here so the TollWindow's ContainerGrid never
    // loses its reference. Guard against re-entrancy: registerContainer itself
    // emits inventoryChanged, so skip if we're already in the middle of that.
    if (!this._reregisteringDeposit) {
      const deposit = this._deposit();
      if (deposit && engine.inventoryManager &&
          !engine.inventoryManager.containers.has(deposit.id)) {
        this._reregisteringDeposit = true;
        engine.inventoryManager.registerContainer(deposit);
        this._reregisteringDeposit = false;
      }
    }

    // Bump the engine pulse so the toll window re-reads getState().
    engine.notifyUpdate();
  }
}

export const tollGateSystem = new TollGateSystem();
export default tollGateSystem;
