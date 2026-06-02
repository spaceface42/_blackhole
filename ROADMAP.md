# Roadmap

This repository is the administered site. The paired admin lives in `_admin`.

## Done

- `admin.config.json` describes the editable data paths, upload limits, content type labels, field metadata, and public preview URL.
- `data/` stores JSON records and uploaded assets.
- `public.source/` stores editable HTML/CSS templates.
- `scripts/build-site.js` generates `docs/`.
- The build skips records with `published: false`.
- The build supports:
  - `<database id="1" field="title"></database>`
  - `<database-list type="page"></database-list>`
  - `<database-link id="1"></database-link>`
- `.github/workflows/build-docs.yml` rebuilds `docs/` after data or template changes.
- GitHub Pages can publish from `main` branch, `/docs` folder.

## Next

- Consider artifact-based Pages deployment instead of committing generated `docs/`.
- Add richer page template generation if individual pages should be generated automatically from records.
- Add more template helpers for navigation, galleries, and SEO metadata.
