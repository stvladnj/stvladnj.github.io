# AGENTS.md

Guidance for AI agents working in this repo. Humans: see `README.md`.

## What this is

Static website for St. Vladimir Memorial Church, Jackson, NJ — bilingual (en / ru),
built with [Astro](https://astro.build). Content is MDX; the only client-side JS is
one Svelte island (the candle box). Migrated from Jekyll + Bootstrap + jQuery; that
stack is gone — do not reintroduce it.

## Setup & commands

Node **≥ 22.12** is required (Astro 7). If `node -v` shows older, run `nvm use 22`.

```sh
npm ci                 # install (package-lock.json is authoritative; bun.lock is stale, ignore it)
npm run dev            # http://localhost:4321
npm run build          # -> dist/
SITE_URL=https://test.stvladnj.org npm run build   # what the staging deploy runs
```

Always `npm run build` before committing — it's the only check (no test suite, no
linter, no CI beyond the deploy).

## Branches & deploy

| Branch | Deploys to | How |
|---|---|---|
| `master` | https://stvladnj.org (production) | this repo's GitHub Pages, source = GitHub Actions |
| `staging` | https://test.stvladnj.org | built here, force-pushed to the `stvladnj/website` bucket repo |

- `staging` is the working branch. Commit there; push when the user asks.
- Promote to production: `git checkout master && git merge --ff-only staging && git push`.
- `SITE_URL` (set by `.github/workflows/deploy.yml`) drives `astro.config.mjs` `site`,
  the hreflang links, and the `noindex` meta. Non-production builds get `<meta robots noindex>`.

## Where content lives

- **Sections**: `src/content/sections/{en,ru}/*.mdx`, one file per section per language.
  Frontmatter: `title` (nav label), `anchor` (same in both languages), `order` (page sort),
  optional `parallax` (bg image), optional `people` (clergy cards). Schema in `src/content.config.js`.
- **Site-wide settings + the hero "cry" announcement banner**: `src/site.js`.
- **Candle box** inventory, prices, PayPal client id, thank-you text: `src/data/inventory.js`.
- **Schedule PDF**: `public/files/schedule.pdf`.
- **Clergy**: `people:` list in `clergy.mdx` frontmatter.

Keep en and ru in sync — a change to one language's section almost always needs the mirror.

## Editing prose — conventions & things not to "fix"

- **Dashes**: spaced em dash `—` for a sentence break, in both languages. Hyphens only in
  compounds (`Храм-Памятник`, `pre-Lenten`, `Нью-Йоркский`) and numbers (`74-3224137`, `2-й`).
- **Russian** is modern orthography and uses `ё` where it's phonetically required — *except*
  `confessions.mdx`, a traditional pre-confession guide that deliberately keeps some Church
  Slavonic word-forms (`объядению`, `действами`, `субботным`, `иные боги`) and archaic
  phrasing. Don't "correct" these. (`наслаждением их` there is an older genitive, left as-is.)
- **`clergy.mdx`** (both languages): the see-before-name title order — "Metropolitan of
  Eastern America & New York Nicholas", "митрополит Восточно-Американский … Николай" — is the
  ecclesiastical convention and is intentional; the all-caps surname matches the frontmatter.
- **`schedule.mdx`** date list: a fixed annual block, reissued each December by Fr. Serge and
  swapped wholesale (en + ru). Past dates in it are expected, not stale.

## Conventions & gotchas

- **Images**: drop the full-resolution original in `src/images/`, reference it with a
  relative path (`../../../images/foo.jpg` from a section). Astro generates responsive
  WebP at build. Never commit hand-resized or pre-darkened copies — darkening is done
  with CSS (`filter` / overlays).
- **Icons**: SVGs in `src/icons/*.svg`, inlined by `<Icon name="foo" />` (`Icon.astro`
  globs the dir). Referenced by `name`, so a filename grep won't find usages — check for
  `name="foo"` / `icon="foo"`. Remove the SVG when its last usage goes.
- **Scroll-driven animations** (nav reveal, parallax) in `src/styles/global.css` use
  **longhand properties only** — lightningcss folds `animation-timeline` into the
  `animation` shorthand, which browsers reject. Keep it longhand.
- **MDX not MD**: sections are `.mdx` because column layouts use components (`<Tile>`,
  `<CandleBox>`) with JSX children. Plain `.md` still parses.
- `public/admin/` and `public/ponomar/` are separate prebuilt apps served as-is — don't
  edit their bundles.
- The candle box's "small" candle intentionally reuses `candle_large.png` in `inventory.js`.

## Commits

- Conventional-ish subject lines describing the user-visible effect (see `git log`).
- Commit on `staging`; don't push unless asked.
