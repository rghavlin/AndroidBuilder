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
  const isFootstepLoopActive = useRef(false);

  // Preload common sounds
  useEffect(() => {
    if (soundsLoadedRef.current) return;

    const preloadSounds = async () => {
      console.log(`[AudioContext] 🎵 Preloading sounds into #${audioManager.id}...`);
      try {
        const sounds = [
          { name: 'Footsteps', url: 'sounds/Footsteps.ogg', volume: 1.0 },
          { name: 'Equip', url: 'sounds/equip.ogg', volume: 0.2 },
          { name: 'Zombie1', url: 'sounds/zombie1.ogg', volume: 0.1 },
          { name: 'Click', url: 'sounds/click.ogg', volume: 0.25 },
          { name: 'OpenDoor', url: 'sounds/opendoor.ogg', volume: 0.48 },
          { name: 'CloseDoor', url: 'sounds/closedoor.ogg', volume: 0.48 },
          { name: 'ForceOpen', url: 'sounds/forceopen.ogg', volume: 0.7 },
          { name: 'GlassBreak', url: 'sounds/glassbreak.ogg', volume: 0.6 },
          { name: 'Bang1', url: 'sounds/bang1.ogg', volume: 0.6 },
          { name: 'MeleeHit', url: 'sounds/meleehit.ogg', volume: 0.5 },
          { name: 'Miss', url: 'sounds/miss.ogg', volume: 0.4 },
          { name: 'Unlock', url: 'sounds/unlock.ogg', volume: 0.5 },
          { name: 'PistolShot', url: 'sounds/pistol.ogg', volume: 0.5 },
          { name: 'ShotgunShot', url: 'sounds/shotgun.ogg', volume: 0.6 },
          { name: 'RifleShot', url: 'sounds/rifle.ogg', volume: 0.5 },
          { name: 'ReloadShot', url: 'sounds/reload.ogg', volume: 0.5 },
          { name: 'ZombieSlash', url: 'sounds/slash1.ogg', volume: 0.2 },
          { name: 'DeathBlow', url: 'sounds/deathblow.ogg', volume: 0.6 },
          { name: 'SwitchOn', url: 'sounds/lighton.ogg', volume: 0.4 },
          { name: 'SwitchOff', url: 'sounds/lightoff.ogg', volume: 0.4 },
          { name: 'EmptyClick', url: 'sounds/click.ogg', volume: 0.25 },
          { name: 'OpenWindow', url: 'sounds/openwindow.ogg', volume: 0.6 },
          { name: 'Drink', url: 'sounds/drink.ogg', volume: 0.6 },
          { name: 'Craft', url: 'sounds/craft.ogg', volume: 0.6 },
          { name: 'MatchStrike', url: 'sounds/craft.ogg', volume: 0.6 },
          { name: 'Ignite', url: 'sounds/ignite.ogg', volume: 0.6 },
          { name: 'Heal', url: 'sounds/heal.ogg', volume: 0.6 },
          { name: 'Eat', url: 'sounds/eat.ogg', volume: 0.6 },
          { name: 'FillBottle', url: 'sounds/fillbottle.ogg', volume: 0.6 },
          { name: 'SlingShot', url: 'sounds/sling.ogg', volume: 0.6 },
          { name: 'Fail', url: 'sounds/fail.ogg', volume: 0.22 }
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
    const handleZombieAttackResult = (data) => {
      if (data.success) {
        // At least one hit - play hit sound (growl + slash)
        audioManager.playSound('Zombie1');
        audioManager.playSound('ZombieSlash');
      } else {
        // No hits - play only miss sound
        audioManager.playSound('Miss');
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
      if (data.start && !isFootstepLoopActive.current) {
        audioManager.playSound('Footsteps', { loop: true, volume: 1.0 });
        isFootstepLoopActive.current = true;
      }
    };

    const handlePlayerMoveEnded = () => {
      audioManager.stopSound('Footsteps');
      isFootstepLoopActive.current = false;
    };

    const handleZombieWait = () => {
      audioManager.playSound('Zombie1', { volume: 0.05 }); // Subtle growl for waiting
    };

    const handleZombieAlerted = () => {
      audioManager.playSound('Zombie1', { volume: 0.15 });
    };

    const handlePlayerAttack = (data) => {
      if (data.weaponType === 'ranged') {
        const soundMap = {
          'weapon.9mmPistol': 'PistolShot',
          'weapon.357Pistol': 'PistolShot',
          'weapon.shotgun': 'ShotgunShot',
          'weapon.hunting_rifle': 'RifleShot',
          'weapon.sniper_rifle': 'RifleShot',
          'weapon.sling': 'SlingShot'
        };
        audioManager.playSound(soundMap[data.weaponId] || 'PistolShot');
      } else {
        // Melee logic
        if (!data.hit) {
          audioManager.playSound('Miss');
        } else if (!data.isKillingBlow) {
          audioManager.playSound('MeleeHit');
        }
      }
    };

    const handleZombieDamage = (data) => {
      if (data.isKillingBlow) {
        audioManager.playSound('DeathBlow');
      } else {
        // We could play a zombie pain sound here if we had one, 
        // but for now CombatContext used to play DeathBlow or MeleeHit.
        // We'll stick to consistency.
      }
    };

    const handlePlayerHeal = () => {
      audioManager.playSound('Heal');
    };

    const handlePlayerDamage = () => {
      audioManager.playSound('Miss'); // Using 'Miss' as a generic impact sound for now, or could use a new one
    };

    const handleNoiseEmitted = (data) => {
      if (data.type === 'explosion') {
        audioManager.playSound('Bang1', { volume: 1.0 }); // Using Bang1 as explosion for now
      }
    };

    const handleItemEquipped = (data) => {
      console.log('[AudioContext] 🔊 ITEM_EQUIPPED event received:', data);
      audioManager.playSound('Equip');
    };

    const handleItemUnequipped = (data) => {
       console.log('[AudioContext] 🔊 ITEM_UNEQUIPPED event received:', data);
      audioManager.playSound('Equip'); // Using same sound for unequip for now
    };

    GameEvents.on(GAME_EVENT.ZOMBIE_ATTACK_RESULT, handleZombieAttackResult);
    GameEvents.on(GAME_EVENT.ZOMBIE_ALERTED, handleZombieAlerted);
    GameEvents.on(GAME_EVENT.ZOMBIE_WAIT, handleZombieWait);
    GameEvents.on(GAME_EVENT.DOOR_BANG, handleDoorBang);
    GameEvents.on(GAME_EVENT.DOOR_BROKEN, handleDoorBang);
    GameEvents.on(GAME_EVENT.WINDOW_SMASH, handleWindowSmash);
    GameEvents.on(GAME_EVENT.PLAYER_MOVE, handlePlayerMove);
    GameEvents.on(GAME_EVENT.PLAYER_MOVE_ENDED, handlePlayerMoveEnded);
    GameEvents.on(GAME_EVENT.PLAYER_ATTACK, handlePlayerAttack);
    GameEvents.on(GAME_EVENT.ZOMBIE_DAMAGE, handleZombieDamage);
    GameEvents.on(GAME_EVENT.PLAYER_HEAL, handlePlayerHeal);
    GameEvents.on(GAME_EVENT.PLAYER_DAMAGE, handlePlayerDamage);
    GameEvents.on(GAME_EVENT.NOISE_EMITTED, handleNoiseEmitted);
    GameEvents.on(GAME_EVENT.ITEM_EQUIPPED, handleItemEquipped);
    GameEvents.on(GAME_EVENT.ITEM_UNEQUIPPED, handleItemUnequipped);

    return () => {
      GameEvents.off(GAME_EVENT.ZOMBIE_ATTACK_RESULT, handleZombieAttackResult);
      GameEvents.off(GAME_EVENT.ZOMBIE_ALERTED, handleZombieAlerted);
      GameEvents.off(GAME_EVENT.ZOMBIE_WAIT, handleZombieWait);
      GameEvents.off(GAME_EVENT.DOOR_BANG, handleDoorBang);
      GameEvents.off(GAME_EVENT.DOOR_BROKEN, handleDoorBang);
      GameEvents.off(GAME_EVENT.WINDOW_SMASH, handleWindowSmash);
      GameEvents.off(GAME_EVENT.PLAYER_MOVE, handlePlayerMove);
      GameEvents.off(GAME_EVENT.PLAYER_MOVE_ENDED, handlePlayerMoveEnded);
      GameEvents.off(GAME_EVENT.PLAYER_ATTACK, handlePlayerAttack);
      GameEvents.off(GAME_EVENT.ZOMBIE_DAMAGE, handleZombieDamage);
      GameEvents.off(GAME_EVENT.PLAYER_HEAL, handlePlayerHeal);
      GameEvents.off(GAME_EVENT.PLAYER_DAMAGE, handlePlayerDamage);
      GameEvents.off(GAME_EVENT.NOISE_EMITTED, handleNoiseEmitted);
      GameEvents.off(GAME_EVENT.ITEM_EQUIPPED, handleItemEquipped);
      GameEvents.off(GAME_EVENT.ITEM_UNEQUIPPED, handleItemUnequipped);
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
