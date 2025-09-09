<template>
  <div class="control-page p-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Linke Spalte: Steuerung -->
      <div>
        <h1 class="text-2xl font-bold mb-4">Projektion steuern</h1>
        
        <div class="mb-4">
          <button 
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-4"
            @click="openProjectorWindow"
          >
            Projektor öffnen
          </button>
          <p v-if="projectorWindow && !projectorWindow.closed" class="text-green-600 text-sm">
            Projektor ist geöffnet
          </p>
          <p v-else class="text-red-600 text-sm">
            Projektor ist nicht geöffnet
          </p>
        </div>
        
        <ControlPanel
          :current-slide="currentSlide"
          :next-slide="nextSlide"
          :current-index="projectionStore.currentIndex"
          :total-slides="totalSlides"
          :is-fullscreen="projectionStore.isFullscreen"
          @next="handleNext"
          @prev="handlePrev"
          @blackout="handleBlackout"
          @fullscreen="handleFullscreen"
          @settings="showSettings = !showSettings"
        />
        
        <!-- Einstellungen -->
        <div v-if="showSettings" class="mt-4 bg-white rounded-lg shadow-md p-4">
          <h3 class="text-lg font-semibold mb-2">Projektionseinstellungen</h3>
          
          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">Schriftgröße</label>
            <div class="flex items-center">
              <input 
                type="range" 
                min="40" 
                max="120" 
                step="5"
                v-model.number="projectionStore.fontSize"
                class="w-full mr-2"
              />
              <span class="text-sm">{{ projectionStore.fontSize }}px</span>
            </div>
          </div>
          
          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">Zeilenhöhe</label>
            <div class="flex items-center">
              <input 
                type="range" 
                min="1" 
                max="2" 
                step="0.1"
                v-model.number="projectionStore.lineHeight"
                class="w-full mr-2"
              />
              <span class="text-sm">{{ projectionStore.lineHeight }}</span>
            </div>
          </div>
          
          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">Max. Zeilen pro Slide</label>
            <div class="flex items-center">
              <input 
                type="range" 
                min="2" 
                max="8" 
                step="1"
                v-model.number="projectionStore.maxLinesPerSlide"
                class="w-full mr-2"
              />
              <span class="text-sm">{{ projectionStore.maxLinesPerSlide }}</span>
            </div>
          </div>
          
          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">Farbschema</label>
            <select 
              v-model="projectionStore.theme"
              class="w-full p-2 border rounded"
            >
              <option value="high-contrast">Hoher Kontrast (Schwarz/Weiß)</option>
              <option value="dark">Dunkel</option>
              <option value="light">Hell</option>
            </select>
          </div>
        </div>
      </div>
      
      <!-- Rechte Spalte: Vorschau -->
      <div class="preview-container bg-gray-800 rounded-lg overflow-hidden" style="height: 400px;">
        <div 
          class="preview-screen h-full flex items-center justify-center p-4"
          :class="projectionStore.theme"
        >
          <div v-if="projectionStore.blackout" class="w-full h-full bg-black"></div>
          <div 
            v-else
            class="text-center"
            :style="{ 
              fontSize: `${projectionStore.fontSize / 2}px`, 
              lineHeight: projectionStore.lineHeight 
            }"
          >
            <p 
              v-for="(line, index) in currentSlide" 
              :key="index"
              class="mb-2"
            >
              {{ line }}
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <HotkeyLegend class="mt-4" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useProjectionStore } from '@/features/projection/projection.store';
import { useSongStore } from '@/features/songs/song.store';
import { useSetlistStore } from '@/features/setlist/setlist.store';
import ControlPanel from '@/components/ControlPanel.vue';
import HotkeyLegend from '@/components/HotkeyLegend.vue';
import { Song, Verse } from '@/features/songs/song.types';
import { splitVerseIntoSlides } from '@/utils/slideUtils';

const route = useRoute();
const projectionStore = useProjectionStore();
const songStore = useSongStore();
const setlistStore = useSetlistStore();

// Zustand
const slides = ref<string[][]>([]);
const currentSong = ref<Song | null>(null);
const projectorWindow = ref<Window | null>(null);
const showSettings = ref(false);

// Berechne die Slides basierend auf dem aktuellen Lied
const prepareSlides = (song: Song | null) => {
  if (!song) {
    slides.value = [];
    return;
  }

  currentSong.value = song;
  const maxLinesPerSlide = projectionStore.maxLinesPerSlide;
  const allSlides: string[][] = [];

  // Bestimme die Reihenfolge der Verse
  const verseOrder = song.verseOrder || song.verses.map(v => v.id);

  // Für jeden Vers in der Reihenfolge
  for (const verseId of verseOrder) {
    const verse = song.verses.find(v => v.id === verseId);
    if (!verse) continue;

    // Teile die Zeilen in Slides auf
    const verseSlides = splitVerseIntoSlides(verse.lines, maxLinesPerSlide);
    allSlides.push(...verseSlides);
  }

  slides.value = allSlides;
};

