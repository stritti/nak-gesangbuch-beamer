# AGENTS.md — nak-gesangbuch-beamer

## CI/CD Pipeline

Vier getrennte GitHub-Actions-Workflows + Dependabot-Konfiguration:

| Workflow | Trigger | Zweck |
|---|---|---|
| `.github/workflows/ci.yml` | push main + PR | npm ci, commitlint, lint, Vitest, Build — reine Verifikation (ein Job, ein npm ci) |
| `.github/workflows/release-please.yml` | push main | Release-PR via release-please; nach Merge: Tag `vX.Y.Z`, GitHub Release, `CHANGELOG.md` |
| `.github/workflows/deploy.yml` | `release: published` | Build aus Release-Tag + Deploy auf GitHub Pages |
| `.github/workflows/dependabot-auto-merge.yml` | `pull_request_target` (nur Dependabot) | Labelt Dependabot-PRs, Approve + Auto-Merge (squash) für Patch/Minor |
| `.github/dependabot.yml` | — | Dependabot-Config: npm + GitHub Actions, wöchentlich, Gruppen (minor/patch gebündelt, Major einzeln) |

Datenfluss: `push main/PR → CI grün → Release-PR → Merge → Tag+Release → deploy.yml deployt → Pages`

## Release-Prozess

- Commit-Nachrichten müssen Conventional Commits folgen (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`, `perf:`) — enforced durch commitlint in CI.
- release-please leitet daraus Version + Changelog ab (Manifest-Modus: `release-please-config.json` + `.release-please-manifest.json`, `release-type: node`, bumped `package.json` UND `package-lock.json`).
- Ein Merge auf main erzeugt/aktualisiert einen Release-PR. Dessen Merge veröffentlicht Tag + Release + CHANGELOG.

## Deployment

- Ziel: GitHub Pages (App unter `/nak-gesangbuch-beamer/`).
- Deploy **nur bei Release** (`release: published`), nicht bei jedem main-Push. Der Deploy-Workflow baut aus dem Release-Tag.
- Voraussetzung (einmalig): Repo-Settings → Pages → Source **„GitHub Actions"**; „Allow auto-merge" aktivieren (für Dependabot-Auto-Merge).
- `vite.config.ts` nutzt `base: process.env.VITE_BASE_PATH || '/'`; CI-Build auf main und Deploy-Build setzen `VITE_BASE_PATH=/nak-gesangbuch-beamer/`.

## Lokale Entwicklung

- `npm install` / `npm ci`, `npm run dev`
- Checks: `npm run lint`, `npm run typecheck`, `npm run test` (Vitest), `npm run build`
- E2E (Playwright) läuft **nur lokal**: `npm run e2e` (nicht in CI enthalten)
- Dependabot: `.github/dependabot.yml` (npm + github-actions, wöchentlich)
