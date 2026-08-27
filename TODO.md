# Migration plan: Jekyll → Astro (no Bootstrap, no Tailwind, no jQuery)

> **Status (2026‑08‑27, branch `facelift-astro`): implemented.** Checked items below are done.
> Verified with headless Chrome against `astro preview`: both languages render, mobile menu works,
> nav reveal + parallax animations active, candle box hydrates and computes totals, PayPal SDK loads,
> initial transfer **543 KB** (was ~23 MB), zero console errors, only `<script>` is the island loader.
>
> **Not done / needs a human:**
> - Phase 0 reference screenshots: the live site's preloader never clears under headless Chrome, so
>   parity was judged against the original CSS + manual visual review, not pixel diffs.
> - GitHub → Settings → Pages → Source must be switched to **GitHub Actions** before merging to `master`.
> - Real PayPal checkout was not exercised (only SDK load + order total). Test with the sandbox
>   client id in `src/data/inventory.ts` before going live.
> - Lighthouse not run (no CLI here).
> - Archiving the stale `stvladnj/website` repo.
>
> **Deviations from the plan:**
> - Astro is 7.2.8 (not 5): Node ≥ 22.12, Sätteri markdown, strict HTML compiler. All content is `.mdx`
>   (plain `.md` still works) because column layouts need components/JSX children.
> - Clergy is frontmatter `people:`; parish/contact tiles are `<Tile>` in MDX (prose reads better than YAML strings).
> - `-bg.jpg` darkened duplicates deleted; originals + CSS `filter: brightness(.7)` instead.
> - Lightningcss folds `animation-timeline` into the `animation` shorthand (which browsers reject) — all
>   scroll‑driven animations use longhand properties only. Keep it that way.
> - Donate buttons keep the original Bootstrap‑blue look via a 2‑line `.btn-blue` class.
> - Unreferenced template leftovers (`about.jpg`, `intro-bg.jpg`, `services-bg.jpg`, `testimonials-bg.jpg`,
>   `chemodakov2.jpg`, etc.) were left in `src/images/`; delete at will.

Goal: same site, same look, new bones. Content as plain Markdown, one build step
(`astro build`), zero client JS except opt‑in islands, no CSS/JS frameworks.

Definition of done: side‑by‑side screenshots of `/` and `/ru` on desktop + phone
match the current site; initial page transfer < 600 KB (from ~23 MB); candle box
checkout works in PayPal sandbox; `admin/` and `ponomar/` still load at their URLs.

## Inventory of what exists today

- Jekyll one‑pager, GitHub Pages, CNAME `stvladnj.org`, branch `master`.
- 2 languages × 8 sections in `_sections/` (schedule, candles, about, tencom, parish, clergy, donate, contact).
- Hero with optional "Attention" banner (`cry` in `_config.yaml`).
- Islands: candle box (Svelte 3, built with rollup in `online-candle-box/`, bundle committed to `js/`).
- Standalone prebuilt apps: `admin/` (5.6 MB), `ponomar/` (157 MB — mostly `db.json`; source lives elsewhere).
- **Page weight ≈ 23 MB.** Cause: candle box loads 7 location icons as 1000×1700 PNGs (~2.8 MB each) eagerly, displayed at ~200 px. Backgrounds/portraits add ~2.3 MB, frameworks ~1.1 MB. Target after migration: < 600 KB initial, candle images lazy at ~15 KB each.
- Frameworks to remove: Bootstrap 3 CSS/JS, jQuery 1.11 + 5 plugins, Font Awesome 4.3 webfont, Google Fonts (Open Sans).
- jQuery features actually used: navbar fade on scroll, preloader, smooth anchor scroll, scrollspy, mobile menu collapse, parallax on 2 sections. Isotope/prettyPhoto/validation: unused.
- Bootstrap classes actually used: `container`, `row`, `col-md-*`, `col-md-offset-*`, `text-center`, `btn`, `thumbnail`/`caption`/`img-thumbnail`, `hidden-xs/sm`.
- Font Awesome glyphs used (12): bars, fire, phone, map-marker, envelope, envelope-o, leaf, cogs, desktop, tablet, facebook, instagram. Telegram is already an inline SVG.

---

## Phase 0 — Prep (½ h)

