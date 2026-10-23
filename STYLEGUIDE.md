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
- `HandsConnection.astro` / `hands-scene.ts`: actual folded-sheet origami
  hands below and around the headline. Broad planar palm panels, pitched finger
  strips, raised creases, thin cut edges, and subtle pencil marks define the form.
  The left hand has continuous organic folds; the right is explicitly robotic,
  with separate blunt finger shells, exposed octagonal paper hinges, a chamfered
  palm plate, folded actuator tabs, and a faceted wrist gimbal. Every mechanical
  part is assembled from paper panels. Both share matte paper colors
  close to the background, with procedural grain and soft cast shadows. The wrists
  remain short and broad. The initial fingertip gap is deliberately small. The first
  ~180px of scrolling lower the fingers clear of the headline, then bring them
  together diagonally. Both index tips are authored at local (0,0,0), so their
  shared final positions preserve exact contact during pointer movement. Reduced
  motion shows this joined pose. Rendering pauses when idle or offscreen.
  `scripts/generate-hands.mjs` authors `public/models/hands.glb`; run
  `npm run generate:hands` after changing panels or creases. Matching transparent
  `hands-poster-*.png` renders cover loading, disabled JavaScript, unavailable WebGL
  and context loss; refresh them when the composition changes. All assets use
  content revisions and the configured base path for static GitHub Pages.
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
