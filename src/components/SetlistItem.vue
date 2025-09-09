<template>
  <div 
    class="setlist-item bg-white rounded-lg shadow-sm p-3 mb-2 hover:shadow transition-shadow"
    :class="{ 'border-l-4 border-blue-500': active }"
  >
    <div class="flex justify-between items-center">
      <div class="flex items-center">
        <div class="mr-2 text-gray-400 cursor-move" title="Ziehen zum Verschieben">
          ≡
        </div>
        <div>
          <h4 class="font-medium">{{ song?.title || 'Unbekanntes Lied' }}</h4>
          <p v-if="song?.number" class="text-sm text-gray-600">
            {{ song.number }}
          </p>
        </div>
      </div>
      
      <div class="flex items-center space-x-2">
        <button
          class="p-1 text-gray-500 hover:text-gray-700"
          @click="$emit('edit')"
          title="Bearbeiten"
        >
          ✎
        </button>
        <button
          class="p-1 text-gray-500 hover:text-red-600"
          @click="$emit('remove')"
          title="Entfernen"
        >
          ✕
        </button>
      </div>
    </div>
    
    <div v-if="verseOrder && verseOrder.length" class="mt-2 flex flex-wrap gap-1">
      <span 
        v-for="(verseId, index) in verseOrder" 
        :key="`${verseId}-${index}`"
        class="inline-block px-2 py-0.5 bg-gray-100 text-xs rounded"
        :class="{ 'bg-blue-100': currentVerseIndex === index }"
      >
        {{ verseId }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Song } from '@/features/songs/song.types';

// Props
interface Props {
  song?: Song;
  verseOrder?: string[];
  active?: boolean;
  currentVerseIndex?: number;
}

const props = withDefaults(defineProps<Props>(), {
  verseOrder: () => [],
  active: false,
  currentVerseIndex: -1
});

// Emits
defineEmits<{
  (e: 'edit'): void;
  (e: 'remove'): void;
}>();
</script>
