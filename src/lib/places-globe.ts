// Data for the travel globe (/places/): a dark, borderless world with only the places I've been drawn on it,
// lit up. Places come from resume.json `places`.
//
// - Land: world-atlas land-110m (Natural Earth), one outline with no country borders, sent as TopoJSON.
// - Visited countries: world-atlas countries-110m; visited US states: us-atlas (US Census Bureau). Only those
//   shapes are sent, as GeoJSON. The US lights up state by state, so it isn't drawn as a country.
//
// All shapes are the original data: shrinking it (rounding or simplifying) put kinks in borders that made
// shapes briefly fill the whole globe as it turned.

import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Feature, Geometry } from 'geojson';
import landTopo from 'world-atlas/land-110m.json';
import worldTopo from 'world-atlas/countries-110m.json';
import statesTopo from 'us-atlas/states-10m.json';
import resume from '../data/resume.json';

// Catppuccin Mocha accents, handed out in turn to the places that light up.
const COLOURS = ['#cba6f7', '#94e2d5', '#89b4fa', '#fab387', '#a6e3a1', '#f9e2af', '#f38ba8', '#89dceb'];
export const USA = 'United States of America';

export type LitPlace = { name: string; colour: string; geometry: Geometry };

const nameOf = (f: Feature) => String((f.properties as { name?: string } | null)?.name);

// The shapes for the given names, in that order. A typo in resume.json stops the build rather than just
// leaving a place dark.
function shapes(topo: unknown, object: string, names: string[]) {
  const t = topo as Topology;
  const all = feature(t, t.objects[object] as GeometryCollection).features;
  return names.map((name) => {
    const f = all.find((f) => nameOf(f) === name);
    if (!f?.geometry) throw new Error(`places: "${name}" is not a name in the ${object} map data`);
    return f.geometry;
  });
}

export function buildPlacesGlobe() {
  const { countries: visitedCountries, usStates } = resume.places;
  shapes(worldTopo, 'countries', visitedCountries); // checks the names, the US included
  const countryList = visitedCountries.filter((c) => c !== USA);

  const countries: LitPlace[] = shapes(worldTopo, 'countries', countryList).map((geometry, i) => ({
    name: countryList[i],
    colour: COLOURS[i % COLOURS.length],
    geometry,
  }));
  const states: LitPlace[] = shapes(statesTopo, 'states', usStates).map((geometry, i) => ({
    name: usStates[i],
    colour: COLOURS[(countryList.length + i) % COLOURS.length],
    geometry,
  }));
  return { countries, states, usa: visitedCountries.includes(USA), land: landTopo };
}
