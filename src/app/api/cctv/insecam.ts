import type { CctvCamera } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Insecam – world's biggest public IP-camera directory
// https://www.insecam.org
//
// Strategy
//   1. Scrape the rating page + selected country pages for camera IDs & feed URLs
//   2. For each discovered camera, fetch /en/view/{id}/ to extract lat/lng,
//      city, country, and camera name.
//   3. Cache everything for INSECAM_CACHE_TTL_MS to avoid hammering the site.
//
// Note: Insecam lists cameras whose owners have NOT set a password.
// The site itself states it only lists cameras after privacy filtering.
// We strip any `COUNTER` query-param token from feed URLs so the image
// loads directly without it.
// ─────────────────────────────────────────────────────────────────────────────

const BASE = '/proxy/insecam';

const INSECAM_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/** Country codes to scrape in addition to /byrating/ */
const COUNTRY_CODES = [
  'US', 'JP', 'DE', 'FR', 'GB', 'AU', 'CA', 'KR', 'TW', 'NL',
  'ES', 'IT', 'PL', 'RU', 'BR', 'IN', 'TH', 'SG',
];

/** Max cameras to resolve per scrape run (detail-page fetches are expensive) */
const MAX_CAMERAS = 120;

const INSECAM_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  Referer: 'http://www.insecam.org/en/',
};

// ── Simple HTML helpers (no DOM parser available server-side) ──────────────

/** Extract all regex matches, returning the first capture group */
function matchAll(html: string, re: RegExp): string[] {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  while ((m = g.exec(html)) !== null) out.push(m[1]);
  return out;
}

function first(html: string, re: RegExp): string | null {
  const m = re.exec(html);
  return m ? m[1] : null;
}

/** Strip the `?…COUNTER` or `&COUNTER` suffix Insecam appends to feed URLs */
function cleanFeedUrl(raw: string): string {
  return raw
    .replace(/[?&]COUNTER$/, '')
    .replace(/[?&]rand=COUNTER$/, '')
    .replace(/[?&]r=COUNTER$/, '')
    .trim();
}

// ── Step 1: scrape listing pages for { id, feed_url } ──────────────────────

interface InsecamListing {
  id: string;
  feed_url: string;
}

async function scrapeListingPage(url: string): Promise<InsecamListing[]> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(12000),
      headers: INSECAM_HEADERS,
    });
    if (!res.ok) return [];
    const html = await res.text();

    // Each camera block looks like:
    //   <a href="/en/view/521291/" ...>
    //     <img src="http://202.245.13.81:80/cgi-bin/camera?...COUNTER" ...>
    //   </a>
    //
    // We capture pairs by finding all <a href="/en/view/ID/"> blocks,
    // then grabbing the first <img src="..."> inside each.

    const listings: InsecamListing[] = [];

    // Split on camera anchor tags
    const blocks = html.split(/<a\s+href="\/en\/view\/(\d+)\/"/i);
    // blocks[0] = preamble, then alternating: id, block-content, id, block-content…
    for (let i = 1; i < blocks.length - 1; i += 2) {
      const id = blocks[i];
      const content = blocks[i + 1];
      // grab the img src inside this block (before the next </a>)
      const snippet = content.split('</a>')[0];
      const imgSrc = first(snippet, /<img[^>]+src="([^"]+)"/i);
      if (!imgSrc) continue;
      const feed_url = cleanFeedUrl(imgSrc);
      if (!feed_url.startsWith('http')) continue;
      listings.push({ id, feed_url });
    }

    return listings;
  } catch {
    return [];
  }
}

// ── Step 2: scrape detail page for lat/lng/city/country/name ───────────────

interface InsecamDetail {
  lat: number;
  lng: number;
  name: string;
  city: string;
  country: string;
}

