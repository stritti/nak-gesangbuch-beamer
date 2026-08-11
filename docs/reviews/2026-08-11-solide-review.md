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

## Testabdeckung (neu)

29 Unit-Tests in 6 Suiten: `slideUtils`, `nakTransformer`, `book-names`, `slides`,
`projector-window` (pure Helfer), `setlist.storage` (localStorage-Mock).

## Offene Empfehlungen (nächste Schritte)

- **Major-Upgrades (Option C):** Vite 4→7/8, Vitest 0.34→4, vite-plugin-pwa 0.16→1.x, @vitejs/plugin-vue 4→6 — eng gekoppelt, gemeinsam angehen.
- `ControlPage.vue`/`ProjectorPage.vue` weiter entschlacken (Message-Protokoll als typisierte Discriminated Union).
- `ProjectionScreen.vue` Font-Fitting/Hotkeys in Composables extrahieren.
- `song.repository.ts`/`nak.repository.ts` in Fetch/Validierung/Suche/Persistenz splitten.
- `deploy.yml` auf Single-Workflow mit `needs:` konsolidieren (Optional).
- Coverage (`@vitest/coverage-v8`) nach Vitest-Upgrade ergänzen.

## Verifikation

Alle grün: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`.
