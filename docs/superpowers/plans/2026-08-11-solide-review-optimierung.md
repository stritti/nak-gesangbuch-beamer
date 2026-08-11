# SOLID-/Clean-Code-Review & Optimierung — Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** SOLID-/Clean-Code-Hotspots der App und der Build-Pipelines gezielt entschärfen — ohne Verhaltensänderung der App-Funktionen und ohne Major-Dependency-Upgrades.

**Architecture:** Getrennte, einzeln verifizierbare Tasks: (1) Test-/Build-Konfig säubern und Testfundament legen, (2) CI entzerren, (3) PWA-Konfig verbessern, (4) Transformation typisieren, (5) Buchnamen-Logik zentralisieren (DRY), (6) Slide-Aufbereitung vereinheitlichen, (7) Projektorfenster-Service konsolidieren, (8) Stores schärfen (SRP/Persistenz-Scope), (9) Review-Dokument + Gesamtverifikation.

**Tech Stack:** Vue 3.5 (Composition API), Pinia 3, Vite 4, Vitest 0.34 (jsdom), TypeScript 5, GitHub Actions, vite-plugin-pwa 0.16.

## Global Constraints

- **Keine Verhaltensänderung** der App-Funktionen; Ausnahme explizit benannt (Task 6 gleicht Control-Vorschau an Projektor-Logik an).
- **Keine Major-Upgrades** (Vite/Vitest/vite-plugin-pwa/plugin-vue bleiben auf aktuell installierten Versionen).
- **Keine UI-/Design-Änderungen** — nur Struktur, Typen, Konfig, Tests.
- Conventional Commits (`feat:`/`fix:`/`refactor:`/`chore:`/`test:`/`docs:`) — enforced durch commitlint.
- Jeder Task endet grün: `npm run lint && npm run test && npm run build` (ausgenommen Task 2, der nur YAML ändert → dort YAML-Parse + Diff-Review).
- Kommandozeile: Commands aus Repo-Root `/mnt/ssd/projects/nak-gesangbuch-beamer` ausführen.
- Vitest-Testdateien: `src/**/*.spec.ts`, benannt `<modul>.spec.ts` neben dem Modul.

---

### Task 1: Test-Konfig auslagern + Testfundament legen (P1)

**Files:**
- Create: `vitest.config.ts`
- Create: `src/utils/slideUtils.spec.ts`
- Modify: `vite.config.ts` (test-Block entfernen; `base` konsistent aus `loadEnv`)

**Interfaces:**
- Consumes: bestehendes `vite.config.ts` (Zeilen 49–53 test-Block, Zeile 12 base), bestehende `src/utils/slideUtils.ts` (Exporte `splitVerseIntoSlides`, `createSlidesFromVerses`).
- Produces: `vitest.config.ts` als alleinige Test-Konfiguration; `npm run test` schlägt ohne Testdateien rot (kein `passWithNoTests` mehr).

- [ ] **Step 1: `vitest.config.ts` anlegen**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.spec.ts']
  }
});
```

- [ ] **Step 2: `vite.config.ts` bereinigen**

- `test`-Block (Zeilen 49–53) entfernen.
- Zeile 12: `base: process.env.VITE_BASE_PATH || '/'` ersetzen durch `base: env.VITE_BASE_PATH || '/'`.

- [ ] **Step 3: Ersten echten Test schreiben (`src/utils/slideUtils.spec.ts`)**

```ts
import { describe, it, expect } from 'vitest';
import { splitVerseIntoSlides, createSlidesFromVerses } from './slideUtils';

describe('splitVerseIntoSlides', () => {
  it('returns empty array for empty input', () => {
    expect(splitVerseIntoSlides([], 4)).toEqual([]);
  });

  it('returns the verse as single slide when lines fit', () => {
    const lines = ['a', 'b'];
    expect(splitVerseIntoSlides(lines, 4)).toEqual([lines]);
  });

  it('splits long verses into chunks of maxLinesPerSlide', () => {
    const lines = ['1', '2', '3', '4', '5', '6'];
    expect(splitVerseIntoSlides(lines, 4)).toEqual([
      ['1', '2', '3', '4'],
      ['5', '6']
    ]);
  });
});

describe('createSlidesFromVerses', () => {
  it('returns empty array for no verses', () => {
    expect(createSlidesFromVerses([], 4)).toEqual([]);
  });

  it('flattens verse slides in order', () => {
    const verses = [
      { id: '1', lines: ['a', 'b'] },
      { id: '2', lines: ['c', 'd'] }
    ];
    expect(createSlidesFromVerses(verses, 4)).toEqual([
      ['a', 'b'],
      ['c', 'd']
    ]);
  });
});
```

- [ ] **Step 4: Tests laufen lassen**

Run: `npm run test`
Expected: 2 Suiten? Nein — nur `slideUtils.spec.ts`; alle 4 Tests PASS, Exit 0.

- [ ] **Step 5: Verifikation**

Run: `npm run typecheck && npm run build`
Expected: beide grün.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts vite.config.ts src/utils/slideUtils.spec.ts
git commit -m "chore: move vitest config to vitest.config.ts and drop passWithNoTests"
```

---

### Task 2: CI entzerren + Artifact-Actions aktualisieren (P3)

**Files:**
- Modify: `.github/workflows/ci.yml` (Zeile 30 `- run: npm run typecheck` entfernen; Zeile 49 `actions/upload-artifact@v5` → `@v7`)
- Modify: `.github/workflows/deploy.yml` (Zeile 28 `actions/download-artifact@v5` → `@v7`)

