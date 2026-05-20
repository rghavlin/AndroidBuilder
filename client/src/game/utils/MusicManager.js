import { configManager } from './ConfigManager';

/**
 * MusicManager - Handles background music, playlists, and continuous sequential playback
 */
class MusicManager {
    constructor() {
        this.id = Math.random().toString(36).substr(2, 9);
        this.audioElement = new Audio();
        
        // When a track finishes, automatically play the next one
        this.audioElement.addEventListener('ended', this.playNextTrack.bind(this));
        
        this.playlists = {};
        this.currentPlaylist = null;
        this.currentTrackIndex = 0;
        this.isPlaying = false;

        console.log('[MusicManager] 🛠️ Initializing MusicManager singleton...');
        this.loadPlaylists();
        this.updateVolume();
    }

    loadPlaylists() {
        // Read all music files from the src directory at build time
        // Using eager: true to get the resolved paths synchronously
        console.log('[MusicManager] 🔍 Searching for music files in /src/music/ via glob...');
        const files = import.meta.glob('/src/music/**/*.{ogg,mp3,wav,m4a}', { eager: true });
        console.log('[MusicManager] 📋 Glob search result keys:', Object.keys(files));
        
        for (const [path, moduleObj] of Object.entries(files)) {
            // path looks like '/src/music/standard/01__loopable-horror.ogg'
            const parts = path.split('/');
            const folderIndex = parts.indexOf('music');
            
            if (folderIndex !== -1 && parts.length > folderIndex + 2) {
                const folderName = parts[folderIndex + 1];
                const fileName = parts[parts.length - 1];
                
                // The URL depends on Vite's resolution, usually moduleObj.default
                const url = moduleObj.default || moduleObj;
                
                if (!this.playlists[folderName]) {
                    this.playlists[folderName] = [];
                }
                
                this.playlists[folderName].push({ url, fileName });
            }
        }

        // Sort each playlist numerically/alphabetically by filename so 01 plays before 02
        for (const folderName in this.playlists) {
            this.playlists[folderName].sort((a, b) => {
                return a.fileName.localeCompare(b.fileName, undefined, { numeric: true, sensitivity: 'base' });
            });
            console.log(`[MusicManager] Loaded playlist '${folderName}' with ${this.playlists[folderName].length} tracks.`);
        }
    }

    /**
     * Updates the internal audio volume based on ConfigManager's master and music volume settings
     */
    updateVolume() {
        const masterVolume = configManager.get('masterVolume') ?? 0.8;
        const musicVolume = configManager.get('musicVolume') ?? 0.5;
        this.audioElement.volume = masterVolume * musicVolume;
    }

    /**
     * Starts playing a specific folder/playlist from track 01
     * @param {string} folderName The name of the subfolder in public/music
     */
    playPlaylist(folderName) {
        console.log(`[MusicManager] 📥 playPlaylist requested for folder: '${folderName}'`);
        if (!this.playlists[folderName] || this.playlists[folderName].length === 0) {
            console.warn(`[MusicManager] ⚠️ Playlist '${folderName}' not found or empty. Available:`, Object.keys(this.playlists));
            return;
        }

        // If it's already playing the requested playlist, do not restart
        if (this.currentPlaylist === folderName && this.isPlaying) {
            return;
        }

        this.currentPlaylist = folderName;
        this.currentTrackIndex = 0;
        this.playCurrentTrack();
    }

    playCurrentTrack() {
        if (!this.currentPlaylist || !this.playlists[this.currentPlaylist]) return;

        const track = this.playlists[this.currentPlaylist][this.currentTrackIndex];
        
        const trackUrl = typeof track === 'object' && track.url ? track.url : track;

        this.audioElement.src = trackUrl;
        this.updateVolume();
        
        this.audioElement.play().then(() => {
            this.isPlaying = true;
            console.log(`[MusicManager] 🎵 Playing track ${this.currentTrackIndex + 1}: ${track.fileName}`);
        }).catch(err => {
            console.warn(`[MusicManager] ⚠️ Autoplay prevented or error playing track:`, err);
            this.isPlaying = false;
        });
    }

    playNextTrack() {
        if (!this.currentPlaylist || !this.playlists[this.currentPlaylist]) return;

        this.currentTrackIndex++;
        
        // Loop back to 01 if at the end of the playlist
        if (this.currentTrackIndex >= this.playlists[this.currentPlaylist].length) {
            this.currentTrackIndex = 0;
            console.log(`[MusicManager] 🔁 Playlist '${this.currentPlaylist}' finished. Looping back to start.`);
        }

        this.playCurrentTrack();
    }

    stop() {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
        this.isPlaying = false;
        this.currentPlaylist = null;
    }
}

// Singleton pattern
const GLOBAL_KEY = '___GAME_MUSIC_MANAGER___';
if (typeof window !== 'undefined' && !window[GLOBAL_KEY]) {
    window[GLOBAL_KEY] = new MusicManager();
}
const instance = (typeof window !== 'undefined') ? window[GLOBAL_KEY] : new MusicManager();

export default instance;
