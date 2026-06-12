import { Position } from '../client/src/game/components/Position.js';
import { Health } from '../client/src/game/components/Health.js';
import { Renderable } from '../client/src/game/components/Renderable.js';
import { Movable } from '../client/src/game/components/Movable.js';
import { InventoryContainer } from '../client/src/game/components/InventoryContainer.js';
import { AIBehavior } from '../client/src/game/components/AIBehavior.js';
import { LightEmitter } from '../client/src/game/components/LightEmitter.js';

console.log("Starting Phase 1 Verification...");

// 1. Position
const posDefault = new Position();
console.log("Position default:", posDefault);
const posCustom = new Position({ x: 10, y: 20, level: 1, facing: 'north' });
console.log("Position custom:", posCustom);

// 2. Health
const healthDefault = new Health();
console.log("Health default:", healthDefault);
const healthCustom = new Health({ current: 50, max: 150, isDead: false });
console.log("Health custom:", healthCustom);

// 3. Renderable
const renderDefault = new Renderable();
console.log("Renderable default:", renderDefault);
const renderCustom = new Renderable({ spriteId: 'player_sprite', color: '#00ff00', zIndex: 10, isVisible: false });
console.log("Renderable custom:", renderCustom);

// 4. Movable
const movableDefault = new Movable();
console.log("Movable default:", movableDefault);
const movableCustom = new Movable({ apCost: 2, baseSpeed: 1.5 });
console.log("Movable custom:", movableCustom);

// 5. InventoryContainer
const invDefault = new InventoryContainer();
console.log("InventoryContainer default:", invDefault);
const invCustom = new InventoryContainer({ slots: [1, 2, 3], maxWeight: 100, currentWeight: 10 });
console.log("InventoryContainer custom:", invCustom);

// 6. AIBehavior
const aiDefault = new AIBehavior();
console.log("AIBehavior default:", aiDefault);
const aiCustom = new AIBehavior({ state: 'hostile', lastSeenPlayerAt: { x: 5, y: 5 }, alertLevel: 2 });
console.log("AIBehavior custom:", aiCustom);

// 7. LightEmitter
const lightDefault = new LightEmitter();
console.log("LightEmitter default:", lightDefault);
const lightCustom = new LightEmitter({ radius: 8, intensity: 0.8, color: '#ffaa00', isOn: true });
console.log("LightEmitter custom:", lightCustom);

console.log("Phase 1 Verification Complete! All components instantiated successfully.");
