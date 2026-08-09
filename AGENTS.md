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
