import { ItemTrait, ItemCategory } from '../inventory/traits.js';
import { TURRET_DEF_ID } from '../ai/TurretCombat.js';
import { gridItems } from '../inventory/gridUtils.js';

/** Charger that charges its neighbours in a vehicle grid rather than its own contents. */
export const VEHICLE_CHARGER_DEF_ID = 'tool.vehicle_charger';

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
 * Duck-typed accessor for a container item's grid. Item instances expose
 * getContainerGrid(); POJOs carry a containerGrid property.
 */
function containerGridOf(itemData) {
    return typeof itemData.getContainerGrid === 'function'
        ? itemData.getContainerGrid()
        : itemData.containerGrid;
}

/**
 * Every battery riding inside an item. Not just its cargo grid: a wagon's
 * Power Cells live in `attachments`, which is what the battery % chips in the
 * container overlay read (Item.getBatteryStatuses), so a rule that only walked
 * the grid would leave exactly the batteries the player is watching untouched.
 * Recurses, so a turret parked in the wagon gets its power cell topped up too.
 *
 * Handles both shapes: Item instances (getContainerGrid / getPocketContainers)
 * and the serialized POJOs an on-map entity carries (containerGrid /
 * pocketGrids). `seen` guards against an item graph that loops back.
 */
function collectBatteries(itemData, out = [], seen = new Set()) {
    if (!itemData || typeof itemData !== 'object' || seen.has(itemData)) return out;
    seen.add(itemData);

    if (isBattery(itemData)) out.push(itemData);

    gridItems(containerGridOf(itemData)).forEach(nested => collectBatteries(nested, out, seen));

    if (itemData.attachments) {
        Object.values(itemData.attachments).forEach(att => collectBatteries(att, out, seen));
    }

    const pockets = typeof itemData.getPocketContainers === 'function'
        ? itemData.getPocketContainers()
        : itemData.pocketGrids;
    if (Array.isArray(pockets)) {
        pockets.forEach(pocket => gridItems(pocket).forEach(n => collectBatteries(n, out, seen)));
    }

    return out;
}

/**
 * Duck-typed accessor for a charger/container item's grid contents.
 * gridItems() normalizes the Map/array/object shapes.
 */
function chargerContents(itemData) {
    return gridItems(containerGridOf(itemData));
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
     * power sources, wired/solar chargers, and vehicle chargers. Both turn engines
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

        // Vehicle charger — see applyVehicleCharger: the only charger whose rule
        // is evaluated on the host vehicle rather than on the charger itself.
        if (this.applyVehicleCharger(itemData)) {
            modified = true;
        }

        return modified;
    },

    /**
     * Vehicle charger — the one charger that doesn't hold its own batteries. It
     * rides loose in a vehicle's cargo grid and tops up every battery riding in
     * that vehicle by 1 per turn, wherever it sits: loose cargo, the wagon's own
     * Power Cell attachment slots, or a nested item's battery (see
     * collectBatteries). The charger can't see any of that from itself, so the
     * rule runs on the *host vehicle* instead: applyPowerGeneration is called on
     * every item both turn engines walk, the vehicle included, and anything that
     * isn't a vehicle carrying a charger falls straight out.
     *
     * @param {Object|Item} itemData the container item that may be a vehicle
     * @returns {boolean} whether any battery was charged
     */
    applyVehicleCharger(itemData) {
        if (!itemData) return false;

        const grid = containerGridOf(itemData);
        if (!grid) return false;
        // Older serialized grids can lack the flag; the host's VEHICLE trait
        // is the same answer from the other direction.
        if (!grid.isVehicle && !hasTraitDuck(itemData, ItemTrait.VEHICLE)) return false;

        if (!gridItems(grid).some(it => it && it.defId === VEHICLE_CHARGER_DEF_ID)) return false;

        const batteries = collectBatteries(itemData);
        if (batteries.length === 0) return false;

        this.chargeBatteries(batteries, 1);
        return true;
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
