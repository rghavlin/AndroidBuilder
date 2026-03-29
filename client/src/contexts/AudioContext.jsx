import React, { createContext, useContext, useEffect, useCallback, useRef } from 'react';
import audioManager from '../game/utils/AudioManager.js';
import GameEvents, { GAME_EVENT } from '../game/utils/GameEvents.js';

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
          { name: 'Zombie1', url: '/sounds/zombie1.ogg', volume: 0.1 },
          { name: 'Click', url: '/sounds/click.ogg', volume: 0.5 },
          { name: 'OpenDoor', url: '/sounds/opendoor.ogg', volume: 0.6 },
          { name: 'CloseDoor', url: '/sounds/closedoor.ogg', volume: 0.6 },
          { name: 'ForceOpen', url: '/sounds/forceopen.ogg', volume: 0.7 },
          { name: 'GlassBreak', url: '/sounds/glassbreak.ogg', volume: 0.6 },
          { name: 'Bang1', url: '/sounds/bang1.ogg', volume: 0.6 },
          { name: 'MeleeHit', url: '/sounds/meleehit.ogg', volume: 0.5 },
          { name: 'Miss', url: '/sounds/miss.ogg', volume: 0.4 },
          { name: 'Unlock', url: '/sounds/unlock.ogg', volume: 0.5 },
          { name: 'PistolShot', url: '/sounds/pistol.ogg', volume: 0.5 },
          { name: 'ShotgunShot', url: '/sounds/shotgun.ogg', volume: 0.6 },
          { name: 'RifleShot', url: '/sounds/rifle.ogg', volume: 0.5 },
          { name: 'ReloadShot', url: '/sounds/reload.ogg', volume: 0.5 },
          { name: 'ZombieSlash', url: '/sounds/slash1.ogg', volume: 0.2 },
          { name: 'DeathBlow', url: '/sounds/deathblow.ogg', volume: 0.6 },
          { name: 'SwitchOn', url: '/sounds/lighton.ogg', volume: 0.4 },
          { name: 'SwitchOff', url: '/sounds/lightoff.ogg', volume: 0.4 },
          { name: 'EmptyClick', url: '/sounds/click.ogg', volume: 0.5 },
          { name: 'MatchStrike', url: '/sounds/craft.ogg', volume: 0.6 }
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

  // Listen for global game events and play sounds automatically
  useEffect(() => {
    const handleZombieAttack = (data) => {
      // Always play swing growl
      audioManager.playSound('Zombie1');
      if (data.success) {
        // Play hit slash
        audioManager.playSound('ZombieSlash');
      }
    };

    const handleDoorBang = () => {
      audioManager.playSound('Bang1');
    };

    const handleWindowSmash = (data) => {
      console.log('[AudioContext] Window smash event received', data);
      audioManager.playSound('GlassBreak');
    };

    const handlePlayerMove = (data) => {
      if (data.start) {
        audioManager.playSound('Footsteps', { loop: true, volume: 1.0 });
      }
    };

    const handlePlayerMoveEnded = () => {
      audioManager.stopSound('Footsteps');
    };

    const handleZombieWait = () => {
      audioManager.playSound('Zombie1', { volume: 0.05 }); // Subtle growl for waiting
    };

    const handleZombieAlerted = () => {
      audioManager.playSound('Zombie1', { volume: 0.15 });
    };

    GameEvents.on(GAME_EVENT.ZOMBIE_ATTACK, handleZombieAttack);
    GameEvents.on(GAME_EVENT.ZOMBIE_ALERTED, handleZombieAlerted);
    GameEvents.on(GAME_EVENT.ZOMBIE_WAIT, handleZombieWait);
    GameEvents.on(GAME_EVENT.DOOR_BANG, handleDoorBang);
    GameEvents.on(GAME_EVENT.DOOR_BROKEN, handleDoorBang);
    GameEvents.on(GAME_EVENT.WINDOW_SMASH, handleWindowSmash);
    GameEvents.on(GAME_EVENT.PLAYER_MOVE, handlePlayerMove);
    GameEvents.on(GAME_EVENT.PLAYER_MOVE_ENDED, handlePlayerMoveEnded);

    return () => {
      GameEvents.off(GAME_EVENT.ZOMBIE_ATTACK, handleZombieAttack);
      GameEvents.off(GAME_EVENT.ZOMBIE_ALERTED, handleZombieAlerted);
      GameEvents.off(GAME_EVENT.ZOMBIE_WAIT, handleZombieWait);
      GameEvents.off(GAME_EVENT.DOOR_BANG, handleDoorBang);
      GameEvents.off(GAME_EVENT.DOOR_BROKEN, handleDoorBang);
      GameEvents.off(GAME_EVENT.WINDOW_SMASH, handleWindowSmash);
      GameEvents.off(GAME_EVENT.PLAYER_MOVE, handlePlayerMove);
      GameEvents.off(GAME_EVENT.PLAYER_MOVE_ENDED, handlePlayerMoveEnded);
    };
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
