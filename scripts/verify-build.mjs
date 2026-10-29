import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const origin = process.env.SITE_URL || 'https://bmisra03.github.io';
const base = `/${(process.env.BASE_PATH || '/loose-threads').replace(/^\/+|\/+$/g, '')}`.replace(/\/$/, '');
const root = path.resolve('dist');
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : path.join(dir, entry.name)))).flat();
}
const files = await walk(root);
const htmlFiles = files.filter(file => file.endsWith('.html'));
const pages = new Map(await Promise.all(htmlFiles.map(async file => [file, await readFile(file, 'utf8')])));
const errors = [];
for (const [file, html] of pages) {
  const relative = path.relative(root, file).split(path.sep).join('/').replace(/index\.html$/, '');
  const url = new URL(`${base}/${relative}`, origin);
  if (/<script\b/i.test(html)) errors.push(`${relative}: unexpected client-side JavaScript`);
  if (!html.includes('<title>') || !html.includes('name="description"')) errors.push(`${relative}: missing SEO metadata`);
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const raw = match[1].replaceAll('&amp;', '&');
    const target = new URL(raw, url);
    if (target.origin !== url.origin || !['http:', 'https:'].includes(target.protocol)) continue;
    if (base && target.pathname !== base && !target.pathname.startsWith(`${base}/`)) {
      errors.push(`${relative}: link escapes base path: ${raw}`);
      continue;
    }
    let local = path.join(root, decodeURIComponent(target.pathname.slice(base.length)));
    try {
      const info = await stat(local);
      if (info.isDirectory()) local = path.join(local, 'index.html');
      await stat(local);
      if (target.hash && local.endsWith('.html')) {
        const linkedHTML = pages.get(local) || await readFile(local, 'utf8');
        const id = decodeURIComponent(target.hash.slice(1));
        if (!linkedHTML.includes(`id="${id}"`)) errors.push(`${relative}: missing anchor: ${raw}`);
      }
    } catch {
      errors.push(`${relative}: broken local link: ${raw}`);
    }
  }
}
const rss = await readFile(path.join(root, 'rss.xml'), 'utf8');
const sitemap = await readFile(path.join(root, 'sitemap-0.xml'), 'utf8');
assert(rss.includes(`${origin}${base}/writing/`) || !rss.includes('<item>'), 'RSS URLs must include the site and base');
assert(sitemap.includes(`${origin}${base}/`), 'Sitemap URLs must include the site and base');
for (const file of (await walk(path.resolve('src/content/blog'))).filter(file => file.endsWith('.md'))) {
  const source = await readFile(file, 'utf8');
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] || '';
  const isDraft = /^draft:\s*true\s*$/m.test(frontmatter);
  const id = path.relative(path.resolve('src/content/blog'), file).replace(/\.md$/, '').split(path.sep).join('/');
  if (!isDraft) {
    const article = await readFile(path.join(root, 'writing', id, 'index.html'), 'utf8');
    if (/^```mermaid/m.test(source)) assert(article.includes('class="diagram"'), `Unrendered diagram: ${id}`);
    if (source.includes('$$')) assert(article.includes('class="katex'), `Unrendered mathematics: ${id}`);
    continue;
  }
  assert(!pages.get(path.join(root, 'index.html')).includes(`/writing/${id}/`), `Draft leaked onto homepage: ${id}`);
  assert(!files.includes(path.join(root, 'writing', id, 'index.html')), `Draft route leaked: ${id}`);
  assert(!rss.includes(`/writing/${id}/`) && !sitemap.includes(`/writing/${id}/`), `Draft leaked into feed or sitemap: ${id}`);
}
assert.equal(errors.length, 0, errors.join('\n'));
console.log(`Verified ${htmlFiles.length} HTML pages: local links, anchors, SEO metadata, feed/sitemap paths, draft exclusion, and zero browser scripts.`);
