import { EntityFactory } from './client/src/game/EntityFactory.js';
import engine from './client/src/game/GameEngine.js';

function runTest() {
    console.log("=== Running Full Reading Sequence ===");
    const player = EntityFactory.createPlayer(0, 0);
    engine.player = player;

    // Reset book stats
    engine.bookStats = {
      'book.life_in_motion': {
        pagesLeft: 500,
        milestonesReached: 0
      }
    };

    const stats = engine.bookStats['book.life_in_motion'];
    const item = { defId: 'book.life_in_motion', name: 'Life in Motion' };

    const readPages = (amount) => {
        const apAvailable = player.ap || 0;
        const apNeeded = amount === 'max' ? Math.floor(Math.min(apAvailable, stats.pagesLeft)) : amount;
        
        console.log(`Reading: requested=${amount}, apAvailable=${apAvailable}, pagesLeft=${stats.pagesLeft}, apNeeded=${apNeeded}`);
        
        if (apNeeded <= 0) {
            console.log(">> Fail: apNeeded <= 0");
            return false;
        }

        if (apAvailable < apNeeded) {
            console.log(">> Fail: Not enough AP to read");
            return false;
        }

        if (stats.pagesLeft < apNeeded) {
            console.log(">> Fail: Not enough pages left");
            return false;
        }

        stats.pagesLeft -= apNeeded;
        player.useAP(apNeeded);
        
        const totalPagesRead = 500 - stats.pagesLeft;
        const currentMilestones = Math.floor(totalPagesRead / 100);
        const newMilestones = currentMilestones - (stats.milestonesReached || 0);
        
        if (newMilestones > 0) {
            player.modifyStat('maxAp', newMilestones);
            stats.milestonesReached = currentMilestones;
            console.log(`>> Milestone reached! newMilestones=${newMilestones}. Player maxAp is now ${player.maxAp}`);
        }
        return true;
    };

    // Initial state
    console.log(`Start: player.ap=${player.ap}, player.maxAp=${player.maxAp}`);

    // Turn 1: read 20 pages (max)
    readPages('max');
    console.log(`End Turn 1: player.ap=${player.ap}, player.maxAp=${player.maxAp}\n`);

    // Restore AP
    player.restoreAP(player.maxAp);
    
    // Turn 2: read 20 pages (max)
    readPages('max');
    console.log(`End Turn 2: player.ap=${player.ap}, player.maxAp=${player.maxAp}\n`);

    // Restore AP
    player.restoreAP(player.maxAp);
    
    // Turn 3: read 20 pages (max)
    readPages('max');
    console.log(`End Turn 3: player.ap=${player.ap}, player.maxAp=${player.maxAp}\n`);

    // Restore AP
    player.restoreAP(player.maxAp);
    
    // Turn 4: read 20 pages (max)
    readPages('max');
    console.log(`End Turn 4: player.ap=${player.ap}, player.maxAp=${player.maxAp}\n`);

    // Restore AP
    player.restoreAP(player.maxAp);
    
    // Turn 5: read 20 pages (max) - total 100 pages
    readPages('max');
    console.log(`End Turn 5: player.ap=${player.ap}, player.maxAp=${player.maxAp}\n`);

    // Restore AP
    player.restoreAP(player.maxAp);
    
    // Turn 6: read 1 page - total 101 pages
    readPages(1);
    console.log(`End Turn 6: player.ap=${player.ap}, player.maxAp=${player.maxAp}\n`);

    // Turn 7: Try to read 5 pages when only having 4 AP
    player.ap = 4;
    console.log("--- Testing Read 5 with insufficient AP (4 AP) ---");
    readPages(5);
    console.log(`After Try: player.ap=${player.ap}, pagesLeft=${stats.pagesLeft}\n`);

    // Turn 8: Read 5 pages successfully
    player.ap = 20;
    console.log("--- Testing Read 5 with sufficient AP (20 AP) ---");
    readPages(5);
    console.log(`After Read 5: player.ap=${player.ap}, pagesLeft=${stats.pagesLeft}\n`);

    // Turn 9: Try to read 5 pages when only 3 pages left in book
    stats.pagesLeft = 3;
    player.ap = 20;
    console.log("--- Testing Read 5 with insufficient pages left (3 pages left) ---");
    readPages(5);
    console.log(`After Try: player.ap=${player.ap}, pagesLeft=${stats.pagesLeft}\n`);
}

runTest();
