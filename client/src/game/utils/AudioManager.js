
/**
 * AudioManager - Centralized utility for managing game audio
 */
class AudioManager {
  constructor() {
    this.id = Math.random().toString(36).substr(2, 9);
    console.debug(`[AudioManager] New instance created: ${this.id}`);
    this.sounds = new Map(); // Store { instances: Audio[], index: number }
    this.soundDefaults = new Map(); // Store default volume per sound
    this.masterVolume = 1.0;
    this.isMuted = false;
  }

  async loadSound(name, path, defaultVolume = 1.0) {
    if (defaultVolume !== undefined) {
      this.soundDefaults.set(name, Math.max(0, Math.min(1, defaultVolume)));
    }
    
    if (this.sounds.has(name)) return this.sounds.get(name).instances[0];

    const poolSize = 3; // Create 3 instances for each sound to avoid latency of cloning
    const instances = [];

    const loadInstance = (idx) => new Promise((resolve, reject) => {
      console.debug(`[AudioManager] ⏳ Loading sound node ${idx+1}/${poolSize} for "${name}" from: ${path}`);
      const audio = new Audio();
      
      const timeout = setTimeout(() => {
        cleanup();
        console.warn(`[AudioManager] ⏰ Node ${idx+1} timeout for "${name}" - attempting playback anyway`);
        resolve(audio);
      }, 5000);

      const cleanup = () => {
        clearTimeout(timeout);
        audio.oncanplaythrough = null;
        audio.onloadeddata = null;
        audio.onerror = null;
      };

      const onSuccess = () => {
        cleanup();
        resolve(audio);
      };

      audio.oncanplaythrough = onSuccess;
      audio.onloadeddata = onSuccess;
      audio.onerror = (e) => {
        cleanup();
        console.error(`[AudioManager] ❌ Failed to load sound node ${idx+1}: ${path}`, e);
        reject(new Error(`Failed to load sound node ${idx+1}: ${path}`));
      };

      audio.src = path;
      audio.preload = 'auto';
      audio.load(); // Force start loading
    });

    try {
      // Load all instances in the pool
      const loadedInstances = await Promise.all(
        Array.from({ length: poolSize }, (_, i) => loadInstance(i))
      );
      
      this.sounds.set(name, {
        instances: loadedInstances,
        index: 0
      });
      
      console.log(`[AudioManager] ✅ Loaded sound pool for "${name}" (size: ${poolSize})`);
      return loadedInstances[0];
    } catch (err) {
      console.error(`[AudioManager] Critical failure loading sound pool for "${name}":`, err);
      throw err;
    }
  }

  playSound(name, options = {}) {
    if (this.isMuted) return;

    const pool = this.sounds.get(name);
    if (!pool) {
      const available = Array.from(this.sounds.keys());
      console.warn(`[AudioManager] ❌ #${this.id} Sound "${name}" not found in pool. Available:`, available);
      return;
    }

    const { instances, index } = pool;
    const baseVolume = this.soundDefaults.get(name) || 1.0;
    const { loop = false, volume = baseVolume, playbackRate = 1.0 } = options;

    const finalVolume = volume * this.masterVolume;
    console.log(`[AudioManager] 🔊 Playing "${name}" | Volume: ${finalVolume.toFixed(2)} | Pool Index: ${index}`);

    try {
      // Pick the next available node in the circular buffer
      const audio = instances[index];
      
      // Update index for next time
      pool.index = (index + 1) % instances.length;

      // Ensure the node is in a playable state
      if (audio.readyState < 2) {
        console.debug(`[AudioManager] ⏳ Node for "${name}" not ready (readyState: ${audio.readyState}) - forcing load`);
        audio.load();
      }

      audio.volume = volume * this.masterVolume;
      audio.playbackRate = playbackRate;
      audio.loop = loop;
      
      // If it's already playing, reset it or it might not restart in some browsers
      if (!audio.paused && !loop) {
        audio.currentTime = 0;
      }

      audio.play().catch(e => {
        if (e.name === 'NotAllowedError') {
          console.warn('[AudioManager] Playback blocked by browser policy.');
        } else {
          console.error(`[AudioManager] Play error for "${name}" (src: ${audio.src}, state: ${audio.readyState}):`, e);
        }
      });
    } catch (err) {
      console.error(`[AudioManager] Unexpected error for "${name}":`, err);
    }
  }

  stopSound(name) {
    const pool = this.sounds.get(name);
    if (pool) {
      pool.instances.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
    }
  }

  /**
   * Set master volume (0.0 to 1.0)
   * @param {number} volume 
   */
  setVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    // Update currently playing sounds in all pools
    this.sounds.forEach((pool, name) => {
      pool.instances.forEach(audio => {
        if (!audio.paused) {
          const base = this.soundDefaults.get(name) || 1.0;
          audio.volume = base * this.masterVolume;
        }
      });
    });
  }

  /**
   * Toggle mute
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    this.sounds.forEach(pool => {
      pool.instances.forEach(audio => {
        audio.muted = this.isMuted;
      });
    });
    return this.isMuted;
  }
}

// Create singleton instance with global persistence
const GLOBAL_KEY = '___GAME_AUDIO_MANAGER___';
if (typeof window !== 'undefined' && !window[GLOBAL_KEY]) {
  window[GLOBAL_KEY] = new AudioManager();
}
const instance = (typeof window !== 'undefined') ? window[GLOBAL_KEY] : new AudioManager();

export default instance;
