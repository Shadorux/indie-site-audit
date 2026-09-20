import type { APIRoute } from 'astro';
import * as cheerio from 'cheerio';

type AuditCheck = {
  id: string;
  label: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
  points: number;
  max: number;
};

const privateHost = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|0\.|169\.254\.)/i;

function normalizeUrl(input: string) {
  const raw = input.trim();
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(withProtocol);
  if (!['http:', 'https:'].includes(url.protocol) || privateHost.test(url.hostname)) {
    throw new Error('Please enter a public HTTP or HTTPS website.');
  }
  return url;
}

async function probe(url: URL) {
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(7000),
      headers: { 'user-agent': 'IndieSiteAudit/0.1 (+https://github.com/Shadorux/indie-site-audit)' },
    });
    return { ok: response.ok, status: response.status, contentType: response.headers.get('content-type') || '' };
  } catch {
    return { ok: false, status: 0, contentType: '' };
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const target = normalizeUrl(String(body?.url || ''));

    const response = await fetch(target, {
      redirect: 'follow',
      signal: AbortSignal.timeout(12000),
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; IndieSiteAudit/0.1; +https://github.com/Shadorux/indie-site-audit)',
        accept: 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) throw new Error(`Site returned HTTP ${response.status}.`);
    const html = await response.text();
    if (html.length > 2_000_000) throw new Error('That page is too large to audit right now.');

    const $ = cheerio.load(html);
    const title = $('title').first().text().trim();
    const description = $('meta[name="description"]').attr('content')?.trim() || '';
    const canonical = $('link[rel="canonical"]').attr('href') || '';
    const h1Count = $('h1').length;
    const images = $('img').length;
    const imagesMissingAlt = $('img').filter((_, el) => !$(el).attr('alt')).length;
    const anchors = $('a[href]').length;
    const ogTitle = $('meta[property="og:title"]').attr('content') || '';
    const viewport = $('meta[name="viewport"]').attr('content') || '';
    const lang = $('html').attr('lang') || '';
    const rss = $('link[type="application/rss+xml"], link[type="application/atom+xml"]').attr('href') || '';

    const robotsUrl = new URL('/robots.txt', response.url || target.href);
    const sitemapUrl = new URL('/sitemap.xml', response.url || target.href);
    const [robots, sitemap] = await Promise.all([probe(robotsUrl), probe(sitemapUrl)]);

    const checks: AuditCheck[] = [
      { id: 'https', label: 'HTTPS', status: target.protocol === 'https:' ? 'pass' : 'fail', detail: target.protocol === 'https:' ? 'Secure connection detected.' : 'Site is not using HTTPS.', points: target.protocol === 'https:' ? 10 : 0, max: 10 },
      { id: 'title', label: 'Page title', status: title.length >= 15 && title.length <= 65 ? 'pass' : title ? 'warn' : 'fail', detail: title ? `${title.length} characters · ${title}` : 'No <title> found.', points: title ? (title.length >= 15 && title.length <= 65 ? 10 : 6) : 0, max: 10 },
      { id: 'description', label: 'Meta description', status: description.length >= 70 && description.length <= 165 ? 'pass' : description ? 'warn' : 'fail', detail: description ? `${description.length} characters.` : 'No meta description found.', points: description ? (description.length >= 70 && description.length <= 165 ? 10 : 6) : 0, max: 10 },
      { id: 'canonical', label: 'Canonical URL', status: canonical ? 'pass' : 'warn', detail: canonical || 'No canonical link declared.', points: canonical ? 8 : 3, max: 8 },
      { id: 'h1', label: 'Heading structure', status: h1Count === 1 ? 'pass' : 'warn', detail: h1Count === 1 ? 'Exactly one H1 found.' : `${h1Count} H1 headings found.`, points: h1Count === 1 ? 8 : h1Count > 0 ? 4 : 0, max: 8 },
      { id: 'images', label: 'Image alt text', status: imagesMissingAlt === 0 ? 'pass' : 'warn', detail: images ? `${images - imagesMissingAlt}/${images} images have alt text.` : 'No images on this page.', points: images === 0 || imagesMissingAlt === 0 ? 8 : Math.max(2, Math.round(8 * ((images - imagesMissingAlt) / images))), max: 8 },
      { id: 'og', label: 'Open Graph', status: ogTitle ? 'pass' : 'warn', detail: ogTitle ? 'Open Graph title found.' : 'No og:title found.', points: ogTitle ? 7 : 2, max: 7 },
      { id: 'viewport', label: 'Mobile viewport', status: viewport ? 'pass' : 'fail', detail: viewport || 'Missing viewport meta tag.', points: viewport ? 7 : 0, max: 7 },
      { id: 'lang', label: 'Document language', status: lang ? 'pass' : 'warn', detail: lang ? `Language is set to “${lang}”.` : 'No lang attribute on <html>.', points: lang ? 6 : 2, max: 6 },
      { id: 'robots', label: 'robots.txt', status: robots.ok ? 'pass' : 'warn', detail: robots.ok ? `Found at ${robotsUrl.pathname}.` : 'robots.txt was not found.', points: robots.ok ? 7 : 2, max: 7 },
      { id: 'sitemap', label: 'XML sitemap', status: sitemap.ok ? 'pass' : 'warn', detail: sitemap.ok ? `Found at ${sitemapUrl.pathname}.` : 'sitemap.xml was not found.', points: sitemap.ok ? 7 : 2, max: 7 },
      { id: 'rss', label: 'RSS / Atom feed', status: rss ? 'pass' : 'warn', detail: rss || 'No feed autodiscovery link found.', points: rss ? 6 : 1, max: 6 },
      { id: 'links', label: 'Internal discoverability', status: anchors >= 5 ? 'pass' : 'warn', detail: `${anchors} links found on the page.`, points: anchors >= 5 ? 6 : anchors > 0 ? 3 : 0, max: 6 },
    ];

    const score = Math.round((checks.reduce((sum, check) => sum + check.points, 0) / checks.reduce((sum, check) => sum + check.max, 0)) * 100);
    return new Response(JSON.stringify({
      url: response.url || target.href,
      score,
      checks,
      stats: { h1Count, images, imagesMissingAlt, anchors },
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Audit failed.' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }
};
