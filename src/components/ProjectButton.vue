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
import { isProjectorOpen } from '@/utils/projection';

interface Props {
  songId?: string;
  setlistId?: string;
  label?: string;
}

const props = defineProps<Props>();
const { projectorWindow, projectSongToWindow, projectSetlistToWindow, isProjectorWindowOpen } = useProjection();

const projectItem = () => {
  // Prüfe, ob ein Projektorfenster bereits geöffnet ist
  const isOpen = isProjectorWindowOpen();
  
  if (props.songId) {
    // Projiziere das Lied
    const window = projectSongToWindow(props.songId);
    
    // Wenn das Fenster nicht geöffnet war, zeige eine Meldung an
    if (!isOpen && window) {
      console.log('Projektor wurde geöffnet und zeigt jetzt das Lied an.');
    } else if (window) {
      console.log('Lied wird im vorhandenen Projektor angezeigt.');
    }
  } else if (props.setlistId) {
    // Projiziere die Setlist
    const window = projectSetlistToWindow(props.setlistId);
    
    // Wenn das Fenster nicht geöffnet war, zeige eine Meldung an
    if (!isOpen && window) {
      console.log('Projektor wurde geöffnet und zeigt jetzt die Setlist an.');
    } else if (window) {
      console.log('Setlist wird im vorhandenen Projektor angezeigt.');
    }
  }
};
</script>
