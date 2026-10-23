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

The site is served from the custom domain in `CNAME`. Astro defaults to:

- `site`: `https://akxar.xyz`
- `base`: `/`

Override these in Actions or another host with `SITE` and `BASE_PATH`.

## 3D hero artwork

The hero uses local Three.js/WebGL origami hands built from folded paper panels,
pitched finger strips, creases, and thin cut edges. The hands begin close together
and their fingertips meet during the first short scroll. The renderer loads near the viewport and pauses when idle or offscreen.
Reduced motion shows the joined pose; matching transparent poster renders
cover loading and browsers without WebGL or JavaScript.

To change the authored hand shapes or sketch lines, edit
`scripts/generate-hands.mjs`, then regenerate the checked-in static model:

```bash
npm run generate:hands
npm run build
```

Refresh the transparent `public/models/hands-poster-*.png` browser captures when
the sculpture or composition changes. The GLB, posters, and renderer are served
with the rest of the site. No external model
hosting, API keys, CDN, or server runtime is required.
