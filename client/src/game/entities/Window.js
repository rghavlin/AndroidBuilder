import { Entity, EntityType } from './Entity.js';

/**
 * Window entity for buildings
 * Allows line of sight even when closed.
 * Can be opened, closed, locked, or broken.
 */
export class Window extends Entity {
    constructor(id, x, y, isLocked = false, isOpen = false, isBroken = false) {
        super(id, EntityType.WINDOW, x, y);
        this.isOpen = isOpen;
        this.isLocked = isLocked;
        this.isReinforced = false;
        this.reinforcementHp = 0;
        this.maxReinforcementHp = 20; // 2x 2x4s max
        this.subtype = isBroken ? 'broken' : (isOpen ? 'open' : 'closed');
        this.maxHp = 1; // Windows break in 1 hit (1 AP act)
        this.hp = isBroken ? 0 : this.maxHp;

        // Windows NEVER block sight (they are transparent)
        this.blocksSight = false;
        
        // Update blocking status based on initial state
        this.updateBlocking();
    }

    /**
     * Update movement/subtype status based on state
     */
    updateBlocking() {
        this._updateBlockingState();
        this.subtype = this.isBroken ? 'broken' : (this.isOpen ? 'open' : 'closed');

        // Emit event to notify map/renderer of state change
        this.emitEvent('windowStateChanged', {
            isOpen: this.isOpen,
            isLocked: this.isLocked,
            isBroken: this.isBroken,
            subtype: this.subtype,
            blocksMovement: this.blocksMovement,
            blocksSight: this.blocksSight
        });
    }

    /**
     * Force sync visual state with logical state
     * Used for animating world changes at the correct frame
     */
    syncVisualState() {
        this.updateBlocking();
    }

    /**
     * Internal state update without emitting events
     * @private
     */
    _updateBlockingState() {
        // Windows always block movement for common checks (e.g., players)
        // Zombies will have a specific bypass in Tile.isWalkable
        this.blocksMovement = true;
        this.blocksSight = false;
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
            if (tile && tile.contents.some(e => e.id !== this.id && (e.type === EntityType.PLAYER || e.type === EntityType.ZOMBIE))) {
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
        // Cannot toggle if reinforced
        if (this.isReinforced && this.reinforcementHp > 0) return false;

        if (this.isOpen) {
            return this.close(gameMap);
        } else {
            return this.open();
        }
    }

    /**
     * Reinforce the window with 2x4s
     * @param {number} amount - Reinforcement HP to add
     */
    reinforce(amount) {
        this.reinforcementHp = Math.min(this.maxReinforcementHp, this.reinforcementHp + amount);
        this.isReinforced = this.reinforcementHp > 0;
        
        // Reinforcing ALWAYS blocks movement, even if open/broken
        this.updateBlocking();
        
        this.emitEvent('windowReinforced', {
            reinforcementHp: this.reinforcementHp,
            maxReinforcementHp: this.maxReinforcementHp
        });
        
        return true;
    }

    /**
     * Break the window
     */
    break(silent = false) {
        if (!this.isBroken) {
            this.isBroken = true;
            this.hp = 0;
            this.isLocked = false;
            // A broken window is effectively "open" for movement
            if (silent) {
                this._updateBlockingState();
                // Logical break occurred, but we delay subtype change for animations
            } else {
                this.updateBlocking();
                this.emitEvent('windowBroken');
            }
            return true;
        }
        return false;
    }

    /**
     * Take damage
     */
    takeDamage(amount, silent = false) {
        let damageRemaining = amount;

        // 1. Damage the glass first if not already broken/open
        if (!this.isBroken && !this.isOpen) {
            const glassDamage = Math.min(this.hp, damageRemaining);
            this.hp -= glassDamage;
            damageRemaining -= glassDamage;
            
            if (this.hp <= 0) {
                this.break(silent);
            }
        }

        // 2. Damage reinforcement if present
        if (this.isReinforced && damageRemaining > 0) {
            this.reinforcementHp = Math.max(0, this.reinforcementHp - damageRemaining);
            if (this.reinforcementHp <= 0) {
                this.isReinforced = false;
                if (!silent) {
                    this.emitEvent('windowReinforcementDestroyed');
                }
            }
        }

        if (!silent) {
            this.emitEvent('windowDamaged', { 
                currentHp: this.hp, 
                maxHp: this.maxHp,
                reinforcementHp: this.reinforcementHp,
                isReinforced: this.isReinforced
            });
        }
        
        // Update blocking state visually only if not silent
        if (!silent) {
            this.updateBlocking();
        } else {
            this._updateBlockingState();
        }
        
        return { 
            isBroken: this.isBroken, 
            isReinforced: this.isReinforced,
            reinforcementHp: this.reinforcementHp
        };
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
            isReinforced: this.isReinforced,
            reinforcementHp: this.reinforcementHp,
            subtype: this.subtype,
            blocksSight: this.blocksSight,
            hp: this.hp,
            maxHp: this.maxHp
        };
    }

    /**
     * Create from JSON
     */
    static fromJSON(data) {
        const windowEntity = new Window(data.id, data.x, data.y, data.isLocked || false, data.isOpen || false, data.isBroken || false);
        windowEntity.subtype = data.subtype || (data.isBroken ? 'broken' : (data.isOpen ? 'open' : 'closed'));
        windowEntity.blocksMovement = data.blocksMovement !== undefined ? data.blocksMovement : true;
        windowEntity.blocksSight = false; // Always false
        windowEntity.isReinforced = data.isReinforced || false;
        windowEntity.reinforcementHp = data.reinforcementHp || 0;
        windowEntity.hp = data.hp !== undefined ? data.hp : windowEntity.hp;
        windowEntity.maxHp = data.maxHp !== undefined ? data.maxHp : windowEntity.maxHp;
        return windowEntity;
    }
}
