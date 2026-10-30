// /sitemap.xml: the pages search engines should index (the 404 page is left out). robots.txt points here.
import type { APIRoute } from 'astro';

const pages = ['/', '/trail-stats/', '/places/'];

export const GET: APIRoute = ({ site }) => {
  const lastmod = new Date().toISOString().slice(0, 10); // the build date
  const urls = pages
    .map((path) => `  <url><loc>${new URL(path, site)}</loc><lastmod>${lastmod}</lastmod></url>`)
    .join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
};
