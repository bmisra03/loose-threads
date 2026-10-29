import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkMermaid from './scripts/remark-mermaid.mjs';

// For a custom domain, set SITE_URL=https://example.com and BASE_PATH=/.
export default defineConfig({
  site: process.env.SITE_URL || 'https://bmisra03.github.io',
  base: process.env.BASE_PATH || '/loose-threads',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: { theme: 'github-light' },
    processor: unified({
      remarkPlugins: [remarkMath, remarkMermaid],
      rehypePlugins: [[rehypeKatex, { throwOnError: true, strict: 'error' }]],
    }),
  },
});
