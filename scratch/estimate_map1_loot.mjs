// Monte Carlo estimate of loot spawned on Map 1 (branching_road, 220x260) and
// how much of it a player can realistically haul off the map for a "toll".
//
// Models:
//   - Real map generation + real LootGenerator, N times.
//   - A collection rate (fraction of the map's loot the player actually reaches
//     and bothers to pick up).
//   - The player's total carrying capacity in grid CELLS, summed from a fixed
//     loadout (book bag + shirt + cargo pants + full belt + nested containers +
//     a wagon), read straight from ItemDefs/PocketLayouts so it tracks the game.
//   - Toll exclusions: sticks, stones and planks never count toward a toll, and
//     world furniture/placeables/vehicles are never collectible.
//
// Run:  node scratch/estimate_map1_loot.mjs [runs] [collectionRate] [wagon|cargo]
//   e.g. node scratch/estimate_map1_loot.mjs 300 0.5 wagon

import { GameMap } from '../client/src/game/map/GameMap.js';
import { TemplateMapGenerator } from '../client/src/game/map/TemplateMapGenerator.js';
import { LootGenerator } from '../client/src/game/map/LootGenerator.js';
import { gameRandom } from '../client/src/game/utils/SeededRandom.js';
import { ItemDefs } from '../client/src/game/inventory/ItemDefs.js';
import { PocketLayouts } from '../client/src/game/inventory/PocketLayouts.js';

const RUNS = parseInt(process.argv[2] || '300', 10);
const COLLECTION_RATE = parseFloat(process.argv[3] || '0.5'); // fraction of map looted
const WAGON_CHOICE = (process.argv[4] || 'wagon').toLowerCase(); // 'wagon' | 'cargo'

// --- Toll rules ----------------------------------------------------------------
const NON_COLLECTIBLE_PREFIXES = ['furniture.', 'placeable.', 'environment.', 'vehicle.'];
const TOLL_EXCLUDE_IDS = new Set(['weapon.stick', 'weapon.plank', 'crafting.stone']);
const isCollectible = (id) => !NON_COLLECTIBLE_PREFIXES.some(p => id.startsWith(p));
const isTollEligible = (id) => isCollectible(id) && !TOLL_EXCLUDE_IDS.has(id);

const footprintOf = (id) => {
    const d = ItemDefs[id];
    if (!d) return 1;
    return (d.width || 1) * (d.height || 1);
};

// --- Carrying capacity (cells), computed from the real defs ---------------------
const gridArea = (id) => { const g = ItemDefs[id]?.containerGrid; return g ? g.width * g.height : 0; };
const beltArea = (id) => { const g = ItemDefs[id]?.beltGrid; return g ? g.width * g.height : 0; };
const pocketArea = (id) => {
    const pl = PocketLayouts[ItemDefs[id]?.pocketLayoutId];
    return pl ? pl.pockets.reduce((a, p) => a + p.width * p.height, 0) : 0;
};
// Nested containers consume their own footprint inside a parent, so their net
// contribution to capacity is (internal grid - own footprint).
const nestedNet = (id) => Math.max(0, gridArea(id) - footprintOf(id));

function buildCapacity() {
    const wagonId = WAGON_CHOICE === 'cargo' ? 'vehicle.cargo_wagon' : 'vehicle.wagon';
    const parts = [
        ['Book bag (backpack)', gridArea('backpack.school')],
        ['Shirt (police/paramedic, 1 worn)', pocketArea('clothing.police_shirt')],
        ['Cargo pants', pocketArea('clothing.cargopants')],
        ['Belt: 2x holster', 2 * beltArea('belt.holster')],
        ['Belt: 2x ammo pouch', 2 * beltArea('belt.ammo_pouch')],
        ['Belt: 1x belt pouch', beltArea('belt.pouch')],
        ['Belt: 2x tool ring', 2 * beltArea('belt.tool_ring')],
        [`Wagon (${ItemDefs[wagonId].name})`, gridArea(wagonId)],
        ['Lunchbox (net)', nestedNet('container.lunchbox')],
        ['Toolbox (net)', nestedNet('container.toolbox')],
        ['Gun case (net)', nestedNet('container.guncase')],
    ];
    const total = parts.reduce((a, [, c]) => a + c, 0);
    return { parts, total, wagonId };
}

// --- Loot collection -----------------------------------------------------------
const qtyByType = {};       // sum of quantities (stackCount) across runs
const cellsByType = {};     // sum of footprint cells across runs (a stack = 1 footprint)
const instByType = {};      // sum of item instances across runs
const presenceRuns = {};
const perRunQty = [];

function collectItem(item, acc) {
    if (!item) return;
    const id = item.defId || item.id || item.name || 'unknown';
    const qty = (typeof item.stackCount === 'number' && item.stackCount > 0) ? item.stackCount : 1;
    acc[id] = acc[id] || { qty: 0, cells: 0, inst: 0 };
    acc[id].qty += qty;
    acc[id].cells += footprintOf(id);
    acc[id].inst += 1;
    try {
        const grid = item.getContainerGrid && item.getContainerGrid();
        if (grid && typeof grid.getAllItems === 'function') {
            for (const sub of grid.getAllItems()) collectItem(sub, acc);
        } else if (item.attachments) {
            for (const k of Object.keys(item.attachments)) {
                if (item.attachments[k]) collectItem(item.attachments[k], acc);
            }
        }
    } catch (e) { /* ignore */ }
}

