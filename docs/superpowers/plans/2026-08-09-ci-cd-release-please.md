# CI/CD Pipeline + Release-please Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** CI/CD-Pipeline (checks, Build, GitHub-Pages-Deploy) und Release-please (Conventional Commits → automatische Releases) für nak-gesangbuch-beamer aufsetzen.

**Architecture:** Drei getrennte GitHub-Actions-Workflows: `ci.yml` (Checks + Build + Artifact), `release-please.yml` (Versionierung via Manifest-Konfig), `deploy.yml` (Deploy auf Pages via `workflow_run`, strikt an grünes CI gekoppelt). Build-once-Prinzip: `ci.yml` baut einmal und lädt `dist` als Artifact hoch, `deploy.yml` lädt es herunter.

**Tech Stack:** GitHub Actions, Node 24 LTS, npm, Vite 4, release-please v5 (Manifest-Modus), commitlint.

## Global Constraints

- Action-Pins (Stand 08/2026, verifiziert via Librarian): `actions/checkout@v7`, `actions/setup-node@v7`, `actions/upload-artifact@v5`, `actions/download-artifact@v5`, `actions/configure-pages@v6`, `actions/upload-pages-artifact@v5`, `actions/deploy-pages@v5`, `googleapis/release-please-action@v5`, `wagoid/commitlint-github-action@v6`.
- Node-Version: `24` (aktive LTS in Aug 2026).
- Deployment-Ziel: GitHub Pages, App-Pfad `/nak-gesangbuch-beamer/`.
- Deploy nur bei main-Push **und** erfolgreichem CI (`workflow_run` + `conclusion == 'success'`).
- Release-Regel: Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, …) — release-please leitet Version/Changelog daraus ab. commitlint erzwingt das in CI.
- `release-type: node` — release-please bumped `package.json` UND `package-lock.json`.
- E2E-Tests (Playwright) laufen **nicht** in CI — nur lokal.
- Spezifikation: `docs/superpowers/specs/2026-08-09-ci-cd-release-please-design.md`

---

### Task 1: Vite base-Pfad aus Env (`vite.config.ts`)

**Files:**
- Modify: `vite.config.ts` (innerhalb des `defineConfig`-Return-Objekts, nach `plugins: [...]`)

**Interfaces:**
- Consumes: Umgebungsvariable `VITE_BASE_PATH` (optional; gesetzt vom CI-Build auf main)
- Produces: `base` im Vite-Config-Objekt; Wert = `VITE_BASE_PATH` oder `'/'` (Fallback für PRs/lokal). Später nutzt der CI-Build (Task 3) diese Variable.

- [ ] **Step 1: Lese `vite.config.ts`**

Prüfe die aktuelle Struktur (Return-Objekt von `defineConfig`). Das Objekt beginnt aktuell mit `{ plugins: [ ... ], resolve: { ... }, test: { ... }, define: { ... } }` — Reihenfolge der Keys ist egal, aber `base` muss ein Top-Level-Key im Return-Objekt sein (nicht in `plugins`).

- [ ] **Step 2: `base` hinzufügen**

Füge im Return-Objekt von `defineConfig` direkt nach dem öffnenden `{` eine `base`-Zeile ein:

```typescript
  return {
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [
```

(Behalte die bestehende Einrückung des `plugins:`-Keys bei — aktuell ist er mit 2 Spaces eingerückt.)

- [ ] **Step 3: Verifikation — Build lokal ohne Env**

Run: `npm run build`
Expected: Build erfolgreich; prüfe in `dist/index.html`, dass Asset-URLs mit `/assets/` beginnen (kein Unterpfad).

- [ ] **Step 4: Verifikation — Build lokal mit Env**

Run: `VITE_BASE_PATH=/nak-gesangbuch-beamer/ npm run build`
Expected: Build erfolgreich; prüfe in `dist/index.html`, dass Asset-URLs mit `/nak-gesangbuch-beamer/assets/` beginnen. Danach `dist/` entfernen (wird nicht committet — prüfe `.gitignore`).

- [ ] **Step 5: Commit**

```bash
git add vite.config.ts
git commit -m "build: make vite base path configurable via env"
```

---

### Task 2: Baseline-Fix — alle Checks grün machen

