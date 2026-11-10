#!/usr/bin/env node
/**
 * Site build:  src/  ->  docs/
 *
 * Run locally:   node scripts/build.mjs
 * Run in CI:     see .github/workflows/deploy.yml
 *
 * docs/ is build output only. Do NOT commit it (add "docs/" to .gitignore);
 * the GitHub Action rebuilds it from src/ on every push and publishes it.
 *
 * Needs Node 20+ and has no npm dependencies.
 *
 * To add a build step later (sitemap, minify, templates, ...), write an async
 * function and add it to STEPS at the bottom. Steps run in order and any
 * thrown error stops the build, so a broken build never replaces the live site.
 */
import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'docs');

/* ---------- what is / isn't published ---------- */

// Never copied to the public site, wherever they sit inside src/.
const EXCLUDE_NAMES = new Set(['.DS_Store', 'Thumbs.db', 'desktop.ini', '.gitkeep']);
const EXCLUDE_DIRS = new Set(['.git', '.github', 'node_modules']);
const EXCLUDE_SUFFIXES = ['~', '.swp', '.bak', '.orig'];

// If one of these shows up in src/ the build FAILS instead of publishing it.
// Anyone with the CMS token can add files to src/, so this is a cheap safety net.
const BLOCKED = [/^\.env/i, /\.pem$/i, /\.key$/i, /\.p12$/i, /\.pfx$/i, /^id_(rsa|dsa|ecdsa|ed25519)/i];

/* ---------- helpers ---------- */

const fmtBytes = (n) => (n < 1024 ? `${n} B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 ** 2).toFixed(1)} MB`);

function isInside(child, parent) {
  const rel = path.relative(parent, child);
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
}

function isExcluded(name) {
  return EXCLUDE_NAMES.has(name) || EXCLUDE_DIRS.has(name) || EXCLUDE_SUFFIXES.some((s) => name.endsWith(s));
}

// Every file under dir (relative paths), skipping excluded names.
async function listFiles(dir) {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries
    .filter((e) => e.isFile() || e.isSymbolicLink())
    .map((e) => path.relative(dir, path.join(e.parentPath ?? e.path, e.name)))
    .filter((rel) => !rel.split(path.sep).some(isExcluded));
}

/* ---------- steps ---------- */

async function checkSource() {
  // Refuse to run if the paths could make us delete the wrong thing.
  if (OUT === SRC || isInside(OUT, SRC) || isInside(SRC, OUT) || OUT === ROOT) {
    throw new Error(`Unsafe paths: src=${SRC} out=${OUT}`);
  }

  let info;
  try {
    info = await stat(SRC);
  } catch {
    throw new Error(`Source folder not found: ${SRC}`);
  }
  if (!info.isDirectory()) throw new Error(`${SRC} is not a folder`);

  const files = await listFiles(SRC);
  if (files.length === 0) {
    // Publishing an empty site would wipe the live one.
    throw new Error('src/ contains no publishable files, refusing to build an empty site');
  }

  const blocked = files.filter((f) => BLOCKED.some((re) => re.test(path.basename(f))));
  if (blocked.length) {
    throw new Error(`Refusing to publish sensitive-looking files:\n  - ${blocked.join('\n  - ')}`);
  }

  console.log(`  ${files.length} source file(s)`);
}

async function cleanOutput() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
}

async function copySource() {
  await cp(SRC, OUT, {
    recursive: true,
    dereference: true, // GitHub Pages artifacts can't contain symlinks
    filter: (from) => from === SRC || !isExcluded(path.basename(from))
  });
}

async function verifyOutput() {
  const files = await listFiles(OUT);
  let bytes = 0;
  for (const f of files) bytes += (await stat(path.join(OUT, f))).size;

  if (!files.includes('index.html')) {
    console.warn('  warning: docs/index.html is missing, the site root will show a 404');
  }
  console.log(`  ${files.length} file(s), ${fmtBytes(bytes)} -> docs/`);
}

/* Add new steps here, e.g. ['Generate sitemap', generateSitemap] */
const STEPS = [
  ['Check source', checkSource],
  ['Clean output', cleanOutput],
  ['Copy src -> docs', copySource],
  ['Verify output', verifyOutput]
];

/* ---------- run ---------- */

const started = Date.now();
try {
  for (const [name, fn] of STEPS) {
    console.log(`> ${name}`);
    await fn();
  }
  console.log(`Build finished in ${Date.now() - started} ms`);
} catch (err) {
  console.error(`\nBuild failed: ${err.message}`);
  process.exit(1);
}
