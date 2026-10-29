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

type Labelled = { text: string; x: number; y: number };

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

  const at = (text: string, lon: number, lat: number): Labelled => {
    const [x, y] = projection([lon, lat])!;
    return { text, x: Math.round(x), y: Math.round(y) };
  };

  const coords = trailFeature.geometry.coordinates as [number, number][];
  const [startX, startY] = projection(coords[0])!;
  const [endX, endY] = projection(coords.at(-1)!)!;

  // Hover segments: the route cut into ~HOVER_SEGMENTS pieces of equal on-map length. Each piece knows
  // how far along the trail it ends (0 to 1), so hovering it can colour the route from Campo up to there.
  const HOVER_SEGMENTS = 120;
  const screen = coords.map((c) => projection(c)!);
  const cumulative = [0];
  for (let i = 1; i < screen.length; i++) {
    cumulative.push(cumulative[i - 1] + Math.hypot(screen[i][0] - screen[i - 1][0], screen[i][1] - screen[i - 1][1]));
  }
  const total = cumulative.at(-1)!;
  const segments: { d: string; f: number }[] = [];
  let from = 0;
  for (let n = 1; n <= HOVER_SEGMENTS; n++) {
    const target = (total * n) / HOVER_SEGMENTS;
    let to = from + 1;
    while (to < coords.length - 1 && cumulative[to] < target) to++;
    const d = path({ type: 'LineString', coordinates: coords.slice(from, to + 1) });
    if (d) segments.push({ d, f: +(cumulative[to] / total).toFixed(4) });
    from = to;
    if (from >= coords.length - 1) break;
  }

  return {
    graticule: path(geoGraticule().step([2, 2])()) ?? '',
    countries: pick(countries, CONTEXT_COUNTRIES),
    contextStates: pick(states, CONTEXT_STATES),
    trailStates: pick(states, TRAIL_STATES),
    trail: path(trailFeature) ?? '',
    segments,
    start: { x: Math.round(startX), y: Math.round(startY) },
    end: { x: Math.round(endX), y: Math.round(endY) },
    stateLabels: [at('WASHINGTON', -118.8, 47.3), at('OREGON', -119.9, 43.9), at('CALIFORNIA', -122.0, 37.9)],
    countryLabels: [at('CANADA', -116.6, 49.6), at('MEXICO', -114.6, 31.3)],
    ocean: at('PACIFIC OCEAN', -126.6, 39),
    attribution: (trail as { properties: { attribution: string } }).properties.attribution,
  };
}
