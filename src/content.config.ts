import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// One entry per section, in src/content/sections/{en,ru}/*.mdx.
// Language comes from the folder name; `order` sorts sections on the page.
const sections = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/sections' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(), // nav label
      anchor: z.string(), // #anchor, same in both languages
      order: z.number(),
      parallax: image().optional(), // full-bleed background photo
      people: z
        .array(z.object({ name: z.string(), role: z.string(), img: image() }))
        .optional(),
    }),
});

export const collections = { sections };
