// One-off: fetch the Pacific Crest Trail from OpenStreetMap and save a simplified line
// to src/data/pct-trail.json. The site build only reads that file, so it never goes online.
//
//   node scripts/fetch-pct-trail.mjs
//
// Data © OpenStreetMap contributors, ODbL (https://www.openstreetmap.org/copyright).

import { writeFile } from 'node:fs/promises';

const SUPERROUTE_ID = 1225378; // "Pacific Crest Trail" superroute: its members are the section routes, in order.
const TOLERANCE_DEG = 0.004; // Douglas–Peucker tolerance (~400 m); plenty for a ~600px wide map.
const OUT = new URL('../src/data/pct-trail.json', import.meta.url);

const query = `[out:json][timeout:180];
relation(${SUPERROUTE_ID});out body;
rel(r);out body;
way(r);out geom;`;

const res = await fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'neilfoxcroft.com-map-build/1.0 (+https://github.com/neilfoxcroft/neilfoxcroft.com-repo)',
  },
  body: new URLSearchParams({ data: query }),
});
if (!res.ok) throw new Error(`Overpass returned ${res.status}`);
const raw = await res.text();
const { elements } = JSON.parse(raw);
console.log(`Downloaded ${(raw.length / 1e6).toFixed(1)} MB, ${elements.length} elements`);

const rels = new Map(elements.filter((e) => e.type === 'relation').map((e) => [e.id, e]));
const ways = new Map(elements.filter((e) => e.type === 'way').map((e) => [e.id, e]));

const dist2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;

// Sections are listed south to north, but the ways inside a section are not in walking order.
// So each section is chained greedily: starting from where the line currently ends, keep attaching
// whichever unused way has an end nearest to it (flipped if needed). Members with a role
// (alternate, excursion, etc.) are skipped.
let line = [];
let wayCount = 0;
for (const section of rels.get(SUPERROUTE_ID).members.filter((m) => m.type === 'relation')) {
  const rel = rels.get(section.ref);
  if (!rel) continue;
  const pool = rel.members
    .filter((m) => m.type === 'way' && (!m.role || m.role === 'main'))
    .map((m) => ways.get(m.ref)?.geometry?.map((p) => [p.lon, p.lat]))
    .filter(Boolean);
  wayCount += pool.length;

  // The very first section starts from its southernmost point (Campo).
  let end = line.at(-1) ?? pool.flat().reduce((s, p) => (p[1] < s[1] ? p : s));
  while (pool.length) {
    let best = 0;
    let flip = false;
    let bestD = Infinity;
    pool.forEach((w, i) => {
      const a = dist2(end, w[0]);
      const b = dist2(end, w.at(-1));
      if (a < bestD) [bestD, best, flip] = [a, i, false];
      if (b < bestD) [bestD, best, flip] = [b, i, true];
    });
    const [way] = pool.splice(best, 1);
    const pts = flip ? [...way].reverse() : way;
    line = line.concat(pts);
    end = pts.at(-1);
  }
}

const km = (a, b) => {
  const r = Math.PI / 180;
  const h =
    Math.sin(((b[1] - a[1]) * r) / 2) ** 2 +
    Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(((b[0] - a[0]) * r) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};
const length = line.slice(1).reduce((sum, p, i) => sum + km(line[i], p), 0);
const gaps = line.slice(1).map((p, i) => km(line[i], p)).filter((d) => d > 5);
console.log(`Stitched ${wayCount} ways: ${line.length} points, ${Math.round(length)} km, ${gaps.length} gaps > 5 km`);

// Douglas–Peucker simplification (iterative, in degrees).
function simplify(pts, tol) {
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop();
    const [ax, ay] = pts[s];
    const [bx, by] = pts[e];
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy || 1e-12;
    let max = 0;
    let idx = -1;
    for (let i = s + 1; i < e; i++) {
      const [px, py] = pts[i];
      const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
      const d = (px - ax - t * dx) ** 2 + (py - ay - t * dy) ** 2;
      if (d > max) [max, idx] = [d, i];
    }
    if (max > tol * tol) {
      keep[idx] = 1;
      stack.push([s, idx], [idx, e]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}

const simple = simplify(line, TOLERANCE_DEG).map(([x, y]) => [+x.toFixed(4), +y.toFixed(4)]);
const geojson = {
  type: 'Feature',
  properties: {
    name: 'Pacific Crest Trail',
    source: `OpenStreetMap relation ${SUPERROUTE_ID}`,
    attribution: '© OpenStreetMap',
    fetched: new Date().toISOString().slice(0, 10),
    lengthKm: Math.round(length),
  },
  geometry: { type: 'LineString', coordinates: simple },
};
await writeFile(OUT, JSON.stringify(geojson) + '\n');
console.log(`Wrote ${simple.length} points to src/data/pct-trail.json`);
