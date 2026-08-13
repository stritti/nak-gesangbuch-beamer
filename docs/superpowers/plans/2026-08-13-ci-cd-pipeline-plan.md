# CI/CD-Pipeline ohne Redundanz — Implementierungsplan

> **Für agentische Worker:** ERFORDERLICHES SUB-SKILL: superpowers:subagent-driven-development (empfohlen) oder superpowers:executing-plans zur taskweisen Umsetzung. Schritte nutzen Checkbox-Syntax (`- [ ]`).

**Ziel:** Die GitHub-Actions-Pipeline auf Redundanz-freie Struktur umbauen: CI als reine Verifikation (ein Job, ein `npm ci`), Deploy nur bei Release, Dependabot mit Gruppen + Auto-Merge.

**Architektur:** Vier Workflows mit klarer Trennung — `ci.yml` (Verifikation auf push main + PR), `release-please.yml` (Release-PRs), `deploy.yml` (Deploy nur bei `release: published`, Build aus Tag), `dependabot-auto-merge.yml` (Patch/Minor-Auto-Merge). Dependabot-Config mit Gruppen gegen PR-Spam.

**Tech Stack:** GitHub Actions, npm, Node 24, GitHub Pages, release-please, Dependabot.

## Globale Constraints

- Node 24, `actions/setup-node@v7` mit `cache: npm` in jedem Workflow mit npm-Install.
- Deploy **nur** bei `release: published` — niemals bei main-Push.
- `ci.yml`: genau **ein** Job, **ein** `npm ci`, kein Artifact-Upload, keine Pages-Permissions.
- `VITE_BASE_PATH`: in CI konditional (main → `/nak-gesangbuch-beamer/`, sonst `/`); in Deploy immer `/nak-gesangbuch-beamer/`.
- Dependabot-Auto-Merge nur für `semver-patch`/`semver-minor`, nur wenn Actor `dependabot[bot]`; Major-Updates bleiben manuell.
- Commit-Nachrichten folgen Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `perf:`).
- Kein `node_modules`-Cache (kontraproduktiv bei `npm ci`).

---

### Task 1: `ci.yml` auf Ein-Job-Verifikation umbauen

**Files:**
- Modify: `.github/workflows/ci.yml` (komplett ersetzen)

