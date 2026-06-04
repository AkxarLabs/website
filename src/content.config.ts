import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    shortTitle: z.string().optional(),
    headline: z.string(),
    excerpt: z.string(),
    author: z.string(),
    readTime: z.string().default('5 Min Read'),
    date: z.coerce.date(),
    cover: z.string(),
    featured: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
