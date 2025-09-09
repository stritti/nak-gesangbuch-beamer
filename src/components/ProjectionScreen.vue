<template>
  <div 
    class="projection" 
    :class="theme"
    tabindex="0"
    @keydown="handleKeydown"
    ref="projectionRef"
  >
    <!-- NAK Logo in der rechten oberen Ecke -->
    <div class="nak-logo-container">
      <img src="@/assets/nak-logo.svg" alt="NAK Logo" class="nak-logo" />
    </div>
    <div v-if="blackout" class="w-full h-full bg-black"></div>
    <div v-else class="flex flex-col h-full p-8">
      <!-- Liedtitel und Nummer -->
      <div v-if="songTitle || songNumber" class="song-header text-center mb-4 opacity-80">
        <h1 class="text-2xl font-bold">
          <span v-if="songNumber" class="song-number mr-2">{{ songNumber }}</span>
          <span v-if="songTitle" class="song-title">{{ songTitle }}</span>
        </h1>
      </div>
      
      <!-- Hauptinhalt (zentriert) -->
      <div class="flex-grow flex items-center justify-center">
        <transition 
          name="slide-fade" 
          mode="out-in"
          @before-enter="beforeEnter"
          @after-leave="afterLeave"
          @after-enter="adjustFontSize"
        >
        <div 
          :key="props.currentIndex"
          class="text-center max-w-4xl overflow-hidden"
          :style="{ 
            fontSize: `${computedFontSize}px`, 
            lineHeight: lineHeight,
            maxHeight: 'calc(100vh - 220px)' // Mehr Platz für Header und Footer reservieren
          }"
          ref="contentRef"
        >
          <div v-if="currentSlide" class="slide-content text-left">
            <!-- Strophennummer anzeigen -->
            <div v-if="currentVerseNumber" class="verse-indicator mb-2 opacity-70">
              {{ currentVerseNumber }}
            </div>
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
    </div>
    
    <!-- Optional: Footer für Lizenzhinweise -->
    <div v-if="$slots.footer && !blackout" class="absolute bottom-0 left-0 right-0 p-4 text-sm opacity-70">
      <slot name="footer"></slot>
    </div>
    
    <!-- Strophennummern-Navigation (unten links) -->
    <div v-if="!blackout && extractedVerseNumbers.length > 0" class="absolute bottom-0 left-0 p-4 flex flex-wrap gap-2 opacity-50 max-w-xs">
      <button 
        v-for="(verseNum, idx) in extractedVerseNumbers" 
        :key="verseNum"
        class="verse-number px-2 py-1 rounded-full text-sm"
        :class="{ 'active': idx === currentVerseIndex }"
        @click="jumpToVerse(idx)"
        :title="`Zu Strophe ${verseNum} springen`"
      >
        {{ verseNum }}
      </button>
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
  verseNumbers?: string[]; // Strophennummern wie "1", "2", "R", etc.
  songTitle?: string;      // Titel des Liedes
  songNumber?: string;     // Nummer des Liedes
}

const props = withDefaults(defineProps<Props>(), {
  slides: () => [],
  currentIndex: 0,
  fontSize: 80,
  lineHeight: 1.3,
  theme: 'high-contrast',
  blackout: false,
  maxLinesPerSlide: 4,
  verseNumbers: () => [],
  songTitle: '',
  songNumber: ''
});

// Emits
const emit = defineEmits<{
  (e: 'next'): void;
  (e: 'prev'): void;
  (e: 'blackout'): void;
  (e: 'fullscreen', value: boolean): void;
  (e: 'jump-to-verse', index: number): void;
}>();

// Refs
const projectionRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);
const computedFontSize = ref(props.fontSize);

// Extrahiere Strophennummern aus den Slides, wenn keine explizit übergeben wurden
const extractedVerseNumbers = computed(() => {
  if (props.verseNumbers && props.verseNumbers.length > 0) {
    return props.verseNumbers;
  }
  
  // Versuche, Strophennummern aus den Slides zu extrahieren
  if (!props.slides || props.slides.length === 0) return [];
  
  // Einfache Nummerierung: 1, 2, 3, ...
  return Array.from({ length: props.slides.length }, (_, i) => String(i + 1));
});

