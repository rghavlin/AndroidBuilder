import { Player } from './client/src/game/entities/Player.js';

function runTest() {
    console.log("=== Testing Book Milestone & player.maxAp ===");
    const player = new Player('player_id', 'Test Player', 0, 0);
    console.log(`Initial maxAp: ${player.maxAp}`); // Expect 20
    
    // Simulate readBook milestone check logic
    const stats = {
        pagesLeft: 500,
        milestonesReached: 0
    };
    
    // Read 101 pages: pagesLeft becomes 399
    const pagesRead = 101;
    stats.pagesLeft -= pagesRead;
    
    const totalPagesRead = 500 - stats.pagesLeft;
    const currentMilestones = Math.floor(totalPagesRead / 100);
    const newMilestones = currentMilestones - (stats.milestonesReached || 0);
    
    console.log(`totalPagesRead: ${totalPagesRead}`);
    console.log(`currentMilestones: ${currentMilestones}`);
    console.log(`newMilestones: ${newMilestones}`);
    
    if (newMilestones > 0) {
        player.modifyStat('maxAp', newMilestones);
        stats.milestonesReached = currentMilestones;
        console.log(`Max AP increased by ${newMilestones}!`);
    }
    
    console.log(`Final player.maxAp: ${player.maxAp}`);
}

runTest();
