# Admin Config

`admin.config.json` describes where the separate admin app should read and write content in this repository.

The source of truth is `admin.config.json`. Its main shape is:

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
  "site": {
    "previewUrl": "https://spaceface42.github.io/_blackhole/"
  },
  "uploads": {
    "maxImageSize": 2097152,
    "allowedImageTypes": ["image/jpeg", "image/png", "image/webp", "image/gif"]
  },
  "contentTypes": [
    {
      "type": "page",
      "label": "Page",
      "fields": [
        {
          "name": "title",
          "label": "Title",
          "type": "text",
          "required": true
        }
      ]
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

Fields can be simple strings or metadata objects:

```json
{
  "name": "title",
  "label": "Title",
  "type": "text",
  "required": true
}
```

The admin uses labels, required fields, upload limits, and preview URL now. The form layout is still mostly fixed.

## Build

`build.command` documents the command that regenerates the public site:

```sh
npm run build
```

The browser admin does not run this command. It only edits data. The build should be run locally or by GitHub Actions.
