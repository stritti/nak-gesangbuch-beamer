# Build Tools Upgrade (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade der Build- und Test-Toolchain auf Vite 7, Vitest 4, vite-plugin-pwa 1.x, @vitejs/plugin-vue 6.x und @vitest/coverage-v8

**Architecture:** Hybrid-Ansatz mit zwei logischen Gruppen (Build-Tools, Test-Tools + Coverage). Jede Gruppe wird in einem eigenen Commit umgesetzt, um Abhängigkeiten zusammenzuhalten und Debugging zu erleichtern. Branch `upgrade/build-tools-2026-08` von `main`.

**Tech Stack:** Vite 7, Vitest 4, vite-plugin-pwa 1.x, @vitejs/plugin-vue 6.x, @vitest/coverage-v8, Node 24

## Global Constraints

- Node 24 (unverändert)
- Alle lokalen Checks müssen passen: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`
- Manuelle Prüfung: App startet, PWA funktioniert, Hotkeys funktionieren, ProjectionScreen rendert korrekt
- Branch: `upgrade/build-tools-2026-08` (von `main`)

---

### Task 1: Gruppe 1 – Build-Tools Upgrade

**Files:**
- Modify: `package.json` (vite, @vitejs/plugin-vue, vite-plugin-pwa Versionen)
- Modify: `vite.config.ts` (vite-plugin-pwa 1.x API, defineConfig Import)
- Modify: `index.html` (PWA-Manifest prüfen)

**Interfaces:**
- Consumes: Aktuelle `package.json` und `vite.config.ts`
- Produces: Upgraded Build-Tools, funktionierende PWA

- [ ] **Step 1: package.json – Build-Tools Versionen aktualisieren**

```json
"dependencies": {
  "vue": "^3.5.41"
},
"devDependencies": {
  "vite": "^7.2.2",
  "@vitejs/plugin-vue": "^6.0.0",
  "vite-plugin-pwa": "^1.0.0"
}
```

- [ ] **Step 2: npm install ausführen**

Run: `npm install`
Expected: Alle Pakete erfolgreich installiert

- [ ] **Step 3: vite.config.ts – vite-plugin-pwa 1.x API anpassen**

```ts
// ALT (0.16.5):
VitePWA({
  strategies: 'NetworkFirst',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
  },
  manifest: {
    name: 'NAK Gesangbuch Beamer',
    short_name: 'NAK-Beamer',
    theme_color: '#ffffff',
    icons: [...],
  },
  includeAssets: ['favicon.ico'],
  devOptions: { enabled: true },
})

// NEU (1.x):
VitePWA({
  strategy: 'NetworkFirst',
  workboxOptions: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
  },
  manifest: {
    name: 'NAK Gesangbuch Beamer',
    short_name: 'NAK-Beamer',
    theme_color: '#ffffff',
    icons: [...],
  },
  includeAssets: ['favicon.ico'],
  devOptions: { enabled: true },
})
```

- [ ] **Step 4: vite.config.ts – defineConfig Import anpassen**

```ts
// ALT:
import { defineConfig } from '@vitejs/plugin-vue'

// NEU:
import { defineConfig } from 'vite'
```

- [ ] **Step 5: index.html – PWA-Manifest prüfen**

Prüfe, dass `scope` und `start_url` im generierten Manifest korrekt sind:
- `scope: '/nak-gesangbuch-beamer/'` (für GitHub Pages)
- `start_url: '/nak-gesangbuch-beamer/'`
Falls nicht, in `vite.config.ts` anpassen:
```ts
manifest: {
  scope: '/nak-gesangbuch-beamer/',
  start_url: '/nak-gesangbuch-beamer/',
  // ...
}
```

- [ ] **Step 6: npm run build testen**

Run: `npm run build`
Expected: Build erfolgreich, keine Fehler, PWA-Assets generiert

- [ ] **Step 7: Commit**

```bash
git add package.json vite.config.ts index.html
git commit -m "chore: upgrade build tools to vite 7, @vitejs/plugin-vue 6, vite-plugin-pwa 1"
```

---

### Task 2: Gruppe 2 – Test-Tools + Coverage Upgrade

**Files:**
- Modify: `package.json` (vitest, @vitest/ui, @vitest/coverage-v8 Versionen + script)
- Modify: `vitest.config.ts` (Coverage-Konfiguration)

**Interfaces:**
- Consumes: Aktuelle `package.json` und `vitest.config.ts`
- Produces: Upgraded Test-Tools, Coverage-Konfiguration

- [ ] **Step 1: package.json – Test-Tools Versionen aktualisieren**

```json
"devDependencies": {
  "vitest": "^4.0.10",
  "@vitest/ui": "^4.0.10",
  "@vitest/coverage-v8": "^1.0.0"
}
```

- [ ] **Step 2: package.json – test:coverage script hinzufügen**

```json
"scripts": {
  "test:coverage": "vitest run --coverage"
}
```

- [ ] **Step 3: npm install ausführen**

Run: `npm install`
Expected: Alle Pakete erfolgreich installiert

- [ ] **Step 4: vitest.config.ts – Coverage-Konfiguration hinzufügen**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.spec.ts',
        '**/*.d.ts',
        'src/vite-env.d.ts',
      ],
    },
  },
})
```

