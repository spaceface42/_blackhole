# Blackhole Site

This is the administered static site repository.

- `admin.config.json` tells the separate admin app where content lives.
- `data/` contains JSON page records and uploaded assets.
- `public.source/` contains editable HTML/CSS source files.
- `scripts/build-site.js` copies `public.source/` to `docs/` and replaces `<database>` tags with JSON data.
- `docs/` is the generated GitHub Pages output.

Run locally:

```sh
npm run build
```

Example database tag:

```html
<database id="1" field="title"></database>
```
