<template>
  <div class="projection high-contrast" tabindex="0" @keydown="handleKeydown">
    <div v-if="blackout" class="w-full h-full bg-black"></div>
    <div v-else class="flex items-center justify-center h-full">
      <div class="text-center p-8">
        <h1 class="text-6xl mb-8">Projektion</h1>
        <p class="text-4xl">Hier werden die Liedtexte angezeigt.</p>
        <p class="text-2xl mt-8">
          Tastenkürzel: ← → (Navigation), B (Blackout), F (Vollbild)
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const blackout = ref(false);

const handleKeydown = (e: KeyboardEvent) => {
  switch (e.key) {
    case 'b':
    case 'B':
      blackout.value = !blackout.value;
      break;
    case 'f':
    case 'F':
      toggleFullscreen();
      break;
    case 'ArrowRight':
    case '.':
      // Next slide
      console.log('Next slide');
      break;
    case 'ArrowLeft':
    case ',':
      // Previous slide
      console.log('Previous slide');
      break;
  }
};

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch((err) => {
      console.error(`Fehler beim Aktivieren des Vollbildmodus: ${err.message}`);
    });
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
};
</script>
