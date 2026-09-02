<template>
  <div class="dashboard-page h-screen flex flex-col">
    <!-- Header -->
    <header class="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm shrink-0">
      <h1 class="text-xl font-bold dark:text-gray-100">NAK Gesangbuch Beamer</h1>
      <div class="flex items-center gap-2">
        <ThemeToggle />
        <button
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          @click="openProjector"
        >
          Projektor
        </button>
      </div>
    </header>

    <!-- Hauptbereich -->
    <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 min-h-0 overflow-hidden">
      <!-- Linke Spalte: Steuerung -->
      <div class="flex flex-col gap-4 overflow-y-auto">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <button
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-2"
            @click="openProjector"
          >
            Projektor öffnen
          </button>
          <p v-if="projectorWindow && !projectorWindow.closed" class="text-green-600 dark:text-green-400 text-sm">
            Projektor ist geöffnet
          </p>
          <p v-else class="text-red-600 dark:text-red-400 text-sm">
            Projektor ist nicht geöffnet
          </p>
        </div>

        <!-- Setlist-Navigation, falls eine Setlist aktiv ist -->
        <div v-if="inSetlist" class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
          <h3 class="text-lg font-semibold mb-2 flex items-center gap-2">
            Setlist-Navigation
            <span class="text-sm font-normal text-gray-500 dark:text-gray-400">({{ currentSetlistIndex + 1 }} / {{ totalSetlistItems }})</span>
          </h3>
          <div v-if="currentSetlist" class="mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
            <span class="font-medium">{{ getSongById(currentSetlist.items[currentSetlistIndex]?.songId)?.title || '—' }}</span>
            <span class="text-gray-500 dark:text-gray-400 ml-2">#{{ currentSetlist.items[currentSetlistIndex]?.songId ? getSongById(currentSetlist.items[currentSetlistIndex]!.songId)?.number : '' }}</span>
          </div>
          <div class="flex justify-between items-center">
            <button
              class="px-3 py-1 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50"
              :disabled="currentSetlistIndex <= 0"
              @click="handlePrevSong"
            >
              ← Vorheriges Lied
            </button>
            <button
              class="px-3 py-1 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50"
              :disabled="currentSetlistIndex >= totalSetlistItems - 1"
              @click="handleNextSong"
            >
              Nächstes Lied →
            </button>
          </div>
        </div>

        <ControlPanel
          :current-slide="currentSlide"
          :next-slide="nextSlide"
          :current-index="projectionStore.currentIndex"
          :total-slides="totalSlides"
          :is-fullscreen="projectionStore.isFullscreen"
          :placeholder-text="projectionStore.placeholderText"
          @next="handleNext"
          @prev="handlePrev"
          @blackout="handleBlackout"
          @fullscreen="handleFullscreen"
          @settings="showSettings = !showSettings"
        />

        <!-- Einstellungen -->
        <div v-if="showSettings" class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <h3 class="text-lg font-semibold mb-2">Projektionseinstellungen</h3>

          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Schriftgröße</label>
            <div class="flex items-center">
              <input
                v-model.number="projectionStore.fontSize"
                type="range"
                min="40"
                max="120"
                step="5"
                class="w-full mr-2"
              />
              <span class="text-sm">{{ projectionStore.fontSize }}px</span>
            </div>
          </div>

          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zeilenhöhe</label>
            <div class="flex items-center">
              <input
                v-model.number="projectionStore.lineHeight"
                type="range"
                min="1"
                max="2"
                step="0.1"
                class="w-full mr-2"
              />
              <span class="text-sm">{{ projectionStore.lineHeight }}</span>
            </div>
          </div>

          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max. Zeilen pro Slide</label>
            <div class="flex items-center">
              <input
                v-model.number="projectionStore.maxLinesPerSlide"
                type="range"
                min="2"
                max="8"
                step="1"
                class="w-full mr-2"
              />
              <span class="text-sm">{{ projectionStore.maxLinesPerSlide }}</span>
            </div>
          </div>

          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Farbschema</label>
            <select
              v-model="projectionStore.theme"
              class="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
            >
              <option value="high-contrast">Hoher Kontrast (Schwarz/Weiß)</option>
              <option value="dark">Dunkel</option>
              <option value="light">Hell</option>
            </select>
          </div>

          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Platzhalter-Text (leere Slides)</label>
            <input
              v-model="projectionStore.placeholderText"
              type="text"
              placeholder="z.B. Erntedank 2026"
              class="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
            />
          </div>

          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Projektor-Fenster</label>
            <div class="grid grid-cols-2 gap-2 mb-2">
              <button
                class="px-3 py-1 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                @click="setProjectorWindow('primary')"
              >
                Hauptbildschirm
              </button>
              <button
                class="px-3 py-1 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                @click="setProjectorWindow('secondary')"
              >
                Zweiter Bildschirm
              </button>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <button
                class="px-3 py-1 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                @click="setProjectorWindow('fullscreen')"
              >
                Vollbild
              </button>
              <button
                class="px-3 py-1 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                @click="setProjectorWindow('custom')"
              >
                Benutzerdefiniert
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Rechte Spalte: Bibliothek + Setlist -->
      <div class="flex flex-col gap-4 min-h-0 overflow-hidden">
        <!-- Bibliothek -->
        <section class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex flex-col min-h-0" style="flex: 1 1 55%">
          <div class="flex justify-between items-center mb-3 shrink-0">
            <h2 class="text-xl font-semibold">Bibliothek</h2>
            <button
              class="px-3 py-1.5 bg-gray-200 dark:bg-gray-600 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50"
              :disabled="songStore.loading"
              @click="importSongs"
            >
              {{ songStore.loading ? 'Wird geladen...' : 'Lieder importieren' }}
            </button>
          </div>

          <div v-if="importResults.invalid.length > 0" class="bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 p-2 mb-3 text-sm shrink-0">
            <h4 class="font-bold text-yellow-800 dark:text-yellow-200">Fehler beim Import:</h4>
            <ul class="list-disc pl-5">
              <li v-for="(invalid, index) in importResults.invalid" :key="index" class="text-yellow-800 dark:text-yellow-200">
                {{ invalid.file }}: {{ invalid.errors.join(', ') }}
              </li>
            </ul>
          </div>

          <div class="flex gap-2 mb-3 shrink-0">
            <div class="relative flex-1">
              <input
                ref="searchInput"
                v-model="searchQuery"
                type="text"
                placeholder="Suche nach Titel, Nummer oder Text..."
                class="w-full p-2 pr-8 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                @input="performSearch"
              />
              <span v-if="searchQuery" class="absolute right-2 top-2 cursor-pointer text-gray-500 dark:text-gray-400" @click="clearSearch">
                ✕
              </span>
            </div>
            <BookFilter v-model="selectedBookId" class="shrink-0" />
          </div>

          <div class="flex-1 overflow-y-auto min-h-0 -mx-2 px-2">
            <div v-if="songStore.error" class="text-red-600 dark:text-red-400 text-sm mb-2">
              {{ songStore.error }}
            </div>
            <p v-if="filteredSongs.length === 0 && !songStore.loading" class="text-gray-500 dark:text-gray-400 text-sm p-2">
              Keine Lieder gefunden.
            </p>
            <ul v-else>
              <li
                v-for="song in filteredSongs"
                :key="song.id"
                class="flex items-center gap-1 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <button
                  class="flex-1 flex items-center gap-2 px-2 py-2 text-left rounded hover:bg-gray-50 dark:hover:bg-gray-700 min-w-0"
                  :title="`${song.title} projizieren`"
                  @click="projectSong(song.id)"
                >
                  <span v-if="song.number" class="text-sm font-semibold text-gray-500 dark:text-gray-400 w-10 shrink-0">{{ song.number }}</span>
                  <span class="truncate text-sm font-medium flex-1">{{ song.title }}</span>
                  <span v-if="song.source?.buchId" class="text-xs text-blue-600 dark:text-blue-400 shrink-0 hidden sm:inline">
                    {{ getBookName(song.source.buchId) }}
                  </span>
                </button>
                <button
                  class="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded shrink-0"
                  title="Zur Setlist hinzufügen"
                  @click="addToSetlist(song.id)"
                >
                  +
                </button>
              </li>
            </ul>
          </div>
        </section>

        <!-- Setlist -->
        <section class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex flex-col min-h-0" style="flex: 1 1 45%">
          <div class="flex justify-between items-center mb-3 shrink-0">
            <h2 class="text-xl font-semibold">
              Setlist<span v-if="currentSetlist" class="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">{{ currentSetlist.name }}</span>
            </h2>
            <button
              class="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              @click="startProjection"
            >
              Projektion starten
            </button>
          </div>

          <div class="flex-1 overflow-y-auto min-h-0 -mx-2 px-2">
            <p v-if="!currentSetlist || currentSetlist.items.length === 0" class="text-gray-500 dark:text-gray-400 text-sm p-2">
              Die Setlist ist leer. Fügen Sie Lieder aus der Bibliothek hinzu.
            </p>
            <div v-else>
              <div
                v-for="(item, index) in currentSetlist.items"
                :key="`${item.songId}-${index}`"
                class="flex items-start gap-2"
              >
                <span class="text-gray-400 dark:text-gray-500 text-sm font-medium w-6 text-right pt-3 shrink-0">{{ index + 1 }}.</span>
                <div class="flex-1">
                  <SetlistItem
                    :song="getSongById(item.songId) || undefined"
                    :verse-order="item.verseIds"
                    :index="index"
                    @remove="removeFromSetlist(index)"
                    @edit="editSetlistItem(index)"
                    @reorder="reorderSetlistItem"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            class="mt-3 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm shrink-0"
            @click="focusSearch"
          >
            + Lied hinzufügen
          </button>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useProjectionStore } from '@/features/projection/projection.store';
