<template>
  <ProjectionScreen
    :slides="slides"
    :current-index="projectionStore.currentIndex"
    :font-size="projectionStore.fontSize"
    :line-height="projectionStore.lineHeight"
    :theme="projectionStore.theme"
    :blackout="projectionStore.blackout"
    :max-lines-per-slide="projectionStore.maxLinesPerSlide"
    @next="projectionStore.next()"
    @prev="projectionStore.prev()"
    @blackout="projectionStore.toggleBlackout()"
    @fullscreen="projectionStore.setFullscreen($event)"
  >
    <template #footer v-if="currentSong && currentSong.copyright">
      <div class="text-center">
        {{ currentSong.copyright }}
      </div>
    </template>
  </ProjectionScreen>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useProjectionStore } from '@/features/projection/projection.store';
import { useSongStore } from '@/features/songs/song.store';
import { useSetlistStore } from '@/features/setlist/setlist.store';
import ProjectionScreen from '@/components/ProjectionScreen.vue';
import { Song, Verse } from '@/features/songs/song.types';
import { splitVerseIntoSlides } from '@/utils/slideUtils';

const route = useRoute();
const projectionStore = useProjectionStore();
const songStore = useSongStore();
const setlistStore = useSetlistStore();

// Zustand
const slides = ref<string[][]>([]);
const currentSong = ref<Song | null>(null);

// Berechne die Slides basierend auf dem aktuellen Lied
const prepareSlides = (song: Song | null) => {
  if (!song) {
    slides.value = [];
    return;
  }

  currentSong.value = song;
  const maxLinesPerSlide = projectionStore.maxLinesPerSlide;
  const allSlides: string[][] = [];

  // Bestimme die Reihenfolge der Verse
  const verseOrder = song.verseOrder || song.verses.map(v => v.id);

  // Für jeden Vers in der Reihenfolge
  for (const verseId of verseOrder) {
    let verse: Verse | undefined;

    // Finde den Vers oder Refrain
    if (verseId === 'R' && song.refrain) {
      verse = song.refrain;
    } else {
      verse = song.verses.find(v => v.id === verseId);
    }

    if (!verse) continue;

    // Teile die Zeilen in Slides auf
    const verseSlides = splitVerseIntoSlides(verse.lines, maxLinesPerSlide);
    allSlides.push(...verseSlides);
  }

  slides.value = allSlides;
  
  // Informiere das Steuerungsfenster über die Anzahl der Slides
  if (window.opener) {
    window.opener.postMessage({
      type: 'slidesUpdated',
      totalSlides: allSlides.length,
      currentSongId: song.id
    }, '*');
  }
};

// Lade das Lied basierend auf der URL oder der Setlist
onMounted(async () => {
  // Setze den Projektor zurück
  projectionStore.reset();

  // Lade Lieder, falls noch nicht geladen
  if (songStore.songs.length === 0) {
    await songStore.loadSongs();
  }

  // Prüfe, ob ein Lied in der URL angegeben ist
  const songId = route.query.songId as string | undefined;
  if (songId) {
    const song = songStore.getSongById(songId);
    if (song) {
      prepareSlides(song);
    }
  } else {
    // Lade die aktuelle Setlist
    if (setlistStore.currentSetlist && setlistStore.currentSetlist.items.length > 0) {
      const firstItem = setlistStore.currentSetlist.items[0];
      const song = songStore.getSongById(firstItem.songId);
      if (song) {
        prepareSlides(song);
      }
    }
  }
  
  // Event-Listener für Nachrichten vom Steuerungsfenster
  const handleMessage = (event: MessageEvent) => {
    // Hier können wir weitere Nachrichten vom Steuerungsfenster verarbeiten
    if (event.data && event.data.type === 'requestState') {
      // Sende den aktuellen Zustand zurück
      if (window.opener) {
        window.opener.postMessage({
          type: 'projectorState',
          isFullscreen: document.fullscreenElement !== null,
          currentIndex: projectionStore.currentIndex,
          totalSlides: slides.value.length,
          currentSongId: currentSong.value?.id
        }, '*');
      }
    }
  };
  
  window.addEventListener('message', handleMessage);
  
  // Informiere das Steuerungsfenster, dass der Projektor bereit ist
  if (window.opener) {
    window.opener.postMessage({
      type: 'projectorReady'
    }, '*');
  }
  
  // Cleanup
  onUnmounted(() => {
    window.removeEventListener('message', handleMessage);
  });
});

// Überwache den aktuellen Index und schalte auf Blackout, wenn das Ende erreicht ist
watch(() => projectionStore.currentIndex, (newIndex) => {
  if (slides.value.length > 0 && newIndex >= slides.value.length) {
    // Wenn wir über den letzten Slide hinaus sind, aktiviere Blackout
    projectionStore.blackout = true;
    // Setze den Index zurück auf den letzten Slide (für den Fall, dass Blackout deaktiviert wird)
    projectionStore.currentIndex = slides.value.length - 1;
  }
});

// Reagiere auf Änderungen der Projektor-Einstellungen
watch(() => projectionStore.maxLinesPerSlide, () => {
  prepareSlides(currentSong.value);
});
</script>
