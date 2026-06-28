// Verify crop growth transform produces a valid entity (no malformed components,
// no duplicate ids, correct stage) — regression test for the save-crash bug.
//
// Run: node scratch/verify_crop_growth.mjs

import { GameMap } from '../client/src/game/map/GameMap.js';
import { createItemFromDef } from '../client/src/game/inventory/ItemDefs.js';
import { Item } from '../client/src/game/inventory/Item.js';

let failures = 0;
const ok = (cond, msg) => { console.error(`${cond ? 'PASS' : 'FAIL'} - ${msg}`); if (!cond) failures++; };

// Capture duplicate-id errors emitted by GameMap.addEntity.
let dupDetected = false;
const origError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('DUPLICATE ENTITY ID')) dupDetected = true;
  // swallow during run; we re-report at the end
};

const map = new GameMap(10, 10);
// Make the tile plantable ground.
const tile = map.getTile(5, 5);
tile.terrain = 'grass';

// Place a carrot plant about to mature.
const plant = Item.fromJSON(createItemFromDef('provision.carrot_plant'));
plant.lifetimeTurns = 1;
map.setItemsOnTile(5, 5, [plant]);

const before = map.getEntitiesByType('item');
const plantEntity = before.find(e => e.defId === 'provision.carrot_plant');
const instanceId = plantEntity?.id;

// Tick turns until it transforms (lifetime 1 -> 0 -> transform).
for (let i = 0; i < 3; i++) map.processTurn(null, false, i + 1);

console.error = origError;

const items = map.getEntitiesByType('item');
const harvestable = items.find(e => e.defId === 'provision.harvestable_carrot');
const stalePlant = items.find(e => e.defId === 'provision.carrot_plant');

ok(!!harvestable, 'carrot_plant transformed into harvestable_carrot');
ok(!stalePlant, 'no stale carrot_plant entity left behind');
ok(harvestable && harvestable.type === 'item', `transformed entity keeps type "item" (got: ${harvestable?.type})`);
ok(harvestable && harvestable.components instanceof Map, 'transformed entity still has a Map components field');
ok(harvestable && typeof harvestable.getComponent === 'function' && !!harvestable.getComponent('Item'),
   'transformed entity still has its Item component');
ok(harvestable && harvestable.produce === 'food.carrot', `harvestable carries produce defId (got: ${harvestable?.produce})`);
ok(harvestable && (harvestable.lifetimeTurns === null || harvestable.lifetimeTurns === undefined),
   'harvestable has no lifetimeTurns (fully grown)');
ok(harvestable && harvestable.id === instanceId, 'transformed entity preserved its instanceId');
ok(!dupDetected, 'no DUPLICATE ENTITY ID errors during transform');

// The whole map must serialize without throwing (the original crash).
let serialized = false;
try { JSON.stringify(map.toJSON()); serialized = true; } catch (e) { console.error('serialize threw:', e.message); }
ok(serialized, 'map serializes (toJSON) without throwing after transform');

// Audit must find zero malformed entities.
const offenders = map.auditEntityComponents('test');
ok(offenders.length === 0, `auditEntityComponents finds no malformed entities (found ${offenders.length})`);

console.error(`\n${failures === 0 ? 'ALL PASS' : failures + ' FAILURE(S)'}`);
process.exit(failures === 0 ? 0 : 1);
