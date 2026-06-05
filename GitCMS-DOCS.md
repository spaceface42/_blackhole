# GitCMS — Developer Documentation

A single-file, zero-backend CMS (`github-cms.html`) that edits HTML fragments stored in a GitHub repo and commits changes directly through the GitHub REST API. No server, no database, no build step. Open the file in a browser and it runs.

This document describes the code **as built**, including the four hardening fixes applied over the original spec.

---

## 1. Concept

GitCMS edits `<section class="fragment">` blocks inside `.html` files in a site repo. It reads the current state of those files, lets you edit the inner HTML and a human label per fragment, commits to a `draft` branch, and publishes by merging `draft` into the default branch. A GitHub Action on the site repo deploys on push.

```
Browser (github-cms.html)
      │  GitHub REST API v3
      ▼
Site repo ──► draft branch (all CMS writes)
         └──► main / default branch (reads + publish target)
              └──► GitHub Action deploys docs/ to Pages
```

There are two repos in the intended deployment, though the CMS only ever talks to the site repo:

| Repo | Role |
|---|---|
| `_admin` | Hosts `github-cms.html` via GitHub Pages. The tool itself. |
| `_site` | The website. Holds `docs/*.html` fragments and `fragments.json`. The CMS reads from and writes to this repo only. |

---

## 2. Fragment format

A fragment is a `<section>` whose class list includes `fragment`:

```html
<section id="hero" class="fragment">
  <!-- any HTML -->
</section>
```

Rules enforced/assumed by the parser:

- `id` is unique within the loaded set and is **immutable** — never editable in the UI.
- The `class` attribute must contain the word `fragment`. Other classes are preserved verbatim on write-back.
- Any valid HTML is allowed inside. Multiple fragments per file and multiple files are supported.
- Parsing is regex-based (`/<section\s([^>]*)>([\s\S]*?)<\/section>/gi`), so deeply nested or malformed `<section>` markup may not parse correctly. This is a known limitation, not a bug.

---

## 3. Manifest (`fragments.json`)

Optional, lives at the **repo root**. Maps fragment IDs to files and human labels:

```json
[
  { "id": "hero",  "file": "docs/index.html", "label": "Hero Section" },
  { "id": "intro", "file": "docs/index.html", "label": "Introduction" }
]
```

| Field | Meaning |
|---|---|
| `id` | Matches the section's `id` exactly |
| `file` | Full path from repo root (e.g. `docs/index.html`) |
| `label` | Display name shown in the sidebar; editable inline in the CMS |

**With a manifest**, only the listed files are fetched (fast path). **Without one**, the CMS falls back to a full recursive tree scan, loads every `.html` file, and shows an amber banner offering to save a generated manifest.

When a label is changed and committed, `fragments.json` is rewritten in the same operation (see §7).

---

## 4. Authentication & credentials

The login screen collects:

- **Site Repository URL** — any `github.com/owner/repo` form is parsed (`.git` suffix and `git@` form tolerated).
- **GitHub Personal Access Token** — needs Contents read/write plus branch/merge permission.

**Recommendation surfaced in the UI:** use a **fine-grained PAT** scoped to just the site repo with *Contents: Read & write*. A classic `repo`-scoped token also works but can write to every repo the user owns — a much larger blast radius.

On successful connect, the repo URL and token are saved to `localStorage`:

- `gitcms_repo` — the repo URL, plaintext
- `gitcms_tok` — the token, **base64-encoded only**

Base64 is obfuscation, not encryption; the UI states this plainly. On next load both fields are pre-filled but the user still clicks **Connect** manually (no silent auto-login). **Disconnect** clears `localStorage` and reloads.

---

## 5. Branch strategy

| Branch | Role |
|---|---|
| default branch (usually `main`) | Live/published; primary read source. Resolved from the repo at connect — **not hardcoded** to `main`. |
| `draft` | Staging; all CMS writes land here. |

On connect the CMS checks whether `draft` exists; if not, it creates `draft` from the default branch head.

**Read/write split:**

