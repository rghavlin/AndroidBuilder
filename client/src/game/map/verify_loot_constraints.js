
import { LootGenerator } from './LootGenerator.js';
import { ItemTrait } from '../inventory/traits.js';

const generator = new LootGenerator();

function verifyLoot(items, context) {
    let beltCount = 0;
    let errors = [];

    items.forEach(item => {
        if (item.defId === 'crafting.leather_belt') {
            beltCount++;
        }
        if (item.stackCount > 1) {
            errors.push(`${context}: Item ${item.defId} has stackCount ${item.stackCount}`);
        }
        
        // Check attachments
        if (item.attachments) {
            Object.values(item.attachments).forEach(attach => {
                if (attach.stackCount > 1) {
                    errors.push(`${context}: Attachment ${attach.defId} for ${item.defId} has stackCount ${attach.stackCount}`);
                }
                if (attach.ammoCount > 1 && attach.defId !== 'tool.battery') {
                    // For magazines/flashlights, we set ammoCount to 1, EXCEPT for batteries in some old logic maybe?
                    // But in my updates I set flashlight battery ammoCount to 1 too.
                    // Note: water bottles/jugs have ammoCount for water level, which is allowed to be > 1.
                    // "No stacks" usually refers to item counts.
                    if (!attach.defId.includes('battery')) {
                         errors.push(`${context}: Attachment ${attach.defId} for ${item.defId} has ammoCount ${attach.ammoCount}`);
                    }
                }
            });
        }
    });

    if (beltCount > 1) {
        errors.push(`${context}: Found ${beltCount} leather belts`);
    }

    return errors;
}

console.log("Starting Loot Verification...");

const iterations = 1000;
let allErrors = [];

// Test generateRandomItems
for (let i = 0; i < iterations; i++) {
    const items = generator.generateRandomItems('any');
    allErrors.push(...verifyLoot(items, `generateRandomItems iterative roll ${i}`));
}

// Test generateZombieLoot for all subtypes
const subtypes = ['basic', 'crawler', 'runner', 'firefighter', 'swat'];
for (const subtype of subtypes) {
    for (let i = 0; i < 200; i++) {
        const items = generator.generateZombieLoot(subtype);
        allErrors.push(...verifyLoot(items, `generateZombieLoot (${subtype}) roll ${i}`));
    }
}

if (allErrors.length === 0) {
    console.log("SUCCESS: All loot constraints satisfied!");
} else {
    console.error("FAILURE: Loot constraints violated:");
    allErrors.slice(0, 20).forEach(err => console.error(err));
    if (allErrors.length > 20) console.log(`... and ${allErrors.length - 20} more errors.`);
    process.exit(1);
}
