# GitCMS starter site

This repo layout is designed for the single-file GitCMS admin and a GitHub Actions build/deploy workflow.

## Structure

```txt
src/                 Editable source website
src/partials/        HTML fragments edited by GitCMS
src/media/           Images uploaded by GitCMS
admin/gitcms.html    GitCMS admin page
scripts/             Build scripts
dist/                Generated output, do not edit manually
gitcms.config.json   GitCMS project settings
.github/workflows/   GitHub Pages build/deploy workflow
```

## GitCMS config

`gitcms.config.json` tells the admin where to edit fragments and media:

```json
{
  "content": {
    "partialsDir": "src/partials"
  },
  "media": {
    "mediaDir": "src/media",
    "publicPath": "./media/"
  },
  "build": {
    "sourceDir": "src",
    "outputDir": "dist"
  }
}
```

## Local build test

From the repo root:

```bash
node scripts/build-partials.mjs
python3 -m http.server 8000 -d dist
```

Then open:

```txt
http://localhost:8000
```

## GitHub Pages setup

In the GitHub repo:

```txt
Settings → Pages → Build and deployment → Source → GitHub Actions
```

Then push to `main`. The workflow builds `dist/` and deploys it to GitHub Pages.
