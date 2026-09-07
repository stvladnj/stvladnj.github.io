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

// One file per album, in src/content/albums/*.yaml. Images are declared with image()
// so the build optimizes them and a wrong path fails the build instead of shipping a hole.
const albums = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/albums' }),
  schema: ({ image }) =>
    z.object({
      title: z.object({ en: z.string(), ru: z.string() }),
      order: z.number(),
      cover: image().optional(),  // defaults to the first photo
      // alt describes the picture for a screen reader; text is the story behind it,
      // shown on the back of the photo. Most photos have neither.
      photos: z.array(
        z.object({
          src: image(),
          alt: z.string().optional(),
          // Per language, like the album's own title. A caption present in only one
          // language simply does not appear on the other — no (i), no empty card.
          title: z.object({ en: z.string(), ru: z.string() }).partial().optional(),
          text: z.object({ en: z.string(), ru: z.string() }).partial().optional(),
        }),
      ),
    }),
});

export const collections = { sections, albums };
