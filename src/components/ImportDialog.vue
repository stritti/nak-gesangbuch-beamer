<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSongStore } from '@/features/songs/song.store';
import { pickFiles } from '@/utils/file';

const songStore = useSongStore();
const isImporting = ref(false);
const importProgress = ref(0);
const importErrors = ref<Array<{ path: string; message: string }>>([]);

const importResult = ref<{
  success: boolean;
  songCount: number;
  bookCount: number;
  version?: string;
  error?: string;
} | null>(null);

async function handleImport() {
  try {
    // Datei-Picker öffnen
    const files = await pickFiles('.json', false);
    if (files.length === 0) return;
    
    importResult.value = null;
    isImporting.value = true;
    
    // Fortschritt simulieren
    const progressInterval = setInterval(() => {
      if (importProgress.value < 90) {
        importProgress.value += 10;
      }
    }, 300);
    
    try {
      // Datei importieren
      const result = await songStore.importSongs(files);
      
      clearInterval(progressInterval);
      importProgress.value = 100;
      
      // Erfolg anzeigen
      importResult.value = {
        success: true,
        songCount: result.valid.length,
        bookCount: 0, // Wird später aktualisiert, wenn wir die Bücher haben
        version: result.version || 'Unbekannt'
      };
    } finally {
      clearInterval(progressInterval);
      isImporting.value = false;
    }
  } catch (error) {
    // Fehler anzeigen
    importResult.value = {
      success: false,
      songCount: 0,
      bookCount: 0,
      error: error instanceof Error ? error.message : String(error)
    };
    isImporting.value = false;
  }
}
</script>

<template>
  <div class="import-dialog">
    <h2 class="text-xl font-bold mb-4">NAK-Gesangbuch importieren</h2>
    
    <p class="mb-4">
      Importiere die Datei <code>nakbuch_v5.4.0.json</code>, um die Lieder zu laden.
      Die Daten werden lokal in deinem Browser gespeichert und nicht an einen Server gesendet.
    </p>
    
    <button 
      @click="handleImport" 
      class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
      :disabled="isImporting"
    >
      <span v-if="isImporting">Importiere...</span>
      <span v-else>Datei auswählen</span>
    </button>
    
    <!-- Fortschrittsanzeige -->
    <div v-if="isImporting" class="mt-4">
      <div class="w-full bg-gray-200 rounded-full h-2.5">
        <div class="bg-blue-600 h-2.5 rounded-full" :style="{ width: `${importProgress}%` }"></div>
      </div>
      <p class="text-sm text-gray-600 mt-1">{{ importProgress }}% abgeschlossen</p>
    </div>
    
    <!-- Fehler anzeigen -->
    <div v-if="importErrors.length > 0" class="mt-4 p-4 bg-red-100 text-red-800 rounded">
      <h3 class="font-bold">Fehler bei der Validierung:</h3>
      <ul class="list-disc pl-5 mt-2">
        <li v-for="(error, index) in importErrors" :key="index">
          {{ error.path }}: {{ error.message }}
        </li>
      </ul>
    </div>
    
    <!-- Ergebnis anzeigen -->
    <div v-if="importResult" class="mt-4 p-4 rounded" :class="importResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
      <template v-if="importResult.success">
        <h3 class="font-bold">Import erfolgreich!</h3>
        <p>Version: {{ importResult.version }}</p>
        <p>{{ importResult.songCount }} Lieder importiert</p>
        <p v-if="importResult.bookCount > 0">{{ importResult.bookCount }} Bücher importiert</p>
      </template>
      <template v-else>
        <h3 class="font-bold">Import fehlgeschlagen</h3>
        <p>{{ importResult.error }}</p>
      </template>
    </div>
  </div>
</template>
