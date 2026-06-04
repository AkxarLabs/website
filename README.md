# Akxar Labs Website

Minimal Astro site for an AI research organization, adapted from the free
[Self Esteem Astro template](https://astro.build/themes/details/self-esteem/).

## Structure

```text
src/
├── components/      Site header, footer, scroll hand animation
├── content/posts/   Research posts written in Markdown/MDX
├── layouts/         Base and page layouts
├── pages/           Home, about, research index, research articles, tags, RSS
└── styles/          Global design system
```

## Local Development

```bash
npm install
npm run dev
```

Build the static site:

```bash
npm run build
npm run preview
```

## Editing Content

Research posts live in `src/content/posts/`. Add a Markdown or MDX file with:

```yaml
---
title: 'Paper or note title'
headline: 'Display headline'
excerpt: 'Short summary for research cards.'
author: 'Akxar Labs'
date: 2026-01-01
cover: '/research-reasoning.svg'
featured: true
tags: ['reasoning', 'evaluation']
---
```

Local cover assets live in `public/`. Global site metadata and navigation live in
`src/lib/site.ts`.

## GitHub Pages

The workflow in `.github/workflows/deploy-pages.yml` validates pull requests and
deploys `dist/` on pushes to `main` using GitHub Pages artifacts.

For the `AkxarLabs/website` repository, Astro defaults to:

- `site`: `https://akxarlabs.github.io`
- `base`: `/website`

Override these in Actions or another host with `SITE` and `BASE_PATH`.
