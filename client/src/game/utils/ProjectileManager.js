import { LineOfSight } from './LineOfSight.js';
import GameEvents, { GAME_EVENT } from './GameEvents.js';
import { EntityType } from '../entities/Entity.js';
import engine from '../GameEngine.js';

export const ProjectileManager = {
    /**
     * Traces the path of a projectile from origin to target.
     * Breaks closed windows along the way.
     * 
     * @param {Object} gameMap The GameMap instance
     * @param {number} startX Origin X
     * @param {number} startY Origin Y
     * @param {number} targetX Target X
     * @param {number} targetY Target Y
     */
    processProjectilePath: (gameMap, startX, startY, targetX, targetY) => {
        if (!gameMap) return;

        // Use Bresenham's line algorithm to get the exact tile path
        const path = LineOfSight.getLinePath(startX, startY, targetX, targetY);
        
        // Skip the very first tile (where the shooter is standing)
        // Check every tile up to the target tile
        for (let i = 1; i < path.length; i++) {
            const point = path[i];
            const tile = gameMap.getTile(point.x, point.y);
            if (!tile) continue;

            // Check for Window
            const window = tile.contents.find(e => e.type === EntityType.WINDOW);
            if (window && !window.isOpen && window.subtype !== 'broken') {
                // Break the window
                if (typeof window.break === 'function') {
                    window.break();
                    GameEvents.emit(GAME_EVENT.WINDOW_SMASH, { windowPos: { x: point.x, y: point.y } });
                    console.log(`[ProjectileManager] Projectile broke window at (${point.x}, ${point.y})`);
                    
                    // Emit noise to alert zombies
                    if (typeof gameMap.emitNoise === 'function') {
                        gameMap.emitNoise(point.x, point.y, 5);
                    }
                }
            }

            // Check for closed Door
            const door = tile.contents.find(e => e.type === EntityType.DOOR);
            if (door && !door.isOpen && door.subtype !== 'broken') {
                // For now, bullets pass through doors or hit them.
                // The user requested window breaking, we can expand door logic later.
                // E.g., taking damage: door.takeDamage(10)
            }
            
            // Note: The bullet continues through windows and doors according to the approved plan.
            // Entity hits (Zombies/Player) are currently handled by the CombatContext at the final target coordinate.
        }
    }
};
