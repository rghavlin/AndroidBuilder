import { ItemTrait } from '../inventory/traits.js';

/**
 * TurnProcessingUtils - Shared logic for turn-based item effects.
 * Designed to work with both Item instances and raw POJO data.
 */
export const TurnProcessingUtils = {
    /**
     * Common logic for charging batteries inside a charger container.
     * @param {Array} batteries - Array of items/data inside the charger
     */
    chargeBatteries(batteries) {
        if (!Array.isArray(batteries)) return;

        batteries.forEach(battery => {
            // tool.battery (small) or tool.large_battery
            if (battery.defId === 'tool.battery' || battery.defId === 'tool.large_battery') {
                const maxCharge = battery.capacity || 100;
                if ((battery.ammoCount || 0) < maxCharge) {
                    battery.ammoCount = (battery.ammoCount || 0) + 1;
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
