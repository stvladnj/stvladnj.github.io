import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import svelte from '@astrojs/svelte';

export default defineConfig({
  site: 'https://stvladnj.org',
  integrations: [mdx(), svelte()],
  image: {
    layout: 'constrained',
    responsiveStyles: true,
  },
});
