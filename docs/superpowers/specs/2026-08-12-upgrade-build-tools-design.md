# Design: Phase 1 – Major-Upgrades + Coverage

**Datum:** 2026-08-12  
**Status:** Genehmigt (User)  
**Projekt:** nak-gesangbuch-beamer  
**Ziel:** Upgrade der Build- und Test-Toolchain auf aktuelle LTS/Stable-Versionen als Fundament für weitere Arbeit.

---

## Entscheidungen

| Frage | Entscheidung |
|-------|--------------|
| Umfang | Schrittweise: Upgrades zuerst |
| PR-Strategie | Ein PR für alle Upgrades + Coverage |
| Node-Version | Node 24 beibehalten |
| Vite-Version | Vite 7 (LTS) |
| Vitest-Version | Vitest 4 (aktuell) |
| Coverage-Tool | @vitest/coverage-v8 |
| vite-plugin-pwa-Version | 1.x |
| @vitejs/plugin-vue-Version | 6.x |
| Verifikation | Lokal: alle Checks + manuelle Prüfung |
| Branch-Strategie | Neuer Branch `upgrade/build-tools-2026-08` |
| Upgrade-Ansatz | Hybrid: Gruppe 1 (Build-Tools), Gruppe 2 (Test-Tools + Coverage) |

---

## Design

### Abschnitt 1 – Architektur & Umfang

**Ziel:** Upgrade der Build- und Test-Toolchain auf aktuelle LTS/Stable-Versionen.

**Umfang:**
- **Build-Tools:** vite 4.4.9 → 7.x, @vitejs/plugin-vue 4.3.4 → 6.x, vite-plugin-pwa 0.16.5 → 1.x
- **Test-Tools:** vitest 0.34.4 → 4.x, @vitest/ui 0.34.4 → 4.x, @vitest/coverage-v8 hinzufügen
- **Branch:** `upgrade/build-tools-2026-08` (von `main`)
- **PR:** Ein PR mit 2 Commits (Gruppe 1: Build-Tools, Gruppe 2: Test-Tools + Coverage)
- **Node:** 24 (unverändert)

---

### Abschnitt 2 – Gruppe 1 (Build-Tools)

**Pakete:**
- vite: ^4.4.9 → ^7.2.2
- @vitejs/plugin-vue: ^4.3.4 → ^6.0.0
- vite-plugin-pwa: ^0.16.5 → ^1.0.0

**Anpassungen:**

1. **`vite.config.ts` – vite-plugin-pwa 1.x:**
   - `strategies: 'NetworkFirst'` → `strategy: 'NetworkFirst'`
   - `workbox: {...}` → `workboxOptions: {...}`
   - `manifest: {...}` und `includeAssets` bleiben unverändert
   - `devOptions: { enabled: true }` bleibt

2. **`vite.config.ts` – @vitejs/plugin-vue 6.x:**
   - `defineConfig` kann jetzt aus `vite` importiert werden (bisher aus `@vitejs/plugin-vue`) – optional, aber empfohlen für Konsistenz

3. **`index.html` / PWA:**
   - vite-plugin-pwa 1.x setzt `scope: '/'` und `start_url: '.'` als Defaults – prüfen, ob das zum Projekt passt (aktuell: `base: '/nak-gesangbuch-beamer/'` in CI, lokal `/`)

---

### Abschnitt 3 – Gruppe 2 (Test-Tools + Coverage)

**Pakete:**
- vitest: ^0.34.4 → ^4.0.10
- @vitest/ui: ^0.34.4 → ^4.0.10
- @vitest/coverage-v8: ^1.0.0 (neu)

**Anpassungen:**

1. **`vitest.config.ts` – Vitest 4:**
   - `environment: 'jsdom'` bleibt (Vitest 4 nutzt jsdom als Default)
   - `globals: true` bleibt
   - `passWithNoTests` bereits entfernt (PR #15)
   - **Coverage-Konfiguration hinzufügen:**
     ```ts
     export default defineConfig({
       test: {
         coverage: {
           provider: 'v8',
           reporter: ['text', 'json', 'html'],
           exclude: ['node_modules/', 'dist/', '**/*.spec.ts'],
         },
       },
     })
     ```

2. **`package.json` – scripts:**
   - `test:ui` bleibt (Vitest 4 UI ist kompatibel)
   - **Neu:** `test:coverage: "vitest run --coverage"`

---

### Abschnitt 4 – Testing & Verifikation

**Lokale Checks (vor Push):**
1. `npm run lint` – ESLint
2. `npm run typecheck` – TypeScript
3. `npm run test` – alle 29 Tests
4. `npm run build` – Build + PWA

**Manuelle Prüfung:**
- `npm run dev` → App startet
- PWA: Service Worker registriert, Offline-Modus
- Hotkeys funktionieren
- ProjectionScreen rendert korrekt

**Risiken & Mitigation:**
- **Breaking Changes:** Vite 7 / vite-plugin-pwa 1.x API-Änderungen → Offizielle Migrationsguides nutzen
- **Test-Breaks:** Vitest 4 könnte Tests brechen → Lokale Tests vor Push
- **PWA-Breaks:** vite-plugin-pwa 1.x Defaults → PWA manuell prüfen

---

## Nächste Schritte

1. Branch `upgrade/build-tools-2026-08` erstellen
2. Gruppe 1 (Build-Tools) umsetzen und committen
3. Gruppe 2 (Test-Tools + Coverage) umsetzen und committen
4. Lokale Verifikation durchführen
5. PR erstellen und für Review bereitstellen
6. Nach Merge: Phase 2 (Code-Refactorings) angehen
