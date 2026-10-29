# neilfoxcroft.com

This is the source for [neilfoxcroft.com](https://neilfoxcroft.com), my personal site. I'm Neil Foxcroft, a software engineer working mostly with Java, Kotlin and Spring Boot.

The main page covers who I am, my experience, education and projects, and an interactive map of my 2026 Pacific Crest Trail thru-hike. Two smaller pages hang off it: `/trail-stats/`, the full list of trail numbers, and `/places/`, an easter egg I'll let you find.

## Stack

- [Astro](https://astro.build): builds the site to plain HTML and CSS with very little JavaScript
- [Tailwind CSS](https://tailwindcss.com) for styling, with colours from [Catppuccin](https://catppuccin.com): Mocha for the dark theme, Latte for the light one
- [JetBrains Mono](https://www.jetbrains.com/lp/mono/), self-hosted via Fontsource
- [d3-geo](https://d3js.org/d3-geo) for the maps: the PCT map is projected at build time into a static SVG, the globe is drawn in the browser
- TypeScript, Node 22.23 or newer
- [GoatCounter](https://www.goatcounter.com) for visitor stats: cookie-free, no IP addresses stored, and only in production builds

The JavaScript that does run is a handful of small scripts (the nav highlight, the experience timeline, the map, elevation profile and photo strip, the km/mi and light/dark switches, the globe). Anything that moves respects `prefers-reduced-motion`.

## Running it locally

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # type-check, then build to dist/
npm run preview   # serve the built dist/ locally
```

## Editing content

All my CV content lives in [`src/data/resume.json`](src/data/resume.json), loosely following the [JSON Resume](https://jsonresume.org/schema) schema:

- `basics`: name, title, pitch, location, links and the About paragraphs (wrap words in `**double asterisks**` to emphasise them; in the pitch they're coloured)
- `work`: Entelect, with each client or internal engagement under `engagements`
- `education` (with optional `activities` and a `link`), `certificates`, `projects` (with an optional `url` and `id`)
- `pct`: the trail intro, the headline stats, the photo slots and `moreStats` for the trail stats page. Distances are stored in miles (e.g. `"miles": [0, 702]`) and shown in km or mi depending on the switch by the map
- `places`: the countries and US states that light up on the globe

I change the file and the page updates; no component changes needed. My CV PDF lives at `public/files/NeilFoxcroftResume.pdf`.

### PCT photos

There's one photo slot per trail section (Start, Desert, Sierra, NorCal, Oregon, Washington, End) in `pct.photos`, shown as a strip of square thumbnails under the map. To fill one:

1. Put the photo in `src/assets/pct/` (full-size JPG/PNG/WebP is fine; the build resizes it to WebP at several sizes).
2. Set that slot's `image` to the filename and `alt` to a short description, e.g.
   `"image": "desert.jpg", "alt": "Sunset over the Mojave near mile 500"`.

Hovering or clicking a photo colours its section of the map and the elevation profile (each section ends at `endsAt`, a real place pinned to the trail). Pressing and holding a photo (or pressing Enter on it) opens it full size; the photo fills up with its section colour while it's held. Empty slots show a dashed placeholder, an optional `short` name (e.g. `"Wash."`) kicks in when the thumbnails get narrow, and a misspelt filename fails the build with a clear message.

If I change my name, title or pitch, I regenerate the social-share image and icons:

```bash
node scripts/make-icons.mjs
```

## The PCT map

The map is drawn at build time by [`src/lib/pct-map.ts`](src/lib/pct-map.ts):

- State outlines: [us-atlas](https://github.com/topojson/us-atlas) (US Census Bureau)
- Canada and Mexico: [world-atlas](https://github.com/topojson/world-atlas) (Natural Earth)
- The trail: [OpenStreetMap](https://www.openstreetmap.org/relation/1225378), © OpenStreetMap contributors, [ODbL](https://www.openstreetmap.org/copyright)

The trail line is stored in [`src/data/pct-trail.json`](src/data/pct-trail.json), so builds never go online. To refresh it from OpenStreetMap (e.g. after a reroute):

```bash
node scripts/fetch-pct-trail.mjs
```

The script downloads the trail's route relations from the Overpass API (~17 MB), stitches the pieces into one line from Campo to Manning Park, checks its length, simplifies it and saves it.

Between the map and the photo strip there's an **elevation profile** of the whole trail, built from [`src/data/pct-elevation.json`](src/data/pct-elevation.json): 1,000 evenly spaced points with elevations from NASA SRTM (public domain) via [OpenTopoData](https://www.opentopodata.org), lightly smoothed because only the shape matters. It's linked to the map both ways: dragging along the profile traces the map, and moving over the map moves the profile's marker. To refresh it after the trail line changes:

```bash
node scripts/fetch-pct-elevation.mjs
```

## The places globe

Behind "open to relocation" in the header is `/places/`: a slowly spinning globe of dark, borderless land with only the countries and US states I've been to drawn on it, lit up (drag to spin, double-click to reset). The shapes come from [world-atlas](https://github.com/topojson/world-atlas) (Natural Earth) and [us-atlas](https://github.com/topojson/us-atlas) (US Census Bureau), both public domain, and are picked at build time in [`src/lib/places-globe.ts`](src/lib/places-globe.ts). Names in `places` must match those datasets; the build tells me if one doesn't.

One thing I learnt the hard way: don't round or simplify the shapes to save space. That kinks their borders, and a kinked shape can briefly fill the whole globe as it turns, which shows up as a painful flash.

## Deployment

The site runs on AWS for next to nothing:

- A push to `master` triggers a CodePipeline. CodeBuild runs [`buildspec.yml`](buildspec.yml): it builds the site with Node 24, syncs `dist/` to a private S3 bucket (Astro's hashed files in `_astro/` are cached for a year, everything else is revalidated) and invalidates the CloudFront cache.
- CloudFront serves the site over HTTPS on the CloudFront Free flat-rate plan, so traffic spikes and attacks can't run up a bill, with a firewall that rate-limits and blocks common attacks. Only CloudFront can read the bucket.
- A small CloudFront Function, [`infra/cloudfront-index-rewrite.js`](infra/cloudfront-index-rewrite.js), serves folder URLs like `/trail-stats/` from their `index.html`. Missing pages get `404.html`.

## Project layout

```
src/
  components/   one component per section (Header, About, Experience, PctMap, ...)
  data/         resume.json (content), the PCT trail line and elevation data
  layouts/      page shell: meta tags, fonts, icons, theme and units set before paint
  lib/          small helpers and the build-time map and globe data
  pages/        index.astro (the site), trail-stats.astro, places.astro and 404.astro
  styles/       Tailwind setup and the Catppuccin colour tokens (both themes)
scripts/        one-off scripts: OSM trail and elevation fetch, icon/OG image generation
infra/          the CloudFront Function
public/         static files copied as-is (icons, OG image, my CV)
docs/           the design brief, the approved mockup and my TODO list
```
