<template>
  <div class="container mx-auto p-4">
    <h1 class="text-3xl font-bold mb-6">NAK Gesangbuch Beamer</h1>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold mb-4">Bibliothek</h2>
        <p class="mb-4">Lieder durchsuchen und verwalten</p>
        <router-link
          to="/library"
          class="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Zur Bibliothek
        </router-link>
      </div>
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold mb-4">Setlists</h2>
        <p class="mb-4">Setlists erstellen und bearbeiten</p>
        <router-link
          to="/setlist"
          class="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Zu den Setlists
        </router-link>
      </div>
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold mb-4">Projektion</h2>
        <p class="mb-4">Lieder im Vollbildmodus projizieren</p>
        <router-link
          to="/projector"
          class="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Projektion starten
        </router-link>
      </div>
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold mb-4">Steuerung</h2>
        <p class="mb-4">Fernsteuerung der Projektion</p>
        <router-link
          to="/control"
          class="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Zur Steuerung
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Home page component
</script>
