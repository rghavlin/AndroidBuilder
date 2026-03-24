import { Entity } from './Entity.js';

/**
 * Window entity for buildings
 * Allows line of sight even when closed.
 * Can be opened, closed, locked, or broken.
 */
export class Window extends Entity {
    constructor(id, x, y, isLocked = false, isOpen = false, isBroken = false) {
        super(id, 'window', x, y);
        this.isOpen = isOpen;
        this.isLocked = isLocked;
        this.isBroken = isBroken;
        this.maxHp = 10; // Windows are fragile
        this.hp = isBroken ? 0 : this.maxHp;

        // Windows NEVER block sight (they are transparent)
        this.blocksSight = false;
        
        // Update blocking status based on initial state
        this.updateBlocking();
    }

    /**
     * Update movement blocking status based on state
     */
    updateBlocking() {
        // Blocks movement if closed AND not broken
        this.blocksMovement = !this.isOpen && !this.isBroken;

        // Emit event to notify map/renderer of state change
        this.emitEvent('windowStateChanged', {
            isOpen: this.isOpen,
            isLocked: this.isLocked,
            isBroken: this.isBroken,
            blocksMovement: this.blocksMovement,
            blocksSight: this.blocksSight
        });
    }

    /**
     * Open the window
     */
    open() {
        if (this.isBroken) return false; // Already "open" in sense of movement

        if (this.isLocked) {
            this.emitEvent('windowInteractionFailed', { reason: 'locked' });
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
     * Close the window
     */
    close(gameMap = null) {
        if (this.isBroken || !this.isOpen) return false;

        // Check for occupants if map is provided
        if (gameMap) {
            const tile = gameMap.getTile(this.x, this.y);
            if (tile && tile.contents.some(e => e.id !== this.id && (e.type === 'player' || e.type === 'zombie'))) {
                this.emitEvent('windowInteractionFailed', { reason: 'occupied' });
                return false;
            }
        }

        this.isOpen = false;
        this.updateBlocking();
        return true;
    }

    /**
     * Unlock the window
     */
    unlock() {
        if (this.isLocked) {
            this.isLocked = false;
            this.emitEvent('windowUnlocked');
            this.updateBlocking();
            return true;
        }
        return false;
    }

    /**
     * Toggle the window state
     */
    toggle(gameMap = null) {
        if (this.isOpen) {
            return this.close(gameMap);
        } else {
            return this.open();
        }
    }

    /**
     * Break the window
     */
    break() {
        if (!this.isBroken) {
            this.isBroken = true;
            this.hp = 0;
            this.isLocked = false;
            // A broken window is effectively "open" for movement
            this.updateBlocking();
            this.emitEvent('windowBroken');
            return true;
        }
        return false;
    }

    /**
     * Take damage
     */
    takeDamage(amount) {
        if (this.isBroken) return;

        this.hp = Math.max(0, this.hp - amount);
        if (this.hp <= 0) {
            this.break();
        } else {
            this.emitEvent('windowDamaged', { currentHp: this.hp, maxHp: this.maxHp });
        }
    }

    /**
     * Serialize to JSON
     */
    toJSON() {
        return {
            ...super.toJSON(),
            isOpen: this.isOpen,
            isLocked: this.isLocked,
            isBroken: this.isBroken,
            blocksSight: this.blocksSight
        };
    }

    /**
     * Create from JSON
     */
    static fromJSON(data) {
        const window = new Window(data.id, data.x, data.y, data.isLocked, data.isOpen, data.isBroken);
        window.blocksMovement = data.blocksMovement;
        window.blocksSight = false; // Always false
        return window;
    }
}
