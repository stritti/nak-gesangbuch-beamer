# SOLID-/Clean-Code-Review & Optimierung

Datum: 2026-08-11 · Status: umgesetzt (Option B — fokussierte Modernisierung)

## Erledigte Maßnahmen

- [x] **Build:** Vitest-Konfig in `vitest.config.ts` ausgelagert; `passWithNoTests` entfernt (Task 1)
- [x] **Build:** `base` konsistent aus `loadEnv` statt `process.env` (Task 1)
- [x] **CI:** redundanter `typecheck`-Schritt entfernt (Build deckt `vue-tsc` ab) (Task 2)
- [x] **CI:** Artifact-Actions auf v7 aktualisiert (Task 2)
- [x] **PWA:** `devOptions.enabled`, Workbox-NetworkFirst-Caching für `/data`, Icon-`purpose` korrigiert (Task 3)
- [x] **Transformation:** NAK-Transformer mit engmaschigen Guards typisiert + Tests (Task 4)
- [x] **DRY:** `getBookName` (6× dupliziert) in zentralem Modul `book-names.ts` (Task 5)
- [x] **SOLID (SRP):** Slide-Aufbereitung in `buildSlides` vereinheitlicht; Vorschau = Projektor-Logik (Task 6)
- [x] **SOLID (DIP):** `ProjectorWindowManager`-Service; `utils/projection.ts` als Wrapper (Task 7)
- [x] **SOLID (SRP):** Setlist-Store in `setlist.types.ts` + `setlist.storage.ts` getrennt (Task 8)
- [x] **SOLID:** `projection.store` persistiert nur Präferenzen (`persist.pick`) (Task 8)

## Testabdeckung (neu)

29 Unit-Tests in 6 Suiten: `slideUtils`, `nakTransformer`, `book-names`, `slides`,
`projector-window` (pure Helfer), `setlist.storage` (localStorage-Mock).

## Offene Empfehlungen (nächste Schritte)

- [ ] **Major-Upgrades (Option C):** Vite 4→7/8, Vitest 0.34→4, vite-plugin-pwa 0.16→1.x, @vitejs/plugin-vue 4→6 — eng gekoppelt, gemeinsam angehen.
- [ ] `ControlPage.vue`/`ProjectorPage.vue` weiter entschlacken (Message-Protokoll als typisierte Discriminated Union).
- [ ] `ProjectionScreen.vue` Font-Fitting/Hotkeys in Composables extrahieren.
- [ ] `song.repository.ts`/`nak.repository.ts` in Fetch/Validierung/Suche/Persistenz splitten.
- [ ] `deploy.yml` auf Single-Workflow mit `needs:` konsolidieren (Optional).
- [ ] Coverage (`@vitest/coverage-v8`) nach Vitest-Upgrade ergänzen.

## Verifikation

Alle grün: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`.