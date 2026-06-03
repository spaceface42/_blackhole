# Roadmap

This repository is the administered site. The paired admin lives in `_admin`.

## Done

- `admin.config.json` describes the editable data paths, upload limits, content type labels, field metadata, and public preview URL.
- `data/` stores JSON records and uploaded assets.
- `public.source/` stores editable HTML/CSS templates.
- `scripts/build-site.js` generates `_docs/`.
- The build skips records with `published: false`.
- The build supports:
  - `<database id="1" field="title"></database>`
  - `<database-list type="page"></database-list>`
  - `<database-link id="1"></database-link>`
- `.github/workflows/build-docs.yml` rebuilds `_docs/` after data or template changes.
- GitHub Pages deploys the generated `_docs/` folder from a GitHub Actions artifact.

## Next

- Add richer page template generation if individual pages should be generated automatically from records.
- Add more template helpers for navigation, galleries, and SEO metadata.
