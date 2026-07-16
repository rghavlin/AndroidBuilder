import { ItemTrait, ItemCategory } from '../inventory/traits.js';
import { TURRET_DEF_ID } from '../ai/TurretCombat.js';
import { gridItems } from '../inventory/gridUtils.js';

/**
 * Duck-typed trait check that works on both Item instances (which expose
 * hasTrait()) and raw serialized POJOs (which carry a traits[] array).
 */
function hasTraitDuck(itemData, trait) {
    if (typeof itemData.hasTrait === 'function') return itemData.hasTrait(trait);
    return Array.isArray(itemData.traits) && itemData.traits.includes(trait);
}

/**
 * Duck-typed test for "is this a chargeable battery?" — works on Item
 * instances (hasCategory) and POJOs (categories[]). Replaces the old defId
 * whitelist so any future battery def charges automatically as long as it
 * carries the BATTERY / LARGE_BATTERY category.
 */
function isBattery(b) {
    if (typeof b.hasCategory === 'function') {
        return b.hasCategory(ItemCategory.BATTERY) || b.hasCategory(ItemCategory.LARGE_BATTERY);
    }
    return Array.isArray(b.categories) &&
        (b.categories.includes(ItemCategory.BATTERY) || b.categories.includes(ItemCategory.LARGE_BATTERY));
}

/**
 * Duck-typed accessor for a charger/container item's grid contents. Item
 * instances expose getContainerGrid(); POJOs carry a containerGrid property.
 * gridItems() normalizes the Map/array/object shapes.
 */
function chargerContents(itemData) {
    const grid = typeof itemData.getContainerGrid === 'function'
        ? itemData.getContainerGrid()
        : itemData.containerGrid;
    return gridItems(grid);
}

/**
 * TurnProcessingUtils - Shared logic for turn-based item effects.
 * Designed to work with both Item instances and raw POJO data.
 */
