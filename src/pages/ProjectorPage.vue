<template>
  <ProjectionScreen
    :slides="slides"
    :current-index="projectionStore.currentIndex"
    :font-size="projectionStore.fontSize"
    :line-height="projectionStore.lineHeight"
    :theme="projectionStore.theme"
    :blackout="projectionStore.blackout"
    :max-lines-per-slide="projectionStore.maxLinesPerSlide"
    :song-title="currentSong?.title"
    :song-number="currentSong?.number"
    @next="projectionStore.next()"
    @prev="projectionStore.prev()"
    @blackout="projectionStore.toggleBlackout()"
    @fullscreen="projectionStore.setFullscreen($event)"
    @jump-to-verse="projectionStore.currentIndex = $event"
    @home="navigateHome"
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

    // Jede Strophe wird als ein kompletter Slide hinzugefügt
    allSlides.push(verse.lines);
  }

  slides.value = allSlides;
  
  // Informiere das Steuerungsfenster über die Anzahl der Slides
  if (window.opener) {
    window.opener.postMessage({
      type: 'slidesUpdated',
      totalSlides: allSlides.length,
      currentSongId: song.id
    }, window.location.origin);
  }
};

// Zustand für Setlist-Navigation
const currentSetlistIndex = ref(0);
const setlistItems = ref<Array<{songId: string, verseIds?: string[]}>>([]);

// Funktionen für die Setlist-Navigation
const nextSong = () => {
  if (setlistItems.value.length === 0 || currentSetlistIndex.value >= setlistItems.value.length - 1) {
    return;
  }

  currentSetlistIndex.value++;
  const nextItem = setlistItems.value[currentSetlistIndex.value];
  const song = songStore.getSongById(nextItem.songId);

  if (song) {
    // Setze den Projektor zurück und lade das nächste Lied
    projectionStore.reset();
    prepareSlides(song);
  
    // Informiere das Steuerungsfenster über den Wechsel
    if (window.opener) {
      window.opener.postMessage({
        type: 'setlistItemChanged',
        currentIndex: currentSetlistIndex.value,
        totalItems: setlistItems.value.length,
        currentSongId: song.id
      }, window.location.origin);
    }
  }
};

const prevSong = () => {
  if (setlistItems.value.length === 0 || currentSetlistIndex.value <= 0) {
    return;
  }

  currentSetlistIndex.value--;
  const prevItem = setlistItems.value[currentSetlistIndex.value];
  const song = songStore.getSongById(prevItem.songId);

  if (song) {
    // Setze den Projektor zurück und lade das vorherige Lied
    projectionStore.reset();
    prepareSlides(song);
  
    // Informiere das Steuerungsfenster über den Wechsel
    if (window.opener) {
      window.opener.postMessage({
        type: 'setlistItemChanged',
        currentIndex: currentSetlistIndex.value,
        totalItems: setlistItems.value.length,
        currentSongId: song.id
      }, window.location.origin);
    }
  }
};

// Event-Listener für Nachrichten vom Steuerungsfenster
const handleMessage = (event: MessageEvent) => {
  // Nur Nachrichten vom gleichen Origin und vom Opener akzeptieren
  if (event.origin !== window.location.origin) return;
  if (event.source !== window.opener) return;
  if (event.data) {
    switch (event.data.type) {
      case 'requestState':
        // Sende den aktuellen Zustand zurück
        if (window.opener) {
          window.opener.postMessage({
            type: 'projectorState',
            isFullscreen: document.fullscreenElement !== null,
            currentIndex: projectionStore.currentIndex,
            totalSlides: slides.value.length,
            currentSongId: currentSong.value?.id,
            inSetlist: setlistItems.value.length > 0,
            currentSetlistIndex: currentSetlistIndex.value,
            totalSetlistItems: setlistItems.value.length
          }, window.location.origin);
        }
        break;
      
      case 'nextSlide':
        if (projectionStore.currentIndex < slides.value.length - 1) {
          projectionStore.next();
        }
        break;
      
      case 'prevSlide':
        if (projectionStore.currentIndex > 0) {
          projectionStore.prev();
        }
        break;
      
      case 'blackout':
        projectionStore.toggleBlackout();
        break;

      case 'updateSettings':
        if (event.data.settings) {
          const s = event.data.settings;
          if (s.fontSize !== undefined) projectionStore.setFontSize(s.fontSize);
          if (s.lineHeight !== undefined) projectionStore.setLineHeight(s.lineHeight);
          if (s.theme !== undefined) projectionStore.setTheme(s.theme);
          if (s.maxLinesPerSlide !== undefined) projectionStore.setMaxLinesPerSlide(s.maxLinesPerSlide);
        }
        break;

      case 'nextSong':
        nextSong();
        break;
      
      case 'prevSong':
        prevSong();
        break;
      
      case 'jumpToSong':
        if (event.data.songId) {
          const song = songStore.getSongById(event.data.songId);
          if (song) {
            projectionStore.reset();
            prepareSlides(song);
          }
        }
        break;
    }
  }
};

