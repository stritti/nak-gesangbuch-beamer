<template>
  <div class="container mx-auto p-4">
    <h1 class="text-3xl font-bold mb-6">Lied-Bibliothek</h1>
    <div class="mb-6 flex flex-wrap gap-2">
      <button
        class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        @click="importSongs"
        :disabled="songStore.loading"
      >
        {{ songStore.loading ? 'Wird geladen...' : 'Lieder importieren' }}
      </button>
      <button
        class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        @click="loadFromDataPath"
        :disabled="songStore.loading"
      >
        Aus Datenpfad laden
      </button>
      <router-link to="/" class="text-blue-600 hover:underline self-center ml-2">
        Zurück zur Startseite
      </router-link>
    </div>

    <!-- Suchleiste -->
    <div class="mb-6">
      <div class="relative">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Suche nach Titel, Nummer oder Text..."
          class="w-full p-3 border rounded-lg"
          @input="performSearch"
        />
        <span v-if="searchQuery" class="absolute right-3 top-3 cursor-pointer" @click="clearSearch">
          ✕
        </span>
      </div>
    </div>

    <!-- Ergebnisse -->
    <div v-if="songStore.error" class="bg-red-100 border-l-4 border-red-500 p-4 mb-6">
      <p class="text-red-700">{{ songStore.error }}</p>
    </div>

    <div v-if="importResults.invalid.length > 0" class="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
      <h3 class="font-bold text-yellow-800">Fehler beim Import:</h3>
      <ul class="list-disc pl-5">
        <li v-for="(invalid, index) in importResults.invalid" :key="index" class="text-yellow-800">
          {{ invalid.file }}: {{ invalid.errors.join(', ') }}
        </li>
      </ul>
    </div>

    <div v-if="filteredSongs.length === 0 && !songStore.loading" class="bg-white p-6 rounded-lg shadow-md mb-6">
      <p v-if="searchQuery">Keine Lieder gefunden, die "{{ searchQuery }}" enthalten.</p>
      <p v-else>Keine Lieder in der Bibliothek. Importieren Sie Lieder oder laden Sie sie aus dem Datenpfad.</p>
    </div>

    <div v-else>
      <div class="mb-4 text-gray-600">
        {{ filteredSongs.length }} Lieder gefunden
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
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useSongStore } from '@/features/songs/song.store';
import { useSetlistStore } from '@/features/setlist/setlist.store';
import { useRouter } from 'vue-router';
import { pickFiles } from '@/utils/file';
import SongCard from '@/components/SongCard.vue';
import { songRepository } from '@/features/songs/song.repository';

const songStore = useSongStore();
const setlistStore = useSetlistStore();
const router = useRouter();

const searchQuery = ref('');
const filteredSongs = ref([] as any[]);
const importResults = ref({ valid: [], invalid: [] as { file: string; errors: string[] }[] });

// Lade Lieder beim Mounten der Komponente
onMounted(async () => {
  if (songStore.songs.length === 0) {
    await songStore.loadSongs();
  }
  filteredSongs.value = songStore.songs;
});

// Importiere Lieder aus Dateien
const importSongs = async () => {
  try {
    const files = await pickFiles('.json', true);
    if (files.length === 0) return;
    
    const results = await songStore.importSongs(files);
    importResults.value = results;
    
    // Aktualisiere die gefilterten Lieder
    filteredSongs.value = songStore.songs;
  } catch (error) {
    console.error('Fehler beim Importieren der Lieder:', error);
  }
};

// Lade Lieder aus dem konfigurierten Datenpfad
const loadFromDataPath = async () => {
  try {
    songStore.loading = true;
    const results = await songRepository.loadSongsFromDataPath();
    
    if (results.valid.length > 0) {
      // Füge die geladenen Lieder zum Store hinzu
      songStore.songs = [...songStore.songs, ...results.valid];
      filteredSongs.value = songStore.songs;
    }
    
    importResults.value = results;
  } catch (error) {
    console.error('Fehler beim Laden der Lieder aus dem Datenpfad:', error);
  } finally {
    songStore.loading = false;
  }
};

// Suche nach Liedern
const performSearch = async () => {
  if (!searchQuery.value.trim()) {
    filteredSongs.value = songStore.songs;
    return;
  }
  
  filteredSongs.value = await songRepository.searchSongs(searchQuery.value);
};

// Lösche die Suche
const clearSearch = () => {
  searchQuery.value = '';
  filteredSongs.value = songStore.songs;
};

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
  
  // Hier würden wir zur Projektor-Seite navigieren und das Lied anzeigen
  router.push({ 
    path: '/projector', 
    query: { songId: id } 
  });
};
</script>
