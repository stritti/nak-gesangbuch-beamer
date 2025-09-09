<template>
  <div 
    class="projection" 
    :class="theme"
    tabindex="0"
    @keydown="handleKeydown"
    ref="projectionRef"
  >
    <div v-if="blackout" class="w-full h-full bg-black"></div>
    <div v-else class="flex items-center justify-center h-full p-8">
      <div 
        class="text-center max-w-4xl"
        :style="{ 
          fontSize: `${fontSize}px`, 
          lineHeight: lineHeight 
        }"
      >
        <div v-if="currentSlide" class="slide-content">
          <p 
            v-for="(line, index) in currentSlide" 
            :key="index"
            class="mb-2"
          >
            {{ line }}
          </p>
        </div>
        <div v-else class="text-center">
          <p>Keine Inhalte zur Anzeige</p>
        </div>
      </div>
    </div>
    
    <!-- Optional: Footer für Lizenzhinweise -->
    <div v-if="$slots.footer && !blackout" class="absolute bottom-0 left-0 right-0 p-4 text-sm opacity-70">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { bindHotkeys } from '@/utils/hotkeys';
import { projectionService } from '@/features/projection/projection.service';

// Props
interface Props {
  slides?: string[][];
  currentIndex?: number;
  fontSize?: number;
  lineHeight?: number;
  theme?: 'light' | 'dark' | 'high-contrast';
  blackout?: boolean;
  maxLinesPerSlide?: number;
}

const props = withDefaults(defineProps<Props>(), {
  slides: () => [],
  currentIndex: 0,
  fontSize: 80,
  lineHeight: 1.3,
  theme: 'high-contrast',
  blackout: false,
  maxLinesPerSlide: 4
});

// Emits
const emit = defineEmits<{
  (e: 'next'): void;
  (e: 'prev'): void;
  (e: 'blackout'): void;
  (e: 'fullscreen', value: boolean): void;
}>();

// Refs
const projectionRef = ref<HTMLElement | null>(null);

// Computed
const currentSlide = computed(() => {
  if (!props.slides.length) return null;
  const index = Math.min(props.currentIndex, props.slides.length - 1);
  return props.slides[index];
});

// Methods
const handleKeydown = (e: KeyboardEvent) => {
  // Hotkeys werden durch bindHotkeys verarbeitet
};

const toggleFullscreen = async () => {
  if (projectionRef.value) {
    if (!document.fullscreenElement) {
      await projectionService.requestFullscreen(projectionRef.value);
      emit('fullscreen', true);
    } else {
      await projectionService.exitFullscreen();
      emit('fullscreen', false);
    }
  }
};

// Lifecycle hooks
onMounted(() => {
  if (projectionRef.value) {
    // Hotkeys binden
    const unbind = bindHotkeys(projectionRef.value, {
      next: () => emit('next'),
      prev: () => emit('prev'),
      blackout: () => emit('blackout'),
      fullscreen: toggleFullscreen
    });
    
    // Wake-Lock aktivieren
    projectionService.requestWakeLock().catch(console.error);
    
    // Cleanup
    onUnmounted(() => {
      unbind();
      projectionService.releaseWakeLock().catch(console.error);
    });
  }
});

// Fokus auf das Projektionselement setzen, wenn es gemountet wird
watch(() => projectionRef.value, (el) => {
  if (el) {
    el.focus();
  }
});
</script>