// Computed properties für die aktuelle und nächste Folie
const currentSlide = computed(() => {
  if (!slides.value.length) return [];
  const index = Math.min(projectionStore.currentIndex, slides.value.length - 1);
  return slides.value[index];
});

const nextSlide = computed(() => {
  if (!slides.value.length) return [];
  const nextIndex = projectionStore.currentIndex + 1;
  if (nextIndex >= slides.value.length) return [];
  return slides.value[nextIndex];
});

const totalSlides = computed(() => slides.value.length);

// Methoden zur Steuerung der Projektion
const openProjectorWindow = () => {
  // Schließe vorhandenes Fenster, falls es existiert
  if (projectorWindow.value && !projectorWindow.value.closed) {
    projectorWindow.value.close();
  }
  
  // Öffne ein neues Fenster mit der Projektor-Seite
  const songId = route.query.songId as string | undefined;
  const url = songId 
    ? `/projector?songId=${songId}` 
    : '/projector';
  
  projectorWindow.value = window.open(url, 'projector', 'width=1024,height=768');
  
  // Fokus auf das neue Fenster setzen
  if (projectorWindow.value) {
    projectorWindow.value.focus();
  }
};

const handleNext = () => {
  if (projectionStore.currentIndex < slides.value.length - 1) {
    projectionStore.next();
  }
};

const handlePrev = () => {
  if (projectionStore.currentIndex > 0) {
    projectionStore.prev();
  }
};

const handleBlackout = () => {
  projectionStore.toggleBlackout();
};

const handleFullscreen = () => {
  // Sende eine Nachricht an das Projektorfenster, um den Vollbildmodus zu aktivieren
  if (projectorWindow.value && !projectorWindow.value.closed) {
    projectorWindow.value.postMessage({ type: 'toggleFullscreen' }, '*');
    // Wir aktualisieren den Store-Zustand erst, wenn wir eine Bestätigung vom Projektor erhalten
  }
};

// Lade das Lied basierend auf der URL oder der Setlist
onMounted(async () => {
  // Setze den Projektor zurück
  projectionStore.reset();

  // Lade Lieder, falls noch nicht geladen
  if (songStore.songs.length === 0) {
    await songStore.loadSongs();
  }

  // Prüfe, ob ein Lied in der URL angegeben ist
  const songId = route.query.songId as string | undefined;
  if (songId) {
    const song = songStore.getSongById(songId);
    if (song) {
      prepareSlides(song);
    }
  } else {
    // Lade die aktuelle Setlist
    if (setlistStore.currentSetlist && setlistStore.currentSetlist.items.length > 0) {
      const firstItem = setlistStore.currentSetlist.items[0];
      const song = songStore.getSongById(firstItem.songId);
      if (song) {
        prepareSlides(song);
      }
    }
  }
  
  // Event-Listener für Nachrichten vom Projektor-Fenster
  const handleMessage = (event: MessageEvent) => {
    if (event.data && event.data.type === 'fullscreenChange') {
      projectionStore.setFullscreen(event.data.isFullscreen);
    }
  };
  
  window.addEventListener('message', handleMessage);
  
  // Cleanup
  onUnmounted(() => {
    window.removeEventListener('message', handleMessage);
  });
});

// Überwache den aktuellen Index und schalte auf Blackout, wenn das Ende erreicht ist
watch(() => projectionStore.currentIndex, (newIndex) => {
  if (slides.value.length > 0 && newIndex >= slides.value.length) {
    // Wenn wir über den letzten Slide hinaus sind, aktiviere Blackout
    projectionStore.blackout = true;
    // Setze den Index zurück auf den letzten Slide (für den Fall, dass Blackout deaktiviert wird)
    projectionStore.currentIndex = slides.value.length - 1;
  }
});

// Reagiere auf Änderungen der Projektor-Einstellungen
watch(() => projectionStore.maxLinesPerSlide, () => {
  prepareSlides(currentSong.value);
});
</script>

<style scoped>
.preview-screen.high-contrast {
  @apply bg-black text-white;
}
.preview-screen.light {
  @apply bg-white text-black;
}
.preview-screen.dark {
  @apply bg-gray-900 text-gray-100;
}
</style>
