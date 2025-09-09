<template>
  <div class="song-details">
    <div class="mb-6">
      <div class="flex justify-between items-start">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ song.title }}
        </h2>
        <span v-if="song.number" class="text-lg font-medium px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-md">
          {{ song.number }}
        </span>
      </div>
      
      <p v-if="song.subtitle" class="text-lg text-gray-600 dark:text-gray-400 mt-1">
        {{ song.subtitle }}
      </p>
      
      <!-- Buchinformation anzeigen -->
      <div v-if="song.source" class="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
        <h3 class="font-medium text-blue-800 dark:text-blue-300">
          {{ getBookName(song.source.buchId) }}
        </h3>
        <p v-if="song.source.rubric" class="text-sm text-blue-600 dark:text-blue-400">
          Rubrik: {{ song.source.rubric }}
        </p>
        <div v-if="song.source.meta" class="mt-2 grid grid-cols-2 gap-2 text-sm">
          <p v-if="song.source.meta.tonart" class="text-gray-600 dark:text-gray-400">
            <span class="font-medium">Tonart:</span> {{ song.source.meta.tonart }}
          </p>
          <p v-if="song.source.meta.taktart" class="text-gray-600 dark:text-gray-400">
            <span class="font-medium">Taktart:</span> {{ song.source.meta.taktart }}
          </p>
        </div>
        <div v-if="song.source.links && song.source.links.length > 0" class="mt-2">
          <h4 class="text-sm font-medium text-blue-700 dark:text-blue-300">Links:</h4>
          <div class="mt-1 flex flex-wrap gap-2">
            <a 
              v-for="link in song.source.links" 
              :key="link.url"
              :href="link.url" 
              target="_blank" 
              rel="noopener noreferrer"
              class="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded-md hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
            >
              {{ link.title }}
            </a>
          </div>
        </div>
      </div>
      
      <div class="mt-4 text-sm text-gray-500 dark:text-gray-400">
        <p v-if="song.authors && song.authors.length > 0" class="mb-1">
          <span class="font-medium">Autoren:</span> {{ song.authors.join(', ') }}
        </p>
        
        <p v-if="song.copyright" class="mb-1">
          <span class="font-medium">Copyright:</span> {{ song.copyright }}
        </p>
        
        <div v-if="song.topics && song.topics.length > 0" class="mt-2">
          <span class="font-medium">Themen:</span>
          <div class="mt-1 flex flex-wrap gap-1">
            <span 
              v-for="topic in song.topics" 
              :key="topic"
              class="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs"
            >
              {{ topic }}
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="verses space-y-6">
      <div v-for="verse in song.verses" :key="verse.id" class="verse">
        <h3 class="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
          Strophe {{ verse.id }}
        </h3>
        <div class="text-gray-700 dark:text-gray-300 space-y-2">
          <p v-for="(line, index) in verse.lines" :key="index">
            {{ line }}
          </p>
        </div>
      </div>
      
      <div v-if="song.refrain" class="verse">
        <h3 class="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
          Refrain
        </h3>
        <div class="text-gray-700 dark:text-gray-300 space-y-2">
          <p v-for="(line, index) in song.refrain.lines" :key="index">
            {{ line }}
          </p>
        </div>
      </div>
    </div>
    
    <div class="mt-8 flex justify-end space-x-3">
      <button 
        @click="$emit('add-to-setlist', song)"
        class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors duration-200"
      >
        Zur Setlist hinzufügen
      </button>
      <button 
        @click="$emit('project', song)"
        class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors duration-200"
      >
        Projizieren
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Song } from '@/features/songs/song.types';

defineProps<{
  song: Song;
}>();

defineEmits<{
  (e: 'add-to-setlist', song: Song): void;
  (e: 'project', song: Song): void;
}>();

// Hilfsfunktion, um den Buchnamen aus der Buch-ID zu ermitteln
function getBookName(buchId: string): string {
  const bookNames: Record<string, string> = {
    'gb': 'Gesangbuch',
    'cb': 'Chorbuch',
    'jl': 'Jugendliederbuch',
    'kl': 'Kinderliederbuch'
  };
  
  return bookNames[buchId] || buchId.toUpperCase();
}
</script>
