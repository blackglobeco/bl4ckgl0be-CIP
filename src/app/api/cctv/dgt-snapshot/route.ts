import { NextResponse } from 'next/server';

/**
 * DGT Spain Camera Image Proxy
 *
 * infocar.dgt.es (Spain's Directorate-General of Traffic) blocks direct
 * browser image requests with CORS + Referer enforcement.
 * This proxy fetches the image server-side and forwards it to the browser.
 *
 * Usage: /api/cctv/dgt-snapshot?id={camera-id}
 * Example: /api/cctv/dgt-snapshot?id=1001
 *
 * The camera ID must be a numeric integer (1–9999).
 * Image URL constructed as: https://infocar.dgt.es/etraffic/data/camaras/{id}.jpg
 *
 * Also supports Madrid City Hall KML image URLs via ?url={encoded-url}
 * (host: informo.munimadrid.es or similar municipio hosts)
 *
 * Security:
 *   - ALLOWED_HOSTS allowlist (SSRF guard)
 *   - Camera ID validated as numeric (injection guard)
 */

const DGT_HOST = 'infocar.dgt.es';
const DGT_BASE = 'https://infocar.dgt.es/etraffic/data/camaras';
const DGT_REFERER = 'https://infocar.dgt.es/etraffic/';

const MADRID_ALLOWED_HOSTS = new Set([
  'informo.munimadrid.es',
  'www.munimadrid.es',
  'datos.madrid.es',
  'trafico.munimadrid.es',
]);

/** Numeric camera ID — e.g. 1001, 1398 */
const CAM_ID_RE = /^\d{1,6}$/;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const rawUrl = searchParams.get('url');

  // ── Mode 1: DGT camera by numeric ID ──────────────────────────────────────
  if (id) {
    if (!CAM_ID_RE.test(id)) {
      return new NextResponse('Invalid id param — must be numeric', { status: 400 });
    }
    const imageUrl = `${DGT_BASE}/${id}.jpg`;
    return proxyImage(imageUrl, DGT_REFERER, 120);
  }

  // ── Mode 2: Madrid City Hall KML image via encoded URL ─────────────────────
  if (rawUrl) {
    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      return new NextResponse('Invalid url param', { status: 400 });
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return new NextResponse('Invalid scheme', { status: 400 });
    }
    if (!MADRID_ALLOWED_HOSTS.has(parsed.hostname)) {
      return new NextResponse(`Host not allowed: ${parsed.hostname}`, { status: 403 });
    }
    return proxyImage(rawUrl, 'https://datos.madrid.es/', 60);
  }

  return new NextResponse('Missing id or url param', { status: 400 });
}

async function proxyImage(
  imageUrl: string,
  referer: string,
  cacheTtl: number
): Promise<NextResponse> {
  try {
    const upstream = await fetch(imageUrl, {
      signal: AbortSignal.timeout(10000),
      headers: {
        Referer:      referer,
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
      return new NextResponse('Non-image response from upstream', { status: 502 });
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
