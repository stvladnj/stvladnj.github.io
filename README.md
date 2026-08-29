# stvladnj.org

Website of St. Vladimir Memorial Church, Jackson, NJ. Static site built with [Astro](https://astro.build).

```sh
npm ci
npm run dev      # http://localhost:4321
npm run build    # -> dist/
```

`.github/workflows/deploy.yml` deploys on push: `master` → production (https://stvladnj.org), `staging` → preview (https://test.stvladnj.org). Work on `staging`; promote with `git checkout master && git merge --ff-only staging && git push`.

Deeper conventions and gotchas (branch model, prose/translation rules, the things not to "fix"): see [`AGENTS.md`](AGENTS.md).

## Editing content

- **Sections** live in `src/content/sections/en/*.mdx` and `src/content/sections/ru/*.mdx`, one file per section per language. Frontmatter: `title` (nav label), `anchor`, `order`. Plain Markdown; a few sections use small components (`<Tile>`, `<CandleBox>`).
- **Attention banner** on the hero: set `cry` in `src/site.js`.
- **Schedule PDF**: replace `src/files/schedule.pdf` (keep the name). The build fingerprints the download URL, so a new file goes live with no stale‑cache issues.
- **Images**: drop the full‑resolution file in `src/images/` and reference it with a relative path (`![alt](../../../images/photo.jpg)`). The build generates WebP at the right sizes; never commit hand‑resized copies.
- **Clergy**: `people:` list in `clergy.mdx` frontmatter.
- **Candle box** inventory and prices: `src/data/inventory.js`.

`public/admin/` and `public/ponomar/` are separate prebuilt apps served as‑is.
