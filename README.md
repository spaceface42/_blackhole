# Blackhole Site

This is the administered static site repository.

- `admin.config.json` tells the separate admin app where content lives.
- `data/` contains JSON page records and uploaded assets.
- `public.source/` contains editable HTML/CSS source files.
- `scripts/build-site.js` copies `public.source/` to `_docs/` and replaces `<database>` tags with JSON data.
- `_docs/` is the generated build output. It is deployed by GitHub Actions, not committed.

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
_docs/
```

Local builds are for preview/debugging. The normal publishing flow is GitHub Actions building `_docs/` and deploying it to GitHub Pages.

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
<database-list type="page"></database-list>
<database-link id="1"></database-link>
```

The `id` can be a page ID or slug. The `field` selects which record value to render.

Special rendering:

- `body` becomes escaped paragraphs.
- `coverImage` becomes a figure with an image.
- `images` becomes a simple gallery.
- `database-list` renders links to published records.
- `database-link` renders one link to a record.

## Templates And Navigation

Page templates live in:

```txt
public.source/templates/
```

The build chooses a template for each record with this rule:

```txt
record.template || record.type || "page"
```

For example, a record with `"type": "gallery"` uses `public.source/templates/gallery.html`. A record can override that by setting `"template": "gallery-grid"`.

Shared HTML lives in:

```txt
public.source/partials/
```

Use a partial in a template like this:

```html
<partial name="menu"></partial>
```

The main menu is configured in:

```txt
data/navigation.json
```

Menu JSON controls labels, order, and targets. Templates and CSS control the menu layout and styling.

## Data Layout

```txt
data/
  meta.json
  navigation.json
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

## Publishing

The repository stores source files only: JSON data, uploaded assets, templates, and the build script.

When changes are pushed to `main`, GitHub Actions runs `npm run build`, creates `_docs/` inside the workflow runner, uploads that folder as a GitHub Pages artifact, and deploys it. Generated HTML does not need to be committed.

In GitHub Pages settings, the publish source should be `GitHub Actions`.
That means GitHub publishes the result of the workflow, not a folder in the repo such as `docs/`.

## Automatic Docs Build

This repository includes a GitHub Actions workflow:

```txt
.github/workflows/build-docs.yml
```

When the admin saves JSON or assets to `data/`, the workflow runs:

```sh
npm run build
```

For GitHub Pages, configure this repository to publish from:

```txt
GitHub Actions
```