async function scrapeDetailPage(id: string): Promise<InsecamDetail | null> {
  try {
    const res = await fetch(`${BASE}/en/view/${id}/`, {
      signal: AbortSignal.timeout(8000),
      headers: INSECAM_HEADERS,
    });
    if (!res.ok) return null;
    const html = await res.text();

    // lat/lng appear as JavaScript variables or meta tags:
    //   var lat = 35.6762; var lng = 139.6503;
    //   or: "latitude":35.6762,"longitude":139.6503
    const lat =
      parseFloat(first(html, /var\s+lat\s*=\s*([-\d.]+)/i) || '') ||
      parseFloat(first(html, /"latitude"\s*:\s*([-\d.]+)/i) || '') ||
      NaN;
    const lng =
      parseFloat(first(html, /var\s+lng\s*=\s*([-\d.]+)/i) || '') ||
      parseFloat(first(html, /"longitude"\s*:\s*([-\d.]+)/i) || '') ||
      NaN;

    if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return null;

    // Title: "Live camera in CITY, COUNTRY"
    const titleRaw =
      first(html, /<title>([^<]+)<\/title>/i) ||
      first(html, /Live camera in ([^<"]+)/i) ||
      '';

    let city = 'Unknown';
    let country = 'Unknown';
    const m = /Live camera in ([^,]+),\s*(.+?)(\s*[-–]|\s*\||\s*$)/.exec(titleRaw);
    if (m) {
      city = m[1].trim();
      country = m[2].trim();
    }

    // Camera name: manufacturer + location text from h1/h2
    const h1 = first(html, /<h[12][^>]*>([^<]+)<\/h[12]>/i) || `Camera ${id}`;
    const name = h1.replace(/live camera(s)?\s*(in)?\s*/i, '').trim() || `Insecam #${id}`;

    return { lat, lng, name: name || `Insecam #${id}`, city, country };
  } catch {
    return null;
  }
}

// ── Orchestration ───────────────────────────────────────────────────────────

let cachedCameras: CctvCamera[] | null = null;
let cacheExpiresAt = 0;
let pendingFetch: Promise<CctvCamera[]> | null = null;

async function fetchFreshInsecamCameras(): Promise<CctvCamera[]> {
  // 1. Collect listing pages
  const listingUrls = [
    `${BASE}/en/byrating/`,
    ...COUNTRY_CODES.map((cc) => `${BASE}/en/bycountry/${cc}/`),
  ];

  const listingResults = await Promise.allSettled(
    listingUrls.map((url) => scrapeListingPage(url))
  );

  // Deduplicate by camera ID
  const seen = new Set<string>();
  const listings: InsecamListing[] = [];
  for (const r of listingResults) {
    if (r.status !== 'fulfilled') continue;
    for (const item of r.value) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      listings.push(item);
      if (listings.length >= MAX_CAMERAS) break;
    }
    if (listings.length >= MAX_CAMERAS) break;
  }

  if (listings.length === 0) return [];

  // 2. Resolve detail pages in parallel (bounded concurrency: 10 at a time)
  const cameras: CctvCamera[] = [];
  const CHUNK = 10;

  for (let i = 0; i < listings.length; i += CHUNK) {
    const chunk = listings.slice(i, i + CHUNK);
    const settled = await Promise.allSettled(
      chunk.map(async ({ id, feed_url }) => {
        const detail = await scrapeDetailPage(id);
        if (!detail) return null;
        return {
          id: `insecam-${id}`,
          lat: detail.lat,
          lng: detail.lng,
          name: detail.name,
          city: detail.city,
          country: detail.country,
          feed_url,
          external_url: `${BASE}/en/view/${id}/`,
          source: 'Insecam',
        } satisfies CctvCamera;
      })
    );
    for (const r of settled) {
      if (r.status === 'fulfilled' && r.value) cameras.push(r.value);
    }
  }

  return cameras;
}

export async function fetchInsecamCameras(): Promise<CctvCamera[]> {
  const now = Date.now();
  if (cachedCameras && now < cacheExpiresAt) return cachedCameras;

  if (!pendingFetch) {
    pendingFetch = fetchFreshInsecamCameras()
      .then((cameras) => {
        if (cameras.length > 0) {
          cachedCameras = cameras;
          cacheExpiresAt = Date.now() + INSECAM_CACHE_TTL_MS;
        }
        return cachedCameras ?? cameras;
      })
      .finally(() => {
        pendingFetch = null;
      });
  }

  return pendingFetch;
}
