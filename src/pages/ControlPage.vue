<template>
  <div class="container mx-auto p-4">
    <h1 class="text-3xl font-bold mb-6">Steuerung</h1>
    <div class="mb-6">
      <router-link to="/" class="text-blue-600 hover:underline">Zurück zur Startseite</router-link>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Steuerungspanel -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <ControlPanel
          :current-slide="currentSlide"
          :next-slide="nextSlide"
          :current-index="projectionStore.currentIndex"
          :total-slides="totalSlides"
          :is-fullscreen="projectionStore.isFullscreen"
          @next="nextSlide"
          @prev="prevSlide"
          @blackout="toggleBlackout"
          @fullscreen="toggleFullscreen"
          @settings="showSettings = !showSettings"
        />
      </div>
      
      <!-- Einstellungen -->
      <div v-if="showSettings" class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold mb-4">Einstellungen</h2>
        
        <div class="mb-4">
          <label class="block text-gray-700 mb-2">Schriftgröße: {{ projectionStore.fontSize }}px</label>
          <input 
            type="range" 
            v-model.number="projectionStore.fontSize" 
            min="40" 
            max="120" 
            step="4"
            class="w-full"
          />
        </div>
        
        <div class="mb-4">
          <label class="block text-gray-700 mb-2">Zeilenhöhe: {{ projectionStore.lineHeight }}</label>
          <input 
            type="range" 
            v-model.number="projectionStore.lineHeight" 
            min="1" 
            max="2" 
            step="0.1"
            class="w-full"
          />
        </div>
        
        <div class="mb-4">
          <label class="block text-gray-700 mb-2">Max. Zeilen pro Slide: {{ projectionStore.maxLinesPerSlide }}</label>
          <input 
            type="range" 
            v-model.number="projectionStore.maxLinesPerSlide" 
            min="2" 
            max="8" 
            step="1"
            class="w-full"
          />
        </div>
        
        <div class="mb-4">
          <label class="block text-gray-700 mb-2">Theme:</label>
          <div class="flex space-x-2">
            <button 
              class="px-3 py-1 rounded border"
              :class="{ 'bg-blue-600 text-white': projectionStore.theme === 'light' }"
              @click="projectionStore.setTheme('light')"
            >
              Hell
            </button>
            <button 
              class="px-3 py-1 rounded border"
              :class="{ 'bg-blue-600 text-white': projectionStore.theme === 'dark' }"
              @click="projectionStore.setTheme('dark')"
            >
              Dunkel
            </button>
            <button 
              class="px-3 py-1 rounded border"
              :class="{ 'bg-blue-600 text-white': projectionStore.theme === 'high-contrast' }"
              @click="projectionStore.setTheme('high-contrast')"
            >
              Hoher Kontrast
            </button>
          </div>
        </div>
      </div>
      
      <!-- QR-Code für Remote-Steuerung (Platzhalter) -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold mb-4">Remote-Steuerung</h2>
        <p class="mb-4">Öffnen Sie die Projektion in einem separaten Fenster oder auf einem anderen Gerät:</p>
        <div class="flex justify-center">
          <a 
            :href="projectorUrl" 
            target="_blank" 
            class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Projektion öffnen
          </a>
        </div>
      </div>
      
      <!-- Hotkey-Legende -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <HotkeyLegend />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useProjectionStore } from '@/features/projection/projection.store';
import { useSongStore } from '@/features/songs/song.store';
import { useSetlistStore } from '@/features/setlist/setlist.store';
import ControlPanel from '@/components/ControlPanel.vue';
import HotkeyLegend from '@/components/HotkeyLegend.vue';

const projectionStore = useProjectionStore();
const songStore = useSongStore();
const setlistStore = useSetlistStore();

// Zustand
const showSettings = ref(false);
const slides = ref<string[][]>([]);
const channel = ref<BroadcastChannel | null>(null);

// Computed
const currentSlide = computed(() => {
  if (slides.value.length === 0) return [];
  const index = Math.min(projectionStore.currentIndex, slides.value.length - 1);
  return slides.value[index];
});

const nextSlide = computed(() => {
  if (slides.value.length <= projectionStore.currentIndex + 1) return null;
  return slides.value[projectionStore.currentIndex + 1];
});

const totalSlides = computed(() => slides.value.length);

const projectorUrl = computed(() => {
  const url = new URL('/projector', window.location.origin);
  if (setlistStore.currentSetlistId) {
    url.searchParams.set('setlistId', setlistStore.currentSetlistId);
  }
  return url.toString();
});

// Methoden
const prevSlide = () => {
  projectionStore.prev();
  sendCommand('prev');
};

const nextSlide = () => {
  projectionStore.next();
  sendCommand('next');
};

const toggleBlackout = () => {
  projectionStore.toggleBlackout();
  sendCommand('blackout');
};

const toggleFullscreen = () => {
  projectionStore.setFullscreen(!projectionStore.isFullscreen);
  sendCommand('fullscreen', { value: projectionStore.isFullscreen });
};

// BroadcastChannel für die Kommunikation mit der Projektion
const setupBroadcastChannel = () => {
  channel.value = new BroadcastChannel('nak-beamer-control');
};

const sendCommand = (command: string, data?: any) => {
  if (!channel.value) return;
  
  channel.value.postMessage({
    command,
    data
  });
};

// Lifecycle hooks
onMounted(() => {
  // Lade Lieder, falls noch nicht geladen
  if (songStore.songs.length === 0) {
    songStore.loadSongs();
  }
  
  // Lade Setlists, falls noch nicht geladen
  if (setlistStore.setlists.length === 0) {
    setlistStore.loadSetlists();
  }
  
  // Initialisiere BroadcastChannel
  setupBroadcastChannel();
});

onUnmounted(() => {
  // Schließe BroadcastChannel
  if (channel.value) {
    channel.value.close();
  }
});
</script>
