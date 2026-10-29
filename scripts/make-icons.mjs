// Generates the favicon set and the social-share (Open Graph) image into public/.
// Re-run after changing the name, title or pitch in src/data/resume.json:
//
//   node scripts/make-icons.mjs

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const pub = (f) => fileURLToPath(new URL(`../public/${f}`, import.meta.url));
const resume = JSON.parse(await readFile(new URL('../src/data/resume.json', import.meta.url), 'utf8'));
const { name, label, pitch } = resume.basics;

const c = {
  bg: '#1e1e2e',
  crust: '#11111b',
  line: '#313244',
  text: '#a6adc8',
  heading: '#cdd6f4',
  muted: '#9399b2',
  accent: '#cba6f7',
  teal: '#038285',
};

// The mark: a mauve "//" (like the section labels) on a rounded dark square. Drawn as lines, not text,
// so it doesn't depend on fonts.
const mark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="${c.bg}"/>
  <path d="M27 16 17 48M45 16 35 48" stroke="${c.accent}" stroke-width="7" stroke-linecap="round"/>
</svg>
`;
await writeFile(pub('favicon.svg'), mark);

// apple-touch-icon: iOS adds its own rounded corners, so use a full square.
const square = mark.replace('rx="14"', 'rx="0"');
await sharp(Buffer.from(square)).resize(180, 180).png().toFile(pub('apple-touch-icon.png'));

// favicon.ico for older browsers: a single 32×32 PNG wrapped in a minimal ICO container.
const png32 = await sharp(Buffer.from(mark)).resize(32, 32).png().toBuffer();
const ico = Buffer.alloc(22);
ico.writeUInt16LE(0, 0); // reserved
ico.writeUInt16LE(1, 2); // type: icon
ico.writeUInt16LE(1, 4); // one image
ico.writeUInt8(32, 6); // width
ico.writeUInt8(32, 7); // height
ico.writeUInt16LE(1, 10); // colour planes
ico.writeUInt16LE(32, 12); // bits per pixel
ico.writeUInt32LE(png32.length, 14);
ico.writeUInt32LE(22, 18); // image data offset
await writeFile(pub('favicon.ico'), Buffer.concat([ico, png32]));

// Open Graph image, 1200×630: what LinkedIn, Slack, etc. show when the site is shared.
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const wrap = (text, max) => {
  const lines = [''];
  for (const word of text.split(' ')) {
    if ((lines.at(-1) + ' ' + word).trim().length > max) lines.push(word);
    else lines[lines.length - 1] = (lines.at(-1) + ' ' + word).trim();
  }
  return lines;
};
const mono = `'JetBrains Mono', Consolas, 'DejaVu Sans Mono', monospace`;
// The pitch marks coloured phrases with **…** for the site header; the share image shows it plain.
const pitchLines = wrap(pitch.replace(/\*\*/g, ''), 52)
  .map((l, i) => `<text x="96" y="${392 + i * 44}" font-size="30" fill="${c.text}">${esc(l)}</text>`)
  .join('\n  ');
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" font-family="${mono}">
  <defs>
    <radialGradient id="glow" cx="78%" cy="18%" r="60%">
      <stop offset="0" stop-color="${c.accent}" stop-opacity="0.16"/>
      <stop offset="1" stop-color="${c.accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="${c.bg}"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect x="0" y="618" width="1200" height="12" fill="${c.teal}"/>
  <text x="96" y="150" font-size="28" fill="${c.muted}"><tspan fill="${c.accent}">//</tspan> neilfoxcroft.com</text>
  <text x="96" y="262" font-size="88" font-weight="700" fill="${c.heading}">${esc(name)}</text>
  <text x="96" y="328" font-size="38" font-weight="600" fill="${c.accent}">${esc(label)}</text>
  ${pitchLines}
</svg>
`;
await sharp(Buffer.from(og)).png().toFile(pub('og-image.png'));

console.log('Wrote favicon.svg, favicon.ico, apple-touch-icon.png, og-image.png to public/');