**Hintergrund (Plan-Konflikt, vom Nutzer freigegeben):** Der Repo-Zustand auf `main` ist unabhängig von dieser Planarbeit gebrochen. Die CI (Task 3) führt `lint`, `typecheck`, `test`, `build` aus — alle scheitern aktuell. Dieser Task repariert die Baseline, damit die Pipeline beim ersten Lauf grün ist.

**Files:**
- Modify: `package.json` (vue-tsc-Version)
- Modify: `src/features/songs/song.types.ts` (`source`-Feld)
- Modify: `src/features/songs/song.repository.ts` (Cast + Boolean-Rückgabe)
- Modify: `src/utils/idb.ts` (Store-Typisierung)
- Modify: `src/utils/nakTransformer.ts` (Typ-Koerzionen)
- Modify: `src/utils/projection.ts` + `src/composables/useProjection.ts` (Lint: `any`→`unknown`, `_`→`void`)
- Create: `src/vite-env.d.ts` (Vue-Modul-Shim)
- Modify: `vite.config.ts` (vitest `passWithNoTests`)

**Verifikations-Gate (alle Schritte ab Task-Ende):**
Run: `npm run lint && npm run typecheck && npm run test && npm run build`
Expected: alle 4 Checks grün (Exit 0). DAS ist das Erfolgskriterium dieses Tasks.

- [ ] **Step 1: vue-tsc auf kompatible Version upgraden**

vue-tsc 1.8.27 im Lockfile ist inkompatibel mit typescript 5.9.2 (Crasht beim Start: `Search string not found: "/supportedTSExtensions = .*(?=;)/"`). Upgrade auf die aktuelle 3.x:

Run: `npm install --save-dev vue-tsc@^3.3.9`
Expected: `package.json` zeigt `"vue-tsc": "^3.3.9"`, Lockfile aktualisiert. Danach:
Run: `npx vue-tsc --noEmit 2>&1 | head -3`
Expected: kein Crash mehr (Typprüfung läuft; verbleibende echte Typpfehler sind die Schritte 2–5).

- [ ] **Step 2: `source`-Feld zum Song-Typ ergänzen**

`src/features/ingest/nak.parser.ts` schreibt `source` (mit `buchId`, `rubric`, `nummer`, `links`, `meta`), `src/features/ingest/nak.repository.ts` liest/Filtert/ sortiert danach — aber `Song` deklariert es nicht. In `src/features/songs/song.types.ts` ergänzen:

```typescript
export interface SongSource {
  buchId: string;
  rubric?: string;
  nummer: number;
  links?: { title: string; url: string }[];
  meta?: {
    taktart?: string;
    tonart?: string;
    startingPitches?: string;
    pdfPageIndex?: number;
    pdfPageCount?: number;
  };
}
```

Und in der `Song`-Interface ergänzen (alphabetisch/logisch einsortieren):
```typescript
  source?: SongSource;           // NAK-Quellbezug (Buch, Rubrik, Metadaten)
```

- [ ] **Step 3: `song.repository.ts` Casts + Boolean reparieren**

Fehler TS2352 (Zeile ~114, ~130) `{ [x: string]: {} }` → `Song`: Double-Cast verwenden:
```typescript
result.valid.push(song as unknown as Song);
```
(beide Vorkommen ersetzen).

Fehler TS2322 (Zeile ~147) `Type 'unknown' is not assignable to type 'boolean'`: Die `&&`-Kette liefert `song` (unknown) statt boolean, wenn `song` falsy ist. Rückgabe in `Boolean(...)` wrappen:
```typescript
  private isBasicSongValid(song: unknown): boolean {
    return Boolean(
      song &&
      typeof song === 'object' &&
      'id' in song &&
      typeof song.id === 'string' &&
      song.id.length > 0 &&
      'title' in song &&
      typeof song.title === 'string' &&
      song.title.length > 0 &&
      'verses' in song &&
      Array.isArray(song.verses) &&
      song.verses.length > 0 &&
      song.verses.every((verse: Record<string, unknown>) =>
        typeof verse === 'object' &&
        'id' in verse &&
        typeof verse.id === 'string' &&
        'lines' in verse &&
        Array.isArray(verse.lines) &&
        verse.lines.length > 0 &&
        verse.lines.every((line: unknown) => typeof line === 'string')
      )
    );
  }
```

