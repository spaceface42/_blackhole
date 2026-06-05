# GitCMS — Project Prompt (current state)

## What it is

A single-file, zero-backend CMS (`github-cms.html`) hosted on GitHub Pages from a private `_admin` repo. It edits HTML fragments stored in a separate `_site` repo, committing changes directly via the GitHub Contents API. No server, no database, no build step.

---

## Repository Architecture

| Repo | Purpose |
|---|---|
| `_admin` | Hosts `github-cms.html` via GitHub Pages. The CMS lives here. Nothing else of importance. |
| `_site` | The actual website. Contains `docs/` with `.html` files. Also contains `fragments.json` at the repo root. The CMS reads from and writes exclusively to this repo. |

The site deploys via GitHub Actions — on push to `main`, the `docs/` folder is deployed to GitHub Pages.

---

## Authentication & Credentials

Login screen collects:
- **Site Repository URL** — e.g. `https://github.com/user/repo-site`
- **GitHub Personal Access Token** — needs `repo` scope (contents read/write + branch management)

On successful login both values are saved to `localStorage` (token base64-obfuscated) and pre-filled on next page load. User still clicks Connect manually — no auto-login. Disconnect clears `localStorage`.

---

## Branch Strategy

| Branch | Role |
|---|---|
| `main` | Live / published. Source of truth for all reads. |
| `draft` | Staging. All CMS edits are committed here. |

On connect, the CMS checks if `draft` exists — if not, creates it from `main` automatically.

**Read/write split:**
- All file reads (manifest, HTML files, tree scan) → `defaultBranch` (main)
- All file writes (fragment commits, manifest updates) → `workBranch` (draft)
- Before each commit, the CMS fetches the file's current SHA from `draft` to avoid SHA mismatch errors. If the file doesn't exist on draft yet, it passes `null` so GitHub creates it fresh.

**Publish:** A "Publish to main" button merges `draft` into `main` via `POST /repos/{owner}/{repo}/merges`. The GitHub Action then deploys automatically.

---

## Fragment Format

Fragments are `<section>` elements inside `.html` files in `docs/`. Required format:

```html
<section id="hero" class="fragment">
  <!-- any html content -->
</section>
```

Rules:
- `id` — unique, immutable. Never editable in the CMS.
- `class` must include `fragment` (other classes are preserved)
- Any valid HTML is allowed inside
- Multiple fragments per file, spread across multiple files

---

## Manifest (`fragments.json`)

Lives at the **repo root** of `_site` (not inside `docs/`). Read from `main`.

```json
[
  { "id": "hero",     "file": "docs/index.html",   "label": "Hero Section"      },
  { "id": "intro",    "file": "docs/index.html",   "label": "Introduction"      },
  { "id": "features", "file": "docs/index.html",   "label": "Features"          },
  { "id": "cta",      "file": "docs/index.html",   "label": "Call to Action"    },
  { "id": "team",     "file": "docs/about.html",   "label": "Team"              },
  { "id": "mission",  "file": "docs/about.html",   "label": "Mission Statement" },
  { "id": "contact",  "file": "docs/contact.html", "label": "Contact Form"      },
  { "id": "map",      "file": "docs/contact.html", "label": "Location Map"      }
]
```

Fields:
- `id` — matches the section's `id` attribute exactly
- `file` — full path from repo root (e.g. `docs/index.html`)
- `label` — human-readable name shown in the sidebar (editable inline in the CMS)

If the manifest exists, only the listed files are fetched (fast). If missing, the CMS falls back to a full tree scan and shows a banner offering to save the manifest.

When a fragment label is changed in the CMS and committed, the manifest is updated automatically in the same operation.

---

## Fragment Loading Flow

1. Try `GET /repos/{owner}/{repo}/contents/fragments.json?ref=main`
2. If found → extract unique file paths, fetch only those files in **parallel via `Promise.all`**
3. If not found → `GET /repos/{owner}/{repo}/git/trees/main?recursive=1`, filter `.html`, fetch all in parallel
4. Parse each file with regex: `/<section\s([^>]*)>([\s\S]*?)<\/section>/gi`
5. Filter to sections whose `class` includes `fragment`
6. Build flat fragment array, group by file for sidebar display

---

## Fragment Object (internal state)

