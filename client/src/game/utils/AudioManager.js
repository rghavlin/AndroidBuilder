
/**
 * AudioManager - Centralized utility for managing game audio
 */

// T6: playback logs fire ~10x per sound effect (R46#7). Gate them behind this
// flag — flip to true locally when debugging audio.
const DEBUG = false;
const debugLog = (...args) => { if (DEBUG) console.log(...args); };

class AudioManager {
  constructor() {
    this.id = Math.random().toString(36).substring(2, 11);
    debugLog(`[AudioManager] New instance created: ${this.id}`);
    this.sounds = new Map(); // Store { instances: Audio[], index: number }
    this.soundDefaults = new Map(); // Store default volume per sound
    this.masterVolume = 1.0;
    this.sfxVolume = 1.0;
    this.isMuted = false;

    // Phase 25: Web Audio API for Gapless Looping
    this.audioCtx = null;
    this.audioBuffers = new Map(); // Store decoded AudioBuffer objects
    this.activeLoops = new Map();  // Store { source, gainNode, baseVolume }

    // Automatically resume AudioContext on user interaction
    if (typeof window !== 'undefined') {
      const resumeCtx = () => {
        const ctx = this._ensureAudioContext();
        if (ctx && ctx.state === 'running') {
          cleanupListeners();
        }
      };

      const cleanupListeners = () => {
        window.removeEventListener('click', resumeCtx);
        window.removeEventListener('mousedown', resumeCtx);
        window.removeEventListener('keydown', resumeCtx);
        window.removeEventListener('touchstart', resumeCtx);
      };

      window.addEventListener('click', resumeCtx);
      window.addEventListener('mousedown', resumeCtx);
      window.addEventListener('keydown', resumeCtx);
      window.addEventListener('touchstart', resumeCtx);
    }
  }

  /**
   * Initialize AudioContext on first user interaction if not already done
   */
  _ensureAudioContext() {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(err => {
          console.warn('[AudioManager] Failed to resume AudioContext:', err);
        });
      }
      return this.audioCtx;
    } catch (err) {
      console.warn('[AudioManager] Failed to create or resume AudioContext:', err);
      this.audioCtx = null;
      return null;
    }
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
      debugLog(`[AudioManager] 📝 Registered sound metadata for "${name}" (lazy pool)`);
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
      debugLog(`[AudioManager] 🔌 Lazy-initializing HTMLAudio pool for "${name}"`);
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
    debugLog(`[AudioManager] 🔊 Playing "${name}" via HTMLAudio | Volume: ${finalVolume.toFixed(2)} | Pool Index: ${index}`);

    try {
      const audio = instances[index];
      
      // Update index for next time
      pool.index = (index + 1) % instances.length;

      // Ensure the node is in a playable state
      if (audio.readyState < 2) {
        debugLog(`[AudioManager] ⏳ Node for "${name}" not ready (readyState: ${audio.readyState}) - forcing load`);
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

    try {
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
    } catch (err) {
      console.warn(`[AudioManager] playSound failed for "${name}", falling back:`, err);
      try {
        this._playHtmlAudio(name, options);
      } catch (innerErr) {
        console.error('[AudioManager] HTMLAudio fallback also failed:', innerErr);
      }
    }
  }

  /**
   * Load a sound into a Web Audio Buffer for true gapless looping
   */
  async loadAudioBuffer(name, path) {
    if (this.audioBuffers.has(name)) return;
    
    try {
      debugLog(`[AudioManager] 🎵 Loading Web Audio Buffer for "${name}" from: ${path}`);
      const response = await fetch(path);
      const arrayBuffer = await response.arrayBuffer();
      const ctx = this._ensureAudioContext();
      if (!ctx) {
        throw new Error('AudioContext not available');
      }
      const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
      this.audioBuffers.set(name, decodedBuffer);
      debugLog(`[AudioManager] ✅ Web Audio Buffer ready for "${name}"`);
    } catch (err) {
      console.warn(`[AudioManager] ⚠️ Failed to load Web Audio Buffer for "${name}" (gapless loops will fallback):`, err);
    }
  }

  /**
   * Start a true gapless loop using Web Audio API
   */
  startLoop(name, options = {}) {
    if (this.isMuted) return;
    
    try {
      const ctx = this._ensureAudioContext();

      const buffer = this.audioBuffers.get(name);
      if (!buffer || !ctx || ctx.state === 'suspended') {
        console.warn(`[AudioManager] ⚠️ Gapless buffer for "${name}" or AudioContext not found/suspended, falling back to HTMLAudio.`);
        this._playHtmlAudio(name, { ...options, loop: true });
        return;
      }

      if (this.activeLoops.has(name)) return;

      const baseVolume = options.volume !== undefined ? options.volume : (this.soundDefaults.get(name) || 1.0);
      
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const gainNode = ctx.createGain();
      gainNode.gain.value = baseVolume * this.masterVolume * this.sfxVolume;

      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      source.start(0);
      this.activeLoops.set(name, { source, gainNode, baseVolume });
      debugLog(`[AudioManager] 🔄 Started gapless loop: "${name}"`);
    } catch (err) {
      console.warn(`[AudioManager] startLoop failed for "${name}", falling back to HTML5 Audio:`, err);
      try {
        this._playHtmlAudio(name, { ...options, loop: true });
      } catch (innerErr) {
        console.error('[AudioManager] HTMLAudio loop fallback failed:', innerErr);
      }
    }
  }

  /**
   * Play a one-shot sound using Web Audio API (more reliable for background/gesture-less events)
   */
  playOneShot(name, options = {}) {
    if (this.isMuted) return;
    
    try {
      const ctx = this._ensureAudioContext();

      const buffer = this.audioBuffers.get(name);
      if (!buffer || !ctx || ctx.state === 'suspended') {
        // Fallback to HTMLAudio if buffer not loaded, AudioContext blocked, or suspended
        this._playHtmlAudio(name, options);
        return;
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
      debugLog(`[AudioManager] 🎵 One-shot played via WebAudio: "${name}"`);
    } catch (err) {
      console.warn(`[AudioManager] playOneShot failed for "${name}", falling back to HTML5 Audio:`, err);
      try {
        this._playHtmlAudio(name, options);
      } catch (innerErr) {
        console.error('[AudioManager] HTMLAudio fallback failed:', innerErr);
      }
    }
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
      debugLog(`[AudioManager] ⏹️ Stopped gapless loop: "${name}"`);
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
    debugLog(`[AudioManager] ⏹️ Stopping all sounds...`);
    
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
      debugLog(`[AudioManager] ⏹️ Stopped loop: "${name}"`);
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
