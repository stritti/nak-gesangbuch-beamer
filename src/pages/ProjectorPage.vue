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
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useProjectionStore } from '@/features/projection/projection.store';
import { useSongStore } from '@/features/songs/song.store';
import { useSetlistStore } from '@/features/setlist/setlist.store';
import ProjectionScreen from '@/components/ProjectionScreen.vue';
import { Song, Verse } from '@/features/songs/song.types';

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
    for (let i = 0; i < verse.lines.length; i += maxLinesPerSlide) {
      const slideLines = verse.lines.slice(i, i + maxLinesPerSlide);
      allSlides.push(slideLines);
    }
  }

  slides.value = allSlides;
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
});

// Reagiere auf Änderungen der Projektor-Einstellungen
watch(() => projectionStore.maxLinesPerSlide, () => {
  prepareSlides(currentSong.value);
});
</script>