- Default branch is the baseline read source. For each file the CMS also reads the `draft` copy, and if draft has diverged it uses the draft content as the working copy (so in-progress edits survive a reload). The manifest is read **draft-first, then default** for the same reason.
- All writes (fragment commits, manifest updates) go to `draft`.
- Before every write the live `draft` SHA is fetched fresh to avoid SHA-mismatch (409) errors. If the file does not yet exist on `draft`, `sha` is omitted and GitHub creates it.

---

## 6. Internal data model

The central design decision (and the source of the most important fix). State holds **one canonical record per file**; fragments **reference** their file rather than each carrying a private copy of the file's text.

```js
state = {
  owner, repo, token,
  defaultBranch,            // resolved at connect
  workBranch: 'draft',
  files: Map<path, {        // ONE record per file path
    path,
    content,                // full current file text (the single source of truth)
    shaMain,                // SHA on default branch
    shaDraft,               // SHA on draft (null if absent)
    fragments: [id, ...]    // ids of fragments living in this file
  }>,
  frags: Map<id, {          // fragment objects reference their file via .path
    id,                     // immutable
    classes,                // full class attribute, preserved on write-back
    label,                  // from manifest, or defaults to id
    path,                   // repo path of owning file
    file,                   // filename only, for display
    innerHTML,              // what the editor edits
    origHTML,               // inner content at load, for dirty detection
    dirty                   // bool
  }>,
  manifest,                 // array | null
  manifestPath: 'fragments.json',
  activeId
}
```

**Why this matters:** in the original spec each fragment carried its own `fileContent`. With two fragments in the same file, committing one and then the other rebuilt from stale per-fragment snapshots and silently overwrote the first edit. Here, the file's `content` is the only copy; a commit rebuilds the whole file from *all* its fragments and writes once. Multiple dirty fragments in one file therefore go up as a single commit, and the old "sync SHA to sibling fragments" workaround is gone because there is nothing to sync.

---

## 7. Loading flow

1. **Resolve default branch** from `GET /repos/{owner}/{repo}`.
2. **Ensure `draft` exists**, creating it from the default branch head if missing.
3. **Load manifest** — try `fragments.json` on `draft`, then on the default branch. Result is the manifest array or `null`.
4. **Determine file list:**
   - manifest present → unique `file` paths from the manifest;
   - manifest absent → recursive tree scan of the default branch, filtered to `.html?` blobs; show the no-manifest banner.
5. **Fetch files in parallel** (`Promise.all`). For each file, read the default-branch copy and the draft copy; if draft diverges, keep the draft content as the working copy. Capture both SHAs.
6. **Parse each file** with the section regex, keep only sections whose class contains `fragment`, build fragment objects, and register their ids on the file record.
7. **Drop files with zero fragments**, render the sidebar grouped by file.

A failed individual file fetch is skipped with a console warning rather than aborting the whole load.

---

## 8. Editing

Selecting a fragment shows:

- **Locked metadata** — `#id` badge and full file path badge (not editable).
- **Editable label** — inline text input; updates the manifest on commit.
- **Inner HTML textarea** — shows `innerHTML` only; the `<section>` wrapper is never shown or editable. A read-only hint displays the wrapper shape (`<section id="…" class="…"> … </section>`).
- **Live preview** — an iframe re-rendering the full rebuilt section on every keystroke.

Dirty state is tracked per fragment (amber dot in the sidebar row; the file group also shows a dirty indicator). A fragment is dirty if its inner HTML differs from `origHTML` **or** its label differs from the manifest value. **Reset** restores both inner HTML and label to the last loaded state.

Switching fragments first syncs the textarea back into the active fragment so edits are not lost when navigating.

---

## 9. Committing (Save → Draft)

1. User clicks **Save → Draft**; the active textarea is synced into state.
2. A modal prompts for a commit message (pre-filled `cms: update fragment #id`). If more than one fragment in the file is dirty, the modal says so — they commit together.
3. On confirm:
   - Rebuild the file's full content by replacing **each** of its fragments into the canonical `content` via `replaceFragment`.
   - Fetch the live `draft` SHA for the file (omit if the file is new on draft).
   - `PUT /repos/{owner}/{repo}/contents/{path}` with `branch: draft`.
   - Update the file record's `content` and `shaDraft`; mark all its fragments clean and set their `origHTML` to the committed value.
   - If a manifest exists, rewrite `fragments.json` on `draft` in the same operation, carrying the current labels.

