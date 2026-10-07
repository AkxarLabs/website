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
- `HandsConnection.astro`: hero animation. Inline SVG artwork is drawn in the
  joined state; `--clasp` (0 -> 1, driven by scrollY over ~38vh) interpolates
  the hands from apart to joined, `--scroll-shift` gives the scene slower
  scroll parallax, and pointer movement shifts each `[data-parallax]` layer by
  its `data-depth`. Reduced motion renders the static joined state.
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
