
/**
 * ConfigManager - Handles persistence of global system settings (non-save-specific)
 * Uses localStorage for universal preferences like Graphics, Audio, and UI.
 */
class ConfigManager {
    constructor() {
        this.storageKey = 'android_builder_config';
        this.config = this.load();
    }

    /**
     * Load settings from localStorage
     */
    load() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            return saved ? JSON.parse(saved) : this.getDefaults();
        } catch (e) {
            console.error('[ConfigManager] Failed to load config:', e);
            return this.getDefaults();
        }
    }

    /**
     * Get default settings
     */
    getDefaults() {
        return {
            tileSet: 'spritesheet',
            masterVolume: 0.8,
            musicVolume: 0.5,
            sfxVolume: 1.0,
            showTutorials: true,
            highQuality: true
        };
    }

    /**
     * Get a specific setting
     */
    get(key) {
        return this.config[key] !== undefined ? this.config[key] : this.getDefaults()[key];
    }

    /**
     * Set a setting and save it
     */
    set(key, value) {
        this.config[key] = value;
        this.save();
    }

    /**
     * Persist current config to localStorage
     */
    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.config));
        } catch (e) {
            console.error('[ConfigManager] Failed to save config:', e);
        }
    }
}

export const configManager = new ConfigManager();
