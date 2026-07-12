import { ItemTrait } from '../inventory/traits.js';
import { TURRET_DEF_ID } from '../ai/TurretCombat.js';

/**
 * TurnProcessingUtils - Shared logic for turn-based item effects.
 * Designed to work with both Item instances and raw POJO data.
 */
export const TurnProcessingUtils = {
    /**
     * Common logic for charging batteries inside a charger container.
     * @param {Array} batteries - Array of items/data inside the charger
     */
    chargeBatteries(batteries, amount = 1) {
        if (!Array.isArray(batteries)) return;

        batteries.forEach(battery => {
            // tool.battery (small), tool.large_battery, or tool.high_capacity_battery
            if (battery.defId === 'tool.battery' || battery.defId === 'tool.large_battery' || battery.defId === 'tool.high_capacity_battery') {
                const maxCharge = battery.capacity || (battery.defId === 'tool.high_capacity_battery' ? 400 : (battery.defId === 'tool.large_battery' ? 100 : 10));
                if ((battery.ammoCount || 0) < maxCharge) {
                    battery.ammoCount = Math.min(maxCharge, (battery.ammoCount || 0) + amount);
                    // Note: We don't log here to avoid spamming during sleep/batch processing
                }
            }
        });
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
