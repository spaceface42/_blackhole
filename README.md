# Blackhole Site

This is the administered static site repository.

- `admin.config.json` tells the separate admin app where content lives.
- `data/` contains JSON page records and uploaded assets.
- `public.source/` contains editable HTML/CSS source files.
- `scripts/build-site.js` copies `public.source/` to `docs/` and replaces `<database>` tags with JSON data.
- `docs/` is the generated GitHub Pages output.

## Admin Connection

Use the separate `_admin` repository to edit this site.

In the admin, use this repository URL:

```txt
https://github.com/spaceface42/_blackhole
```

The admin reads `admin.config.json`, then loads:

```txt
data/meta.json
data/pages/*.json
```

When saving, the admin writes JSON files and uploaded images back to this repository.

## Local Build

Run:

```sh
npm run build
```

This regenerates:

```txt
docs/
```

GitHub Pages can publish from the `docs/` folder on the `main` branch.

## Database Tags

HTML files in `public.source/` can contain database tags. The build script replaces them with escaped values from the JSON database.

Example database tag:

```html
<database id="1" field="title"></database>
```

More examples:

```html
<database id="1" field="subtitle"></database>
<database id="1" field="body"></database>
<database id="1" field="coverImage"></database>
<database id="1" field="images"></database>
```

The `id` can be a page ID or slug. The `field` selects which record value to render.

Special rendering:

- `body` becomes escaped paragraphs.
- `coverImage` becomes a figure with an image.
- `images` becomes a simple gallery.

## Data Layout

```txt
data/
  meta.json
  pages/
    1.json
    2.json
  assets/
    page-id/
      cover.jpg
```

`data/meta.json` is the index. Each item points to a page JSON file.

Example:

```json
{
  "id": "1",
  "slug": "hello-world",
  "type": "page",
  "title": "hello-world",
  "published": true,
  "file": "data/pages/1.json"
}
```

## Publishing Options

Simple first version:

1. Let GitHub Pages publish from `main` branch, `/docs` folder.
2. After editing content, run `npm run build`.
3. Commit and push the updated `docs/`.

Later version:

1. Add GitHub Actions.
2. Let Actions run `npm run build` after admin saves JSON.
3. Deploy the generated `docs/` automatically.
