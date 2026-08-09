<template>
  <div class="hotkey-legend bg-gray-100 p-4 rounded-lg">
    <h3 class="text-lg font-semibold mb-2">Tastenkürzel</h3>
    <div class="grid grid-cols-2 gap-x-4 gap-y-2">
      <div v-for="(hotkey, index) in hotkeys" :key="index" class="flex items-center">
        <span class="inline-block bg-white px-2 py-1 rounded border text-sm font-mono mr-2">
          {{ hotkey.key }}
        </span>
        <span class="text-sm">{{ hotkey.description }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface Hotkey {
  key: string;
  description: string;
}

const props = withDefaults(defineProps<{
  hotkeys?: Hotkey[];
}>(), {
  hotkeys: () => [
    { key: '←', description: 'Vorheriger Slide' },
    { key: '→', description: 'Nächster Slide' },
    { key: 'B', description: 'Blackout ein/aus' },
    { key: 'F', description: 'Vollbild ein/aus' },
    { key: '.', description: 'Nächster Slide (alternativ)' },
    { key: ',', description: 'Vorheriger Slide (alternativ)' }
  ]
});
</script>
