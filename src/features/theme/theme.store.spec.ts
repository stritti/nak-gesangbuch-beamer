import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { nextTick } from 'vue';
import { useThemeStore } from './theme.store';

function mockMatchMedia(matches: boolean) {
  const listeners: Array<(e: MediaQueryListEvent) => void> = [];
  const mql = {
    matches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: vi.fn((_: string, cb: (e: MediaQueryListEvent) => void) => {
      listeners.push(cb);
    }),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
    _listeners: listeners
  };
  vi.stubGlobal('matchMedia', vi.fn(() => mql));
  return mql;
}

describe('theme.store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    document.documentElement.classList.remove('dark');
    // jsdom hat kein matchMedia — immer stubben, da der Store es beim Erstellen nutzt
    mockMatchMedia(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('defaults to auto mode', () => {
    const store = useThemeStore();
    expect(store.mode).toBe('auto');
  });

  it('resolves to system theme in auto mode', () => {
    mockMatchMedia(true);

    const store = useThemeStore();
    store.init();
    expect(store.resolvedMode).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('resolves to light when system prefers light', () => {
    mockMatchMedia(false);

    const store = useThemeStore();
    store.init();
    expect(store.resolvedMode).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('cycles through auto -> dark -> light -> auto', () => {
    const store = useThemeStore();
    store.cycleMode();
    expect(store.mode).toBe('dark');
    store.cycleMode();
    expect(store.mode).toBe('light');
    store.cycleMode();
    expect(store.mode).toBe('auto');
  });

  it('applies dark class when mode is dark', async () => {
    const store = useThemeStore();
    store.setMode('dark');
    await nextTick();
    expect(store.resolvedMode).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('removes dark class when mode is light', async () => {
    const store = useThemeStore();
    store.setMode('dark');
    await nextTick();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    store.setMode('light');
    await nextTick();
    expect(store.resolvedMode).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