export const TurnProcessingUtils = {
    /**
     * Single source of truth for a battery's maximum charge. Prefers the
     * instance/def `capacity` field and falls back by defId for legacy saves
     * that predate the capacity field. Callers (chargeBatteries here and
     * crankCharger in InventoryContext) must share this so they can never
     * disagree about when a battery is "full".
     */
    getMaxCharge(battery) {
        if (battery.capacity) return battery.capacity;
        if (battery.defId === 'tool.high_capacity_battery') return 400;
        if (battery.defId === 'tool.large_battery') return 100;
        return 10;
    },

    /**
     * Common logic for charging batteries inside a charger container.
     * @param {Array} batteries - Array of items/data inside the charger
     */
    chargeBatteries(batteries, amount = 1) {
        if (!Array.isArray(batteries)) return;

        batteries.forEach(battery => {
            if (isBattery(battery)) {
                const maxCharge = this.getMaxCharge(battery);
                if ((battery.ammoCount || 0) < maxCharge) {
                    battery.ammoCount = Math.min(maxCharge, (battery.ammoCount || 0) + amount);
                    // Note: We don't log here to avoid spamming during sleep/batch processing
                }
            }
        });
    },

    /**
     * Single source of truth for per-item power *generation* effects: fuel-burning
     * power sources, wired battery chargers, and solar chargers. Both turn engines
     * (InventoryManager for the player's tile over Item instances, GameMap for
     * every other tile over POJOs) call this so a new power rule is written once.
     *
     * The caller is responsible for computing the context flags for the item's
     * location — powered-ness in particular is resolved differently per domain
     * (owner-chain walk vs. tile-level power).
     *
     * @param {Object|Item} itemData
     * @param {{ isPowered?: boolean, isOutdoors?: boolean, isDaylight?: boolean, isInPlayerInventory?: boolean }} context
     * @returns {boolean} whether the item (or its contents) was modified
     */
    applyPowerGeneration(itemData, context = {}) {
        const {
            isPowered = false,
            isOutdoors = false,
            isDaylight = true,
            isInPlayerInventory = false,
        } = context;
        let modified = false;

        // Fuel-burning power source (e.g. generator) drains while running.
        if (hasTraitDuck(itemData, ItemTrait.POWER_SOURCE) && itemData.isOn) {
            this.processPowerSource(itemData);
            modified = true;
        }

        // Wired battery charger — only charges when its location has power.
        if (itemData.defId === 'tool.battery_charger' && isPowered) {
            this.chargeBatteries(chargerContents(itemData), 5);
            modified = true;
        }

        // Solar charger — outdoors, in daylight, and not stowed in the player's
        // inventory (a charger inside a closed pack shouldn't see the sun).
        if (itemData.defId === 'tool.solar_charger' && isOutdoors && isDaylight && !isInPlayerInventory) {
            this.chargeBatteries(chargerContents(itemData));
            modified = true;
        }

        return modified;
    },

    /**
     * Common logic for power consumption (e.g. Generators)
     * @param {Object} item - The item/data to process
     * @returns {boolean} - Whether the item is still providing power
     */
    processPowerSource(item) {
        if (item.providesElectricity && item.isOn) {
            if ((item.ammoCount || 0) > 0) {
                item.ammoCount -= 1;
                if (item.ammoCount <= 0) {
                    item.isOn = false;
                    console.log(`[TurnProcessing] ${item.name || item.defId} ran out of fuel and turned OFF.`);
                }
                return item.isOn;
            } else {
                item.isOn = false;
                return false;
            }
        }
        return false;
    },

    /**
     * Common logic for battery-powered hotplate drainage
     * @param {Object} itemData - The hotplate item data to process
     * @returns {boolean} - Whether the item was modified
     */
    processHotplateDrain(itemData) {
        if (itemData.defId === 'tool.battery_powered_hotplate' && itemData.isOn) {
            const battery = itemData.attachments?.['battery'];
            if (battery && (battery.ammoCount || 0) >= 10) {
                battery.ammoCount = Math.max(0, battery.ammoCount - 10);
                if (battery.ammoCount < 10) {
                    itemData.isOn = false;
                    console.log(`[TurnProcessing] ${itemData.name || 'Hotplate'} ran out of power and turned OFF.`);
                }
            } else {
                itemData.isOn = false;
            }
            return true;
        }
        return false;
    },

    /**
     * Common logic for battery-powered auto turret drainage
     * @param {Object} itemData - The turret item data to process
     * @returns {boolean} - Whether the item was modified
     */
    processAutoTurretDrain(itemData) {
        if (itemData.defId !== TURRET_DEF_ID) return false;

        // Neutral/non-player turrets have infinite power and stay permanently on.
        const isInfinite = typeof itemData.isInfiniteTurret === 'function'
            ? itemData.isInfiniteTurret()
            : (itemData.factionId && itemData.factionId !== 'player');
        if (isInfinite) {
            itemData.isOn = true;
            return true;
        }

        if (itemData.isOn) {
            const battery = itemData.attachments?.['battery'];
            if (battery && (battery.ammoCount || 0) >= 1) {
                battery.ammoCount = Math.max(0, battery.ammoCount - 1);
                if (battery.ammoCount <= 0) {
                    itemData.isOn = false;
                    console.log(`[TurnProcessing] ${itemData.name || 'Auto turret'} ran out of power and turned OFF.`);
                }
            } else {
                itemData.isOn = false;
            }
            return true;
        }
        return false;
    },

    /**
     * Common logic for item decay (spoilage and lifetime).
     * @param {Object} item - The item/data to process
     * @returns {Object} - { expired: boolean, modified: boolean }
     */
    processDecay(item) {
        let modified = false;
        let expired = false;

        if (item.shelfLife !== undefined && item.shelfLife !== null) {
            item.shelfLife -= 1;
            modified = true;
            if (item.shelfLife <= 0) expired = true;
        }

        if (item.lifetimeTurns !== undefined && item.lifetimeTurns !== null) {
            item.lifetimeTurns = Math.max(0, item.lifetimeTurns - 1);
            modified = true;
            if (item.lifetimeTurns <= 0) expired = true;
        }

        return { expired, modified };
    }
};