import { useSongStore } from '@/features/songs/song.store';
import { useSetlistStore } from '@/features/setlist/setlist.store';
import ControlPanel from '@/components/ControlPanel.vue';
import SetlistItem from '@/components/SetlistItem.vue';
import BookFilter from '@/components/BookFilter.vue';
import ThemeToggle from '@/components/ThemeToggle.vue';
import type { Song } from '@/features/songs/song.types';
import { projectorWindowManager, getWindowFeatures } from '@/features/projection/projector-window';
import type { ProjectorWindowType } from '@/features/projection/projector-window';
import { buildSlides } from '@/features/projection/slides';
import { songRepository } from '@/features/songs/song.repository';
import { nakRepository } from '@/features/ingest/nak.repository';
import { getBookName } from '@/features/songs/book-names';
import { pickFiles } from '@/utils/file';

const route = useRoute();
const projectionStore = useProjectionStore();
const songStore = useSongStore();
const setlistStore = useSetlistStore();

// Steuerungs-Zustand
const slides = ref<string[][]>([]);
const currentSong = ref<Song | null>(null);
const projectorWindow = ref<Window | null>(null);
const showSettings = ref(false);

// Setlist-Zustand (Projektor-Synchronisation)
const inSetlist = ref(false);
const currentSetlistIndex = ref(0);
const totalSetlistItems = ref(0);

