import { EntityType } from './Entity.js';
import { Door } from './Door.js';
import engine from '../GameEngine.js';

/**
 * GarageDoor entity for large building entrances
 * Spans multiple tiles visually, but acts as a single synchronized door object
 */
export class GarageDoor extends Door {
    constructor(id, x, y, isLocked = false, isOpen = false, isDamaged = false, edge = undefined, groupId = null, isKeylocked = false) {
        super(id, x, y, isLocked, isOpen, isDamaged, edge, isKeylocked);
        this.type = EntityType.GARAGE_DOOR;
        this.maxHp = 100; // Stronger than a normal door
        this.hp = isDamaged ? 0 : this.maxHp;
        this.groupId = groupId;
        this._isSyncing = false;
    }

    getPeers() {
        if (!this.groupId) return [];
        const map = engine?.gameMap;
        if (!map) return [];
        const garageDoors = map.getEntitiesByType(EntityType.GARAGE_DOOR) || [];
        return garageDoors.filter(e => e.groupId === this.groupId && e.id !== this.id);
    }

    open() {
        if (this._isSyncing) return super.open();
        if (this.isLocked) return super.open(); // will fail and emit event
        
        const success = super.open();
        if (success) {
            this.getPeers().forEach(peer => {
                peer._isSyncing = true;
                peer.open();
                peer._isSyncing = false;
            });
        }
        return success;
    }

    close(gameMap = null) {
        if (this._isSyncing) return super.close(gameMap);
        
        const success = super.close(gameMap);
        if (success) {
            this.getPeers().forEach(peer => {
                peer._isSyncing = true;
                peer.close(gameMap);
                peer._isSyncing = false;
            });
        }
        return success;
    }

    lock() {
        if (this._isSyncing) return super.lock();
        
        const success = super.lock();
        if (success) {
            this.getPeers().forEach(peer => {
                peer._isSyncing = true;
                peer.lock();
                peer._isSyncing = false;
            });
        }
        return success;
    }

    unlock() {
        if (this._isSyncing) return super.unlock();
        
        const success = super.unlock();
        if (success && this.groupId) {
            this._isSyncing = true;
            try {
                const peers = this.getPeers();
                peers.forEach(peer => {
                    peer.unlock();
                });
            } finally {
                this._isSyncing = false;
            }
        }
        return success;
    }

    forceUnlock() {
        if (this._isSyncing) return super.forceUnlock();
        
        const success = super.forceUnlock();
        if (success && this.groupId) {
            this._isSyncing = true;
            try {
                const peers = this.getPeers();
                peers.forEach(peer => {
                    peer.forceUnlock();
                });
            } finally {
                this._isSyncing = false;
            }
        }
        return success;
    }

    takeDamage(amount, silent = false) {
        if (this._isSyncing) return super.takeDamage(amount, silent);
        
        const result = super.takeDamage(amount, silent);
        this.getPeers().forEach(peer => {
            peer._isSyncing = true;
            peer.hp = this.hp;
            if (this.isDamaged) peer.takeDamage(amount, silent);
            peer._isSyncing = false;
        });
        return result;
    }

    repair(amount) {
        if (this._isSyncing) return super.repair(amount);
        
        const success = super.repair(amount);
        if (success) {
            this.getPeers().forEach(peer => {
                peer._isSyncing = true;
                peer.hp = this.hp;
                peer.isDamaged = this.isDamaged;
                peer.maxHp = this.maxHp;
                peer.updateBlocking();
                peer._isSyncing = false;
            });
        }
        return success;
    }

    syncVisualState() {
        if (this._isSyncing) {
            super.syncVisualState();
            return;
        }
        super.syncVisualState();
        this.getPeers().forEach(peer => {
            peer._isSyncing = true;
            peer.syncVisualState();
            peer._isSyncing = false;
        });
    }

    toJSON() {
        return {
            ...super.toJSON(),
            groupId: this.groupId
        };
    }

    /**
     * Create GarageDoor from JSON data
     */
    static fromJSON(data) {
        const door = new GarageDoor(data.id, data.x, data.y, data.isLocked, data.isOpen, data.isDamaged, data.edge, data.groupId, data.isKeylocked);
        door.blocksMovement = data.blocksMovement;
        door.blocksSight = data.blocksSight;
        door.maxHp = data.maxHp !== undefined ? data.maxHp : door.maxHp;
        door.hp = data.hp !== undefined ? data.hp : door.hp;
        door.visualIsOpen = data.isOpen ?? false;
        return door;
    }
}
