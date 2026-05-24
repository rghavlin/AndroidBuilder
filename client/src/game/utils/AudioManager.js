
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
    this.sfxVolume = 1.0;
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
    
    if (!this.sounds.has(name)) {
      this.sounds.set(name, {
        path: path,
        instances: null,
        index: 0
      });
      console.log(`[AudioManager] 📝 Registered sound metadata for "${name}" (lazy pool)`);
    }

    // Phase 25: Also load into Web Audio Buffer for gapless looping if requested
    await this.loadAudioBuffer(name, path);
  }

  /**
   * Lazy load the HTML5 Audio pool for a registered sound when needed as a fallback.
   */
  _ensureHtmlAudioPool(name) {
    const pool = this.sounds.get(name);
    if (!pool) return null;

    if (!pool.instances) {
      console.debug(`[AudioManager] 🔌 Lazy-initializing HTMLAudio pool for "${name}"`);
      const poolSize = 3;
      const instances = [];
      for (let i = 0; i < poolSize; i++) {
        const audio = new Audio();
        audio.src = pool.path;
        audio.preload = 'auto';
        instances.push(audio);
      }
      pool.instances = instances;
    }
    return pool;
  }

  /**
   * Play a sound using the HTMLAudio element pool fallback.
   */
  _playHtmlAudio(name, options = {}) {
    const pool = this._ensureHtmlAudioPool(name);
    if (!pool) {
      console.warn(`[AudioManager] ❌ #${this.id} Sound "${name}" not found in pool.`);
      return;
    }

    const { instances, index } = pool;
    const baseVolume = this.soundDefaults.get(name) || 1.0;
    const { loop = false, volume = baseVolume, playbackRate = 1.0 } = options;

    const finalVolume = volume * this.masterVolume * this.sfxVolume;
    console.log(`[AudioManager] 🔊 Playing "${name}" via HTMLAudio | Volume: ${finalVolume.toFixed(2)} | Pool Index: ${index}`);

    try {
      const audio = instances[index];
      
      // Update index for next time
      pool.index = (index + 1) % instances.length;

      // Ensure the node is in a playable state
      if (audio.readyState < 2) {
        console.debug(`[AudioManager] ⏳ Node for "${name}" not ready (readyState: ${audio.readyState}) - forcing load`);
        audio.load();
      }

      audio.volume = finalVolume;
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

  playSound(name, options = {}) {
    if (this.isMuted) return;

    // Check if Web Audio buffer exists and use it
    if (this.audioBuffers.has(name)) {
      const { loop = false } = options;
      if (loop) {
        this.startLoop(name, options);
      } else {
        this.playOneShot(name, options);
      }
      return;
    }

    this._playHtmlAudio(name, options);
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
    gainNode.gain.value = baseVolume * this.masterVolume * this.sfxVolume;

    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    source.start(0);
    this.activeLoops.set(name, { source, gainNode, baseVolume });
    console.log(`[AudioManager] 🔄 Started gapless loop: "${name}"`);
  }

  /**
   * Play a one-shot sound using Web Audio API (more reliable for background/gesture-less events)
   */
  playOneShot(name, options = {}) {
    if (this.isMuted) return;
    const ctx = this._ensureAudioContext();

    const buffer = this.audioBuffers.get(name);
    if (!buffer) {
      // Fallback to HTMLAudio if buffer not loaded
      return this.playSound(name, options);
    }

    const baseVolume = options.volume !== undefined ? options.volume : (this.soundDefaults.get(name) || 1.0);
    const finalVolume = baseVolume * this.masterVolume * this.sfxVolume;
    const playbackRate = options.playbackRate || 1.0;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = playbackRate;

    const gainNode = ctx.createGain();
    gainNode.gain.value = finalVolume;

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start(0);
    console.log(`[AudioManager] 🎵 One-shot played via WebAudio: "${name}"`);
  }

  /**
   * Stop a specific loop or sound
   */
  stopSound(name) {
    // 1. Stop HTMLAudio nodes
    const pool = this.sounds.get(name);
    if (pool && pool.instances) {
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
      if (pool.instances) {
        pool.instances.forEach(audio => {
          audio.volume = volume * this.masterVolume * this.sfxVolume;
        });
      }
    }

    // 2. Update Web Audio loop
    const loop = this.activeLoops.get(name);
    if (loop) {
      loop.baseVolume = volume;
      if (this.audioCtx) {
        // Use exponential ramp for smoother volume transitions
        loop.gainNode.gain.setTargetAtTime(volume * this.masterVolume * this.sfxVolume, this.audioCtx.currentTime, 0.1);
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
    const htmlPlaying = pool && pool.instances && pool.instances.some(audio => !audio.paused);
    
    // Check Web Audio
    const webPlaying = this.activeLoops.has(name);

    return !!(htmlPlaying || webPlaying);
  }

  /**
   * Set master volume (0.0 to 1.0)
   * @param {number} volume 
   */
  setVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    
    // 1. Update currently playing HTMLAudio nodes
    this.sounds.forEach((pool, name) => {
      if (pool.instances) {
        pool.instances.forEach(audio => {
          if (!audio.paused) {
            const base = this.soundDefaults.get(name) || 1.0;
            audio.volume = base * this.masterVolume * this.sfxVolume;
          }
        });
      }
    });

    // 2. Update Web Audio loops
    this.activeLoops.forEach((loop) => {
      if (this.audioCtx) {
        loop.gainNode.gain.setTargetAtTime(loop.baseVolume * this.masterVolume * this.sfxVolume, this.audioCtx.currentTime, 0.1);
      }
    });
  }

  /**
   * Set SFX volume (0.0 to 1.0) independent of master volume
   * @param {number} volume 
   */
  setSfxVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    
    // 1. Update currently playing HTMLAudio nodes
    this.sounds.forEach((pool, name) => {
      if (pool.instances) {
        pool.instances.forEach(audio => {
          if (!audio.paused) {
            const base = this.soundDefaults.get(name) || 1.0;
            audio.volume = base * this.masterVolume * this.sfxVolume;
          }
        });
      }
    });

    // 2. Update Web Audio loops
    this.activeLoops.forEach((loop) => {
      if (this.audioCtx) {
        loop.gainNode.gain.setTargetAtTime(loop.baseVolume * this.masterVolume * this.sfxVolume, this.audioCtx.currentTime, 0.1);
      }
    });
  }

  /**
   * Toggle mute
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    this.sounds.forEach(pool => {
      if (pool.instances) {
        pool.instances.forEach(audio => {
          audio.muted = this.isMuted;
        });
      }
    });
    return this.isMuted;
  }

  /**
   * Stop all currently playing sounds and loops
   */
  stopAllSounds() {
    console.log(`[AudioManager] ⏹️ Stopping all sounds...`);
    
    // 1. Stop all HTMLAudio instances
    this.sounds.forEach(pool => {
      if (pool.instances) {
        pool.instances.forEach(audio => {
          audio.pause();
          audio.currentTime = 0;
          audio.loop = false;
        });
      }
    });

    // 2. Stop all Web Audio loops
    this.activeLoops.forEach((loop, name) => {
      try {
        loop.source.stop();
        loop.source.disconnect();
        loop.gainNode.disconnect();
      } catch (e) {
        // Source might have already stopped
      }
      console.log(`[AudioManager] ⏹️ Stopped loop: "${name}"`);
    });
    this.activeLoops.clear();
  }
}

// Create singleton instance with global persistence
const GLOBAL_KEY = '___GAME_AUDIO_MANAGER___';
if (typeof window !== 'undefined' && !window[GLOBAL_KEY]) {
  window[GLOBAL_KEY] = new AudioManager();
}
const instance = (typeof window !== 'undefined') ? window[GLOBAL_KEY] : new AudioManager();

export default instance;