**Interfaces:**
- Consumes: nichts
- Produces: Workflow `CI` mit Job `ci` (Name „Verify") — Trigger `push` main + `pull_request` main

- [ ] **Step 1: Datei ersetzen**

Kompletten Inhalt von `.github/workflows/ci.yml` ersetzen durch:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read
  pull-requests: read

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

jobs:
  ci:
    name: Verify
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - name: Commitlint
        uses: wagoid/commitlint-github-action@v6
      - run: npm run lint
      # Typecheck ist in npm run build (vue-tsc) enthalten — nicht doppelt ausführen
      - run: npm run test
      - name: Build
        run: npm run build
        env:
          VITE_BASE_PATH: ${{ github.ref == 'refs/heads/main' && '/nak-gesangbuch-beamer/' || '/' }}
```

- [ ] **Step 2: YAML validieren**

Run: `python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/ci.yml')); print('OK')"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: consolidate CI into single verification job"
```

---

### Task 2: `deploy.yml` auf Release-Trigger umbauen

**Files:**
- Modify: `.github/workflows/deploy.yml` (komplett ersetzen)

**Interfaces:**
- Consumes: nichts (baut aus dem Release-Tag, kein Artifact-Handoff)
- Produces: Workflow `Deploy to GitHub Pages` mit Job `deploy`, Trigger `release: published`

- [ ] **Step 1: Datei ersetzen**

Kompletten Inhalt von `.github/workflows/deploy.yml` ersetzen durch:

```yaml
name: Deploy to GitHub Pages

on:
  release:
    types: [published]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - name: Build
        run: npm run build
        env:
          VITE_BASE_PATH: /nak-gesangbuch-beamer/
      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v5
        with:
          path: dist
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v5
```

- [ ] **Step 2: YAML validieren**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml')); print('OK')"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: deploy to Pages only on release"
```

---

### Task 3: `release-please.yml` um Concurrency-Guard ergänzen

**Files:**
- Modify: `.github/workflows/release-please.yml`

**Interfaces:**
- Consumes: nichts
- Produces: Workflow `release-please` mit `concurrency`-Gruppe `release-please`

- [ ] **Step 1: Datei ersetzen**

Kompletten Inhalt von `.github/workflows/release-please.yml` ersetzen durch:

```yaml
name: release-please

on:
  push:
    branches: [main]

permissions:
  contents: write
  pull-requests: write

concurrency:
  group: release-please
  cancel-in-progress: false

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: googleapis/release-please-action@v5
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          config-file: release-please-config.json
          manifest-file: .release-please-manifest.json
```

- [ ] **Step 2: YAML validieren**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/release-please.yml')); print('OK')"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/release-please.yml
git commit -m "ci: guard release-please against concurrent runs"
```

---

### Task 4: `dependabot-auto-merge.yml` neu anlegen

**Files:**
- Create: `.github/workflows/dependabot-auto-merge.yml`

**Interfaces:**
- Consumes: nichts
- Produces: Workflow `Dependabot auto-merge` — labelt Dependabot-PRs, Approve + Auto-Merge (squash) für Patch/Minor

- [ ] **Step 1: Datei anlegen**

```yaml
name: Dependabot auto-merge

on:
  pull_request_target:

permissions:
  contents: write
  pull-requests: write

jobs:
  dependabot:
    runs-on: ubuntu-latest
    if: ${{ github.actor == 'dependabot[bot]' }}
    steps:
      - name: Fetch Dependabot metadata
        id: metadata
        uses: dependabot/fetch-metadata@v2
        with:
          compat-lookup: true
      - name: Label
        run: gh pr edit "$PR_URL" --add-label "dependencies"
        env:
          PR_URL: ${{ github.event.pull_request.html_url }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - name: Approve and enable auto-merge
        if: ${{ steps.metadata.outputs.update-type == 'version-update:semver-patch' || steps.metadata.outputs.update-type == 'version-update:semver-minor' }}
        run: |
          gh pr review --approve "$PR_URL"
          gh pr merge --auto --squash "$PR_URL"
        env:
          PR_URL: ${{ github.event.pull_request.html_url }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

- [ ] **Step 2: YAML validieren**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/dependabot-auto-merge.yml')); print('OK')"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/dependabot-auto-merge.yml
git commit -m "ci: auto-merge dependabot patch and minor updates"
```

---

### Task 5: `dependabot.yml` mit Gruppen und versioning-strategy optimieren

**Files:**
- Modify: `.github/dependabot.yml` (komplett ersetzen)

**Interfaces:**
- Consumes: nichts
- Produces: Dependabot-Config mit Gruppen `production-dependencies`, `dev-dependencies`, `actions`; `versioning-strategy: increase`

- [ ] **Step 1: Datei ersetzen**

Kompletten Inhalt von `.github/dependabot.yml` ersetzen durch:

```yaml
version: 2
updates:
  # npm / Vite frontend dependencies
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "06:00"
      timezone: "Europe/Berlin"
    open-pull-requests-limit: 10
    versioning-strategy: increase
    commit-message:
      prefix: "chore(deps)"
      prefix-development: "chore(deps-dev)"
    labels:
      - "dependencies"
    groups:
      production-dependencies:
        dependency-type: "production"
        update-types:
          - "minor"
          - "patch"
      dev-dependencies:
        dependency-type: "development"
        update-types:
          - "minor"
          - "patch"

  # GitHub Actions workflows
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "06:00"
      timezone: "Europe/Berlin"
    open-pull-requests-limit: 5
    commit-message:
      prefix: "chore(deps)"
    labels:
      - "dependencies"
    groups:
      actions:
        patterns:
          - "*"
        update-types:
          - "minor"
          - "patch"
```

- [ ] **Step 2: YAML validieren**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/dependabot.yml')); print('OK')"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add .github/dependabot.yml
git commit -m "chore(deps): group dependabot updates and set versioning strategy"
```

---

### Task 6: `AGENTS.md` an neue Pipeline-Struktur anpassen

**Files:**
- Modify: `AGENTS.md` (Abschnitte „CI/CD Pipeline" und „Deployment")

**Interfaces:**
- Consumes: Workflow-Struktur aus Tasks 1–5
- Produces: Aktuelle Pipeline-Dokumentation für künftige Agenten

- [ ] **Step 1: Abschnitt „CI/CD Pipeline" ersetzen**

In `AGENTS.md` den Abschnitt „## CI/CD Pipeline" (inkl. Tabelle und Datenfluss) ersetzen durch:

```markdown
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
```

- [ ] **Step 2: Abschnitt „Deployment" ersetzen**

In `AGENTS.md` den Abschnitt „## Deployment" ersetzen durch:

```markdown
## Deployment

- Ziel: GitHub Pages (App unter `/nak-gesangbuch-beamer/`).
- Deploy **nur bei Release** (`release: published`), nicht bei jedem main-Push. Der Deploy-Workflow baut aus dem Release-Tag.
- Voraussetzung (einmalig): Repo-Settings → Pages → Source **„GitHub Actions"**; „Allow auto-merge" aktivieren (für Dependabot-Auto-Merge).
- `vite.config.ts` nutzt `base: process.env.VITE_BASE_PATH || '/'`; CI-Build auf main und Deploy-Build setzen `VITE_BASE_PATH=/nak-gesangbuch-beamer/`.
```

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "docs: update pipeline description for release-only deploy"
```

---

### Task 7: Gesamtverifikation, Push und PR

**Files:**
- Keine Änderungen — Verifikation + Abschluss

**Interfaces:**
- Consumes: alle Tasks 1–6

- [ ] **Step 1: actionlint installieren**

```bash
curl -sSfL https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash | bash -s -- -d /tmp/opencode/actionlint
```

Falls Download fehlschlägt: `go install github.com/rhysd/actionlint/cmd/actionlint@latest` (falls Go vorhanden) oder Docker `docker run --rm -v "$PWD:/repo" --workdir /repo rhysd/actionlint:latest`.

- [ ] **Step 2: Alle Workflows mit actionlint prüfen**

Run: `/tmp/opencode/actionlint .github/workflows/*.yml`
Expected: keine Fehler (Warnungen zu `pull_request_target`-Nutzung sind akzeptabel, wenn sie nur den Actor-Guard betreffen)

- [ ] **Step 3: JSON-Configs validieren**

Run: `python3 -c "import json; json.load(open('release-please-config.json')); json.load(open('.release-please-manifest.json')); print('OK')"`
Expected: `OK`

- [ ] **Step 4: Diff-Review**

Run: `git diff main...HEAD --stat` und `git diff main...HEAD`
Expected: nur die 6 geplanten Dateien geändert; keine App-Quelldateien (`src/`, `vite.config.ts` etc.) betroffen

- [ ] **Step 5: Branch pushen**

```bash
git push -u origin chore/ci-pipeline
```

- [ ] **Step 6: PR erstellen**

```bash
gh pr create --base main --head chore/ci-pipeline \
  --title "ci: restructure pipeline — release-only deploy, dependabot automation" \
  --body "## Änderungen

- **ci.yml**: Ein-Job-Verifikation (commitlint, lint, test, build) — ein npm ci, kein Artifact-Upload, keine Pages-Permissions
- **deploy.yml**: Deploy nur bei \`release: published\`, Build aus Release-Tag (kein workflow_run, kein Artifact-Roundtrip)
- **release-please.yml**: Concurrency-Guard gegen parallele Release-PR-Erzeugung
- **dependabot-auto-merge.yml** (neu): Labelt Dependabot-PRs, Approve + Auto-Merge (squash) für Patch/Minor; Major manuell
- **dependabot.yml**: Gruppen (production/dev/actions, minor+patch gebündelt), versioning-strategy: increase
- **AGENTS.md**: Pipeline-Dokumentation aktualisiert

## Manuelle Voraussetzungen

- Repo-Settings → Pages → Source **„GitHub Actions"**
- „Allow auto-merge" aktivieren (für Dependabot-Auto-Merge)

Siehe Spec: \`docs/superpowers/specs/2026-08-13-ci-cd-pipeline-design.md\`"
```

Expected: PR-URL wird ausgegeben

- [ ] **Step 7: PR-Checks beobachten**

Run: `gh pr checks --watch`
Expected: CI (Verify) grün