import { Entity } from './Entity.js';

/**
 * PlaceIcon entity for special buildings and landmarks
 * Used for building signs (Grocery, Police, Fire) and objects like fuel pumps.
 * Non-blocking and non-interactable.
 */
export class PlaceIcon extends Entity {
    /**
     * @param {string} id - Unique entity ID
     * @param {number} x - Tile X
     * @param {number} y - Tile Y
     * @param {string} subtype - The specific place type (grocer, police, firestation, fuelpump)
     */
    constructor(id, x, y, subtype) {
        super(id, 'place_icon', x, y);
        this.subtype = subtype;
        this.blocksMovement = false;
        this.blocksSight = false;
    }

    /**
     * Serialize to JSON
     */
    toJSON() {
        return {
            ...super.toJSON(),
            subtype: this.subtype,
            blocksMovement: this.blocksMovement,
            blocksSight: this.blocksSight
        };
    }

    /**
     * Create from JSON data
     */
    static fromJSON(data) {
        const icon = new PlaceIcon(data.id, data.x, data.y, data.subtype);
        icon.blocksMovement = data.blocksMovement || false;
        icon.blocksSight = data.blocksSight || false;
        return icon;
    }
}
