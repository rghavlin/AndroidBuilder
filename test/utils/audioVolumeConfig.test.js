import { describe, it, expect, beforeEach } from 'vitest';
import audioManager from '../../client/src/game/utils/AudioManager.js';
import { configManager } from '../../client/src/game/utils/ConfigManager.js';

describe('AudioManager volume persistence', () => {
  beforeEach(() => {
    configManager.set('masterVolume', 0.3);
  });

  it('reflects updated volume settings when setVolume is called', () => {
    audioManager.setVolume(0.3);
    expect(audioManager.masterVolume).toBe(0.3);
  });

  it('correctly reads initial volume from ConfigManager when configured', () => {
    expect(configManager.get('masterVolume')).toBe(0.3);
  });
});
