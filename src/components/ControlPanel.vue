<template>
  <div class="control-panel bg-white rounded-lg shadow-md p-4">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold">Steuerung</h2>
      <div class="flex space-x-2">
        <button
          class="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
          @click="$emit('settings')"
        >
          Einstellungen
        </button>
      </div>
    </div>
    
    <!-- Aktuelle Slide-Anzeige -->
    <div class="current-slide bg-gray-100 p-3 rounded mb-4">
      <p class="text-sm text-gray-500 mb-1">Aktueller Slide ({{ currentIndex + 1 }}/{{ totalSlides }})</p>
      <div class="text-lg font-medium">
        <template v-if="currentSlide && currentSlide.length">
          <p v-for="(line, i) in currentSlide" :key="i" class="line-clamp-1">{{ line }}</p>
        </template>
        <p v-else class="text-gray-400">Kein Inhalt</p>
      </div>
    </div>
    
    <!-- Nächster Slide (Preview) -->
    <div v-if="nextSlide" class="next-slide bg-gray-50 p-3 rounded mb-4">
      <p class="text-sm text-gray-500 mb-1">Nächster Slide</p>
      <div class="text-base text-gray-600">
        <p v-for="(line, i) in nextSlide" :key="i" class="line-clamp-1">{{ line }}</p>
      </div>
    </div>
    
    <!-- Steuerungstasten -->
    <div class="control-buttons grid grid-cols-4 gap-2 mb-4">
      <button
        class="col-span-1 py-2 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
        @click="$emit('prev')"
      >
        <span>←</span>
      </button>
      <button
        class="col-span-2 py-2 bg-gray-200 rounded hover:bg-gray-300"
        @click="$emit('blackout')"
      >
        Blackout (B)
      </button>
      <button
        class="col-span-1 py-2 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
        @click="$emit('next')"
      >
        <span>→</span>
      </button>
    </div>
    
    <!-- Vollbild-Button -->
    <button
      class="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-4"
      @click="$emit('fullscreen')"
    >
      {{ isFullscreen ? 'Vollbild beenden' : 'Vollbild starten' }} (F)
    </button>
    
    <!-- Hotkey-Legende -->
    <div class="hotkey-legend text-sm text-gray-500">
      <p class="mb-1">Tastenkürzel:</p>
      <ul class="grid grid-cols-2 gap-x-2 gap-y-1">
        <li>← / ,: Vorheriger Slide</li>
        <li>→ / .: Nächster Slide</li>
        <li>B: Blackout</li>
        <li>F: Vollbild</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
// Props
interface Props {
  currentSlide?: string[];
  nextSlide?: string[];
  currentIndex?: number;
  totalSlides?: number;
  isFullscreen?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  currentSlide: () => [],
  nextSlide: () => [],
  currentIndex: 0,
  totalSlides: 0,
  isFullscreen: false
});

// Emits
defineEmits<{
  (e: 'next'): void;
  (e: 'prev'): void;
  (e: 'blackout'): void;
  (e: 'fullscreen'): void;
  (e: 'settings'): void;
}>();
</script>
