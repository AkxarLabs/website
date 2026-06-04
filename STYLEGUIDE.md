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

- `SiteHeader.astro`: brand mark and primary navigation.
- `HandsConnection.astro`: scroll-driven hero animation using inline SVG and one
  small script.
- `Footer.astro`: footer navigation, RSS link, and placeholder email signup.
- `PageLayout.astro`: shared layout for about, research, tag, and article pages.

## Rules

- Keep page count small: home, about, research, article pages, tags, RSS.
- Keep cards at `8px` radius.
- Prefer local assets in `public/` over external image URLs.
- Keep research titles direct and readable.
- Use placeholder copy only until real lab language, publications, and contact
  details are ready.
