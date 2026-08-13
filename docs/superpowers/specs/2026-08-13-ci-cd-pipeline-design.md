# CI/CD-Pipeline ohne Redundanz — Design

Datum: 2026-08-13
Projekt: nak-gesangbuch-beamer (Vite + Vue 3 + TypeScript PWA, npm, GitHub `stritti/nak-gesangbuch-beamer`)

## Ausgangslage

Die bestehende Pipeline (Stand 2026-08-09, siehe `2026-08-09-ci-cd-release-please-design.md`) besteht aus drei Workflows:

| Workflow | Trigger | Zweck |
|---|---|---|
| `ci.yml` | push main + PR | checks (commitlint, lint, test) + build, lädt dist-Artifact auf main hoch |
| `deploy.yml` | `workflow_run` nach grünem CI | lädt dist-Artifact runter, deployt auf GitHub Pages |
| `release-please.yml` | push main | Release-PR, nach Merge Tag + Release + CHANGELOG |

### Identifizierte Redundanzen

| Problem | Wirkung |
|---|---|
| `checks`- und `build`-Job mit je eigenem checkout + setup-node + `npm ci` | Doppelte Installation, doppelte Setup-Schritte |
| `ci.yml` lädt dist-**Artifact** hoch, `deploy.yml` lädt es per `workflow_run` wieder **runter** | Redundanter Roundtrip + Indirektion |
| Deploy bei **jedem** main-Push | Nicht gewünscht: Pages soll nur bei Release deployed werden |
| Dependabot nur als Config ohne Gruppen und ohne Automation | PR-Spam, manuelle Merges |

## Ziele & Entscheidungen (mit Nutzer abgestimmt)

| Thema | Entscheidung |
|---|---|
| Deploy-Trigger | **Nur bei Release** (`release: published`), nicht bei jedem main-Push |
| Deploy-Mechanik | Deploy-Workflow baut aus dem Release-Tag (kein Artifact-Handoff) |
| CI-Struktur | Ein Workflow, ein Job, ein `npm ci` — reine Verifikation |
| Dependabot | Config mit Gruppen + Auto-Merge-Workflow (Patch/Minor) |
| release-please | Bleibt eigenständig (unabhängig vom CI-Status, eigene Permissions) |
| Cache | `setup-node` mit `cache: npm`; kein `node_modules`-Cache |

## Architektur

```
push main / PR ──► ci.yml (commitlint → lint → test → build)          [Verifikation]
push main ──► release-please.yml ──► Release-PR ──► Merge ──► Tag vX.Y.Z + Release + CHANGELOG
Release published ──► deploy.yml (build aus Tag → Pages)              [Deployment]
dependabot PR ──► dependabot-auto-merge.yml (Label + Auto-Merge Patch/Minor)
```

Vier unabhängige Concerns, sauber getrennt:
1. **Verifikation** (`ci.yml`)
2. **Versionierung/Releases** (`release-please.yml`)
3. **Deployment** (`deploy.yml`)
4. **Dependency-Automation** (`dependabot.yml` + `dependabot-auto-merge.yml`)

## Komponenten

### 1. `.github/workflows/ci.yml` — Verifikation

- Trigger: `push` (main) + `pull_request` (main)
- `permissions`: `contents: read` (minimal)
- `concurrency`: Gruppe `ci-${{ github.ref }}`, `cancel-in-progress: true` nur bei PRs (bei main nicht abbrechen)
- Ein Job `ci`:
  - `actions/checkout@v7` mit `fetch-depth: 0` (nötig für commitlint über Commit-Historie)
  - `actions/setup-node@v7` (Node 24, `cache: npm`)
  - `npm ci`
  - commitlint: `wagoid/commitlint-github-action@v6`
  - `npm run lint`
  - `npm run test` (Vitest)
  - `npm run build` mit `VITE_BASE_PATH` konditional (main → `/nak-gesangbuch-beamer/`, sonst `/`) — nur als Check, kein Artifact-Upload
  - Typecheck ist in `build` enthalten (`vue-tsc`) — nicht doppelt ausführen

### 2. `.github/workflows/deploy.yml` — Deployment nur bei Release

- Trigger: `release: types: [published]` (semantisch; deckt auch manuelle Releases ab)
- `permissions`: `contents: read`, `pages: write`, `id-token: write`
- `environment`: `github-pages` (korrekt hier: Job läuft nur bei Release)
- `concurrency`: Gruppe `pages`, `cancel-in-progress: true`
- Job `deploy`:
  - `actions/checkout@v7` (checkt automatisch den Release-Tag aus)
  - `actions/setup-node@v7` (Node 24, `cache: npm`)
  - `npm ci`
  - `npm run build` mit `VITE_BASE_PATH=/nak-gesangbuch-beamer/` (fester Wert, kein Konditional nötig)
  - `actions/upload-pages-artifact@v5` (path: `dist`)
  - `actions/deploy-pages@v5`

