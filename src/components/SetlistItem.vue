<template>
  <div 
    class="setlist-item bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 mb-2 hover:shadow transition-shadow"
    :class="{ 'border-l-4 border-blue-500': active }"
    draggable="true"
    @dragstart="onDragStart"
    @dragover.prevent="onDragOver"
    @drop="onDrop"
    @dragend="onDragEnd"
  >
    <div class="flex justify-between items-center">
      <div class="flex items-center">
        <div class="mr-2 text-gray-400 dark:text-gray-500 cursor-move" title="Ziehen zum Verschieben" @mousedown.prevent>
          ≡
        </div>
        <div>
          <h4 class="font-medium">{{ song?.title || 'Unbekanntes Lied' }}</h4>
          <p v-if="song?.number" class="text-sm text-gray-600 dark:text-gray-300">
            {{ song.number }}
            <span v-if="song.source?.buchId" class="ml-1 text-blue-600 dark:text-blue-400">
              ({{ getBookName(song.source.buchId) }})
            </span>
          </p>
        </div>
      </div>
      
      <div class="flex items-center space-x-2">
        <button
          class="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          @click="$emit('edit')"
          title="Strophen bearbeiten"
        >
          ✎
        </button>
        <button
          class="p-1 text-gray-500 dark:text-gray-400 hover:text-red-600"
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
        class="inline-block px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs rounded"
        :class="{ 'bg-blue-100 dark:bg-blue-900/30': currentVerseIndex === index }"
      >
        {{ verseId }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Song } from '@/features/songs/song.types';
import { getBookName } from '@/features/songs/book-names';

// Props
interface Props {
  song?: Song;
  verseOrder?: string[];
  active?: boolean;
  currentVerseIndex?: number;
  index?: number; // Index in der Setlist für Drag-and-Drop
}

const props = withDefaults(defineProps<Props>(), {
  verseOrder: () => [],
  active: false,
  currentVerseIndex: -1,
  index: 0
});

// Emits
const emit = defineEmits<{
  (e: 'edit'): void;
  (e: 'remove'): void;
  (e: 'reorder', fromIndex: number, toIndex: number): void;
}>();

let dragSourceIndex: number | null = null;

function onDragStart(e: DragEvent) {
  dragSourceIndex = props.index;
  e.dataTransfer?.setData('text/plain', String(props.index));
  e.dataTransfer!.effectAllowed = 'move';
}

function onDragOver(e: DragEvent) {
  e.preventDefault();
  e.dataTransfer!.dropEffect = 'move';
}

function onDrop(e: DragEvent) {
  e.preventDefault();
  const targetIndex = props.index;
  if (dragSourceIndex !== null && dragSourceIndex !== targetIndex) {
    emit('reorder', dragSourceIndex, targetIndex);
  }
  dragSourceIndex = null;
}

function onDragEnd() {
  dragSourceIndex = null;
}
</script>
