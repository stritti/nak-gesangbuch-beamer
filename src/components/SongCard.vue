<template>
  <div 
    class="song-card bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
    :class="{ 'border-2 border-blue-500': selected }"
  >
    <div class="flex justify-between items-start">
      <div>
        <h3 class="text-lg font-semibold">{{ song.title }}</h3>
        <p v-if="song.subtitle" class="text-sm text-gray-600">{{ song.subtitle }}</p>
      </div>
      <div v-if="song.number" class="text-lg font-bold text-gray-700">
        {{ song.number }}
      </div>
    </div>
    
    <div class="mt-2 text-sm text-gray-600">
      <p v-if="song.authors && song.authors.length">
        {{ song.authors.join(', ') }}
      </p>
      <p v-if="song.language" class="uppercase">{{ song.language }}</p>
    </div>
    
    <div v-if="song.topics && song.topics.length" class="mt-2 flex flex-wrap gap-1">
      <span 
        v-for="topic in song.topics" 
        :key="topic"
        class="inline-block px-2 py-1 bg-gray-100 text-xs rounded"
      >
        {{ topic }}
      </span>
    </div>
    
    <div class="mt-3 flex justify-between">
      <button
        class="text-blue-600 hover:text-blue-800 text-sm"
        @click="$emit('view', song.id)"
      >
        Details
      </button>
      
      <div class="space-x-2">
        <button
          v-if="showAddButton"
          class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          @click="$emit('add', song.id)"
        >
          Hinzufügen
        </button>
        <button
          v-if="showProjectButton"
          class="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
          @click="$emit('project', song.id)"
        >
          Projizieren
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Song } from '@/features/songs/song.types';

// Props
interface Props {
  song: Song;
  selected?: boolean;
  showAddButton?: boolean;
  showProjectButton?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  showAddButton: true,
  showProjectButton: true
});

// Emits
defineEmits<{
  (e: 'view', id: string): void;
  (e: 'add', id: string): void;
  (e: 'project', id: string): void;
}>();
</script>
