import { describe, it, expect } from 'vitest';
// T7 regression: gameplay rolls must come from the seeded stream, not
// Math.random(). Pins the AttributeProgressionManager 1d3 stat roll (R38#3)
// and WeatherManager's injectable RNG (R48#9).
import { EntityFactory } from '../../client/src/game/EntityFactory.js';
import { AttributeProgressionManager } from '../../client/src/game/systems/AttributeProgressionManager.js';
import { WeatherManager } from '../../client/src/game/utils/WeatherManager.js';
import { SeededRandom, gameRandom } from '../../client/src/game/utils/SeededRandom.js';

const assert = (condition, message) => expect(condition, message).toBeTruthy();

describe('Systems / seeded randomness (T7)', () => {
  it('rollAttribute consumes the seeded gameRandom stream', () => {
    const player = EntityFactory.createPlayer(0, 0);
    const stats = player.getComponent('RpgStats');
    stats.strengthXP = 100000; // far above any threshold
    stats.strengthXpSpent = 0;

    gameRandom.seed(12345);
    const expectedRoll = new SeededRandom(12345).nextInt(1, 3);

    const roll = AttributeProgressionManager.rollAttribute(player, 'strength');
    assert(roll === expectedRoll, `roll ${roll} matches seeded stream value ${expectedRoll}`);
    assert(roll >= 1 && roll <= 3, 'roll is a 1d3');
  });

  it('rollAttribute is reproducible from the same seed', () => {
    const rollOnce = (seed) => {
      const player = EntityFactory.createPlayer(0, 0);
      const stats = player.getComponent('RpgStats');
      stats.agilityXP = 100000;
      stats.agilityXpSpent = 0;
      gameRandom.seed(seed);
      return AttributeProgressionManager.rollAttribute(player, 'agility');
    };
    assert(rollOnce(777) === rollOnce(777), 'same seed → same stat roll');
  });

  it('WeatherManager defaults to the seeded gameRandom stream', () => {
    const engineStub = { weather: {}, setWeather() {}, gameMap: null, inventoryManager: null };
    const wm = new WeatherManager(engineStub);
    assert(wm.rng === gameRandom, 'default rng is gameRandom');
  });

  it('WeatherManager replays identical weather from an injected seed', () => {
    const engineStub = { weather: {}, setWeather() {}, gameMap: null, inventoryManager: null };
    const wm1 = new WeatherManager(engineStub, new SeededRandom(42));
    const wm2 = new WeatherManager(engineStub, new SeededRandom(42));

    assert(wm1.nextEventTurn === wm2.nextEventTurn, 'same initial rain turn');

    wm1.startRain(100);
    wm2.startRain(100);
    assert(wm1.durationRemaining === wm2.durationRemaining, 'same rain duration');
    assert(wm1.intensity === wm2.intensity, 'same initial intensity');

    for (let i = 0; i < 5; i++) {
      wm1.varyIntensity();
      wm2.varyIntensity();
      assert(wm1.intensity === wm2.intensity, `same intensity after variation ${i + 1}`);
    }

    wm1.stopRain(200);
    wm2.stopRain(200);
    assert(wm1.nextEventTurn === wm2.nextEventTurn, 'same next rain turn');
  });

  it('WeatherManager injected rng does not disturb the global stream', () => {
    const engineStub = { weather: {}, setWeather() {}, gameMap: null, inventoryManager: null };
    gameRandom.seed(999);
    const before = gameRandom.getState();
    const wm = new WeatherManager(engineStub, new SeededRandom(1));
    wm.startRain(0);
    assert(gameRandom.getState() === before, 'global gameRandom untouched by injected rng');
  });
});
