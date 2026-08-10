# NAK Gesangbuch Beamer

Web-App zur Projektion von Liedern aus dem Gesangbuch der Neuapostolischen Kirche (NAK) auf einen Beamer. Lieder werden importiert, in Setlisten organisiert und über eine Steueransicht auf einer separaten Projektor-Ansicht angezeigt.

## Funktionen

- **Liederbibliothek** – importierte Lieder durchsuchen und verwalten
- **Setlisten** – Lieder für einen Gottesdienst zusammenstellen und sortieren
- **Steuerung** – aktuelle Lieder und Strophen steuern
- **Projektor-Ansicht** – optimierte Darstellung für den Beamer (eigene URL, base-path-fähig)
- **Lokale Persistenz** – Daten bleiben im Browser (IndexedDB + Pinia-Persistenz)

## Tech-Stack

- [Vue 3](https://vuejs.org/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) als Build-Tool
- [Pinia](https://pinia.vuejs.org/) mit `pinia-plugin-persistedstate` für State-Persistenz
- [Vue Router](https://router.vuejs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vitest](https://vitest.dev/) für Unit-Tests, [Playwright](https://playwright.dev/) für E2E-Tests

## Lokale Entwicklung

Voraussetzung: Node.js (siehe `engines` in `package.json`).

```bash
npm install        # bzw. npm ci
npm run dev        # Dev-Server starten
```

### Checks

```bash
npm run lint       # ESLint
npm run typecheck  # TypeScript (tsc --noEmit)
npm run test       # Vitest (Unit-Tests)
npm run build      # Produktions-Build (vue-tsc && vite build)
npm run preview    # Build lokal ansehen
```

E2E-Tests (Playwright) laufen nur lokal:

```bash
npm run e2e
```

## CI/CD

Drei getrennte GitHub-Actions-Workflows:

| Workflow | Trigger | Zweck |
|---|---|---|
| `.github/workflows/ci.yml` | push main + PR | npm ci, commitlint, lint, typecheck, Vitest, Build; lädt `dist`-Artifact auf main hoch |
| `.github/workflows/release-please.yml` | push main | Release-PR via release-please; nach Merge: Tag `vX.Y.Z`, GitHub Release, `CHANGELOG.md` |
| `.github/workflows/deploy.yml` | `workflow_run` nach grünem CI auf main | Deploy auf GitHub Pages |

Datenfluss: `push main → CI grün → deploy.yml deployt dist → Pages`.

## Release-Prozess

- Commit-Nachrichten müssen [Conventional Commits](https://www.conventionalcommits.org/) folgen (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`, `perf:`) — enforced durch commitlint in CI.
- release-please leitet daraus Version + Changelog ab (Manifest-Modus: `release-please-config.json` + `.release-please-manifest.json`, `release-type: node`, bumped `package.json` UND `package-lock.json`).
- Ein Merge auf main erzeugt/aktualisiert einen Release-PR. Dessen Merge veröffentlicht Tag + Release + CHANGELOG.

## Deployment

- Ziel: GitHub Pages (App unter `/nak-gesangbuch-beamer/`).
- Voraussetzung (einmalig): Repo-Settings → Pages → Source **„GitHub Actions"**.
- `vite.config.ts` nutzt `base: process.env.VITE_BASE_PATH || '/'`; der CI-Build setzt auf main `VITE_BASE_PATH=/nak-gesangbuch-beamer/`.

## Projektstruktur

```
src/
├── components/   # wiederverwendbare UI-Komponenten
├── composables/  # Vue-Composables
├── features/     # Fachlogik (ingest, projection, setlist, songs)
├── pages/        # Seiten (Home, Library, Setlist, Control, Projector)
├── router/       # Vue-Router-Konfiguration
├── styles/       # Tailwind-CSS
└── utils/        # Hilfsfunktionen
```

## Lizenz

Siehe [LICENSE](LICENSE).