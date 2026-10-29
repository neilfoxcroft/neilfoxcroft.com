// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Static output: `npm run build` writes plain HTML/CSS/JS to dist/ for S3.
export default defineConfig({
  site: 'https://neilfoxcroft.com',
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
  },
});
