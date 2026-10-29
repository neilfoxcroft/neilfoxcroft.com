// Builds the PCT elevation profile at build time from src/data/pct-elevation.json
// (NASA SRTM via OpenTopoData; see scripts/fetch-pct-elevation.mjs).
//
// The profile's x axis is distance along the trail (samples are evenly spaced on the ground), 0 at Campo to 1 at
// Manning Park. Each sample also knows its position along the map's drawn route (mapF), so scrubbing the profile
// can drive the map, and photo sections (pinned to real places) can be placed on the profile.

import elevation from '../data/pct-elevation.json';

export const PROFILE_W = 1000;
export const PROFILE_H = 100;

type Point = [number, number, number]; // lon, lat, metres

export function buildElevationProfile(fractionAtPlace: (lonLat: [number, number]) => number) {
  // Light smoothing (moving average over 7 samples, ~28 km): only the overall shape matters, and raw 90 m SRTM
  // samples look jagged at this size.
  const raw = elevation.points as Point[];
  const points: Point[] = raw.map(([lon, lat], i) => {
    const window = raw.slice(Math.max(0, i - 3), i + 4);
    return [lon, lat, Math.round(window.reduce((sum, p) => sum + p[2], 0) / window.length)];
  });
  const n = points.length;
  const max = Math.max(...points.map((p) => p[2]));
  const x = (i: number) => (i / (n - 1)) * PROFILE_W;
  // Heights from 0 m, leaving a little headroom so the peak doesn't touch the top.
  const y = (metres: number) => PROFILE_H - (metres / max) * (PROFILE_H - 8);

  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p[2]).toFixed(1)}`).join('');
  const area = `${line}L${PROFILE_W} ${PROFILE_H}L0 ${PROFILE_H}Z`;

  // Nearest sample to a place, as a 0–1 position along the profile.
  const xOfPlace = ([lon, lat]: [number, number]) => {
    const cosLat = Math.cos((lat * Math.PI) / 180);
    let best = 0;
    let bestD = Infinity;
    points.forEach(([px, py], i) => {
      const d = ((px - lon) * cosLat) ** 2 + (py - lat) ** 2;
      if (d < bestD) [bestD, best] = [d, i];
    });
    return +(best / (n - 1)).toFixed(4);
  };

  const peakIndex = points.findIndex((p) => p[2] === max);

  return {
    area,
    line,
    // Per-sample data for the scrubber (client side): elevation in metres and position on the map's route.
    elev: points.map((p) => p[2]),
    mapF: points.map((p) => +fractionAtPlace([p[0], p[1]]).toFixed(3)),
    max,
    xOfPlace,
    peak: { x: peakIndex / (n - 1), y: y(max) / PROFILE_H },
  };
}