**Interfaces:**
- Consumes: bestehende Workflows (siehe oben).
- Produces: CI ohne redundanten `typecheck`-Schritt (Build führt `vue-tsc` bereits aus); Artifact-Transfer v7-konsistent (unzipped-Standard beider Actions).

- [ ] **Step 1: `ci.yml` anpassen**

- Zeile 30 (`- run: npm run typecheck`) entfernen und mit Kommentar ersetzen: `# Typecheck ist in npm run build (vue-tsc) enthalten — nicht doppelt ausführen`.
- Zeile 49: `uses: actions/upload-artifact@v5` → `uses: actions/upload-artifact@v7`.

- [ ] **Step 2: `deploy.yml` anpassen**

- Zeile 28: `uses: actions/download-artifact@v5` → `uses: actions/download-artifact@v7`.

- [ ] **Step 3: YAML validieren**

Run: `npx yaml-lint .github/workflows/ci.yml .github/workflows/deploy.yml 2>/dev/null || node -e "const fs=require('fs'); for (const f of ['.github/workflows/ci.yml','.github/workflows/deploy.yml']) { const YAML=require('js-yaml'); YAML.load(fs.readFileSync(f,'utf8')); console.log(f+': YAML OK'); }"`

Hinweis: `js-yaml` ist als transitive Abhängigkeit verfügbar; falls der Befehl fehlschlägt, genügt visueller Diff-Review. Expected: Beide Dateien parse-fähig.

- [ ] **Step 4: Diff-Review**

