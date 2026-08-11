# Design: SOLID-/Clean-Code-Review & Optimierung (App + Build-Pipelines)

Datum: 2026-08-11
Status: Genehmigt (Option B — fokussierte Modernisierung)

## 1. Kontext & Ziele

Die App `nak-gesangbuch-beamer` (Vue 3 + TypeScript + Pinia + Vite) soll anhand von
SOLID und Clean Code reviewed und gezielt optimiert werden. Framework-Best Practices
sollen eingehalten, App-Code und Build-Pipelines verbessert werden.

Zielbild (Option B): **fokussierte Modernisierung** — die größten Hotspots werden
entschärft, ohne einen riskanten Vollumbau. Major-Version-Upgrades (Vite/Vitest/PWA)
sind explizit **nicht** Teil dieses Arbeitspakets (Option C, später).

Erfolgskriterien:
- Lint, Typecheck, Unit-Tests und Build laufen grün.
- Keine Verhaltensänderung der App-Funktionen (nur strukturelle Verbesserungen).
- Redundanz in CI/Build entfernt; Konfiguration folgt Framework-Best Practices.
- Kritische Fachlogik ist unit-getestet.

## 2. Review-Findings (Basis)

### App-Code (SOLID / Clean Code)
- **H1 `src/pages/ControlPage.vue` (184–522)** — God Component: UI + Fenster-/Message-Bus-Verwaltung + Slide-Aufbereitung + Projektions-Sync + Setlist-Navigation in einer Datei.
- **H1 `src/pages/ProjectorPage.vue` (27–444)** — gleiche Duplikation wie ControlPage (Slide-Aufbereitung, Cross-Window-Messaging, Setlist-Navigation, Storage).
- **H1 `src/utils/projection.ts` (15–260)** — zustandsbehaftetes Utility, das wie eine Service-Schicht agiert (Window-Lifecycle, Cross-Tab-Messaging, Projektions-Kommandos); überlappt mit `features/projection/projection.service.ts` (kompetierende Abstraktionen).
- **H2 `src/components/ProjectionScreen.vue` (98–260)** — Rendering + Font-Fitting-Algorithmus + Hotkeys + Fullscreen + Versnavigation + DOM-Messung in einer Komponente.
- **H2 `src/features/projection/projection.store.ts`** — UI-Präferenzen und Laufzeit-Zustand vermischt.
- **H2 `src/features/songs/song.repository.ts` + `src/features/ingest/nak.repository.ts`** — Fetch, Transformation, Validierung, Import, Suche und Persistenz gebündelt.
- **H2 `src/features/setlist/setlist.store.ts`** — Domänenregeln + Persistenz + Serialisierung + Import-Validierung + direkter `localStorage`-Zugriff.
- **H2 `src/utils/nakTransformer.ts`** — sehr permissives `unknown → Song` mit viel Runtime-Branching; verschleiert ungültige Daten.
- **H3 `LibraryPage.vue`** — UI besitzt Import-Flow, Suche, Setlist-Mutation, Projektor-Navigation und hartkodierte Buchnamen-Mapping.
- **Keine Unit-/Integrationstests** vorhanden, obwohl viel Domänenlogik existiert.

### Build / Pipelines
- **CI: doppelte Typecheck-Last** — `checks`-Job läuft `tsc --noEmit`, `build`-Job läuft `npm run build` (= `vue-tsc && vite build`). Redundant.
- **Vitest-Konfig in `vite.config.ts`** — Best Practice: eigene `vitest.config.ts`.
- **`base` über `process.env.VITE_BASE_PATH`** statt aus `loadEnv` — inkonsistent.
- **PWA-Konfig minimal** — kein `devOptions.enabled`, kein explizites Workbox-Runtime-Caching für `/data`-JSON, Icon-`purpose` inkonsistent.
- **`upload-artifact@v5`/`download-artifact@v5`** — veraltet (v7/v8 aktuell).
- **`deploy.yml` über `workflow_run`** — funktioniert, aber zusätzlicher Roundtrip; nicht Teil des Umbaus (Risiko).
- **`passWithNoTests: true`** — versteckt fehlende Tests; entfernen, sobald Tests existieren.

## 3. Maßnahmen — Build & Pipelines (P1–P4)

