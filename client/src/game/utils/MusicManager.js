import { configManager } from './ConfigManager';
import audioManager from './AudioManager';

/**
 * MusicManager - Handles background music, playlists, and continuous sequential playback
 */
class MusicManager {
    constructor() {
        this.id = Math.random().toString(36).substring(2, 11);
        this.playlists = {};
        this.currentPlaylist = null;
        this.currentTrackIndex = 0;
        this.isPlaying = false;

        this.currentSourceNode = null;
        this.gainNode = null;
        this.loadSessionCount = 0;

        console.log('[MusicManager] 🛠️ Initializing MusicManager singleton...');
        this.loadPlaylists();
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
        const finalVolume = masterVolume * musicVolume;
        if (this.gainNode && audioManager.audioCtx) {
            this.gainNode.gain.setValueAtTime(finalVolume, audioManager.audioCtx.currentTime);
        }
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

    stopCurrentPlayback() {
        if (this.currentSourceNode) {
            try {
                this.currentSourceNode.onended = null;
                this.currentSourceNode.stop();
                this.currentSourceNode.disconnect();
            } catch (e) {
                // Source might have already stopped
            }
            this.currentSourceNode = null;
        }
        if (this.gainNode) {
            try {
                this.gainNode.disconnect();
            } catch (e) {}
            this.gainNode = null;
        }
    }

    async playCurrentTrack() {
        // Temporarily disabled: the game will have no music
        return;

        if (!this.currentPlaylist || !this.playlists[this.currentPlaylist]) return;
        const track = this.playlists[this.currentPlaylist][this.currentTrackIndex];
        const trackUrl = typeof track === 'object' && track.url ? track.url : track;

        // Increment load session to cancel previous pending loads
        const sessionCount = ++this.loadSessionCount;
        this.stopCurrentPlayback();

        try {
            console.log(`[MusicManager] 📥 Fetching music track: ${track.fileName}`);
            const response = await fetch(trackUrl);
            const arrayBuffer = await response.arrayBuffer();
            
            // Ensure audio context is initialized and resumed
            const ctx = audioManager.audioCtx || audioManager._ensureAudioContext();
            if (ctx.state === 'suspended') {
                await ctx.resume();
            }

            const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);

            // Check if another track load was initiated in the meantime
            if (sessionCount !== this.loadSessionCount) {
                return;
            }

            const source = ctx.createBufferSource();
            source.buffer = decodedBuffer;

            const gainNode = ctx.createGain();
            this.gainNode = gainNode;
            this.updateVolume();

            source.connect(gainNode);
            gainNode.connect(ctx.destination);

            this.currentSourceNode = source;
            this.isPlaying = true;

            // When the track finishes, play next
            source.onended = () => {
                if (this.currentSourceNode === source) {
                    this.isPlaying = false;
                    this.playNextTrack();
                }
            };

            source.start(0);
            console.log(`[MusicManager] 🎵 Playing track ${this.currentTrackIndex + 1}: ${track.fileName}`);
        } catch (err) {
            console.warn(`[MusicManager] ⚠️ Error loading or playing track:`, err);
            this.isPlaying = false;
        }
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
        this.loadSessionCount++; // Invalidate pending loads
        this.stopCurrentPlayback();
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