Run: `git diff -- .github/workflows/`
Expected: nur die zwei genannten Änderungen.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/ci.yml .github/workflows/deploy.yml
git commit -m "ci: drop redundant typecheck step and bump artifact actions to v7"
```

---

### Task 3: PWA-Konfig verbessern (P4)

**Files:**
- Modify: `vite.config.ts` (PWA-Block, Zeilen 15–42)

**Interfaces:**
- Consumes: bestehende VitePWA-Konfiguration.
- Produces: PWA mit `devOptions.enabled`, Workbox-Runtime-Caching für `/data/**`, konsistentem Icon-`purpose`.

- [ ] **Step 1: PWA-Block erweitern**

Im `VitePWA({ ... })`-Aufruf:
- `registerType: 'autoUpdate'` bleibt.
- Beim 192er-Icon `purpose: 'any'` ergänzen (analog zum 512er-Eintrag).
- Nach `manifest: {...}`-Block ergänzen:

```ts
      devOptions: {
        enabled: true
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /\/data\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'songs-data',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
```

- [ ] **Step 2: Build prüfen**

Run: `npm run build`
Expected: Build grün; `dist/` enthält `sw.js` und `manifest.webmanifest`.

- [ ] **Step 3: Manifest-Icons verifizieren**

Run: `node -e "const m=require('./dist/manifest.webmanifest'); console.log(JSON.stringify(m.icons))"`
Expected: 192er-Icon enthält `"purpose":"any"`.

- [ ] **Step 4: Commit**

```bash
git add vite.config.ts
git commit -m "feat(pwa): enable dev options, cache songs data and fix icon purpose"
```

---

### Task 4: NAK-Transformer typisieren (A4a)

**Files:**
- Modify: `src/utils/nakTransformer.ts`
- Test: `src/utils/nakTransformer.spec.ts`

**Interfaces:**
- Consumes: `Song`/`Verse` aus `@/features/songs/song.types`.
- Produces (Exporte bleiben identisch): `transformNAKSongs(nakData: unknown): Song[]`, `transformNAKSong(nakSong: Record<string, unknown>): Song` — jetzt mit geprüften Guards statt permissiver Typbehauptungen.

- [ ] **Step 1: Guard-Funktionen in `nakTransformer.ts` ergänzen**

```ts
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toLines(value: unknown): string[] | null {
  if (Array.isArray(value)) return value.map((line) => String(line));
  if (typeof value === 'string') return [value];
  return null;
}

function isNAKSongInternal(obj: unknown): obj is NAKSongInternal {
  return isRecord(obj) && 'title' in obj && 'verses' in obj;
}
```

Hinweis: Die bisherige `isNAKSongInternal`-Funktion (Zeilen 19–21) wird durch die obige ersetzt.

- [ ] **Step 2: `transformNAKSong` mit Guards entschärfen**

Alle `nakSong.verses` / `nakSong.text` / `nakSong.strophen` / `nakSong.refrain` / `nakSong.chorus`-Zweige auf `isRecord(...)`-Checks umstellen; Array-Casts durch `toLines(...)`-Aufrufe ersetzen. Konkret:

- Zeile 56 (`Object.entries(nakSong.verses)`) → nur ausführen, wenn `isRecord(nakSong.verses)`.
- Zeile 59 (`typeof verse === 'object' && verse !== null && 'id' in verse && 'lines' in verse`) → `isRecord(verse) && 'id' in verse && 'lines' in verse`.
- Zeilen 61, 77 (`(v.lines as string[])`) → `toLines(v.lines) ?? []`.
- Zeilen 87–88 (refrain/chorus) → `toLines(nakSong.refrain)` / `toLines(nakSong.chorus)` mit `?? []`-Fallback.
- Verhalten bleibt identisch; nur Typprüfungen werden engmaschiger.

- [ ] **Step 3: Tests schreiben (`src/utils/nakTransformer.spec.ts`)**

```ts
import { describe, it, expect } from 'vitest';
import { transformNAKSongs, transformNAKSong } from './nakTransformer';

describe('transformNAKSongs', () => {
  it('parses a plain array of songs', () => {
    const songs = transformNAKSongs([{ number: '1', title: 'A', verses: { 1: ['a'] } }]);
    expect(songs).toHaveLength(1);
    expect(songs[0].title).toBe('A');
  });

  it('parses an object with a songs array', () => {
    const songs = transformNAKSongs({ songs: [{ number: '2', title: 'B', verses: { 1: ['b'] } }] });
    expect(songs).toHaveLength(1);
    expect(songs[0].number).toBe('2');
  });

  it('returns empty array for garbage input', () => {
    expect(transformNAKSongs(42)).toEqual([]);
    expect(transformNAKSongs(null)).toEqual([]);
    expect(transformNAKSongs('not-json')).toEqual([]);
  });

  it('parses a JSON string', () => {
    const songs = transformNAKSongs(JSON.stringify([{ number: '3', title: 'C', verses: { 1: ['c'] } }]));
    expect(songs).toHaveLength(1);
    expect(songs[0].title).toBe('C');
  });
});

describe('transformNAKSong', () => {
  it('builds a stable id from the number', () => {
    const song = transformNAKSong({ number: '123', title: 'Lied', verses: { 1: ['x'] } });
    expect(song.id).toBe('nak-123');
  });

  it('maps verses object into Verse entries', () => {
    const song = transformNAKSong({ number: '4', title: 'D', verses: { 1: ['a', 'b'], 2: ['c'] } });
    expect(song.verses).toEqual([
      { id: '1', lines: ['a', 'b'] },
      { id: '2', lines: ['c'] }
    ]);
  });

  it('reads verse order and refrain', () => {
    const song = transformNAKSong({
      number: '5',
      title: 'E',
      verses: { 1: ['a'] },
      refrain: ['R1'],
      verseOrder: ['1', 'R']
    });
    expect(song.refrain).toEqual({ id: 'R', lines: ['R1'] });
    expect(song.verseOrder).toEqual(['1', 'R']);
  });

  it('falls back to a placeholder verse for empty content', () => {
    const song = transformNAKSong({ number: '6', title: 'F' });
    expect(song.verses).toEqual([{ id: '1', lines: ['[Keine Verse gefunden]'] }]);
  });
});
```

- [ ] **Step 4: Tests laufen lassen**

Run: `npm run test`
Expected: `nakTransformer.spec.ts` + `slideUtils.spec.ts` grün.

- [ ] **Step 5: Verifikation**

Run: `npm run typecheck && npm run build`
Expected: beide grün.

- [ ] **Step 6: Commit**

```bash
git add src/utils/nakTransformer.ts src/utils/nakTransformer.spec.ts
git commit -m "refactor: type-narrow NAK transformer guards and add tests"
```

---

### Task 5: Buchnamen-Logik zentralisieren (DRY/SRP)

**Files:**
- Create: `src/features/songs/book-names.ts`
- Create: `src/features/songs/book-names.spec.ts`
- Modify: `src/pages/LibraryPage.vue:159-168`, `src/components/SongCard.vue:93-103`, `src/components/SetlistItem.vue:76-86`, `src/components/SongDetails.vue:127-137`, `src/components/BookFilter.vue:33-43`, `src/features/ingest/nak.repository.ts:263-272`

**Interfaces:**
- Consumes: identisches Mapping in 6 Dateien (`gb/cb/jl/kl` → Gesangbuch/Chorbuch/Jugendliederbuch/Kinderliederbuch, Fallback `buchId.toUpperCase()`).
- Produces: `getBookName(buchId: string): string` als einzige Quelle.

- [ ] **Step 1: Modul anlegen (`src/features/songs/book-names.ts`)**

```ts
const BOOK_NAMES: Record<string, string> = {
  'gb': 'Gesangbuch',
  'cb': 'Chorbuch',
  'jl': 'Jugendliederbuch',
  'kl': 'Kinderliederbuch'
};

/**
 * Ermittelt den Anzeigenamen eines Buches aus seiner Buch-ID.
 * @param buchId ID des Buches (z. B. 'gb')
 * @returns Anzeigename oder die ID in Großbuchstaben
 */
export function getBookName(buchId: string): string {
  return BOOK_NAMES[buchId] || buchId.toUpperCase();
}
```

- [ ] **Step 2: Tests schreiben (`src/features/songs/book-names.spec.ts`)**

```ts
import { describe, it, expect } from 'vitest';
import { getBookName } from './book-names';

