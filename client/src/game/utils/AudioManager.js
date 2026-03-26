
/**
 * AudioManager - Centralized utility for managing game audio
 */
class AudioManager {
  constructor() {
    this.id = Math.random().toString(36).substr(2, 9);
    console.debug(`[AudioManager] New instance created: ${this.id}`);
    this.sounds = new Map();
    this.masterVolume = 0.5;
    this.isMuted = false;
  }

  /**
   * Load a sound and cache it
   * @param {string} name - Internal name for the sound
   * @param {string} path - URL path to the audio file
   * @returns {Promise<HTMLAudioElement>}
   */
  async loadSound(name, path) {
    if (this.sounds.has(name)) return this.sounds.get(name);

    return new Promise((resolve, reject) => {
      console.log(`[AudioManager] ⏳ Loading sound "${name}" from: ${path}`);
      const audio = new Audio();
      
      const timeout = setTimeout(() => {
        cleanup();
        console.warn(`[AudioManager] ⏰ Loading timeout for "${name}" (${path}) - attempting playback anyway`);
        this.sounds.set(name, audio);
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
        console.log(`[AudioManager] ✅ Loaded sound: ${name}`);
        this.sounds.set(name, audio);
        resolve(audio);
      };

      audio.oncanplaythrough = onSuccess;
      audio.onloadeddata = onSuccess;
      audio.onerror = (e) => {
        cleanup();
        console.error(`[AudioManager] ❌ Failed to load sound: ${path}`, e);
        reject(new Error(`Failed to load sound: ${path}`));
      };

      audio.src = path;
      audio.preload = 'auto';
      audio.load();
    });
  }

  /**
   * Play a sound by name
   * @param {string} name - The name of the sound to play
   * @param {Object} options - Playback options { loop, volume, playbackRate, forceFullStart }
   */
  playSound(name, options = {}) {
    if (this.isMuted) return;

    const audio = this.sounds.get(name);
    if (!audio) {
      const available = Array.from(this.sounds.keys());
      console.warn(`[AudioManager] ❌ #${this.id} Sound "${name}" not found. Available:`, available);
      return;
    }

    const { loop = false, volume = 1.0, playbackRate = 1.0 } = options;

    console.debug(`[AudioManager] Playing sound: ${name} (loop: ${loop}, volume: ${volume})`);

    try {
      if (loop) {
        audio.loop = true;
        audio.volume = volume * this.masterVolume;
        audio.playbackRate = playbackRate;
        audio.play().catch(e => console.error(`[AudioManager] Loop play error:`, e));
      } else {
        // For short sounds/SFX, we often want to allow overlapping or immediate restarts.
        // We'll use a pool-like approach by cloning if the original is still busy.
        let playTarget = audio;

        if (!audio.paused && audio.currentTime > 0) {
          playTarget = audio.cloneNode();
        }

        playTarget.volume = volume * this.masterVolume;
        playTarget.playbackRate = playbackRate;
        playTarget.loop = false;
        playTarget.currentTime = 0; // Always start from beginning

        playTarget.play().catch(e => {
          if (e.name === 'NotAllowedError') {
            console.warn('[AudioManager] Playback blocked by browser policy.');
          } else {
            console.error(`[AudioManager] Play error for "${name}":`, e);
          }
        });
      }
    } catch (err) {
      console.error(`[AudioManager] Unexpected error for "${name}":`, err);
    }
  }

  /**
   * Stop a specific sound
   * @param {string} name - The name of the sound to stop
   */
  stopSound(name) {
    const audio = this.sounds.get(name);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  /**
   * Set master volume (0.0 to 1.0)
   * @param {number} volume 
   */
  setVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    // Update currently playing sounds
    this.sounds.forEach(audio => {
      if (!audio.paused) {
        audio.volume = this.masterVolume;
      }
    });
  }

  /**
   * Toggle mute
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    this.sounds.forEach(audio => {
      audio.muted = this.isMuted;
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
