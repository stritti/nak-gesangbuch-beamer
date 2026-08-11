import { defineStore } from 'pinia';
import { Song } from '../songs/song.types';
import type { Setlist } from './setlist.types';
import { loadSetlistsFromStorage, saveSetlistsToStorage } from './setlist.storage';

interface SetlistState {
  setlists: Setlist[];
  currentSetlistId: string | null;
}

export const useSetlistStore = defineStore('setlist', {
  state: (): SetlistState => ({
    setlists: [],
    currentSetlistId: null
  }),

  getters: {
    currentSetlist: (state) => {
      return state.currentSetlistId
        ? state.setlists.find((setlist) => setlist.id === state.currentSetlistId)
        : null;
    }
  },

  actions: {
    createSetlist(name: string) {
      const newSetlist: Setlist = {
        id: crypto.randomUUID(),
        name,
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.setlists.push(newSetlist);
      this.currentSetlistId = newSetlist.id;
      this.saveSetlists();
      return newSetlist;
    },

    addSongToSetlist(setlistId: string, song: Song, verseIds?: string[]) {
      const setlist = this.setlists.find((s) => s.id === setlistId);
      if (!setlist) return;

      // Wenn keine verseIds angegeben, verwende verseOrder oder alle Verse-IDs
      const versesToUse = verseIds || song.verseOrder || song.verses.map((v) => v.id);

      setlist.items.push({
        songId: song.id,
        verseIds: versesToUse
      });
      
      setlist.updatedAt = new Date().toISOString();
      this.saveSetlists();
    },

    removeSongFromSetlist(setlistId: string, index: number) {
      const setlist = this.setlists.find((s) => s.id === setlistId);
      if (!setlist) return;

      setlist.items.splice(index, 1);
      setlist.updatedAt = new Date().toISOString();
      this.saveSetlists();
    },

    reorderSetlistItems(setlistId: string, oldIndex: number, newIndex: number) {
      const setlist = this.setlists.find((s) => s.id === setlistId);
      if (!setlist) return;

      const item = setlist.items.splice(oldIndex, 1)[0];
      setlist.items.splice(newIndex, 0, item);
      
      setlist.updatedAt = new Date().toISOString();
      this.saveSetlists();
    },

    setCurrentSetlist(id: string | null) {
      this.currentSetlistId = id;
    },

    exportSetlist(id: string): string {
      const setlist = this.setlists.find((s) => s.id === id);
      if (!setlist) return '';
      
      return JSON.stringify(setlist);
    },

    importSetlist(jsonString: string): boolean {
      try {
        const setlist = JSON.parse(jsonString) as Setlist;
        
        // Einfache Validierung
        if (!setlist.id || !setlist.name || !Array.isArray(setlist.items)) {
          throw new Error('Ungültiges Setlist-Format');
        }
        
        // Prüfen, ob die Setlist bereits existiert
        const existingIndex = this.setlists.findIndex((s) => s.id === setlist.id);
        if (existingIndex >= 0) {
          this.setlists[existingIndex] = setlist;
        } else {
          this.setlists.push(setlist);
        }
        
        this.saveSetlists();
        return true;
      } catch (error) {
        console.error('Fehler beim Importieren der Setlist:', error);
        return false;
      }
    },

    // Speichern der Setlists im LocalStorage (später IndexedDB)
    saveSetlists() {
      saveSetlistsToStorage(this.setlists);
    },

    // Laden der Setlists aus dem LocalStorage
    loadSetlists() {
      this.setlists = loadSetlistsFromStorage();
    }
  }
});