describe('getBookName', () => {
  it('maps known book ids', () => {
    expect(getBookName('gb')).toBe('Gesangbuch');
    expect(getBookName('cb')).toBe('Chorbuch');
    expect(getBookName('jl')).toBe('Jugendliederbuch');
    expect(getBookName('kl')).toBe('Kinderliederbuch');
  });

  it('falls back to uppercase id for unknown ids', () => {
    expect(getBookName('xyz')).toBe('XYZ');
  });
});
```

- [ ] **Step 3: Duplikate durch Import ersetzen**

In allen 6 Dateien die lokale `getBookName`-Funktion (inkl. `bookNames`-Objekt) entfernen und importieren:

```ts
import { getBookName } from '@/features/songs/book-names';
```

- `LibraryPage.vue`, `SongCard.vue`, `SetlistItem.vue`, `SongDetails.vue`, `BookFilter.vue`: Import oben im `<script setup>` ergänzen, lokale Funktion löschen.
- `nak.repository.ts`: private Methode `getBookName` löschen; beide Aufrufe (Zeile 95, 247) auf den Import umstellen (`import { getBookName } from '@/features/songs/book-names';` — Pfad relativ: `../songs/book-names`).

- [ ] **Step 4: Verifikation**

Run: `npm run test && npm run typecheck && npm run build`
Expected: alle grün.
Run: `rg -n "function getBookName" src/`
Expected: keine Treffer mehr (nur Export im Modul).

- [ ] **Step 5: Commit**

```bash
git add src/features/songs/book-names.ts src/features/songs/book-names.spec.ts src/pages/LibraryPage.vue src/components/SongCard.vue src/components/SetlistItem.vue src/components/SongDetails.vue src/components/BookFilter.vue src/features/ingest/nak.repository.ts
git commit -m "refactor: centralize book name mapping"
```

---

### Task 6: Slide-Aufbereitung vereinheitlichen (A2a)

**Files:**
- Create: `src/features/projection/slides.ts`
- Create: `src/features/projection/slides.spec.ts`
- Modify: `src/pages/ControlPage.vue:212-224` (prepareSlides), `src/pages/ProjectorPage.vue:46-85` (prepareSlides)

**Interfaces:**
- Consumes: `Song` aus `@/features/songs/song.types`.
- Produces: `buildSlides(song: Song | null): string[][]` — konsolidiert die **ProjectorPage-Variante** (verseOrder + refrain). Bewusste Verhaltensangleichung: ControlPage-Vorschau zeigte bisher nur `verses` ohne verseOrder/refrain; nach diesem Task zeigen beide Seiten identische Slides.

- [ ] **Step 1: Modul anlegen (`src/features/projection/slides.ts`)**

```ts
import type { Song, Verse } from '@/features/songs/song.types';

/**
 * Baut den Slide-Stream für ein Lied gemäß verseOrder (inkl. Refrain 'R').
 * Leerer Song → leeres Array.
 */
export function buildSlides(song: Song | null): string[][] {
  if (!song) return [];

  const verseOrder = song.verseOrder || song.verses.map((v) => v.id);
  const slides: string[][] = [];

  for (const verseId of verseOrder) {
    let verse: Verse | undefined;
    if (verseId === 'R' && song.refrain) {
      verse = song.refrain;
    } else {
      verse = song.verses.find((v) => v.id === verseId);
    }
    if (!verse) continue;
    slides.push(verse.lines);
  }

  return slides;
}
```

- [ ] **Step 2: Tests schreiben (`src/features/projection/slides.spec.ts`)**

```ts
import { describe, it, expect } from 'vitest';
import { buildSlides } from './slides';
import type { Song } from '@/features/songs/song.types';

const song = (overrides: Partial<Song>): Song => ({
  id: 'nak-1',
  title: 'Test',
  verses: [
    { id: '1', lines: ['Zeile 1', 'Zeile 2'] },
    { id: '2', lines: ['Zeile 3'] }
  ],
  ...overrides
});

describe('buildSlides', () => {
  it('returns empty array for null', () => {
    expect(buildSlides(null)).toEqual([]);
  });

  it('returns one slide per verse in order', () => {
    expect(buildSlides(song({}))).toEqual([
      ['Zeile 1', 'Zeile 2'],
      ['Zeile 3']
    ]);
  });

  it('respects verseOrder and inserts the refrain', () => {
    const s = song({
      refrain: { id: 'R', lines: ['Kehrvers'] },
      verseOrder: ['1', 'R', '2']
    });
    expect(buildSlides(s)).toEqual([
      ['Zeile 1', 'Zeile 2'],
      ['Kehrvers'],
      ['Zeile 3']
    ]);
  });

  it('skips unknown verse ids', () => {
    expect(buildSlides(song({ verseOrder: ['1', '99', '2'] }))).toEqual([
      ['Zeile 1', 'Zeile 2'],
      ['Zeile 3']
    ]);
  });
});
```

- [ ] **Step 3: `ControlPage.vue` umstellen**

Zeilen 212–224 (`prepareSlides`) ersetzen durch:

```ts
import { buildSlides } from '@/features/projection/slides';

// im Script: slides aus buildSlides beziehen
const prepareSlides = (song: Song | null) => {
  currentSong.value = song;
  slides.value = buildSlides(song);
};
```

Hinweis: `buildSlides(null)` liefert `[]` — der bisherige `if (!song) { slides.value = []; return; }`-Zweig entfällt. Der `Song`-Typimport (Zeile 192) bleibt.

- [ ] **Step 4: `ProjectorPage.vue` umstellen**

Zeilen 46–85 (`prepareSlides` inkl. `window.opener.postMessage`-Block) ersetzen durch:

```ts
import { buildSlides } from '@/features/projection/slides';

