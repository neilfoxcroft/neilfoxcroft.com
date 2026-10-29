/** "2024" + "2026" -> "2024 — 2026"; no end date -> "2022 — Present"; same year -> "2021". */
export function dateRange(start: string, end?: string): string {
  if (!end) return `${start} — Present`;
  if (start === end) return start;
  return `${start} — ${end}`;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Escapes text and turns **name** into an emphasised span. Used for the About copy. */
export function emphasise(text: string): string {
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, '<span class="font-semibold text-heading">$1</span>');
}
