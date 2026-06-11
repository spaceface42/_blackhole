Next thing: stabilize the full loop first ✅

Before adding new features, the next priority should be:

edit in GitCMS
→ commit to GitHub
→ GitHub Action builds dist/
→ GitHub Pages updates
→ media loads correctly

That full loop must be boring and reliable.

Priority 1 — Verify Stage 2.2.3 files

First apply/test the changed files:

admin/gitcms.html
gitcms.config.json
scripts/build-partials.mjs
.github/workflows/pages.yml
.gitignore

Then confirm:

gitcms.config.json keeps:
sourceDir: src
outputDir: dist
partialsDir: src/partials
mediaDir: src/media

This is the most important fix right now.

Priority 2 — Build/deploy sanity check

Run locally:

rm -rf dist
node scripts/build-partials.mjs
ls -la dist

You should see:

dist/index.html
dist/styles.css
dist/media/

Then push and check GitHub Actions.

If this works, your CMS finally has a real publishing pipeline.

Priority 3 — Add deploy status inside the admin

Very useful next feature.

After commit, the admin could show:

Committed abc123
GitHub Action running…
Deploy successful
View site

This would make the CMS feel real, not blind.

Technically this means adding a small WorkflowRepository later:

class WorkflowRepository {
  listRecentRuns()
  getLatestRunForBranch()
}

Not urgent, but highly useful.

Priority 4 — Media reference check

Before adding media delete, add a simple checker:

Which partials use this image?

Example:

src/media/001.png is used in:
- src/partials/aha.html
- src/partials/bob.html

Then later media delete becomes safe.

Priority 5 — UI polish

After the pipeline is stable, improve the UI:

clearer Settings drawer
clearer Media drawer
better error messages
loading states
commit/build status
less technical login screen

But I would not do visual polish before the build/deploy loop is confirmed.

My recommended next milestone
Stage 2.3 — Build/deploy reliability

Included:

Confirm src → dist build.
Confirm media copy.
Confirm GitHub Pages deploy.
Add admin status after commit.
Add clearer build-path validation.

Do not add manifest yet.
Do not add page builder yet.
Do not add media delete yet.

The next best work is making the CMS-to-public-site pipeline solid.