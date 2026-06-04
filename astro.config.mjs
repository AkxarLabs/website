import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

const repository = process.env.GITHUB_REPOSITORY ?? 'AkxarLabs/website';
const repositoryName = repository.split('/')[1] ?? 'website';
const isUserSite = repositoryName.endsWith('.github.io');
const site = process.env.SITE ?? `https://${repository.split('/')[0].toLowerCase()}.github.io`;
const base = process.env.BASE_PATH ?? (isUserSite ? '/' : `/${repositoryName}`);

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  integrations: [mdx(), sitemap()],
});
