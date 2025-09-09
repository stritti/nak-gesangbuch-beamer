<template>
  <div class="container mx-auto p-4">
    <h1 class="text-3xl font-bold mb-6">Steuerung</h1>
    <div class="mb-6">
      <router-link to="/" class="text-blue-600 hover:underline">Zurück zur Startseite</router-link>
    </div>
    <div class="bg-white p-6 rounded-lg shadow-md">
      <p>Hier kann die Projektion ferngesteuert werden.</p>
      <div class="mt-4 flex space-x-2">
        <button
          class="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
          @click="prevSlide"
        >
          Zurück
        </button>
        <button
          class="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
          @click="nextSlide"
        >
          Weiter
        </button>
        <button
          class="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
          @click="toggleBlackout"
        >
          Blackout
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Placeholder functions for control
const prevSlide = () => {
  alert('Vorheriger Slide wird implementiert...');
};

const nextSlide = () => {
  alert('Nächster Slide wird implementiert...');
};

const toggleBlackout = () => {
  alert('Blackout-Funktion wird implementiert...');
};
</script>
