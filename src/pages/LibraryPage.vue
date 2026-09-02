<template>
  <div class="container mx-auto p-4">
    <h1 class="text-3xl font-bold mb-6 dark:text-gray-100">Lied-Bibliothek</h1>
    <div class="mb-6 flex flex-wrap gap-2">
      <button
        class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        @click="importSongs"
        :disabled="songStore.loading"
      >
        {{ songStore.loading ? 'Wird geladen...' : 'Lieder importieren' }}
      </button>
      <router-link to="/" class="text-blue-600 dark:text-blue-400 hover:underline self-center ml-2">
        Zurück zur Startseite
      </router-link>
    </div>

    <div class="flex flex-col md:flex-row gap-6">
      <!-- Seitenleiste mit Buchfilter -->
      <div class="w-full md:w-64 shrink-0">
        <BookFilter v-model="selectedBookId" />
      </div>

      <!-- Hauptinhalt -->
      <div class="flex-1">
        <!-- Suchleiste -->
        <div class="mb-6">
          <div class="relative">
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Suche nach Titel, Nummer oder Text..."
              class="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
              @input="performSearch"
            />
            <span v-if="searchQuery" class="absolute right-3 top-3 cursor-pointer dark:text-gray-400" @click="clearSearch">
              ✕
            </span>
          </div>
        </div>

        <!-- Ergebnisse -->
        <div v-if="songStore.error" class="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 p-4 mb-6">
          <p class="text-red-700 dark:text-red-300">{{ songStore.error }}</p>
        </div>

        <div v-if="importResults.invalid.length > 0" class="bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 p-4 mb-6">
          <h3 class="font-bold text-yellow-800 dark:text-yellow-200">Fehler beim Import:</h3>
          <ul class="list-disc pl-5">
            <li v-for="(invalid, index) in importResults.invalid" :key="index" class="text-yellow-800 dark:text-yellow-200">
              {{ invalid.file }}: {{ invalid.errors.join(', ') }}
            </li>
          </ul>
        </div>

        <div v-if="filteredSongs.length === 0 && !songStore.loading" class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
          <p v-if="searchQuery">Keine Lieder gefunden, die "{{ searchQuery }}" enthalten.</p>
          <p v-else-if="selectedBookId">Keine Lieder im ausgewählten Buch gefunden.</p>
          <p v-else>Keine Lieder in der Bibliothek. Importieren Sie Lieder oder laden Sie sie aus dem Datenpfad.</p>
        </div>

        <div v-else>
          <div class="mb-4 text-gray-600 dark:text-gray-300">
            {{ filteredSongs.length }} Lieder gefunden
            <span v-if="selectedBookId" class="ml-2 text-blue-600 dark:text-blue-400">
              (gefiltert nach Buch: {{ getBookName(selectedBookId) }})
            </span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SongCard
              v-for="song in filteredSongs"
              :key="song.id"
              :song="song"
              @view="viewSongDetails"
              @add="addToSetlist"
              @project="projectSong"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import type { Song } from '@/features/songs/song.types';
import { useSongStore } from '@/features/songs/song.store';
import { useSetlistStore } from '@/features/setlist/setlist.store';
import { pickFiles } from '@/utils/file';
import SongCard from '@/components/SongCard.vue';
import BookFilter from '@/components/BookFilter.vue';
import { songRepository } from '@/features/songs/song.repository';
import { nakRepository } from '@/features/ingest/nak.repository';
import { getBookName } from '@/features/songs/book-names';
import { projectorWindowManager } from '@/features/projection/projector-window';

const songStore = useSongStore();
const setlistStore = useSetlistStore();

const searchQuery = ref('');
const selectedBookId = ref<string | null>(null);
type ImportResults = { valid: Song[]; invalid: { file: string; errors: string[] }[] } | { valid: Song[]; invalid: { file: string; errors: string[] }[]; nakImport: boolean; version: string };
const filteredSongs = ref<Song[]>([]);
const importResults = ref<ImportResults>({ valid: [], invalid: [] });

// Lade Lieder beim Mounten der Komponente
onMounted(async () => {
  if (songStore.songs.length === 0) {
    await songStore.loadSongs();
  }
  filteredSongs.value = sortSongsByNumber(songStore.songs);
});

// Importiere Lieder aus Dateien
const importSongs = async () => {
  try {
    const files = await pickFiles('.json', true);
    if (files.length === 0) return;
    
    const results = await songStore.importSongs(files);
    importResults.value = results;
    
    // Aktualisiere die gefilterten Lieder
    filteredSongs.value = sortSongsByNumber(songStore.songs);
  } catch (error) {
    console.error('Fehler beim Importieren der Lieder:', error);
  }
};


// Suche nach Liedern
const sortSongsByNumber = (songs: Song[]) => {
  return [...songs].sort((a, b) => {
    const numA = parseInt(a.number || '0', 10);
    const numB = parseInt(b.number || '0', 10);
    return numA - numB;
  });
};

const performSearch = async () => {
  if (!searchQuery.value.trim() && !selectedBookId.value) {
    filteredSongs.value = sortSongsByNumber(songStore.songs);
    return;
  }
  
  // Wenn ein Buch ausgewählt ist, verwende das NAK-Repository für die Suche mit Filter
  if (selectedBookId.value) {
    filteredSongs.value = sortSongsByNumber(await nakRepository.searchSongs(searchQuery.value, { buchId: selectedBookId.value }));
  } else {
    filteredSongs.value = sortSongsByNumber(await songRepository.searchSongs(searchQuery.value));
  }
};

// Lösche die Suche
const clearSearch = () => {
  searchQuery.value = '';
  performSearch();
};

watch(selectedBookId, () => {
  performSearch();
});

// Zeige Details eines Liedes an
const viewSongDetails = (id: string) => {
  songStore.selectSong(id);
  // Hier könnte eine Detail-Ansicht implementiert werden
  alert(`Details für Lied ${id} anzeigen`);
};

// Füge ein Lied zur aktuellen Setlist hinzu
const addToSetlist = (id: string) => {
  const song = songStore.getSongById(id);
  if (!song) return;
  
  if (!setlistStore.currentSetlistId) {
    // Erstelle eine neue Setlist, wenn keine aktiv ist
    const setlist = setlistStore.createSetlist('Neue Setlist');
    setlistStore.addSongToSetlist(setlist.id, song);
  } else {
    setlistStore.addSongToSetlist(setlistStore.currentSetlistId, song);
  }
  
  alert(`Lied "${song.title}" zur Setlist hinzugefügt`);
};

// Projiziere ein Lied direkt
const projectSong = (id: string) => {
  const song = songStore.getSongById(id);
  if (!song) return;
  
  projectorWindowManager.openProjectorWindow({ songId: id });
};
</script>
