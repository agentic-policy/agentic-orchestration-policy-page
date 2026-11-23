import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('..', import.meta.url));
const output = resolve(root, '_site');
const canonical = 'https://projects.zxhezexin.com/acap/';

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(resolve(root, 'site'), output, { recursive: true });

// Keep the project on its canonical domain without redirecting the embedded page.
const redirect = `<script>(() => {
  if (window.top !== window || location.hostname !== 'agentic-policy.github.io') return;
  const target = new URL('${canonical}');
  target.search = location.search;
  target.searchParams.delete('token');
  target.hash = location.hash;
  location.replace(target.href);
})();</script>`;
const html = await readFile(resolve(root, 'site/index.html'), 'utf8');
const sourceRobots = '<meta name="robots" content="index,follow">';
assert.equal(html.split(sourceRobots).length, 2, 'Expected one source indexing directive');
// Exclude the raw host from search while allowing Google to index this content
// inside the canonical-domain iframe. Keep crawling enabled to read this rule.
const embeddedHtml = html.replace(sourceRobots, '<meta name="robots" content="noindex,follow,indexifembedded">');
await writeFile(resolve(output, 'index.html'), embeddedHtml.replace('<head>', '<head>' + redirect));
await writeFile(resolve(output, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: ' + canonical + 'sitemap.xml\n');
await writeFile(resolve(output, '.nojekyll'), '');
console.log('Prepared the public project page for indexing at its canonical domain.');
