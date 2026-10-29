# Loose Threads

_Unfinished thoughts on how things work._

An independent, content-first technical blog built with Astro, TypeScript, Markdown, and vanilla CSS. No personal profile, analytics, external fonts, or browser JavaScript. HTML, highlighted code, KaTeX math, and Mermaid SVG diagrams are generated at build time.

## Local development

Requires **Node.js 24** (see `.nvmrc`) and npm.

```sh
cd ~/Documents/Projects/loose-threads
nvm use                   # or install Node 24 with your preferred manager
npm ci
npm run dev
```

Open the URL Astro prints, including `/loose-threads/`. Diagrams render directly in Node; no browser installation is required.

```sh
npm run check            # Astro and TypeScript diagnostics
npm run build            # checks, static build, output verification
npm run preview          # serve the production output
```

If npm cannot write its default cache, use `npm --cache /tmp/loose-threads-npm-cache ci`.

## Write an article

Add a file to `src/content/blog/`, for example `a-small-question.md`:

```yaml
---
title: "A small question"
description: "Optional summary for the homepage, feed, and search results."
pubDate: 2026-10-28
tags: [operating-systems]
draft: true
toc: true
---

The article starts here.

## First section

Continue in ordinary Markdown.
```

The filename becomes `/writing/a-small-question/`. Use lowercase, hyphenated filenames. Posts sort newest first; dates use UTC. `title` and `pubDate` are required. `description` is optional; `tags` defaults to `[]`; `draft` and `toc` default to `false`. The table of contents lists second-level headings inside a native disclosure element.

Drafts appear in development with a label and `noindex`, but **have no generated production route and never appear in production listings, RSS, or the sitemap**. Set `draft: false` when ready. Dates control ordering, not scheduling: future-dated, non-draft posts are published immediately.

The included **Example article** demonstrates all supported formatting. Remove it or mark it as a draft before launching your own writing. No app-code changes are needed to add a post. MDX is intentionally omitted; ordinary Markdown covers this blog's needs.

### Code, mathematics, and diagrams

Use fenced code blocks with a language, such as `typescript`, `go`, `rust`, `bash`, or `json`. Astro highlights them during the build. Use `$...$` for inline math and `$$` on separate lines for display math; KaTeX renders both without browser scripts.

Use a fenced `mermaid` block for diagrams. The Node renderer supports flowcharts, state, sequence, class, ER, and XY diagrams; other Mermaid diagram types and advanced directives are not supported. Include `accTitle` and `accDescr` in each diagram for screen readers (both are required). Invalid diagrams or math fail the build so mistakes are caught before deployment. Large diagrams should be split into smaller ones for mobile readers.

Tables and footnotes (`[^note]` with a matching `[^note]: ...`) use standard GitHub-flavored Markdown. Keep a clear heading hierarchy, starting article sections at `##` because the template supplies the `h1`.

### Images and internal links

Store images in `src/content/blog/images/` and reference them relative to the Markdown file:

```md
![Describe the image meaningfully.](./images/example.png)
```

Astro processes these images and generates deployment-safe asset paths. Use meaningful alt text. Public assets live in `public/`; use `withBase('asset.svg')` from `src/lib/site.ts` in Astro templates.

In Markdown, use **relative page URLs**, not root-relative `/...` URLs or paths to `.md` sources. From a top-level post at `/writing/post-name/`:

- Home: `../../`
- About: `../../about/`
- Another post: `../another-post/`
- A heading: `#heading-slug`

Nested article filenames create nested URL paths, so adjust relative page links accordingly. The build verifier catches broken local links and asset URLs, including accidental links that escape the GitHub Pages base path.

## Deploy to GitHub Pages

The initial target is **https://bmisra03.github.io/loose-threads/**. Configuration is in `astro.config.mjs`:

- `site`: `https://bmisra03.github.io`
- `base`: `/loose-threads`
- static output with trailing slashes

1. Create an empty GitHub repository named `loose-threads` under the intended account.
2. Initialize Git here if needed, commit the source (including `package-lock.json`), set the GitHub repository as `origin`, and push branch `main`.
3. In the GitHub repository, select **Settings → Pages → Build and deployment → Source → GitHub Actions**.
4. The included workflow builds on pushes to `main` and manual dispatch, then deploys `dist/` to Pages. Pull requests run the same build checks without deploying. If the first run preceded enabling Pages, rerun it.
5. Check the Actions run and the published URL. GitHub may require you to enable Actions or allow the `github-pages` environment deployment.

No secrets or access tokens are needed by the workflow. Push access to a repository and its Pages settings must be handled by a repository owner. This project does not automatically create a remote repository or publish the site.

## Custom domain

Set the new defaults in `astro.config.mjs`, or pass environment variables to the build:

```sh
SITE_URL=https://example.com BASE_PATH=/ npm run build
```

When deploying through Actions, set these under `env` on the build step (repository variables are not automatically environment variables). For a custom domain, use the origin as `SITE_URL` and `/` as `BASE_PATH`. Add `public/CNAME` containing only your domain, configure the domain and HTTPS in GitHub Pages settings, and set the DNS records GitHub specifies. Rebuild after changing the domain: canonicals, RSS, sitemap, and asset links use this configuration.

## Structure

- `src/content/blog/` — articles and their images
- `src/content.config.ts` — frontmatter validation
- `src/lib/posts.ts` — draft filtering and chronological ordering
- `src/layouts/Layout.astro` — semantic document, navigation, SEO, social metadata
- `src/pages/` — writing, about, article routes, RSS, and 404
- `src/styles/global.css` — typography, responsive layout, print styles
- `scripts/verify-build.mjs` — static output and link checks
- `.github/workflows/deploy.yml` — build and Pages deployment

The KaTeX override keeps the renderer and its stylesheet on the same patched release.

RSS contains article summaries and links. Social previews use a local PNG; `public/social.svg` is its editable source. Run `npm run social` after editing it. The sitemap is generated by Astro. There are no runtime services, databases, or server adapters.
