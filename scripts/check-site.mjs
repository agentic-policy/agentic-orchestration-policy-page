import { readdir, readFile, lstat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve, relative } from 'node:path';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('..', import.meta.url));
const site = resolve(root, 'site');
const manifest = JSON.parse(await readFile(resolve(root, 'site-manifest.json'), 'utf8'));
const files = [];
async function walk(dir) {
  for (const name of await readdir(dir)) {
    const path = resolve(dir, name);
    const stat = await lstat(path);
    assert(!stat.isSymbolicLink(), `Symlink not allowed: ${path}`);
    if (stat.isDirectory()) await walk(path);
    else {
      assert(stat.isFile(), `Unexpected file type: ${path}`);
      files.push(relative(site, path).replaceAll('\\', '/'));
    }
  }
}
await walk(site);
assert.deepEqual(files.sort(), Object.keys(manifest).sort(), 'Site file list differs from verified export');
let bytes = 0;
for (const rel of files) {
  const content = await readFile(resolve(site, rel));
  assert.equal(content.length, manifest[rel].bytes, `Size changed: ${rel}`);
  assert.equal(createHash('sha256').update(content).digest('hex'), manifest[rel].sha256, `Content changed: ${rel}`);
  bytes += content.length;
}
assert(files.includes('index.html'));
assert(files.includes('paper/acap-technical-report.pdf'));
const html = await readFile(resolve(site, 'index.html'), 'utf8');
assert(!/noindex|preview-document|preview-gate/.test(html), 'The project page must remain publicly accessible');
assert(html.includes('<link rel="canonical" href="https://projects.zxhezexin.com/acap/">'));
for (const match of html.matchAll(/\b(?:src|href|poster)=["']([^"']+)["']/g)) {
  const url = match[1];
  if (/^(?:[a-z][a-z0-9+.-]*:|#|\/\/)/i.test(url)) continue;
  const path = decodeURIComponent(url.split(/[?#]/)[0]);
  assert(files.includes(path), `Missing relative asset: ${url}`);
}
console.log(`Verified ${files.length} files, ${files.filter(p => p.endsWith('.mp4')).length} videos, ${bytes} bytes.`);