const prepareSlides = (song: Song | null) => {
  currentSong.value = song;
  slides.value = buildSlides(song);

  // Informiere das Steuerungsfenster über die Anzahl der Slides
  if (window.opener) {
    window.opener.postMessage({
      type: 'slidesUpdated',
      totalSlides: slides.value.length,
      currentSongId: song?.id
    }, window.location.origin);
  }
};
```

Hinweis: `Verse`-Import (Zeile 34) entfällt, wenn er nicht anderweitig genutzt wird.

- [ ] **Step 5: Verifikation**

Run: `npm run test && npm run typecheck && npm run build`
Expected: alle grün.

- [ ] **Step 6: Commit**

```bash
git add src/features/projection/slides.ts src/features/projection/slides.spec.ts src/pages/ControlPage.vue src/pages/ProjectorPage.vue
git commit -m "refactor: unify slide building between control and projector pages"
```

---

### Task 7: Projektorfenster-Service konsolidieren (A1)

**Files:**
- Create: `src/features/projection/projector-window.ts`
- Create: `src/features/projection/projector-window.spec.ts`
- Modify: `src/utils/projection.ts` → dünner Re-Export-Wrapper (alle 6 Exporte bleiben erhalten)

**Interfaces:**
- Consumes: `localStorage`-Keys `projectorWindowFeatures`, `projectorWindowOpen`, `lastProjectedSongId`, `lastProjectedSetlistId`, `lastProjectedTime`; Events `songProjected`, `setlistProjected`; `import.meta.env.BASE_URL`.
- Produces: Singleton `projectorWindowManager` (Klasse `ProjectorWindowManager`) mit identischer API wie `utils/projection.ts`:
  - `openProjectorWindow(options: { songId?: string; setlistId?: string }): Window | null`
  - `sendMessage(window: Window | null, message: unknown): boolean`
  - `isProjectorOpen(): boolean`
  - `getProjectorWindow(): Window | null`
  - `projectSong(songId: string): Window | null`
  - `projectSetlist(setlistId: string): Window | null`
  - plus pure Helfer `buildProjectorUrl(options): string` und `getWindowFeatures(type: ProjectorWindowType, size?: { width: number; height: number }, custom?: string): string`

- [ ] **Step 1: Modul anlegen (`src/features/projection/projector-window.ts`)**

```ts
/** Zuständig für Lifecycle, Auffinden und Kommunikation des Projektorfensters. */

export type ProjectorWindowType = 'primary' | 'secondary' | 'fullscreen' | 'custom';

export const PROJECTOR_WINDOW_NAME = 'projector';
const DEFAULT_WINDOW_FEATURES = 'width=1024,height=768';

