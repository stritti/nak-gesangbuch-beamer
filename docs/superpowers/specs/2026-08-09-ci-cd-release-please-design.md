# CI/CD Pipeline + Release-please — Design

Datum: 2026-08-09
Projekt: nak-gesangbuch-beamer (Vite + Vue 3 + TypeScript PWA, npm, GitHub `stritti/nak-gesangbuch-beamer`)

## Ausgangslage

- Es existiert **keine** CI/CD-Pipeline (kein `.github/workflows`, keine anderen CI-Konfigurationen).
- Keine Git-Tags, keine Releases bisher.
- Conventional Commits (`feat:`, `fix:`, `chore:`, …) sind bereits etabliert (commitlint konfiguriert) — ideale Voraussetzung für release-please.
- App ist eine PWA (Beamer-Steuerung + Projektion), läuft rein im Browser.

## Ziele & Entscheidungen (mit Nutzer abgestimmt)

| Thema | Entscheidung |
|---|---|
| Deployment | GitHub Pages (PWA) |
| Deploy-Trigger | Release-PR (release-please) + Deploy bei **jedem** main-Push |
| E2E-Tests | Nur lokal; CI: lint, typecheck, Vitest, Build |
| Projekt-Skill | `AGENTS.md` im Repo dokumentiert Pipeline & Release-Prozess |
| Ansatz | Drei getrennte Workflows (CI / Release / Deploy), Build-once, Deploy strikt an grünes CI gekoppelt |

## Architektur

```
push main / PR ──► ci.yml (checks + build + dist-Artifact)
                      │ (workflow_run, nur main, bei conclusion success)
                      ▼
push main ──► release-please.yml ──► Release-PR ──► Merge ──► Tag + Release + CHANGELOG.md
              deploy.yml ──► GitHub Pages (gh-pages-Umgebung)
```

Drei unabhängige Concerns, sauber getrennt:
1. **Checks/Build** (`ci.yml`)
2. **Versionierung/Releases** (`release-please.yml`)
3. **Deployment** (`deploy.yml`)

## Komponenten

### 1. `.github/workflows/ci.yml`

- Trigger: `push` (main) + `pull_request` (main)
- Job `checks`:
  - `actions/checkout@v7` (fetch-depth: 0 — nötig für commitlint über Commit-Historie)
  - `actions/setup-node@v7` (Node 24 LTS, npm-Cache via `cache: npm`)
  - `npm ci`
  - commitlint: `wagoid/commitlint-github-action@v6` (validiert PR-Titel + gepushte Commits gegen `@commitlint/config-conventional` — default)
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test` (Vitest)
- Job `build` (`needs: checks`):
  - `npm run build`
  - Bei main: `dist/` als Artifact hochladen (`actions/upload-artifact@v5`) für den Deploy-Workflow; env `VITE_BASE_PATH=/nak-gesangbuch-beamer/`
  - Bei PR: nur Build als Check (kein Artifact-Upload)
- `concurrency`: `cancel-in-progress: true` für PRs (bei main nicht abbrechen, sonst Artifact/Run-Konflikte)

### 2. `.github/workflows/release-please.yml`

- Trigger: `push` (main)
- Step: `googleapis/release-please-action@v5` mit `token: secrets.GITHUB_TOKEN`, `release-type: node`, Manifest-Konfiguration
- Erzeugt/aktualisiert den Release-PR; nach Merge: Tag `vX.Y.Z`, GitHub Release, `CHANGELOG.md`
- Bump von `package.json` **und** `package-lock.json` (release-please v4+/v5: `release-type: node` erledigt beides)

### 3. Konfigurationsdateien für release-please

- `release-please-config.json`:
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
- `.release-please-manifest.json`:
  ```json
  { ".": "0.1.0" }
  ```
  (Startwert = aktuelle Version in `package.json`)

### 4. `.github/workflows/deploy.yml`

- Trigger: `workflow_run` (`ci.yml`, `branches: [main]`), Guard: `conclusion == 'success'`
- `permissions`: `contents: read`, `pages: write`, `id-token: write`
- `environment`: `github-pages`
- Steps:
  - `actions/download-artifact@v5` (dist-Artifact, per Name)
  - `actions/upload-pages-artifact@v5`
  - `actions/deploy-pages@v5`
- `concurrency`: Gruppe `pages`, `cancel-in-progress: true` (nur neuester Deploy gewinnt)

### 5. `vite.config.ts` (Anpassung)

- `base: process.env.VITE_BASE_PATH || '/'`
- CI-Build auf main setzt `VITE_BASE_PATH=/nak-gesangbuch-beamer/`, damit Assets/PWA-SW unter dem GitHub-Pages-Unterpfad korrekt auflösen.

### 6. `AGENTS.md`

Projekt-Skill (für künftige Agenten):
- Pipeline-Überblick (3 Workflows, Trigger, Datenfluss)
- Release-Prozess: Conventional Commits → release-please → Release-PR → Tag/Release/CHANGELOG
- Deploy-Mechanik (workflow_run, Pages-Umgebung, base-Path)
- Lokale Entwicklung & Verifikation (`npm run lint/typecheck/test/build`; E2E nur lokal)
- Manuelle Voraussetzung: Pages-Source = „GitHub Actions“

## Fehlerbehandlung

- **Deploy nie bei rotem CI**: `workflow_run` + `conclusion == 'success'` verhindert Deployment nach fehlgeschlagenen Checks.
- **Kein Deploy-Spaghetti**: kein Deploy-Trigger auf Tags/Releases, nur main-Push — eine klare Quelle für den aktuellen Stand.
- **commitlint als CI-Gate**: hält die Conventional-Commit-Konvention (release-please-Vertrag) durch — verhindert fehlgeschlagene Release-PRs.
- **Parallele Deploys**: `concurrency`-Gruppe verhindert Race Conditions bei schnellen aufeinanderfolgenden main-Pushes.

## Test-/Verifikationsstrategie

- Lokale YAML-Validierung + `actionlint` (falls verfügbar) für alle drei Workflows.
- `release-please-config.json` / `.release-please-manifest.json`: JSON-Validierung, Konsistenz mit `package.json` (0.1.0).
- `vite.config.ts`: Build lokal mit und ohne `VITE_BASE_PATH`, prüfen dass `base` korrekt gesetzt wird.
- Funktionsnachweis erst nach Push auf main (Workflows laufen server-seitig):
  - `ci.yml` grün auf main und PRs
  - release-please erzeugt Release-PR → nach Merge Tag + Release + CHANGELOG
  - `deploy.yml` deployt nach main-Push → App erreichbar unter `https://stritti.github.io/nak-gesangbuch-beamer/`
- **Einmalige manuelle Voraussetzung (Nutzer)**: Repo-Settings → Pages → Source **„GitHub Actions"**. Optional: Branch-Protection auf main („CI checks must pass").

## Betroffene Dateien

| Datei | Aktion |
|---|---|
| `.github/workflows/ci.yml` | neu |
| `.github/workflows/release-please.yml` | neu |
| `.github/workflows/deploy.yml` | neu |
| `release-please-config.json` | neu |
| `.release-please-manifest.json` | neu |
| `vite.config.ts` | ändern (base aus Env) |
| `AGENTS.md` | neu |