// Storage-Event-Handler
const handleStorageChange = (event: StorageEvent) => {
  // Prüfe, ob die Änderung für dieses Fenster relevant ist
  if (event.key === 'lastProjectedSongId' && event.newValue) {
    const songId = event.newValue;
    const song = songStore.getSongById(songId);
    if (song) {
      projectionStore.reset();
      prepareSlides(song);
    }
  } else if (event.key === 'lastProjectedSetlistId' && event.newValue) {
    const setlistId = event.newValue;
    const setlist = setlistStore.setlists.find(s => s.id === setlistId);
    if (setlist && setlist.items.length > 0) {
      setlistItems.value = setlist.items;
      currentSetlistIndex.value = 0;
    
      const firstItem = setlist.items[0];
      const song = songStore.getSongById(firstItem.songId);
      if (song) {
        projectionStore.reset();
        prepareSlides(song);
      }
    }
  }
};

// Referenz für das Interval
let checkInterval: number | null = null;

// Prüfe, ob die Seite in einem eigenen Fenster geöffnet ist
const checkIfInOwnWindow = () => {
  // Wenn wir nicht in einem eigenen Fenster sind, öffnen wir uns selbst in einem neuen Fenster
  if (window.opener === null && window.parent === window && !window.name.includes('projector')) {
    // Speichere die aktuelle URL mit allen Parametern
    const url = window.location.href;
    
    // Prüfe, ob bereits ein Projektorfenster existiert
    const existingWindow = window.open('', 'projector');
    
    if (existingWindow && !existingWindow.closed) {
      // Wenn ein Fenster existiert, navigiere es zu unserer URL
      existingWindow.location.href = url;
      existingWindow.focus();
    } else {
      // Sonst öffne ein neues Fenster
      const windowFeatures = localStorage.getItem('projectorWindowFeatures') || 'width=1024,height=768';
      const newWindow = window.open(url, 'projector', windowFeatures);
      
      if (newWindow) {
        newWindow.focus();
      }
    }
    
    // Leite zur Startseite weiter oder schließe das aktuelle Fenster
    try {
      window.close();
    } catch (e) {
      // Falls das Schließen nicht funktioniert, leiten wir zur Startseite weiter
      window.location.href = '/';
    }
    
    return false;
  }
  
  // Registriere dieses Fenster als das aktive Projektorfenster
  window.name = 'projector';
  
  return true;
};

// Zur Startseite navigieren
const navigateHome = () => {
  // Fenster schließen oder zur Startseite navigieren
  if (window.opener) {
    // Informiere das Steuerungsfenster, dass wir zur Startseite navigieren
    window.opener.postMessage({
      type: 'navigatingHome'
    }, window.location.origin);
  }
  
  // Zur Startseite navigieren
  window.location.href = '/';
};