**No silent corruption:** `replaceFragment` returns the file content **unchanged** if the target `<section>` cannot be located by regex. A skipped edit is recoverable; a mangled file is not.

**Commit error handling** surfaces specific messages for 409 (SHA conflict — refresh and re-apply), 422 (rejected write — bad branch/path), and 403 (token lacks write).

---

## 10. Publishing (Publish to main)

1. User clicks **↑ Publish to main**; the active textarea is synced.
2. Modal shows the target (default) branch and warns if any fragments are still dirty (those won't be published until saved to draft).
3. On confirm: `POST /repos/{owner}/{repo}/merges` with `base: <defaultBranch>, head: draft`.
4. The site repo's GitHub Action triggers on the resulting push and deploys.

**Merge conflicts are surfaced, never auto-resolved.** A 409 shows a clear message plus a direct link to the GitHub compare view, and states explicitly that GitCMS will not force-push or auto-rebase — that is how work gets lost silently. 403 (no merge permission) and 404 (nothing to merge / branch missing) get their own messages.

---

## 11. GitHub Actions (site repo)

`.github/workflows/deploy.yml` deploys `docs/` to Pages on push to the default branch:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
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
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: docs
      - id: deploy
        uses: actions/deploy-pages@v4
```

GitHub Pages source must be set to **GitHub Actions** in the site repo's Settings → Pages. If the default branch is not `main`, update the `branches` filter accordingly.

---

## 12. Fixes applied over the original spec

| # | Fix | Why |
|---|---|---|
| 1 | One canonical file record per path; fragments reference it | Per-fragment `fileContent` copies caused a second commit to overwrite the first when two fragments shared a file. Now the file rebuilds from all its fragments and writes once; the SHA-sibling-sync hack is removed. |
| 2 | Manifest (and file content) read **draft-first**, default fallback | Reading labels/content only from the default branch made saved-but-unpublished edits flicker back to stale values on reconnect. |
| 3 | Merge 409 surfaced with a compare link; no force/rebase | Auto-resolving a publish conflict risks silently destroying work that landed on the default branch out-of-band. |
| 4 | Fine-grained PAT guidance + plain "obfuscation, not encryption" note | A classic `repo` token can write to every repo the user owns; the UI now steers toward least privilege and is honest about localStorage. |

Two implementation choices made while building: `replaceFragment` leaves content untouched if the section can't be matched (skip over corrupt), and the default branch is resolved from the repo rather than hardcoded.

---

## 13. Tech stack

- Pure HTML/CSS/JS, single file, no framework, no bundler, no dependencies.
- GitHub REST API v3: Contents, Trees, Refs, Merges.
- `localStorage` for credential persistence only (repo URL plaintext + base64 token).
- Fonts: Syne (UI) and JetBrains Mono (code/labels) via Google Fonts.

---

## 14. Known limitations & open items

- **Raw textarea editor.** A Notion-style block editor was discussed but deliberately deferred; it roughly doubles complexity and would rewrite the data model again. Ship and use the textarea version first.
- **Edit-only.** No creation of new fragments or new HTML files yet.
- **No locking / multi-user.** Last commit wins.
- **Token in localStorage** is base64 only, not encrypted.
- **Regex parsing** assumes well-formed `<section>` markup; deeply nested or malformed sections may not parse.
- **No image upload.** Images must already exist in the repo.
- **Manifest `file` is the full repo path** (`docs/index.html`); the fragment object's `file` field holds only the filename (`index.html`) for display grouping. Intentionally different.

---

## 15. Next feature under consideration

**Block editor** — replace the textarea + preview split with a Notion-style editor:

- Parse `innerHTML` into typed block objects (`{ type: 'h2', content: '…' }`).
- Render each block as an individually editable, draggable unit.
- Serialize back to clean HTML on save.
- Supported block types TBD from real fragment content.
- Keep a raw-HTML toggle for power users.
