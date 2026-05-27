import { NextResponse } from 'next/server';

/**
 * Generic Image Proxy — Balkans / Eastern Europe / Windy Snapshots
 *
 * Covers hosts that block direct browser requests via CORS or Referer checks:
 *   - stream.uzivobeograd.rs   (Serbia — Belgrade live cam)
 *   - home-solutions.bg        (Romania — Bucharest cam)
 *   - meteo.chavo.biz          (Bulgaria — Banishora cam)
 *   - images-webcams.windy.com (Windy snapshot CDN — Turkey, Greece, etc.)
 *
 * Usage: /api/cctv/balkans-snapshot?url={encoded-image-url}
 *
 * Security:
 *   - ALLOWED_HOSTS strict allowlist (SSRF guard)
 *   - https/http only (no file:// or other schemes)
 *   - URL decoded and re-validated before fetch
 */

const ALLOWED_HOSTS = new Set([
  // Serbia
  'stream.uzivobeograd.rs',
  // Romania
  'home-solutions.bg',
  // Bulgaria
  'meteo.chavo.biz',
  // Windy webcam snapshot CDN (Turkey, Greece, others)
  'images-webcams.windy.com',
  // ASFINAG Austria webcam images
  'webcam.asfinag.at',
  'www.asfinag.at',
]);

/** Per-host Referer so upstream servers accept the request */
const HOST_REFERER: Record<string, string> = {
  'stream.uzivobeograd.rs':   'https://uzivobeograd.rs/',
  'home-solutions.bg':        'https://home-solutions.bg/',
  'meteo.chavo.biz':          'https://meteo.chavo.biz/',
  'images-webcams.windy.com': 'https://www.windy.com/',
  'webcam.asfinag.at':        'https://www.asfinag.at/',
  'www.asfinag.at':           'https://www.asfinag.at/',
};

/** Per-host cache TTL in seconds */
const HOST_CACHE_TTL: Record<string, number> = {
  'stream.uzivobeograd.rs':   30,   // refreshes ~every 30s
  'home-solutions.bg':        60,
  'meteo.chavo.biz':          60,
  'images-webcams.windy.com': 300,  // Windy snapshots update every ~5 min
  'webcam.asfinag.at':        60,
  'www.asfinag.at':           60,
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url');

  if (!rawUrl) {
    return new NextResponse('Missing url param', { status: 400 });
  }

  // Validate URL shape and extract host (SSRF guard)
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return new NextResponse('Invalid url param', { status: 400 });
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return new NextResponse('Invalid scheme', { status: 400 });
  }
  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    return new NextResponse(`Host not allowed: ${parsed.hostname}`, { status: 403 });
  }

  const referer = HOST_REFERER[parsed.hostname] ?? `https://${parsed.hostname}/`;
  const cacheTtl = HOST_CACHE_TTL[parsed.hostname] ?? 60;

  try {
    const upstream = await fetch(rawUrl, {
      signal: AbortSignal.timeout(10000),
      headers: {
        Referer:      referer,
        Origin:       referer.replace(/\/$/, ''),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
        Accept:       'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });

    if (!upstream.ok) {
      return new NextResponse(`Upstream returned ${upstream.status}`, {
        status: upstream.status === 404 ? 404 : 502,
      });
    }

    const contentType = upstream.headers.get('content-type') ?? 'image/jpeg';
    if (!contentType.startsWith('image/')) {
      return new NextResponse('Upstream returned non-image content', { status: 502 });
    }

    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':                contentType,
        'Cache-Control':               `public, max-age=${cacheTtl}, stale-while-revalidate=${cacheTtl * 2}`,
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return new NextResponse('Image fetch failed', { status: 502 });
  }
}