// Lade das Lied basierend auf der URL oder der Setlist
onMounted(async () => {
  // Prüfe zuerst, ob wir in einem eigenen Fenster sind
  if (!checkIfInOwnWindow()) {
    return; // Wenn nicht, brechen wir ab, da wir uns in einem neuen Fenster öffnen
  }
  
  // Setze den Projektor zurück
  projectionStore.reset();

  // Lade Lieder, falls noch nicht geladen
  if (songStore.songs.length === 0) {
    await songStore.loadSongs();
  }

  // Lade Setlists, falls noch nicht geladen
  if (setlistStore.setlists.length === 0) {
    setlistStore.loadSetlists();
  }

  // Prüfe, ob eine Setlist-ID in der URL angegeben ist
  const setlistId = route.query.setlistId as string | undefined;
  if (setlistId) {
    const setlist = setlistStore.setlists.find(s => s.id === setlistId);
    if (setlist && setlist.items.length > 0) {
      // Speichere die Setlist-Items für die Navigation
      setlistItems.value = setlist.items;
      currentSetlistIndex.value = 0;
      
      // Lade das erste Lied aus der Setlist
      const firstItem = setlist.items[0];
      const song = songStore.getSongById(firstItem.songId);
      if (song) {
        prepareSlides(song);
      }
      
      // Informiere das Steuerungsfenster über die geladene Setlist
      if (window.opener) {
        window.opener.postMessage({
          type: 'setlistLoaded',
          setlistId,
          totalItems: setlist.items.length
        }, window.location.origin);
      }
      
      return; // Wir haben eine Setlist geladen, also nicht weiter nach einzelnen Liedern suchen
    }
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
      // Speichere die Setlist-Items für die Navigation
      setlistItems.value = setlistStore.currentSetlist.items;
      currentSetlistIndex.value = 0;
      
      const firstItem = setlistStore.currentSetlist.items[0];
      const song = songStore.getSongById(firstItem.songId);
      if (song) {
        prepareSlides(song);
      }
    }
  }

  // Setze einen Marker, dass der Projektor geöffnet ist
  localStorage.setItem('projectorWindowOpen', 'true');

  // Event-Listener registrieren
  window.addEventListener('storage', handleStorageChange);
  window.addEventListener('message', handleMessage);
  
  // Informiere das Steuerungsfenster, dass der Projektor bereit ist
  if (window.opener) {
    window.opener.postMessage({
      type: 'projectorReady',
      songId: currentSong.value?.id,
      totalSlides: slides.value.length,
      inSetlist: setlistItems.value.length > 0,
      currentSetlistIndex: currentSetlistIndex.value,
      totalSetlistItems: setlistItems.value.length
    }, window.location.origin);
  }
  
  // Registriere dieses Fenster als das aktive Projektorfenster
  window.name = 'projector';
  
  // Setze einen Intervall, um regelmäßig zu prüfen, ob dieses Fenster noch das aktive Projektorfenster ist
  checkInterval = window.setInterval(() => {
    // Setze einen Marker, dass dieses Fenster noch aktiv ist
    localStorage.setItem('projectorWindowLastActive', Date.now().toString());
    
    // Broadcast an alle Tabs, dass dieses Fenster das aktive Projektorfenster ist
    localStorage.setItem('activeProjectorId', window.name);
  }, 1000);
});

// Cleanup beim Unmount
onUnmounted(() => {
  window.removeEventListener('message', handleMessage);
  window.removeEventListener('storage', handleStorageChange);
  
  if (checkInterval !== null) {
    window.clearInterval(checkInterval);
    checkInterval = null;
  }
  
  // Entferne den Marker, dass der Projektor geöffnet ist, wenn dieses Fenster geschlossen wird
  localStorage.removeItem('projectorWindowOpen');
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

// Benachrichtige das Steuerungsfenster, wenn sich der Slide-Index ändert
watch(() => projectionStore.currentIndex, (newIndex) => {
  if (!window.opener) return;
  try {
    window.opener.postMessage({
      type: 'slideChanged',
      currentIndex: newIndex,
      totalSlides: slides.value.length
    }, window.location.origin);
  } catch {
    // Opener ist nicht zugreifbar oder nicht same-origin; keine Nachricht senden
  }
});
</script>
