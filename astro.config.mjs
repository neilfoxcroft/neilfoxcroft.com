// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Static output: `npm run build` writes plain HTML/CSS/JS to dist/ for S3.
export default defineConfig({
  site: 'https://neilfoxcroft.com',
  output: 'static',
  // Content Security Policy, written into each page as a <meta> tag. Astro hashes every script and style it
  // renders, so only those (plus the files listed here) can run. Inline style attributes are allowed: the site
  // uses them for per-section colours and the map's trail length. GoatCounter (visitor stats) is the only
  // third party: its script comes from gc.zgo.at and it reports to foxcroft.goatcounter.com.
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data: https://foxcroft.goatcounter.com",
        "connect-src 'self' https://foxcroft.goatcounter.com",
        // data: because the build inlines the font's smallest language subset into the stylesheet.
        "font-src 'self' data:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'none'",
      ],
      scriptDirective: { resources: ["'self'", 'https://gc.zgo.at'] },
      styleDirective: { resources: ["'self'", { resource: "'unsafe-inline'", kind: 'attribute' }] },
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
