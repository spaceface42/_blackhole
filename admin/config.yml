backend:
  name: github
  repo: spaceface42/_backhole
  branch: main

media_folder: "public/uploads"
public_folder: "/uploads"

site_url: "https://spaceface42.github.io/_blackhole/"
display_url: "https://spaceface42.github.io/_blackhole/"

collections:
  - name: "pages"
    label: "Pages"
    folder: "content/pages"
    create: true
    slug: "{{slug}}"
    extension: "md"
    format: "frontmatter"

    fields:
      - label: "Template"
        name: "template"
        widget: "select"
        default: "text"
        options:
          - { label: "Text Page", value: "text" }
          - { label: "Text + Image Page", value: "text_image" }
          - { label: "Gallery Page", value: "gallery" }

      - label: "Slug"
        name: "slug"
        widget: "string"
        hint: "Example: about-us"

      - label: "Title 1"
        name: "title_1"
        widget: "string"

      - label: "Title 2"
        name: "title_2"
        widget: "string"
        required: false

      - label: "Title 3"
        name: "title_3"
        widget: "string"
        required: false

      - label: "Subtitle"
        name: "subtitle"
        widget: "string"
        required: false

      - label: "Body Text 1"
        name: "body_text_1"
        widget: "text"
        required: false

      - label: "Body Text 2"
        name: "body_text_2"
        widget: "text"
        required: false

      - label: "Picture 1"
        name: "picture_1"
        widget: "image"
        required: false

      - label: "Pictures Gallery"
        name: "pictures_gallery"
        widget: "list"
        required: false
        fields:
          - label: "Image"
            name: "image"
            widget: "image"

          - label: "Alt Text"
            name: "alt"
            widget: "string"
            required: false

          - label: "Caption"
            name: "caption"
            widget: "string"
            required: false

      - label: "Body"
        name: "body"
        widget: "markdown"
        required: false

  - name: "site_settings"
    label: "Site Settings"
    files:
      - name: "general"
        label: "General Settings"
        file: "content/settings/general.yml"
        fields:
          - label: "Site Title"
            name: "site_title"
            widget: "string"

          - label: "Site Description"
            name: "site_description"
            widget: "text"
            required: false

          - label: "Logo"
            name: "logo"
            widget: "image"
            required: false