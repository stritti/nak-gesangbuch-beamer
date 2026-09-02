<template>
  <button
    class="p-2 rounded-lg transition-colors"
    :class="buttonClass"
    :title="tooltip"
    @click="themeStore.toggle()"
  >
    <span class="text-lg leading-none">{{ icon }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useThemeStore } from '@/features/theme/theme.store';

const themeStore = useThemeStore();

const icon = computed(() => {
  switch (themeStore.mode) {
    case 'auto': return '🖥️';
    case 'dark': return '🌙';
    case 'light': return '☀️';
    default: return '🖥️';
  }
});

const tooltip = computed(() => {
  switch (themeStore.mode) {
    case 'auto': return 'Automatisch (System) — Klicken zum Umschalten';
    case 'dark': return 'Dunkel — Klicken zum Umschalten';
    case 'light': return 'Hell — Klicken zum Umschalten';
    default: return 'Automatisch (System) — Klicken zum Umschalten';
  }
});

const buttonClass = computed(() => {
  switch (themeStore.mode) {
    case 'auto': return 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300';
    case 'dark': return 'bg-gray-700 hover:bg-gray-600 text-gray-300';
    case 'light': return 'bg-gray-200 hover:bg-gray-300 text-gray-700';
    default: return 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300';
  }
});
</script>
