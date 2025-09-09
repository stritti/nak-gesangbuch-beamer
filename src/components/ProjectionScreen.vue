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
      <transition 
        name="slide-fade" 
        mode="out-in"
        @before-enter="beforeEnter"
        @after-leave="afterLeave"
      >
        <div 
          :key="props.currentIndex"
          class="text-center max-w-4xl"
          :style="{ 
            fontSize: `${computedFontSize}px`, 
            lineHeight: lineHeight 
          }"
          ref="contentRef"
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
      </transition>
    </div>
    
    <!-- Optional: Footer für Lizenzhinweise -->
    <div v-if="$slots.footer && !blackout" class="absolute bottom-0 left-0 right-0 p-4 text-sm opacity-70">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
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
const contentRef = ref<HTMLElement | null>(null);
const computedFontSize = ref(props.fontSize);

// Computed
const currentSlide = computed(() => {
  if (!props.slides.length) return null;
  
  // Wenn keine Slides vorhanden sind, leeren Array zurückgeben
  if (props.slides.length === 0) return null;
  
  // Sicherstellen, dass der Index im gültigen Bereich liegt
  const index = Math.min(props.currentIndex, props.slides.length - 1);
  
  // Slide zurückgeben
  const slide = props.slides[index];
  
  // Wenn der Slide zu viele Zeilen hat, teilen wir ihn auf
  if (slide && slide.length > props.maxLinesPerSlide) {
    // In diesem Fall zeigen wir nur die ersten maxLinesPerSlide Zeilen an
    // Die restlichen Zeilen werden in nachfolgenden Slides angezeigt
    return slide.slice(0, props.maxLinesPerSlide);
  }
  
  return slide;
});

// Hilfsfunktion, um die Gesamtzahl der Slides zu berechnen
const totalSlides = computed(() => {
  if (!props.slides || props.slides.length === 0) return 0;
  
  // Zähle die Anzahl der Slides, die durch Aufteilung entstehen
  let count = 0;
  for (const slide of props.slides) {
    // Berechne, wie viele Slides für diesen Vers benötigt werden
    const slidesNeeded = Math.ceil(slide.length / props.maxLinesPerSlide);
    count += slidesNeeded;
  }
  
  return count;
});

// Methode zur Anpassung der Schriftgröße basierend auf dem Inhalt
const adjustFontSize = async () => {
  if (!projectionRef.value || !contentRef.value || !currentSlide.value) return;
  
  // Warten auf das nächste Rendering
  await nextTick();
  
  const containerHeight = projectionRef.value.clientHeight - 100; // Abzüglich Padding
  const containerWidth = projectionRef.value.clientWidth - 100;
  
  // Starten mit der vorgegebenen Schriftgröße
  let fontSize = props.fontSize;
  contentRef.value.style.fontSize = `${fontSize}px`;
  
  // Überprüfen, ob der Inhalt in den Container passt
  while (
    (contentRef.value.scrollHeight > containerHeight || 
     contentRef.value.scrollWidth > containerWidth) && 
    fontSize > 30
  ) {
    // Schriftgröße schrittweise verkleinern
    fontSize -= 5;
    contentRef.value.style.fontSize = `${fontSize}px`;
  }
  
  // Aktualisiere die berechnete Schriftgröße
  computedFontSize.value = fontSize;
};

// Methods
const handleKeydown = (e: KeyboardEvent) => {
  // Hotkeys werden durch bindHotkeys verarbeitet
};

const toggleFullscreen = async () => {
  if (projectionRef.value) {
    if (!document.fullscreenElement) {
      await projectionService.requestFullscreen(projectionRef.value);
      emit('fullscreen', true);
      // Nach dem Wechsel in den Vollbildmodus die Schriftgröße anpassen
      setTimeout(adjustFontSize, 100);
    } else {
      await projectionService.exitFullscreen();
      emit('fullscreen', false);
      // Nach dem Verlassen des Vollbildmodus die Schriftgröße anpassen
      setTimeout(adjustFontSize, 100);
    }
  }
};

// Event-Listener für Nachrichten vom Steuerungsfenster
const handleMessage = (event: MessageEvent) => {
  if (event.data) {
    switch (event.data.type) {
      case 'toggleFullscreen':
        toggleFullscreen();
        // Sende Bestätigung zurück
        if (window.opener) {
          window.opener.postMessage({
            type: 'fullscreenChange',
            isFullscreen: document.fullscreenElement !== null
          }, '*');
        }
        break;
      
      case 'updateSlides':
        // Hier könnten wir Slides aktualisieren, wenn sie vom Steuerungsfenster gesendet werden
        if (event.data.slides) {
          // Hier müssten wir die Slides aktualisieren, aber das hängt von der Implementierung ab
          console.log('Slides aktualisiert:', event.data.slides);
        }
        break;
    }
  }
};

// Referenz für die Unbind-Funktion
let unbindHotkeys: (() => void) | null = null;

// Lifecycle hooks
onMounted(() => {
  if (projectionRef.value) {
    // Hotkeys binden
    unbindHotkeys = bindHotkeys(projectionRef.value, {
      next: () => emit('next'),
      prev: () => emit('prev'),
      blackout: () => emit('blackout'),
      fullscreen: toggleFullscreen
    });
    
    // Wake-Lock aktivieren
    projectionService.requestWakeLock().catch(console.error);
    
    // Schriftgröße anpassen
    adjustFontSize();
    
    // Auf Größenänderungen reagieren
    window.addEventListener('resize', adjustFontSize);
    
    // Event-Listener für Nachrichten vom Steuerungsfenster registrieren
    window.addEventListener('message', handleMessage);
  }
});

// Cleanup
onUnmounted(() => {
  // Hotkeys unbinden
  if (unbindHotkeys) {
    unbindHotkeys();
    unbindHotkeys = null;
  }
  
  // Wake-Lock freigeben
  projectionService.releaseWakeLock().catch(console.error);
  
  // Event-Listener entfernen
  window.removeEventListener('resize', adjustFontSize);
  window.removeEventListener('message', handleMessage);
});

// Fokus auf das Projektionselement setzen, wenn es gemountet wird
watch(() => projectionRef.value, (el) => {
  if (el) {
    el.focus();
  }
});

// Schriftgröße anpassen, wenn sich der Slide ändert
watch(() => props.currentIndex, () => {
  nextTick(() => adjustFontSize());
});

// Schriftgröße anpassen, wenn sich die Slides ändern
watch(() => props.slides, () => {
  nextTick(() => adjustFontSize());
}, { deep: true });

// Animation-Hooks
const beforeEnter = () => {
  // Hier könnten wir zusätzliche Logik vor dem Einblenden hinzufügen
  // z.B. Audio-Effekte oder andere Vorbereitungen
};

const afterLeave = () => {
  // Nach dem Ausblenden können wir hier zusätzliche Aktionen ausführen
  // z.B. Statistiken aktualisieren oder Ereignisse auslösen
};
</script>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.25s ease;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}
</style>