// Der aktuelle Strophenindex ist jetzt direkt der currentIndex,
// da jede Strophe genau einem Slide entspricht
const currentVerseIndex = computed(() => {
  return props.currentIndex;
});

// Aktuelle Strophennummer für die Anzeige
const currentVerseNumber = computed(() => {
  if (extractedVerseNumbers.value.length === 0 || currentVerseIndex.value >= extractedVerseNumbers.value.length) {
    return null;
  }
  return extractedVerseNumbers.value[currentVerseIndex.value];
});

// Computed
const currentSlide = computed(() => {
  if (!props.slides.length) return null;
  
  // Wenn keine Slides vorhanden sind, leeren Array zurückgeben
  if (props.slides.length === 0) return null;
  
  // Sicherstellen, dass der Index im gültigen Bereich liegt
  const index = Math.min(props.currentIndex, props.slides.length - 1);
  
  // Slide zurückgeben (komplette Strophe)
  return props.slides[index];
});

// Die Gesamtzahl der Slides ist jetzt gleich der Anzahl der Strophen
const totalSlides = computed(() => {
  return props.slides.length;
});

// Methode zur Anpassung der Schriftgröße basierend auf dem Inhalt und der Bildschirmgröße
const adjustFontSize = async () => {
  if (!projectionRef.value || !contentRef.value || !currentSlide.value) return;
  
  // Warten auf das nächste Rendering und sicherstellen, dass der DOM aktualisiert ist
  await nextTick();
  
  // Logging für Debugging
  console.log('Adjusting font size for slide:', props.currentIndex);
  
  // Reserviere Platz für Header (oben) und Navigation/Footer (unten)
  const headerSpace = 100; // Platz für Liedtitel und Nummer
  const footerSpace = 120; // Platz für Navigation und Quellenangaben
  
  const containerHeight = projectionRef.value.clientHeight - headerSpace - footerSpace;
  const containerWidth = projectionRef.value.clientWidth - 100; // Seitenränder
  
  // Basisschriftgröße für 1024x768 berechnen
  // Für höhere Auflösungen skalieren wir proportional
  const baseWidth = 1024;
  const baseHeight = 768;
  const scaleFactor = Math.min(
    projectionRef.value.clientWidth / baseWidth,
    projectionRef.value.clientHeight / baseHeight
  );
  
  // Starten mit einer skalierten Basisschriftgröße
  // Wir beginnen mit einer etwas kleineren Größe als props.fontSize,
  // um schneller eine passende Größe zu finden
  let fontSize = Math.min(props.fontSize, 60) * scaleFactor;
  contentRef.value.style.fontSize = `${fontSize}px`;
  
  // Überprüfen, ob der Inhalt in den Container passt
  // Wir verwenden eine binäre Suche, um schneller die optimale Größe zu finden
  let minSize = 20;
  let maxSize = fontSize;
  let attempts = 0;
  const maxAttempts = 10; // Begrenze die Anzahl der Versuche
  
  while (attempts < maxAttempts) {
    attempts++;
    
    if (
      contentRef.value.scrollHeight <= containerHeight && 
      contentRef.value.scrollWidth <= containerWidth
    ) {
      // Inhalt passt, versuche größer
      minSize = fontSize;
      fontSize = Math.min(fontSize + (maxSize - fontSize) / 2, maxSize);
    } else {
      // Inhalt passt nicht, versuche kleiner
      maxSize = fontSize;
      fontSize = Math.max(fontSize - (fontSize - minSize) / 2, minSize);
    }
    
    // Setze neue Größe
    contentRef.value.style.fontSize = `${fontSize}px`;
    
    // Wenn wir nahe genug an der optimalen Größe sind, brechen wir ab
    if (maxSize - minSize < 2) break;
  }
  
  // Sicherheitsüberprüfung: Falls der Inhalt immer noch nicht passt,
  // reduzieren wir die Größe weiter
  while (
    (contentRef.value.scrollHeight > containerHeight || 
     contentRef.value.scrollWidth > containerWidth) && 
    fontSize > minSize
  ) {
    fontSize -= 1;
    contentRef.value.style.fontSize = `${fontSize}px`;
  }
  
  // Zusätzlicher Sicherheitsabstand, um sicherzustellen, dass nichts abgeschnitten wird
  fontSize = Math.max(fontSize - 2, minSize);
  contentRef.value.style.fontSize = `${fontSize}px`;
  
  // Aktualisiere die berechnete Schriftgröße
  computedFontSize.value = fontSize;
};