async function runOnce(seed) {
    gameRandom.seed(seed);
    const generator = new TemplateMapGenerator();
    const mapData = generator.generateFromTemplate('branching_road', { seed, mapNumber: 1 });
    const gameMap = new GameMap(mapData.width, mapData.height);
    gameMap.mapNumber = 1;
    await generator.applyToGameMap(gameMap, mapData);
    new LootGenerator().spawnLoot(gameMap, 1, {});

    const acc = {};
    for (let y = 0; y < gameMap.height; y++) {
        for (let x = 0; x < gameMap.width; x++) {
            const items = gameMap.getItemsOnTile ? gameMap.getItemsOnTile(x, y) : null;
            if (items && items.length) for (const it of items) collectItem(it, acc);
        }
    }
    return acc;
}

async function main() {
    const origWrite = process.stdout.write.bind(process.stdout);
    const mute = () => { process.stdout.write = () => true; };
    const unmute = () => { process.stdout.write = origWrite; };
    mute();

    let completed = 0;
    for (let i = 0; i < RUNS; i++) {
        try {
            const acc = await runOnce(1000 + i * 7919);
            let runQty = 0;
            for (const [id, v] of Object.entries(acc)) {
                qtyByType[id] = (qtyByType[id] || 0) + v.qty;
                cellsByType[id] = (cellsByType[id] || 0) + v.cells;
                instByType[id] = (instByType[id] || 0) + v.inst;
                presenceRuns[id] = (presenceRuns[id] || 0) + 1;
                runQty += v.qty;
            }
            perRunQty.push(runQty);
            completed++;
        } catch (e) {
            unmute(); console.error(`Run ${i} failed:`, e); mute();
        }
    }
    unmute();

    const avg = (m, id) => (m[id] || 0) / completed;

    // Aggregate over toll-eligible types
    let tollQty = 0, tollCells = 0, tollInst = 0;
    let collQty = 0, collCells = 0;
    for (const id of Object.keys(qtyByType)) {
        if (isCollectible(id)) { collQty += avg(qtyByType, id); collCells += avg(cellsByType, id); }
        if (isTollEligible(id)) {
            tollQty += avg(qtyByType, id);
            tollCells += avg(cellsByType, id);
            tollInst += avg(instByType, id);
        }
    }

    const grandAvg = perRunQty.reduce((a, b) => a + b, 0) / completed;
    const cap = buildCapacity();
    const avgFootprint = tollCells / tollInst; // cells per toll item-stack

    // What the player actually ends up with:
    //  - reachable toll loot (cells) = collection rate * map's toll-eligible cells
    //  - but capped by carrying capacity
    const reachableCells = COLLECTION_RATE * tollCells;
    const haulCells = Math.min(cap.total, reachableCells);
    const haulStacks = haulCells / avgFootprint;
    const capacityBound = cap.total < reachableCells;

    console.log(`\n=== Map 1 (branching_road 220x260) — toll accumulation model ===`);
    console.log(`Runs: ${completed} | Collection rate: ${(COLLECTION_RATE * 100).toFixed(0)}% | Wagon: ${ItemDefs[cap.wagonId].name}\n`);

    console.log(`Spawned per map (averages):`);
    console.log(`  Total item quantity (everything): ${grandAvg.toFixed(0)}`);
    console.log(`  Collectible quantity:             ${collQty.toFixed(0)}  (${collCells.toFixed(0)} cells)`);
    console.log(`  Toll-eligible quantity:           ${tollQty.toFixed(0)}  (${tollCells.toFixed(0)} cells, ${tollInst.toFixed(0)} stacks)`);
    console.log(`  (toll excludes sticks/stones/planks + furniture/placeables/vehicles)\n`);

    console.log(`Player carrying capacity (cells):`);
    for (const [label, cells] of cap.parts) console.log(`  ${String(cells).padStart(4)}  ${label}`);
    console.log(`  ----`);
    console.log(`  ${String(cap.total).padStart(4)}  TOTAL capacity\n`);

    console.log(`Estimated haul off this map:`);
    console.log(`  Avg footprint of a toll item-stack: ${avgFootprint.toFixed(2)} cells`);
    console.log(`  Reachable toll loot @${(COLLECTION_RATE * 100).toFixed(0)}%: ${reachableCells.toFixed(0)} cells`);
    console.log(`  Bound by: ${capacityBound ? 'CARRYING CAPACITY (loot is plentiful)' : 'collection rate (capacity to spare)'}`);
    console.log(`  => Player hauls ~${haulCells.toFixed(0)} cells of toll goods ≈ ${haulStacks.toFixed(0)} item-stacks\n`);

    console.log(`Toll sizing reference (fraction of full capacity = ${cap.total} cells):`);
    for (const pct of [0.1, 0.2, 0.25, 0.33, 0.5]) {
        const cells = Math.round(cap.total * pct);
        console.log(`  ${(pct * 100).toFixed(0).padStart(3)}%  =>  ${String(cells).padStart(3)} cells  ≈ ${Math.round(cells / avgFootprint)} item-stacks`);
    }
    console.log('');
}

main().catch(e => { console.error(e); process.exit(1); });
