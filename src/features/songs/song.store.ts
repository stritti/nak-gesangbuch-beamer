import { defineStore } from 'pinia';
import { Song } from './song.types';
import { songRepository } from './song.repository';

interface SongState {
  songs: Song[];
  loading: boolean;
  error: string | null;
  selectedSongId: string | null;
}

export const useSongStore = defineStore('song', {
  state: (): SongState => ({
    songs: [],
    loading: false,
    error: null,
    selectedSongId: null
  }),

  getters: {
    getSongById: (state) => (id: string) => {
      return state.songs.find((song) => song.id === id) || null;
    },
    selectedSong: (state) => {
      return state.selectedSongId 
        ? state.songs.find((song) => song.id === state.selectedSongId) 
        : null;
    }
  },

  actions: {
    async loadSongs() {
      this.loading = true;
      this.error = null;
      try {
        this.songs = await songRepository.getAllSongs();
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Fehler beim Laden der Lieder';
        console.error(this.error);
      } finally {
        this.loading = false;
      }
    },

    async importSongs(files: File[]) {
      this.loading = true;
      this.error = null;
      try {
        // Prüfen, ob es sich um eine NAK-Datei handeln könnte
        const nakFile = files.find(file => 
          file.name.toLowerCase().includes('nakbuch') || 
          file.name.toLowerCase().includes('nak')
        );
        
        if (nakFile) {
          // Wenn es eine NAK-Datei ist, verwende das NAK-Repository
          try {
            // Dynamischer Import des NAK-Repositories
            const { nakRepository } = await import('@/features/ingest/nak.repository');
            const result = await nakRepository.importNakFile(nakFile);
            
            // Lade alle Songs neu
            await this.loadSongs();
            
            return {
              valid: result.songs,
              invalid: [],
              nakImport: true,
              version: result.version
            };
          } catch (error) {
            console.error('NAK-Import fehlgeschlagen, versuche Standard-Import:', error);
            // Fallback zum Standard-Import
          }
        }
        
        // Standard-Import für andere JSON-Dateien
        const result = await songRepository.importSongs(files);
        // Füge neue Lieder zum Store hinzu
        this.songs = [...this.songs, ...result.valid];
        return result;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Fehler beim Importieren der Lieder';
        console.error(this.error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    selectSong(id: string | null) {
      this.selectedSongId = id;
    }
  }
});