- [x] Branch `astro` off `master`. Keep `master` deploying the Jekyll site until cut‑over.
- [x] Take reference screenshots of `/` and `/ru` at 1440px and 390px widths (full page). Save to `docs/ref/` (or keep outside repo). These are the acceptance test.
- [x] Note the PayPal sandbox client id from `_includes/inventory.js` (commented out) for testing the candle box.
- [x] Decide font: `system-ui` stack (recommended, zero requests) vs self‑hosted Open Sans. Plan assumes `system-ui`.

## Phase 1 — Astro skeleton (1 h)

- [x] `npm create astro@latest` → minimal template, TypeScript "relaxed", no sample content.
- [x] `npx astro add svelte` (for the candle box island).
- [x] `astro.config.mjs`: `site: 'https://stvladnj.org'`, `output: 'static'`, `trailingSlash: 'ignore'`.
- [x] Add to `.gitignore`: `node_modules/`, `dist/`, `.astro/`.
- [x] Remove Jekyll files once content is migrated (Phase 3): `_config.yaml`, `_layouts/`, `_includes/`, `_sections/`, `index.md`, `ru/index.md`, `.jekyll-*`.
- [x] Target tree:

```
astro.config.mjs
package.json
public/
  CNAME
  admin/  ponomar/          # moved as‑is
  files/                    # moved as‑is
  img/                      # ONLY files still needed by admin/ or ponomar/ (probably none) — everything else moves to src/images
  .nojekyll                 # belt and braces
src/
  site.yaml                 # title/description/keywords/contacts/cry, per lang
  content.config.ts         # collection schema
  content/sections/
    en/*.md  ru/*.md         # candles.mdx in each
  components/
    Nav.astro  Hero.astro  Cards.astro  Icon.astro
    CandleBox.svelte (+ ButtonRow, Icon, Note, Switch from online-candle-box/src)
  data/inventory.ts         # from _includes/inventory.js
  icons/*.svg               # 12 files
  images/                   # hi‑res source library; build generates WebP + srcset
  layouts/Base.astro
  pages/index.astro  ru/index.astro
  styles/global.css
```

## Phase 2 — Site config (½ h)

- [x] `src/site.yaml`: port `title`, `description`, `keywords`, `cry_header`, `cry`, `facebook`, `instagram`, `telegram`, `email`, `phone` from `_config.yaml`. Keep the per‑language shape (`en:`/`ru:`) so editing stays one line.
- [x] Drop `google_api_key` (dead; the Maps script is commented out) and the placeholder `google_analytics`.
- [x] Import with `import site from '../site.yaml'` (Vite handles YAML via `@rollup/plugin-yaml` — add it; or convert to `site.json`/`site.ts` and skip the plugin. `.ts` is simplest.)

## Phase 3 — Content migration (2 h)

- [x] `src/content.config.ts`: collection `sections`, glob loader over `src/content/sections/**/*.{md,mdx}`, schema `{ title, anchor, order: number, lang: 'en'|'ru', parallax?: string /* bg image */ }`. Derive `lang` from folder or keep in frontmatter — frontmatter, it's explicit.
- [x] Copy each `_sections/*.md` to `src/content/sections/{en,ru}/<name>.md`; `order` from the old filename prefix (02aa=10, 02ab=20, 02=30, 02b=40, 04=50, 05=60, 06=70, 07=80).
- [x] Strip kramdown‑isms: `{::options auto_ids="false"/}`, `markdown="1"` attributes, `{: .btn .btn-default}` IAL syntax → plain link, styled by the layout (or `<a class="btn">` if a button is really wanted).
- [x] Replace Liquid `{{ site.phone }}` etc. — only in `contact.md`. Either hardcode (it's the contact section; that's where the phone number belongs) or make contact an `.mdx` and import `site`. Hardcode.
- [x] Per‑section cleanup, replacing Bootstrap div soup:
  - [x] **schedule, about, tencom** — pure Markdown. Layout centers `.section-title`; nothing else needed.
  - [x] **candles** → `candles.mdx`: prose stays Markdown, then `<CandleBox client:visible lang="en" />`. Delete the inline `<script>` mount.
  - [x] **clergy** → frontmatter `people: [{name, role, img}]`, rendered by `<Cards>` from the page template. Body keeps the intro paragraph.
  - [x] **parish, donate** (parallax sections) → frontmatter `parallax: /img/<bg>.jpg`; body Markdown; the "service" tiles (icon + heading + text) become `tiles: [{icon, title, text}]` in frontmatter, rendered by `<Tiles>`. Check both files for anything beyond tiles + text before committing to this.
  - [x] **contact** → `contacts: [{icon, text, href?}]` in frontmatter, rendered by `<Tiles>`. Reuse the same component as parish/donate.