/** Baut die Projektor-URL aus BASE_URL und Query-Parameter (pure). */
export function buildProjectorUrl(options: { songId?: string; setlistId?: string }): string {
  let url = `${import.meta.env.BASE_URL}projector`;
  const params = new URLSearchParams();
  if (options.songId) params.append('songId', options.songId);
  if (options.setlistId) params.append('setlistId', options.setlistId);
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

/** Liefert die Fenster-Features für einen Bildschirm-Typ (pure). */
export function getWindowFeatures(
  type: ProjectorWindowType,
  size?: { width: number; height: number },
  custom?: string
): string {
  switch (type) {
    case 'primary':
      return DEFAULT_WINDOW_FEATURES;
    case 'secondary':
      return 'width=1024,height=768,left=1920,top=0';
    case 'fullscreen':
      return size
        ? `width=${size.width},height=${size.height},top=0,left=0`
        : DEFAULT_WINDOW_FEATURES;
    case 'custom':
      return custom || DEFAULT_WINDOW_FEATURES;
  }
}

class ProjectorWindowManager {
  private globalProjectorWindow: Window | null = null;

  openProjectorWindow(options: { songId?: string; setlistId?: string }): Window | null {
    const url = buildProjectorUrl(options);
    const windowFeatures = localStorage.getItem('projectorWindowFeatures') || DEFAULT_WINDOW_FEATURES;

    if (this.globalProjectorWindow && !this.globalProjectorWindow.closed) {
      try {
        void this.globalProjectorWindow.location.href;
        this.globalProjectorWindow.location.href = url;
        this.globalProjectorWindow.focus();
        return this.globalProjectorWindow;
      } catch {
        this.globalProjectorWindow = null;
      }
    }

    try {
      const existingWindow = window.open('', PROJECTOR_WINDOW_NAME);
      if (existingWindow && !existingWindow.closed) {
        void existingWindow.location.href;
        existingWindow.location.href = url;
        existingWindow.focus();
        this.globalProjectorWindow = existingWindow;
        localStorage.setItem('projectorWindowOpen', 'true');
        return this.globalProjectorWindow;
      }
    } catch {
      // Fenster nicht zugreifbar — neues Fenster öffnen
    }

    this.globalProjectorWindow = window.open(url, PROJECTOR_WINDOW_NAME, windowFeatures);
    if (this.globalProjectorWindow) {
      localStorage.setItem('projectorWindowOpen', 'true');
      this.globalProjectorWindow.focus();
    }
    return this.globalProjectorWindow;
  }

  sendMessage(windowRef: Window | null, message: unknown): boolean {
    const candidates: Array<Window | null> = [windowRef, this.globalProjectorWindow, this.getProjectorWindow()];
    for (const win of candidates) {
      if (win && !win.closed) {
        try {
          win.postMessage(message, self.location.origin);
          return true;
        } catch (error) {
          console.error('Fehler beim Senden der Nachricht an das Projektorfenster:', error);
          this.globalProjectorWindow = null;
        }
      }
    }
    return false;
  }

  isProjectorOpen(): boolean {
    if (this.globalProjectorWindow && !this.globalProjectorWindow.closed) {
      try {
        void this.globalProjectorWindow.location.href;
        return true;
      } catch {
        this.globalProjectorWindow = null;
        localStorage.removeItem('projectorWindowOpen');
        return false;
      }
    }

    try {
      const projectorWindow = window.open('', PROJECTOR_WINDOW_NAME);
      if (projectorWindow && !projectorWindow.closed) {
        void projectorWindow.location.href;
        this.globalProjectorWindow = projectorWindow;
        return true;
      }
    } catch {
      // Fenster nicht zugreifbar
    }

    localStorage.removeItem('projectorWindowOpen');
    return false;
  }

  getProjectorWindow(): Window | null {
    if (this.globalProjectorWindow && !this.globalProjectorWindow.closed) {
      try {
        void this.globalProjectorWindow.location.href;
        this.globalProjectorWindow.focus();
        return this.globalProjectorWindow;
      } catch {
        this.globalProjectorWindow = null;
      }
    }

    try {
      const existingWindow = window.open('', PROJECTOR_WINDOW_NAME);
      if (existingWindow && !existingWindow.closed) {
        void existingWindow.location.href;
        this.globalProjectorWindow = existingWindow;
        this.globalProjectorWindow.focus();
        return this.globalProjectorWindow;
      }
    } catch {
      // Fenster nicht zugreifbar — neues Fenster öffnen
    }

    const windowFeatures = localStorage.getItem('projectorWindowFeatures') || DEFAULT_WINDOW_FEATURES;
    this.globalProjectorWindow = window.open(
      `${import.meta.env.BASE_URL}projector`,
      PROJECTOR_WINDOW_NAME,
      windowFeatures
    );
    if (this.globalProjectorWindow) {
      localStorage.setItem('projectorWindowOpen', 'true');
      this.globalProjectorWindow.focus();
    }
    return this.globalProjectorWindow;
  }

  projectSong(songId: string): Window | null {
    const projectorWindow = this.openProjectorWindow({ songId });
    try {
      localStorage.setItem('lastProjectedSongId', songId);
      localStorage.setItem('lastProjectedTime', Date.now().toString());
      window.dispatchEvent(new CustomEvent('songProjected', { detail: { songId } }));
    } catch (error) {
      console.error('Fehler beim Senden der Projektion-Nachricht:', error);
    }
    return projectorWindow;
  }

  projectSetlist(setlistId: string): Window | null {
    const projectorWindow = this.openProjectorWindow({ setlistId });
    try {
      localStorage.setItem('lastProjectedSetlistId', setlistId);
      localStorage.setItem('lastProjectedTime', Date.now().toString());
      window.dispatchEvent(new CustomEvent('setlistProjected', { detail: { setlistId } }));
    } catch (error) {
      console.error('Fehler beim Senden der Projektion-Nachricht:', error);
    }
    return projectorWindow;
  }
}

export const projectorWindowManager = new ProjectorWindowManager();
```

Hinweis: Die bisherige Kandidaten-Logik von `sendMessageToProjector` (explizit → global → gefundenes Fenster) ist im `sendMessage`-Loop oben **in gleicher Reihenfolge** abgebildet.

- [ ] **Step 2: `src/utils/projection.ts` auf Re-Export reduzieren**

Gesamten bisherigen Inhalt ersetzen durch:

```ts
/**
 * Rückwärtskompatibler Wrapper um den Projektorfenster-Manager.
 * Neue Nutzung: direkt über '@/features/projection/projector-window'.
 */
export {
  projectorWindowManager,
  buildProjectorUrl,
  getWindowFeatures,
  PROJECTOR_WINDOW_NAME
} from '@/features/projection/projector-window';
export type { ProjectorWindowType } from '@/features/projection/projector-window';

export function openProjectorWindow(options: { songId?: string; setlistId?: string }): Window | null {
  return projectorWindowManager.openProjectorWindow(options);
}
export function sendMessageToProjector(window: Window | null, message: unknown): boolean {
  return projectorWindowManager.sendMessage(window, message);
}
export function isProjectorOpen(): boolean {
  return projectorWindowManager.isProjectorOpen();
}
export function getProjectorWindow(): Window | null {
  return projectorWindowManager.getProjectorWindow();
}
export function projectSong(songId: string): Window | null {
  return projectorWindowManager.projectSong(songId);
}
export function projectSetlist(setlistId: string): Window | null {
  return projectorWindowManager.projectSetlist(setlistId);
}
```

- [ ] **Step 3: Tests schreiben (`src/features/projection/projector-window.spec.ts`)**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildProjectorUrl, getWindowFeatures } from './projector-window';

describe('buildProjectorUrl', () => {
  it('builds base url without params', () => {
    expect(buildProjectorUrl({})).toBe('/projector');
  });

  it('appends songId param', () => {
    expect(buildProjectorUrl({ songId: 'nak-1' })).toBe('/projector?songId=nak-1');
  });

  it('appends setlistId param', () => {
    expect(buildProjectorUrl({ setlistId: 'abc' })).toBe('/projector?setlistId=abc');
  });
});

describe('getWindowFeatures', () => {
  it('returns default features for primary', () => {
    expect(getWindowFeatures('primary')).toBe('width=1024,height=768');
  });

  it('offsets secondary window to the right', () => {
    expect(getWindowFeatures('secondary')).toBe('width=1024,height=768,left=1920,top=0');
  });

  it('uses screen size for fullscreen', () => {
    expect(getWindowFeatures('fullscreen', { width: 1920, height: 1080 })).toBe(
      'width=1920,height=1080,top=0,left=0'
    );
  });

  it('uses custom features or falls back', () => {
    expect(getWindowFeatures('custom', undefined, 'width=800,height=600')).toBe('width=800,height=600');
    expect(getWindowFeatures('custom')).toBe('width=1024,height=768');
  });
});
```

Hinweis: Der Rest (Window-Manager-Instanz) ist browsergebunden und wird nicht unit-getestet — bewusst, da jsdom keinen echten `window.open` liefert.

- [ ] **Step 4: Verifikation**

Run: `npm run test && npm run typecheck && npm run build`
Expected: alle grün. `src/composables/useProjection.ts` und `src/pages/ControlPage.vue` importieren weiterhin aus `@/utils/projection` und müssen **unverändert** funktionieren (keine Signaturen gebrochen).

- [ ] **Step 5: Commit**

```bash
git add src/features/projection/projector-window.ts src/features/projection/projector-window.spec.ts src/utils/projection.ts
git commit -m "refactor: consolidate projector window handling into a service"
```

---

### Task 8: Stores schärfen (SRP/Persistenz-Scope) (A3)

**Files:**
- Create: `src/features/setlist/setlist.types.ts`
- Create: `src/features/setlist/setlist.storage.ts`
- Create: `src/features/setlist/setlist.storage.spec.ts`
- Modify: `src/features/setlist/setlist.store.ts`
- Modify: `src/features/projection/projection.store.ts` (persist-scope)

**Interfaces:**
- Consumes: bisherige Store-APIs (`useSetlistStore`, `useProjectionStore`) bleiben vollständig erhalten (Konsumenten unverändert).
- Produces:
  - `src/features/setlist/setlist.types.ts`: Exporte `SetlistItem`, `Setlist`.
  - `src/features/setlist/setlist.storage.ts`: `loadSetlistsFromStorage(storage?: Pick<Storage, 'getItem'>): Setlist[]`, `saveSetlistsToStorage(setlists: Setlist[], storage?: Pick<Storage, 'setItem'>): void`.
  - `projection.store.ts`: `persist` nur noch für Präferenzfelder.

- [ ] **Step 1: Typen extrahieren (`src/features/setlist/setlist.types.ts`)**

```ts
export interface SetlistItem {
  songId: string;
  verseIds: string[]; // IDs der Verse in der Reihenfolge, wie sie angezeigt werden sollen
}

export interface Setlist {
  id: string;
  name: string;
  items: SetlistItem[];
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 2: Storage-Modul anlegen (`src/features/setlist/setlist.storage.ts`)**

```ts
import type { Setlist } from './setlist.types';

const STORAGE_KEY = 'setlists';

export function loadSetlistsFromStorage(storage: Pick<Storage, 'getItem'> = localStorage): Setlist[] {
  const stored = storage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as Setlist[]) : [];
  } catch (error) {
    console.error('Fehler beim Laden der Setlists:', error);
    return [];
  }
}