- [ ] **Step 4: `idb.ts` Store-Typisierung reparieren**

Probleme: `keyof AppDB` ist wegen der DBSchema-Indexsignatur `string`, nicht die Store-Union; `StoreValue`-Typen passen nicht zu den Generics. Import erweitern und Signaturen/Casts korrigieren:

```typescript
import { openDB, DBSchema, IDBPDatabase, StoreNames, StoreValue } from 'idb';
```

Alle Parameter-Typen `keyof AppDB` → `StoreNames<AppDB>` ändern. Innere Aufrufe mit Cast versehen (Store-Werte sind `Record<string, unknown>`):

```typescript
export async function set<T>(storeName: StoreNames<AppDB>, item: T): Promise<void> {
  const db = await getDb();
  await db.put(storeName, item as StoreValue<AppDB, typeof storeName>);
}
```
```typescript
export async function setMany<T>(storeName: StoreNames<AppDB>, items: T[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  for (const item of items) {
    await store.put(item as StoreValue<AppDB, typeof storeName>);
  }
  await tx.done;
}
```
```typescript
export async function get<T>(storeName: StoreNames<AppDB>, key: string): Promise<T | undefined> {
  const db = await getDb();
  return db.get(storeName, key) as Promise<T | undefined>;
}
```
```typescript
export async function getAll<T>(storeName: StoreNames<AppDB>): Promise<T[]> {
  const db = await getDb();
  return db.getAll(storeName) as Promise<T[]>;
}
```
`remove`/`clear` analog auf `StoreNames<AppDB>` umstellen.

- [ ] **Step 5: `nakTransformer.ts` Typ-Koerzionen reparieren**

Dominante Fehlermuster (aus der Fehlerliste): unknown-typisierte `||`-/`?:`-Ausdrücke erzeugen im truthy-Zweig `{}` statt string; `filter(Boolean)` liefert weiterhin `| null`; `object`-Indexierung fehlt. Konkret:

(a) `transformNAKSong`-Return: alle Feldwerte explizit koerzieren statt auf unknown-Operatoren zu verlassen:
```typescript
  const id = nakSong.id ? String(nakSong.id) : (nakSong.number ? `nak-${nakSong.number}` : `nak-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
