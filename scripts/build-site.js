const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const sourceDir = path.join(rootDir, "public.source");
const outputDir = path.join(rootDir, "_docs");
const dataDir = path.join(rootDir, "data");
const metaPath = path.join(dataDir, "meta.json");

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

  return { records, pages };
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
  return attributes.href || record.url || `${record.slug || record.id}.html`;
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
  const items = pages
    .filter((page) => !type || page.type === type)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  if (items.length === 0) {
    return "";
  }

  return [
    '<ul class="database-list">',
    ...items.map((record) => `<li>${renderDatabaseLink(record, { ...attributes, field })}</li>`),
    "</ul>"
  ].join("\n");
}

function replaceDatabaseTags(html, database, currentRecord = null) {
  const { records, pages } = database;
  const pairedTag = /<database\b([^>]*)><\/database>/gi;
  const selfClosingTag = /<database\b([^>]*)\/>/gi;
  const linkPairedTag = /<database-link\b([^>]*)><\/database-link>/gi;
  const linkSelfClosingTag = /<database-link\b([^>]*)\/>/gi;
  const listPairedTag = /<database-list\b([^>]*)><\/database-list>/gi;
  const listSelfClosingTag = /<database-list\b([^>]*)\/>/gi;

  const replaceTag = (_match, rawAttributes) => {
    const attributes = parseAttributes(rawAttributes);
    const record = attributes.id ? records.get(attributes.id) : currentRecord;
    const field = attributes.field || "body";

    return renderField(record, field);
  };

  const replaceLink = (_match, rawAttributes) => {
    const attributes = parseAttributes(rawAttributes);
    return renderDatabaseLink(records.get(attributes.id), attributes);
  };

  const replaceList = (_match, rawAttributes) => renderDatabaseList(pages, parseAttributes(rawAttributes));

  return html
    .replace(listPairedTag, replaceList)
    .replace(listSelfClosingTag, replaceList)
    .replace(linkPairedTag, replaceLink)
    .replace(linkSelfClosingTag, replaceLink)
    .replace(pairedTag, replaceTag)
    .replace(selfClosingTag, replaceTag);
}

function processHtmlFiles(database) {
  for (const filePath of findFiles(outputDir, ".html")) {
    const html = fs.readFileSync(filePath, "utf8");
    fs.writeFileSync(filePath, replaceDatabaseTags(html, database));
  }
}

function generatePageFiles(database) {
  const templatePath = path.join(outputDir, "index.html");

  if (!fs.existsSync(templatePath)) {
    return;
  }

  const template = fs.readFileSync(templatePath, "utf8");

  database.pages.forEach((page, index) => {
    const outputHtml = replaceDatabaseTags(template, database, page);
    const outputPath = path.join(outputDir, outputFileNameForPage(page));

    fs.writeFileSync(outputPath, outputHtml);

    if (index === 0) {
      fs.writeFileSync(templatePath, outputHtml);
    }
  });
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
  copyDir(path.join(dataDir, "assets"), path.join(outputDir, "data/assets"));
  const database = loadDatabase();
  generatePageFiles(database);
  processHtmlFiles(database);
  console.log(`Built static site in ${path.relative(rootDir, outputDir)}/`);
}

build();
