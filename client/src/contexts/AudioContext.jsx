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
        const sounds = [
          { name: 'Footsteps', url: '/sounds/Footsteps.ogg', volume: 1.0 },
          { name: 'Equip', url: '/sounds/equip.ogg', volume: 0.2 },
          { name: 'Zombie1', url: '/sounds/zombie1.ogg', volume: 0.5 },
          { name: 'Click', url: '/sounds/click.ogg', volume: 0.15 },
          { name: 'OpenDoor', url: '/sounds/opendoor.ogg', volume: 0.6 },
          { name: 'CloseDoor', url: '/sounds/closedoor.ogg', volume: 0.6 },
          { name: 'ForceOpen', url: '/sounds/forceopen.ogg', volume: 0.7 },
          { name: 'GlassBreak', url: '/sounds/glassbreak.ogg', volume: 0.6 }
        ];
        await Promise.all(
          sounds.map(sound => audioManager.loadSound(sound.name, sound.url, sound.volume))
        );
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