export function saveSetlistsToStorage(setlists: Setlist[], storage: Pick<Storage, 'setItem'> = localStorage): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(setlists));
}
```

- [ ] **Step 3: Tests schreiben (`src/features/setlist/setlist.storage.spec.ts`)**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { loadSetlistsFromStorage, saveSetlistsToStorage } from './setlist.storage';
import type { Setlist } from './setlist.types';

function createMockStorage() {
  let store = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { store.set(key, value); }),
    _store: store
  };
}

describe('setlist.storage', () => {
  let storage: ReturnType<typeof createMockStorage>;

  beforeEach(() => {
    storage = createMockStorage();
  });

  it('loads empty array when nothing stored', () => {
    expect(loadSetlistsFromStorage(storage)).toEqual([]);
  });

  it('round-trips setlists', () => {
    const setlist: Setlist = {
      id: 'a1',
      name: 'Sonntag',
      items: [{ songId: 'nak-1', verseIds: ['1', 'R'] }],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    };
    saveSetlistsToStorage([setlist], storage);
    expect(loadSetlistsFromStorage(storage)).toEqual([setlist]);
  });

  it('returns empty array for corrupt JSON', () => {
    storage._store.set('setlists', '{kaputt');
    expect(loadSetlistsFromStorage(storage)).toEqual([]);
  });
});
```

Hinweis: `vi` ist global verfügbar (`globals: true` in vitest.config). Falls der Import fehlt, `import { vi } from 'vitest';` ergänzen.

- [ ] **Step 4: `setlist.store.ts` umstellen**

- `SetlistItem`/`Setlist`-Interfaces (Zeilen 4–15) entfernen, Import ergänzen:

```ts
import type { Setlist, SetlistItem } from './setlist.types';
import { loadSetlistsFromStorage, saveSetlistsToStorage } from './setlist.storage';
```

- `saveSetlists()` (Zeilen 124–126): `this.setlists = ...` → `saveSetlistsToStorage(this.setlists);`
- `loadSetlists()` (Zeilen 129–138): komplett ersetzen durch `this.setlists = loadSetlistsFromStorage();`
- `Song`-Import (Zeile 2) bleibt.

- [ ] **Step 5: `projection.store.ts` Persistenz-Scope schärfen**

Zeile 63: `persist: true` → `persist: { pick: ['fontSize', 'lineHeight', 'theme', 'maxLinesPerSlide'] }`.