- **P1 `vitest.config.ts` auslagern**: Test-Konfig (jsdom, globals) nach `vitest.config.ts`; `vite.config.ts` behält nur Build-Concern. `passWithNoTests` entfernen.
- **P2 `base` konsistent aus `loadEnv`**: `base: env.VITE_BASE_PATH || '/'` statt `process.env`.
- **P3 CI entzerren**: Den separaten `typecheck`-Schritt im `checks`-Job entfernen (Build via `vue-tsc` deckt es ab); `upload-artifact@v5` → `@v7` (mit `compression`/unzipped-Kompatibilität prüfen) und `download-artifact@v5` → `@v7`.
- **P4 PWA-Konfig**: `devOptions.enabled: true`, Workbox-Runtime-Caching für `/data/**` (NetworkFirst), `purpose: 'any'` beim 192er-Icon, `includeAssets` auf tatsächlich vorhandene Dateien prüfen.

## 4. Maßnahmen — App-Code (A1–A4)

- **A1 Projektions-Logik vereinheitlichen**: Eine kohärente Service-Schicht unter `features/projection/` (Window-Lifecycle, Cross-Tab-Message-Bus, Befehle); `utils/projection.ts`-Zustand dort hinein konsolidieren; `projection.service.ts` aufräumen/entfernen, wo doppelt. Keine API-Änderung nach außen, wo vermeidbar.
- **A2 Pages entschlacken**: `ControlPage`/`ProjectorPage` extrahieren gemeinsame Verantwortung in Composables (`useProjectionControls`, `useProjectorSlides` o. Ä.), Domänen-Formeln (Slide-Aufbereitung) in reine Funktionen/Service. Pages werden dünne Orchestratoren.
- **A3 Stores nach SRP trennen**: Projektions-Store in persistierte Präferenzen + transienten Laufzeit-Zustand trennen; Setlist-Store-Persistenz in eigenes Modul; hartkodierte Buchnamen-Mapping in Datenmodul.
- **A4 Repositories/Transformation entschärfen**: `nakTransformer` typisieren (prüfende Validierung statt permissivem `unknown`-Cast, Fehler früh melden); Import-/Validierungs- und Such-Pfade in getrennte Module aufteilen, wo es ohne Verhaltensänderung möglich ist.

> Umfangswächter: Nur Struktur-/Typsicherheits-Verbesserungen, keine Feature-Änderungen.
> If-Abzweigungen für NAK vs. Standard-Import bleiben inhaltlich, werden aber klarer gefasst.

## 5. Tests

- Vitest-Unit-Tests für extrahierte Domänenlogik:
  - Slide-Aufbereitung (Control/Projector gemeinsam genutzt)
  - `nakTransformer`-Validierung (gültig/ungültig/Fehlerfälle)
  - Setlist-/Projektions-Store-Logik (Pinia mit `createPinia`)
  - Message-Bus-/Window-Logik soweit isolierbar
- `passWithNoTests` ist danach entfernt; leere Suiten schlagen rot.
- Bestehende `npm run test`-Pipeline bleibt der Verifikationspfad.

## 6. Nicht-Ziele (YAGNI)

- KEINE Major-Upgrades (Vite 4→7/8, Vitest 0.34→4, vite-plugin-pwa 0.16→1.x, plugin-vue 4→6) — separat priorisieren (Option C).
- Kein Umbau `deploy.yml` auf Single-Workflow (funktioniert; eigenes Risiko).
- Keine UI-/Design-Änderungen.
- Kein E2E-Ausbau in CI (bleibt lokal, wie dokumentiert).

## 7. Verifikation

1. `npm run lint` — grün
2. `npm run typecheck` — grün (bis P3-CI-Änderung konsolidiert; lokal weiter nutzbar)
3. `npm run test` — grün, ohne `passWithNoTests`
4. `npm run build` — grün, `dist` erzeugt
5. CI-Workflows: YAML-Validierung (z. B. `actionlint` falls verfügbar), Diff-Review

## 8. Review-Bericht

Zusätzlich entsteht ein kompaktes Review-Dokument mit den priorisierten Findings
(dieser Entwurf ist die Keimzelle) — abgelegt unter `docs/reviews/`.