```js
{
  id:          string,   // section id — immutable
  classes:     string,   // full class attribute — preserved on write-back
  label:       string,   // display name from manifest — editable
  file:        string,   // filename only (e.g. "index.html") — for display
  path:        string,   // full repo path (e.g. "docs/index.html") — for API calls
  innerHTML:   string,   // inner content — what the editor works on
  origHTML:    string,   // original inner content at load — for dirty detection
  fileContent: string,   // full file text — needed to write back correctly
  fileSHA:     string,   // file SHA from main — stored but not used for commits
  dirty:       bool,
}
```

---

## Editing

- Selecting a fragment shows:
  - **Locked metadata**: `#id` badge + filename badge (not editable)
  - **Editable label**: inline text input (updates manifest on commit)
  - **HTML textarea**: shows `innerHTML` only — the `<section>` wrapper is never shown or editable
  - **Live preview**: renders `rebuildFragment(f)` — full section with wrapper — on every keystroke
- Dirty state tracked per fragment (amber dot in sidebar)
- Reset button restores to `origHTML`

---

## Committing

1. User clicks **Save → Draft**
2. Modal prompts for commit message (pre-filled as `cms: update fragment #id`)
3. On confirm:
   - Fetch current SHA of the file from `draft` branch (may differ from main)
   - Rebuild full outer HTML: `<section id="..." class="...">innerHTML</section>`
   - Replace fragment in full file content via regex
   - `PUT /repos/{owner}/{repo}/contents/{path}` with `branch: draft`
   - Update `fileSHA` and `fileContent` in local state
   - Sync SHA to sibling fragments in the same file
   - If manifest exists, update `fragments.json` on draft in the same operation

---

## Publishing

1. User clicks **↑ Publish to main**
2. Modal shows: target branch, count of any still-dirty fragments (warning)
3. On confirm: `POST /repos/{owner}/{repo}/merges` with `base: main, head: draft`
4. GitHub Action triggers on main push → deploys `docs/` to GitHub Pages

---

## GitHub Actions (`_site` repo)

File: `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches:
      - main
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deploy.outputs.page_url }}
    env:
      FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: docs
      - id: deploy
        uses: actions/deploy-pages@v4
```

GitHub Pages source must be set to **GitHub Actions** in repo Settings → Pages.

---

## Tech Stack

- **Pure HTML/CSS/JS** — single file, no framework, no bundler, no dependencies
- **GitHub REST API v3** — Contents API, Trees API, Refs API, Merges API
- **localStorage** — credential persistence only (repo URL + base64 token)
- **Fonts** — Syne (UI), JetBrains Mono (code/labels) via Google Fonts

---

## UI Structure

```
┌─ Topbar ──────────────────────────────────────────────────────┐
│ GitCMS  [repo badge]  [⬡ draft]   [status] [Refresh] [↑ Publish] [Disconnect] │
├─ No-manifest banner (amber, shown only when fragments.json missing) ──────────┤
├─ Sidebar (280px) ──────┬─ Editor Area ──────────────────────────┤
│ FRAGMENTS  [↻]         │ [#id] [file] [label input]  [Reset] [Save→Draft] │
│                        ├─ Inner HTML textarea │ Live preview ──┤
│ ▸ index.html  (4)      │                      │                │
│   Hero Section  #hero  │                      │                │
│   Introduction  #intro │                      │                │
│ ▸ about.html   (2)     │                      │                │
│   ...                  │                      │                │
├────────────────────────┴────────────────────────────────────────┤
│ Status bar: GitCMS · N fragment(s) · file path · ● unsaved     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Known Limitations / Open Questions

- Editor is a raw `<textarea>` — a **block editor** (Notion-style, children of section as draggable typed blocks) was discussed but not yet built
- No support for creating new fragments or new HTML files — edit only
- No multi-user / locking — last commit wins
- Token stored in localStorage (base64 only, not encrypted)
- Fragment regex assumes well-formed HTML — deeply nested or malformed sections may not parse
- No image upload — images must already exist in the repo
- Manifest `file` field uses full path from repo root (`docs/index.html`), but `f.file` in fragment objects stores only the filename (`index.html`) for display grouping — these are intentionally different

---

## Next Feature Under Consideration

**Block editor** — replace the textarea + preview split with a Notion-style block editor:
- Parse fragment `innerHTML` into typed block objects (`{ type: 'h2', content: '...' }`)
- Render each block as an individually editable, draggable unit
- Serialize back to clean HTML on save
- Supported block types TBD based on actual fragment content
- Keep a raw HTML toggle for power users