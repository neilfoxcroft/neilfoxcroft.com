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

- **Astro + Tailwind CSS**, static output (`dist/`). It's a content site with a few small interactive bits, so Astro ships almost no JS and builds to plain static files for S3. Interactive pieces (scroll timeline, cursor spotlight, PCT line draw) can be small vanilla scripts or tiny islands.
- TypeScript. Fonts self-hosted or via Google Fonts: **JetBrains Mono** (whole site); Inter kept as an easy alternative.
- **Content as data**: put all CV content (profile, experience, education, certifications, projects, PCT stats) in one structured file, e.g. `src/data/resume.json` loosely following JSON Resume. The page renders from it. Later, a separate CV repo will reuse the same data to generate the PDF résumé, so keep the schema clean.

## Design system

- Dark theme, colours from **Catppuccin Mocha**:
  - background `#1e1e2e`, deeper surfaces `#181825` / `#11111b`
  - borders `#313244`, `#45475a`
  - body text `#a6adc8`, headings `#cdd6f4`, muted labels `#9399b2` (passes contrast; don't use `#6c7086` for small text)
  - accent `#cba6f7` (mauve), alternatives blue `#89b4fa`, teal `#94e2d5`, peach `#fab387`
  - PCT trail red `#e64553`
- Font: JetBrains Mono everywhere, base size 15px, line-height 1.7.
- Section labels are small mono comments: `// about`, `// experience`, etc. That and the font are the only "developer" flavour. Neil explicitly does **not** want a full IDE/terminal skin.
- Tech tags: small rounded pills, accent text on accent at 12% opacity.
- Motion is minimal: a subtle cursor-following radial spotlight (accent at ~7% opacity, ~560px radius), row hover highlight, the experience scroll timeline and the PCT line draw. Respect `prefers-reduced-motion`.

## Layout (inspired by brittanychiang.com: Neil's favourite reference)

Two columns on desktop, max width ~1180px, stacked on mobile.

**Left column (sticky on desktop, full viewport height):**
- Name "Neil Foxcroft", title "Backend Software Engineer"
- One-line pitch: "I build the Java and Kotlin services that connect banks, retailers and their partners, and keep them running in production."
- "Pretoria, ZA · open to relocation"
- Section nav: About / Experience / Projects / The PCT. Each item has a horizontal line that lengthens and brightens for the active section (scroll-spy).
- Icons: GitHub (github.com/neilfoxcroft), LinkedIn (linkedin.com/in/neil-foxcroft-39a7991a1), email (neilfoxcroftpro@gmail.com), and a résumé PDF link.

**Right column (scrolls):**

1. **About**: three short paragraphs (copy is in the mockup).
2. **Experience**, as a timeline:
   - Top: **Entelect** (main employer), "Software Engineer" in accent colour, "2022 — Present", one line: software consultancy, placed with clients as a backend engineer, plus internal initiatives.
   - Nested entries beneath it, **no role line on each** (the role lives only at the top):
     - Shoprite Financial Services · 2024 — 2026 · "Client · Money Market value-added services"
     - Standard Bank · 2022 — 2024 · "Client · Value Added Services"
     - Entelect Challenge · 2022 — Now · "Internal · Cloud Squad, part-time"
   - Each entry has a blurb and tech pills (in the mockup).
   - **Scroll timeline**: a 3px vertical track (`#313244`) left of the entries. A gradient fill (mauve → blue → teal) grows with scroll progress through the section, led by a glowing teal dot. Each entry has a dot on the track that lights up once the fill passes it. The fill reaches each point when it crosses 60% of the screen height. With reduced motion on, the timeline is simply shown full with all dots lit.
   - Link: "View full résumé ↗".
3. **Education**: two separate cards:
   - BSc Honours, Computer Science & IT · North-West University · 2021 · specialised in AI, advanced databases, computer security and information systems engineering · thesis: detecting StyleGAN-generated images with deep learning
   - BSc Information Technology · North-West University · 2017 — 2020
   - **Certifications** row: AWS Certified Cloud Practitioner (2022); Microsoft Certified: Azure Cosmos DB Developer Specialty (2025)
4. **Projects**:
   - BLEGO, Braille-like toy blocks: FIRST LEGO League registered design ZA F2016/01587, regional champions.
   - Two placeholders: homelab write-up, public backend project. Keep them as clear TODOs; don't invent content.
5. **The PCT** (Pacific Crest Trail):
   - Heading "Mexico to Canada, on foot". Short intro; Neil will write his own story, so leave a placeholder.
   - **3D-tilted map**: an SVG of the US West Coast (CA, OR, WA highlighted; NV, ID, AZ, UT, MT, WY, BC, Baja/Mexico as muted context; faint lat/long grid). It's rendered on a plane with CSS `perspective` + `rotateX(50deg) rotateZ(-22deg)` and a darker slab behind it (`translateZ(-18px)`) for depth. Canada is at the top, Mexico at the bottom.
   - The PCT route is a red polyline with a soft glow, Campo to Manning Park, and draws itself as the section scrolls into view (`pathLength=1`, `stroke-dashoffset`).
   - The mockup has hand-simplified coordinates. **Upgrade if practical**: use real state outlines (e.g. US Atlas / Natural Earth TopoJSON) and a real PCT GPX/GeoJSON track, projected at build time to a static SVG.
   - Stats grid: 4,265 km trail length · 3 states · [days on trail] · [pairs of shoes]. Plus "[Read the trail journal]", and three photo slots (desert, Sierra, Cascades). The bracketed items are placeholders for Neil.
6. **Footer**: "Built by Neil with [stack], deployed on AWS. Source on GitHub. Colours from Catppuccin Mocha."

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
- SEO and meta: title "Neil Foxcroft — Backend Software Engineer", description, Open Graph image, favicon. The current meta still says "Junior Developer"; replace it.
- Replace the old résumé at `public/files/NeilFoxcroftResume.pdf` with the current one (Neil will provide it).
- A proper `README.md` for the public repo: what it is, stack, local dev, how content is edited (the data file), deploy.

## Working style

- Neil is a backend developer, not a designer: keep it simple, explain front-end choices briefly.
- Build in small steps and let him look at the dev server between steps: scaffold → layout and content → timeline → PCT map → polish → deploy.
- Don't commit or push without asking.
