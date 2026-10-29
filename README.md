# neilfoxcroft.com

Source for [neilfoxcroft.com](https://neilfoxcroft.com), the personal site of Neil Foxcroft, a backend software engineer working with Java, Kotlin and Spring Boot.

It's a single static page: about, experience, education, projects, and an interactive map of my Pacific Crest Trail thru-hike.

## Stack

- [Astro](https://astro.build): builds the site to plain HTML/CSS with almost no JavaScript
- [Tailwind CSS](https://tailwindcss.com) for styling, with colours from [Catppuccin](https://catppuccin.com) Mocha
- [JetBrains Mono](https://www.jetbrains.com/lp/mono/), self-hosted via Fontsource
- [d3-geo](https://d3js.org/d3-geo) to project the PCT map at build time into a static SVG
- TypeScript, Node 22+

The only client-side JavaScript is a few small scripts: the nav highlight, the experience timeline, the cursor spotlight and the map's hover effects. All of them respect `prefers-reduced-motion`.

## Running locally

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # type-check, then build to dist/
npm run preview   # serve the built dist/ locally
```

## Editing content

All CV content lives in [`src/data/resume.json`](src/data/resume.json), loosely following the [JSON Resume](https://jsonresume.org/schema) schema:

- `basics`: name, title, pitch, location, links and the About paragraphs (wrap a name in `**double asterisks**` to emphasise it)
- `work`: Entelect, with each client or internal engagement under `engagements`
- `education`, `certificates`, `projects`
- `pct`: the trail intro, stats, journal link and photo slots. Distances are stored in miles (e.g. `"miles": [0, 702]`) and shown in km or mi depending on the switch by the map

Change the file and the page updates; no component changes needed. The résumé PDF lives at `public/files/NeilFoxcroftResume.pdf`.

### PCT photos

There's one photo slot per trail section (Start, Desert, Sierra, NorCal, Oregon, Washington, End) in `pct.photos`, shown as a strip of square thumbnails under the map. To fill one:

1. Put the photo in `src/assets/pct/` (full-size JPG/PNG/WebP is fine; the build resizes it to WebP at several sizes).
2. Set that slot's `image` to the filename and `alt` to a short description, e.g.
   `"image": "desert.jpg", "alt": "Sunset over the Mojave near mile 500"`.

Hovering a photo colours the map's route up to where that section ends (`endsAt`, a real place pinned to the trail), and clicking it opens the photo full size. Slots without an image show a dashed placeholder. An optional `short` name (e.g. `"Wash."`) is used when the thumbnails get narrow. A misspelt filename fails the build with a clear message.

If you change the name, title or pitch, regenerate the social-share image and icons:

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

Between the map and the photo strip there's an **elevation profile** of the whole trail, built from [`src/data/pct-elevation.json`](src/data/pct-elevation.json): 1,000 evenly spaced points with elevations from NASA SRTM (public domain) via [OpenTopoData](https://www.opentopodata.org), lightly smoothed because only the shape matters. It's linked to the map both ways: dragging along the profile traces the map, and moving over the map moves the profile's marker. Selecting a photo fills its stretch of the profile. To refresh the data after the trail line changes:

```bash
node scripts/fetch-pct-elevation.mjs
```

## Deployment

The site is hosted on AWS. CodeBuild runs [`buildspec.yml`](buildspec.yml) (`npm install`, `npm run build`) and publishes the contents of `dist/`, which are served from S3. `dist/404.html` is the error page.

## Project layout

```
src/
  components/   one component per section (Header, About, Experience, PctMap, ...)
  data/         resume.json (content) and pct-trail.json (map route)
  layouts/      page shell: meta tags, fonts, icons
  lib/          small helpers and the build-time map projection
  pages/        index.astro (the site) and 404.astro
  styles/       Tailwind setup and the Catppuccin colour tokens
scripts/        one-off scripts: OSM trail fetch, icon/OG image generation
public/         static files copied as-is (icons, OG image, résumé PDF)
docs/redesign/  the design brief and approved mockup for this version
```
