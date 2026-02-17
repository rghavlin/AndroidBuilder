import { Entity } from './Entity.js';

/**
 * Door entity for buildings
 * Can be opened, closed, and locked
 */
export class Door extends Entity {
    constructor(id, x, y, isLocked = false, isOpen = false, isDamaged = false) {
        super(id, 'door', x, y);
        this.isOpen = isOpen;
        this.isLocked = isLocked;
        this.isDamaged = isDamaged;
        this.maxHp = 20;
        this.hp = isDamaged ? 0 : this.maxHp;


        // Update blocking status based on initial state
        this.updateBlocking();
    }


    /**
     * Update movement and sight blocking status based on open/closed state
     */
    updateBlocking() {
        this.blocksMovement = !this.isOpen;
        this.blocksSight = !this.isOpen;

        // Emit event to notify map/renderer of state change
        this.emitEvent('doorStateChanged', {
            isOpen: this.isOpen,
            isLocked: this.isLocked,
            blocksMovement: this.blocksMovement,
            blocksSight: this.blocksSight
        });
    }

    /**
     * Open the door if it's not locked
     */
    open() {
        if (this.isLocked) {
            this.emitEvent('doorInteractionFailed', { reason: 'locked' });
            return false;
        }

        if (!this.isOpen) {
            this.isOpen = true;
            this.updateBlocking();
            return true;
        }
        return false;
    }

    /**
     * Close the door
     * @param {GameMap} gameMap - Optional map reference to check for occupants
     */
    close(gameMap = null) {
        if (!this.isOpen || this.isDamaged) return false;

        // Check for occupants if map is provided
        if (gameMap) {
            const tile = gameMap.getTile(this.x, this.y);
            if (tile && tile.contents.some(e => e.id !== this.id && (e.type === 'player' || e.type === 'zombie'))) {
                this.emitEvent('doorInteractionFailed', { reason: 'occupied' });
                return false;
            }
        }

        this.isOpen = false;
        this.updateBlocking();
        return true;
    }

    /**
     * Toggle the door state
     * @param {GameMap} gameMap - Optional map reference for occupancy checks
     */
    toggle(gameMap = null) {
        if (this.isOpen) {
            return this.close(gameMap);
        } else {
            return this.open();
        }
    }

    /**
     * Unlock the door
     */
    unlock() {
        if (this.isLocked) {
            this.isLocked = false;
            this.emitEvent('doorUnlocked');
            return true;
        }
        return false;
    }

    /**
     * Serialize door to JSON
     */
    toJSON() {
        return {
            ...super.toJSON(),
            isOpen: this.isOpen,
            isLocked: this.isLocked,
            isDamaged: this.isDamaged,
            blocksSight: this.blocksSight
        };
    }

    /**
     * Take damage from an entity (zombie, etc)
     * @param {number} amount - Amount of damage to take
     */
    takeDamage(amount) {
        if (this.isOpen || this.isDamaged) return;

        this.hp = Math.max(0, this.hp - amount);

        if (this.hp <= 0) {
            this.isDamaged = true;
            this.isOpen = true;
            this.updateBlocking();
            this.emitEvent('doorBroken');
        } else {
            this.emitEvent('doorDamaged', { currentHp: this.hp, maxHp: this.maxHp });
        }
    }

    /**
     * Create door from JSON data
     */

    static fromJSON(data) {
        const door = new Door(data.id, data.x, data.y, data.isLocked, data.isOpen, data.isDamaged);
        door.blocksMovement = data.blocksMovement;
        door.blocksSight = data.blocksSight;
        return door;
    }
}