Hinweis: `isFullscreen`, `blackout`, `currentIndex` werden nicht mehr persistiert (transienter Laufzeit-Zustand).

- [ ] **Step 6: Verifikation**

Run: `npm run test && npm run typecheck && npm run build`
Expected: alle grün.

- [ ] **Step 7: Commit**

```bash
git add src/features/setlist/setlist.types.ts src/features/setlist/setlist.storage.ts src/features/setlist/setlist.storage.spec.ts src/features/setlist/setlist.store.ts src/features/projection/projection.store.ts
git commit -m "refactor: split setlist storage into module and scope projection persistence"
```

---

### Task 9: Review-Dokument + Gesamtverifikation

**Files:**
- Create: `docs/reviews/2026-08-11-solide-review.md`

**Interfaces:**
- Consumes: umgesetzte Maßnahmen aus Tasks 1–8.
- Produces: Review-Dokument mit Findings, umgesetzten Maßnahmen und offenen Empfehlungen.

- [ ] **Step 1: Review-Dokument anlegen (`docs/reviews/2026-08-11-solide-review.md`)**

```markdown
# SOLID-/Clean-Code-Review & Optimierung

Datum: 2026-08-11 · Status: umgesetzt (Option B — fokussierte Modernisierung)

## Findings & umgesetzte Maßnahmen

| Bereich | Finding | Maßnahme | Task |
|---|---|---|---|
| Build | `passWithNoTests` versteckte fehlende Tests | Vitest-Konfig in `vitest.config.ts`; Option entfernt | 1 |
| Build | `base` las `process.env` statt `loadEnv` | konsistent aus `env` | 1 |
| CI | doppelter Typecheck (tsc + vue-tsc) | `typecheck`-Schritt im CI entfernt | 2 |
| CI | veraltete Artifact-Actions v5 | upload/download auf v7 | 2 |
| PWA | keine Dev-PWA, kein Daten-Caching | `devOptions.enabled`, Workbox NetworkFirst für `/data` | 3 |
| Transformation | permissives `unknown → Song` | engmaschige Guards + Tests | 4 |
| DRY | `getBookName` 6× dupliziert | zentrales Modul `book-names.ts` | 5 |
| SOLID (SRP) | Slide-Logik in 2 Pages dupliziert & inkonsistent | `buildSlides` pur; Vorschau = Projektor-Logik | 6 |
| SOLID (DIP) | zustandsbehaftetes `utils/projection.ts` | `ProjectorWindowManager`-Service; util als Wrapper | 7 |
| SOLID (SRP) | Setlist-Store mit Storage vermischt | `setlist.types.ts` + `setlist.storage.ts` | 8 |
| SOLID | `projection.store` persistierte Laufzeit-Zustand | `persist.pick` auf Präferenzen | 8 |

## Offene Empfehlungen (nächste Schritte)

- **Major-Upgrades (Option C):** Vite 4→7/8, Vitest 0.34→4, vite-plugin-pwa 0.16→1.x, @vitejs/plugin-vue 4→6 — eng gekoppelt, gemeinsam angehen.
- `ControlPage.vue`/`ProjectorPage.vue` weiter entschlacken (Message-Protokoll als typisierte Discriminated Union).
- `ProjectionScreen.vue` Font-Fitting/Hotkeys in Composables extrahieren.
- `song.repository.ts`/`nak.repository.ts` in Fetch/Validierung/Suche/Persistenz splitten.
- `deploy.yml` auf Single-Workflow mit `needs:` konsolidieren (Optional).
- Coverage (`@vitest/coverage-v8`) nach Vitest-Upgrade ergänzen.

## Verifikation

Alle grün: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`.
```

- [ ] **Step 2: Gesamtverifikation**

Run: `npm run lint && npm run typecheck && npm run test && npm run build`
Expected: alle vier Kommandos Exit 0.

- [ ] **Step 3: Arbeitsstand prüfen**

Run: `git status --short && git log --oneline -12`
Expected: 9 sinnvolle Commits; kein ungetrackter Code (außer gewollt).

- [ ] **Step 4: Commit**

```bash
git add docs/reviews/2026-08-11-solide-review.md
git commit -m "docs: add SOLID review report"
```

---

## Self-Review

- **Spec-Coverage:** P1 (T1), P2 (T1), P3 (T2), P4 (T3), A4a (T4), DRY-Buchnamen (T5), A2a Slides (T6), A1 (T7), A3 (T8), Review-Dokument + Verifikation (T9) — alle Maßnahmen abgedeckt. Bewusst zurückgestellt (Nicht-Ziele): Major-Upgrades, `deploy.yml`-Single-Workflow, `ProjectionScreen`-Entlastung, Repository-Splits, UI-Änderungen — als offene Empfehlungen im Review-Dokument festgehalten.
- **Platzhalter:** keine; jede Code-Steps enthält konkreten Code. Bei T2 entfällt lokale Testausführung (reine YAML-Änderung) — Verifikation über YAML-Parse + Diff, wie im Task angegeben.
- **Typkonsistenz:** `buildSlides` (T6) → genutzt in beiden Pages; `projectorWindowManager`-API (T7) → `utils/projection.ts`-Wrapper hält die 6 bisherigen Signaturen stabil; `Setlist`/`SetlistItem` (T8) → Storage + Store importieren aus `setlist.types.ts`; `getBookName` (T5) → einheitlich in allen 6 Dateien.
