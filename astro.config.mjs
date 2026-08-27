import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import svelte from '@astrojs/svelte';

export default defineConfig({
  // SITE_URL is set by the deploy workflow (staging builds get https://test.stvladnj.org).
  site: process.env.SITE_URL ?? 'https://stvladnj.org',
  integrations: [mdx(), svelte()],
  image: {
    layout: 'constrained',
    responsiveStyles: true,
  },
});
