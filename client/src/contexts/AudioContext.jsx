import React, { createContext, useContext, useEffect, useCallback, useRef } from 'react';
import audioManager from '../game/utils/AudioManager.js';

const AudioContext = createContext();

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

/**
 * AudioProvider - React wrapper for AudioManager
 */
export const AudioProvider = ({ children }) => {
  const soundsLoadedRef = useRef(false);

  // Preload common sounds
  useEffect(() => {
    if (soundsLoadedRef.current) return;

    const preloadSounds = async () => {
      console.log(`[AudioContext] 🎵 Preloading sounds into #${audioManager.id}...`);
      try {
        await Promise.all([
          audioManager.loadSound('Footsteps', '/sounds/Footsteps.ogg'),
          audioManager.loadSound('Equip', '/sounds/equip.ogg'),
        ]);
        console.log('[AudioContext] Initial sounds preloaded successfully');
        soundsLoadedRef.current = true;
      } catch (err) {
        console.warn('[AudioContext] Error preloading sounds:', err);
      }
    };

    preloadSounds();
  }, []);

  /**
   * Play a sound
   */
  const playSound = useCallback((name, options) => {
    audioManager.playSound(name, options);
  }, []);

  /**
   * Stop a sound
   */
  const stopSound = useCallback((name) => {
    audioManager.stopSound(name);
  }, []);

  /**
   * Set volume
   */
  const setVolume = useCallback((volume) => {
    audioManager.setVolume(volume);
  }, []);

  return (
    <AudioContext.Provider value={{ playSound, stopSound, setVolume }}>
      {children}
    </AudioContext.Provider>
  );
};
