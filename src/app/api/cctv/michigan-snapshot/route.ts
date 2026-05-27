import { NextResponse } from 'next/server';

/**
 * Michigan DOT Camera Image Proxy
 *
 * Both image hosts used by MiDrive (micamerasimages.net and mdotjboss.state.mi.us)
 * block direct browser requests via CORS. This proxy fetches server-side and forwards.
 *
 * Usage: /api/cctv/michigan-snapshot?url={encoded-image-url}
 */

const ALLOWED_HOSTS = new Set([
  'micamerasimages.net',
  'mdotjboss.state.mi.us',
]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url');

  if (!rawUrl) {
    return new NextResponse('Missing url param', { status: 400 });
  }

  // Validate URL and host (SSRF guard)
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return new NextResponse('Invalid url param', { status: 400 });
  }

  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    return new NextResponse('Host not allowed', { status: 403 });
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return new NextResponse('Invalid scheme', { status: 400 });
  }

  try {
    const upstream = await fetch(rawUrl, {
      signal: AbortSignal.timeout(8000),
      headers: {
        Referer: `https://${parsed.hostname}/`,
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
        // Michigan DOT refreshes roughly every 2 minutes
        'Cache-Control': 'public, max-age=120, stale-while-revalidate=240',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return new NextResponse('Image fetch failed', { status: 502 });
  }
}
