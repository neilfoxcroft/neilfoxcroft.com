// The gently meandering "trail" used for the experience timeline instead of a straight bar.
// trailX gives the trail's sideways offset (px from the track's centre) at a given height, and trailMask
// draws one repeating tile of it as an SVG for a CSS mask. The page uses both: the mask shapes the line,
// and the script puts the glowing head and the entry dots on the same curve.

export const TRAIL_TRACK = 14; // track width, px (room for the bends plus the stroke)
export const TRAIL_PERIOD = 140; // height of one repeating tile, px

// Two harmonics, so the bends are uneven like a path rather than a regular zigzag. Peaks at about ±4.5px.
export function trailX(y: number): number {
  const t = (2 * Math.PI * y) / TRAIL_PERIOD;
  return 3.2 * Math.sin(t) + 1.3 * Math.sin(2 * t + 1);
}

export function trailMask(stroke = 2.5): string {
  const c = TRAIL_TRACK / 2;
  const points: string[] = [];
  // A little past both edges of the tile, so neighbouring tiles join without a seam.
  for (let y = -4; y <= TRAIL_PERIOD + 4; y += 2) points.push(`${(c + trailX(y)).toFixed(2)} ${y}`);
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${TRAIL_TRACK}' height='${TRAIL_PERIOD}'>` +
    `<path d='M${points.join('L')}' fill='none' stroke='white' stroke-width='${stroke}' stroke-linejoin='round'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