// Bibliotheks-Zustand
const searchQuery = ref('');
const selectedBookId = ref<string | null>(null);
const filteredSongs = ref<Song[]>([]);
const searchInput = ref<HTMLInputElement | null>(null);
type ImportResults =
  | { valid: Song[]; invalid: { file: string; errors: string[] }[] }
  | { valid: Song[]; invalid: { file: string; errors: string[] }[]; nakImport: boolean; version: string };
const importResults = ref<ImportResults>({ valid: [], invalid: [] });

// Setlist (Store-getrieben)
const currentSetlist = computed(() => setlistStore.currentSetlist);

const prepareSlides = (song: Song | null) => {
  currentSong.value = song;
  slides.value = buildSlides(song);
};

const currentSlide = computed(() => {
  if (!slides.value.length) return [];
  const index = Math.min(projectionStore.currentIndex, slides.value.length - 1);
  return slides.value[index];
});

const nextSlide = computed(() => {
  if (!slides.value.length) return [];
  const nextIndex = projectionStore.currentIndex + 1;
  if (nextIndex >= slides.value.length) return [];
  return slides.value[nextIndex];
});

const totalSlides = computed(() => slides.value.length);

const openProjector = () => {
  projectorWindow.value = projectorWindowManager.openProjectorWindow({});
};

const sendToProjector = (message: unknown): boolean => {
  return projectorWindowManager.sendMessage(projectorWindow.value, message);
};

const handleNext = () => {
  if (projectionStore.currentIndex < slides.value.length - 1) {
    projectionStore.next();
  }
  sendToProjector({ type: 'nextSlide' });
};

const handlePrev = () => {
  if (projectionStore.currentIndex > 0) {
    projectionStore.prev();
  }
  sendToProjector({ type: 'prevSlide' });
};

const handleBlackout = () => {
  projectionStore.toggleBlackout();
  sendToProjector({ type: 'blackout' });
};

