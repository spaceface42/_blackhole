# Admin Config

`admin.config.json` describes where the separate admin app should read and write content in this repository.

Current config:

```json
{
  "version": 1,
  "name": "Blackhole Site",
  "paths": {
    "meta": "data/meta.json",
    "pages": "data/pages",
    "assets": "data/assets",
    "source": "public.source",
    "output": "docs"
  },
  "contentTypes": [
    {
      "type": "page",
      "label": "Page",
      "fields": ["title", "subtitle", "body", "coverImage", "images"]
    },
    {
      "type": "gallery",
      "label": "Gallery",
      "fields": ["title", "subtitle", "coverImage", "images"]
    }
  ],
  "build": {
    "command": "npm run build",
    "output": "docs"
  }
}
```

## Path Meanings

- `paths.meta`: the JSON index file.
- `paths.pages`: folder for individual page records.
- `paths.assets`: folder for uploaded images and other files.
- `paths.source`: source HTML/CSS folder used by the static build.
- `paths.output`: generated GitHub Pages folder.

## Content Types

`contentTypes` tells the admin which record types this site supports.

The current admin UI supports:

- `page`
- `gallery`

Both are stored as JSON records in `data/pages/`.

## Build

`build.command` documents the command that regenerates the public site:

```sh
npm run build
```

The browser admin does not run this command. It only edits data. The build should be run locally or by GitHub Actions.
