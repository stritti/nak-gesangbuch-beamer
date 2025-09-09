<template>
  <button 
    class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
    @click="projectItem"
  >
    <span class="mr-1">{{ label || 'Projizieren' }}</span>
    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { useProjection } from '@/composables/useProjection';

interface Props {
  songId?: string;
  setlistId?: string;
  label?: string;
}

const props = defineProps<Props>();
const { projectSongToWindow, projectSetlistToWindow } = useProjection();

const projectItem = () => {
  if (props.songId) {
    projectSongToWindow(props.songId);
  } else if (props.setlistId) {
    projectSetlistToWindow(props.setlistId);
  }
};
</script>