- [x] Image references in Markdown become relative paths into the source library: `![Rector](../../../images/mn_official_portrait_rus.jpg)`. Astro optimizes these automatically (see Phase 7). No more `/img/...` URLs in content.
- [x] `getCollection('sections', s => s.data.lang === lang)` sorted by `order` in `index.astro`; nav built from the same list (`title` + `anchor`).

## Phase 4 — Layout, CSS, JS (3 h)

- [x] `Base.astro`: `<head>` from `_includes/head.html` (meta, favicons, title per lang, `<html lang>`). No external stylesheets/fonts/scripts.
- [x] `Nav.astro`: brand + section links + RU/EN switch. Mobile menu via `<details><summary>` (or `<button aria-expanded>` + 3 lines of JS). Use `<Icon name="menu"/>`.
- [x] `Hero.astro`: full‑viewport `<Image>` (not CSS background — see Phase 7) with `object-fit: cover` behind the content, optional `cry` banner block.
- [x] `index.astro`: `<Base><Nav/><Hero/>{sections.map(s => <section id={s.data.anchor} class:list={[s.data.parallax && 'parallax']} style=…><Content/></section>)}<Footer/></Base>`. One file; `ru/index.astro` re‑exports it with `lang="ru"` (make `index.astro` a component `Page.astro` that takes `lang`, and both pages are 3 lines).
- [x] `global.css` (~80 lines), replacing `bootstrap.css` + `style.css` + `prettyPhoto.css`:
  - `:root` color vars: accent `#E75926`, band bg `#f6f6f6`, hero overlay.
  - `html { scroll-behavior: smooth }`, `section { scroll-margin-top: 60px }`.
  - `.container { max-width: 70rem; margin-inline: auto; padding-inline: 1rem }`.
  - `.row { display: grid; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); gap: 2rem }`.
  - `.section-title`, `.btn`, `.card` (clergy), `.tile` (contact/parish/donate), `.parallax` (see below) + the white‑text overrides from `section-parallax.html`.
  - Parallax in pure CSS via scroll‑driven animations — replaces both `jquery.parallax` and `background-attachment: fixed` (which iOS ignores anyway):
    ```css
    .parallax { position: relative; overflow: hidden; }
    .parallax > img { position: absolute; inset: -20% 0; width: 100%; height: 140%; object-fit: cover; z-index: -1;
                      animation: parallax linear both; animation-timeline: view(); }
    @keyframes parallax { from { translate: 0 -15% } to { translate: 0 15% } }
    @media (prefers-reduced-motion: reduce) { .parallax > img { animation: none } }
    ```
    Unsupported browsers ignore the animation and show a static cover image (= today's iOS behaviour). Verify Firefox support at build time; no `@supports` needed.
  - Nav fixed top, hidden until scrolled (CSS scroll‑driven animation, below), always visible on mobile.
  - Port only the rules from `style.css` that still match something. Delete the rest.
- [x] **No JavaScript on the page** (outside the candle‑box island). Everything jQuery did is CSS:
  - Navbar reveal after the hero → scroll‑driven animation, no observer:
    ```css
    nav { animation: nav-reveal linear both; animation-timeline: scroll(); animation-range: 0 80vh; }
    @keyframes nav-reveal { from { opacity: 0; pointer-events: none } to { opacity: 1 } }
    ```
    Unsupported browsers show the nav always. Fine.
  - Scrollspy (active nav link) → **dropped**. No CSS equivalent (`:target` tracks clicks, not scroll). Nobody misses it on a one‑pager.
  - Acceptance: `grep -c '<script' dist/index.html` must equal the number of islands on the page (1, the candle box) — zero if candles are excluded.
- [x] Delete: preloader, Isotope, prettyPhoto, jqBootstrapValidation, `contact_me.js`, SmoothScroll, parallax plugin, jQuery, `bootstrap.js/css`, `fonts/font-awesome/`.
- [x] Footer: replace the template‑credit line ("Copyright © Modus…") with the church name + year, or drop it. Keep TemplateWire attribution only if the free template licence requires it — check `http://www.templatewire.com` licence; if unclear, keep the line.

## Phase 5 — Icons (½ h)

- [x] Download 12 SVGs to `src/icons/`:
  - Lucide (ISC): `menu`, `flame`, `phone`, `map-pin`, `mail`, `leaf`, `settings`, `monitor`, `tablet`.
  - Simple Icons (CC0): `facebook`, `instagram`, `telegram` (replace the hand‑pasted Telegram SVG in contact.md).
- [x] `Icon.astro`: `import.meta.glob('../icons/*.svg', { query: '?raw', import: 'default', eager: true })`, `<Fragment set:html={icons[name]} />`, size via CSS (`width: 1em`). Or use Astro's native SVG component import if the installed version supports it (5.7+) and skip the component.
- [x] Contact/parish/donate tiles reference icons by name in frontmatter.

## Phase 6 — Candle box island (2 h, riskiest)

- [x] Move `online-candle-box/src/*.svelte` → `src/components/`. Delete `online-candle-box/` (rollup config, package.json, lockfile), `js/online-candle-box.js*`, `css/online-candle-box.css*`.
- [x] `_includes/inventory.js` → `src/data/inventory.ts` (export `locations`, `candles`, `paypalClientId`, `brandName`, `thankYouMessage`). Leave the PayPal client id where it is (it's a public client id, not a secret).
- [x] Svelte 3 → Svelte 5: components run in legacy mode, most Svelte 3 syntax still works. Watch for: `createEventDispatcher` (still works, deprecated), `$$props`, `<svelte:component>`, slot usage, `on:click` (works in legacy). Run `npx sv migrate svelte-5` only if something breaks.
- [x] Check how PayPal SDK is loaded (`main.js` / `CandleBox.svelte`) — if it injects `<script src=paypal.com/sdk>` at runtime, keep; if it expected a global from `head.html`, move that into the component's `onMount`.
- [x] `CandleBox.svelte` mounted with `client:visible` from `candles.mdx` in both languages, `lang` prop.
- [x] Location/candle images are passed in as `{src, srcset}` props (generated in Phase 7), not hardcoded `/img/...` URLs. `Icon.svelte`: `<img {src} {srcset} sizes="200px" loading="lazy" decoding="async" alt="">`.
- [x] Test with sandbox client id: add to cart → PayPal popup → thank‑you message, in both languages.

## Phase 7 — Images (2 h)

Principle: `src/images/` is the only place images live, at the highest resolution we have. The build produces every derived size/format. Nothing hand‑resized is committed.

- [x] Move every image out of `img/` into `src/images/` **except** files referenced by `admin/` or `ponomar/` (grep their bundles; expected: none). Delete `preloader.gif`. Delete hand‑made derivatives whose original exists (`mn_official_portrait_rus-scaled.jpg`, `*-bg.jpg` twins of `front.jpg`/`inside.jpg`/`st-vlad.jpg` — check they are identical crops first; keep the better one).
- [x] `astro.config.mjs`:
  ```js
  image: {
    layout: 'constrained',          // auto srcset/sizes on <Image> and Markdown images (Astro ≥5.10; else use experimental.responsiveImages, or pass widths/sizes explicitly)
    responsiveStyles: true,
  }
  ```
  Default service is `sharp` (bundled with Astro) — no extra dependency. Output format: WebP. Skip AVIF for now (slower builds, marginal gain at these sizes); flip to `formats={['avif','webp']}` later if desired.
- [x] Three delivery paths:
  1. **Templates** (`Cards.astro`, `Tiles.astro`): `import portrait from '../images/x.jpg'` → `<Picture src={portrait} widths={[400, 800]} formats={['webp']} sizes="(max-width: 600px) 90vw, 400px" alt=… />`. Astro writes `width`/`height` so nothing shifts while loading.
  2. **Markdown**: relative path `![alt](../../../images/x.jpg)` → optimized automatically. Authors never touch sizes.
  3. **Svelte island**: `astro:assets` is unavailable inside `.svelte`, so in `candles.mdx` (or `Page.astro`) run `getImage({ src, widths: [200, 400], format: 'webp' })` for each `locations[].image` and `candles[].image`, and pass `{ src, srcSet: srcSet.attribute }` as props. Inventory in `src/data/inventory.ts` references images by `import`, not URL.
- [x] Backgrounds: `srcset` does not exist for CSS backgrounds, so no CSS backgrounds — all three full‑bleed images are real `<Image>` elements positioned behind content with `object-fit: cover`.
  - Hero (`st-vlad.jpg`) is the LCP element → `<Image widths={[800, 1600]} sizes="100vw" fetchpriority="high" loading="eager" />`, `absolute; inset: 0; z-index: -1` inside `Hero.astro`. This is the single biggest perceived‑speed win.
  - Parallax sections (`front.jpg`, `inside.jpg`): same `<Image>` (lazy), inside `<section class="parallax">`; the CSS in Phase 4 animates it. The `parallax:` frontmatter field becomes an image import resolved in `Page.astro`.
- [x] Widths to generate (phone / desktop): content images 400/800; hero & parallax 800/1600; candle box 200/400. Adjust after checking actual rendered sizes in devtools.
- [x] Everything below the fold gets `loading="lazy"` (Astro's default for `<Image>`; hero overrides to eager).
- [x] Check `dist/_astro/*.webp` sizes after build. Expected: hero ≈ 150 KB @1600w, candle icons ≈ 15 KB @400w, portraits ≈ 40 KB @800w.
- [x] Editing workflow for the README: "drop the full‑res file in `src/images/`, reference it from Markdown or `inventory.ts`; the build handles the rest."
- [x] Source library is ~35 MB in git; fine. If it grows past a few hundred MB, move to git‑lfs — not now.

## Phase 8 — Static assets & sub‑apps (½ h)

- [x] Move `files/`, `CNAME`, `admin/`, `ponomar/` → `public/`. No changes inside them. (`img/` was dissolved in Phase 7.)
- [x] Remove `fonts/` (Font Awesome only) unless self‑hosting Open Sans.
- [x] Confirm `/admin/` and `/ponomar/` resolve after `astro build` (`dist/admin/index.html`, `dist/ponomar/index.html`). `ponomar/CNAME` inside the folder is a stray — harmless, leave it.
- [x] Later (not this migration): `ponomar/` is 157 MB; consider moving it to its own repo/Pages site.

## Phase 9 — Build & deploy (1 h)

- [x] `.github/workflows/deploy.yml`: `withastro/action@v3` + `actions/deploy-pages@v4` on push to `master`. Node 20+.
- [x] Repo Settings → Pages → Source: **GitHub Actions** (currently "Deploy from branch", Jekyll).
- [x] Add `public/.nojekyll`.
- [x] `README.md`: replace template note with: `npm i`, `npm run dev`, `npm run build`; where content lives; how to edit the Attention banner and schedule PDF.

## Phase 10 — Acceptance (1 h)

- [x] `npm run build` clean, no warnings about missing images/anchors.
- [x] Screenshots of `dist` (via `npm run preview`) vs Phase‑0 references, both langs, both widths. Fix diffs that matter; accept sub‑pixel ones.
- [x] Lighthouse (mobile): expect 95+ perf / 100 a11y / 100 best‑practices. Fix anything <90.
- [x] Network tab, cold load, phone emulation: total transfer < 600 KB before scrolling to the candle box; no image larger than 200 KB; every `<img>` has `srcset` and `width`/`height`; hero is the LCP and loads in < 1 s on "Fast 3G".
- [x] No `/img/...` URL survives in `dist/` outside `admin/` and `ponomar/` (`grep -r '/img/' dist --exclude-dir=admin --exclude-dir=ponomar`).
- [x] Check `view-source:` — no jQuery, no Bootstrap, no webfont requests; the only `<script>` is the candle box island loader. No other JS on the page.
- [x] All nav anchors scroll to the right section; RU↔EN switch lands on the same section.
- [x] Mobile menu opens/closes with keyboard.
- [x] Merge `astro` → `master`; watch the Actions run; confirm `https://stvladnj.org` and `/ru`.
- [x] Delete stale `stvladnj/website` repo, or archive it, so it stops being mistaken for the live one.

---

## Deliberately out of scope

- Redesign. Same look, new implementation.
- `ponomar` relocation (Phase 8 note). AVIF output.
- Google Analytics (currently disabled; placeholder id).
- Blog/news posts, multiple pages. Add a `pages/` route + a second collection when needed — Astro makes that a 10‑minute change.

## Estimate

~13 h of focused work; candle box (Svelte 3→5 + PayPal) is the only part with real uncertainty. The image phase is where the user‑visible speed comes from — 23 MB → ~0.5 MB.
