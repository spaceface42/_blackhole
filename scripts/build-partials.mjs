import { cp, mkdir, readFile, rm, writeFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, "gitcms.config.json");

const DEFAULT_CONFIG = {
  version: 1,
  content: {
    partialsDir: "src/partials",
    partialLinkRel: "partial"
  },
  media: {
    mediaDir: "src/media",
    publicPath: "./media/",
    maxUploadBytes: 5242880,
    allowedExtensions: ["jpg", "jpeg", "png", "webp", "gif"]
  },
  preview: {
    css: []
  },
  build: {
    sourceDir: "src",
    outputDir: "dist"
  }
};

async function loadConfig() {
  if (!existsSync(CONFIG_PATH)) return DEFAULT_CONFIG;

  const raw = await readFile(CONFIG_PATH, "utf8");
  const user = JSON.parse(raw);

  return {
    ...DEFAULT_CONFIG,
    ...user,
    content: {
      ...DEFAULT_CONFIG.content,
      ...(user.content || {})
    },
    media: {
      ...DEFAULT_CONFIG.media,
      ...(user.media || {})
    },
    preview: {
      ...DEFAULT_CONFIG.preview,
      ...(user.preview || {})
    },
    build: {
      ...DEFAULT_CONFIG.build,
      ...(user.build || {})
    }
  };
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function isInside(child, parent) {
  const rel = path.relative(parent, child);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...await walk(full));
    } else if (entry.isFile()) {
      files.push(full);
    }
  }

  return files;
}

async function replaceAsync(str, regex, replacer) {
  const matches = [...str.matchAll(regex)];
  let out = str;

  for (const match of matches.reverse()) {
    const replacement = await replacer(match);
    out =
      out.slice(0, match.index) +
      replacement +
      out.slice(match.index + match[0].length);
  }

  return out;
}

async function inlinePartials(htmlFile) {
  let html = await readFile(htmlFile, "utf8");

  const linkRegex =
    /<link\b(?=[^>]*\brel=["']partial["'])(?=[^>]*\bhref=["']([^"']+)["'])[^>]*\/?>/gi;

  html = await replaceAsync(html, linkRegex, async (match) => {
    const href = match[1];
    const partialPath = path.resolve(path.dirname(htmlFile), href);

    if (!existsSync(partialPath)) {
      throw new Error(
        `Partial not found: ${href} referenced by ${toPosix(
          path.relative(ROOT, htmlFile)
        )}`
      );
    }

    return await readFile(partialPath, "utf8");
  });

  return html;
}

const config = await loadConfig();

const sourceDir = path.resolve(ROOT, config.build.sourceDir);
const outputDir = path.resolve(ROOT, config.build.outputDir);
const partialsDir = path.resolve(ROOT, config.content.partialsDir);

if (!existsSync(sourceDir)) {
  throw new Error(`Source directory not found: ${config.build.sourceDir}`);
}

if (sourceDir === outputDir) {
  throw new Error("Source directory and output directory cannot be the same.");
}

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

const sourceFiles = await walk(sourceDir);

for (const srcFile of sourceFiles) {
  const rel = path.relative(sourceDir, srcFile);
  const outFile = path.join(outputDir, rel);

  // Partials are source-only. They are inlined into pages, not copied to dist.
  if (isInside(srcFile, partialsDir)) continue;

  await mkdir(path.dirname(outFile), { recursive: true });

  if (/\.html?$/i.test(srcFile)) {
    const builtHtml = await inlinePartials(srcFile);
    await writeFile(outFile, builtHtml, "utf8");
  } else {
    await cp(srcFile, outFile, { force: true });
  }
}

console.log(`Built ${toPosix(path.relative(ROOT, outputDir))}`);
