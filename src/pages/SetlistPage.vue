<template>
  <div class="container mx-auto p-4">
    <h1 class="text-3xl font-bold mb-6">Setlists</h1>
    
    <div class="mb-6 flex flex-wrap gap-2">
      <button
        class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        @click="createNewSetlist"
      >
        Neue Setlist erstellen
      </button>
      <button
        v-if="setlistStore.setlists.length > 0"
        class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        @click="exportCurrentSetlist"
      >
        Setlist exportieren
      </button>
      <button
        class="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        @click="importSetlist"
      >
        Setlist importieren
      </button>
      <router-link to="/" class="text-blue-600 hover:underline self-center ml-2">
        Zurück zur Startseite
      </router-link>
    </div>
    
    <!-- Keine Setlists vorhanden -->
    <div v-if="setlistStore.setlists.length === 0" class="bg-white p-6 rounded-lg shadow-md mb-6">
      <p>Keine Setlists vorhanden. Erstellen Sie eine neue Setlist oder importieren Sie eine bestehende.</p>
    </div>
    
    <!-- Setlist-Auswahl -->
    <div v-else class="mb-6">
      <label class="block text-gray-700 mb-2">Aktive Setlist:</label>
      <div class="flex gap-2">
        <select 
          v-model="setlistStore.currentSetlistId"
          class="border rounded p-2 flex-grow"
        >
          <option v-for="setlist in setlistStore.setlists" :key="setlist.id" :value="setlist.id">
            {{ setlist.name }} ({{ setlist.items.length }} Lieder)
          </option>
        </select>
        <button
          v-if="currentSetlist"
          class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          @click="deleteSetlist"
        >
          Löschen
        </button>
      </div>
    </div>
    
    <!-- Aktuelle Setlist -->
    <div v-if="currentSetlist" class="bg-white p-6 rounded-lg shadow-md mb-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">{{ currentSetlist.name }}</h2>
        <button
          class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
          @click="startProjection"
        >
          Projektion starten
        </button>
      </div>
      
      <!-- Setlist-Items -->
      <div v-if="currentSetlist.items.length === 0" class="text-gray-500 mb-4">
        Diese Setlist ist leer. Fügen Sie Lieder aus der Bibliothek hinzu.
      </div>
      
      <div v-else>
        <SetlistItem
          v-for="(item, index) in currentSetlist.items"
          :key="`${item.songId}-${index}`"
          :song="getSongById(item.songId)"
          :verse-order="item.verseIds"
          @remove="removeFromSetlist(index)"
          @edit="editSetlistItem(index)"
        />
      </div>
      
      <div class="mt-4">
        <router-link
          to="/library"
          class="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Lieder hinzufügen
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSetlistStore } from '@/features/setlist/setlist.store';
import { useSongStore } from '@/features/songs/song.store';
import { saveAsFile, pickFiles, readFileAsText } from '@/utils/file';
import SetlistItem from '@/components/SetlistItem.vue';

const router = useRouter();
const setlistStore = useSetlistStore();
const songStore = useSongStore();

// Computed
const currentSetlist = computed(() => setlistStore.currentSetlist);

// Lade Setlists beim Mounten
onMounted(() => {
  // Lade Lieder, falls noch nicht geladen
  if (songStore.songs.length === 0) {
    songStore.loadSongs();
  }
  
  // Lade gespeicherte Setlists
  setlistStore.loadSetlists();
});

// Erstelle eine neue Setlist
const createNewSetlist = () => {
  const name = prompt('Name der neuen Setlist:') || 'Neue Setlist';
  setlistStore.createSetlist(name);
};

// Lösche die aktuelle Setlist
const deleteSetlist = () => {
  if (!currentSetlist.value) return;
  
  if (confirm(`Möchten Sie die Setlist "${currentSetlist.value.name}" wirklich löschen?`)) {
    const index = setlistStore.setlists.findIndex(s => s.id === currentSetlist.value?.id);
    if (index >= 0) {
      setlistStore.setlists.splice(index, 1);
      setlistStore.currentSetlistId = setlistStore.setlists.length > 0 ? setlistStore.setlists[0].id : null;
      setlistStore.saveSetlists();
    }
  }
};

// Exportiere die aktuelle Setlist
const exportCurrentSetlist = () => {
  if (!currentSetlist.value) return;
  
  const setlistJson = setlistStore.exportSetlist(currentSetlist.value.id);
  saveAsFile(setlistJson, `${currentSetlist.value.name.replace(/\s+/g, '-')}.json`);
};

// Importiere eine Setlist
const importSetlist = async () => {
  try {
    const files = await pickFiles('.json', false);
    if (files.length === 0) return;
    
    const content = await readFileAsText(files[0]);
    const success = setlistStore.importSetlist(content);
    
    if (success) {
      alert('Setlist erfolgreich importiert!');
    } else {
      alert('Fehler beim Importieren der Setlist. Ungültiges Format.');
    }
  } catch (error) {
    console.error('Fehler beim Importieren der Setlist:', error);
    alert('Fehler beim Importieren der Setlist.');
  }
};

// Entferne ein Lied aus der Setlist
const removeFromSetlist = (index: number) => {
  if (!currentSetlist.value) return;
  
  setlistStore.removeSongFromSetlist(currentSetlist.value.id, index);
};

// Bearbeite ein Setlist-Item
const editSetlistItem = (index: number) => {
  // Hier könnte ein Dialog zur Bearbeitung der Verse implementiert werden
  alert('Bearbeiten-Funktion wird implementiert...');
};

// Starte die Projektion mit der aktuellen Setlist
const startProjection = () => {
  if (!currentSetlist.value || currentSetlist.value.items.length === 0) {
    alert('Die Setlist ist leer. Fügen Sie zuerst Lieder hinzu.');
    return;
  }
  
  router.push('/projector');
};

// Hilfsfunktion zum Abrufen eines Liedes anhand seiner ID
const getSongById = (id: string) => {
  return songStore.getSongById(id);
};
</script>
