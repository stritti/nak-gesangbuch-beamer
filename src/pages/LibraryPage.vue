<template>
  <div class="container mx-auto p-4">
    <h1 class="text-3xl font-bold mb-6">Lied-Bibliothek</h1>
    <div class="mb-6">
      <button
        class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mr-2"
        @click="importSongs"
      >
        Lieder importieren
      </button>
      <router-link to="/" class="text-blue-600 hover:underline">Zurück zur Startseite</router-link>
    </div>
    <div class="bg-white p-6 rounded-lg shadow-md">
      <p>Hier werden importierte Lieder angezeigt und können durchsucht werden.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// Placeholder function for song import
const importSongs = () => {
  alert('Lied-Import-Funktion wird implementiert...');
};
</script>