const handleFullscreen = () => {
  sendToProjector({ type: 'toggleFullscreen' });
};

const handleNextSong = () => {
  sendToProjector({ type: 'nextSong' });
};

const handlePrevSong = () => {
  sendToProjector({ type: 'prevSong' });
};

const setProjectorWindow = (type: ProjectorWindowType) => {
  const features =
    type === 'custom'
      ? prompt('Fenster-Features (z.B. width=1024,height=768,left=0,top=0):', 'width=1024,height=768,left=0,top=0') ||
        'width=1024,height=768'
      : getWindowFeatures(type, { width: window.screen.width, height: window.screen.height });

  localStorage.setItem('projectorWindowFeatures', features);
  projectorWindow.value = projectorWindowManager.reopenProjectorWindow({}, features);
};

const handleMessage = (event: MessageEvent) => {
  if (event.origin !== window.location.origin) return;
  if (event.data) {
    switch (event.data.type) {
      case 'projectorReady':
        if (event.source && event.source !== window) {
          projectorWindow.value = event.source as Window;
        }
        if (event.data.inSetlist) {
          inSetlist.value = true;
          currentSetlistIndex.value = event.data.currentSetlistIndex ?? 0;
          totalSetlistItems.value = event.data.totalSetlistItems ?? 0;
        }
        if (event.data.currentIndex !== undefined) {
          projectionStore.currentIndex = event.data.currentIndex;
        }
        break;

      case 'slideChanged':
        if (event.data.currentIndex !== undefined) {
          projectionStore.currentIndex = event.data.currentIndex;
        }
        break;

      case 'fullscreenChange':
        projectionStore.setFullscreen(event.data.isFullscreen);
        break;

      case 'projectorState':
        if (event.data.inSetlist) {
          inSetlist.value = true;
          currentSetlistIndex.value = event.data.currentSetlistIndex;
          totalSetlistItems.value = event.data.totalSetlistItems;
        }
        if (event.data.currentIndex !== undefined) {
          projectionStore.currentIndex = event.data.currentIndex;
        }
        break;

      case 'setlistLoaded':
        inSetlist.value = true;
        currentSetlistIndex.value = 0;
        totalSetlistItems.value = event.data.totalItems;
        break;

      case 'setlistItemChanged':
        currentSetlistIndex.value = event.data.currentIndex;
        totalSetlistItems.value = event.data.totalItems;
        break;
    }
  }
};

// Bibliothek
const sortSongsByNumber = (songs: Song[]) => {
  return [...songs].sort((a, b) => {
    const numA = parseInt(a.number || '0', 10);
    const numB = parseInt(b.number || '0', 10);
    return numA - numB;
  });
};

const performSearch = async () => {
  if (!searchQuery.value.trim() && !selectedBookId.value) {
    filteredSongs.value = sortSongsByNumber(songStore.songs);
    return;
  }

  if (selectedBookId.value) {
    filteredSongs.value = sortSongsByNumber(await nakRepository.searchSongs(searchQuery.value, { buchId: selectedBookId.value }));
  } else {
    filteredSongs.value = sortSongsByNumber(await songRepository.searchSongs(searchQuery.value));
  }
};

const clearSearch = () => {
  searchQuery.value = '';
  performSearch();
};

watch(selectedBookId, () => {
  performSearch();
});

const importSongs = async () => {
  try {
    const files = await pickFiles('.json', true);
    if (files.length === 0) return;

    const results = await songStore.importSongs(files);
    importResults.value = results;

    // Aktualisiere die gefilterten Lieder
    filteredSongs.value = songStore.songs;
  } catch (error) {
    console.error('Fehler beim Importieren der Lieder:', error);
  }
};

const projectSong = (id: string) => {
  const song = songStore.getSongById(id);
  if (!song) return;
  projectorWindowManager.openProjectorWindow({ songId: id });
};

const addToSetlist = (id: string) => {
  const song = songStore.getSongById(id);
  if (!song) return;

  if (!setlistStore.currentSetlistId) {
    const setlist = setlistStore.createSetlist('Neue Setlist');
    setlistStore.addSongToSetlist(setlist.id, song);
  } else {
    setlistStore.addSongToSetlist(setlistStore.currentSetlistId, song);
  }
};

const focusSearch = () => {
  nextTick(() => {
    searchInput.value?.focus();
  });
};