### 3. `.github/workflows/release-please.yml` — unverändert

- Trigger: `push` (main)
- `permissions`: `contents: write`, `pull-requests: write`
- Step: `googleapis/release-please-action@v5` mit `token: secrets.GITHUB_TOKEN`, `config-file: release-please-config.json`, `manifest-file: .release-please-manifest.json`
- Neu: `concurrency: group: release-please, cancel-in-progress: false` als Race-Guard gegen parallele Release-PR-Erzeugung

### 4. `.github/workflows/dependabot-auto-merge.yml` — neu

- Trigger: `pull_request_target`
- Guard: `if: github.actor == 'dependabot[bot]'`
- `permissions`: `contents: write`, `pull-requests: write`
- Steps:
  - `dependabot/fetch-metadata@v2` (liefert `update-type`)
  - Label `dependencies` setzen
  - Approve + Auto-Merge (squash) **nur** wenn `update-type` ∈ `version-update:semver-patch` | `version-update:semver-minor`
  - Major-Updates bleiben manuell (bewusst)

### 5. `.github/dependabot.yml` — optimiert

- npm-Ecosystem:
  - Zeitplan unverändert (wöchentlich, Montag 06:00 Europe/Berlin)
  - `versioning-strategy: increase`
  - `open-pull-requests-limit: 10`
  - Gruppen:
    - `production-dependencies` (`dependency-type: production`, `update-types: [minor, patch]`)
    - `dev-dependencies` (`dependency-type: development`, `update-types: [minor, patch]`)
  - Major-Updates: einzeln (keine Gruppe) — bewusst, da Breaking Changes isoliert reviewbar sein müssen
- github-actions-Ecosystem:
  - Zeitplan unverändert
  - Gruppe `actions` (`patterns: ["*"]`, `update-types: [minor, patch]`)

### 6. `AGENTS.md`

Pipeline-Beschreibung an die neue Struktur anpassen:
- Datenfluss: `push main/PR → CI grün → Release-PR → Merge → Tag+Release → deploy.yml → Pages`
- Deploy nur bei Release, nicht bei jedem main-Push
- Dependabot-Automation dokumentieren

## Fehlerbehandlung

- **Deploy nur bei Release**: `release: published` verhindert Deployment bei jedem main-Push; nur veröffentlichte Releases deployen.
- **Deploy nie bei rotem CI**: Release-PR-Merge setzt grünes CI voraus (Branch-Protection); der Tag zeigt auf den gemergten, verifizierten Stand.
- **Kein Deploy-Spaghetti**: kein Deploy-Trigger auf Tags/PRs, nur auf `release: published` — eine klare Quelle.
- **commitlint als CI-Gate**: hält die Conventional-Commit-Konvention (release-please-Vertrag) durch.
- **Parallele Deploys**: `concurrency`-Gruppe `pages` verhindert Race Conditions.
- **Dependabot-Auto-Merge-Sicherheit**: nur Patch/Minor, nur Dependabot-Actor, `pull_request_target` mit Actor-Guard; Major-Updates manuell.

## Test-/Verifikationsstrategie

- Lokal: `actionlint` (falls verfügbar) für alle Workflows, YAML-Parse, JSON-Validierung der release-please-Configs.
- `release-please-config.json` / `.release-please-manifest.json`: Konsistenz mit `package.json` (0.1.0).
- Funktionsnachweis erst server-seitig nach Push auf main:
  - `ci.yml` grün auf main und PRs
  - release-please erzeugt Release-PR → nach Merge Tag + Release + CHANGELOG
  - `deploy.yml` deployt nach Release-Publish → App erreichbar unter `https://stritti.github.io/nak-gesangbuch-beamer/`
  - Dependabot-PR (Patch/Minor) wird gelabelt und automatisch gemerged
- **Einmalige manuelle Voraussetzung (Nutzer)**: Repo-Settings → Pages → Source **„GitHub Actions"**; „Allow auto-merge" aktivieren; optional Branch-Protection auf main („CI checks must pass").

## Betroffene Dateien

| Datei | Aktion |
|---|---|
| `.github/workflows/ci.yml` | umbauen (ein Job, kein Artifact, kein Deploy) |
| `.github/workflows/deploy.yml` | umbauen (Trigger `release: published`, Build aus Tag) |
| `.github/workflows/release-please.yml` | ändern (concurrency-Guard) |
| `.github/workflows/dependabot-auto-merge.yml` | neu |
| `.github/dependabot.yml` | ändern (Gruppen, versioning-strategy) |
| `AGENTS.md` | ändern (Pipeline-Beschreibung) |