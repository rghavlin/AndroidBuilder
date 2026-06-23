import { EntityType } from '../entities/Entity.js';

// Edge-aligned doors/windows are anchored to a single tile but visually sit on
// the shared boundary between two tiles. When the player clicks a tile that has
// no such structure directly on it, the intended target may be a structure
// anchored to a NEIGHBORING tile but facing the clicked tile — e.g. a window on
// the player's own sill, smashed by clicking outward. Each neighbor's `edge` is
// the side of THAT neighbor shared with (x, y), so a structure anchored there
// with that edge faces the clicked tile:
//   north neighbor (y-1) -> edge 's'   south neighbor (y+1) -> edge 'n'
//   west  neighbor (x-1) -> edge 'e'   east  neighbor (x+1) -> edge 'w'
const NEIGHBORS = [
    { dx: 0, dy: -1, edge: 's' },
    { dx: 0, dy: 1, edge: 'n' },
    { dx: -1, dy: 0, edge: 'e' },
    { dx: 1, dy: 0, edge: 'w' },
];

const matchesType = (entity, type) => {
    if (type === 'door') return entity.type === EntityType.DOOR;
    if (type === 'window') return entity.type === EntityType.WINDOW;
    return entity.type === EntityType.DOOR || entity.type === EntityType.WINDOW;
};

// Find a door/window for a click at (x, y): first on the clicked tile itself,
// then on the four neighbors for an edge structure facing this tile. `type`
// filters to 'door', 'window', or 'either' (default). Returns the structure plus
// its true anchor tile (structureX/structureY), where damage, effects, locking,
// and noise must be applied. When nothing is found, structure is null and the
// anchor coords echo the clicked tile.
export const findEdgeStructure = (gameMap, x, y, { type = 'either' } = {}) => {
    if (!gameMap) return { structure: null, structureX: x, structureY: y };

    const onTile = gameMap.getTile(x, y)?.contents.find(e => matchesType(e, type)) || null;
    if (onTile) return { structure: onTile, structureX: x, structureY: y };

    for (const { dx, dy, edge } of NEIGHBORS) {
        const nx = x + dx;
        const ny = y + dy;
        const found = gameMap.getTile(nx, ny)?.contents.find(
            e => matchesType(e, type) && e.edge === edge
        );
        if (found) return { structure: found, structureX: nx, structureY: ny };
    }

    return { structure: null, structureX: x, structureY: y };
};
