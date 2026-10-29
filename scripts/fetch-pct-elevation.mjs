// One-off: look up the elevation along the PCT and save it to src/data/pct-elevation.json for the
// elevation profile. The site build only reads that file, so it never goes online.
//
//   node scripts/fetch-pct-elevation.mjs
//
// Elevations: NASA SRTM 90 m (public domain) via the OpenTopoData public API (https://www.opentopodata.org),
// which allows 100 locations per request and 1 request per second.
// Re-run after scripts/fetch-pct-trail.mjs if the trail line changes.

import { readFile, writeFile } from 'node:fs/promises';

const SAMPLES = 1000; // points spaced evenly along the trail (~4 km apart)
const API = 'https://api.opentopodata.org/v1/srtm90m';
const OUT = new URL('../src/data/pct-elevation.json', import.meta.url);

const trail = JSON.parse(await readFile(new URL('../src/data/pct-trail.json', import.meta.url), 'utf8'));
const coords = trail.geometry.coordinates;

// Real distance along the trail, so samples are evenly spaced on the ground.
const r = Math.PI / 180;
const km = (a, b) =>
  12742 *
  Math.asin(
    Math.sqrt(Math.sin(((b[1] - a[1]) * r) / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(((b[0] - a[0]) * r) / 2) ** 2),
  );
const cumulative = [0];
for (let i = 1; i < coords.length; i++) cumulative.push(cumulative[i - 1] + km(coords[i - 1], coords[i]));
const total = cumulative.at(-1);

const points = [];
let seg = 1;
for (let n = 0; n < SAMPLES; n++) {
  const target = (total * n) / (SAMPLES - 1);
  while (seg < coords.length - 1 && cumulative[seg] < target) seg++;
  const t = Math.min(1, Math.max(0, (target - cumulative[seg - 1]) / (cumulative[seg] - cumulative[seg - 1] || 1)));
  const [ax, ay] = coords[seg - 1];
  const [bx, by] = coords[seg];
  points.push([+(ax + (bx - ax) * t).toFixed(4), +(ay + (by - ay) * t).toFixed(4)]);
}

const elevations = [];
for (let i = 0; i < points.length; i += 100) {
  const batch = points.slice(i, i + 100);
  const url = `${API}?locations=${batch.map(([lon, lat]) => `${lat},${lon}`).join('|')}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'neilfoxcroft.com-map-build/1.0 (+https://github.com/neilfoxcroft/neilfoxcroft.com-repo)' },
  });
  if (!res.ok) throw new Error(`OpenTopoData returned ${res.status}`);
  const body = await res.json();
  if (body.status !== 'OK') throw new Error(`OpenTopoData: ${body.error ?? body.status}`);
  for (const r of body.results) elevations.push(r.elevation == null ? null : Math.round(r.elevation));
  console.log(`Fetched ${elevations.length} / ${points.length}`);
  if (i + 100 < points.length) await new Promise((done) => setTimeout(done, 1100)); // stay under 1 request/second
}

// Fill any gaps (no data) from the neighbours.
for (let i = 0; i < elevations.length; i++) {
  if (elevations[i] != null) continue;
  const prev = elevations.slice(0, i).reverse().find((e) => e != null);
  const next = elevations.slice(i + 1).find((e) => e != null);
  elevations[i] = prev ?? next ?? 0;
}

const out = {
  source: 'NASA SRTM 90 m via OpenTopoData',
  fetched: new Date().toISOString().slice(0, 10),
  lengthKm: Math.round(total),
  // [lon, lat, elevation in metres], evenly spaced along the trail from Campo to Manning Park.
  points: points.map(([lon, lat], i) => [lon, lat, elevations[i]]),
};
await writeFile(OUT, JSON.stringify(out) + '\n');
const max = Math.max(...elevations);
console.log(`Wrote ${points.length} points; elevation ${Math.min(...elevations)}–${max} m (highest at index ${elevations.indexOf(max)})`);
