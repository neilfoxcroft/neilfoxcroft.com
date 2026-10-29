# neilfoxcroft.com redesign: build brief

This brief is the handoff from a design session. The approved mockup is `docs/redesign/mockup.dc.html` in this repo. It is a design-canvas file, not runnable app code, but it holds the exact layout, copy, colours and the PCT map SVG coordinates. Read it alongside this brief and treat it as the source of truth for look and content.

## Goal

Replace the 2020 Create React App site (React 16, Bootstrap 4, class components) with a polished, minimal **single-page** portfolio for Neil Foxcroft, a backend software engineer (Java/Kotlin, Spring Boot) targeting senior roles, possibly in Europe or the US. It must be easy to maintain from GitHub and look good as a public repo.

## Current repo state (check before changing anything)

- Checked 2026-10-29: `master` was clean apart from the untracked `docs/` folder (the uncommitted edits this brief originally mentioned weren't present).
- The rebuild happens on the `redesign` branch, not on `master`.
- Deployment today: AWS CodeBuild using `buildspec.yml` (`npm install`, `npm run build`, artifacts from `build/`), then presumably S3/CloudFront. Keep AWS hosting and update `buildspec.yml` to match the new build output folder. Ask Neil how the bucket and CloudFront are set up before touching the infrastructure.
- The old site's broken or dead pieces should go: the countapi.xyz hit counter (service is dead), the Twitter embed, the EmailJS contact form, `react-mdl`, the particles background, and the old `FoxcroftN` GitHub links (the account is now `neilfoxcroft`).

## Stack (confirmed by Neil, 2026-10-29)

- **Astro + Tailwind CSS**, static output (`dist/`). It's a content site with a few small interactive bits, so Astro ships almost no JS and builds to plain static files for S3. Interactive pieces (scroll timeline, cursor spotlight, PCT trail colour-in) can be small vanilla scripts or tiny islands.
- TypeScript. Fonts self-hosted or via Google Fonts: **JetBrains Mono** (whole site); Inter kept as an easy alternative.
- **Content as data**: put all CV content (profile, experience, education, certifications, projects, PCT stats) in one structured file, e.g. `src/data/resume.json` loosely following JSON Resume. The page renders from it. Later, a separate CV repo will reuse the same data to generate the PDF résumé, so keep the schema clean.

## Design system

- Dark theme, colours from **Catppuccin Mocha**:
  - background `#1e1e2e`, deeper surfaces `#181825` / `#11111b`
  - borders `#313244`, `#45475a`
  - body text `#a6adc8`, headings `#cdd6f4`, muted labels `#9399b2` (passes contrast; don't use `#6c7086` for small text)
  - accent `#cba6f7` (mauve), alternatives blue `#89b4fa`, teal `#94e2d5`, peach `#fab387`
  - PCT trail: white `#cdd6f4`, coloured in on hover with PCT teal-blue `#038285`, the colour from the official PCT logo (Wikipedia `File:Pct-logo.svg`). Changed 2026-10-29; was red `#e64553`.
- Font: JetBrains Mono everywhere, base size 15px, line-height 1.7.
- Section labels are small mono comments: `// about`, `// experience`, etc. That and the font are the only "developer" flavour. Neil explicitly does **not** want a full IDE/terminal skin.
- Extra accent colour (added 2026-10-29, Neil asked for a bit more colour): the `//` of each section label, the active nav line, the PCT stat numbers and the ↗ arrows on the résumé and journal links are mauve, on top of the existing role title, tags and hover states. Keep it to small touches like these.
- Tech tags: small rounded pills, accent text on accent at 12% opacity.
- Motion is minimal: a subtle cursor-following radial spotlight (accent at ~7% opacity, ~560px radius), row hover highlight, the experience scroll timeline, the PCT trail colour-in, and (added 2026-10-29) a hover tilt on the PCT map: the map leans up to ~6° towards the cursor and eases back on leave. The spotlight and hover tilt only run with a mouse/trackpad (`hover: hover` and `pointer: fine`). Respect `prefers-reduced-motion`: no spotlight or hover tilt, and the timeline is shown complete.

## Layout (inspired by brittanychiang.com: Neil's favourite reference)

Two columns on desktop, max width ~1180px, stacked on mobile.

**Left column (sticky on desktop, full viewport height):**
- Name "Neil Foxcroft", title "Backend Software Engineer"
- One-line pitch: "I build the Java and Kotlin services that connect banks, retailers and their partners, and keep them running in production."
- "Pretoria, ZA · open to relocation"
- Section nav: About / Experience / Projects / The PCT. Each item has a horizontal line that lengthens and brightens for the active section (scroll-spy).
- Icons: GitHub (github.com/neilfoxcroft), LinkedIn (linkedin.com/in/neilfoxcroft, corrected 2026-10-29), email (neilfoxcroftpro@gmail.com), and a résumé PDF link.

**Right column (scrolls):**

1. **About**: three short paragraphs (copy is in the mockup).
2. **Experience**, as a timeline:
   - Top: **Entelect** (main employer), "Software Engineer" in accent colour, "2022 — Present", one line: software consultancy, placed with clients as a backend engineer, plus internal initiatives.
   - Nested entries beneath it, **no role line on each** (the role lives only at the top):
     - Shoprite Financial Services · 2024 — 2026 · "Client · Money Market value-added services"
     - Standard Bank · 2022 — 2024 · "Client · Value Added Services"
     - Entelect Challenge · 2022 — 2026 (the Challenge stopped in 2026; updated 2026-10-29) · "Internal · Cloud Squad, part-time"
   - Each entry has a blurb and tech pills (in the mockup).
   - **Scroll timeline**: a 3px vertical track (`#313244`) left of the entries. A gradient fill (mauve → blue → teal) grows with scroll progress through the section, led by a glowing teal dot. Each entry has a dot on the track that lights up once the fill passes it. The fill reaches each point when it crosses 60% of the screen height. With reduced motion on, the timeline is simply shown full with all dots lit.
   - Link: "View full résumé ↗".
3. **Education**: two separate cards:
   - BSc Honours, Computer Science & IT · North-West University · 2021 · specialised in AI, advanced databases, computer security and information systems engineering · thesis: detecting StyleGAN-generated images with deep learning
   - BSc Information Technology · North-West University · 2017 — 2020
   - **Changed 2026-10-29 (Neil):** the cards no longer show the description. Both cards are always the same height (side by side or stacked) and are clickable; a click opens a details dialog that is the same size for both (34rem × 20rem, 24rem tall on phones). Esc, ✕ or a click outside closes it. BSc IT has a `[Placeholder…]` summary in resume.json for Neil to fill in. Dialogs are 40rem × 31rem (44rem tall on phones) so the longest entry fits without scrolling; an entry can list `activities` (date + name), shown under "// activities and societies". Card layout: date and `+` on top, degree type ("BSc Honours" / "BSc") as a small mauve line, the subject as the title on one line, and the university pinned to the bottom so it lines up across cards. Cards stack in one column from 1024px to 1279px, where two side by side would wrap the titles.
   - **Certifications** row: AWS Certified Cloud Practitioner (2022); Microsoft Certified: Azure Cosmos DB Developer Specialty (2025). Each certification card links to its verification page (Credly for AWS, Microsoft Learn for Azure), added 2026-10-29.
4. **Projects**:
   - BLEGO, Braille-like toy blocks: FIRST LEGO League registered design ZA F2016/01587, regional champions.
   - Two placeholders: homelab write-up, public backend project. Keep them as clear TODOs; don't invent content.
5. **The PCT** (Pacific Crest Trail):
   - Heading "Mexico to Canada, on foot". Short intro; Neil will write his own story, so leave a placeholder.
   - **3D-tilted map**: an SVG of the US West Coast (CA, OR, WA highlighted; NV, ID, AZ, UT, MT, WY, BC, Baja/Mexico as muted context; faint lat/long grid). It's rendered on a plane with CSS `perspective` + `rotateX(50deg) rotateZ(-22deg)` and a darker slab behind it (`translateZ(-18px)`) for depth. Canada is at the top, Mexico at the bottom.
   - The PCT route is a white line with a soft glow, Campo to Manning Park. **Changed 2026-10-29 (Neil):** the scroll-driven line draw is gone because it played while the map was still off screen. Instead, moving the mouse **anywhere over the map square** colours the route PCT teal-blue from Campo up to the point on the trail nearest the cursor (updated 2026-10-29; at first it only responded within ~14px of the line). When the mouse leaves the map, the colour stays where it was. On touch screens, tapping anywhere on the map does the same. Under the hood, 400 evenly spaced trail points are stored at build time; the browser's offsetX/offsetY already map the cursor back through the 3D tilt, and the script picks the nearest point. Map labels (enlarged again 2026-10-29 for readability on the tilted map): states 22px in `#bac2de`; CANADA 34px and MEXICO 30px in `#a6adc8` (CANADA is larger because it sits on the far, foreshortened edge); PACIFIC OCEAN 22px. The "Campo" and "Manning Park" place names were removed as too small to read; the start and end dots remain. Labels never touch the trail. WASHINGTON (east of the Cascades) and CALIFORNIA (moved to the Mojave, east of the southern trail) overhang their state slightly, because the trail leaves no gap inside either state wide enough for them. Stats sit 4 across, but 2 across between 1024px and 1279px where the column is too narrow for 4.
   - The mockup has hand-simplified coordinates. **Done (2026-10-29), Neil chose OpenStreetMap for the route:** state outlines come from `us-atlas` (US Census) and Canada/Mexico from `world-atlas` (Natural Earth). The route is OSM superroute relation 1225378, fetched once by `scripts/fetch-pct-trail.mjs`, stitched (~4,220 km), simplified and saved to `src/data/pct-trail.json`. Everything is projected with `d3-geo` at build time into a static SVG. A "Trail data © OpenStreetMap" credit line, linked to openstreetmap.org/copyright, sits under the map (the OSM attribution guidelines accept "© OpenStreetMap" when it links to the licence).
   - **Layout change from the mockup:** the map sits above the stats rather than beside them. Tilted, the map is ~1.5× its own width on screen, and side by side it overlapped the stats in the 610px column. Stats are a 4-across row (2×2 on phones).
   - On phones the tilt is gentler (`rotateX(35deg) rotateZ(-8deg)`, 80% width) so it fits 360px screens without sideways scroll.
   - Stats grid: 4,265 km trail length · 3 states · [days on trail] · [pairs of shoes]. Plus "[Read the trail journal]", and three photo slots (desert, Sierra, Cascades). The bracketed items are placeholders for Neil.
6. **Footer**: "Built by Neil with [stack], deployed on AWS. Source on GitHub. Colours from Catppuccin Mocha." **Updated 2026-10-29:** also credits the layout inspiration: "Layout inspired by Brittany Chiang" (linked to brittanychiang.com), and Neil chose a light Claude mention: "Built by Neil, with help from Claude, using Astro and Tailwind CSS…".
   - **Redesigned 2026-10-29 (Neil found it cluttered):** the footer now spans the full page width under both columns, above a thin divider, as short labelled items in the `//` style: `// built with Astro, Tailwind CSS · AWS`, `// source GitHub`, `// inspired by Brittany Chiang`, `// colours Catppuccin Mocha`, `// with help from Claude`. One line from 1280px, wrapping on narrower screens, one per line on phones. The OpenStreetMap credit stays under the map: the OSM guidelines require attribution "in the vicinity of the produced work" and don't allow for a page footer.

## Mobile (required, added 2026-10-29)

The site must be properly mobile friendly, not just "doesn't break". Build mobile-first and check every step at phone width.

- Works from 360px wide with no horizontal scroll; comfortable side padding (~1.25rem).
- Below the desktop breakpoint the left column is no longer sticky and stacks above the content. The section nav is hidden on mobile (brittanychiang.com does the same); name, pitch, location and icon links stay at the top.
- Because the nav is hidden on mobile, each `// section` label sticks to the top of the screen (with a translucent blurred background) while you scroll through that section.
- Tap targets at least 44×44px (icon links, nav, "View full résumé", journal link).
- Hover-only effects must have no hover dependency: the cursor spotlight is disabled on touch / coarse pointers, and row highlights are a nice-to-have, not the only affordance.
- Experience timeline works the same on mobile (track stays on the left, entries narrow).
- PCT map: keep the 3D tilt but reduce it on small screens so it stays readable and doesn't overflow; the stats grid drops below the map. Photo slots stack to one or two per row.
- Text sizes stay readable (body 15px minimum, no text under ~12px).
- Test in a 375×812 viewport after each build step.

## Quality bar

- Responsive down to 360px (see **Mobile** above).
- Accessibility: semantic sections, nav landmarks, visible focus states, AA contrast, `aria-label` on icon links, map has a text alternative.
- Lighthouse 95+ across the board; no layout shift; fonts preloaded.
- SEO and meta: title "Neil Foxcroft — Backend Software Engineer", description, Open Graph image, favicon. **Done 2026-10-29:** canonical URL, Open Graph and Twitter card tags; the icon is a mauve `//` mark on the dark background (favicon.svg, favicon.ico, apple-touch-icon.png); the 1200×630 share image shows the name, title and pitch with a PCT-teal bar along the bottom. All are generated by `scripts/make-icons.mjs` from resume.json. Also a "noindex" 404 page ("Off trail.") for S3 to use as its error page, plus robots.txt. Lighthouse (2026-10-29): 100/100/100/100 on mobile and desktop.
- Replace the old résumé at `public/files/NeilFoxcroftResume.pdf` with the current one. **Done 2026-10-29** with Neil's Reactive Resume export; he will restyle it to match the site later.
- A proper `README.md` for the public repo: what it is, stack, local dev, how content is edited (the data file), deploy.

## Open TODOs

Tracked in `docs/TODO.md` (content Neil will write, possible contact section, deploy, etc.).

## Working style

- Neil is a backend developer, not a designer: keep it simple, explain front-end choices briefly.
- Build in small steps and let him look at the dev server between steps: scaffold → layout and content → timeline → PCT map → polish → deploy.
- Don't commit or push without asking.
