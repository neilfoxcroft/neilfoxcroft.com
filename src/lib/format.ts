/** "2024" + "2026" -> "2024 — 2026"; no end date -> "2022 — Present"; same year -> "2021". */
export function dateRange(start: string, end?: string): string {
  if (!end) return `${start} — Present`;
  if (start === end) return start;
  return `${start} — ${end}`;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export type Units = 'metric' | 'imperial';
const KM_PER_MILE = 1.609344;
const num = (n: number) => Math.round(n).toLocaleString('en-US');

/** Trail distances are stored in miles. [702] -> "mi 702" / "km 1,130"; [0, 702] -> "mi 0–702" / "km 0–1,130". */
export function distanceRange(miles: number[], units: Units): string {
  const values = units === 'metric' ? miles.map((m) => m * KM_PER_MILE) : miles;
  return `${units === 'metric' ? 'km' : 'mi'} ${values.map(num).join('–')}`;
}

/** 2650 -> "2,650 mi" / "4,265 km". */
export function distance(miles: number, units: Units): string {
  return units === 'metric' ? `${num(miles * KM_PER_MILE)} km` : `${num(miles)} mi`;
}

/** Elevations are stored in metres. 4421 -> "4,421 m" / "14,505 ft". */
export function elevation(metres: number, units: Units): string {
  return units === 'metric' ? `${num(metres)} m` : `${num(metres * 3.28084)} ft`;
}

/** Escapes text and turns **name** into an emphasised span. Used for the About copy. */
export function emphasise(text: string): string {
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, '<span class="font-semibold text-heading">$1</span>');
}