// Setlist
const removeFromSetlist = (index: number) => {
  if (!currentSetlist.value) return;
  setlistStore.removeSongFromSetlist(currentSetlist.value.id, index);
};

const reorderSetlistItem = (fromIndex: number, toIndex: number) => {
  if (!currentSetlist.value) return;
  setlistStore.reorderSetlistItems(currentSetlist.value.id, fromIndex, toIndex);
};

const editSetlistItem = (index: number) => {
  if (!currentSetlist.value) return;
  const item = currentSetlist.value.items[index];
  const song = songStore.getSongById(item.songId);
  if (!song) return;

  // Sammle alle verfügbaren Vers-IDs des Liedes
  const allVerseIds = song.verses.map(v => v.id);
  if (song.refrain) allVerseIds.push('R');

  // Aktuelle Reihenfolge (oder Standard)
  const currentOrder = item.verseIds && item.verseIds.length > 0 
    ? [...item.verseIds] 
    : (song.verseOrder && song.verseOrder.length > 0 ? [...song.verseOrder] : [...allVerseIds]);

  // Einfacher Prompt-basierter Editor (später durch Modal ersetzbar)
  const promptText = `Strophen-Reihenfolge für "${song.title}" (kommagetrennt):\nVerfügbar: ${allVerseIds.join(', ')}\n\nAktuell: ${currentOrder.join(', ')}`;
  const newOrder = prompt(promptText);
  
  if (newOrder !== null && newOrder.trim() !== '') {
    const verseIds = newOrder.split(',').map(v => v.trim()).filter(v => v.length > 0);
    // Validiere: nur bekannte Vers-IDs erlauben
    const validVerseIds = verseIds.filter(v => allVerseIds.includes(v));
    if (validVerseIds.length > 0) {
      setlistStore.addSongToSetlist(currentSetlist.value.id, song, validVerseIds);
      // Entferne den alten Eintrag (addSongToSetlist fügt am Ende hinzu, also den alten löschen)
      const oldIndex = currentSetlist.value.items.findIndex((_i, idx) => idx === index);
      if (oldIndex >= 0 && oldIndex !== currentSetlist.value.items.length - 1) {
        setlistStore.removeSongFromSetlist(currentSetlist.value.id, oldIndex);
      }
    }
  }
};

const startProjection = () => {
  if (!currentSetlist.value || currentSetlist.value.items.length === 0) {
    alert('Die Setlist ist leer. Fügen Sie zuerst Lieder hinzu.');
    return;
  }
  projectorWindowManager.openProjectorWindow({ setlistId: currentSetlist.value.id });
};

const getSongById = (id: string) => {
  return songStore.getSongById(id);
};

onMounted(async () => {
  projectionStore.reset();

  if (songStore.songs.length === 0) {
    await songStore.loadSongs();
  }
  filteredSongs.value = sortSongsByNumber(songStore.songs);
  setlistStore.loadSetlists();

  const songId = route.query.songId as string | undefined;
  if (songId) {
    const song = songStore.getSongById(songId);
    if (song) prepareSlides(song);
  } else if (setlistStore.currentSetlist && setlistStore.currentSetlist.items.length > 0) {
    const firstItem = setlistStore.currentSetlist.items[0];
    const song = songStore.getSongById(firstItem.songId);
    if (song) prepareSlides(song);
  }

  window.addEventListener('message', handleMessage);
});

onUnmounted(() => {
  window.removeEventListener('message', handleMessage);
});

watch(() => projectionStore.currentIndex, (newIndex) => {
  if (slides.value.length > 0 && newIndex >= slides.value.length) {
    projectionStore.blackout = true;
    projectionStore.currentIndex = slides.value.length - 1;
  }
});

watch(() => projectionStore.maxLinesPerSlide, (val) => {
  prepareSlides(currentSong.value);
  sendToProjector({ type: 'updateSettings', settings: { maxLinesPerSlide: val } });
});

watch(() => projectionStore.fontSize, (val) => {
  sendToProjector({ type: 'updateSettings', settings: { fontSize: val } });
});

watch(() => projectionStore.lineHeight, (val) => {
  sendToProjector({ type: 'updateSettings', settings: { lineHeight: val } });
});

watch(() => projectionStore.theme, (val) => {
  sendToProjector({ type: 'updateSettings', settings: { theme: val } });
});
</script>

<style scoped>
@reference "../styles/tailwind.css";
</style>
