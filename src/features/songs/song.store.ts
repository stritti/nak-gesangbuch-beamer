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