```
```typescript
  return {
    id,
    number: nakSong.number ? String(nakSong.number) : undefined,
    title: String(title),
    subtitle: nakSong.subtitle ? String(nakSong.subtitle) : undefined,
    language: nakSong.language ? String(nakSong.language) : 'de',
    authors: Array.isArray(nakSong.authors) ? (nakSong.authors as string[]) : (nakSong.authors ? [String(nakSong.authors)] : []),
    topics: Array.isArray(nakSong.topics) ? (nakSong.topics as string[]) : (nakSong.topics ? [String(nakSong.topics)] : []),
    copyright: nakSong.copyright ? String(nakSong.copyright) : undefined,
    verses,
    refrain,
    verseOrder,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
```

(b) `filter(Boolean)` → Typ-Prädikat, beide Vorkommen (Array-Verse ~Zeile 180 und Array-Strophen ~Zeile 220):
```typescript
      verses = nakSong.verses.map((verse: Record<string, unknown>): Verse | null => {
        if (typeof verse === 'object' && verse.id && verse.lines) {
          return {
            id: String(verse.id),
            lines: Array.isArray(verse.lines) ? (verse.lines as string[]) : [String(verse.lines)]
          };
        }
        return null;
      }).filter((v): v is Verse => v !== null);
```
(analog für `strophen`/`strophes`-Array; dort zusätzlich `strophe` vor `strophe.id`/`strophe.lines` auf `strophe !== null` prüfen und als `Record<string, unknown>` casten.)

(c) `object`-Indexierung in `transformNAKSongs` (Zeilen ~101, ~104, ~126): Index-Zugriff über Cast:
```typescript
      const nakObj = nakData as Record<string, unknown>;
```
und `nakObj[key]` bzw. `nakObj.title`, `nakObj.number`, `nakObj.verses`, `nakObj.text` verwenden. Die `in`-Checks in Zeile ~74 (`'songs' in nakData`) belassen, aber Zugriffe durch den Cast leiten.

(d) `transformNAKSongs`-Schleifen: `nakData.songs` / `nakData[key]`-Werte vor `transformNAKSong(...)` als `Record<string, unknown>` casten, da der Parameter diesen Typ verlangt.

Danach iterativ `npx tsc --noEmit` laufen lassen und verbleibende Fehler nach denselben Mustern beheben (kein `any`, kein `@ts-ignore`, keine `as any`).

- [ ] **Step 6: Vue-Modul-Shim anlegen (`src/vite-env.d.ts`)**

`npm run typecheck` läuft mit plain `tsc` (nicht vue-tsc) — `.vue`-Importe (App.vue, pages/*.vue) sind unerkannt (TS2307). Datei `src/vite-env.d.ts` neu anlegen:
```typescript
/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
```

- [ ] **Step 7: Lint-Fehler beheben (`any`→`unknown`, `_`→`void`)**

- `src/composables/useProjection.ts:85`: `(message: any)` → `(message: unknown)`
- `src/utils/projection.ts:91`: `message: any` → `message: unknown` (body: `window.postMessage` akzeptiert `any` — unknown ist kompatibel)
- `src/utils/projection.ts` (6× `const _ = X.location.href;`): Der Zweck ist ein Zugriffs-Check aufs Fenster. Ersetzen durch `void`-Ausdruck (kein unbenutztes `_` mehr):
```typescript
      void globalProjectorWindow.location.href;
```
bzw. `void existingWindow.location.href;` — die jeweilige Stelle analog.

- [ ] **Step 8: vitest `passWithNoTests` konfigurieren**

In `vite.config.ts` im `test`-Block ergänzen (es existieren 0 Testdateien; vitest bricht sonst mit Exit 1 ab):
```typescript
  test: {
    environment: 'jsdom',
    globals: true,
    passWithNoTests: true
  },
```

- [ ] **Step 9: Gate laufen lassen**

Run: `npm run lint && npm run typecheck && npm run test && npm run build`
Expected: alle 4 Checks Exit 0. Bei Fehlern iterativ beheben (nur typsaubere Fixes, keine `any`-Entschärfungen, keine `@ts-ignore`).

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json src/vite-env.d.ts src/features/songs/song.types.ts src/features/songs/song.repository.ts src/utils/idb.ts src/utils/nakTransformer.ts src/utils/projection.ts src/composables/useProjection.ts vite.config.ts
git commit -m "fix: repair broken build, type and lint baseline"
```

---

### Task 3: CI-Workflow (`ci.yml`)

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: `package.json`-Scripts (`lint`, `typecheck`, `test`, `build`), Node 24, npm-Lockfile; `VITE_BASE_PATH`-Env aus Task 1 (nur main-Build).
- Produces: Artifact `dist` (nur bei main-Push, retention 7 Tage) — konsumiert von `deploy.yml` (Task 5).

- [ ] **Step 1: Workflow-Datei anlegen**

Erstelle `.github/workflows/ci.yml` mit folgendem Inhalt:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

jobs:
  checks:
    name: Checks
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - name: Commitlint
        uses: wagoid/commitlint-github-action@v6
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test

  build:
    name: Build
    needs: checks
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - name: Build
        run: npm run build
        env:
          VITE_BASE_PATH: ${{ github.ref == 'refs/heads/main' && '/nak-gesangbuch-beamer/' || '/' }}
      - name: Upload dist artifact
        if: github.ref == 'refs/heads/main'
        uses: actions/upload-artifact@v5
        with:
          name: dist
          path: dist
          retention-days: 7
```

- [ ] **Step 2: YAML-Validierung**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml')); print('OK')"`
Expected: `OK`

- [ ] **Step 3: Actionlint (falls verfügbar)**

Run: `actionlint .github/workflows/ci.yml` (falls nicht installiert: `go run github.com/rhysd/actionlint/cmd/actionlint@latest .github/workflows/ci.yml` — nur wenn Go verfügbar; sonst Schritt überspringen und manuell prüfen)
Expected: keine Fehler

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add check and build pipeline"
```

---

### Task 4: Release-please Konfiguration + Workflow

**Files:**
- Create: `release-please-config.json`
- Create: `.release-please-manifest.json`
- Create: `.github/workflows/release-please.yml`

**Interfaces:**
- Consumes: `package.json`-Version (aktuell `0.1.0`); Conventional-Commits in der Historie.
- Produces: `CHANGELOG.md`, Git-Tags `vX.Y.Z`, GitHub Releases; bumped `package.json` + `package-lock.json` in Release-PRs.

- [ ] **Step 1: `release-please-config.json` anlegen**

```json
{
  "packages": {
    ".": {
      "release-type": "node",
      "bump-minor-pre-major": true
    }
  }
}
```

- [ ] **Step 2: `.release-please-manifest.json` anlegen**

Startversion = aktuelle `package.json`-Version (`0.1.0`):

```json
{
  ".": "0.1.0"
}
```

- [ ] **Step 3: Workflow-Datei anlegen**

Erstelle `.github/workflows/release-please.yml`:

```yaml
name: release-please

on:
  push:
    branches: [main]

permissions:
  contents: write
  pull-requests: write

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: googleapis/release-please-action@v5
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          config-file: release-please-config.json
          manifest-file: .release-please-manifest.json
```

- [ ] **Step 4: JSON/YAML-Validierung**

Run: `python3 -c "import json,yaml; json.load(open('release-please-config.json')); json.load(open('.release-please-manifest.json')); yaml.safe_load(open('.github/workflows/release-please.yml')); print('OK')"`
Expected: `OK`

- [ ] **Step 5: Konsistenz-Check Version**

Run: `node -p "require('./package.json').version"` und vergleiche mit `.release-please-manifest.json`
Expected: beide `0.1.0`

- [ ] **Step 6: Commit**

```bash
git add release-please-config.json .release-please-manifest.json .github/workflows/release-please.yml
git commit -m "ci: add release-please for automated releases"
```

---

### Task 5: Deploy-Workflow (`deploy.yml`)

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: Artifact `dist` (Name exakt aus Task 3) aus dem CI-Run, identifiziert über `github.event.workflow_run.id`; `VITE_BASE_PATH=/nak-gesangbuch-beamer/` (bereits im Build aus Task 3 gesetzt).
- Produces: GitHub Pages-Deployment (Environment `github-pages`). Manuelle Voraussetzung: Pages-Source = „GitHub Actions" (siehe AGENTS.md, Task 6).

- [ ] **Step 1: Workflow-Datei anlegen**

Erstelle `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  workflow_run:
    workflows: [CI]
    branches: [main]
    types: [completed]

permissions:
  actions: read
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Download dist artifact
        uses: actions/download-artifact@v5
        with:
          name: dist
          path: ./dist
          run-id: ${{ github.event.workflow_run.id }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v5
        with:
          path: ./dist
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v5
```

Hinweise:
- `workflows: [CI]` muss exakt dem `name:` aus Task 3 entsprechen.
- `conclusion == 'success'` auf Job-Ebene gated den Deploy strikt an grünes CI.

- [ ] **Step 2: YAML-Validierung**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml')); print('OK')"`
Expected: `OK`

- [ ] **Step 3: Konsistenz-Check Workflow-Name**

Run: `grep -n "^name:" .github/workflows/ci.yml .github/workflows/deploy.yml`
Expected: `ci.yml` zeigt `name: CI`, `deploy.yml` referenziert exakt `[CI]`.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: deploy to github pages after green ci on main"
```

---

### Task 6: `AGENTS.md` Projekt-Skill

**Files:**
- Create: `AGENTS.md`

**Interfaces:**
- Consumes: Alle bisherigen Artefakte (Task 1–5); dokumentiert den Gesamtprozess für künftige Agenten.

- [ ] **Step 1: `AGENTS.md` anlegen**

```markdown
# AGENTS.md — nak-gesangbuch-beamer

## CI/CD Pipeline

Drei getrennte GitHub-Actions-Workflows:

| Workflow | Trigger | Zweck |
|---|---|---|
| `.github/workflows/ci.yml` | push main + PR | npm ci, commitlint, lint, typecheck, Vitest, Build; lädt `dist`-Artifact auf main hoch |
| `.github/workflows/release-please.yml` | push main | Release-PR via release-please; nach Merge: Tag `vX.Y.Z`, GitHub Release, `CHANGELOG.md` |
| `.github/workflows/deploy.yml` | `workflow_run` nach grünem CI auf main | Deploy auf GitHub Pages |

Datenfluss: `push main → CI grün → deploy.yml deployt dist → Pages`.

## Release-Prozess

- Commit-Nachrichten müssen Conventional Commits folgen (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`, `perf:`) — enforced durch commitlint in CI.
- release-please leitet daraus Version + Changelog ab (Manifest-Modus: `release-please-config.json` + `.release-please-manifest.json`, `release-type: node`, bumped `package.json` UND `package-lock.json`).
- Ein Merge auf main erzeugt/aktualisiert einen Release-PR. Dessen Merge veröffentlicht Tag + Release + CHANGELOG.

## Deployment

- Ziel: GitHub Pages (App unter `/nak-gesangbuch-beamer/`).
- Voraussetzung (einmalig): Repo-Settings → Pages → Source **„GitHub Actions"**.
- `vite.config.ts` nutzt `base: process.env.VITE_BASE_PATH || '/'`; der CI-Build setzt auf main `VITE_BASE_PATH=/nak-gesangbuch-beamer/`.

## Lokale Entwicklung

- `npm install` / `npm ci`, `npm run dev`
- Checks: `npm run lint`, `npm run typecheck`, `npm run test` (Vitest), `npm run build`
- E2E (Playwright) läuft **nur lokal**: `npm run e2e` (nicht in CI enthalten)
- Dependabot: `.github/dependabot.yml` (npm + github-actions, wöchentlich)
```

- [ ] **Step 2: Konsistenz-Check**

Prüfe, dass alle referenzierten Dateien existieren: `ls .github/workflows/ release-please-config.json .release-please-manifest.json`
Expected: alle 3 Workflows + 2 JSON-Dateien vorhanden.

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "docs: add agent guide for ci/cd and release process"
```

---

### Task 7: Gesamtverifikation + Push

**Files:**
- Keine neuen Dateien — Abschluss-Check.

- [ ] **Step 1: Alle lokalen Checks laufen lassen**

Run: `npm run lint && npm run typecheck && npm run test && npm run build`
Expected: alles grün (Build mit Default-Base `/`).

- [ ] **Step 2: Workflow-Dateien final validieren**

Run: `python3 -c "import yaml; [yaml.safe_load(open(f)) for f in ['.github/workflows/ci.yml','.github/workflows/release-please.yml','.github/workflows/deploy.yml']]; print('all workflows OK')"`
Expected: `all workflows OK`

- [ ] **Step 3: Git-Status prüfen**

Run: `git status --short`
Expected: keine untracked/modified Dateien außer ggf. bereits committeten; `dist/` nicht sichtbar (gitignored).

- [ ] **Step 4: Push auf main**

```bash
git push origin main
```

- [ ] **Step 5: Nach dem Push (Server-seitig, Beobachtung)**

- `ci.yml` läuft auf dem Push und muss grün werden.
- Nach grünem CI läuft `deploy.yml`; App danach erreichbar unter `https://stritti.github.io/nak-gesangbuch-beamer/` (Voraussetzung: Pages-Source „GitHub Actions" gesetzt).
- release-please erzeugt Release-PR (nächste Version aus Conventional-Commits abgeleitet).

## Betroffene Dateien (Überblick)

| Datei | Task | Aktion |
|---|---|---|
| `vite.config.ts` | 1, 2 | ändern (base aus Env; vitest passWithNoTests) |
| `package.json` + `package-lock.json` | 2 | ändern (vue-tsc ^3.3.9) |
| `src/vite-env.d.ts` | 2 | neu |
| `src/features/songs/song.types.ts` | 2 | ändern (source-Feld) |
| `src/features/songs/song.repository.ts` | 2 | ändern (Casts, Boolean) |
| `src/utils/idb.ts` | 2 | ändern (Store-Typisierung) |
| `src/utils/nakTransformer.ts` | 2 | ändern (Typ-Koerzionen) |
| `src/utils/projection.ts`, `src/composables/useProjection.ts` | 2 | ändern (Lint) |
| `.github/workflows/ci.yml` | 3 | neu |
| `release-please-config.json` | 4 | neu |
| `.release-please-manifest.json` | 4 | neu |
| `.github/workflows/release-please.yml` | 4 | neu |
| `.github/workflows/deploy.yml` | 5 | neu |
| `AGENTS.md` | 6 | neu |
