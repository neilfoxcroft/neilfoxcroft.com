// Colours stretches of the trail on the PCT map (PctMap.astro): the Campo-to-pointer colouring ("done") and the
// photo strip's section highlight. Both scripts (PctMap.astro, Pct.astro) call these.
//
// iPhone Safari doesn't reliably restyle <use> copies of a path when a CSS variable inherited from their group
// changes, and doesn't animate registered custom properties into them either, so driving the dashes that way left
// the map blank, fully lit or out of step with the elevation profile. Instead, on first use the <use> copies in the
// two colouring groups are swapped for real <path> clones, and their dash lengths are set on each path directly as
// plain numbers (SVG units of the route's measured length). The section fill is animated frame by frame here.

const SVG_NS = 'http://www.w3.org/2000/svg';

type Route = { len: number; done: SVGPathElement[]; section: SVGGElement; sectionPaths: SVGPathElement[] };
let cached: Route | null | undefined;

function route(): Route | null {
  if (cached !== undefined) return cached;
  const svg = document.querySelector<SVGSVGElement>('[data-pct-map] svg');
  const path = svg?.querySelector<SVGPathElement>('#pct-route');
  const doneGroup = svg?.querySelector<SVGGElement>('[data-pct-done]');
  const section = svg?.querySelector<SVGGElement>('[data-pct-section]');
  const d = path?.getAttribute('d');
  if (!path || !doneGroup || !section || !d) return (cached = null);
  const toPaths = (group: SVGGElement) =>
    [...group.querySelectorAll('use')].map((use) => {
      const p = document.createElementNS(SVG_NS, 'path');
      p.setAttribute('d', d);
      for (const name of ['stroke-width', 'opacity']) {
        const value = use.getAttribute(name);
        if (value) p.setAttribute(name, value);
      }
      use.replaceWith(p);
      return p;
    });
  return (cached = { len: path.getTotalLength(), done: toPaths(doneGroup), section, sectionPaths: toPaths(section) });
}

const dash = (paths: SVGPathElement[], length: number, gap: number, offset: number) => {
  for (const p of paths) {
    p.setAttribute('stroke-dasharray', `${length.toFixed(1)} ${gap.toFixed(1)}`);
    p.setAttribute('stroke-dashoffset', offset.toFixed(1));
  }
};

/** Colour the route from Campo to fraction f (0–1) of its length; 0 hides it. */
export function setDone(f: number) {
  const r = route();
  if (!r) return;
  // Hidden entirely at 0: a zero-length dash with round caps would still leave a dot at Campo.
  for (const p of r.done) p.setAttribute('visibility', f > 0 ? 'visible' : 'hidden');
  dash(r.done, r.len, r.len, (1 - f) * r.len);
}

let frame = 0;
let backstop = 0;

/** Show the stretch from `from` to `to` (0–1) in `colour`, filling up from its start over `seconds`. */
export function showSection(from: number, to: number, colour: string, seconds: number) {
  const r = route();
  if (!r) return;
  cancelAnimationFrame(frame);
  window.clearTimeout(backstop);
  r.section.style.stroke = colour;
  r.section.toggleAttribute('data-active', to > from);
  const span = Math.max(0, to - from) * r.len;
  const instant = seconds <= 0 || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const start = performance.now();
  const draw = (now: number) => {
    const t = instant ? 1 : Math.min(1, (now - start) / (seconds * 1000));
    const eased = 1 - (1 - t) ** 3; // ease-out
    dash(r.sectionPaths, span * eased, r.len * 2, -from * r.len);
    if (t < 1) frame = requestAnimationFrame(draw);
  };
  draw(start);
  // If frames are throttled or paused, still end on the full section.
  if (!instant) backstop = window.setTimeout(() => draw(start + seconds * 1000), seconds * 1000 + 50);
}

/** Hide the section highlight. */
export function hideSection() {
  const r = route();
  if (!r) return;
  cancelAnimationFrame(frame);
  window.clearTimeout(backstop);
  r.section.removeAttribute('data-active');
}
