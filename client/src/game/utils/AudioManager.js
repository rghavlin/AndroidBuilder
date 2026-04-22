
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

    // Phase 25: Web Audio API for Gapless Looping
    this.audioCtx = null;
    this.audioBuffers = new Map(); // Store decoded AudioBuffer objects
    this.activeLoops = new Map();  // Store { source, gainNode, baseVolume }
  }

  /**
   * Initialize AudioContext on first user interaction if not already done
   */
  _ensureAudioContext() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
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

      // Phase 25: Also load into Web Audio Buffer for gapless looping if requested
      this.loadAudioBuffer(name, path);

      return loadedInstances[0];
    } catch (err) {
      console.error(`[AudioManager] Critical failure loading sound pool for "${name}":`, err);
      throw err;
    }
  }

  /**
   * Load a sound into a Web Audio Buffer for true gapless looping
   */
  async loadAudioBuffer(name, path) {
    if (this.audioBuffers.has(name)) return;
    
    try {
      console.debug(`[AudioManager] 🎵 Loading Web Audio Buffer for "${name}" from: ${path}`);
      const response = await fetch(path);
      const arrayBuffer = await response.arrayBuffer();
      const ctx = this._ensureAudioContext();
      const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
      this.audioBuffers.set(name, decodedBuffer);
      console.log(`[AudioManager] ✅ Web Audio Buffer ready for "${name}"`);
    } catch (err) {
      console.warn(`[AudioManager] ⚠️ Failed to load Web Audio Buffer for "${name}" (gapless loops will fallback):`, err);
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

  /**
   * Start a true gapless loop using Web Audio API
   */
  startLoop(name, options = {}) {
    if (this.isMuted) return;
    this._ensureAudioContext();

    if (this.activeLoops.has(name)) return;

    const buffer = this.audioBuffers.get(name);
    if (!buffer) {
      console.warn(`[AudioManager] ⚠️ Gapless buffer for "${name}" not found, falling back to HTMLAudio.`);
      this.playSound(name, { ...options, loop: true });
      return;
    }

    const baseVolume = options.volume !== undefined ? options.volume : (this.soundDefaults.get(name) || 1.0);
    const ctx = this.audioCtx;
    
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gainNode = ctx.createGain();
    gainNode.gain.value = baseVolume * this.masterVolume;

    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    source.start(0);
    this.activeLoops.set(name, { source, gainNode, baseVolume });
    console.log(`[AudioManager] 🔄 Started gapless loop: "${name}"`);
  }

  /**
   * Stop a specific loop or sound
   */
  stopSound(name) {
    // 1. Stop HTMLAudio nodes
    const pool = this.sounds.get(name);
    if (pool) {
      pool.instances.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
        audio.loop = false;
      });
    }

    // 2. Stop Web Audio loops
    const loop = this.activeLoops.get(name);
    if (loop) {
      try {
        loop.source.stop();
        loop.source.disconnect();
        loop.gainNode.disconnect();
      } catch (e) {
        // Source might have already stopped
      }
      this.activeLoops.delete(name);
      console.log(`[AudioManager] ⏹️ Stopped gapless loop: "${name}"`);
    }
  }

  /**
   * Dynamically update the volume of all instances of a sound
   * @param {string} name 
   * @param {number} volume (0.0 to 1.0)
   */
  setSoundVolume(name, volume) {
    // 1. Update HTMLAudio pool
    const pool = this.sounds.get(name);
    if (pool) {
      this.soundDefaults.set(name, Math.max(0, Math.min(1, volume)));
      pool.instances.forEach(audio => {
        audio.volume = volume * this.masterVolume;
      });
    }

    // 2. Update Web Audio loop
    const loop = this.activeLoops.get(name);
    if (loop) {
      loop.baseVolume = volume;
      if (this.audioCtx) {
        // Use exponential ramp for smoother volume transitions
        loop.gainNode.gain.setTargetAtTime(volume * this.masterVolume, this.audioCtx.currentTime, 0.1);
      }
    }
  }

  /**
   * Check if any instance of a sound is currently playing (including loops)
   * @param {string} name 
   * @returns {boolean}
   */
  isSoundPlaying(name) {
    // Check HTMLAudio
    const pool = this.sounds.get(name);
    const htmlPlaying = pool && pool.instances.some(audio => !audio.paused);
    
    // Check Web Audio
    const webPlaying = this.activeLoops.has(name);

    return htmlPlaying || webPlaying;
  }

  /**
   * Set master volume (0.0 to 1.0)
   * @param {number} volume 
   */
  setVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    
    // 1. Update currently playing HTMLAudio nodes
    this.sounds.forEach((pool, name) => {
      pool.instances.forEach(audio => {
        if (!audio.paused) {
          const base = this.soundDefaults.get(name) || 1.0;
          audio.volume = base * this.masterVolume;
        }
      });
    });

    // 2. Update Web Audio loops
    this.activeLoops.forEach((loop) => {
      if (this.audioCtx) {
        loop.gainNode.gain.setTargetAtTime(loop.baseVolume * this.masterVolume, this.audioCtx.currentTime, 0.1);
      }
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