- [ ] **Step 5: npm run test testen**

Run: `npm run test`
Expected: Alle 29 Tests passen

- [ ] **Step 6: npm run test:coverage testen**

Run: `npm run test:coverage`
Expected: Coverage-Report generiert (text, json, html), keine Fehler

- [ ] **Step 7: Commit**

```bash
git add package.json vitest.config.ts
git commit -m "chore: upgrade test tools to vitest 4, add @vitest/coverage-v8"
```

---

### Task 3: Verifikation

**Files:** Keine Änderungen, nur Prüfung

**Interfaces:**
- Consumes: Upgraded Build- und Test-Tools
- Produces: Bestätigung, dass alles funktioniert

- [ ] **Step 1: npm run lint**

Run: `npm run lint`
Expected: Keine Lint-Fehler

- [ ] **Step 2: npm run typecheck**

Run: `npm run typecheck`
Expected: Keine TypeScript-Fehler

- [ ] **Step 3: npm run test**

Run: `npm run test`
Expected: Alle 29 Tests passen

- [ ] **Step 4: npm run build**

Run: `npm run build`
Expected: Build erfolgreich, PWA-Assets generiert

- [ ] **Step 5: Manuelle Prüfung**

Run: `npm run dev`
Prüfe:
- [ ] App startet ohne Fehler
- [ ] PWA: Service Worker registriert (DevTools → Application → Service Workers)
- [ ] PWA: Offline-Modus funktioniert (App lädt ohne Internet)
- [ ] Hotkeys funktionieren (z. B. Pfeiltasten, Leertaste)
- [ ] ProjectionScreen rendert korrekt (Slides, Refrain, etc.)

---

### Task 4: Branch & PR

**Files:** Keine Code-Änderungen

**Interfaces:**
- Consumes: Alle Commits aus Task 1 und Task 2
- Produces: PR für Review

- [ ] **Step 1: Branch erstellen**

Run: `git checkout -b upgrade/build-tools-2026-08`

- [ ] **Step 2: Branch pushen**

Run: `git push -u origin upgrade/build-tools-2026-08`

- [ ] **Step 3: PR erstellen**

Run: `gh pr create --base main --head upgrade/build-tools-2026-08 --title "chore: upgrade build and test tools to vite 7, vitest 4, add coverage" --body "Upgrade der Build- und Test-Toolchain:

- vite 4.4.9 → 7.2.2
- @vitejs/plugin-vue 4.3.4 → 6.0.0
- vite-plugin-pwa 0.16.5 → 1.0.0
- vitest 0.34.4 → 4.0.10
- @vitest/coverage-v8 hinzugefügt

Alle Checks passen: lint, typecheck, test (29/29), build. PWA und Hotkeys manuell geprüft."`

---

## Self-Review

✅ **Spec coverage:** Alle Anforderungen aus dem Design-Spec abgedeckt (Gruppe 1, Gruppe 2, Verifikation, Branch/PR)
✅ **Placeholder scan:** Keine TBD/TODO/Placeholders
✅ **Type consistency:** Alle Dateipfade und Befehle sind korrekt
✅ **Ambiguity check:** Klare Anweisungen, keine Mehrdeutigkeiten
