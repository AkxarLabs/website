# Styleguide

## Direction

The site is warm, minimal, and research-oriented: generous spacing, fine lines,
quiet cards, serif accents, and a restrained off-white canvas. It draws from the
Self Esteem template's editorial typography while shifting toward the supplied
human/AI hand concept.

## Tokens

- Ink: `#111314`
- Paper: `#f7f2ea`
- Strong paper: `#fffaf3`
- Lines: `#ded4c7`, `#cdbdab`
- Accents: clay `#a97955`, sage `#6f7d6a`, blue `#536b7c`

## Components

- `SiteHeader.astro`: brand mark, primary navigation, and persisted light/dark
  mode toggle.
- `HandsConnection.astro` / `hands-scene.ts`: real Three.js/WebGL mesh hands
  with matte paper and porcelain surfaces, spatial ink contours, construction
  loops, vertex marks, perspective, studio lighting, and cast shadows. The human
  hand is one continuous sculpted surface; the robot has distinct finger segments
  and hinges. The upper-left and lower-right hands approach diagonally on scroll
  and rotate in depth. Pointer movement gently turns the whole 3D composition
  around the shared fingertip contact point. Reduced motion fixes the joined pose.
  The renderer is lazy-loaded and renders only while changing and visible.
  `public/models/hands.glb` is authored locally by `scripts/generate-hands.mjs`;
  run `npm run generate:hands` after changing its geometry or ink paths. Geometry
  is batched by material for mobile performance. The inline SVG is a fallback for
  disabled JavaScript, unavailable WebGL, or context loss. All assets are local,
  base-path aware, and work on static GitHub Pages with no server or CDN.
- `Footer.astro`: footer navigation, RSS link, and (newsletter signup removed until a real mailing list exists).
- `PageLayout.astro`: shared layout for about, research, tag, and article pages.

## Rules

- Keep page count small: home, about, research, article pages, tags, RSS.
- Keep cards at `8px` radius.
- Prefer local assets in `public/` over external image URLs.
- Keep research titles direct and readable.
- Keep visible copy short, factual, and non-speculative; add claims only once
  there is work to back them.
- Dark mode should use `data-theme="dark"` tokens rather than one-off color
  overrides.

## Launch state

- The site is scoped to the lab's multi-agent evaluation and oversight focus.
- The four template posts in `src/content/posts/` are marked `draft: true`, which
  hides them from the research list, tags, and RSS. Remove the flag (or add real
  posts) to bring publications back; `/research` shows a coming-soon state while
  there are none.
- The footer newsletter form and RSS link were removed; the form code is in git
  history.
