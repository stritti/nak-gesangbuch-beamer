import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';

export type ThemeMode = 'auto' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeClass(resolved: ResolvedTheme) {
  const root = document.documentElement;
  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>('auto');
  const systemTheme = ref<ResolvedTheme>(getSystemTheme());

  const resolvedMode = computed<ResolvedTheme>(() => {
    if (mode.value === 'auto') return systemTheme.value;
    return mode.value;
  });

  let mediaQuery: MediaQueryList | null = null;
  let mediaHandler: ((e: MediaQueryListEvent) => void) | null = null;

  function startListening() {
    if (typeof window === 'undefined' || mediaQuery) return;
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaHandler = (e: MediaQueryListEvent) => {
      systemTheme.value = e.matches ? 'dark' : 'light';
    };
    mediaQuery.addEventListener('change', mediaHandler);
  }

  function stopListening() {
    if (mediaQuery && mediaHandler) {
      mediaQuery.removeEventListener('change', mediaHandler);
      mediaQuery = null;
      mediaHandler = null;
    }
  }

  function cycleMode() {
    const order: ThemeMode[] = ['auto', 'dark', 'light'];
    const idx = order.indexOf(mode.value);
    mode.value = order[(idx + 1) % order.length];
  }

  // Alias für cycleMode — von ThemeToggle.vue verwendet
  function toggle() {
    cycleMode();
  }

  function setMode(m: ThemeMode) {
    mode.value = m;
  }

  // Apply the resolved theme to <html> whenever it changes
  watch(resolvedMode, (resolved) => {
    applyThemeClass(resolved);
  });

  // Initialize: apply stored/system theme and start listening
  function init() {
    applyThemeClass(resolvedMode.value);
    startListening();
  }

  return {
    mode,
    resolvedMode,
    cycleMode,
    toggle,
    setMode,
    init,
    stopListening,
  };
}, {
  persist: {
    pick: ['mode'],
  },
});
