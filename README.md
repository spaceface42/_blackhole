# GitHub JSON Page DB

A tiny vanilla JavaScript admin page for managing page records as a JSON database in [`spaceface42/_blackhole`](https://github.com/spaceface42/_blackhole).

It runs fully in the browser:

- Create page or gallery records with text, cover images, and image lists
- Store drafts in `localStorage`
- Load `data/meta.json` plus individual page files from GitHub
- Save page files and uploaded images back to GitHub with the Contents API
- Import and export a local JSON backup

## Use

Open `admin.html` in a browser.

For GitHub saving:

1. Create a fine-grained GitHub token for `spaceface42/_blackhole`.
2. Give it **Contents: Read and write** repository permissions.
3. Paste the token into the admin page.
4. Click **Load GitHub DB**.
5. Create or edit pages.
6. Optionally choose cover/gallery image files.
7. Click **Save to GitHub**.

The token is stored only in this browser's `localStorage`. Use **Forget token** to remove it.

Images can be uploaded as JPG, PNG, WebP, or GIF. Each image must be 2 MB or smaller.

## File Layout

```txt
data/
  meta.json
  pages/
    page-1.json
    gallery-1.json
  assets/
    page-1/
      cover.jpg
      image-1.jpg
```

`data/meta.json` is the index:

```json
{
  "version": 1,
  "pages": [
    {
      "id": "page-1",
      "slug": "page-1",
      "type": "page",
      "title": "Example page",
      "subtitle": "Short subtitle",
      "published": true,
      "order": 1,
      "file": "data/pages/page-1.json",
      "updatedAt": "2026-06-01T09:30:00.000Z"
    }
  ]
}
```

Each page lives in its own file, for example `data/pages/page-1.json`:

```json
{
  "id": "page-1",
  "slug": "page-1",
  "type": "page",
  "title": "Example page",
  "subtitle": "Short subtitle",
  "body": "Main body text",
  "coverImage": {
    "id": "cover",
    "src": "data/assets/page-1/cover.jpg",
    "alt": "Cover image description",
    "caption": ""
  },
  "images": [
    {
      "id": "image-1",
      "src": "data/assets/page-1/image-1.jpg",
      "alt": "Image description",
      "caption": "Optional caption"
    }
  ],
  "published": true,
  "createdAt": "2026-06-01T09:30:00.000Z",
  "updatedAt": "2026-06-01T09:30:00.000Z"
}
```

## Notes

The app detects the repository's default branch automatically. Image fields can store either uploaded repo paths or external URLs.
