import { NextResponse } from 'next/server';

/**
 * NYC DOT Camera Image Proxy
 *
 * webcams.nyctmc.org blocks direct browser requests via CORS and Referer checks.
 * This proxy fetches the image server-side and forwards it to the client,
 * exactly like the mbjb-snapshot proxy does for Malaysian MBJB cameras.
 *
 * Usage: /api/cctv/nyc-snapshot?cam={camera-uuid}
 * Example: /api/cctv/nyc-snapshot?cam=8ab7071d-63a6-492a-8443-e0d817bc1339
 */

const NYCTMC_BASE = 'https://webcams.nyctmc.org/api/cameras';
const ALLOWED_HOST = 'webcams.nyctmc.org';
const REFERER = 'https://webcams.nyctmc.org/';

// UUID v4 pattern — reject anything that doesn't look like a valid camera ID
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cam = searchParams.get('cam');

  if (!cam || !UUID_RE.test(cam)) {
    return new NextResponse('Invalid cam param — must be a valid UUID', { status: 400 });
  }

  const imageUrl = `${NYCTMC_BASE}/${cam}/image`;

  // Validate the host we're about to proxy (SSRF guard)
  try {
    const parsed = new URL(imageUrl);
    if (parsed.hostname !== ALLOWED_HOST) {
      return new NextResponse('Unexpected host', { status: 403 });
    }
  } catch {
    return new NextResponse('Bad image URL', { status: 502 });
  }

  try {
    const upstream = await fetch(imageUrl, {
      signal: AbortSignal.timeout(8000),
      headers: {
        Referer: REFERER,
        Origin: 'https://webcams.nyctmc.org',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });

    if (!upstream.ok) {
      return new NextResponse(`Upstream returned ${upstream.status}`, {
        status: upstream.status === 404 ? 404 : 502,
      });
    }

    const contentType = upstream.headers.get('content-type') ?? 'image/jpeg';
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // Cache for 30s — NYC DOT refreshes images every ~30s
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return new NextResponse('Image fetch failed', { status: 502 });
  }
}
