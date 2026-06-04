const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const sourceDir = path.join(rootDir, "public.source");
const outputDir = path.join(rootDir, "_docs");
const dataDir = path.join(rootDir, "data");
const metaPath = path.join(dataDir, "meta.json");
const navigationPath = path.join(dataDir, "navigation.json");
const templatesDir = path.join(sourceDir, "templates");
const partialsDir = path.join(sourceDir, "partials");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function removeDir(dirPath) {
  fs.rmSync(dirPath, { force: true, recursive: true });
}

function copyDir(fromDir, toDir) {
  if (!fs.existsSync(fromDir)) {
    return;
  }

  ensureDir(toDir);

  for (const entry of fs.readdirSync(fromDir, { withFileTypes: true })) {
    const fromPath = path.join(fromDir, entry.name);
    const toPath = path.join(toDir, entry.name);

    if (entry.isDirectory()) {
      copyDir(fromPath, toPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(fromPath, toPath);
    }
  }
}

function findFiles(dirPath, extension) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const results = [];

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const filePath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      results.push(...findFiles(filePath, extension));
    } else if (entry.isFile() && filePath.endsWith(extension)) {
      results.push(filePath);
    }
  }

  return results;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseAttributes(value) {
  const attributes = {};
  const pattern = /([a-zA-Z0-9_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let match;

  while ((match = pattern.exec(value))) {
    attributes[match[1]] = match[2] ?? match[3] ?? "";
  }

  return attributes;
}

function textToHtml(value) {
  return String(value ?? "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

function renderImage(image) {
  if (!image?.src) {
    return "";
  }

  const caption = image.caption ? `<figcaption>${escapeHtml(image.caption)}</figcaption>` : "";

  return [
    '<figure class="database-image">',
    `<img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt || "")}">`,
    caption,
    "</figure>"
  ].filter(Boolean).join("\n");
}

function renderGallery(images) {
  if (!Array.isArray(images) || images.length === 0) {
    return "";
  }

  return [
    '<div class="database-gallery">',
    ...images.map((image) => renderImage(image)),
    "</div>"
  ].join("\n");
}

function renderField(record, field) {
  if (!record) {
    return "";
  }

  if (field === "body") {
    return textToHtml(record.body);
  }

  if (field === "coverImage") {
    return renderImage(record.coverImage);
  }

  if (field === "images") {
    return renderGallery(record.images);
  }

  return escapeHtml(record[field] ?? "");
}

function loadNavigation() {
  if (!fs.existsSync(navigationPath)) {
    return {};
  }

  return readJson(navigationPath);
}

function loadDatabase() {
  const meta = readJson(metaPath);
  const records = new Map();
  const pages = [];

  for (const item of meta.pages || []) {
    if (item.published === false) {
      continue;
    }

    const pagePath = path.join(rootDir, item.file || `data/pages/${item.id}.json`);

    if (!fs.existsSync(pagePath)) {
      console.warn(`Missing page file: ${item.file}`);
      continue;
    }

    const page = readJson(pagePath);
    const record = { ...page, order: item.order ?? pages.length + 1 };
    pages.push(record);
    records.set(record.id, record);
    records.set(record.slug, record);
  }

  return {
    records,
    pages: pages.sort((a, b) => (a.order || 0) - (b.order || 0)),
    navigation: loadNavigation()
  };
}

function outputFileNameForPage(page) {
  const slug = String(page.slug || page.id || "page")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug || page.id || "page"}.html`;
}

function recordHref(record, attributes = {}) {
  return attributes.href || record.url || outputFileNameForPage(record);
}

function renderDatabaseLink(record, attributes = {}) {
  if (!record) {
    return "";
  }

  const field = attributes.field || "title";
  const label = renderField(record, field);

  return `<a href="${escapeHtml(recordHref(record, attributes))}">${label}</a>`;
}

function renderDatabaseList(pages, attributes = {}) {
  const type = attributes.type || "";
  const field = attributes.field || "title";
  const items = pages.filter((page) => !type || page.type === type);

  if (items.length === 0) {
    return "";
  }

  return [
    '<ul class="database-list">',
    ...items.map((record) => `<li>${renderDatabaseLink(record, { ...attributes, field })}</li>`),
    "</ul>"
  ].join("\n");
}

function renderMenuItems(database, attributes = {}) {
  const name = attributes.name || "main";
  const items = Array.isArray(database.navigation?.[name]) ? database.navigation[name] : [];

  if (items.length === 0) {
    return "";
  }

  return [
    '<ul class="site-menu-items">',
    ...items.map((item) => {
      const record = item.page ? database.records.get(item.page) : null;
      const href = item.href || (record ? outputFileNameForPage(record) : "#");
      const label = item.label || record?.title || href;

      return `<li><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></li>`;
    }),
    "</ul>"
  ].join("\n");
}

function readPartial(name) {
  const safeName = String(name || "").trim().replace(/[^a-zA-Z0-9_-]+/g, "");

  if (!safeName) {
    return "";
  }

  const partialPath = path.join(partialsDir, `${safeName}.html`);

  if (!fs.existsSync(partialPath)) {
    console.warn(`Missing partial: ${safeName}`);
    return "";
  }

  return fs.readFileSync(partialPath, "utf8");
}

function replaceTemplateTags(html, database, currentRecord = null) {
  const { records, pages } = database;
  const partialTag = /<partial\b([^>]*)><\/partial>|<partial\b([^>]*)\/>/gi;
  const menuItemsTag = /<site-menu-items\b([^>]*)><\/site-menu-items>|<site-menu-items\b([^>]*)\/>/gi;
  const databaseTag = /<database\b([^>]*)><\/database>|<database\b([^>]*)\/>/gi;
  const databaseLinkTag = /<database-link\b([^>]*)><\/database-link>|<database-link\b([^>]*)\/>/gi;
  const databaseListTag = /<database-list\b([^>]*)><\/database-list>|<database-list\b([^>]*)\/>/gi;

  return html
    .replace(partialTag, (_match, pairedAttrs, selfAttrs) => {
      const attributes = parseAttributes(pairedAttrs || selfAttrs || "");
      return replaceTemplateTags(readPartial(attributes.name), database, currentRecord);
    })
    .replace(menuItemsTag, (_match, pairedAttrs, selfAttrs) =>
      renderMenuItems(database, parseAttributes(pairedAttrs || selfAttrs || ""))
    )
    .replace(databaseListTag, (_match, pairedAttrs, selfAttrs) =>
      renderDatabaseList(pages, parseAttributes(pairedAttrs || selfAttrs || ""))
    )
    .replace(databaseLinkTag, (_match, pairedAttrs, selfAttrs) => {
      const attributes = parseAttributes(pairedAttrs || selfAttrs || "");
      return renderDatabaseLink(records.get(attributes.id), attributes);
    })
    .replace(databaseTag, (_match, pairedAttrs, selfAttrs) => {
      const attributes = parseAttributes(pairedAttrs || selfAttrs || "");
      const record = attributes.id ? records.get(attributes.id) : currentRecord;
      return renderField(record, attributes.field || "body");
    });
}

function templateNameForPage(page) {
  return String(page.template || page.type || "page").trim().replace(/[^a-zA-Z0-9_-]+/g, "") || "page";
}

function readTemplate(name) {
  const templatePath = path.join(templatesDir, `${name}.html`);

  if (fs.existsSync(templatePath)) {
    return fs.readFileSync(templatePath, "utf8");
  }

  if (name !== "page") {
    console.warn(`Missing template: ${name}.html. Falling back to page.html.`);
    return readTemplate("page");
  }

  throw new Error("Missing required template: public.source/templates/page.html");
}

function processCopiedHtmlFiles(database) {
  for (const filePath of findFiles(outputDir, ".html")) {
    const html = fs.readFileSync(filePath, "utf8");
    fs.writeFileSync(filePath, replaceTemplateTags(html, database));
  }
}

function generatePageFiles(database) {
  const homeTemplate = readTemplate("home");
  const homeRecord = database.pages[0] || null;

  fs.writeFileSync(path.join(outputDir, "index.html"), replaceTemplateTags(homeTemplate, database, homeRecord));

  for (const page of database.pages) {
    const template = readTemplate(templateNameForPage(page));
    const outputHtml = replaceTemplateTags(template, database, page);
    fs.writeFileSync(path.join(outputDir, outputFileNameForPage(page)), outputHtml);
  }
}

function build() {
  if (!fs.existsSync(sourceDir)) {
    throw new Error("Missing public.source directory.");
  }

  if (!fs.existsSync(metaPath)) {
    throw new Error("Missing data/meta.json.");
  }

  removeDir(outputDir);
  copyDir(sourceDir, outputDir);
  removeDir(path.join(outputDir, "partials"));
  removeDir(path.join(outputDir, "templates"));
  copyDir(path.join(dataDir, "assets"), path.join(outputDir, "data/assets"));
  const database = loadDatabase();
  generatePageFiles(database);
  processCopiedHtmlFiles(database);
  console.log(`Built static site in ${path.relative(rootDir, outputDir)}/`);
}

build();
