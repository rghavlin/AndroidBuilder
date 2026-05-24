import { Player } from './client/src/game/entities/Player.js';
import engine from './client/src/game/GameEngine.js';

function runTest() {
    console.log("=== Running Full Reading Sequence ===");
    const player = new Player('player-1', 'Player', 0, 0);
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
}

runTest();
