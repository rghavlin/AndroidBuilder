
/**
 * WeatherManager - Handles procedural weather cycles
 * Implementation based on a moderate climate (rain every 3-5 days)
 */
export class WeatherManager {
  constructor(engine) {
    this.engine = engine;
    this.isRaining = false;
    this.durationRemaining = 0;
    this.nextEventTurn = Math.floor(72 + Math.random() * 48); // Initial rain between 3-5 days
    this.intensity = 0;

    // Configuration (Turns = Hours)
    this.RAIN_INTERVAL_MIN = 72; // 3 days
    this.RAIN_INTERVAL_MAX = 120; // 5 days
    this.RAIN_DURATION_MIN = 1;
    this.RAIN_DURATION_MAX = 5;
    this.INTENSITY_CHANGE_MAX = 0.25;
  }

  /**
   * Update weather state for a new turn
   * @param {number} turn - Current absolute game turn
   */
  update(turn) {
    if (!this.isRaining) {
      // Check if it's time to start raining
      if (turn >= this.nextEventTurn) {
        this.startRain(turn);
      }
    } else {
      // Process ongoing rain
      this.durationRemaining--;
      
      if (this.durationRemaining <= 0) {
        this.stopRain(turn);
      } else {
        // Vary intensity across turns
        this.varyIntensity();
      }
    }

    // Sync visual state to engine
    this.syncToEngine();
  }

  /**
   * Start a new rain event
   */
  startRain(turn) {
    console.log(`[WeatherManager] 🌦️ Rain starting at turn ${turn}`);
    this.isRaining = true;
    this.durationRemaining = Math.floor(this.RAIN_DURATION_MIN + Math.random() * (this.RAIN_DURATION_MAX - this.RAIN_DURATION_MIN + 1));
    this.intensity = 0.2 + Math.random() * 0.6; // Start with moderate intensity [0.2, 0.8]
    console.log(`[WeatherManager] - Duration: ${this.durationRemaining} turns, Initial Intensity: ${this.intensity.toFixed(2)}`);
  }

  /**
   * Stop current rain event and schedule next one
   */
  stopRain(turn) {
    console.log(`[WeatherManager] ☀️ Rain stopping at turn ${turn}`);
    this.isRaining = false;
    this.intensity = 0;
    
    // Schedule next rain event (3-5 days from now)
    const interval = Math.floor(this.RAIN_INTERVAL_MIN + Math.random() * (this.RAIN_INTERVAL_MAX - this.RAIN_INTERVAL_MIN + 1));
    this.nextEventTurn = turn + interval;
    console.log(`[WeatherManager] - Next rain event scheduled for turn: ${this.nextEventTurn}`);
  }

  /**
   * Randomly fluctuate rain intensity
   */
  varyIntensity() {
    const change = (Math.random() * 2 - 1) * this.INTENSITY_CHANGE_MAX;
    this.intensity = Math.max(0.1, Math.min(1.0, this.intensity + change));
    console.log(`[WeatherManager] - Intensity varied to: ${this.intensity.toFixed(2)}`);
  }

  /**
   * Update the visual weather object in GameEngine
   */
  syncToEngine() {
    if (this.engine) {
      const weatherType = this.isRaining ? 'rain' : 'clear';
      // Only trigger engine update if state actually changed to minimize re-renders
      if (this.engine.weather.type !== weatherType || this.engine.weather.intensity !== this.intensity) {
        this.engine.setWeather(weatherType, this.intensity);
      }
    }
  }

  /**
   * Serialize state for saving
   */
  toJSON() {
    return {
      isRaining: this.isRaining,
      durationRemaining: this.durationRemaining,
      nextEventTurn: this.nextEventTurn,
      intensity: this.intensity
    };
  }

  /**
   * Restore state from save
   */
  fromJSON(data) {
    if (!data) return;
    this.isRaining = data.isRaining || false;
    this.durationRemaining = data.durationRemaining || 0;
    this.nextEventTurn = data.nextEventTurn || 0;
    this.intensity = data.intensity || 0;
    this.syncToEngine();
  }
}
