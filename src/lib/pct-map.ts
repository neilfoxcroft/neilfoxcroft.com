// Builds the PCT map as SVG path strings at build time, so the page ships a static SVG and no map code.
//
// - State outlines: us-atlas (US Census Bureau, public domain)
// - Canada / Mexico: world-atlas (Natural Earth, public domain)
// - Trail: src/data/pct-trail.json, simplified from OpenStreetMap (see scripts/fetch-pct-trail.mjs)

import { geoConicConformal, geoGraticule, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Feature, FeatureCollection, LineString } from 'geojson';
import statesTopo from 'us-atlas/states-10m.json';
import worldTopo from 'world-atlas/countries-50m.json';
import trail from '../data/pct-trail.json';

export const WIDTH = 600;
export const HEIGHT = 888;

// FIPS codes from us-atlas.
const TRAIL_STATES = ['06', '41', '53']; // California, Oregon, Washington
const CONTEXT_STATES = ['32', '16', '04', '49', '30', '56']; // NV, ID, AZ, UT, MT, WY
const CONTEXT_COUNTRIES = ['124', '484']; // Canada, Mexico

type Labelled = { text: string; x: number; y: number; size?: number };

export function buildPctMap() {
  const trailFeature = trail as unknown as Feature<LineString>;

  // Lambert conformal conic tuned for the US West Coast, north up. The trail is fitted
  // into the frame with a margin; everything else is clipped to the frame.
  const projection = geoConicConformal()
    .parallels([34, 46])
    .rotate([119, 0])
    .fitExtent(
      [
        [40, 70],
        [WIDTH - 40, HEIGHT - 70],
      ],
      trailFeature,
    )
    .clipExtent([
      [0, 0],
      [WIDTH, HEIGHT],
    ]);
  const path = geoPath(projection).digits(1);

  const states = feature(
    statesTopo as unknown as Topology,
    (statesTopo as unknown as Topology).objects.states as GeometryCollection,
  ) as FeatureCollection;
  const countries = feature(
    worldTopo as unknown as Topology,
    (worldTopo as unknown as Topology).objects.countries as GeometryCollection,
  ) as FeatureCollection;

  const pick = (fc: FeatureCollection, ids: string[]) =>
    fc.features.filter((f) => ids.includes(String(f.id))).map((f) => path(f) ?? '');

  const at = (text: string, lon: number, lat: number, size?: number): Labelled => {
    const [x, y] = projection([lon, lat])!;
    return { text, x: Math.round(x), y: Math.round(y), size };
  };

  const coords = trailFeature.geometry.coordinates as [number, number][];
  const [startX, startY] = projection(coords[0])!;
  const [endX, endY] = projection(coords.at(-1)!)!;

  // Hover samples: SAMPLES points spaced evenly along the route as drawn on the map, as a flat
  // [x0, y0, x1, y1, ...] list in SVG units. Sample i sits i / (SAMPLES - 1) of the way along, which is the
  // same 0-to-1 scale as the route's pathLength, so the nearest sample to the cursor says how much to colour.
  const SAMPLES = 400;
  const screen = coords.map((c) => projection(c)!);
  const cumulative = [0];
  for (let i = 1; i < screen.length; i++) {
    cumulative.push(cumulative[i - 1] + Math.hypot(screen[i][0] - screen[i - 1][0], screen[i][1] - screen[i - 1][1]));
  }
  const total = cumulative.at(-1)!;
  const samples: number[] = [];
  let seg = 1;
  for (let n = 0; n < SAMPLES; n++) {
    const target = (total * n) / (SAMPLES - 1);
    while (seg < screen.length - 1 && cumulative[seg] < target) seg++;
    const span = cumulative[seg] - cumulative[seg - 1] || 1;
    const t = Math.min(1, Math.max(0, (target - cumulative[seg - 1]) / span));
    const [ax, ay] = screen[seg - 1];
    const [bx, by] = screen[seg];
    samples.push(+(ax + (bx - ax) * t).toFixed(1), +(ay + (by - ay) * t).toFixed(1));
  }

  // A place ([lon, lat]) -> the 0-to-1 position of the nearest trail point along the drawn route (the scale
  // --done uses). Section ends are pinned to real places rather than converted from trail miles, because the
  // OSM line doesn't track the official mileage evenly (reroutes, alternates).
  const fractionAtPlace = ([lon, lat]: [number, number]): number => {
    const cosLat = Math.cos((lat * Math.PI) / 180);
    let best = 0;
    let bestD = Infinity;
    coords.forEach(([x, y], i) => {
      const d = ((x - lon) * cosLat) ** 2 + (y - lat) ** 2;
      if (d < bestD) [bestD, best] = [d, i];
    });
    return +(cumulative[best] / total).toFixed(4);
  };

  return {
    fractionAtPlace,
    graticule: path(geoGraticule().step([2, 2])()) ?? '',
    countries: pick(countries, CONTEXT_COUNTRIES),
    contextStates: pick(states, CONTEXT_STATES),
    trailStates: pick(states, TRAIL_STATES),
    trail: path(trailFeature) ?? '',
    samples,
    start: { x: Math.round(startX), y: Math.round(startY) },
    end: { x: Math.round(endX), y: Math.round(endY) },
    // Placed (by searching the map) so the enlarged labels never touch the trail; WASHINGTON and CALIFORNIA
    // overhang their state a little because the trail leaves no wide enough gap inside them.
    stateLabels: [at('WASHINGTON', -118.3, 46.93), at('OREGON', -118.59, 43.68), at('CALIFORNIA', -115.91, 34.66)],
    // The map tilts away from the viewer, so CANADA (far edge) is larger than MEXICO (near edge) to read the same.
    countryLabels: [at('CANADA', -116.6, 49.53, 34), at('MEXICO', -114.59, 31.35, 30)],
    ocean: at('PACIFIC OCEAN', -126.6, 39),
    attribution: (trail as { properties: { attribution: string } }).properties.attribution,
  };
}
