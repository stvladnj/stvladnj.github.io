# stvladnj.org

Website of St. Vladimir Memorial Church, Jackson, NJ. Static site built with [Astro](https://astro.build); deployed to GitHub Pages by the workflow in `.github/workflows/deploy.yml` on every push to `master`.

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # -> dist/
```

## Editing content

- **Sections** live in `src/content/sections/en/*.mdx` and `src/content/sections/ru/*.mdx`, one file per section per language. Frontmatter: `title` (nav label), `anchor`, `order`. Plain Markdown; a few sections use small components (`<Tile>`, `<CandleBox>`).
- **Attention banner** on the hero: set `cry` in `src/site.js`.
- **Schedule PDF**: replace `public/files/schedule.pdf`.
- **Images**: drop the full‑resolution file in `src/images/` and reference it with a relative path (`![alt](../../../images/photo.jpg)`). The build generates WebP at the right sizes; never commit hand‑resized copies.
- **Clergy**: `people:` list in `clergy.mdx` frontmatter.
- **Candle box** inventory and prices: `src/data/inventory.ts`.

`public/admin/` and `public/ponomar/` are separate prebuilt apps served as‑is.