// Methods
const handleKeydown = (e: KeyboardEvent) => {
  // Hotkeys werden durch bindHotkeys verarbeitet
  
  // Zusätzlich: Zifferntasten für direkten Sprung zu Strophen
  const key = e.key;
  if (/^[0-9]$/.test(key)) {
    const verseIndex = parseInt(key) - 1; // 1 wird zu Index 0, etc.
    if (verseIndex >= 0 && verseIndex < props.slides.length) {
      jumpToVerse(verseIndex);
    }
  }
};

// Zu einer bestimmten Strophe springen
const jumpToVerse = (verseIndex: number) => {
  if (verseIndex < 0 || verseIndex >= props.slides.length) return;
  
  // Da jede Strophe genau einem Slide entspricht, ist der Slide-Index gleich dem Strophen-Index
  emit('jump-to-verse', verseIndex);
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
    window.addEventListener('resize', handleResize);
    
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
  window.removeEventListener('resize', handleResize);
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
  // Wir verwenden setTimeout, um sicherzustellen, dass das DOM vollständig aktualisiert wurde
  nextTick(() => {
    setTimeout(() => {
      adjustFontSize();
    }, 50);
  });
});

// Schriftgröße anpassen, wenn sich die Slides ändern
watch(() => props.slides, () => {
  nextTick(() => {
    setTimeout(() => {
      adjustFontSize();
    }, 50);
  });
}, { deep: true });

// Schriftgröße anpassen, wenn sich die Fenstergröße ändert
let resizeTimeout: number | null = null;
const handleResize = () => {
  if (resizeTimeout) {
    window.clearTimeout(resizeTimeout);
  }
  
  // Verzögere die Anpassung, um zu viele Berechnungen zu vermeiden
  resizeTimeout = window.setTimeout(() => {
    adjustFontSize();
    resizeTimeout = null;
  }, 100);
};

// Animation-Hooks
const beforeEnter = () => {
  // Hier könnten wir zusätzliche Logik vor dem Einblenden hinzufügen
};

const afterLeave = () => {
  // Nach dem Ausblenden die Schriftgröße anpassen
  setTimeout(() => {
    adjustFontSize();
  }, 50);
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

.verse-number {
  transition: all 0.2s ease;
  background-color: rgba(128, 128, 128, 0.2);
}

.verse-number.active {
  background-color: rgba(255, 255, 255, 0.3);
  font-weight: bold;
  transform: scale(1.1);
}

.high-contrast .verse-number.active {
  background-color: rgba(255, 255, 255, 0.4);
}

.light .verse-number.active {
  background-color: rgba(0, 0, 0, 0.2);
}

.dark .verse-number.active {
  background-color: rgba(255, 255, 255, 0.2);
}

/* Styling für den Liedtitel und die Nummer */
.song-header {
  position: absolute;
  top: 1rem;
  left: 0;
  right: 0;
  padding: 0.5rem;
}

.song-number {
  font-weight: bold;
}

.high-contrast .song-header {
  color: rgba(255, 255, 255, 0.9);
}

.light .song-header {
  color: rgba(0, 0, 0, 0.9);
}

.dark .song-header {
  color: rgba(255, 255, 255, 0.9);
}

/* Styling für die Strophenanzeige */
.verse-indicator {
  font-size: 0.5em;
  font-weight: bold;
  text-align: left;
  margin-bottom: 0.5em;
}

.high-contrast .verse-indicator {
  color: rgba(255, 255, 255, 0.8);
}

.light .verse-indicator {
  color: rgba(0, 0, 0, 0.8);
}

.dark .verse-indicator {
  color: rgba(255, 255, 255, 0.8);
}

/* Styling für das NAK-Logo */
.nak-logo-container {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;
  opacity: 0.3;
  transition: opacity 0.3s ease;
}

.nak-logo-container:hover {
  opacity: 0.5;
}

.nak-logo {
  width: 60px;
  height: 60px;
}

.high-contrast .nak-logo {
  filter: brightness(0) invert(1);
}

.light .nak-logo {
  filter: brightness(0);
}

.dark .nak-logo {
  filter: brightness(0) invert(1);
}
</style>
